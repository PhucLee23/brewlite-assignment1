import { newIdempotencyKey } from "@/lib/api";

const STORAGE_KEY = "brewlite-order-key";

/**
 * Idempotency-Key cho POST /orders, gắn với nội dung giỏ hàng.
 * Lưu trong sessionStorage để khi khách sang trang thanh toán của cổng rồi bấm Back quay lại,
 * bấm thanh toán lần nữa vẫn dùng đúng đơn cũ, không tạo đơn thứ hai.
 */
export function orderKeyFor(cartSignature: string): string {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved?.signature === cartSignature) return saved.key;
    const key = newIdempotencyKey();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ signature: cartSignature, key }));
    return key;
  } catch {
    return newIdempotencyKey();
  }
}

/** Đơn đã thanh toán xong: lần đặt sau (kể cả cùng món) phải là đơn mới. */
export function forgetOrderKey() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Trình duyệt chặn sessionStorage: không có gì để xóa
  }
}
