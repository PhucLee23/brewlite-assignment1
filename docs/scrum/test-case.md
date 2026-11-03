# Test case và nghiệm thu

TV2 (PO) chạy từng test case trên `main` sau khi các hạng mục liên quan đã merge, rồi ghi *Đạt* hoặc mô tả lỗi vào cột *Kết quả*. Lỗi tìm thấy ghi vào mục *Bug bash* và mở PR `fix/...` để sửa.

Dữ liệu mẫu: tài khoản khách `khach@brewlite.vn` / `123456`, barista `barista@brewlite.vn` / `123456`; mã giảm giá `BREW10`, `WELCOME20`, `HETHAN`.

## Sprint 1

| Mã | User story | Bước | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- | --- |
| TC-01 | US-01 | Mở http://localhost:4000/products | JSON có id, tên, giá, ảnh, `stock` của 15 món | Đạt |
| TC-02 | US-01 | Mở trang chủ khi backend đang chạy, rồi tắt backend và tải lại | Có lưới 15 món; tắt backend thì hiện khung báo lỗi và nút Thử lại | Đạt |
| TC-03 | US-02 | Mở Cappuccino, đổi size S → M → L, chọn Kem cheese | Thành tiền 45.000 → 50.000 → 55.000 → 62.000đ | Đạt |
| TC-04 | US-13 | Mở Cold brew | Size S còn 5 ly, M còn 4 ly, L còn 3 ly | Đạt |

## Sprint 2

| Mã | User story | Bước | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- | --- |
| TC-05 | US-03 | Thêm 2 ly Latte M rồi thêm 1 ly Latte M nữa | Giỏ có 1 dòng Latte M × 3; badge trên header là 3 | Đạt |
| TC-06 | US-03 | Tải lại trang Giỏ hàng | Giỏ hàng còn nguyên | Đạt |
| TC-07 | US-03 | Thêm Cold brew size S tới khi hết | Không bấm được + khi đã đủ 5 ly | Đạt |
| TC-08 | US-04 | Vào /checkout khi chưa đăng nhập | Chuyển sang /login; đăng nhập xong quay lại /checkout | Đạt |
| TC-09 | US-04 | Đăng ký lại bằng email đã có | Báo "Email đã được đăng ký" | Đạt |
| TC-10 | US-09 | Nhập mã `BREW10` với giỏ 90.000đ; nhập `HETHAN` | Giảm 9.000đ; `HETHAN` báo mã đã hết hạn | Đạt |
| TC-11 | US-05 | Bấm *Đặt đơn* hai lần liên tiếp | Chỉ có 1 đơn `PENDING` (xem *Lịch sử đơn* hoặc bảng `Order`) | Đạt |
| TC-12 | US-08 | Chạy `npm run test:e2e` trong `backend/` | Toàn bộ test đạt | Đạt |

## Sprint 3

| Mã | User story | Bước | Kết quả mong đợi | Kết quả |
| --- | --- | --- | --- | --- |
| TC-13 | US-05 | Thanh toán bằng VNPay, thẻ NCB, OTP 123456 | Về BrewLite, đơn `PAID`, có link biên lai | Đạt |
| TC-14 | US-05 | Thanh toán bằng MoMo, thẻ ATM test, OTP `OTP` | Về BrewLite, đơn `PAID` | Đạt |
| TC-15 | US-05 | Bấm *Hủy* trên trang VNPay | Đơn `PAYMENT_FAILED`, giỏ còn nguyên, chọn lại cổng được | Đạt |
| TC-16 | US-06 | Mở *Đơn hàng* sau khi thanh toán | Đơn mới nhất ở trên cùng, đúng trạng thái | Đạt |
| TC-17 | US-12 | Đăng nhập barista, ở *Quầy* bấm *Nhận đơn*, *Pha xong*, *Đã giao khách* | Trang đơn của khách tự đổi trạng thái theo | Đạt |
| TC-18 | US-12 | Khách hủy đơn đã `PAID` chưa pha | Đơn `CANCELLED`, nguyên liệu trả về, điểm bị thu hồi, *Doanh thu* hiện *Cần hoàn tiền* | Đạt |
| TC-19 | US-11 | Khách gõ http://localhost:3000/admin/revenue | Báo trang chỉ dành cho nhân viên; API trả 403 | Đạt |
| TC-20 | US-13 | Barista nhập thêm nguyên liệu hết trước của Cold brew ở *Kho* | Số ly Cold brew tăng ngay | Đạt |
| TC-21 | US-01 | Gõ http://localhost:3000/khong-co | Trang 404 tiếng Việt có nút về menu | Đạt |
| TC-22 | US-06 | `docker compose up -d --build` trên máy sạch | Đủ 3 dịch vụ chạy, web mở được | Đạt |

## Bug bash

Cả nhóm cùng thử phá ứng dụng trước buổi bàn giao (bấm liên tục, mở hai tab, mạng chậm, màn hình 375px).

| # | Mô tả lỗi | Người phát hiện | Mức độ | Cách xử lý |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |
