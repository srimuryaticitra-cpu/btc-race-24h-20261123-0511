// Kura V-Bottom: a patient long-only bot for the cbBTC 24h race.
//
// Idea: on 1-minute bars the market is mostly noise (a full round trip costs
// ~26 bps in fees, slippage and impact), so this bot does nothing on ordinary
// days and waits for one event: a shallow selloff that turns. It buys only
// when price has fallen at least 0.80% below its 60-bar high AND has already
// risen at least 0.05% off its 60-bar low, i.e. the turn is confirmed, not
// guessed. It then banks the bounce with an explicit 120 bps take profit, a
// 200 bps trailing stop off the peak value, a 250 bps stop-loss off its cost,
// and a 420-bar (7h) time stop.
//
// Retuned for btc-race-24h-20261123-0511: the new dev window (23 Nov, 1,440
// bars, 58,987 -> 61,102, +3.59%) is an uptrend day — buy-and-hold makes
// ~+$33 net on it — and the old bot (2.00% dip, 120-bar window) never trades
// on it at all (grade-local: $0.00, 0 trades, dev gate failed). The dip that
// wins on an uptrend day is shallow, not deep: grid search over dip, window,
// confirm, take profit, trailing stop, stop-loss and hold, validated on all
// three dev windows, picks a 0.80% dip with a 1.20% take profit. Verified with
// the exact harness (grade-local --driver process, two runs, byte-identical
// action logs on every window):
//   new dev window 23 Nov (+3.59%): net PnL +$30.45, 5 round trips (9 trades),
//   win rate 0.60, max DD 1.96%, 2x-fees PnL still +$26.36, guardrails met.
//   old dev window 17 Nov (+0.53%): net PnL +$14.04, 3 round trips, win rate
//   0.67, max DD 1.55%, 2x-fees PnL still +$11.62, guardrails met.
//   old dev window 18 Nov (-2.79%): net PnL +$13.44, 3 round trips, win rate
//   0.67, max DD 1.50%, 2x-fees PnL still +$11.02, guardrails met.
// A regime filter (skip entries while the 120-bar return is below -1%) was
// tested and REJECTED: on the downtrend window it blocks every entry, leaving
// 0 trades — a bot that never trades fails the guardrails on a falling race
// day, while this unfiltered bot still profits there. The 81%-of-neighbours
// plateau (DROP 70-95, CONF 5-15, TP 100-150, HOLD 360-480 all profitable on
// all three windows) says the choice is a mid-plateau one, not a sharp peak.
// All decisions are pure functions of the bars seen: no clock, no network, no
// randomness, no lookahead.
import { BPS, runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYM = 'CBBTC';
/** Rolling window for the high/low, in bars. */
const WINDOW_BARS = 60;
/** Buy only after a fall of at least this many bps from the window high. */
const DROP_BPS = 80;
/** ...and a rise of at least this many bps off the window low. */
const CONFIRM_BPS = 5;
/** Take profit: sell when the position is worth this many bps over its cost. */
const TAKE_PROFIT_BPS = 120;
/** Stop-loss: sell when the position is worth this many bps under its cost. */
const STOP_BPS = 250;
/** Trailing stop: sell when the position falls this many bps below its peak value. */
const TRAIL_BPS = 200;
/** Time stop: sell after this many bars held, whatever the price. */
const MAX_HOLD_BARS = 420;
const MAX_SLIPPAGE_BPS = 100;

const closes: number[] = [];
let entryBar = -1;
let peakVal = 0n;

await runBars({
  onBatch(state, batch) {
    const bar = batch.bars.find((b) => b.symbol === SYM);
    if (bar === undefined) return [];
    const c = Number(bar.c) / 1e5;
    closes.push(c);
    const held = state.positions.get(SYM);

    if (held === undefined) {
      if (state.warmingUp) return [];
      if (closes.length <= WINDOW_BARS) return [];
      const prev = closes.slice(-WINDOW_BARS - 1, -1);
      let hi = prev[0];
      let lo = prev[0];
      for (const x of prev) {
        if (x > hi) hi = x;
        if (x < lo) lo = x;
      }
      const dropBps = ((hi - c) / hi) * 10000;
      const riseBps = ((c - lo) / lo) * 10000;
      if (dropBps < DROP_BPS || riseBps < CONFIRM_BPS) return [];
      const cash = state.cash;
      if (cash < BigInt(state.hello.fees.min_notional_quote_units)) return [];
      entryBar = state.seq;
      peakVal = 0n;
      const order: BuyInput = { side: 'buy', symbol: SYM, notional_quote_units: cash, max_slippage_bps: MAX_SLIPPAGE_BPS };
      return [order];
    }

    const val = state.value(SYM, held.qty);
    if (val > peakVal) peakVal = val;
    const cost = held.cost;
    const takeProfit = (val * BPS) >= cost * (BPS + BigInt(TAKE_PROFIT_BPS));
    const stop = (val * BPS) <= cost * (BPS - BigInt(STOP_BPS));
    const trail = peakVal > 0n && (val * BPS) <= peakVal * (BPS - BigInt(TRAIL_BPS));
    const time = state.seq - entryBar >= MAX_HOLD_BARS;
    if (takeProfit || stop || trail || time) {
      const order: SellInput = { side: 'sell', symbol: SYM, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS };
      entryBar = -1;
      peakVal = 0n;
      return [order];
    }
    return [];
  },
});
