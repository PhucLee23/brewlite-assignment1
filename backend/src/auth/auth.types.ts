import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

/** Người dùng đã xác thực, được gắn vào request.user bởi JwtStrategy. */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}
