import { execSync } from 'child_process';
import { resolve } from 'path';
import { testDatabaseUrl } from './test-db';

/**
 * Áp migration lên CSDL test (tạo mới nếu chưa có). Không xóa dữ liệu:
 * mỗi test tự tạo sản phẩm/người dùng riêng nên không phụ thuộc dữ liệu cũ.
 */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'inherit',
  });
}
