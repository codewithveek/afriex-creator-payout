import { describe, it, expect } from 'vitest';
import { computeFee } from '../fees';

describe('computeFee', () => {
  it('computes a standard 10% fee correctly', () => {
    const result = computeFee('100.00', 10);
    expect(result.grossAmount).toBe('100.00');
    expect(result.platformFeePercent).toBe('10.00');
    expect(result.platformFeeAmount).toBe('10.00');
    expect(result.netAmount).toBe('90.00');
  });

  it('rounds fee amounts to 2 decimal places without drift', () => {
    // 33.33 * 0.10 = 3.333 -> rounds to 3.33, net = 30.00
    const result = computeFee('33.33', 10);
    expect(result.platformFeeAmount).toBe('3.33');
    expect(result.netAmount).toBe('30.00');
  });

  it('handles a 0% fee rate', () => {
    const result = computeFee('50.00', 0);
    expect(result.platformFeeAmount).toBe('0.00');
    expect(result.netAmount).toBe('50.00');
  });

  it('handles a 100% fee rate (creator receives nothing)', () => {
    const result = computeFee('50.00', 100);
    expect(result.platformFeeAmount).toBe('50.00');
    expect(result.netAmount).toBe('0.00');
  });

  it('handles odd-cent gross amounts without floating point drift', () => {
    // A classic floating point trap: 0.1 + 0.2 !== 0.3 in raw JS floats.
    const result = computeFee('19.99', 7.5);
    // 19.99 * 0.075 = 1.49925 -> rounds to 1.50 (banker's? no, standard round)
    expect(result.platformFeeAmount).toBe('1.50');
    expect(result.netAmount).toBe('18.49');
  });

  it('never produces a net amount that does not sum back to gross with the fee', () => {
    const cases: [string, number][] = [
      ['12.34', 10],
      ['999.99', 15],
      ['1.00', 5],
      ['0.50', 50],
    ];
    for (const [gross, feePercent] of cases) {
      const result = computeFee(gross, feePercent);
      const sum = (Number(result.platformFeeAmount) + Number(result.netAmount)).toFixed(2);
      expect(sum).toBe(Number(gross).toFixed(2));
    }
  });
});
