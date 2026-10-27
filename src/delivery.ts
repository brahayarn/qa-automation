export interface DeliveryOptions {
  orderAmount?: number;
  express?: boolean;
}

const BASE_WEIGHT_KG = 5;
const BASE_FEE = 50;
const EXTRA_KG_FEE = 10;
const MAX_FEE = 300;

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  let fee = BASE_FEE;
  if (weightKg > BASE_WEIGHT_KG) {
    const extraKg = Math.ceil(weightKg - BASE_WEIGHT_KG);
    fee = Math.min(BASE_FEE + extraKg * EXTRA_KG_FEE, MAX_FEE);
  }
  if (options.express) fee = fee * 2;
  return fee;
}
