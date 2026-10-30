import { amountForSize, cupNeeds, RecipeLine, servingsLeft, stockMap } from './inventory';

const line = (ingredientId: number, amount: number, stock: number, scalesWithSize = true): RecipeLine => ({
  ingredientId,
  amount,
  ingredient: { name: `NL${ingredientId}`, stock, scalesWithSize },
});

describe('inventory', () => {
  it('size M, L dùng nhiều nguyên liệu hơn (làm tròn lên), ly nhựa thì không', () => {
    expect([amountForSize(line(1, 18, 0), 'S'), amountForSize(line(1, 18, 0), 'M'), amountForSize(line(1, 18, 0), 'L')]).toEqual([
      18, 23, 27,
    ]);
    expect(amountForSize(line(2, 1, 0, false), 'L')).toBe(1);
  });

  it('cộng nguyên liệu của món và topping trong 1 ly', () => {
    const needs = cupNeeds([line(1, 18, 0), line(2, 1, 0, false)], 'L', [[line(1, 18, 0)], [line(3, 50, 0)]]);
    expect([...needs]).toEqual([
      [1, 27 + 18],
      [2, 1],
      [3, 50],
    ]);
  });

  it('số ly còn lại do nguyên liệu hết trước quyết định', () => {
    const recipe = [line(1, 25, 2500), line(2, 30, 3000), line(3, 1, 500, false)];
    expect(servingsLeft(cupNeeds(recipe, 'S'), stockMap(recipe))).toBe(100);
    const lowMilk = [line(1, 25, 2500), line(2, 30, 89), line(3, 1, 500, false)];
    expect(servingsLeft(cupNeeds(lowMilk, 'S'), stockMap(lowMilk))).toBe(2);
  });

  it('món chưa có công thức thì không bán được', () => {
    expect(servingsLeft(new Map(), new Map())).toBe(0);
  });
});
