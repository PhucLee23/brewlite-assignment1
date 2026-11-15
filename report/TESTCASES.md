# Kiểm thử API backend BrewLite – Assignment 1

Bộ test Postman chia theo 10 task của đề. Request trong mỗi task lấy từ tiêu chí chấp nhận của user story tương ứng trong `docs/scrum/product-backlog.md`, cộng các ca lỗi chung theo Definition of Done: API validate đầu vào (400), chưa đăng nhập (401), sai vai trò (403), không tìm thấy (404), xung đột (409). Mỗi task có request đúng để show endpoint khi demo và request sai để chứng minh backend chặn đúng.

- Bộ test: [`brewlite-a1.postman_collection.json`](brewlite-a1.postman_collection.json) (Postman Collection v2.1, 92 request, 196 kiểm tra)
- Script chạy tự động: [`run-postman-tests.mjs`](run-postman-tests.mjs)

---

## 1. Cách chạy

### Cách 1: chạy tự động bằng script (nên dùng)

Lệnh dùng PowerShell trong VS Code, bắt đầu từ thư mục dự án `d:\brewlite-assignment1`.

**Bước 1. Bật toàn bộ hệ thống bằng Docker.** Backend tự chạy migration và nạp dữ liệu mẫu khi khởi động.

```powershell
docker compose up -d --build
```

File `.env` cạnh `docker-compose.yml` phải có `VNPAY_TMN_CODE` và `VNPAY_HASH_SECRET` (khóa sandbox của nhóm), vì phần thanh toán mở phiên VNPay. Kiểm tra backend đã lên: mở http://localhost:4000.

**Bước 2. Chạy toàn bộ test** (lần đầu cần `npm install` để cài Newman):

```powershell
cd report
npm install
node run-postman-tests.mjs
```

Script tự làm các bước sau, không cần thao tác tay:

1. Chạy mọi folder, trừ folder luồng Quầy.
2. Đánh dấu PAID cho 2 đơn vừa tạo, bằng `docker compose exec db psql`.
3. Chạy folder luồng Quầy.

Kết quả mong đợi ở cuối:

```
========== TỔNG KẾT ==========
✓ PASS  Các folder chính: …/… kiểm tra đạt
✓ PASS  … Luồng Quầy (cần 2 đơn PAID): …/… kiểm tra đạt
```

Phía trên phần tổng kết, mỗi request được in ra cùng các kiểm tra: `✓` là đạt, số thứ tự màu đỏ là không đạt (chi tiết lỗi in ở bảng cuối mỗi lần chạy).

Backend chạy ở cổng khác thì đặt biến `BASE_URL`, ví dụ `$env:BASE_URL="http://localhost:4001"; node run-postman-tests.mjs`.

### Cách 2: chạy riêng một folder bằng Newman

Luôn chạy kèm folder `0. Chuẩn bị – Đăng nhập` để có token:

```powershell
cd report
npx newman run <tên file collection> --folder "0. Chuẩn bị – Đăng nhập" --folder "<tên folder>"
```

### Cách 3: chạy trong Postman (app, bản web hoặc extension Postman trong VS Code)

1. **Import** → chọn file collection trong `report`.
2. Bản web: bật **Desktop Agent** (góc dưới bên phải) để Postman gọi được `localhost`.
3. Chạy folder **0. Chuẩn bị** trước, rồi mở từng request bấm **Send** và xem tab **Test Results**; hoặc bấm `...` cạnh tên folder → **Run**.
4. Trước folder luồng Quầy, mở **Console** (góc dưới) để lấy mã 2 đơn in ở request tạo đơn cuối cùng, rồi đánh dấu PAID:

```powershell
docker compose exec db psql -U brewlite -d brewlite
```

Trong màn hình psql, dán câu lệnh in ở Console (dạng `UPDATE "Order" SET status = 'PAID' WHERE id IN (10, 11);`), Enter, rồi gõ `\q` để thoát.

---

## 2. Dữ liệu dùng khi test

Dữ liệu mẫu tạo bởi `backend/prisma/seed.ts`:

| Loại | Dữ liệu |
| --- | --- |
| Tài khoản | `khach@brewlite.vn` / `123456` (CUSTOMER); `barista@brewlite.vn` / `123456` (STAFF) |
| Món dùng trong test | #1 Cà phê sữa đá 35.000; #2 Americano 40.000; #3 Cappuccino 45.000; #4 Latte 45.000; #5 Bạc xỉu 35.000; #7 Matcha latte 49.000; Cold brew (tìm theo tên) |
| Topping | #1 Trân châu 5.000; Kem cheese 7.000 |
| Phụ thu size | S: 0; M: +5.000; L: +10.000 |
| Mã giảm giá | BREW10: 10%, đơn từ 50.000; WELCOME20: 20%, đơn từ 100.000; HETHAN: đã hết hạn |
| Nguyên liệu dùng cho test đặt đồng thời | "Cold brew ủ sẵn": 1 ly Cold brew size S cần 200 ml |

Mỗi lần chạy, test đăng ký một tài khoản mới (email theo thời gian) để làm "người khác" và "khách B".

---

## 3. Đối chiếu với task của đề

| Task | Folder | Tiêu chí chấp nhận được kiểm |
| --- | --- | --- |
| 1 Khởi tạo dự án | Task 1 | TS-01: `GET /` trả "Hello BrewLite" |
| 2 API danh sách sản phẩm | Task 2 | US-01, US-13: đủ trường; món không có 404; id sai 400; số ly còn tính từ nguyên liệu |
| 3 Trang Menu, 5 Giỏ hàng | – | Không có API riêng (giỏ hàng lưu ở trình duyệt): demo trên giao diện |
| 4 Chi tiết và tùy chọn | Task 3, 4, 5 | US-02: giá theo size, topping (TC-03) |
| 6 API tạo đơn hàng | Task 6 | US-05: server tự tính giá, không nhận giá từ client, validate, đơn PENDING |
| 7 Đăng ký / Đăng nhập | Task 7 | US-04: JWT, trùng email 409, dữ liệu sai 400, sai mật khẩu và email chưa có cùng 401 |
| 8 Thanh toán | Task 8 | US-05, US-11: phiên VNPay, Idempotency-Key, kết quả sai chữ ký 400; API Doanh thu chỉ cho nhân viên; biên lai |
| 9 Xác nhận, lịch sử | Task 9 | US-06, US-12: `GET /orders/me` mới nhất trước; màn hình Quầy chỉ cho nhân viên |
| 10 Nghiệp vụ backend | Task 10, Task 10b | US-07 → US-10, US-13: (a) chặn chuyển trạng thái sai; (b) Idempotency-Key; (c) đặt đồng thời không vượt tồn kho; mã giảm giá; hủy đơn trả nguyên liệu; luồng Quầy |

---

## 4. Danh sách test case

Bảng dưới đây sinh từ chính collection: cột *Kiểm tra* là tên từng `pm.test` trong tab Scripts → Post-response của request.

### 0. Chuẩn bị – Đăng nhập

Lấy token của khách và nhân viên, lưu vào biến customerToken, staffToken. Luôn chạy folder này trước.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 0.1 Đăng nhập tài khoản khách | `POST /auth/login`<br>`{"email":"khach@brewlite.vn","password":"123456"}` | – | Mã trạng thái 200; Có accessToken, vai trò CUSTOMER |
| 0.2 Đăng nhập tài khoản nhân viên | `POST /auth/login`<br>`{"email":"barista@brewlite.vn","password":"123456"}` | – | Mã trạng thái 200; Có accessToken, vai trò STAFF |

### Task 1 – Khởi tạo dự án

TS-01: backend chạy được, GET / trả "Hello BrewLite".

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 1.1 Backend chạy được | `GET /` | – | Mã trạng thái 200; Trả {message: "Hello BrewLite"} |

### Task 2 – API danh sách sản phẩm

US-01, US-13: menu lấy từ CSDL, số ly còn bán được tính từ nguyên liệu.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 2.1 Danh sách menu | `GET /products` | – | Mã trạng thái 200; Phản hồi dưới 500 ms; Có 15 món; Mỗi món có id, name, price, imageUrl, stock; Không lộ công thức pha chế |
| 2.2 Chi tiết một món | `GET /products/1` | – | Mã trạng thái 200; Phản hồi dưới 500 ms; Món id 1 là Cà phê sữa đá, giá gốc 35.000đ; Có 3 size S/M/L, phụ thu 0/5.000/10.000; Size lớn tốn nhiều nguyên liệu hơn: số ly còn S ≥ M ≥ L; Có danh sách topping kèm giá |
| 2.3 Món không tồn tại | `GET /products/9999` | – | Mã trạng thái 404; Thông báo có "Không tìm thấy sản phẩm" |
| 2.4 Id không phải số | `GET /products/abc` | – | Mã trạng thái 400 |
| 2.5 Id vượt phạm vi số nguyên | `GET /products/99999999999` | – | Mã trạng thái 400 |

### Task 3, 4, 5 – Dữ liệu cho giao diện

Task 3 (trang Menu) và Task 5 (giỏ hàng, lưu ở trình duyệt bằng Zustand) không có API riêng: demo trên giao diện. Request dưới đây kiểm tra dữ liệu mà trang Chi tiết món (Task 4) dùng để tính thành tiền.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 4.1 Thành tiền Cappuccino theo size và topping (TC-03) | `GET /products/3` | – | Mã trạng thái 200; Size S 45.000đ, M 50.000đ, L 55.000đ; Size L thêm Kem cheese thành 62.000đ |

### Task 6 – API tạo đơn hàng

US-05: POST /orders validate dữ liệu, server tự tính giá, lưu đơn PENDING. Công thức: đơn giá = giá gốc + phụ thu size + giá topping; giảm giá = làm tròn xuống (tạm tính × % giảm).

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 6.1 Đơn mẫu có mã BREW10 | `POST /orders`<br>`{"items":[{"productId":1,"size":"M","toppingIds":[1],"qty":2},{"productId":7,"size":"L","qty":1}],"promoCod...` | khách | Mã trạng thái 201; Tạm tính 149.000đ, đúng công thức; Giảm giá 14.900đ; Tổng 134.100đ = tạm tính − giảm giá; Đơn ở trạng thái PENDING; Đơn giá từng dòng do server tính |
| 6.2 Bấm đặt đơn lần hai (cùng Idempotency-Key) | `POST /orders`<br>`{"items":[{"productId":1,"size":"M","toppingIds":[1],"qty":2},{"productId":7,"size":"L","qty":1}],"promoCod...` | khách | Thành công (2xx); Trả lại đúng đơn cũ, không tạo đơn mới |
| 6.3 Tăng số lượng cà phê lên 3 | `POST /orders`<br>`{"items":[{"productId":1,"size":"M","toppingIds":[1],"qty":3},{"productId":7,"size":"L","qty":1}],"promoCod...` | khách | Mã trạng thái 201; Tạm tính 194.000đ, đúng công thức; Giảm giá 19.400đ; Tổng 174.600đ = tạm tính − giảm giá; Đơn ở trạng thái PENDING; Đơn giá từng dòng do server tính |
| 6.4 Không dùng mã giảm giá | `POST /orders`<br>`{"items":[{"productId":1,"size":"M","toppingIds":[1],"qty":2},{"productId":7,"size":"L","qty":1}]}` | khách | Mã trạng thái 201; Tạm tính 149.000đ, đúng công thức; Giảm giá 0đ; Tổng 149.000đ = tạm tính − giảm giá; Đơn ở trạng thái PENDING; Đơn giá từng dòng do server tính |
| 6.5 Khách tự gửi đơn giá (unitPrice) | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1,"unitPrice":1000}]}` | khách | Mã trạng thái 400; Thông báo có "unitPrice" |
| 6.6 Khách tự gửi giá (price) | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":3,"price":15000}]}` | khách | Mã trạng thái 400; Thông báo có "price" |
| 6.7 Khách tự gửi tổng tiền (total) | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1}],"total":1000}` | khách | Mã trạng thái 400; Thông báo có "total" |
| 6.8 Số lượng bằng 0 | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":0}]}` | khách | Mã trạng thái 400; Thông báo có "Số lượng tối thiểu là 1" |
| 6.9 Số lượng 21 (tối đa 20) | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":21}]}` | khách | Mã trạng thái 400; Thông báo có "Số lượng tối đa là 20" |
| 6.10 Số lượng không phải số nguyên | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":2.5}]}` | khách | Mã trạng thái 400; Thông báo có "qty" |
| 6.11 Số lượng là chữ | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":"ba"}]}` | khách | Mã trạng thái 400 |
| 6.12 Giỏ hàng trống | `POST /orders`<br>`{"items":[]}` | khách | Mã trạng thái 400; Thông báo có "Giỏ hàng trống" |
| 6.13 Size không hợp lệ | `POST /orders`<br>`{"items":[{"productId":1,"size":"XL","qty":1}]}` | khách | Mã trạng thái 400; Thông báo có "Size phải là S, M hoặc L" |
| 6.14 Món không tồn tại | `POST /orders`<br>`{"items":[{"productId":9999,"size":"S","qty":1}]}` | khách | Mã trạng thái 400; Thông báo có "không tồn tại" |
| 6.15 Quá 5 topping một ly | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1,"toppingIds":[1,2,3,4,1,2]}]}` | khách | Mã trạng thái 400; Thông báo có "toppingIds" |
| 6.16 Idempotency-Key sai định dạng | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1}]}` | khách | Mã trạng thái 400; Thông báo có "Idempotency-Key" |
| 6.17 Chưa đăng nhập | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1}]}` | – | Mã trạng thái 401 |

### Task 7 – Đăng ký / Đăng nhập (JWT)

US-04: đăng ký, đăng nhập trả JWT; mật khẩu băm bcrypt; route cần đăng nhập trả 401 khi không có token.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 7.1 Đăng ký tài khoản mới | `POST /auth/register`<br>`{"email":"{{newEmail}}","password":"123456","fullName":"Khách Test"}` | – | Mã trạng thái 201; Có accessToken; Vai trò CUSTOMER, 0 điểm; Email được chuyển về chữ thường; Không trả passwordHash |
| 7.2 Đăng ký trùng email (viết hoa khác) | `POST /auth/register`<br>`{"email":"{{upperEmail}}","password":"123456","fullName":"Khách Test"}` | – | Mã trạng thái 409; Thông báo có "Email đã được đăng ký" |
| 7.3 Dữ liệu đăng ký sai | `POST /auth/register`<br>`{"email":"khong-phai-email","password":"123","fullName":"A"}` | – | Mã trạng thái 400; Báo đủ 3 lỗi: email, mật khẩu, họ tên |
| 7.4 Mật khẩu dài quá 72 byte | `POST /auth/register`<br>`{"email":"dai-qua-{{$timestamp}}@brewlite.vn","password":"{{longPassword}}","fullName":"Khách Test"}` | – | Mã trạng thái 400; Thông báo có "Mật khẩu quá dài" |
| 7.5 Họ tên toàn dấu cách | `POST /auth/register`<br>`{"email":"dau-cach-{{$timestamp}}@brewlite.vn","password":"123456","fullName":"    "}` | – | Mã trạng thái 400 |
| 7.6 Đăng nhập tài khoản vừa tạo | `POST /auth/login`<br>`{"email":"{{newEmail}}","password":"123456"}` | – | Mã trạng thái 200; accessToken là JWT 3 phần; JWT chứa email, vai trò, hạn dùng |
| 7.7 Sai mật khẩu | `POST /auth/login`<br>`{"email":"khach@brewlite.vn","password":"sai-mat-khau"}` | – | Mã trạng thái 401 |
| 7.8 Email chưa đăng ký | `POST /auth/login`<br>`{"email":"chua-co@brewlite.vn","password":"123456"}` | – | Mã trạng thái 401; Cùng thông báo với sai mật khẩu (không lộ email nào đã có) |
| 7.9 Xem thông tin của mình | `GET /auth/me` | tài khoản mới | Mã trạng thái 200; Đúng tài khoản vừa tạo, không có passwordHash |
| 7.10 Xem thông tin khi không có token | `GET /auth/me` | – | Mã trạng thái 401 |
| 7.11 Token sai | `GET /auth/me` | token giả | Mã trạng thái 401 |

### Task 8 – Thanh toán, doanh thu, biên lai

US-05, US-11. Mở phiên VNPay sandbox (backend tự ký link, cần VNPAY_TMN_CODE và VNPAY_HASH_SECRET trong .env). Đơn chỉ sang PAID khi cổng xác nhận bằng kết quả có chữ ký, nên ở đây kiểm tra phiên mở đúng và kết quả giả bị từ chối. API Doanh thu GET /payments chỉ cho nhân viên.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 8.1 Tạo đơn để thanh toán | `POST /orders`<br>`{"items":[{"productId":3,"size":"S","qty":1}]}` | khách | Mã trạng thái 201; Tổng 45.000đ, đơn PENDING |
| 8.2 Mở phiên thanh toán VNPay | `POST /payments`<br>`{ "orderId": {{payOrderId}}, "provider": "VNPAY" }` | khách | Mã trạng thái 201; Phiên mới (replayed = false), PROCESSING, đúng số tiền của đơn; Có link sang trang VNPay, link có chữ ký; Đơn vẫn PENDING cho tới khi cổng xác nhận; Không trả idempotencyKey của phiên ra ngoài |
| 8.3 Bấm thanh toán lần hai (cùng Idempotency-Key) | `POST /payments`<br>`{ "orderId": {{payOrderId}}, "provider": "VNPAY" }` | khách | Mã trạng thái 201; replayed = true, cùng mã phiên, không mở giao dịch thứ hai |
| 8.4 Thiếu Idempotency-Key | `POST /payments`<br>`{ "orderId": {{payOrderId}}, "provider": "VNPAY" }` | khách | Mã trạng thái 400; Thông báo có "Thiếu header Idempotency-Key" |
| 8.5 Cổng không hỗ trợ | `POST /payments`<br>`{ "orderId": {{payOrderId}}, "provider": "ZALOPAY" }` | khách | Mã trạng thái 400; Thông báo có "Cổng thanh toán phải là MOMO hoặc VNPAY" |
| 8.6 Thanh toán đơn của người khác | `POST /payments`<br>`{ "orderId": {{payOrderId}}, "provider": "VNPAY" }` | tài khoản mới | Mã trạng thái 404; Thông báo có "Không tìm thấy đơn hàng" |
| 8.7 Kết quả thanh toán giả (sai chữ ký) | `POST /payments/{{paymentId}}/return`<br>`{"params":{"vnp_TxnRef":"GIA-MAO","vnp_Amount":"4500000","vnp_ResponseCode":"00","vnp_TransactionStatus":"0...` | khách | Mã trạng thái 400; Thông báo có "Chữ ký kết quả thanh toán không hợp lệ" |
| 8.8 Doanh thu: nhân viên xem | `GET /payments` | nhân viên | Mã trạng thái 200; Có phần tổng hợp: tiền đã vào, cần hoàn, thất bại, đang chờ, hết hạn; Danh sách giao dịch có phiên vừa mở, kèm cổng và trạng thái hiển thị; Phiên chưa được cổng xác nhận thì không cộng vào tiền đã vào |
| 8.9 Doanh thu: lọc giao dịch đang chờ | `GET /payments?status=PROCESSING` | nhân viên | Mã trạng thái 200; Chỉ có giao dịch PROCESSING |
| 8.10 Doanh thu: lọc sai trạng thái | `GET /payments?status=ABC` | nhân viên | Mã trạng thái 400; Thông báo có "Trạng thái lọc phải là" |
| 8.11 Doanh thu: khách gọi | `GET /payments` | khách | Mã trạng thái 403 |
| 8.12 Doanh thu: chưa đăng nhập | `GET /payments` | – | Mã trạng thái 401 |
| 8.13 Biên lai: khách xem giao dịch của mình | `GET /payments/{{paymentId}}/receipt` | khách | Mã trạng thái 200; Đúng giao dịch và đúng đơn; Không trả khóa idempotency và link thanh toán |
| 8.14 Biên lai: nhân viên xem | `GET /payments/{{paymentId}}/receipt` | nhân viên | Mã trạng thái 200 |
| 8.15 Biên lai: người khác xem | `GET /payments/{{paymentId}}/receipt` | tài khoản mới | Mã trạng thái 404; Thông báo có "Không tìm thấy giao dịch" |
| 8.16 Biên lai: mã giao dịch vượt phạm vi | `GET /payments/99999999999/receipt` | khách | Mã trạng thái 400 |

### Task 9 – Xác nhận, lịch sử đơn

US-06, US-12: khách xem đơn của mình, mới nhất trước; màn hình Quầy chỉ cho nhân viên.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 9.1 Lịch sử đơn của khách | `GET /orders/me` | khách | Mã trạng thái 200; Có đơn, đơn mới nhất là đơn 8.1; Sắp xếp mới nhất trước; Mọi đơn cùng một chủ, đơn nào cũng có danh sách món |
| 9.2 Xem chi tiết đơn của mình | `GET /orders/{{orderId}}` | khách | Mã trạng thái 200; Đúng đơn 6.1 |
| 9.3 Xem đơn của người khác | `GET /orders/{{orderId}}` | tài khoản mới | Mã trạng thái 404; Thông báo có "Không tìm thấy đơn hàng" |
| 9.4 Tài khoản mới chưa có đơn | `GET /orders/me` | tài khoản mới | Mã trạng thái 200; Mảng rỗng, không thấy đơn của người khác |
| 9.5 Lịch sử đơn khi chưa đăng nhập | `GET /orders/me` | – | Mã trạng thái 401 |
| 9.6 Mã đơn không phải số | `GET /orders/abc` | khách | Mã trạng thái 400 |
| 9.7 Khách mở màn hình Quầy | `GET /orders?status=PAID` | khách | Mã trạng thái 403 |
| 9.8 Nhân viên mở màn hình Quầy | `GET /orders?status=PAID` | nhân viên | Mã trạng thái 200 |
| 9.9 Màn hình Quầy lọc sai trạng thái | `GET /orders?status=PENDING` | nhân viên | Mã trạng thái 400; Thông báo có "Trạng thái lọc phải là" |

### Task 10 – Nghiệp vụ backend

US-07 → US-10, US-13. (a) chặn chuyển trạng thái sai; (b) Idempotency-Key; (c) đặt đồng thời không vượt tồn kho; mã giảm giá; hủy đơn trả nguyên liệu; kho. Folder "Task 10b" chạy riêng sau khi có đơn PAID.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 10.1 (a) Đơn PENDING nhảy thẳng sang PREPARING | `PATCH /orders/{{orderId}}/status`<br>`{"status":"PREPARING"}` | nhân viên | Mã trạng thái 409; Thông báo có "Không thể chuyển đơn từ PENDING sang PREPARING" |
| 10.2 (a) Nhân viên tự đặt đơn đã thanh toán | `PATCH /orders/{{orderId}}/status`<br>`{"status":"PAID"}` | nhân viên | Mã trạng thái 400; Bị chặn ngay ở bước validate: chỉ cổng thanh toán mới đặt PAID |
| 10.3 (a) Khách đổi trạng thái pha chế | `PATCH /orders/{{orderId}}/status`<br>`{"status":"PREPARING"}` | khách | Mã trạng thái 403 |
| 10.4 (b) Hai yêu cầu đặt đơn cùng lúc, cùng Idempotency-Key | `GET /orders/me` (pre-request gửi song song) | khách | Cả 3 yêu cầu đều thành công; Cả 3 trả về cùng một đơn; Trong lịch sử chỉ có 1 đơn mang mã đó |
| 10.5 Kho: nhân viên xem tồn nguyên liệu | `GET /ingredients` | nhân viên | Mã trạng thái 200; Có tồn kho từng nguyên liệu |
| 10.6 Kho: nhân viên nhập thêm nguyên liệu | `POST /ingredients/{{coldBrewIngId}}/restock`<br>`{ "amount": {{restockAmount}} }` | nhân viên | Thành công (2xx); Tồn kho tăng đúng số vừa nhập |
| 10.7 Kho: nhập số lượng 0 | `POST /ingredients/{{coldBrewIngId}}/restock`<br>`{"amount":0}` | nhân viên | Mã trạng thái 400; Thông báo có "Số lượng nhập tối thiểu là 1" |
| 10.8 Kho: khách nhập kho | `POST /ingredients/1/restock`<br>`{"amount":100}` | khách | Mã trạng thái 403 |
| 10.9 Kho: khách xem kho | `GET /ingredients` | khách | Mã trạng thái 403 |
| 10.10 (c) Số ly Cold brew size S còn bán được | `GET /products/{{coldBrewId}}` | – | Mã trạng thái 200; Còn ít nhất 5 ly size S |
| 10.11 (c) Khách A và khách B đặt cùng lúc khi chỉ đủ cho một người | `GET /products/{{coldBrewId}}` (pre-request gửi song song) | – | Đúng 1 đơn thành công (201); Đúng 1 đơn bị từ chối 409 vì hết nguyên liệu; Chỉ trừ kho cho đơn thành công, không bao giờ âm |
| 10.12 Hủy đơn chưa thanh toán | `POST /orders/{{raceOrderId}}/cancel` | người đặt được | Mã trạng thái 200; Đơn chuyển sang CANCELLED |
| 10.13 Hủy đơn trả nguyên liệu về kho | `GET /products/{{coldBrewId}}` | – | Mã trạng thái 200; Số ly size S trở lại như trước khi đặt |
| 10.14 Hủy lại đơn đã hủy | `POST /orders/{{raceOrderId}}/cancel` | người đặt được | Mã trạng thái 409 |
| 10.15 Hủy đơn của người khác | `POST /orders/{{orderId}}/cancel` | tài khoản mới | Mã trạng thái 404 |
| 10.16 Mã giảm giá hợp lệ | `GET /promotions/BREW10?subtotal=60000` | – | Mã trạng thái 200; Hợp lệ, giảm 10% của 60.000đ = 6.000đ |
| 10.17 Mã chưa đủ giá trị đơn tối thiểu | `GET /promotions/WELCOME20?subtotal=60000` | – | Mã trạng thái 200; Không hợp lệ, lý do có "tối thiểu" |
| 10.18 Mã đã hết hạn | `GET /promotions/HETHAN?subtotal=60000` | – | Mã trạng thái 200; Không hợp lệ, lý do có "hết hạn" |
| 10.19 Đặt đơn dưới mức tối thiểu của mã | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1}],"promoCode":"WELCOME20"}` | khách | Mã trạng thái 400; Thông báo có "tối thiểu" |
| 10.20 Đặt đơn bằng mã hết hạn | `POST /orders`<br>`{"items":[{"productId":1,"size":"S","qty":1}],"promoCode":"HETHAN"}` | khách | Mã trạng thái 400; Thông báo có "hết hạn" |
| 10.21 Tạo đơn cho luồng Quầy | `POST /orders`<br>`{"items":[{"productId":4,"size":"M","qty":1}]}` | khách | Mã trạng thái 201 |
| 10.22 Tạo đơn để nhân viên hủy | `POST /orders`<br>`{"items":[{"productId":5,"size":"S","qty":1}]}` | khách | Mã trạng thái 201 |

### Task 10b – Luồng Quầy (cần 2 đơn PAID)

US-10, US-12. Cần 2 đơn tạo ở 10.21, 10.22 đã ở trạng thái PAID. Đơn chỉ sang PAID khi cổng thanh toán xác nhận (trang sandbox phải bấm tay), nên script run-postman-tests.mjs đánh dấu PAID trực tiếp trong CSDL trước folder này.

| Request | Endpoint, body | Token | Kiểm tra |
| --- | --- | --- | --- |
| 10b.1 Đơn đã thanh toán lên Quầy | `GET /orders?status=PAID` | nhân viên | Mã trạng thái 200; Có 2 đơn PAID vừa chuẩn bị; Chỉ có đơn PAID |
| 10b.2 Bắt đầu pha | `PATCH /orders/{{counterOrderId}}/status`<br>`{"status":"PREPARING"}` | nhân viên | Mã trạng thái 200; Trạng thái PREPARING |
| 10b.3 Khách hủy đơn đang pha | `POST /orders/{{counterOrderId}}/cancel` | khách | Mã trạng thái 409; Từ PREPARING trở đi không ai hủy được |
| 10b.4 Pha xong | `PATCH /orders/{{counterOrderId}}/status`<br>`{"status":"READY"}` | nhân viên | Mã trạng thái 200; Trạng thái READY |
| 10b.5 Giao cho khách | `PATCH /orders/{{counterOrderId}}/status`<br>`{"status":"COMPLETED"}` | nhân viên | Mã trạng thái 200; Trạng thái COMPLETED |
| 10b.6 Quay ngược đơn đã xong | `PATCH /orders/{{counterOrderId}}/status`<br>`{"status":"PREPARING"}` | nhân viên | Mã trạng thái 409; Thông báo có "Không thể chuyển đơn từ COMPLETED sang PREPARING" |
| 10b.7 Khách thấy trạng thái mới | `GET /orders/{{counterOrderId}}` | khách | Mã trạng thái 200; Đơn của khách ở COMPLETED |
| 10b.8 Nhân viên hủy đơn đã thanh toán, chưa pha | `PATCH /orders/{{counterCancelId}}/status`<br>`{"status":"CANCELLED"}` | nhân viên | Mã trạng thái 200; Trạng thái CANCELLED |

---

## 5. Lưu ý

- **Test đặt đồng thời (10.11)** gửi 2 đơn song song thật bằng `pm.sendRequest` trong Pre-request, không gửi lần lượt. Mỗi khách đặt q ly với q ≤ số ly còn < 2q, nên luôn chỉ một đơn đủ hàng; ai được ai bị là ngẫu nhiên. Request 10.6 nhập thêm "Cold brew ủ sẵn" cho đủ 1.000 ml nên chạy lại bao nhiêu lần cũng được. Console in ra, ví dụ: `Khách A: HTTP 201 đơn #19`, `Khách B: HTTP 409 "Cold brew" size S chỉ còn 2 ly`.
- **Vì sao luồng Quầy phải đánh dấu PAID bằng SQL:** đơn chỉ sang PAID khi cổng xác nhận, mà trang thanh toán sandbox phải bấm tay trên giao diện của cổng. Luồng thanh toán thật đã có test e2e trong `backend/test/order-flow.e2e-spec.ts` (dùng cổng giả ký đúng như cổng thật).
- **Thanh toán:** request 8.2 trả 502 "Chưa cấu hình VNPay" nếu `.env` thiếu khóa VNPay.
- Đơn chưa thanh toán tự hủy sau 5 phút và trả nguyên liệu về kho, nên không cần xóa tay các đơn tạo ra khi test.
- Một vài lỗi validate của A1 vẫn là thông báo mặc định tiếng Anh của class-validator (ví dụ `items.0.property price should not exist`, `items.0.qty must be an integer number`); test kiểm tra mã 400 và tên trường bị sai.
- Nếu báo lỗi kết nối: kiểm tra `docker compose ps` thấy `db` và `backend` đang chạy, backend nghe ở cổng 4000.
