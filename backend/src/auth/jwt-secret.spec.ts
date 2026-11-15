import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolveJwtSecret } from './jwt-secret';

describe('resolveJwtSecret', () => {
  beforeAll(() => jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined));

  it('dùng JWT_SECRET khi đã đặt', () => {
    expect(resolveJwtSecret(new ConfigService({ JWT_SECRET: 'khoa-rieng' }))).toBe('khoa-rieng');
  });

  it('thiếu JWT_SECRET thì tạo khóa ngẫu nhiên 256 bit, dùng chung cho cả lần chạy', () => {
    const first = resolveJwtSecret(new ConfigService({}));
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(resolveJwtSecret(new ConfigService({ JWT_SECRET: '' }))).toBe(first);
  });
});
