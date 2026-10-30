FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 4000
# Áp migration, nạp dữ liệu mẫu (idempotent) rồi chạy API
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/main"]
