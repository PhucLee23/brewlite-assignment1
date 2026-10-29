import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * Các chuyển tiếp hợp lệ (mục 9.1 của đề):
 * PENDING → PAID → PREPARING → READY → COMPLETED
 * PENDING ⇄ PAYMENT_FAILED (thanh toán lỗi / thử lại)
 * PENDING, PAYMENT_FAILED, PAID → CANCELLED
 * COMPLETED và CANCELLED là trạng thái kết thúc.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends ConflictException {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Không thể chuyển đơn từ ${from} sang ${to}`);
  }
}

/** Ném lỗi nếu chuyển tiếp không có mũi tên trong sơ đồ trạng thái. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}
