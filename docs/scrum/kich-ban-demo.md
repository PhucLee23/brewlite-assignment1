# Kịch bản demo bàn giao

Buổi Sprint Review cuối, ngày 4/11/2026, đóng vai bàn giao cho khách hàng (mục 11 của đề). Mỗi thành viên trình bày phần mình làm.

## Chuẩn bị

1. Máy demo chạy `docker compose up -d --build` trước 15 phút; mở sẵn http://localhost:3000.
2. File `.env` ở thư mục gốc có khóa VNPay sandbox (xem README). Laptop có Internet để vào trang MoMo, VNPay.
3. Mở sẵn hai trình duyệt: một đăng nhập khách `khach@brewlite.vn`, một đăng nhập barista `barista@brewlite.vn`.

## Thứ tự trình bày

| # | Người trình bày | Nội dung | Hạng mục |
| --- | --- | --- | --- |
| 1 | TV2 (PO) | Product Vision, Product Backlog, 3 Sprint và Definition of Done | 1.11 |
| 2 | TV1 (SM) | Quy trình: nhánh, Pull Request, review chéo, Daily Scrum, burndown | 1.1, 3.14 |
| 3 | TV5 | Mở menu, chọn Cappuccino size L, topping Kem cheese: giá đổi theo lựa chọn | 1.6, 1.7, 1.8 |
| 4 | TV6 | Thêm món khác, sửa số lượng trong giỏ; badge trên header đổi theo; Cold brew không thêm quá số ly còn | 1.9, 2.5 |
| 5 | TV5 | Bấm Thanh toán khi chưa đăng nhập → trang Đăng nhập → quay lại Checkout | 2.4 |
| 6 | TV6 | Nhập mã `BREW10`, chọn VNPay, bấm *Hủy* trên trang VNPay: đơn `PAYMENT_FAILED`, giỏ còn nguyên; chọn MoMo và trả bằng thẻ ATM test | 2.6, 3.8 |
| 7 | TV5 | Màn hình xác nhận, biên lai (In / Lưu PDF), lịch sử đơn | 3.11, 3.7 |
| 8 | TV2 | Barista mở *Quầy*: *Nhận đơn*, *Pha xong*, *Đã giao khách*; trang đơn của khách tự cập nhật | 3.12 |
| 9 | TV6 | *Doanh thu*: giao dịch MoMo được cộng tiền, giao dịch VNPay bị hủy ở mục *Thất bại*; *Kho*: đặt Latte thì Cappuccino giảm theo, nhập kho thì số ly tăng | 3.9, 3.10 |
| 10 | TV3 | CSDL 11 bảng (mở Prisma Studio bằng `xem-database.bat`), công thức nguyên liệu, API sản phẩm, hủy đơn trả nguyên liệu | 1.3, 1.4, 1.5, 2.8, 2.9, 3.6 |
| 11 | TV4 | Task 10: state machine, optimistic locking, Idempotency-Key, xác nhận chữ ký cổng MoMo, VNPay; chạy `npm run test:e2e` cho thấy (a), (b), (c) đạt | 1.10, 2.7, 3.1, 3.2, 3.3, 3.4 |
| 12 | TV1 | `docker compose` 3 dịch vụ, mã khuyến mãi, JWT và phân quyền | 2.1, 2.2, 2.3, 3.13 |
| 13 | TV1 | Sprint Retrospective: điều làm tốt, điều cần cải thiện | 3.14 |
| 14 | TV2 | Nhận phản hồi của giảng viên, ghi vào *Backlog cho phiên bản sau* | 3.18 |

## Nếu gặp sự cố

- Trang MoMo hoặc VNPay không mở được (mất mạng): demo bằng test e2e `npm run test:e2e` (dùng cổng giả lập ký đúng như cổng thật) và biên lai của giao dịch đã trả trước đó.
- Docker chưa lên: chạy dev theo README (`docker compose up -d db`, `npm run start:dev`, `npm run dev`).
