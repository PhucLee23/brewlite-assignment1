export type Size = "S" | "M" | "L";
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
