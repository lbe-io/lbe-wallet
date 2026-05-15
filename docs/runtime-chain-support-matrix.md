# Runtime Chain Support Matrix

## Status Baseline
- `builtin = supported`
- `custom = partial / selective executable upgrade`
- `suggested = partial / selective executable upgrade`
- builtin remains the only fully supported runtime baseline
- custom may selectively upgrade only:
  - `addressDerivation`
  - `hydrationContext`
  - `nativeAssetContext`
- persisted custom chains may additionally close over runtime-executable paths only when they satisfy explicit stage-3 preconditions for:
  - `queryContext`
  - popup native send execution
  - provider `getKey`
  - provider `getOfflineSignerAccounts`
  - provider `signDirect`
  - provider `signAmino`
  - provider `signArbitrary`
  - provider `sendTx`
- persisted suggested chains may additionally close over runtime-executable paths only when they satisfy explicit stage-3 preconditions for:
  - `queryContext`
  - popup `sendFlowContext`
  - popup native send execution
  - provider `getKey`
  - provider `getOfflineSignerAccounts`
  - provider `signDirect`
  - provider `signAmino`
  - provider `signArbitrary`
  - provider `sendTx`
- suggested runtime closure remains selective, persisted-only, and precondition-gated

## Capability Matrix

| Source | addressDerivation | nativeAssetContext | sendFlowContext | queryContext | approvalDisplayContext | hydrationContext |
|---|---|---|---|---|---|---|
| `builtin` | supported | supported | supported | supported | supported | supported |
| `custom` | selective upgrade only for persisted chains with explicit derivation metadata | selective upgrade only for persisted chains with explicit native asset metadata | selective executable upgrade only for persisted chains with stable send-flow metadata | selective executable upgrade only for persisted chains with stable query metadata | supported for display | selective upgrade only for persisted chains with stable hydration context |
| `suggested` | selective upgrade only for persisted chains with explicit address metadata | selective upgrade only for persisted chains with explicit native asset metadata | selective executable upgrade only for persisted chains with stable send-flow metadata | selective executable upgrade only for persisted chains with stable query metadata | supported for display | partial metadata only / explicit unsupported |

## Popup Native Send Baseline

| Source | Popup Native Send |
|---|---|
| `builtin` | supported |
| `custom` | selective executable upgrade only for persisted chains with stable chain/address/native-asset/gas-fee preconditions |
| `suggested` | selective executable upgrade only for persisted chains with stable chain/address/native-asset/gas-fee preconditions |

## Provider Runtime Baseline

| Source | `getKey` / `getOfflineSignerAccounts` | `signDirect` | `signAmino` | `signArbitrary` | `sendTx` |
|---|---|---|---|---|---|
| `builtin` | supported | supported | supported | supported | supported |
| `custom` | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable runtime transport and enabled authority |
| `suggested` | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable account-read metadata and enabled authority | selective executable upgrade only for persisted chains with stable runtime transport and enabled authority |

## Display Context Baseline
- builtin display remains unchanged
- custom display-only improvements may cover:
  - approval preview native asset text
  - approval preview address text
  - `AddToken` address fallback/context text
- suggested display-only improvements may cover:
  - `approval preview`
  - `Connect`
  - `AddToken`
- suggested shared display contract now means those three surfaces may align on:
  - chain label / title / subtitle / explanation
  - native asset fallback text / explanation
  - address source / fallback text / explanation
  - shared suggested copy source
  - closer shared prop shape
  - closer shared display type contract
- display-only improvements do not imply:
  - send/query fully supported
  - `sendFlowContext`
  - `queryContext`
  - staking/history/price support

## Interpretation Layer

| Source | Runtime Status | Expected Runtime Context | Expected Missing Context |
|---|---|---|---|
| `builtin` | `supported` | `rpc`, `rest`, `nativeAssetContext`, `addressContext` | none |
| `custom` | `partial` | `chainId`, `chainName`, `rpc` when present, plus selectively upgraded persisted metadata when available | any capability not explicitly upgraded |
| `suggested` | `partial` | source-tagged candidate runtime interpretation from `chainInfo` | not persisted, not fully closed over runtime |

## Query Layer

| Source | Asset Query | Tx History Query | Staking Query | Price Query |
|---|---|---|---|---|
| `builtin` | supported | supported | supported | supported |
| `custom` | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions |
| `suggested` | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions | selective executable upgrade for persisted chains with query preconditions |

## Guardrail Expectations
- Runtime/query layers must not silently fallback from custom/suggested to builtin config
- `getChainInfos` remains builtin-only
- `suggestChain` remains builtin canonical validation
- popup send/query entrypoints may read runtime interpretation, but builtin behavior must stay unchanged
- custom runtime closure remains selective, persisted-only, and precondition-gated
- suggested runtime closure remains selective, persisted-only, and precondition-gated
- suggested capabilities outside the current closure set must stay explicit unsupported
- selective capability upgrades must stay explicit, source-aware, and independently testable
- unmet custom/suggested runtime preconditions must remain explicit unsupported with traceable reasons

## Required Automated Checks
- `node scripts/verify-runtime-chain-interpretation.mjs`
- `node scripts/verify-custom-suggested-runtime-closure.mjs`
- `node scripts/verify-runtime-chain-capability-contract.mjs`
- `node scripts/verify-custom-runtime-closure-stage3.mjs`
- `node scripts/verify-suggested-runtime-closure-stage3.mjs`
- `node scripts/verify-custom-suggested-capability-matrix.mjs`
- `node scripts/verify-runtime-chain-query-entry.mjs`
- `node scripts/verify-runtime-chain-support-gates.mjs`
- `node scripts/verify-stage2-runtime-capability-upgrades.mjs`
- `node scripts/verify-stage2-runtime-display-upgrades.mjs`
- `node scripts/verify-suggested-chain-display-consolidation.mjs`
- `node scripts/verify-stage2-runtime-chain.mjs`
- `node scripts/verify-stage2-stability-contract.mjs`

## Required Manual Checks
- builtin chain homepage asset query
- builtin chain `CryptoDetail` history / price / send
- persisted custom chain selective upgrades:
  - derivation context
  - hydration context
  - native asset context
  - approval preview native asset text
  - approval preview address text
  - query executable only when stage-3 query preconditions are met
  - popup native send executable only when stage-3 send preconditions are met
  - provider `getKey` / `getOfflineSignerAccounts` / `signDirect` / `signAmino` / `signArbitrary` / `sendTx` executable only when their preconditions are met
  - still no silent fallback to builtin
- custom chain hydration and explicit unsupported behavior
- persisted suggested runtime closure:
  - `queryContext`
  - popup `sendFlowContext`
  - popup native send execution
  - provider `getKey` / `getOfflineSignerAccounts`
  - provider `signDirect` / `signAmino` / `signArbitrary`
  - provider `sendTx`
  executable only when their preconditions are met
  - still no silent fallback to builtin
- suggested chain validation path remains unchanged
- suggested `approval preview` / `Connect` / `AddToken` copy remains correct while runtime closure stays selective / precondition-gated
- approval/connect display must not mislabel custom/suggested as builtin
- add-token display labels must not leak into persisted token name semantics
