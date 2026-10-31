import { PaymentProvider } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';

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

