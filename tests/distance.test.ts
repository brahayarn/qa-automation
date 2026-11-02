import { describe, it, expect } from 'vitest';
import { kmToMiles, milesToKm } from '../src/distance';

describe('kmToMiles', () => {
  it('перетворює 1.609344 км рівно на 1 милю', () => {
    const km = 1.609344;

    const result = kmToMiles(km);

    expect(result).toBe(1);
  });

  it('перетворює 10 км приблизно на 6.214 милі', () => {
    expect(kmToMiles(10)).toBeCloseTo(6.214, 3);
  });

  it('повертає 0 для нульової відстані', () => {
    expect(kmToMiles(0)).toBe(0);
  });

  it('відхиляє від’ємну відстань', () => {
    expect(() => kmToMiles(-1)).toThrow('INVALID_DISTANCE');
    expect(() => kmToMiles(-0.001)).toThrow('INVALID_DISTANCE');
  });

  it('відхиляє нечислове значення', () => {
    expect(() => kmToMiles(NaN)).toThrow('INVALID_DISTANCE');
    expect(() => kmToMiles(Infinity)).toThrow('INVALID_DISTANCE');
  });
});

describe('milesToKm', () => {
  it('перетворює 1 милю на 1.609344 км', () => {
    expect(milesToKm(1)).toBe(1.609344);
  });

  it('перетворює марафонські 26.2 милі приблизно на 42.165 км', () => {
    expect(milesToKm(26.2)).toBeCloseTo(42.165, 3);
  });

  it('повертає 0 для нульової відстані', () => {
    expect(milesToKm(0)).toBe(0);
  });

  it('відхиляє від’ємну відстань', () => {
    expect(() => milesToKm(-5)).toThrow('INVALID_DISTANCE');
    expect(() => milesToKm(-0.001)).toThrow('INVALID_DISTANCE');
  });

  it('відхиляє нечислове значення', () => {
    expect(() => milesToKm(NaN)).toThrow('INVALID_DISTANCE');
  });
});

describe('kmToMiles і milesToKm разом', () => {
  it('повертають початкове значення після перетворення туди й назад', () => {
    expect(milesToKm(kmToMiles(42))).toBeCloseTo(42, 10);
  });
});
