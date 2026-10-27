export interface DeliveryOptions {
  orderAmount?: number;
  express?: boolean;
}

export function calcDeliveryFee(
  weightKg: number,
  options: DeliveryOptions = {},
): number {
  throw new Error('INVALID_WEIGHT');
}
