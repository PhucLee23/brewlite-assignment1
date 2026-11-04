# Danh sách Pull Request

42 Pull Request cho 40 hạng mục của 3 Sprint (hạng mục 3.14 nộp thành 3 PR, mỗi Sprint một PR). Cột *Task* là task của đề bài mà PR phục vụ. PR có cột *Merge sau* phải chờ PR đó merge xong mới tạo nhánh; các PR không phụ thuộc nhau thì làm song song.

*STT* (PR01…PR42) là thứ tự merge để cả nhóm dễ gọi; GitHub tự đánh số riêng (#…, dùng chung dãy số với Issue), người mở PR điền số đó vào cột *PR trên GitHub* sau khi mở.

## Sprint 1: khởi tạo, CSDL, API sản phẩm, Menu, Chi tiết món

| STT | Hạng mục | Task | Nội dung | Người làm | Review | Merge sau | Nhánh | PR trên GitHub |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR01 | 1.1 | 1 | Repo, monorepo, .gitignore, mẫu PR, hướng dẫn Git | TV1 | – | – | `main` | (push thẳng `main`) |
| PR02 | 1.2 | 1 | Khởi tạo NestJS + Prisma, ValidationPipe, compose PostgreSQL, .env.example | TV1 | TV3 | – | `chore/1-khoi-tao-backend` |  |
| PR03 | 1.6 | 1 | Khởi tạo Next.js + Tailwind, layout, api.ts, types.ts, format.ts | TV5 | TV6 | – | `chore/1-khoi-tao-frontend` |  |
| PR04 | 1.11 | Tất cả | Product Backlog, user story, api.md, burndown | TV2 | TV1 | – | `docs/backlog-sprint` |  |
| PR05 | 1.3 | 2, 10 | schema.prisma đủ 11 bảng (có nguyên liệu, công thức) + migration | TV3 | TV4 | – | `feat/2-prisma-schema` |  |
| PR06 | 1.9 | 4, 5 | Giao diện dùng chung (ui.tsx), Header + badge, store giỏ hàng | TV6 | TV5 | – | `feat/4-giao-dien-chung-gio-hang` |  |
| PR07 | 1.4 | 2 | Seed: 15 món, 20 nguyên liệu, công thức, tài khoản mẫu, mã giảm giá | TV3 | TV4 | – | `feat/2-du-lieu-mau` |  |
| PR08 | 1.10 | 10 | State machine đơn hàng + unit test | TV4 | TV3 | – | `feat/10-state-machine` |  |
| PR09 | 1.5 | 2, 4 | GET /products, GET /products/:id; tính số ly còn bán từ nguyên liệu (inventory.ts) + unit test | TV3 | TV4 | 1.4 | `feat/2-api-san-pham` |  |
| PR10 | 1.7 | 3 | Trang Menu | TV5 | TV6 | – | `feat/3-trang-menu` |  |
| PR11 | 1.8 | 4 | Trang Chi tiết món: size theo tồn kho, topping, tính giá | TV5 | TV6 | 1.7 | `feat/4-chi-tiet-mon` |  |

## Sprint 2: đăng nhập, Docker backend, giỏ hàng, mã khuyến mãi, đặt đơn

| STT | Hạng mục | Task | Nội dung | Người làm | Review | Merge sau | Nhánh | PR trên GitHub |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR12 | 3.14a | – | Biên bản Sprint Review và Retrospective cho 3 Sprint (Sprint 1) | TV1 | TV3 | – | `docs/sprint-1-review` |  |
| PR13 | 2.1 | 7 | Đăng ký/đăng nhập bcrypt + JWT, JwtAuthGuard, RolesGuard (STAFF) | TV1 | TV3 | – | `feat/7-auth-jwt` |  |
| PR14 | 2.2 | 9 | Dockerfile backend, compose có backend (tự migrate + seed) | TV1 | TV3 | 2.1 | `feat/9-docker-backend` |  |
| PR15 | 2.4 | 7 | AuthForm, trang Đăng nhập/Đăng ký, store auth, useRequireAuth | TV5 | TV6 | – | `feat/7-dang-nhap-ui` |  |
| PR16 | 2.5 | 5 | Trang Giỏ hàng | TV6 | TV5 | – | `feat/5-trang-gio-hang` |  |
| PR17 | 2.3 | 10 | Mã khuyến mãi: GET /promotions/:code, hàm áp mã vào tổng tiền | TV1 | TV3 | – | `feat/10-ma-khuyen-mai` |  |
| PR18 | 2.8 | 9, 10 | Xem đơn của mình, xem chi tiết, hủy đơn (trả nguyên liệu, FOR UPDATE), đổi trạng thái qua transitionOrder | TV3 | TV4 | 2.3 | `feat/9-xem-huy-don` |  |
| PR19 | 2.9 | 2, 10 | API Kho: GET /ingredients, nhập kho | TV3 | TV4 | 2.8 | `feat/10-api-kho` |  |
| PR20 | 2.7 | 6, 10 | POST /orders: pricing.ts + unit test, trừ nguyên liệu bằng transaction + optimistic locking, idempotency, tự hủy đơn quá 5 phút | TV4 | TV3 | – | `feat/6-10-tao-don` |  |
| PR21 | 2.6 | 6 | Trang Checkout: nhập mã giảm giá, đặt đơn kèm Idempotency-Key | TV6 | TV5 | 2.7 | `feat/6-trang-checkout` |  |
| PR22 | 2.10 | 2, 7 | Test e2e API công khai: sản phẩm, đăng nhập, thời gian phản hồi < 500 ms | TV2 | TV1 | 2.7 | `test/2-7-e2e-api-cong-khai` |  |
| PR23 | 2.11 | – | Test case Sprint 2, nghiệm thu | TV2 | TV1 | 2.6, 2.10 | `docs/test-case-sprint-2` |  |

## Sprint 3: thanh toán MoMo/VNPay, Quầy, Kho, Doanh thu, nghiệm thu

| STT | Hạng mục | Task | Nội dung | Người làm | Review | Merge sau | Nhánh | PR trên GitHub |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PR24 | 3.14b | – | Biên bản Sprint Review và Retrospective cho 3 Sprint (Sprint 2) | TV1 | TV3 | – | `docs/sprint-2-review` |  |
| PR25 | 3.1 | 8, 10 | Lõi thanh toán: gateway.ts, POST /payments (idempotency), phiên 5 phút, settle, link quay về, tự tra cứu, IPN | TV4 | TV3 | – | `feat/8-10-loi-thanh-toan` |  |
| PR26 | 3.13 | 9 | Dockerfile frontend, compose 3 dịch vụ, xem-database.bat | TV1 | TV3 | – | `feat/9-docker-frontend` |  |
| PR27 | 3.15 | 3, 9 | Trang 404, trang lỗi | TV2 | TV5 | – | `feat/3-9-trang-loi` |  |
| PR28 | 3.2 | 8 | Cổng VNPay (ký HMAC-SHA512) + unit test | TV4 | TV3 | – | `feat/8-cong-vnpay` |  |
| PR29 | 3.4 | 8 | Cổng MoMo (HMAC-SHA256) + unit test, theo khuôn gateway.ts | TV4 | TV3 | 3.2 | `feat/8-cong-momo` |  |
| PR30 | 3.5 | 10 | Điểm thưởng: cộng khi PAID, thu hồi khi hủy, kèm test | TV2 | TV1 | 3.4 | `feat/10-diem-thuong` |  |
| PR31 | 3.8 | 8 | Chọn MoMo/VNPay (PaymentForm, ProviderLogo), trang chờ kết quả | TV6 | TV5 | – | `feat/8-trang-thanh-toan` |  |
| PR32 | 3.3 | 10 | Test e2e Task 10 (a)(b)(c), cổng giả fake-gateways.ts | TV4 | TV3 | – | `test/10-e2e-task-10` |  |
| PR33 | 3.6 | 9, 10 | API cho Quầy: GET /orders?status= (STAFF), hủy đơn đã PAID | TV3 | TV4 | 3.3 | `feat/9-api-quay` |  |
| PR34 | 3.7 | 8, 9 | API Doanh thu (GET /payments, REFUND_DUE) + API biên lai | TV5 | TV4 | 3.6 | `feat/8-api-doanh-thu-bien-lai` |  |
| PR35 | 3.11 | 9 | Trang đơn hàng (tự cập nhật, hủy), Lịch sử đơn, trang Biên lai | TV5 | TV6 | 3.7 | `feat/9-trang-don-hang-bien-lai` |  |
| PR36 | 3.9 | 9 | Trang Kho (/admin/ingredients) | TV6 | TV5 | 3.11 | `feat/9-trang-kho` |  |
| PR37 | 3.10 | 8 | Trang Doanh thu (/admin/revenue) | TV6 | TV5 | – | `feat/8-trang-doanh-thu` |  |
| PR38 | 3.12 | 9 | Trang Quầy (/admin/orders) | TV2 | TV5 | 3.10 | `feat/9-trang-quay` |  |
| PR39 | 3.16 | 7, 9 | Test e2e phân quyền: khách gọi API Quầy/Kho/Doanh thu bị 401/403 | TV2 | TV1 | – | `test/7-9-e2e-phan-quyen` |  |
| PR40 | 3.17 | 9 | README bàn giao | TV5 | TV6 | – | `docs/9-readme-ban-giao` |  |
| PR41 | 3.18 | 9 | Kịch bản demo, bug bash, nghiệm thu cuối | TV2 | TV1 | 3.12, 3.16, 3.17 | `docs/nghiem-thu-cuoi` |  |
| PR42 | 3.14c | – | Biên bản Sprint Review và Retrospective cho 3 Sprint (Sprint 3) | TV1 | TV3 | 3.18 | `docs/sprint-3-review` |  |

## Review chéo

| Người làm | Người review | Ngoại lệ |
| --- | --- | --- |
| TV1 | TV3 | |
| TV2 | TV1 | Trang Quầy, trang 404 (3.12, 3.15) do TV5 review |
| TV3 | TV4 | |
| TV4 | TV3 | |
| TV5 | TV6 | API Doanh thu (3.7) do TV4 review |
| TV6 | TV5 | |
