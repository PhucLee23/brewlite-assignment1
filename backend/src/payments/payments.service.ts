import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Order, Payment, PaymentProvider, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertTransition } from '../orders/order-state-machine';
import { ORDER_INCLUDE, transitionOrder } from '../orders/orders.service';
import { isUniqueViolation, PrismaService } from '../prisma/prisma.service';
import { GatewayError, GatewayHttp, GatewayResult, PaymentGateway } from './gateways/gateway';
import { VnpayGateway } from './gateways/vnpay';
import { expireStalePaymentSessions, isSessionExpired, sessionExpiresAt } from './payment-session';
import { CreatePaymentDto } from './payments.dto';

const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };
/** Trang chờ thanh toán hỏi mỗi 1,5 giây, nhưng backend chỉ tra cứu cổng tối đa mỗi chừng này một lần. */
const GATEWAY_CHECK_INTERVAL_MS = 4_000;

export const PROVIDER_NAME: Record<PaymentProvider, string> = { MOMO: 'MoMo', VNPAY: 'VNPay' };

@Injectable()
export class PaymentsService {
  // Cổng nào chưa tích hợp thì chưa có trong danh sách
  private readonly gateways: Partial<Record<PaymentProvider, PaymentGateway>>;
  private readonly lastChecked = new Map<number, number>();

  constructor(
    private readonly prisma: PrismaService,
    http: GatewayHttp,
  ) {
    this.gateways = { VNPAY: new VnpayGateway(http) };
  }

  /**
   * Mở phiên thanh toán ở cổng MoMo hoặc VNPay (bên thứ ba):
   * 1. Giữ chỗ Idempotency-Key bằng một bản ghi Payment PROCESSING (UNIQUE).
   * 2. Gọi cổng tạo giao dịch, trả về link trang thanh toán của cổng.
   * Đơn vẫn ở PENDING. Chỉ kết quả cổng xác nhận (có chữ ký) mới đặt PAID hoặc PAYMENT_FAILED.
   */
  async pay(userId: number, dto: CreatePaymentDto, idempotencyKey: string, clientIp: string) {
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } });
    if (existing) return this.replay(existing, userId, dto);

    let payment: Payment;
    try {
      payment = await this.reserve(userId, dto, idempotencyKey);
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const winner = await this.prisma.payment.findUniqueOrThrow({ where: { idempotencyKey } });
      return this.replay(winner, userId, dto);
    }
    const reused = payment.idempotencyKey !== idempotencyKey;
    if (!reused && !payment.payUrl) payment = await this.openAtGateway(payment, returnOrigin(dto.returnOrigin), clientIp);
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: ORDER_INCLUDE });
    return this.session(payment, order, reused);
  }

  /**
   * Trang chờ thanh toán hỏi trạng thái phiên. Phiên còn mở thì backend tự tra cứu cổng
   * (server gọi server), nên khách trả bằng app trên điện thoại thì trang trên máy tính vẫn biết kết quả.
   */
  async findMine(userId: number, paymentId: number) {
    let payment = await this.findOwned(userId, paymentId);
    const last = this.lastChecked.get(payment.id) ?? 0;
    if (payment.status === 'PROCESSING' && payment.payUrl && Date.now() - last >= GATEWAY_CHECK_INTERVAL_MS) {
      this.lastChecked.set(payment.id, Date.now());
      // Cổng chậm hoặc mất mạng thì giữ nguyên trạng thái, lần hỏi sau thử lại
      await this.refreshFromGateway(payment).catch(() => undefined);
      payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    }
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: ORDER_INCLUDE });
    return this.session(payment, order, false);
  }

  /**
   * Khách được cổng chuyển về BrewLite kèm kết quả có chữ ký. Kiểm tra chữ ký để chặn kết quả tự chế,
   * rồi hỏi lại cổng bằng API tra cứu; kết quả đã chốt thì mới cập nhật đơn.
   */
  async confirmReturn(userId: number, paymentId: number, params: Record<string, unknown>) {
    const payment = await this.findOwned(userId, paymentId);
    const gateway = this.gatewayOf(payment);
    const callback = gateway.parseCallback(params);
    if (!callback) throw new BadRequestException('Chữ ký kết quả thanh toán không hợp lệ');
    if (callback.gatewayOrderId !== payment.gatewayOrderId) throw new BadRequestException('Kết quả không thuộc giao dịch này');

    const queried = await gateway.query(payment.gatewayOrderId!, payment.createdAt).catch(() => null);
    const result = queried && queried.status !== 'PENDING' ? queried : callback;
    if (result.status !== 'PENDING') await this.settle(payment.id, result);
    this.lastChecked.set(payment.id, Date.now());
    return this.findMine(userId, paymentId);
  }

  /** IPN của VNPay: luôn trả HTTP 200 kèm RspCode theo tài liệu VNPay (01, 04, 97 thì VNPay gửi lại). */
  async vnpayIpn(query: Record<string, unknown>) {
    const result = this.gateways.VNPAY!.parseCallback(query);
    if (!result) return { RspCode: '97', Message: 'Invalid signature' };
    const payment = await this.prisma.payment.findUnique({ where: { gatewayOrderId: result.gatewayOrderId } });
    if (!payment) return { RspCode: '01', Message: 'Order not found' };
    if (payment.amount !== result.amount) return { RspCode: '04', Message: 'invalid amount' };
    const { duplicate } = await this.settle(payment.id, result);
    return duplicate ? { RspCode: '02', Message: 'Order already confirmed' } : { RspCode: '00', Message: 'Confirm Success' };
  }

  /**
   * Ghi kết quả cổng đã chốt. Cổng báo lặp (link quay về, IPN, tra cứu cùng lúc) chỉ được xử lý một lần.
   */
  private async settle(paymentId: number, result: GatewayResult) {
    const payment = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (result.amount !== payment.amount) throw new BadRequestException('Số tiền không khớp với giao dịch');

    return this.prisma.$transaction(async (tx) => {
      // Khóa đơn như khi hủy đơn, để xác nhận thanh toán và hủy đơn không chạy chồng nhau
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${payment.orderId} FOR UPDATE`;
      const current = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
      const success = result.status === 'SUCCESS';
      // BrewLite đã cho phiên hết hạn (FAILED, chưa có xác nhận) mà cổng vẫn báo đã trừ tiền: vẫn phải ghi nhận
      const lateSuccess = success && current.status === 'FAILED' && current.confirmedAt === null;
      if (current.status !== 'PROCESSING' && !lateSuccess) return { duplicate: true, status: current.status };

      await tx.payment.update({
        where: { id: current.id },
        data: {
          status: success ? 'SUCCESS' : 'FAILED',
          gatewayRef: result.transactionNo,
          bankCode: result.bankCode,
          payType: result.payType,
          gatewayResult: result.raw as Prisma.InputJsonValue,
          confirmedAt: new Date(),
        },
      });

      const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });
      if (!success) {
        if (order.status === 'PENDING') await transitionOrder(tx, order.id, 'PENDING', 'PAYMENT_FAILED');
        return { duplicate: false, status: 'FAILED' as const };
      }
      let status = order.status;
      if (status === 'PAYMENT_FAILED') {
        await transitionOrder(tx, order.id, 'PAYMENT_FAILED', 'PENDING');
        status = 'PENDING';
      }
      // shortcut: đơn đã hủy (hoặc đã trả bằng phiên khác) thì giữ nguyên; tiền hiện ở mục cần hoàn
      if (status === 'PENDING') {
        await transitionOrder(tx, order.id, 'PENDING', 'PAID');
      }
      return { duplicate: false, status: 'SUCCESS' as const };
    }, TX_OPTIONS);
  }

  private async refreshFromGateway(payment: Payment) {
    const result = await this.gatewayOf(payment).query(payment.gatewayOrderId!, payment.createdAt);
    if (result.status !== 'PENDING') await this.settle(payment.id, result);
  }

  private async openAtGateway(payment: Payment, origin: string, clientIp: string) {
    try {
      const payUrl = await this.gatewayOf(payment).createSession({
        gatewayOrderId: payment.gatewayOrderId!,
        amount: payment.amount,
        // VNPay chỉ nhận mô tả không dấu
        orderInfo:
          payment.provider === 'VNPAY'
            ? `Thanh toan don ${payment.orderId} BrewLite`
            : `Thanh toán đơn #${payment.orderId} BrewLite`,
        returnUrl: `${origin}/payments/${payment.id}`,
        createdAt: payment.createdAt,
        expiresAt: new Date(sessionExpiresAt(payment.createdAt)),
        clientIp,
      });
      return await this.prisma.payment.update({ where: { id: payment.id }, data: { payUrl } });
    } catch (err) {
      // Không mở được phiên ở cổng: bỏ bản ghi giữ chỗ để khách bấm thanh toán lại được ngay
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      if (err instanceof GatewayError) throw new BadGatewayException(err.message);
      throw err;
    }
  }

  private reserve(userId: number, dto: CreatePaymentDto, idempotencyKey: string) {
    return this.prisma.$transaction(async (tx) => {
      // Khóa dòng đơn hàng để hai yêu cầu thanh toán không mở hai phiên cho cùng một đơn
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${dto.orderId} FOR UPDATE`;
      const order = await tx.order.findFirst({ where: { id: dto.orderId, userId } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      await expireStalePaymentSessions(tx, order.id);
      // Khách quay lại bấm thanh toán khi phiên cũ còn hạn: dùng tiếp phiên đó, không mở phiên thứ hai
      const active = await tx.payment.findFirst({ where: { orderId: order.id, status: 'PROCESSING' } });
      if (active) {
        if (active.provider !== dto.provider) {
          const name = active.provider ? PROVIDER_NAME[active.provider] : 'cổng thanh toán';
          throw new ConflictException(
            `Đơn đang có phiên thanh toán ${name} chưa kết thúc. Tiếp tục trên ${name} hoặc bấm hủy giao dịch ở đó rồi chọn lại.`,
          );
        }
        return active;
      }

      // Thanh toán lại sau khi lỗi: PAYMENT_FAILED → PENDING trước
      if (order.status === 'PAYMENT_FAILED') {
        await transitionOrder(tx, order.id, 'PAYMENT_FAILED', 'PENDING');
      } else {
        assertTransition(order.status, 'PAID');
      }

      return tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey,
          amount: order.total,
          provider: dto.provider,
          status: 'PROCESSING',
          gatewayOrderId: newGatewayOrderId(),
        },
      });
    }, TX_OPTIONS);
  }

  private async replay(payment: Payment, userId: number, dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: payment.orderId }, include: ORDER_INCLUDE });
    if (!order || order.userId !== userId || payment.orderId !== dto.orderId) {
      throw new ConflictException('Idempotency-Key này đã được dùng cho một yêu cầu thanh toán khác');
    }
    return this.session(payment, order, true);
  }

  private async findOwned(userId: number, paymentId: number) {
    const payment = await this.prisma.payment.findFirst({ where: { id: paymentId, order: { userId } } });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch');
    return payment;
  }

  private gatewayOf(payment: Payment): PaymentGateway {
    const gateway = payment.provider && this.gateways[payment.provider];
    if (!gateway || !payment.gatewayOrderId) throw new BadRequestException('Cổng thanh toán này chưa được hỗ trợ');
    return gateway;
  }

  /** Link sang cổng chỉ có khi phiên còn PROCESSING và chưa hết hạn. */
  private session(payment: Payment, order: Order, replayed: boolean) {
    const open = payment.status === 'PROCESSING' && !isSessionExpired(payment.createdAt);
    const { idempotencyKey, payUrl, gatewayResult, ...info } = payment;
    return {
      replayed,
      payment: info,
      order,
      expiresAt: new Date(sessionExpiresAt(payment.createdAt)).toISOString(),
      paymentUrl: open ? payUrl : null,
    };
  }
}

/**
 * Mã đơn gửi sang cổng. Cả nhóm dùng chung tài khoản sandbox (khóa test MoMo còn dùng chung toàn Internet)
 * mà CSDL mỗi máy đều đánh số đơn từ 1, nên không gửi số đơn mà gửi mã ngẫu nhiên kèm thời gian.
 */
function newGatewayOrderId() {
  return `BL${Date.now().toString(36).toUpperCase()}${randomBytes(4).toString('hex').toUpperCase()}`;
}

/** Cổng chuyển khách về đúng địa chỉ khách đang mở (localhost hoặc IP hotspot), miễn là nằm trong FRONTEND_URL. */
function returnOrigin(requested?: string) {
  const allowed = (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(',').map((s) => s.trim());
  return requested && allowed.includes(requested) ? requested : allowed[0];
}
