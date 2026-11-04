# Sprint 3 – Thanh toán, trang nhân viên, Docker, bàn giao

| Sprint Goal | Task | Thời gian | Tổng |
| --- | --- | --- | --- |
| Khách thanh toán qua MoMo hoặc VNPay sandbox, xem xác nhận, lịch sử và biên lai; nhân viên có trang Quầy, Kho, Doanh thu; `docker compose` chạy đủ 3 dịch vụ; đủ test cho tiêu chí (a), (b), (c) của Task 10. | 8, 9, 10 | 2/11 – 3/11/2026 (bàn giao 4/11) | 64 SP |

## Sprint Planning

TV2 (PO) chủ trì, cả nhóm chốt Sprint Goal và chia hạng mục theo bản phân công.

- Mốc ưu tiên: Lõi thanh toán (3.1) làm trước vì cổng VNPay, MoMo và trang thanh toán đều cần; test e2e Task 10 (3.3) sau khi đủ hai cổng và điểm thưởng; API Quầy, Doanh thu xong thì mới làm trang tương ứng.
- Một hạng mục được tính xong khi PR của nó đã có Approve và merge vào `main`. Thứ tự merge và người review: [danh-sach-pr.md](danh-sach-pr.md).
- Hình thức và người tham dự: [...]

## Sprint Backlog

| Mã | Hạng mục | TV | SP | Task | File chính | Nhánh | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 3.1 | Lõi thanh toán: gateway.ts, POST /payments (idempotency), phiên 5 phút, settle, link quay về, tự tra cứu, IPN | TV4 | 8 | 8, 10 | `backend/src/payments/` | `feat/8-10-loi-thanh-toan` | Đã merge |
| 3.2 | Cổng VNPay (ký HMAC-SHA512) + unit test | TV4 | 3 | 8 | `backend/src/payments/gateways/vnpay.ts` | `feat/8-cong-vnpay` | Đã merge |
| 3.3 | Test e2e Task 10 (a)(b)(c), cổng giả fake-gateways.ts | TV4 | 5 | 10 | `backend/test/order-flow.e2e-spec.ts`, `fake-gateways.ts` | `test/10-e2e-task-10` | Đã merge |
| 3.4 | Cổng MoMo (HMAC-SHA256) + unit test, theo khuôn gateway.ts | TV4 | 3 | 8 | `backend/src/payments/gateways/momo.ts` | `feat/8-cong-momo` | Đã merge |
| 3.5 | Điểm thưởng: cộng khi PAID, thu hồi khi hủy, kèm test | TV2 | 2 | 10 | `backend/src/orders/pricing.ts`, `payments.service.ts` | `feat/10-diem-thuong` | Đã merge |
| 3.6 | API cho Quầy: GET /orders?status= (STAFF), hủy đơn đã PAID | TV3 | 3 | 9, 10 | `backend/src/orders/orders.service.ts`, `orders.controller.ts` | `feat/9-api-quay` | Đã merge |
| 3.7 | API Doanh thu (GET /payments, REFUND_DUE) + API biên lai | TV5 | 3 | 8, 9 | `backend/src/payments/payments.service.ts` | `feat/8-api-doanh-thu-bien-lai` | Đã merge |
| 3.8 | Chọn MoMo/VNPay (PaymentForm, ProviderLogo), trang chờ kết quả | TV6 | 5 | 8 | `frontend/src/components/PaymentForm.tsx`, `app/payments/[id]/page.tsx` | `feat/8-trang-thanh-toan` | Đã merge |
| 3.9 | Trang Kho (/admin/ingredients) | TV6 | 3 | 9 | `frontend/src/app/admin/ingredients/page.tsx` | `feat/9-trang-kho` | Đã merge |
| 3.10 | Trang Doanh thu (/admin/revenue) | TV6 | 3 | 8 | `frontend/src/app/admin/revenue/page.tsx` | `feat/8-trang-doanh-thu` | Đã merge |
| 3.11 | Trang đơn hàng (tự cập nhật, hủy), Lịch sử đơn, trang Biên lai | TV5 | 5 | 9 | `frontend/src/app/orders/`, `app/payments/[id]/receipt/page.tsx` | `feat/9-trang-don-hang-bien-lai` | Đã merge |
| 3.12 | Trang Quầy (/admin/orders) | TV2 | 3 | 9 | `frontend/src/app/admin/orders/page.tsx` | `feat/9-trang-quay` | Đã merge |
| 3.13 | Dockerfile frontend, compose 3 dịch vụ, xem-database.bat | TV1 | 3 | 9 | `frontend/Dockerfile`, `docker-compose.yml`, `xem-database.bat` | `feat/9-docker-frontend` | Đã merge |
| 3.14 | Biên bản Sprint Review và Retrospective cho 3 Sprint | TV1 | 3 | – | `docs/scrum/sprint-*.md` | `docs/sprint-1-review`, `docs/sprint-2-review`, `docs/sprint-3-review` | Đã merge |
| 3.15 | Trang 404, trang lỗi | TV2 | 2 | 3, 9 | `frontend/src/app/not-found.tsx`, `error.tsx` | `feat/3-9-trang-loi` | Đã merge |
| 3.16 | Test e2e phân quyền: khách gọi API Quầy/Kho/Doanh thu bị 401/403 | TV2 | 3 | 7, 9 | `backend/test/order-flow.e2e-spec.ts` | `test/7-9-e2e-phan-quyen` | Đã merge |
| 3.17 | README bàn giao | TV5 | 2 | 9 | `README.md` | `docs/9-readme-ban-giao` | Đã merge |
| 3.18 | Kịch bản demo, bug bash, nghiệm thu cuối | TV2 | 5 | 9 | `docs/scrum/test-case.md` | `docs/nghiem-thu-cuoi` | Đã merge |
| | **Tổng** | | **64** | | | | |

## Daily Scrum

TV1 (SM) chủ trì, 15 phút mỗi ngày; mỗi người trả lời: hôm qua làm gì, hôm nay làm gì, đang vướng gì. Chỉ ghi các buổi đã thật sự diễn ra.

| Ngày | Hình thức | Ghi chú (vướng mắc, ai cần hỗ trợ) |
| --- | --- | --- |
| 2/11 | [...] | [...] |
| 3/11 | [...] | [...] |

## Burndown

SP còn lại cuối ngày = tổng SP của Sprint trừ SP các hạng mục đã merge. TV1 cập nhật cột *Thực tế* sau Daily Scrum.

| Cuối ngày | Lý tưởng (SP còn lại) | Thực tế (SP còn lại) | Hạng mục đã merge trong ngày |
| --- | --- | --- | --- |
| Bắt đầu | 64 | 64 | – |
| 2/11 | 32 | [...] | [...] |
| 3/11 | 0 | [...] | [...] |

## Sprint Review

TV2 (PO) nghiệm thu theo tiêu chí chấp nhận trong [product-backlog.md](product-backlog.md). Tick ô nào đạt trong buổi Review.

- [ ] Task 8: thanh toán qua MoMo và VNPay sandbox; đơn chỉ `PAID` khi cổng xác nhận đúng chữ ký; thanh toán lỗi thì `PAYMENT_FAILED`, giỏ hàng giữ nguyên.
- [ ] Task 9: màn hình xác nhận có mã đơn, trạng thái; lịch sử đơn `GET /orders/me`; `docker compose up -d --build` chạy đủ 3 dịch vụ; README có hướng dẫn và kịch bản demo.
- [ ] Task 10: test (a) chặn chuyển trạng thái sai, (b) gửi 2 lần cùng `Idempotency-Key` chỉ tạo 1 đơn, (c) đặt đồng thời không vượt tồn kho đều qua.

Kết quả test trên `main` cuối Sprint: `npm test` (unit): 26/26 đạt; `npm run test:e2e`: 62/62 đạt.

Phản hồi của PO: [...]

## Sprint Retrospective

Ngay sau Review, TV1 (SM) chủ trì.

| Làm tốt | Cần cải thiện |
| --- | --- |
| [...] | [...] |

**Hành động cho phiên bản sau:** [...]

## Checklist ngày bàn giao (4/11/2026)

- [ ] `docker compose up -d --build` trên máy demo, mở được http://localhost:3000
- [ ] Chạy đúng [kịch bản demo](../../README.md#kịch-bản-demo-end-to-end) end-to-end
- [ ] Trình bày Retrospective (bảng trên)
- [ ] Ghi phản hồi của giảng viên vào mục *Backlog cho phiên bản sau* trong [product-backlog.md](product-backlog.md)
