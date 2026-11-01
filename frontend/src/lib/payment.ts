import { api, newIdempotencyKey } from "@/lib/api";
import type { PaymentProvider, PaymentSession } from "@/lib/types";

/**
 * Mở phiên ở cổng rồi chuyển khách sang trang thanh toán của MoMo hoặc VNPay.
 * Thanh toán xong, cổng chuyển khách về /payments/:id kèm kết quả có chữ ký.
 */
export async function startPayment(token: string | null, orderId: number, provider: PaymentProvider) {
  const session = await api<PaymentSession>("/payments", {
    method: "POST",
    token,
    idempotencyKey: newIdempotencyKey(),
    // Cổng chuyển khách về đúng địa chỉ đang mở (localhost hoặc IP khi dùng điện thoại)
    body: { orderId, provider, returnOrigin: window.location.origin },
  });
  window.location.assign(session.paymentUrl ?? `/payments/${session.payment.id}`);
}
