# Transcript

Build session for make.fun bounty `btc-race-24h-20261123-0511` ("Race a BTC trading bot live for 24 hours").

The bot in this repository (`main.ts`, "Kura V-Bottom") was built in a Muse agent session started after the competition opened (2026-11-23T05:11:00Z). The session log is the builder agent's own session file; the parent agent bundles it for submission (this competition uploads a bundle, not `makefun record` — record returns HTTP 400 for this series, as in the 18 Nov round).

What the session did, in order:

1. Read the coordinator's ATM study (`btc-race-24h-20261123-0511-atm.md`) and the new kit (`competition.yaml`, `RULES.txt`, `dataset/cut.json`, baselines, SDK): same universe/harness/protocol as the previous rounds; only the dev window changed (23 Nov, 1,440 bars, 58,987 → 61,102, +3.59%, an uptrend day; dataset_sha256 4872274b22d6f70632f1a0a6a3b1875a6ebdfcbab8aba08d70ece75a1e9f268c).
2. Graded the previous round's bot ("Kura V-Bottom", 2.00% dip, 120-bar window, 420-bar hold) on the new window with `grade-local --driver process`: net PnL $0.00, 0 trades — fails the dev gate, exactly as the ATM study predicted (a deep dip rarely triggers on an uptrend day).
3. Built a local simulator mirroring the harness fill model (4 bps fee, 2 bps slippage, pool impact a/D, from the prior rounds' replica) and grid-searched the V-bottom family (window, dip, confirm, take profit, trailing stop, stop-loss, hold, regime filter) on the new window, validating every candidate on all three dev windows (23 Nov +3.59%, 17 Nov +0.53%, 18 Nov −2.79%).
4. Found and fixed a simulator bug mid-search: the regime filter's 120-bar return used a wrapped-around index for bars < 120, which made the filter look profitable on the downtrend window; with the fix, the filter blocks every entry on that window (0 trades) and was rejected.
5. Chose the plateau set W=60, DROP=80 bps, CONFIRM=5 bps, TAKE_PROFIT=120 bps, STOP=250 bps, TRAIL=200 bps, HOLD=420 bars, no regime filter: the best worst-window floor among the refined candidates (min +$13.44 across the three windows in simulation), with 81% of neighbouring parameter sets profitable on all three windows.
6. Wrote `main.ts` (retuned constants + updated header), then verified with the exact harness on all three windows: new window +$30.45 (5 round trips, win rate 0.60, max DD 1.96%), 17 Nov +$14.04, 18 Nov +$13.44, all guardrails met, both runs byte-identical on every window.
7. Corrected the header comment in `main.ts` to the verified grade-local figures (second edit of the entrypoint, in a separate turn), and wrote `README.md` with the same verified results.

No GitHub repository was created and nothing was submitted from this session; the parent agent handles repo creation and submission.
