import { PaymentProvider } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  orderId!: number;

  @IsEnum(PaymentProvider, { message: 'Cổng thanh toán phải là MOMO hoặc VNPAY' })
  provider!: PaymentProvider;

  /** Địa chỉ BrewLite khách đang mở, để cổng chuyển khách về đúng chỗ (phải nằm trong FRONTEND_URL). */
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/[^/]+$/, { message: 'returnOrigin phải có dạng http(s)://tên-miền[:cổng]' })
  returnOrigin?: string;
}

/** Tham số cổng gắn vào link khi chuyển khách về BrewLite (có chữ ký của cổng). */
export class ConfirmReturnDto {
  @IsObject()
  params!: Record<string, string>;
}

/**
 * Trạng thái hiển thị trên trang Doanh thu: EXPIRED là phiên PROCESSING đã quá hạn,
 * REFUND_DUE là giao dịch SUCCESS của đơn đã bị hủy (tiền đã vào, phải hoàn cho khách).
 */
export const PAYMENT_STATES = ['SUCCESS', 'REFUND_DUE', 'FAILED', 'PROCESSING', 'EXPIRED'] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsIn(PAYMENT_STATES, { message: `Trạng thái lọc phải là ${PAYMENT_STATES.join(', ')}` })
  status?: PaymentState;
}
