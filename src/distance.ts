const KM_PER_MILE = 1.609344;

function assertDistance(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('INVALID_DISTANCE');
  }
}

export function kmToMiles(km: number): number {
  assertDistance(km);
  return km / KM_PER_MILE;
}

export function milesToKm(miles: number): number {
  assertDistance(miles);
  return miles * KM_PER_MILE;
}
