import { describe, it, expect } from 'vitest';
import { applyLoyaltyPoints } from '../src/order';

describe('applyLoyaltyPoints', () => {
  it('списує всі бали, якщо вони не перевищують 30 % суми', () => {
    const total = 500;
    const points = 100;

    const result = applyLoyaltyPoints(total, points);

    expect(result).toEqual({ pointsUsed: 100, toPay: expect.closeTo(400, 2) });
  });

  it.each([
    { total: 500, points: 1000, pointsUsed: 150, toPay: 350 },
    { total: 10, points: 5, pointsUsed: 3, toPay: 7 },
    { total: 99.99, points: 50, pointsUsed: 29, toPay: 70.99 },
    { total: 1234.56, points: 500, pointsUsed: 370, toPay: 864.56 },
  ])(
    'для суми $total і $points балів списує $pointsUsed, до сплати $toPay',
    ({ total, points, pointsUsed, toPay }) => {
      expect(applyLoyaltyPoints(total, points)).toEqual({
        pointsUsed,
        toPay: expect.closeTo(toPay, 2),
      });
    },
  );

  it.each([
    [299, 299, 701],
    [300, 300, 700],
    [301, 300, 700],
  ])(
    'межа ліміту для суми 1000 грн: запит %i → списано %i, до сплати %i',
    (points, pointsUsed, toPay) => {
      expect(applyLoyaltyPoints(1000, points)).toEqual({
        pointsUsed,
        toPay: expect.closeTo(toPay, 2),
      });
    },
  );

  it.each([
    [0, 0, 1000],
    [1, 1, 999],
  ])(
    'нижня межа кількості балів: запит %i → списано %i, до сплати %i',
    (points, pointsUsed, toPay) => {
      expect(applyLoyaltyPoints(1000, points)).toEqual({
        pointsUsed,
        toPay: expect.closeTo(toPay, 2),
      });
    },
  );

  it('не списує жодного бала, якщо 30 % суми менше за 1 грн', () => {
    expect(applyLoyaltyPoints(3.33, 5)).toEqual({
      pointsUsed: 0,
      toPay: expect.closeTo(3.33, 2),
    });
  });

  it('для нульової суми нічого не списує', () => {
    expect(applyLoyaltyPoints(0, 10)).toEqual({ pointsUsed: 0, toPay: 0 });
  });

  it.each([-1, -100])('відхиляє від’ємну кількість балів %i', (points) => {
    expect(() => applyLoyaltyPoints(1000, points)).toThrow('NEGATIVE_POINTS');
  });

  it.each([1.5, NaN])('відхиляє нецілу кількість балів %s', (points) => {
    expect(() => applyLoyaltyPoints(1000, points)).toThrow('INVALID_POINTS');
  });

  it.each([-0.01, NaN, Infinity])('відхиляє некоректну суму %s', (total) => {
    expect(() => applyLoyaltyPoints(total, 10)).toThrow('INVALID_TOTAL');
  });
});
