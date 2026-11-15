import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/** Cột id trong PostgreSQL là INT4: lớn hơn giá trị này thì Prisma báo lỗi chuyển kiểu và API trả 500. */
export const MAX_ID = 2_147_483_647;

/** Đọc id trên đường dẫn: phải là số nguyên nằm trong phạm vi INT4, sai thì trả 400 thay vì để CSDL báo lỗi. */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!/^-?\d+$/.test(value) || Math.abs(id) > MAX_ID) {
      throw new BadRequestException('Mã không hợp lệ, phải là số nguyên');
    }
    return id;
  }
}
