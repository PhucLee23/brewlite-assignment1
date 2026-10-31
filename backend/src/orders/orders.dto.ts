import { OrderStatus, Size } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsEnum(Size, { message: 'Size phải là S, M hoặc L' })
  size!: Size;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsInt({ each: true })
  toppingIds: number[] = [];

  @IsInt()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(20, { message: 'Số lượng tối đa là 20' })
  qty!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Giỏ hàng trống' })
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  promoCode?: string;
}

/** Nhân viên quầy chỉ đẩy đơn qua các bước pha chế; PAID và PAYMENT_FAILED chỉ do POST /payments đặt. */
export const STAFF_SETTABLE_STATUSES = ['PREPARING', 'READY', 'COMPLETED'] as const satisfies readonly OrderStatus[];

export class UpdateOrderStatusDto {
  @IsIn(STAFF_SETTABLE_STATUSES, { message: `Trạng thái phải là ${STAFF_SETTABLE_STATUSES.join(', ')}` })
  status!: (typeof STAFF_SETTABLE_STATUSES)[number];
}
