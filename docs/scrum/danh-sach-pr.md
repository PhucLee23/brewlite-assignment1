# Danh sách Pull Request

Các Pull Request đã merge vào `main`, ghi theo GitHub (giờ Việt Nam), xếp theo thời điểm merge trong từng Sprint. Mỗi PR ứng với một hạng mục trong Sprint Backlog; riêng biên bản Sprint (3.14) mỗi Sprint nộp một PR. Hạng mục 1.1 (khởi tạo repo, README, mẫu PR) TV1 push thẳng `main` trước khi có PR đầu tiên.

Cột *Approve* là người đã bấm Approve trên GitHub.

## Sprint 1: khởi tạo, CSDL, API sản phẩm, Menu, Chi tiết món

| PR | Merge | Hạng mục | Task | Nội dung | Người làm | Approve |
| --- | --- | --- | --- | --- | --- | --- |
| [#1](https://github.com/PhucLee23/brewlite-assignment1/pull/1) | 29/10 11:19 | 1.2 | 1 | Khởi tạo NestJS + Prisma, ValidationPipe, compose PostgreSQL, .env.example | TV1 | TV3 |
| [#12](https://github.com/PhucLee23/brewlite-assignment1/pull/12) | 29/10 11:20 | 1.6 | 1 | Khởi tạo Next.js + Tailwind, layout, api.ts, types.ts, format.ts | TV5 | TV4 |
| [#13](https://github.com/PhucLee23/brewlite-assignment1/pull/13) | 29/10 13:03 | 1.3 | 2, 10 | schema.prisma đủ 11 bảng (có nguyên liệu, công thức) + migration | TV3 | TV4 |
| [#14](https://github.com/PhucLee23/brewlite-assignment1/pull/14) | 29/10 13:04 | 1.4 | 2 | Seed: 15 món, 20 nguyên liệu, công thức, tài khoản mẫu, mã giảm giá | TV3 | TV4 |
| [#15](https://github.com/PhucLee23/brewlite-assignment1/pull/15) | 29/10 13:04 | 1.11 | Tất cả | Product Backlog, user story, api.md, burndown | TV2 | TV1, TV4 |
| [#17](https://github.com/PhucLee23/brewlite-assignment1/pull/17) | 29/10 16:56 | 1.9 | 4, 5 | Giao diện dùng chung (ui.tsx), Header + badge, store giỏ hàng | TV6 | TV4 |
| [#16](https://github.com/PhucLee23/brewlite-assignment1/pull/16) | 29/10 16:56 | 1.10 | 10 | State machine đơn hàng + unit test | TV4 | TV3 |
| [#18](https://github.com/PhucLee23/brewlite-assignment1/pull/18) | 30/10 22:58 | 1.5 | 2, 4 | GET /products, GET /products/:id; tính số ly còn bán từ nguyên liệu (inventory.ts) + unit test | TV3 | TV4 |
| [#19](https://github.com/PhucLee23/brewlite-assignment1/pull/19) | 30/10 22:58 | 1.7 | 3 | Trang Menu | TV5 | TV4 |
| [#27](https://github.com/PhucLee23/brewlite-assignment1/pull/27) | 31/10 21:51 | 1.8 | 4 | Trang Chi tiết món: size theo tồn kho, topping, tính giá | TV5 | TV4 |

## Sprint 2: đăng nhập, Docker backend, giỏ hàng, mã khuyến mãi, đặt đơn

| PR | Merge | Hạng mục | Task | Nội dung | Người làm | Approve |
| --- | --- | --- | --- | --- | --- | --- |
| [#22](https://github.com/PhucLee23/brewlite-assignment1/pull/22) | 31/10 13:47 | 2.1 | 7 | Đăng ký/đăng nhập bcrypt + JWT, JwtAuthGuard, RolesGuard (STAFF) | TV1 | TV4, TV3 |
| [#23](https://github.com/PhucLee23/brewlite-assignment1/pull/23) | 31/10 13:48 | 2.2 | 9 | Dockerfile backend, compose có backend (tự migrate + seed) | TV1 | TV4, TV3 |
| [#20](https://github.com/PhucLee23/brewlite-assignment1/pull/20) | 31/10 13:48 | 2.5 | 5 | Trang Giỏ hàng | TV6 | TV4 |
| [#24](https://github.com/PhucLee23/brewlite-assignment1/pull/24) | 31/10 14:20 | 2.3 | 10 | Mã khuyến mãi: GET /promotions/:code, hàm áp mã vào tổng tiền | TV1 | TV3 |
| [#25](https://github.com/PhucLee23/brewlite-assignment1/pull/25) | 31/10 14:45 | 2.8 | 9, 10 | Xem đơn của mình, xem chi tiết, hủy đơn (trả nguyên liệu, FOR UPDATE), đổi trạng thái qua transitionOrder | TV3 | TV4 |
| [#26](https://github.com/PhucLee23/brewlite-assignment1/pull/26) | 31/10 14:45 | 2.9 | 2, 10 | API Kho: GET /ingredients, nhập kho | TV3 | TV4 |
| [#28](https://github.com/PhucLee23/brewlite-assignment1/pull/28) | 31/10 16:06 | 2.7 | 6, 10 | POST /orders: pricing.ts + unit test, trừ nguyên liệu bằng transaction + optimistic locking, idempotency, tự hủy đơn quá 5 phút | TV4 | TV3 |
| [#31](https://github.com/PhucLee23/brewlite-assignment1/pull/31) | 31/10 19:08 | 2.10 | 2, 7 | Test e2e API công khai: sản phẩm, đăng nhập, thời gian phản hồi < 500 ms | TV2 | TV1, TV4 |
| [#30](https://github.com/PhucLee23/brewlite-assignment1/pull/30) | 31/10 19:08 | 2.6 | 6 | Trang Checkout: nhập mã giảm giá, đặt đơn kèm Idempotency-Key | TV6 | TV4 |
| [#29](https://github.com/PhucLee23/brewlite-assignment1/pull/29) | 31/10 21:52 | 2.4 | 7 | AuthForm, trang Đăng nhập/Đăng ký, store auth, useRequireAuth | TV5 | TV4 |
| [#32](https://github.com/PhucLee23/brewlite-assignment1/pull/32) | 31/10 21:52 | 2.11 | – | Test case Sprint 2, nghiệm thu | TV2 | TV1, TV4 |

## Sprint 3: thanh toán MoMo/VNPay, Quầy, Kho, Doanh thu, nghiệm thu

| PR | Merge | Hạng mục | Task | Nội dung | Người làm | Approve |
| --- | --- | --- | --- | --- | --- | --- |
| [#21](https://github.com/PhucLee23/brewlite-assignment1/pull/21) | 31/10 13:49 | 3.14 | – | Biên bản Sprint Review và Retrospective (Sprint 1) | TV1 | TV4, TV3 |
| [#33](https://github.com/PhucLee23/brewlite-assignment1/pull/33) | 31/10 23:26 | 3.1 | 8, 10 | Lõi thanh toán: gateway.ts, POST /payments (idempotency), phiên 5 phút, settle, link quay về, tự tra cứu, IPN | TV4 | TV3 |
| [#35](https://github.com/PhucLee23/brewlite-assignment1/pull/35) | 01/11 00:34 | 3.14 | – | Biên bản Sprint Review và Retrospective (Sprint 2) | TV1 | TV3, TV4 |
| [#36](https://github.com/PhucLee23/brewlite-assignment1/pull/36) | 01/11 00:34 | 3.13 | 9 | Dockerfile frontend, compose 3 dịch vụ, xem-database.bat | TV1 | TV3, TV4 |
| [#34](https://github.com/PhucLee23/brewlite-assignment1/pull/34) | 01/11 00:34 | 3.2 | 8 | Cổng VNPay (ký HMAC-SHA512) + unit test | TV4 | TV3 |
| [#39](https://github.com/PhucLee23/brewlite-assignment1/pull/39) | 01/11 17:09 | 3.15 | 3, 9 | Trang 404, trang lỗi | TV2 | TV4 |
| [#38](https://github.com/PhucLee23/brewlite-assignment1/pull/38) | 01/11 17:09 | 3.4 | 8 | Cổng MoMo (HMAC-SHA256) + unit test, theo khuôn gateway.ts | TV4 | – |
| [#40](https://github.com/PhucLee23/brewlite-assignment1/pull/40) | 01/11 17:09 | 3.5 | 10 | Điểm thưởng: cộng khi PAID, thu hồi khi hủy, kèm test | TV2 | TV1, TV4 |
| [#41](https://github.com/PhucLee23/brewlite-assignment1/pull/41) | 01/11 17:09 | 3.8 | 8 | Chọn MoMo/VNPay (PaymentForm, ProviderLogo), trang chờ kết quả | TV6 | TV4 |
| [#42](https://github.com/PhucLee23/brewlite-assignment1/pull/42) | 01/11 18:39 | 3.3 | 10 | Test e2e Task 10 (a)(b)(c), cổng giả fake-gateways.ts | TV4 | TV3 |
| [#43](https://github.com/PhucLee23/brewlite-assignment1/pull/43) | 01/11 22:53 | 3.6 | 9, 10 | API cho Quầy: GET /orders?status= (STAFF), hủy đơn đã PAID | TV3 | TV4 |
| [#44](https://github.com/PhucLee23/brewlite-assignment1/pull/44) | 02/11 17:16 | 3.7 | 8, 9 | API Doanh thu (GET /payments, REFUND_DUE) + API biên lai | TV5 | TV4 |
| [#45](https://github.com/PhucLee23/brewlite-assignment1/pull/45) | 03/11 09:24 | 3.11 | 9 | Trang đơn hàng (tự cập nhật, hủy), Lịch sử đơn, trang Biên lai | TV5 | TV4, TV6 |
| [#46](https://github.com/PhucLee23/brewlite-assignment1/pull/46) | 03/11 12:58 | 3.9 | 9 | Trang Kho (/admin/ingredients) | TV6 | TV4 |
| [#47](https://github.com/PhucLee23/brewlite-assignment1/pull/47) | 03/11 12:59 | 3.10 | 8 | Trang Doanh thu (/admin/revenue) | TV6 | TV4 |
| [#48](https://github.com/PhucLee23/brewlite-assignment1/pull/48) | 03/11 12:59 | 3.12 | 9 | Trang Quầy (/admin/orders) | TV2 | TV4 |
| [#50](https://github.com/PhucLee23/brewlite-assignment1/pull/50) | 03/11 19:57 | 3.16 | 7, 9 | Test e2e phân quyền: khách gọi API Quầy/Kho/Doanh thu bị 401/403 | TV2 | TV1, TV4 |
| [#49](https://github.com/PhucLee23/brewlite-assignment1/pull/49) | 03/11 19:57 | 3.17 | 9 | README bàn giao | TV5 | TV4 |
| [#51](https://github.com/PhucLee23/brewlite-assignment1/pull/51) | 03/11 21:17 | 3.18 | 9 | Kịch bản demo, bug bash, nghiệm thu cuối | TV2 | TV1, TV4 |
| [#52](https://github.com/PhucLee23/brewlite-assignment1/pull/52) | 03/11 22:50 | 3.14 | – | Biên bản Sprint Review và Retrospective (Sprint 3) | TV1 | TV4 |

Ngoài backlog: [#37](https://github.com/PhucLee23/brewlite-assignment1/pull/37) (01/11) bỏ file PDF đề bài khỏi repo, TV4.

## Quy ước review chéo

Nhóm thống nhất ở Sprint Planning đầu tiên. Trước khi merge, nhóm trưởng (TV4) chạy lại build và test của PR.

| Người làm | Người review | Ngoại lệ |
| --- | --- | --- |
| TV1 | TV3 | |
| TV2 | TV1 | Trang Quầy, trang 404 (3.12, 3.15) do TV5 review |
| TV3 | TV4 | |
| TV4 | TV3 | |
| TV5 | TV6 | API Doanh thu (3.7) do TV4 review |
| TV6 | TV5 | |
