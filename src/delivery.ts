export interface DeliveryOptions {
  orderAmount?: number;
  express?: boolean;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;
const EXPRESS_RATE = 2;

function assertValidWeight(weightKg: number): void {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
}

export function calcBaseFee(weightKg: number): number {
  if (weightKg <= BASE_WEIGHT_KG) return BASE_FEE;
  const extraKg = Math.ceil(weightKg - BASE_WEIGHT_KG);
  return Math.min(BASE_FEE + extraKg * EXTRA_KG_FEE, MAX_FEE);
}

export function applyExpress(fee: number, express: boolean): number {
  return express ? fee * EXPRESS_RATE : fee;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  assertValidWeight(weightKg);
  return applyExpress(calcBaseFee(weightKg), options.express === true);
}
