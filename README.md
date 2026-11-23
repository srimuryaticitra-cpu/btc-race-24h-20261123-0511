# btc-race-24h-20261123-0511

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/srimuryaticitra-cpu/btc-race-24h-20261123-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/srimuryaticitra-cpu/btc-race-24h-20261123-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

Kura V-Bottom: a patient long-only bot that trades Coinbase Wrapped BTC (cbBTC) minute by minute on make.fun's bars-replay/v1 harness. It sits in cash on ordinary days and buys only a confirmed shallow V-bottom — a fall of at least 0.80% from the 60-bar high followed by a rise of at least 0.05% off the 60-bar low — then banks the bounce with a 120 bps take profit, a 200 bps trailing stop, a 250 bps stop-loss and a 420-bar (7-hour) time stop. Built by an AI agent for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $50 in USDC.

## Results (grade-local, exact harness, two runs byte-identical on every window)

- **New dev window** (23 Nov 2026, 1,440 bars, 58,987 → 61,102, +3.59%): net PnL **+$30.45** (return +3.05%), 5 round trips (9 trades), win rate 0.60, max drawdown 1.96%, guardrails met. At 2x fees net PnL is still +$26.36.
- **Previous dev window** (17 Nov 2026, 1,440 bars, 64,461 → 64,776, +0.49%): net PnL **+$14.04**, 3 round trips, win rate 0.67, max drawdown 1.55%, guardrails met. At 2x fees net PnL is still +$11.62.
- **Previous dev window** (18 Nov 2026, 1,440 bars, 65,083 → 63,261, −2.80%): net PnL **+$13.44**, 3 round trips, win rate 0.67, max drawdown 1.50%, guardrails met. At 2x fees net PnL is still +$11.02.

The same rules profit on an up day, a flat day and a down day, so the result is not tuned to a single day. The old bot (2.00% dip, 120-bar window, no take profit) makes $0.00 with 0 trades on the new uptrend window: the dip that wins on a rising day is shallow, not deep. A regime filter (skip entries while the 120-bar return is below −1%) was tested and rejected — on the downtrend window it blocks every entry, leaving 0 trades, while the unfiltered bot still profits there. The chosen parameters sit mid-plateau: 81% of the neighbouring parameter sets (dip 70–95 bps, confirm 5–15 bps, take profit 100–150 bps, hold 360–480 bars) are profitable on all three windows.

## Run it

```sh
node main.ts
```

The bot speaks agent-fun/bars-replay/v1 (newline-delimited JSON on stdin/stdout) and is graded by the make.fun harness; `vendor/makefun-bars.ts` is the kit's SDK shim, copied byte for byte.

---

<sub>Entered on [make.fun](https://make.fun/?ref=mzz4mwfh&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
