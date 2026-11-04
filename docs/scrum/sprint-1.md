# Sprint 1 – Nền tảng, API sản phẩm, Menu, Chi tiết món

| Sprint Goal | Task | Thời gian | Tổng |
| --- | --- | --- | --- |
| Khách mở web thấy menu lấy từ CSDL (số ly còn tính từ nguyên liệu) và xem chi tiết món với giá theo size, topping. | 1, 2, 3, 4 | 28/10 – 30/10/2026 | 42 SP |

## Sprint Planning

TV2 (PO) chủ trì, cả nhóm chốt Sprint Goal và chia hạng mục theo bản phân công.

- Mốc ưu tiên: Khung backend (1.2) và khung frontend (1.6) làm trước; Prisma schema (1.3) xong thì mới làm seed và API sản phẩm; giao diện dùng chung (1.9) xong thì mới làm Menu và Chi tiết.
- Một hạng mục được tính xong khi PR của nó đã có Approve và merge vào `main`. Người review theo quy ước review chéo trong [danh-sach-pr.md](danh-sach-pr.md).
- Hình thức và người tham dự: [...]

## Sprint Backlog

| Mã | Hạng mục | TV | SP | Task | PR | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| 1.1 | Repo, monorepo, .gitignore, mẫu PR, hướng dẫn Git | TV1 | 2 | 1 | – (push thẳng `main`) | Đã merge |
| 1.2 | Khởi tạo NestJS + Prisma, ValidationPipe, compose PostgreSQL, .env.example | TV1 | 3 | 1 | [#1](https://github.com/PhucLee23/brewlite-assignment1/pull/1) | Đã merge |
| 1.3 | schema.prisma đủ 11 bảng (có nguyên liệu, công thức) + migration | TV3 | 5 | 2, 10 | [#13](https://github.com/PhucLee23/brewlite-assignment1/pull/13) | Đã merge |
| 1.4 | Seed: 15 món, 20 nguyên liệu, công thức, tài khoản mẫu, mã giảm giá | TV3 | 3 | 2 | [#14](https://github.com/PhucLee23/brewlite-assignment1/pull/14) | Đã merge |
| 1.5 | GET /products, GET /products/:id; tính số ly còn bán từ nguyên liệu (inventory.ts) + unit test | TV3 | 5 | 2, 4 | [#18](https://github.com/PhucLee23/brewlite-assignment1/pull/18) | Đã merge |
| 1.6 | Khởi tạo Next.js + Tailwind, layout, api.ts, types.ts, format.ts | TV5 | 3 | 1 | [#12](https://github.com/PhucLee23/brewlite-assignment1/pull/12) | Đã merge |
| 1.7 | Trang Menu | TV5 | 3 | 3 | [#19](https://github.com/PhucLee23/brewlite-assignment1/pull/19) | Đã merge |
| 1.8 | Trang Chi tiết món: size theo tồn kho, topping, tính giá | TV5 | 5 | 4 | [#27](https://github.com/PhucLee23/brewlite-assignment1/pull/27) | Đã merge |
| 1.9 | Giao diện dùng chung (ui.tsx), Header + badge, store giỏ hàng | TV6 | 5 | 4, 5 | [#17](https://github.com/PhucLee23/brewlite-assignment1/pull/17) | Đã merge |
| 1.10 | State machine đơn hàng + unit test | TV4 | 3 | 10 | [#16](https://github.com/PhucLee23/brewlite-assignment1/pull/16) | Đã merge |
| 1.11 | Product Backlog, user story, api.md, burndown | TV2 | 5 | Tất cả | [#15](https://github.com/PhucLee23/brewlite-assignment1/pull/15) | Đã merge |
| | **Tổng** | | **42** | | | |

## Daily Scrum

TV1 (SM) chủ trì, 15 phút mỗi ngày; mỗi người trả lời: hôm qua làm gì, hôm nay làm gì, đang vướng gì. Chỉ ghi các buổi đã thật sự diễn ra.

| Ngày | Hình thức | Ghi chú (vướng mắc, ai cần hỗ trợ) |
| --- | --- | --- |
| 28/10 | [...] | [...] |
| 29/10 | [...] | [...] |
| 30/10 | [...] | [...] |

## Burndown

SP còn lại cuối ngày = tổng SP của Sprint trừ SP các hạng mục đã merge vào `main` (theo giờ merge trên GitHub).

| Cuối ngày | Lý tưởng (SP còn lại) | Thực tế (SP còn lại) | Hạng mục đã merge trong ngày |
| --- | --- | --- | --- |
| Bắt đầu | 42 | 42 | – |
| 28/10 | 28 | 40 | 1.1 |
| 29/10 | 14 | 13 | 1.2, 1.3, 1.4, 1.6, 1.9, 1.10, 1.11 |
| 30/10 | 0 | 5 | 1.5, 1.7 |
| 31/10 | 0 | 0 | 1.8 |

Ngày 28/10 mới xong 1.1 nên đường thực tế nằm trên đường lý tưởng; ngày 29/10 merge 7 hạng mục và vượt lên. Hạng mục 1.8 (Chi tiết món) merge ngày 31/10, Sprint 1 xong trễ 1 ngày so với kế hoạch.

## Sprint Review

TV2 (PO) nghiệm thu theo tiêu chí chấp nhận trong [product-backlog.md](product-backlog.md). Tick ô nào đạt trong buổi Review.

- [ ] Task 1: `GET /` trả "Hello BrewLite"; web mở được; có README, `.gitignore`, `.env.example`, mẫu PR.
- [ ] Task 2: `GET /products` trả id, tên, giá, ảnh và số ly còn (tính từ nguyên liệu) từ CSDL đã seed.
- [ ] Task 3: trang Menu có lưới sản phẩm, trạng thái đang tải, menu trống, lỗi kết nối.
- [ ] Task 4: đổi size, topping, số lượng thì thành tiền cập nhật ngay; size hết nguyên liệu bị khóa.

Kết quả test trên `main` cuối Sprint: `npm test` (unit): 16/16 đạt.

Phản hồi của PO: [...]

## Sprint Retrospective

Ngay sau Review, TV1 (SM) chủ trì.

| Làm tốt | Cần cải thiện |
| --- | --- |
| [...] | [...] |

**Hành động cho Sprint 2:** [...]
