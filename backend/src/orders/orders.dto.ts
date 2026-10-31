import { OrderStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

/** Nhân viên quầy chỉ đẩy đơn qua các bước pha chế; PAID và PAYMENT_FAILED chỉ do POST /payments đặt. */
export const STAFF_SETTABLE_STATUSES = ['PREPARING', 'READY', 'COMPLETED'] as const satisfies readonly OrderStatus[];

export class UpdateOrderStatusDto {
  @IsIn(STAFF_SETTABLE_STATUSES, { message: `Trạng thái phải là ${STAFF_SETTABLE_STATUSES.join(', ')}` })
  status!: (typeof STAFF_SETTABLE_STATUSES)[number];
}
