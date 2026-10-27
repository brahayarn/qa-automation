import { it, expect } from 'vitest';
import { calcDeliveryFee } from '../src/delivery';

it.each([0, -1, NaN, Infinity])('відхиляє некоректну вагу %s', (weight) => {
  expect(() => calcDeliveryFee(weight)).toThrow('INVALID_WEIGHT');
});

it.each([0.1, 1, 5])('до 5 кг включно: %s кг коштує 50 грн', (weight) => {
  expect(calcDeliveryFee(weight)).toBe(50);
});
