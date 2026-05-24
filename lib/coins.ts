// ── Coin system constants and helpers ──────────────────────────────────────

export const DAILY_LOGIN_COINS = 100;
export const PACK_DROP_COIN_RATE = 0.05;  // 5% chance per pack open
export const PACK_DROP_COIN_AMOUNT = 10;  // coins awarded on drop

/**
 * Determine if a pack open should drop bonus coins
 * @returns true if this pack should award bonus coins (~5% chance)
 */
export function shouldDropCoins(): boolean {
  return Math.random() < PACK_DROP_COIN_RATE;
}
