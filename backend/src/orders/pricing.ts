import { Promotion, Size } from '@prisma/client';

/** Phụ thu theo size (VNĐ), cộng vào giá gốc (size S). */
export const SIZE_SURCHARGE: Record<Size, number> = { S: 0, M: 5000, L: 10000 };

export function unitPrice(basePrice: number, size: Size, toppingPrices: number[]): number {
  return basePrice + SIZE_SURCHARGE[size] + toppingPrices.reduce((sum, p) => sum + p, 0);
}

export type PromotionCheck = { ok: true; discount: number } | { ok: false; reason: string };

export function evaluatePromotion(promo: Promotion | null, subtotal: number, now = new Date()): PromotionCheck {
  if (!promo || !promo.active) return { ok: false, reason: 'Mã giảm giá không tồn tại hoặc đã ngừng áp dụng' };
  if (promo.expiresAt && promo.expiresAt < now) return { ok: false, reason: 'Mã giảm giá đã hết hạn' };
  if (subtotal < promo.minTotal) {
    return { ok: false, reason: `Đơn tối thiểu ${promo.minTotal.toLocaleString('vi-VN')}đ để dùng mã này` };
  }
  return { ok: true, discount: Math.floor((subtotal * promo.percentOff) / 100) };
}
