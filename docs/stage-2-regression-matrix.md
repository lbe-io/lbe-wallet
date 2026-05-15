# Stage 2 Regression Matrix

This document defines the browser-level regression baseline used by `tests/e2e/verify-browser-e2e-regression-gating.mjs`.

### Browser E2E Baseline

Run:

- `corepack yarn verify:browser:e2e`
- `corepack yarn verify:browser:e2e:gate`

Environment notes:

- Microsoft Edge is used for the baseline scenario.
- The baseline flow validates provider `enable` / `getKey` / `signDirect` / `signAmino` / `signArbitrary` / `sendTx`.
- The popup flow validates `popup wallet home -> `CryptoDetail` -> send confirm`.
- The suite must also verify cross-origin authorization isolation.
