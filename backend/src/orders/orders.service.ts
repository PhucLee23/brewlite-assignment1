import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { cupNeeds, RECIPE_SELECT } from '../ingredients/inventory';
import { expireStalePaymentSessions } from '../payments/payment-session';
import { isUniqueViolation, PrismaService } from '../prisma/prisma.service';
import { assertTransition } from './order-state-machine';
import { COUNTER_QUEUE, COUNTER_STATUSES, CounterStatus, CreateOrderDto } from './orders.dto';
import { evaluatePromotion, loyaltyPointsFor, unitPrice } from './pricing';

export const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

/** Số lần thử lại khi optimistic lock bị tranh chấp. Mỗi lần thất bại nghĩa là một giao dịch khác đã thành công. */
const STOCK_LOCK_RETRIES = 20;
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

/** Đơn chưa thanh toán quá thời gian này sẽ tự hủy để trả nguyên liệu về kho. */
export const UNPAID_ORDER_TTL_MS = 5 * 60_000;
/** Màn hình quầy chỉ hiện chừng này đơn mỗi nhóm; số đếm vẫn tính trên toàn bộ. */
const COUNTER_PAGE_SIZE = 100;

type Tx = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto, idempotencyKey?: string) {
    // Khóa được gắn với user để hai người dùng không đụng key của nhau
    const scopedKey = idempotencyKey ? `${userId}:${idempotencyKey}` : null;
    if (scopedKey) {
      const existing = await this.findByKey(scopedKey);
      if (existing) return existing;
    }

    await this.releaseExpiredOrders();

    const { lines, cups } = await this.priceItems(dto);
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const { discount, promotionCode } = await this.applyPromotion(dto.promoCode, subtotal);

    // Cộng dồn nguyên liệu cả đơn: hai món dùng chung một nguyên liệu thì trừ chung một lần
    const needByIngredient = new Map<number, number>();
    for (const cup of cups) {
      for (const [id, amount] of cup.perCup) needByIngredient.set(id, (needByIngredient.get(id) ?? 0) + amount * cup.qty);
    }
    // Luôn khóa nguyên liệu theo id tăng dần để hai đơn dùng chung nguyên liệu không deadlock
    const ingredientIds = [...needByIngredient.keys()].sort((a, b) => a - b);

    try {
      return await this.prisma.$transaction(async (tx) => {
        for (const id of ingredientIds) await this.reserveIngredient(tx, id, needByIngredient.get(id)!, cups);
        return tx.order.create({
          data: {
            userId,
            status: 'PENDING',
            subtotal,
            discount,
            total: subtotal - discount,
            promotionCode,
            idempotencyKey: scopedKey,
            items: { create: lines },
            ingredients: { create: ingredientIds.map((id) => ({ ingredientId: id, amount: needByIngredient.get(id)! })) },
          },
          include: ORDER_INCLUDE,
        });
      }, TX_OPTIONS);
    } catch (err) {
      // Hai request cùng key chạy song song: request về sau bị UNIQUE chặn, trả lại đơn đã tạo
      if (scopedKey && isUniqueViolation(err)) {
        const existing = await this.findByKey(scopedKey);
        if (existing) return existing;
      }
      throw err;
    }
  }

  listMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  async findMine(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  async cancel(userId: number, id: number) {
    await this.findMine(userId, id);
    return this.changeStatus(id, 'CANCELLED');
  }

  /** Màn hình quầy: đơn đang chờ xử lý xếp cũ trước (ai trả tiền trước được pha trước), các nhóm khác mới trước. */
  async listForCounter(status: CounterStatus) {
    const [grouped, orders] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], where: { status: { in: [...COUNTER_STATUSES] } }, _count: true }),
      this.prisma.order.findMany({
        where: { status },
        orderBy: { createdAt: COUNTER_QUEUE.includes(status) ? 'asc' : 'desc' },
        take: COUNTER_PAGE_SIZE,
        include: { ...ORDER_INCLUDE, user: { select: { fullName: true } } },
      }),
    ]);
    const counts = Object.fromEntries(COUNTER_STATUSES.map((s) => [s, 0])) as Record<CounterStatus, number>;
    for (const g of grouped) counts[g.status as CounterStatus] = g._count;
    return { counts, orders };
  }

  /**
   * Dùng cho nhân viên quầy (PAID → PREPARING → READY → COMPLETED) và khi hủy đơn.
   * Khách và nhân viên đều hủy được đơn chưa pha; từ PREPARING trở đi assertTransition chặn.
   */
  changeStatus(id: number, to: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      // Khóa dòng đơn hàng; PaymentsService cũng khóa dòng này nên hủy đơn và thanh toán không chạy chồng nhau
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      if (to === 'CANCELLED') {
        // Phiên thanh toán khách bỏ dở quá hạn thì không còn chặn hủy đơn
        await expireStalePaymentSessions(tx, id);
        const inFlight = await tx.payment.count({ where: { orderId: id, status: 'PROCESSING' } });
        if (inFlight > 0) throw new ConflictException('Đơn hàng đang được thanh toán, vui lòng đợi');
      }
      await transitionOrder(tx, id, order.status, to);
      if (to === 'CANCELLED') {
        // Trả lại đúng lượng nguyên liệu đã trừ lúc đặt, cùng thứ tự id tăng dần như lúc trừ
        const used = await tx.orderIngredient.findMany({ where: { orderId: id }, orderBy: { ingredientId: 'asc' } });
        for (const u of used) {
          await tx.ingredient.update({
            where: { id: u.ingredientId },
            data: { stock: { increment: u.amount }, version: { increment: 1 } },
          });
        }
        // Đơn đã PAID thì thu hồi điểm thưởng đã cộng lúc thanh toán
        if (order.status === 'PAID') {
          await tx.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { decrement: loyaltyPointsFor(order.total) } },
          });
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE });
    }, TX_OPTIONS);
  }

  /** Tự hủy các đơn chưa thanh toán quá hạn để chúng không giữ hàng trong kho mãi. */
  private async releaseExpiredOrders() {
    const expired = await this.prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'PAYMENT_FAILED'] },
        updatedAt: { lt: new Date(Date.now() - UNPAID_ORDER_TTL_MS) },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 20,
    });
    for (const { id } of expired) {
      // Đơn đang thanh toán hoặc vừa bị request khác hủy sẽ ném lỗi: bỏ qua, lần sau xử lý tiếp
      await this.changeStatus(id, 'CANCELLED').catch(() => undefined);
    }
  }

  private findByKey(idempotencyKey: string) {
    return this.prisma.order.findUnique({ where: { idempotencyKey }, include: ORDER_INCLUDE });
  }

  /** Giá luôn do server tính, không tin giá từ client. Kèm nguyên liệu cho 1 ly của từng dòng. */
  private async priceItems(dto: CreateOrderDto) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const toppingIds = [...new Set(dto.items.flatMap((i) => i.toppingIds ?? []))];
    const [products, toppings] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds } }, include: { recipe: RECIPE_SELECT } }),
      this.prisma.topping.findMany({ where: { id: { in: toppingIds } }, include: { recipe: RECIPE_SELECT } }),
    ]);
    const productById = new Map(products.map((p) => [p.id, p]));
    const toppingById = new Map(toppings.map((t) => [t.id, t]));

    const cups: CupUsage[] = [];
    const lines = dto.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new BadRequestException(`Sản phẩm #${item.productId} không tồn tại`);
      if (product.recipe.length === 0) throw new ConflictException(`"${product.name}" tạm hết hàng`);
      const chosen = [...new Set(item.toppingIds ?? [])].map((id) => {
        const topping = toppingById.get(id);
        if (!topping) throw new BadRequestException(`Topping #${id} không tồn tại`);
        return topping;
      });
      const price = unitPrice(product.price, item.size, chosen.map((t) => t.price));
      const extras = chosen.length ? ` thêm ${chosen.map((t) => t.name.toLowerCase()).join(', ')}` : '';
      cups.push({
        label: `"${product.name}" size ${item.size}${extras}`,
        qty: item.qty,
        perCup: cupNeeds(product.recipe, item.size, chosen.map((t) => t.recipe)),
      });
      return {
        productId: product.id,
        productName: product.name,
        size: item.size,
        toppings: chosen.map((t) => t.name),
        qty: item.qty,
        unitPrice: price,
        lineTotal: price * item.qty,
      };
    });
    return { lines, cups };
  }

  private async applyPromotion(code: string | undefined, subtotal: number) {
    const trimmed = code?.trim().toUpperCase();
    if (!trimmed) return { discount: 0, promotionCode: null };
    const promo = await this.prisma.promotion.findUnique({ where: { code: trimmed } });
    const result = evaluatePromotion(promo, subtotal);
    if (!result.ok) throw new BadRequestException(result.reason);
    return { discount: result.discount, promotionCode: trimmed };
  }

  /**
   * Trừ nguyên liệu bằng optimistic locking: chỉ cập nhật khi `version` chưa đổi kể từ lúc đọc.
   * Nếu một giao dịch khác vừa cập nhật, đọc lại và thử lại; không đủ nguyên liệu thì báo lỗi ngay.
   */
  private async reserveIngredient(tx: Tx, ingredientId: number, amount: number, cups: CupUsage[]) {
    for (let attempt = 0; attempt < STOCK_LOCK_RETRIES; attempt++) {
      const ingredient = await tx.ingredient.findUniqueOrThrow({
        where: { id: ingredientId },
        select: { name: true, stock: true, version: true },
      });
      if (ingredient.stock < amount) throw new ConflictException(shortageMessage(ingredientId, ingredient, cups));
      const { count } = await tx.ingredient.updateMany({
        where: { id: ingredientId, version: ingredient.version },
        data: { stock: { decrement: amount }, version: { increment: 1 } },
      });
      if (count === 1) return;
    }
    throw new ConflictException('Có nhiều người đặt cùng lúc, vui lòng thử lại');
  }
}

/** Một dòng của đơn: nguyên liệu cho 1 ly và số ly đặt. */
interface CupUsage {
  label: string;
  qty: number;
  perCup: Map<number, number>;
}

/** Chỉ một dòng dùng nguyên liệu bị thiếu thì báo số ly còn làm được; nhiều dòng dùng chung thì nêu tên nguyên liệu. */
function shortageMessage(ingredientId: number, ingredient: { name: string; stock: number }, cups: CupUsage[]) {
  const users = cups.filter((c) => c.perCup.has(ingredientId));
  if (users.length === 1) {
    const left = Math.floor(ingredient.stock / users[0].perCup.get(ingredientId)!);
    return left === 0 ? `Đã hết nguyên liệu cho ${users[0].label}` : `${users[0].label} chỉ còn ${left} ly`;
  }
  return `Không đủ ${ingredient.name.toLowerCase()} cho các món trong đơn, vui lòng giảm số lượng`;
}

/**
 * Chuyển trạng thái có kiểm tra state machine; điều kiện `status: from` trong WHERE
 * đảm bảo không ghi đè nếu một request khác vừa đổi trạng thái đơn.
 */
export async function transitionOrder(tx: Tx, orderId: number, from: OrderStatus, to: OrderStatus) {
  assertTransition(from, to);
  const { count } = await tx.order.updateMany({ where: { id: orderId, status: from }, data: { status: to } });
  if (count !== 1) throw new ConflictException('Đơn hàng vừa được cập nhật bởi một yêu cầu khác');
}
