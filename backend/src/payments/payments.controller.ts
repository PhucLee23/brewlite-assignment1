import { Body, Controller, Get, Headers, HttpCode, Ip, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard } from '../auth/guards';
import { parseIdempotencyKey } from '../common/idempotency';
import { ConfirmReturnDto, CreatePaymentDto } from './payments.dto';
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
}

/** VNPay cần địa chỉ IPv4 của khách. */
function ipv4(ip: string) {
  const v4 = ip?.replace(/^::ffff:/, '');
  return /^\d+\.\d+\.\d+\.\d+$/.test(v4) ? v4 : '127.0.0.1';
}
