import { it, expect } from 'vitest';
import { calcParkingFee } from '../src/parking';

it.each([-1, -60, 10.5])('відхиляє тривалість %s', (minutes) => {
  expect(() => calcParkingFee(minutes)).toThrow('INVALID_DURATION');
});

it.each([0, 1, 15])('перші 15 хвилин безкоштовні: %i', (minutes) => {
  expect(calcParkingFee(minutes)).toBe(0);
});

it.each([
  { minutes: 15, expected: 0 },
  { minutes: 16, expected: 30 },
  { minutes: 60, expected: 30 },
])('перша година: $minutes хв → $expected грн', ({ minutes, expected }) => {
  expect(calcParkingFee(minutes)).toBe(expected);
});

it.each([
  { minutes: 61, expected: 50 },
  { minutes: 120, expected: 50 },
  { minutes: 121, expected: 70 },
  { minutes: 180, expected: 70 },
])('наступні години: $minutes хв → $expected грн', ({ minutes, expected }) => {
  expect(calcParkingFee(minutes)).toBe(expected);
});

it.each([
  { minutes: 540, expected: 190 },
  { minutes: 600, expected: 200 },
  { minutes: 1440, expected: 200 },
])('добова межа: $minutes хв → $expected грн', ({ minutes, expected }) => {
  expect(calcParkingFee(minutes)).toBe(expected);
});

it.each([
  { minutes: 60, expected: 15 },
  { minutes: 121, expected: 35 },
  { minutes: 600, expected: 100 },
])('нічний тариф: $minutes хв → $expected грн', ({ minutes, expected }) => {
  expect(calcParkingFee(minutes, { night: true })).toBeCloseTo(expected, 2);
});

it.each([
  { minutes: 600, opts: { weekend: true }, expected: 160 },
  { minutes: 600, opts: { night: true, weekend: true }, expected: 80 },
])(
  'вихідний: $minutes хв $opts → $expected грн',
  ({ minutes, opts, expected }) => {
    expect(calcParkingFee(minutes, opts)).toBeCloseTo(expected, 2);
  },
);

it('заокруглює результат до копійок', () => {
  expect(calcParkingFee(45, { night: true, weekend: true })).toBe(12);
  expect(calcParkingFee(121, { night: true, weekend: true })).toBe(28);
});
