import { it, expect } from 'vitest';
import { calcDeliveryFee } from '../src/delivery';

it.each([0, -1, NaN, Infinity])('відхиляє некоректну вагу %s', (weight) => {
  expect(() => calcDeliveryFee(weight)).toThrow('INVALID_WEIGHT');
});

it.each([0.1, 1, 5])('до 5 кг включно: %s кг коштує 50 грн', (weight) => {
  expect(calcDeliveryFee(weight)).toBe(50);
});

it.each([
  { weight: 5.1, expected: 60 },
  { weight: 6, expected: 60 },
  { weight: 6.1, expected: 70 },
  { weight: 10, expected: 100 },
])('понад 5 кг: $weight кг → $expected грн', ({ weight, expected }) => {
  expect(calcDeliveryFee(weight)).toBe(expected);
});

it.each([
  { weight: 29, expected: 290 },
  { weight: 30, expected: 300 },
  { weight: 31, expected: 300 },
  { weight: 100, expected: 300 },
])('межа 300 грн: $weight кг → $expected грн', ({ weight, expected }) => {
  expect(calcDeliveryFee(weight)).toBe(expected);
});

it.each([
  { weight: 5, expected: 100 },
  { weight: 10, expected: 200 },
  { weight: 31, expected: 600 },
])('експрес: $weight кг → $expected грн', ({ weight, expected }) => {
  expect(calcDeliveryFee(weight, { express: true })).toBe(expected);
});

it.each([
  { orderAmount: 999.99, weight: 1, express: false, expected: 50 },
  { orderAmount: 1000, weight: 1, express: false, expected: 0 },
  { orderAmount: 1001, weight: 1, express: false, expected: 0 },
  { orderAmount: 1000, weight: 100, express: false, expected: 0 },
  { orderAmount: 1000, weight: 1, express: true, expected: 0 },
  { orderAmount: 999.99, weight: 1, express: true, expected: 100 },
])(
  'сума $orderAmount, $weight кг, експрес $express → $expected грн',
  ({ orderAmount, weight, express, expected }) => {
    expect(calcDeliveryFee(weight, { orderAmount, express })).toBe(expected);
  },
);
