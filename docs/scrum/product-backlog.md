# Product Backlog – BrewLite

**Product Vision:** "BrewLite giúp khách hàng đặt và thanh toán đồ uống **không dùng tiền mặt** chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."

**Kế hoạch:** 3 Sprint theo gợi ý của đề (mục 2.3), tổng **150 SP**, từ 28/10 đến 3/11/2026, bàn giao ngày 4/11/2026. Mỗi thành viên có code ở cả 3 Sprint. Pull Request đã merge: [danh-sach-pr.md](danh-sach-pr.md).

## Nhóm Scrum

| TV | Họ tên | GitHub | Vai | Phần phụ trách chính |
| --- | --- | --- | --- | --- |
| TV1 | Phạm Tuyết Nhi | `phamtuyetnhi756-droid` | Scrum Master | Khung backend, JWT + phân quyền, mã khuyến mãi, Docker, biên bản Sprint |
| TV2 | Lê Trương Thảo My | `M-y-n-e` | Product Owner | Backlog, 2 bộ test e2e, điểm thưởng, trang Quầy, trang 404/lỗi, nghiệm thu, kịch bản demo |
| TV3 | Lý Ngọc Uyên Phương | `uly2869-collab` | Developer (backend) | CSDL + seed, API sản phẩm (tính từ nguyên liệu), API đơn hàng, API Quầy và Kho |
| TV4 | Lê Ngọc Phúc | `PhucLee23` | Developer (backend), nhóm trưởng | State machine, tạo đơn (tính giá, khóa tồn kho), lõi thanh toán + VNPay, MoMo, test e2e Task 10 |
| TV5 | Nguyễn Lê Bảo Yến Vy | `nlbyv2107-del` | Developer (frontend lead) | Khung Next.js, Menu, Chi tiết, Đăng nhập, trang đơn + biên lai, API Doanh thu, README |
| TV6 | Mai Thu Hường | `LauraaMao` | Developer (frontend) | Giao diện chung, Giỏ hàng, Checkout, trang thanh toán, trang Kho, trang Doanh thu |

## Backlog theo task

1 SP ≈ 1,5 giờ làm việc. Sprint 1 có 42 SP, Sprint 2 có 44 SP, Sprint 3 có 64 SP; hạng mục chi tiết nằm trong file của từng Sprint.

| # | Task (Story) | User story | Sprint | Thành viên | Hạng mục | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Khởi tạo dự án và cấu trúc | TS-01 | 1 | TV1, TV5 | 1.1, 1.2, 1.6 | Hoàn thành |
| 2 | API danh sách sản phẩm | US-01, US-13 | 1, 2 | TV3, TV2 | 1.3, 1.4, 1.5, 2.9, 2.10 | Hoàn thành |
| 3 | Trang Menu | US-01 | 1, 3 | TV5, TV2 | 1.7, 3.15 | Hoàn thành |
| 4 | Chi tiết và tùy chọn sản phẩm | US-02 | 1 | TV3, TV5, TV6 | 1.5, 1.8, 1.9 | Hoàn thành |
| 5 | Giỏ hàng | US-03 | 1, 2 | TV6 | 1.9, 2.5 | Hoàn thành |
| 6 | API tạo đơn hàng | US-05 | 2 | TV6, TV4 | 2.6, 2.7 | Hoàn thành |
| 7 | Đăng ký / Đăng nhập (JWT) | US-04 | 2, 3 | TV1, TV5, TV2 | 2.1, 2.4, 2.10, 3.16 | Hoàn thành |
| 8 | Thanh toán không tiền mặt | US-05, US-11 | 3 | TV4, TV5, TV6 | 3.1, 3.2, 3.4, 3.7, 3.8, 3.10 | Hoàn thành |
| 9 | Xác nhận, lịch sử đơn và bàn giao | US-06, US-12 | 2, 3 | TV1, TV3, TV5, TV6, TV2 | 2.2, 2.8, 3.6, 3.7, 3.9, 3.11, 3.12, 3.13, 3.15, 3.16, 3.17, 3.18 | Hoàn thành |
| 10 | Nghiệp vụ backend | US-07 → US-10, US-13 | 1, 2, 3 | TV3, TV4, TV1, TV2 | 1.3, 1.10, 2.3, 2.7, 2.8, 2.9, 3.1, 3.3, 3.5, 3.6 | Hoàn thành |

## User Story và tiêu chí chấp nhận

Đánh số theo yêu cầu chức năng (mục 4.1 của đề), nên US-05 trùng với user story mẫu của đề. PO tick ô khi đã kiểm thử đạt.

### TS-01 – Khởi tạo dự án (Task 1)
*Là* nhóm phát triển, *chúng tôi muốn* có sẵn monorepo frontend + backend chạy được, *để* mọi người code song song ngay từ ngày đầu.
- [x] Có `frontend/` (Next.js) và `backend/` (NestJS); `GET /` trả về "Hello BrewLite".
- [x] Có README, `.gitignore`, `.env.example` cho cả hai phía và mẫu Pull Request.
- [x] `docker compose up -d db` chạy được PostgreSQL.
- [x] Mọi thay đổi sau commit đầu tiên đi qua Pull Request có người review.

### US-01 – Xem menu (Task 2, 3)
*Là* khách hàng, *tôi muốn* xem danh sách đồ uống kèm hình, tên và giá, *để* chọn món nhanh.
- [x] `GET /products` trả về JSON gồm id, tên, giá, ảnh lấy từ CSDL đã seed.
- [x] Trang chủ hiển thị lưới sản phẩm, có trạng thái đang tải, menu trống và lỗi kết nối.
- [x] Món hết hàng hiện nhãn "Hết hàng"; món còn ≤ 5 ly hiện số ly còn lại.
- [x] Có test e2e cho `GET /products` và `GET /products/:id`: đủ trường, món không tồn tại trả 404, id không phải số trả 400.
- [x] Gõ sai địa chỉ thì hiện trang 404 tiếng Việt có nút về menu; trang gặp lỗi khi hiển thị thì hiện trang lỗi có nút Thử lại.

### US-02 – Chọn size và topping (Task 4)
*Là* khách hàng, *tôi muốn* chọn size S/M/L và topping, *để* có ly đúng ý.
- [x] Trang chi tiết có size S (giá gốc), M (+5.000đ), L (+10.000đ) và danh sách topping.
- [x] Thành tiền cập nhật ngay khi đổi size, topping hoặc số lượng.
- [x] Size hoặc topping hết nguyên liệu thì không chọn được; món hết hàng thì nút "Thêm vào giỏ" bị khóa.

### US-03 – Giỏ hàng (Task 5)
*Là* khách hàng, *tôi muốn* thêm, sửa số lượng và xóa món trong giỏ, *để* điều chỉnh đơn trước khi trả tiền.
- [x] Cùng món, cùng size, cùng topping thì gộp thành một dòng.
- [x] Tổng tiền và badge số lượng trên header tự cập nhật.
- [x] Giỏ hàng lưu bằng Zustand và còn nguyên khi tải lại trang; không chọn vượt số ly còn lại.

### US-04 – Đăng ký / Đăng nhập (Task 7)
*Là* khách hàng, *tôi muốn* có tài khoản, *để* đặt đơn và tích điểm.
- [x] `POST /auth/register` và `POST /auth/login` trả về JWT; mật khẩu lưu dạng băm bcrypt.
- [x] Route đặt đơn và thanh toán trả 401 khi chưa có token hợp lệ.
- [x] Bấm thanh toán khi chưa đăng nhập thì chuyển sang trang đăng nhập, đăng nhập xong quay lại trang thanh toán.
- [x] Token hết hạn thì tự đăng xuất và về trang đăng nhập.
- [x] Có test e2e: đăng ký trùng email trả 409, dữ liệu sai trả 400, sai mật khẩu và email chưa đăng ký đều trả 401 cùng một thông báo.

### US-05 – Thanh toán không tiền mặt (Task 6, 8)
*Là* khách hàng, *tôi muốn* thanh toán đơn bằng ví điện tử hoặc thẻ, *để* không cần mang tiền mặt.
- [x] Khi giỏ hàng có ít nhất 1 sản phẩm, nút "Thanh toán" hiển thị tổng tiền.
- [x] `POST /orders` validate dữ liệu bằng class-validator, server tự tính lại giá và lưu đơn `PENDING`.
- [x] Chọn MoMo hoặc VNPay rồi trả tiền trên trang thanh toán của cổng (sandbox); đơn chỉ chuyển sang `PAID` khi cổng xác nhận và chữ ký của cổng hợp lệ.
- [x] Kết quả cổng gửi về bị sửa chữ ký hoặc số tiền thì bị từ chối (400).
- [x] Thanh toán lỗi (khách hủy trên cổng, thẻ bị từ chối hoặc quá 5 phút) thì đơn ở `PAYMENT_FAILED` và giỏ hàng giữ nguyên; thử lại không tạo đơn mới, được chọn cổng khác.
- [x] Sau khi thành công, hiển thị mã đơn, màn hình xác nhận và biên lai có mã giao dịch của cổng.

### US-06 – Xác nhận và lịch sử đơn (Task 9)
*Là* khách hàng, *tôi muốn* xem mã đơn, trạng thái và các đơn đã đặt, *để* biết khi nào tới quầy lấy nước.
- [x] Màn hình xác nhận có mã đơn, trạng thái và lời nhắc tới quầy; tự cập nhật khi quầy đổi trạng thái.
- [x] `GET /orders/me` trả về đơn của chính người dùng, mới nhất trước.
- [x] `docker compose up -d --build` chạy đủ 3 dịch vụ; README có hướng dẫn và kịch bản demo.

### US-07 – Không bị trừ tiền hai lần (Task 10)
*Là* khách hàng, *tôi muốn* bấm lại nút đặt đơn, thanh toán khi mạng chậm mà không bị tạo đơn hay trừ tiền lần nữa.
- [x] `POST /payments` bắt buộc header `Idempotency-Key`; gửi lại cùng key trả về phiên cũ, không gọi cổng lần hai.
- [x] `POST /orders` gửi lại cùng key trả lại đúng đơn cũ.
- [x] Cổng gửi kết quả nhiều lần (link quay về, tra cứu, IPN) thì backend chỉ xử lý một lần, không cộng điểm hai lần.
- [x] Có test (b): gửi 2 lần cùng key chỉ tạo 1 đơn / 1 phiên thanh toán.

### US-08 – Không bán quá số lượng còn lại (Task 10)
*Là* quản lý cửa hàng, *tôi muốn* hệ thống không nhận đơn vượt tồn kho, *để* không phải từ chối khách tại quầy.
- [x] Tạo đơn trong transaction, trừ nguyên liệu bằng optimistic locking (`version`), khóa theo `id` tăng dần.
- [x] Có test (c): nhiều khách đặt đồng thời không làm tồn kho âm.
- [x] Đơn chưa thanh toán quá 5 phút tự hủy và trả nguyên liệu về kho.

### US-09 – Mã giảm giá và điểm thưởng (Task 10)
*Là* khách hàng thân thiết, *tôi muốn* dùng mã giảm giá và được cộng điểm, *để* có lý do quay lại.
- [x] Mã hợp lệ được trừ vào tổng tiền; mã sai, hết hạn hoặc chưa đủ giá trị đơn tối thiểu bị từ chối kèm lý do.
- [x] Cộng 1 điểm cho mỗi 1.000đ, chỉ khi đơn sang `PAID`; hủy đơn đã `PAID` thì thu hồi điểm.

### US-10 – Theo dõi trạng thái đơn (Task 10)
*Là* barista, *tôi muốn* cập nhật trạng thái pha chế, *để* khách biết khi nào lấy nước.
- [x] Đơn đi đúng luồng `PENDING → PAID → PREPARING → READY → COMPLETED`.
- [x] Mọi chuyển tiếp không có trong sơ đồ (mục 9.1 của đề) bị `assertTransition` chặn và trả 409.
- [x] Có test (a) chứng minh chuyển trạng thái sai bị chặn.

### US-11 – Xem doanh thu (Task 8)
*Là* nhân viên cửa hàng, *tôi muốn* xem số tiền đã vào và từng giao dịch, *để* đối chiếu với cổng thanh toán.
- [x] Chỉ tài khoản nhân viên (STAFF) mở được trang Doanh thu; khách gọi `GET /payments` bị 403.
- [x] Tổng tiền chỉ tính giao dịch đã được cổng xác nhận thành công; mỗi giao dịch có cổng, mã giao dịch của cổng và link biên lai.
- [x] Lọc được theo trạng thái: thành công, cần hoàn tiền, đang chờ, thất bại, hết hạn.
- [x] Giao dịch của đơn đã bị hủy hiện ở mục *Cần hoàn tiền*, không tính vào tiền đã vào.

### US-12 – Xử lý đơn tại quầy (Task 9, 10)
*Là* barista, *tôi muốn* thấy các đơn đã thanh toán và bấm nút theo từng bước pha chế, *để* khách biết đơn đang ở bước nào.
- [x] Chỉ tài khoản nhân viên mở được trang Quầy; khách gọi `GET /orders` bị 403.
- [x] Chỉ đơn đã thanh toán lên quầy, đơn trả tiền trước xếp trước; mỗi nhóm có số đơn.
- [x] Nút *Nhận đơn*, *Pha xong*, *Đã giao khách* đưa đơn qua `PREPARING`, `READY`, `COMPLETED`.
- [x] Khách và nhân viên hủy được đơn đã `PAID` khi chưa pha; từ `PREPARING` trở đi không ai hủy được.

### US-13 – Tồn kho theo nguyên liệu (Task 2, 10)
*Là* quản lý cửa hàng, *tôi muốn* số ly còn bán được tính từ nguyên liệu theo công thức pha chế, *để* không nhận đơn khi đã hết nguyên liệu.
- [x] Mỗi món và topping có công thức nguyên liệu; size M tốn 125%, size L tốn 150% so với size S (làm tròn lên), ly nhựa mỗi ly 1 cái.
- [x] Số ly còn bán được do nguyên liệu hết trước quyết định; các món dùng chung nguyên liệu giảm cùng nhau.
- [x] Không đủ nguyên liệu thì 409 và không trừ gì; hủy đơn trả lại đúng lượng đã trừ.
- [x] Chỉ nhân viên mở được trang Kho: tồn từng nguyên liệu, nguyên liệu hết trước của từng món, nhập thêm hàng.

## Definition of Done

Một task chỉ được tính điểm khi:
1. Code chạy được, không lỗi build, đạt tiêu chí chấp nhận ở trên.
2. Có commit trên Git với mô tả rõ ràng và Pull Request đã được người review chéo duyệt.
3. API có validate đầu vào; UI xử lý trạng thái đang tải và lỗi.
4. README có hướng dẫn chạy.

## Kết quả nghiệm thu

PO nghiệm thu trên `main` sau khi merge đủ hạng mục của 3 Sprint, chạy bằng `docker compose up -d --build`. Danh sách test case và kết quả: [test-case.md](test-case.md).

| Cách kiểm thử | Kết quả | Tiêu chí được chứng minh |
| --- | --- | --- |
| `cd backend && npm test` (unit test) | 26/26 đạt | State machine (US-10), tính giá và mã giảm giá (US-02, US-09), lượng nguyên liệu theo size (US-13), chữ ký MoMo, VNPay (US-05) |
| `cd backend && npm run test:e2e` (PostgreSQL thật) | 62/62 đạt | API sản phẩm, đăng ký/đăng nhập, thời gian phản hồi < 500 ms (US-01, US-04, mục 4.2 của đề); (a) chặn chuyển trạng thái sai (US-10); (b) Idempotency-Key (US-07); (c) đặt đồng thời không vượt tồn kho (US-08); thanh toán MoMo, VNPay với cổng giả lập ký đúng như cổng thật (US-05); điểm thưởng (US-09); Doanh thu, Quầy, Kho chỉ cho nhân viên (US-11, US-12, US-13) |
| Thao tác trên giao diện theo [kịch bản demo](../../README.md#kịch-bản-demo-end-to-end) | [...] | US-01 – US-06, US-11 – US-13 |

## Backlog cho phiên bản sau

Thêm vào đây phản hồi của "khách hàng" (giảng viên) sau buổi demo.

| Hạng mục | Nguồn | Ghi chú |
| --- | --- | --- |
| Bảo vệ nhánh `main` (bắt buộc PR, bắt buộc Approve) | Nghiệm thu TS-01 | Repo private gói miễn phí của GitHub không bật được; nhóm tự giữ quy tắc đi qua PR |
| Hoàn tiền tự động qua API hoàn tiền của MoMo, VNPay | Nghiệm thu US-11 | Hiện trang Doanh thu chỉ đánh dấu *Cần hoàn tiền*, quầy hoàn tay |
| Dùng điểm thưởng để giảm giá | Nhóm | Hiện chỉ cộng và thu hồi điểm |
| Thông báo cho khách khi đơn sang `READY` | Nhóm | Hiện trang đơn tự cập nhật mỗi 5 giây |
| Tự hủy đơn quá hạn bằng tác vụ định kỳ | Nhóm | Hiện kiểm tra mỗi khi có đơn mới |
| Lịch sử nhập kho (ai nhập, lúc nào, bao nhiêu) | Nghiệm thu US-13 | Hiện chỉ cộng vào tồn |
| Nhận IPN của MoMo, VNPay trên máy chủ có địa chỉ công khai | Nghiệm thu US-05 | Trên máy cá nhân backend tự tra cứu cổng |
| [...] | Phản hồi của giảng viên | |
