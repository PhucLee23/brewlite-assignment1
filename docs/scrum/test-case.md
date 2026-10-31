# Test case và nghiệm thu

TV2 (PO) chạy từng test case trên `main` sau khi các hạng mục liên quan đã merge, rồi ghi *Đạt* hoặc mô tả lỗi vào cột *Kết quả*. Lỗi tìm thấy thì báo người làm hạng mục để mở PR `fix/...` sửa.

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
