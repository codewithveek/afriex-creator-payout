import { describe, it, expect } from 'vitest';
import {
  addAmounts,
  subtractAmounts,
  isAmountGte,
  isPositiveAmount,
  toMinorUnits,
  fromMinorUnits,
} from '../currency';

describe('currency utils', () => {
  it('addAmounts avoids float drift', () => {
    expect(addAmounts('0.10', '0.20')).toBe('0.30');
    expect(addAmounts('19.99', '0.01')).toBe('20.00');
  });

  it('subtractAmounts avoids float drift', () => {
    expect(subtractAmounts('100.00', '33.33')).toBe('66.67');
  });

  it('isAmountGte correctly compares decimal strings', () => {
    expect(isAmountGte('5.00', '5.00')).toBe(true);
    expect(isAmountGte('5.01', '5.00')).toBe(true);
    expect(isAmountGte('4.99', '5.00')).toBe(false);
  });

  it('isPositiveAmount rejects zero and negative balances', () => {
    expect(isPositiveAmount('0.00')).toBe(false);
    expect(isPositiveAmount('0.01')).toBe(true);
    expect(isPositiveAmount('-5.00')).toBe(false);
  });

  it('toMinorUnits and fromMinorUnits round-trip correctly', () => {
    expect(toMinorUnits('12.50', 'USD')).toBe(1250);
    expect(fromMinorUnits(1250, 'USD')).toBe('12.50');
    expect(fromMinorUnits(toMinorUnits('500.00', 'NGN'), 'NGN')).toBe('500.00');
  });
});
