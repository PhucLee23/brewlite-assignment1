import { Promotion } from '@prisma/client';
import { evaluatePromotion, unitPrice } from './pricing';

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  code: 'BREW10',
  percentOff: 10,
  minTotal: 50000,
  active: true,
  expiresAt: null,
  ...over,
});

describe('pricing', () => {
  it('tính giá theo size và topping', () => {
    expect(unitPrice(45000, 'S', [])).toBe(45000);
    expect(unitPrice(45000, 'M', [5000])).toBe(55000);
    expect(unitPrice(45000, 'L', [5000, 7000])).toBe(67000);
  });

  it('áp mã giảm giá hợp lệ', () => {
    expect(evaluatePromotion(promo(), 100000)).toEqual({ ok: true, discount: 10000 });
  });

  it('từ chối mã không tồn tại, ngừng áp dụng, hết hạn hoặc chưa đủ giá trị', () => {
    expect(evaluatePromotion(null, 100000).ok).toBe(false);
    expect(evaluatePromotion(promo({ active: false }), 100000).ok).toBe(false);
    expect(evaluatePromotion(promo({ expiresAt: new Date('2020-01-01') }), 100000).ok).toBe(false);
    expect(evaluatePromotion(promo(), 30000).ok).toBe(false);
  });
});
