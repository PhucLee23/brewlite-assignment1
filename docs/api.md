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
| GET | `/orders` 🔒 STAFF | Màn hình quầy: đơn theo nhóm `?status=PAID\|PREPARING\|READY\|COMPLETED\|CANCELLED` (mặc định `PAID`) kèm số đơn mỗi nhóm | 400, 403 |
| GET | `/orders/me` 🔒 | Lịch sử đơn, mới nhất trước | 401 |
| GET | `/orders/:id` 🔒 | Chi tiết đơn của chính mình | 404 |
| POST | `/orders/:id/cancel` 🔒 | Khách hủy đơn **chưa pha** (`PENDING`, `PAYMENT_FAILED`, `PAID`), trả lại nguyên liệu; đơn đã `PAID` bị thu hồi điểm thưởng và giao dịch thành `REFUND_DUE` | 409 sai trạng thái hoặc đang thanh toán |
| PATCH | `/orders/:id/status` 🔒 STAFF | Barista đổi trạng thái: chỉ `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`. Hủy đơn đã `PAID` thì trả nguyên liệu, thu hồi điểm thưởng và giao dịch thành `REFUND_DUE` | 400, 403, 409 |
| GET | `/ingredients` 🔒 STAFF | Trang Kho: tồn từng nguyên liệu và số ly còn bán được của từng món | 403 |
| POST | `/ingredients/:id/restock` 🔒 STAFF | Nhập thêm hàng vào kho `{ "amount": 2000 }` | 400, 403, 404 |
| POST | `/payments` 🔒 | Mở phiên thanh toán ở cổng **MoMo** hoặc **VNPay** (sandbox), trả về link sang trang thanh toán của cổng (header `Idempotency-Key` **bắt buộc**) | 400, 404, 409, 502 |
| GET | `/payments` 🔒 STAFF | Trang Doanh thu: tổng tiền đã vào và 100 giao dịch gần nhất, lọc `?status=SUCCESS\|REFUND_DUE\|PROCESSING\|FAILED\|EXPIRED` (chỉ đọc) | 400, 403 |
| GET | `/payments/:id` 🔒 | Trạng thái phiên thanh toán của chính mình; phiên còn mở thì backend tự tra cứu cổng | 404 |
| POST | `/payments/:id/return` 🔒 | Trang BrewLite gửi lên kết quả cổng gắn vào link khi chuyển khách về; backend kiểm tra chữ ký rồi tra cứu lại cổng | 400, 404 |
| GET | `/payments/:id/receipt` 🔒 | Biên lai giao dịch (khách xem của mình, nhân viên xem tất cả) | 404 |
| POST | `/payments/momo/ipn` | IPN của MoMo (server → server, ký HMAC-SHA256, không dùng JWT) → 204 | 400, 404 |
| GET | `/payments/vnpay/ipn` | IPN của VNPay (server → server, ký HMAC-SHA512) → 200 kèm `RspCode` | |

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

### POST /payments

```http
Idempotency-Key: 0b7e9d4c-5f21-4e3a-8c6d-9a1b2c3d4e5f
```

```json
{ "orderId": 1042, "provider": "VNPAY", "returnOrigin": "http://localhost:3000" }
```

→ `201`

```json
{
  "replayed": false,
  "payment": {
    "id": 7, "orderId": 1042, "status": "PROCESSING", "provider": "VNPAY", "amount": 51300,
    "gatewayOrderId": "BLMVQGKPK11F0B76C8", "gatewayRef": null, "confirmedAt": null, "createdAt": "…"
  },
  "order": { "id": 1042, "status": "PENDING" },
  "expiresAt": "…",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5130000&…&vnp_SecureHash=…"
}
```

- `provider`: `MOMO` hoặc `VNPAY`.
  - **VNPay:** backend tự ký link (HMAC-SHA512 bằng `VNPAY_HASH_SECRET`).
  - **MoMo:** backend gọi API `/v2/gateway/api/create` của MoMo (ký HMAC-SHA256) để lấy `payUrl`. MoMo từ chối hoặc không kết nối được thì trả 502, và khách bấm thanh toán lại được ngay.
- `returnOrigin`: địa chỉ BrewLite khách đang mở. Cổng chuyển khách về `<returnOrigin>/payments/<id>`, nhưng chỉ khi địa chỉ đó nằm trong `FRONTEND_URL`; nếu không thì dùng địa chỉ đầu tiên của `FRONTEND_URL`.
- `gatewayOrderId`: mã đơn gửi sang cổng, dạng `BL` + thời gian + số ngẫu nhiên. Không gửi số đơn vì cả nhóm dùng chung tài khoản sandbox (khóa test MoMo còn dùng chung toàn Internet), mà CSDL mỗi máy đều đánh số đơn từ 1.
- API này **không** trả kết quả thanh toán. Frontend chuyển khách sang `paymentUrl`, đơn vẫn `PENDING` cho tới khi cổng xác nhận.
- Phiên hết hạn sau 5 phút (`expiresAt`). VNPay tự chặn thanh toán sau `vnp_ExpireDate`. Phiên đã kết thúc hoặc hết hạn thì `paymentUrl = null`.
- **Gửi lặp và thanh toán lại:**
  - Gửi lại **cùng key**: trả đúng phiên cũ với `replayed: true`, không gọi cổng lần nữa. Dùng cùng key cho một đơn khác bị trả 409.
  - Đơn đang có phiên còn hạn mà khách bấm thanh toán lại cùng cổng (key mới): trả về phiên đang mở. Chọn cổng khác thì 409, khách tiếp tục hoặc bấm hủy trên cổng cũ trước.
  - Đơn `PAYMENT_FAILED` thanh toán lại bằng key mới: đơn về `PENDING` và mở phiên mới (đổi cổng được). Đơn đã `PAID` thì trả 409.

### Cổng xác nhận kết quả

Đơn chỉ sang `PAID` (cộng điểm thưởng) hoặc `PAYMENT_FAILED` khi **cổng xác nhận** bằng một trong ba đường, đều kiểm tra chữ ký của cổng:

| Đường | Ai gọi | Ghi chú |
| --- | --- | --- |
| `POST /payments/:id/return` `{ "params": { …tham số trên link quay về… } }` | Trang `/payments/:id` của BrewLite, khi cổng chuyển khách về | Sai chữ ký, của giao dịch khác hoặc số tiền bị sửa → 400. Chữ ký đúng thì backend **gọi API tra cứu của cổng** (MoMo `/v2/gateway/api/query`, VNPay `querydr`) rồi mới cập nhật |
| `GET /payments/:id` | Trang chờ, mỗi 1,5 giây | Phiên còn mở thì backend tra cứu cổng (tối đa 4 giây một lần). Khách trả bằng app trên điện thoại, máy tính vẫn biết kết quả |
| IPN `POST /payments/momo/ipn`, `GET /payments/vnpay/ipn` | Server MoMo, VNPay | Chỉ tới được khi API có địa chỉ công khai (`PUBLIC_API_URL`; VNPay cấu hình IPN URL trong trang quản trị merchant). Chạy trên máy cá nhân thì dùng hai đường trên |

- VNPay IPN trả `{ "RspCode", "Message" }` theo tài liệu VNPay:

  | RspCode | Nghĩa | VNPay có gửi lại không |
  | --- | --- | --- |
  | `00` | Đã xử lý | Không |
  | `02` | Đã xác nhận trước đó | Không |
  | `01` | Không có giao dịch | Có |
  | `04` | Sai số tiền | Có |
  | `97` | Sai chữ ký | Có |

- MoMo IPN trả 204; sai chữ ký → 400.
- **Xác nhận lặp:** link quay về, IPN, tra cứu chạy cùng lúc chỉ được xử lý một lần, không cộng điểm hai lần.
- **Cổng báo đã trừ tiền khi BrewLite đã cho phiên hết hạn:** vẫn ghi `SUCCESS`. Đơn còn chờ thì sang `PAID`; đơn đã tự hủy thì giữ `CANCELLED`, giao dịch vào mục *Cần hoàn tiền*.
- **Bằng chứng giao dịch lưu trên `Payment`:**
  - `gatewayRef`: mã giao dịch của cổng (MoMo `transId`, VNPay `vnp_TransactionNo`).
  - `bankCode`: ngân hàng (VNPay).
  - `payType`: hình thức (MoMo `napas`/`qr`/`credit`, VNPay `ATM`).
  - `confirmedAt`: thời điểm xác nhận.
  - `gatewayResult`: nguyên văn dữ liệu cổng gửi về, có chữ ký.

### GET /payments/:id/receipt

→ `200 { "payment": { …, "state": "SUCCESS" }, "order": { …, "items": [ … ] }, "customer": { "fullName", "email" }, "gatewayResult": { … } }`

Trang `/payments/:id/receipt` hiện biên lai theo màu của cổng, có nút *In / Lưu PDF*. Khách chỉ xem được giao dịch của mình (người khác → 404); nhân viên xem mọi giao dịch từ trang Doanh thu.

### GET /payments (nhân viên)

→ `200`

```json
{
  "summary": {
    "received": 1250000, "success": 24, "refundDue": 1, "refundDueAmount": 45000,
    "failed": 3, "processing": 1, "expired": 2
  },
  "payments": [
    {
      "id": 7, "orderId": 1042, "amount": 51300, "provider": "VNPAY",
      "status": "SUCCESS", "state": "SUCCESS", "gatewayOrderId": "BLMVQGKPK11F0B76C8",
      "gatewayRef": "15716332", "bankCode": "NCB", "payType": null, "confirmedAt": "…", "createdAt": "…",
      "order": { "status": "PAID", "user": { "fullName": "Nguyễn Văn A", "email": "khach@brewlite.vn" } }
    }
  ]
}
```

- `received` chỉ cộng các giao dịch `SUCCESS` của đơn **không bị hủy**, tức là cổng MoMo hoặc VNPay đã xác nhận thành công và quầy giữ tiền.
- `state` là trạng thái để hiển thị:
  - `EXPIRED`: phiên còn `PROCESSING` nhưng đã quá 5 phút (khách bỏ dở, không có tiền vào).
  - `REFUND_DUE`: giao dịch `SUCCESS` nhưng đơn đã bị hủy (khách hoặc nhân viên hủy). Tiền đã vào, quầy phải hoàn cho khách. `refundDue` và `refundDueAmount` là số giao dịch và số tiền cần hoàn.
- Chỉ tài khoản `STAFF` gọi được (khách → 403). API này chỉ đọc, không sửa hay hoàn tiền giao dịch.

### GET /orders?status=PAID (nhân viên)

→ `200`

```json
{
  "counts": { "PAID": 2, "PREPARING": 1, "READY": 0, "COMPLETED": 18, "CANCELLED": 4 },
  "orders": [
    {
      "id": 1042, "status": "PAID", "total": 51300, "createdAt": "…",
      "items": [{ "productName": "Cappuccino", "size": "M", "toppings": ["Trân châu"], "qty": 1, "…": "…" }],
      "user": { "fullName": "Nguyễn Văn A" }
    }
  ]
}
```

- Chỉ đơn đã thanh toán mới lên quầy. Ba nhóm `PAID`, `PREPARING`, `READY` là hàng chờ: đơn đặt trước xếp trước. `COMPLETED` và `CANCELLED` xếp mới nhất trước. Mỗi nhóm trả tối đa 100 đơn.
- Nhân viên bấm nút trên trang `/admin/orders`, frontend gọi `PATCH /orders/:id/status`: *Nhận đơn* (`PREPARING`), *Pha xong* (`READY`), *Đã giao khách* (`COMPLETED`), *Hủy đơn* (`CANCELLED`, chỉ khi đơn còn `PAID`).

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

### Cấu hình cổng sandbox

| Biến môi trường (backend) | Ý nghĩa |
| --- | --- |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | Mã website và chuỗi bí mật VNPay gửi qua email khi đăng ký merchant sandbox ở https://sandbox.vnpayment.vn/devreg/. Chỉ để trong `.env`, không commit |
| `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY` | Để trống thì dùng bộ khóa test MoMo công bố công khai (`partnerCode = MOMO`) |
| `PUBLIC_API_URL` | Địa chỉ công khai của API để MoMo gọi IPN |

Thẻ thử nghiệm (hiện cả trong mục *Thông tin thẻ thử nghiệm* ở trang Thanh toán):

| Cổng | Cách trả |
| --- | --- |
| VNPay | *Thẻ nội địa và tài khoản ngân hàng* → NCB, số thẻ `9704198526191432198`, tên `NGUYEN VAN A`, ngày phát hành `07/15`, OTP `123456` |
| MoMo | *Thanh toán bằng thẻ ATM*, số thẻ `9704000000000018`, ngày phát hành `03/07`, tên `NGUYEN VAN A`, số điện thoại bất kỳ, OTP `OTP`. Hoặc quét mã bằng app MoMo bản test |

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
