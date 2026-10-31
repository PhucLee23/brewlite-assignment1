import { Prisma } from '@prisma/client';

/** Phiên thanh toán ở cổng hết hạn sau thời gian này; quá hạn thì không còn chặn việc hủy đơn. */
export const PAYMENT_SESSION_TTL_MS = 5 * 60_000;

export function sessionExpiresAt(createdAt: Date): number {
  return createdAt.getTime() + PAYMENT_SESSION_TTL_MS;
}

export function isSessionExpired(createdAt: Date, now = Date.now()): boolean {
  return now >= sessionExpiresAt(createdAt);
}

/**
 * Khách bỏ dở ở trang cổng quá hạn: đánh dấu FAILED (confirmedAt vẫn null) để phiên đó không chặn đơn mãi.
 * Nếu sau đó cổng vẫn báo thành công thì PaymentsService ghi nhận tiền và đưa giao dịch vào mục cần hoàn tiền.
 */
export function expireStalePaymentSessions(tx: Prisma.TransactionClient, orderId: number) {
  return tx.payment.updateMany({
    where: { orderId, status: 'PROCESSING', createdAt: { lte: new Date(Date.now() - PAYMENT_SESSION_TTL_MS) } },
    data: { status: 'FAILED' },
  });
}
