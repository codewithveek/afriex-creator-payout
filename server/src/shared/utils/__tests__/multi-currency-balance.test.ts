import { describe, it, expect } from 'vitest';
import { addAmounts, subtractAmounts, isAmountGte, isPositiveAmount } from '../currency';
import { computeFee } from '../fees';

/**
 * Documents the multi-currency ledger invariant:
 * earnings credit the *sale* currency; withdrawals debit that same currency.
 * Mixing NGN sales into a USD balance is disallowed at the service layer.
 */
describe('multi-currency balance math', () => {
  it('credits net amount in sale currency independently of payout currency', () => {
    const saleCurrency = 'NGN';
    const payoutCurrency = 'USD';
    expect(saleCurrency).not.toBe(payoutCurrency);

    const fee = computeFee('10000.00', 10);
    expect(fee.netAmount).toBe('9000.00');
    expect(fee.platformFeeAmount).toBe('1000.00');

    // Ledger map keyed by currency
    const balances: Record<string, string> = { USD: '0.00', NGN: '0.00' };
    balances[saleCurrency] = addAmounts(balances[saleCurrency]!, fee.netAmount);

    expect(balances.NGN).toBe('9000.00');
    expect(balances.USD).toBe('0.00');
  });

  it('withdrawal only reduces the requested currency ledger', () => {
    const balances: Record<string, string> = {
      NGN: '9000.00',
      USD: '50.00',
    };

    const withdrawCurrency = 'NGN';
    const amount = '1000.00';
    expect(isAmountGte(balances[withdrawCurrency]!, amount)).toBe(true);

    balances[withdrawCurrency] = subtractAmounts(balances[withdrawCurrency]!, amount);

    expect(balances.NGN).toBe('8000.00');
    expect(balances.USD).toBe('50.00');
  });

  it('blocks withdrawal when that currency has insufficient funds even if another is funded', () => {
    const balances = { NGN: '9000.00', USD: '5.00' };
    const requestUsd = '50.00';
    expect(isAmountGte(balances.USD, requestUsd)).toBe(false);
    expect(isPositiveAmount(balances.NGN)).toBe(true);
  });
});
