import type { OrderStatus } from "./types";

export function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng lấy",
  COMPLETED: "Hoàn tất",
  PAYMENT_FAILED: "Thanh toán lỗi",
  CANCELLED: "Đã hủy",
};
