import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

let generated: string | undefined;

/**
 * Khóa ký JWT. Không có giá trị mặc định viết sẵn trong repo: ai đọc được khóa đó sẽ tự ký token
 * quyền STAFF. Thiếu JWT_SECRET thì tạo khóa ngẫu nhiên cho lần chạy này (khởi động lại thì phải đăng nhập lại).
 */
export function resolveJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  if (!generated) {
    generated = randomBytes(32).toString('hex');
    new Logger('Auth').warn('Chưa đặt JWT_SECRET, dùng khóa ngẫu nhiên: khởi động lại backend thì mọi người phải đăng nhập lại');
  }
  return generated;
}
