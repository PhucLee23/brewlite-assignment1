import { BadRequestException } from '@nestjs/common';

const KEY_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

/** Đọc và kiểm tra header Idempotency-Key (8–100 ký tự chữ, số, - hoặc _). */
export function parseIdempotencyKey(header: string | undefined, required: true): string;
export function parseIdempotencyKey(header: string | undefined, required: false): string | undefined;
export function parseIdempotencyKey(header: string | undefined, required: boolean): string | undefined {
  if (header === undefined || header === '') {
    if (required) throw new BadRequestException('Thiếu header Idempotency-Key');
    return undefined;
  }
  if (!KEY_PATTERN.test(header)) {
    throw new BadRequestException('Idempotency-Key phải gồm 8–100 ký tự chữ, số, "-" hoặc "_"');
  }
  return header;
}
