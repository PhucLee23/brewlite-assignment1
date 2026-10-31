import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

/** Test chạy trên CSDL riêng `<tên>_test` để không làm bẩn dữ liệu demo. */
export function testDatabaseUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('Chưa cấu hình DATABASE_URL (xem backend/.env.example)');
  const url = new URL(base);
  if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`;
  return url.toString();
}
