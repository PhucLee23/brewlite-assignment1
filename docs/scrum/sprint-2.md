# Sprint 2 – Giỏ hàng, đặt đơn, đăng nhập

| Sprint Goal | Task | Thời gian | Tổng |
| --- | --- | --- | --- |
| Khách đăng nhập, sửa giỏ hàng, nhập mã giảm giá và đặt được đơn PENDING; đặt đồng thời không vượt tồn kho nguyên liệu. | 5, 6, 7 | 31/10 – 1/11/2026 | 44 SP |

## Sprint Planning

TV2 (PO) chủ trì, cả nhóm chốt Sprint Goal và chia hạng mục theo bản phân công.

- Mốc ưu tiên: JWT (2.1) làm trước vì API đơn hàng cần đăng nhập; mã khuyến mãi (2.3) và xem/hủy đơn (2.8) xong trước khi làm tạo đơn (2.7); tạo đơn xong thì nối trang Checkout (2.6).
- Một hạng mục được tính xong khi PR của nó đã có Approve và merge vào `main`. Thứ tự merge và người review: [danh-sach-pr.md](danh-sach-pr.md).
- Hình thức và người tham dự: [...]

## Sprint Backlog

| Mã | Hạng mục | TV | SP | Task | File chính | Nhánh | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2.1 | Đăng ký/đăng nhập bcrypt + JWT, JwtAuthGuard, RolesGuard (STAFF) | TV1 | 5 | 7 | `backend/src/auth/` | `feat/7-auth-jwt` | Đã merge |
| 2.2 | Dockerfile backend, compose có backend (tự migrate + seed) | TV1 | 3 | 9 | `backend/Dockerfile`, `docker-compose.yml` | `feat/9-docker-backend` | Đã merge |
| 2.3 | Mã khuyến mãi: GET /promotions/:code, hàm áp mã vào tổng tiền | TV1 | 3 | 10 | `backend/src/promotions/`, `orders/pricing.ts` | `feat/10-ma-khuyen-mai` | Đã merge |
| 2.4 | AuthForm, trang Đăng nhập/Đăng ký, store auth, useRequireAuth | TV5 | 3 | 7 | `frontend/src/components/AuthForm.tsx`, `store/auth.ts`, `lib/hooks.ts` | `feat/7-dang-nhap-ui` | Đã merge |
| 2.5 | Trang Giỏ hàng | TV6 | 5 | 5 | `frontend/src/app/cart/page.tsx` | `feat/5-trang-gio-hang` | Đã merge |
| 2.6 | Trang Checkout: nhập mã giảm giá, đặt đơn kèm Idempotency-Key | TV6 | 3 | 6 | `frontend/src/app/checkout/page.tsx`, `lib/orderKey.ts` | `feat/6-trang-checkout` | Đã merge |
| 2.7 | POST /orders: pricing.ts + unit test, trừ nguyên liệu bằng transaction + optimistic locking, idempotency, tự hủy đơn quá 5 phút | TV4 | 8 | 6, 10 | `backend/src/orders/orders.service.ts`, `pricing.ts`, `common/idempotency.ts` | `feat/6-10-tao-don` | Đã merge |
| 2.8 | Xem đơn của mình, xem chi tiết, hủy đơn (trả nguyên liệu, FOR UPDATE), đổi trạng thái qua transitionOrder | TV3 | 5 | 9, 10 | `backend/src/orders/orders.service.ts`, `orders.controller.ts` | `feat/9-xem-huy-don` | Đã merge |
| 2.9 | API Kho: GET /ingredients, nhập kho | TV3 | 3 | 2, 10 | `backend/src/ingredients/` | `feat/10-api-kho` | Đã merge |
| 2.10 | Test e2e API công khai: sản phẩm, đăng nhập, thời gian phản hồi < 500 ms | TV2 | 3 | 2, 7 | `backend/test/api-public.e2e-spec.ts` | `test/2-7-e2e-api-cong-khai` | Đã merge |
| 2.11 | Test case Sprint 2, nghiệm thu | TV2 | 3 | – | `docs/scrum/test-case.md` | `docs/test-case-sprint-2` | Đã merge |
| | **Tổng** | | **44** | | | | |

## Daily Scrum

TV1 (SM) chủ trì, 15 phút mỗi ngày; mỗi người trả lời: hôm qua làm gì, hôm nay làm gì, đang vướng gì. Chỉ ghi các buổi đã thật sự diễn ra.

| Ngày | Hình thức | Ghi chú (vướng mắc, ai cần hỗ trợ) |
| --- | --- | --- |
| 31/10 | [...] | [...] |
| 1/11 | [...] | [...] |

## Burndown

SP còn lại cuối ngày = tổng SP của Sprint trừ SP các hạng mục đã merge. TV1 cập nhật cột *Thực tế* sau Daily Scrum.

| Cuối ngày | Lý tưởng (SP còn lại) | Thực tế (SP còn lại) | Hạng mục đã merge trong ngày |
| --- | --- | --- | --- |
| Bắt đầu | 44 | 44 | – |
| 31/10 | 22 | [...] | [...] |
| 1/11 | 0 | [...] | [...] |

## Sprint Review

TV2 (PO) nghiệm thu theo tiêu chí chấp nhận trong [product-backlog.md](product-backlog.md). Tick ô nào đạt trong buổi Review.

- [ ] Task 5: thêm, sửa số lượng, xóa món trong giỏ; tổng tiền và badge trên header tự cập nhật; tải lại trang vẫn còn giỏ.
- [ ] Task 6: `POST /orders` validate dữ liệu, server tự tính giá và lưu đơn `PENDING`; gửi lại cùng `Idempotency-Key` không tạo đơn thứ hai.
- [ ] Task 7: đăng ký, đăng nhập trả JWT; mật khẩu băm bcrypt; chưa đăng nhập mà vào Checkout thì chuyển sang trang Đăng nhập.
- [ ] Task 10 (phần Sprint 2): mã giảm giá, trừ nguyên liệu bằng optimistic locking, hủy đơn trả nguyên liệu, tự hủy đơn quá 5 phút.

Kết quả test trên `main` cuối Sprint: `npm test` (unit): 19/19 đạt; `npm run test:e2e`: 11/11 đạt.

Phản hồi của PO: [...]

## Sprint Retrospective

Ngay sau Review, TV1 (SM) chủ trì.

| Làm tốt | Cần cải thiện |
| --- | --- |
| [...] | [...] |

**Hành động cho Sprint 3:** [...]
