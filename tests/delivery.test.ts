import { it, expect } from 'vitest';
import { calcDeliveryFee } from '../src/delivery';

it.each([0, -1, NaN, Infinity])('відхиляє некоректну вагу %s', (weight) => {
  expect(() => calcDeliveryFee(weight)).toThrow('INVALID_WEIGHT');
});
