export interface DeliveryOptions {
  orderAmount?: number;
  express?: boolean;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error('INVALID_WEIGHT');
  }
  return 50;
}
