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
