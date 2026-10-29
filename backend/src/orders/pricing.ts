import { Size } from '@prisma/client';

/** Phụ thu theo size (VNĐ), cộng vào giá gốc (size S). */
export const SIZE_SURCHARGE: Record<Size, number> = { S: 0, M: 5000, L: 10000 };
