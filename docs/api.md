# Hợp đồng API BrewLite

Base URL: `http://localhost:4000`. Request/response dạng JSON. Lỗi trả về `{ "statusCode", "message", "error" }`, trong đó `message` là chuỗi hoặc mảng chuỗi (lỗi validate).

Route có 🔒 cần header `Authorization: Bearer <accessToken>`.

| Method | Path | Mô tả | Mã lỗi chính |
| --- | --- | --- | --- |
| GET | `/` | Kiểm tra sống: `{ "message": "Hello BrewLite" }` | |
| GET | `/products` | Danh sách menu; `stock` là số ly size S còn bán được, tính từ nguyên liệu | |
| GET | `/products/:id` | Chi tiết + `sizes` (kèm số ly còn theo size) + `toppings` (kèm số phần còn) | 404 |
| POST | `/auth/register` | Đăng ký, trả JWT | 400, 409 email trùng |
| POST | `/auth/login` | Đăng nhập, trả JWT | 401 |
| GET | `/auth/me` 🔒 | Thông tin + điểm thưởng | 401 |
| GET | `/promotions/:code?subtotal=` | Kiểm tra trước mã giảm giá | 400 |
| POST | `/orders` 🔒 | Tạo đơn `PENDING` (header `Idempotency-Key` tùy chọn) | 400, 401, 409 không đủ nguyên liệu |
| GET | `/orders/me` 🔒 | Lịch sử đơn, mới nhất trước | 401 |
| GET | `/orders/:id` 🔒 | Chi tiết đơn của chính mình | 404 |
| POST | `/orders/:id/cancel` 🔒 | Khách hủy đơn **chưa pha** (`PENDING`, `PAYMENT_FAILED`, `PAID`), trả lại nguyên liệu; đơn đã `PAID` bị thu hồi điểm thưởng và giao dịch thành `REFUND_DUE` | 409 sai trạng thái hoặc đang thanh toán |
| PATCH | `/orders/:id/status` 🔒 STAFF | Barista đổi trạng thái: chỉ `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`. Hủy đơn đã `PAID` thì trả nguyên liệu, thu hồi điểm thưởng và giao dịch thành `REFUND_DUE` | 400, 403, 409 |
| GET | `/ingredients` 🔒 STAFF | Trang Kho: tồn từng nguyên liệu và số ly còn bán được của từng món | 403 |
| POST | `/ingredients/:id/restock` 🔒 STAFF | Nhập thêm hàng vào kho `{ "amount": 2000 }` | 400, 403, 404 |

## Ví dụ

### POST /auth/register

```json
{ "email": "a@example.com", "password": "123456", "fullName": "Nguyễn Văn A" }
```

→ `201 { "accessToken": "eyJ...", "user": { "id": 3, "email": "a@example.com", "fullName": "Nguyễn Văn A", "role": "CUSTOMER", "loyaltyPoints": 0 } }`

### POST /orders

Giá luôn do server tính lại từ CSDL; client chỉ gửi id, size, topping và số lượng.

```http
Idempotency-Key: 6f1c2a8e-1b9d-4a55-9f0e-2c8d1e7b3a10
```

```json
{
  "items": [{ "productId": 3, "size": "M", "toppingIds": [2], "qty": 1 }],
  "promoCode": "BREW10"
}
```

→ `201` đơn ở trạng thái `PENDING`:

```json
{
  "id": 1042, "status": "PENDING", "subtotal": 57000, "discount": 5700, "total": 51300,
  "promotionCode": "BREW10", "createdAt": "2026-10-20T03:00:00.000Z",
  "items": [{ "productName": "Cappuccino", "size": "M", "toppings": ["Kem cheese"], "qty": 1, "unitPrice": 57000, "lineTotal": 57000 }]
}
```

Gửi lại cùng `Idempotency-Key` sẽ nhận lại đúng đơn cũ.

Không đủ nguyên liệu thì trả `409`, không trừ gì:

- Chỉ một dòng trong đơn dùng nguyên liệu bị thiếu: `"Cold brew" size M chỉ còn 4 ly`, hoặc `Đã hết nguyên liệu cho "Cà phê sữa đá" size M thêm trân châu`.
- Nhiều dòng dùng chung nguyên liệu bị thiếu: `Không đủ sữa tươi cho các món trong đơn, vui lòng giảm số lượng`.

### GET /ingredients (nhân viên)

→ `200`

```json
{
  "ingredients": [
    { "id": 5, "name": "Sữa tươi", "unit": "ml", "stock": 8000, "usedBy": ["Cappuccino", "Latte", "…"], "servings": 40 }
  ],
  "products": [
    { "id": 4, "name": "Latte", "stock": 40, "limitedBy": "Sữa tươi" }
  ]
}
```

- `servings`: nguyên liệu còn đủ cho bao nhiêu phần của món dùng nó nhiều nhất (`null` khi chưa món nào dùng). Trang *Kho* đánh dấu *Sắp hết* khi dưới 10, *Hết* khi bằng 0.
- `products[].stock`: số ly size S còn bán được; `limitedBy` là nguyên liệu hết trước.
- Chỉ tài khoản `STAFF` gọi được (khách → 403).

### POST /ingredients/:id/restock (nhân viên)

```json
{ "amount": 2000 }
```

→ `200 { "id": 5, "name": "Sữa tươi", "unit": "ml", "stock": 10000 }`

- `amount`: lượng nhập thêm theo đơn vị của nguyên liệu, số nguyên từ 1 đến 1.000.000 (sai → 400). Nguyên liệu không tồn tại → 404.
- Cộng thẳng vào tồn trong một câu `UPDATE` và tăng `version`, nên đơn đang trừ cùng nguyên liệu đó lúc ấy sẽ đọc lại tồn mới (optimistic locking), không ghi đè mất lượng vừa nhập.
- Số ly còn bán được của mọi món dùng nguyên liệu này tăng theo ngay. Trang *Kho* có ô *Nhập kho* ở từng nguyên liệu.

## Bảng giá

- Size: S + 0đ, M + 5.000đ, L + 10.000đ (cộng vào giá gốc).
- Topping: cộng thêm theo giá từng topping.
- Điểm thưởng: 1 điểm cho mỗi 1.000đ, chỉ cộng khi đơn sang `PAID`.

## Tồn kho theo nguyên liệu

- Mỗi món có **công thức**: lượng từng nguyên liệu cho 1 ly size S (bảng `ProductIngredient`). Size M dùng 125%, size L dùng 150% (làm tròn lên); riêng ly nhựa luôn 1 cái mỗi ly.
- Mỗi topping cũng có công thức riêng (bảng `ToppingIngredient`), không đổi theo size.
- Số ly còn bán được của một món = nhỏ nhất của (tồn nguyên liệu ÷ lượng cho 1 ly) qua các nguyên liệu của món. Các món dùng chung nguyên liệu ảnh hưởng lẫn nhau: bán Latte thì số ly Cappuccino cũng giảm (cùng dùng espresso và sữa tươi).
- Đặt đơn: cộng dồn nguyên liệu của cả đơn rồi trừ từng nguyên liệu trong một transaction, khóa theo `id` tăng dần bằng optimistic locking. Lượng đã trừ lưu ở bảng `OrderIngredient`.
- Hủy đơn (khách, nhân viên hoặc tự hủy khi quá hạn): trả lại đúng lượng đã lưu ở `OrderIngredient`.

## Máy trạng thái đơn hàng

```
PENDING → PAID → PREPARING → READY → COMPLETED
PENDING → PAYMENT_FAILED → PENDING (thử lại)
PENDING | PAYMENT_FAILED | PAID → CANCELLED
```

Mọi chuyển tiếp khác bị `assertTransition` chặn và trả 409.

Khách (`POST /orders/:id/cancel`) và nhân viên (`PATCH /orders/:id/status`) đều hủy được đơn `PENDING`, `PAYMENT_FAILED` hoặc `PAID`, tức là trước khi quầy bắt đầu pha. Hủy đơn đã `PAID` thì quầy hoàn tiền cho khách (giao dịch hiện `REFUND_DUE`). Từ `PREPARING` trở đi thì không ai hủy được (409).

Đơn `PENDING` hoặc `PAYMENT_FAILED` không được cập nhật trong 5 phút sẽ tự chuyển sang `CANCELLED` và trả nguyên liệu về kho (kiểm tra mỗi khi có đơn mới).
