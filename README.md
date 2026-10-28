# BrewLite – Đặt cà phê không tiền mặt

Bài tập lớn môn Công nghệ Phần mềm (Trường Đại học Sài Gòn, học kỳ I năm học 2026–2027).

Khách chọn đồ uống (size, topping), thêm vào giỏ, đăng nhập rồi thanh toán không tiền mặt, nhận mã đơn và theo dõi lịch sử đơn. Nhóm 6 người làm theo Scrum, 3 Sprint.

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | Next.js 15 (App Router, TypeScript), TailwindCSS 4, Zustand, TanStack React Query |
| Backend | NestJS 11 (TypeScript), REST, class-validator, JWT (Passport), bcrypt |
| CSDL | PostgreSQL 16 + Prisma 6 |
| DevOps | Docker Compose, Git |

## Cấu trúc

```
brewlite-assignment1/
├── backend/      NestJS API (cổng 4000)
├── frontend/     Next.js (cổng 3000)
├── docs/         hợp đồng API, tài liệu Scrum
└── docker-compose.yml
```

## Chạy ở chế độ phát triển

Yêu cầu: Node.js 22 trở lên và Docker (để chạy PostgreSQL).

```bash
# 1. CSDL
docker compose up -d db

# 2. Backend – http://localhost:4000
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend – http://localhost:3000 (terminal khác)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Quy trình nhóm

Mỗi hạng mục làm trên một nhánh riêng, mở Pull Request và được review chéo trước khi merge vào `main`. Chi tiết: [docs/scrum/huong-dan-git.md](docs/scrum/huong-dan-git.md).
