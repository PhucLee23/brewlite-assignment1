import { OrderStatus } from '@prisma/client';
import { assertTransition, canTransition, InvalidTransitionError, ORDER_TRANSITIONS } from './order-state-machine';

describe('Order State Machine', () => {
  it('cho phép luồng thành công PENDING → PAID → PREPARING → READY → COMPLETED', () => {
    const happyPath: OrderStatus[] = ['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED'];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(() => assertTransition(happyPath[i], happyPath[i + 1])).not.toThrow();
    }
  });

  it('cho phép thanh toán lỗi rồi thử lại', () => {
    expect(canTransition('PENDING', 'PAYMENT_FAILED')).toBe(true);
    expect(canTransition('PAYMENT_FAILED', 'PENDING')).toBe(true);
  });

  it.each<[OrderStatus, OrderStatus]>([
    ['PENDING', 'PREPARING'],
    ['PENDING', 'COMPLETED'],
    ['PAID', 'PENDING'],
    ['PAID', 'READY'],
    ['PREPARING', 'CANCELLED'],
    ['READY', 'PAID'],
    ['PAYMENT_FAILED', 'PAID'],
    ['COMPLETED', 'CANCELLED'],
    ['CANCELLED', 'PENDING'],
  ])('chặn chuyển trạng thái sai %s → %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(InvalidTransitionError);
  });

  it('COMPLETED và CANCELLED là trạng thái kết thúc', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toHaveLength(0);
    expect(ORDER_TRANSITIONS.CANCELLED).toHaveLength(0);
  });
});
