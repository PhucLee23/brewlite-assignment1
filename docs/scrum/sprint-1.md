# Sprint 1 – Nền tảng, API sản phẩm, Menu, Chi tiết món

| Sprint Goal | Task | Thời gian | Tổng |
| --- | --- | --- | --- |
| Khách mở web thấy menu lấy từ CSDL (số ly còn tính từ nguyên liệu) và xem chi tiết món với giá theo size, topping. | 1, 2, 3, 4 | 28/10 – 30/10/2026 | 42 SP |

## Sprint Planning

TV2 (PO) chủ trì, cả nhóm chốt Sprint Goal và chia hạng mục theo bản phân công.

- Mốc ưu tiên: Khung backend (1.2) và khung frontend (1.6) làm trước; Prisma schema (1.3) xong thì mới làm seed và API sản phẩm; giao diện dùng chung (1.9) xong thì mới làm Menu và Chi tiết.
- Một hạng mục được tính xong khi PR của nó đã có Approve và merge vào `main`. Thứ tự merge và người review: [danh-sach-pr.md](danh-sach-pr.md).
- Hình thức và người tham dự: Hình thức online và tham dự đầy đủ

## Sprint Backlog

| Mã | Hạng mục | TV | SP | Task | File chính | Nhánh | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Repo, monorepo, .gitignore, mẫu PR, hướng dẫn Git | TV1 | 2 | 1 | `.gitignore`, `README.md`, `.github/pull_request_template.md` | `main` | Chưa làm |
| 1.2 | Khởi tạo NestJS + Prisma, ValidationPipe, compose PostgreSQL, .env.example | TV1 | 3 | 1 | `backend/src/main.ts`, `app.module.ts`, `app.setup.ts`, `docker-compose.yml` | `chore/1-khoi-tao-backend` | Chưa làm |
| 1.3 | schema.prisma đủ 11 bảng (có nguyên liệu, công thức) + migration | TV3 | 5 | 2, 10 | `backend/prisma/schema.prisma`, `migrations/` | `feat/2-prisma-schema` | Chưa làm |
| 1.4 | Seed: 15 món, 20 nguyên liệu, công thức, tài khoản mẫu, mã giảm giá | TV3 | 3 | 2 | `backend/prisma/seed.ts` | `feat/2-du-lieu-mau` | Chưa làm |
| 1.5 | GET /products, GET /products/:id; tính số ly còn bán từ nguyên liệu (inventory.ts) + unit test | TV3 | 5 | 2, 4 | `backend/src/products/`, `ingredients/inventory.ts` | `feat/2-api-san-pham` | Chưa làm |
| 1.6 | Khởi tạo Next.js + Tailwind, layout, api.ts, types.ts, format.ts | TV5 | 3 | 1 | `frontend/src/app/layout.tsx`, `lib/api.ts`, `lib/types.ts`, `lib/format.ts` | `chore/1-khoi-tao-frontend` | Chưa làm |
| 1.7 | Trang Menu | TV5 | 3 | 3 | `frontend/src/app/page.tsx`, `public/images/` | `feat/3-trang-menu` | Chưa làm |
| 1.8 | Trang Chi tiết món: size theo tồn kho, topping, tính giá | TV5 | 5 | 4 | `frontend/src/app/products/[id]/page.tsx` | `feat/4-chi-tiet-mon` | Chưa làm |
| 1.9 | Giao diện dùng chung (ui.tsx), Header + badge, store giỏ hàng | TV6 | 5 | 4, 5 | `frontend/src/components/ui.tsx`, `Header.tsx`, `store/cart.ts` | `feat/4-giao-dien-chung-gio-hang` | Chưa làm |
| 1.10 | State machine đơn hàng + unit test | TV4 | 3 | 10 | `backend/src/orders/order-state-machine.ts` | `feat/10-state-machine` | Chưa làm |
| 1.11 | Product Backlog, user story, api.md, burndown | TV2 | 5 | Tất cả | `docs/scrum/`, `docs/api.md` | `docs/backlog-sprint` | Chưa làm |
| | **Tổng** | | **42** | | | | |

## Daily Scrum

TV1 (SM) chủ trì, 15 phút mỗi ngày; mỗi người trả lời: hôm qua làm gì, hôm nay làm gì, đang vướng gì. Chỉ ghi các buổi đã thật sự diễn ra.

| Ngày | Hình thức | Ghi chú (vướng mắc, ai cần hỗ trợ) |
| --- | --- | --- |
| 28/10 | [...] | [...] |
| 29/10 | [...] | [...] |
| 30/10 | [...] | [...] |

## Burndown

SP còn lại cuối ngày = tổng SP của Sprint trừ SP các hạng mục đã merge. TV1 cập nhật cột *Thực tế* sau Daily Scrum.

| Cuối ngày | Lý tưởng (SP còn lại) | Thực tế (SP còn lại) | Hạng mục đã merge trong ngày |
| --- | --- | --- | --- |
| Bắt đầu | 42 | 42 | – |
| 28/10 | 28 | [...] | [...] |
| 29/10 | 14 | [...] | [...] |
| 30/10 | 0 | [...] | [...] |

## Sprint Review

TV1 ghi biên bản ở cuối Sprint.

## Sprint Retrospective

TV1 ghi biên bản ở cuối Sprint.
