// Pure function, no side effects. The formula is fixed and must never be
// recomputed later from gross minus net — callers store every field this
// returns at write time.
//
// Rounding happens at each step independently (fee first, then net = gross
// - roundedFee) rather than computing net via a single combined formula, to
// avoid floating-point drift accumulating across the two derived values.
export interface FeeBreakdown {
  grossAmount: string;
  platformFeePercent: string;
  platformFeeAmount: string;
  netAmount: string;
}

export function computeFee(grossAmount: string, platformFeePercent: number): FeeBreakdown {
  const gross = Number(grossAmount);
  const feeAmount = Number((gross * (platformFeePercent / 100)).toFixed(2));
  const netAmount = Number((gross - feeAmount).toFixed(2));

  return {
    grossAmount: gross.toFixed(2),
    platformFeePercent: platformFeePercent.toFixed(2),
    platformFeeAmount: feeAmount.toFixed(2),
    netAmount: netAmount.toFixed(2),
  };
}
