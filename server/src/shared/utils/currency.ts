// Pure functions only — no API calls, no DB access, no state. Per the
// architecture guide's shared-utils rule, anything needing those belongs in
// a service, not here.

const MINOR_UNITS_PER_MAJOR: Record<string, number> = {
  USD: 100,
  NGN: 100,
  GHS: 100,
  KES: 100,
};

/** Converts a major-unit decimal string (e.g. "12.50") to integer minor units (1250). */
export function toMinorUnits(amount: string, currency: string): number {
  const factor = MINOR_UNITS_PER_MAJOR[currency] ?? 100;
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(2, '0').slice(0, 2);
  return Number(whole) * factor + Number(paddedFraction);
}

/** Converts integer minor units (1250) back to a major-unit decimal string ("12.50"). */
export function fromMinorUnits(minorUnits: number, currency: string): string {
  const factor = MINOR_UNITS_PER_MAJOR[currency] ?? 100;
  return (minorUnits / factor).toFixed(2);
}

/** Formats a decimal amount string for display, e.g. formatMoney("1250.5", "USD") -> "$1,250.50" */
export function formatMoney(amount: string, currency: string): string {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/** Adds two decimal amount strings without floating-point drift, returns a decimal string. */
export function addAmounts(a: string, b: string): string {
  // Scale to integer cents, add, scale back — avoids binary float error.
  const aCents = Math.round(Number(a) * 100);
  const bCents = Math.round(Number(b) * 100);
  return ((aCents + bCents) / 100).toFixed(2);
}

/** Subtracts b from a as decimal amount strings, returns a decimal string. */
export function subtractAmounts(a: string, b: string): string {
  const aCents = Math.round(Number(a) * 100);
  const bCents = Math.round(Number(b) * 100);
  return ((aCents - bCents) / 100).toFixed(2);
}

/** True if `a` (decimal string) is greater than or equal to `b`. */
export function isAmountGte(a: string, b: string): boolean {
  return Math.round(Number(a) * 100) >= Math.round(Number(b) * 100);
}

/** True if `a` (decimal string) is strictly greater than zero. */
export function isPositiveAmount(a: string): boolean {
  return Math.round(Number(a) * 100) > 0;
}
