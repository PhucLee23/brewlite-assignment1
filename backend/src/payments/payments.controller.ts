import { Body, Controller, Get, Headers, HttpCode, Ip, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { parseIdempotencyKey } from '../common/idempotency';
import { ConfirmReturnDto, CreatePaymentDto, ListPaymentsQueryDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Mở phiên thanh toán ở cổng MoMo hoặc VNPay: trả về link sang trang thanh toán của cổng, đơn vẫn ở PENDING. */
  @Post()
  @UseGuards(JwtAuthGuard)
  pay(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') key: string | undefined,
    @Ip() ip: string,
  ) {
    return this.payments.pay(user.id, dto, parseIdempotencyKey(key, true), ipv4(ip));
  }

  /** Trang Doanh thu của nhân viên: tổng tiền đã vào và các giao dịch gần nhất. Chỉ đọc. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF')
  listAll(@Query() query: ListPaymentsQueryDto) {
    return this.payments.listAll(query.status);
  }

  /** IPN của MoMo (server gọi server, xác thực bằng chữ ký trong body). MoMo cần HTTP 204. */
  @Post('momo/ipn')
  @HttpCode(204)
  momoIpn(@Body() body: Record<string, unknown>) {
    return this.payments.momoIpn(body);
  }

  /** IPN của VNPay (server gọi server, xác thực bằng vnp_SecureHash). */
  @Get('vnpay/ipn')
  vnpayIpn(@Query() query: Record<string, unknown>) {
    return this.payments.vnpayIpn(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.payments.findMine(user.id, id);
  }

  /** Trang BrewLite gửi lên tham số cổng gắn vào link khi chuyển khách về. */
  @Post(':id/return')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  confirmReturn(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ConfirmReturnDto) {
    return this.payments.confirmReturn(user.id, id, dto.params);
  }

  /** Biên lai giao dịch: khách xem của mình, nhân viên xem tất cả. */
  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  receipt(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.payments.receipt(user, id);
  }
}

/** VNPay cần địa chỉ IPv4 của khách. */
function ipv4(ip: string) {
  const v4 = ip?.replace(/^::ffff:/, '');
  return /^\d+\.\d+\.\d+\.\d+$/.test(v4) ? v4 : '127.0.0.1';
}
