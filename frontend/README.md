# BrewLite – Frontend (Next.js)

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL trỏ tới backend
npm ci
npm run dev                  # http://localhost:3000
```

| Trang | Đường dẫn |
| --- | --- |
| Menu | `/` |
| Chi tiết, chọn size/topping | `/products/[id]` |
| Giỏ hàng | `/cart` |
| Thanh toán | `/checkout` (cần đăng nhập) |
| Xác nhận đơn | `/orders/[id]` |
| Lịch sử đơn | `/orders` |
| Đăng nhập / Đăng ký | `/login`, `/register` |

Giỏ hàng và phiên đăng nhập được lưu bằng Zustand (persist vào localStorage). Hướng dẫn chung của dự án xem [README gốc](../README.md).
