export type Size = "S" | "M" | "L";
/** Cổng thanh toán bên thứ ba (môi trường sandbox). */
export type PaymentProvider = "MOMO" | "VNPAY";
export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  /** Số ly size S còn bán được, backend tính từ tồn kho nguyên liệu theo công thức. */
  stock: number;
}

export interface Topping {
  id: number;
  name: string;
  price: number;
  /** Số phần topping còn làm được. */
  stock: number;
}

export interface ProductDetail extends Product {
  /** Size lớn tốn nhiều nguyên liệu hơn nên mỗi size có số ly còn lại riêng. */
  sizes: { size: Size; surcharge: number; stock: number }[];
  toppings: Topping[];
}

/** Kết quả GET /ingredients (chỉ nhân viên). */
export interface InventoryReport {
  ingredients: {
    id: number;
    name: string;
    unit: string;
    stock: number;
    usedBy: string[];
    /** Đủ cho bao nhiêu phần của món tốn nguyên liệu này nhất; null khi chưa món nào dùng. */
    servings: number | null;
  }[];
  products: { id: number; name: string; stock: number; limitedBy: string | null }[];
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "STAFF";
  loyaltyPoints: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  size: Size;
  toppings: string[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  promotionCode: string | null;
  createdAt: string;
  items: OrderItem[];
  /** Giao dịch đã thanh toán thành công (để mở biên lai). */
  payments: { id: number; provider: PaymentProvider | null }[];
}

/** Thông tin một giao dịch; mã giao dịch, ngân hàng chỉ có khi cổng đã xác nhận. */
export interface PaymentInfo {
  id: number;
  orderId: number;
  status: "PROCESSING" | "SUCCESS" | "FAILED";
  provider: PaymentProvider | null;
  amount: number;
  gatewayOrderId: string | null;
  gatewayRef: string | null;
  bankCode: string | null;
  payType: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

/** Kết quả POST /payments: phiên thanh toán ở cổng MoMo hoặc VNPay. Đơn chỉ sang PAID khi cổng xác nhận. */
export interface PaymentSession {
  replayed: boolean;
  payment: PaymentInfo;
  order: Order;
  expiresAt: string;
  /** Link sang trang thanh toán của cổng; null khi phiên đã kết thúc hoặc hết hạn. */
  paymentUrl: string | null;
}

/** Kết quả GET /payments/:id/receipt: bằng chứng giao dịch do cổng xác nhận. */
export interface Receipt {
  payment: PaymentInfo & { state: PaymentState };
  order: Order;
  customer: { fullName: string; email: string };
  /** Dữ liệu gốc cổng trả về (có chữ ký của cổng). */
  gatewayResult: Record<string, unknown> | null;
}

/**
 * Trạng thái giao dịch trên trang Doanh thu: EXPIRED là phiên khách bỏ dở quá hạn,
 * REFUND_DUE là tiền đã vào nhưng đơn bị hủy, quầy phải hoàn cho khách.
 */
export type PaymentState = "SUCCESS" | "REFUND_DUE" | "FAILED" | "PROCESSING" | "EXPIRED";

export type PromotionCheck =
  | { valid: true; code: string; percentOff: number; discount: number }
  | { valid: false; reason: string };
