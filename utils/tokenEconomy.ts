export type EconomyParams = {
  participants: number;
  tokensRequired: number; // entry fee per participant
  prizePoolShare?: number; // fraction of entryTokens allocated to prize pool
  coinAllocationFactor?: number; // fraction of prizePoolBase allocated to coin token values
};

export type EconomyResult = {
  entryTokens: number;
  prizePoolBase: number;
  platformMargin: number;
  coinTokenTotal: number;
  coinTokenRemaining: number;
  leftoverPrizeReserve: number;
};

export function computeEconomy(
  p: EconomyParams,
  tokensCollected: number = 0
): EconomyResult {
  const prizePoolShare = p.prizePoolShare ?? 0.7;
  const coinAllocationFactor = p.coinAllocationFactor ?? 0.8;

  const entryTokens = Math.round(p.participants * p.tokensRequired);
  const prizePoolBase = Math.round(entryTokens * prizePoolShare);
  const platformMargin = entryTokens - prizePoolBase;
  const coinTokenTotal = Math.round(prizePoolBase * coinAllocationFactor);
  const coinTokenRemaining = Math.max(
    0,
    coinTokenTotal - Math.round(tokensCollected)
  );
  const leftoverPrizeReserve = prizePoolBase - coinTokenTotal;

  return {
    entryTokens,
    prizePoolBase,
    platformMargin,
    coinTokenTotal,
    coinTokenRemaining,
    leftoverPrizeReserve,
  };
}

/**
 * Distribute a target token total across `count` coins deterministically.
 * Ensures sum(values) === target and returns an array of integers.
 */
export function distributeCoinValues(target: number, count: number) {
  if (count <= 0) return [];
  const base = Math.floor(target / count);
  const values: number[] = new Array(count).fill(base);
  let remainder = target - base * count;
  // Spread remainder one by one
  for (let i = 0; remainder > 0; i = (i + 1) % count, remainder--) {
    values[i] += 1;
  }
  // Simple deterministic shuffle to vary rarities while keeping sum constant
  for (let i = values.length - 1; i > 0; i--) {
    const j = (i * 13 + 7) % (i + 1); // deterministic pseudo-shuffle
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}
