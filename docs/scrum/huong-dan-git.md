# Quy trình làm việc với Git

Nhóm dùng một repository chung trên GitHub. Mỗi hạng mục trong Sprint Backlog được làm trên một nhánh riêng, mở Pull Request (PR), có người review chéo rồi mới merge vào `main`. Ai phụ trách PR nào, ai review, nằm trong [danh-sach-pr.md](danh-sach-pr.md).

## Ba quy tắc

1. **Làm theo thứ tự phụ thuộc.** Phần nào cần phần khác có trước (ví dụ giao diện cần API, API cần Prisma schema) thì chờ phần kia merge rồi mới mở PR. Các PR không đụng file của nhau thì làm song song.
2. **Hiểu phần mình làm.** Mỗi người chạy thử và tự giải thích được code mình commit. Khi demo, giảng viên có thể hỏi bất kỳ ai về đúng file người đó đã commit.
3. **Commit bằng tài khoản của mình.** Không sửa ngày commit, không commit giùm người khác.

## Chuẩn bị (một lần)

Nhóm trưởng tạo repository trên GitHub và mời các thành viên (*Settings → Collaborators*). Mỗi người mở email hoặc https://github.com/notifications bấm **Accept**. TV1 (Scrum Master) đẩy commit khởi tạo dự án lên `main`; từ đó mọi thay đổi đều đi qua Pull Request.

**Mỗi thành viên:**
```bash
git config --global user.name "Họ Tên Thật"
git config --global user.email "email-dang-ky-github@..."
git clone https://github.com/PhucLee23/brewlite-assignment1.git
cd brewlite-assignment1
```

Email trong `git config` phải là email đã thêm vào tài khoản GitHub của mình (*Settings → Emails*), nếu không GitHub sẽ không tính commit cho tài khoản đó.

## Làm một PR

Ví dụ: làm hạng mục API danh sách sản phẩm.

1. **Lấy code mới nhất và tạo nhánh:**
   ```bash
   git checkout main
   git pull
   git checkout -b feat/2-products-api
   ```
   Tên nhánh: `feat/<số task>-<mô tả>` cho tính năng, `fix/...` sửa lỗi, `docs/...` tài liệu, `test/...` kiểm thử, `chore/...` công cụ và cấu hình.
2. **Code và chạy thử** theo tiêu chí chấp nhận trong [product-backlog.md](product-backlog.md). Phải build được và test qua mới commit.
3. **Commit và push:**
   ```bash
   git add .
   git status                     # kiểm tra chỉ có file của hạng mục này
   git commit -m "feat(products): API GET /products và GET /products/:id"
   git push -u origin feat/2-products-api
   ```
   Commit theo Conventional Commits, mô tả bằng tiếng Việt. Nên chia nhiều commit nhỏ, ví dụ phần module trước, phần test sau, để lịch sử rõ ràng.
4. **Mở PR trên GitHub** (nút *Compare & pull request*). Tiêu đề ghi mã hạng mục, ví dụ "Hạng mục 2.5 – Trang Giỏ hàng". Phần mô tả điền theo mẫu có sẵn: làm gì, thuộc task nào, đã kiểm tra bằng lệnh gì. Ở mục *Reviewers*, chọn người review theo [danh sách PR](danh-sach-pr.md).

## Review và merge

Người review:
1. Đọc tab *Files changed* và comment vào dòng code còn thắc mắc.
2. Kéo nhánh về chạy thử:
   ```bash
   git fetch
   git checkout <tên-nhánh>
   ```
3. Đạt thì bấm *Review changes → Approve*. Chưa đạt thì chọn *Request changes* và ghi rõ cần sửa gì.

Chỉ merge sau khi có ít nhất một Approve; **người mở PR** bấm *Merge pull request*. Sau mỗi lần merge, cả nhóm cập nhật máy mình:

```bash
git checkout main
git pull
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ../frontend
npm install
```

TV2 (PO) kiểm thử mỗi PR theo tiêu chí chấp nhận trong [product-backlog.md](product-backlog.md). Người mở PR cập nhật cột *PR* trong [danh-sach-pr.md](danh-sach-pr.md) ở PR kế tiếp của mình.

## Khi bị xung đột (conflict)

Thông báo "This branch has conflicts" nghĩa là `main` đã thay đổi đúng chỗ bạn sửa. Cách xử lý:

```bash
git checkout main
git pull
git checkout <nhánh-của-bạn>
git merge main
```

Mở các file bị đánh dấu `<<<<<<<`. Giữ phần đúng của **cả hai** bên, xóa các dấu `<<<<<<<`, `=======`, `>>>>>>>`, rồi chạy:

```bash
git add .
git commit
git push
```

PR nhỏ và merge sớm thì hiếm khi gặp xung đột.

## Viết phần của mình vào Issue của task

Mỗi task của đề có một Issue trên GitHub, tiêu đề dạng "Task 5 – Giỏ hàng". Khi PR của hạng mục đã merge, người làm tự viết một comment vào Issue của task đó bằng tài khoản của mình. Hạng mục thuộc nhiều task thì viết ở Issue của từng task, nói rõ phần liên quan.

```markdown
Phần của TVx – <Họ tên> (hạng mục x.y)
Đã làm: việc mình đã hoàn thành trong task này.
PR: #số PR đã merge.
File chính: các file mình tạo hoặc sửa.
Cách hoạt động: 3–5 câu, viết bằng lời của mình: dữ liệu đi từ đâu, gọi API nào, lưu ở đâu.
Cách kiểm tra: các bước bấm trên giao diện hoặc lệnh chạy test.
Đạt tiêu chí: đối chiếu với tiêu chí của task và Definition of Done trong đề.
Khó khăn / ghi chú: nếu có.
```

Khi mọi thành viên của task đã viết xong, nhóm trưởng đóng Issue (*Close as completed*).

## Tài liệu Scrum

- TV2 (PO) giữ [Product Backlog](product-backlog.md), Sprint Backlog trong `sprint-*.md` và [test case](test-case.md).
- TV1 (SM) ghi Daily Scrum, burndown, biên bản Sprint Review và Retrospective vào `sprint-*.md` ở cuối mỗi Sprint, commit trên nhánh riêng (ví dụ `docs/sprint-1-review`) và mở PR như các hạng mục khác.
