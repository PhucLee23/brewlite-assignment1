import { Transform } from 'class-transformer';
import { IsByteLength, IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** bcrypt chỉ đọc 72 byte đầu của mật khẩu; chữ có dấu chiếm 2–3 byte nên phải giới hạn theo byte, không theo ký tự. */
export const PASSWORD_MAX_BYTES = 72;

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @IsByteLength(0, PASSWORD_MAX_BYTES, {
    message: 'Mật khẩu quá dài: tối đa 72 ký tự không dấu (chữ có dấu tính 2–3 ký tự)',
  })
  password!: string;

  // Bỏ khoảng trắng hai đầu trước khi kiểm tra độ dài, để "   " hay " A " không lọt qua
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(100)
  fullName!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
