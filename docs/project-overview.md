# LBE Chrome Wallet Project Overview

Last updated: 2026-05-14
Language: English

## 1. Scope
`lbe-chrome-wallet` is a browser extension wallet built with `WXT + React + TypeScript`, with Cosmos-focused provider, signing, and send flows.

Primary capabilities:
- Wallet create/import/unlock/auto-lock flows
- Popup, onboarding, and approval user interfaces
- Injected provider API for dApps (`window.lbeWallet`)
- Cosmos account read, signing, and transaction broadcast
- Local wallet metadata and asset storage via Dexie/IndexedDB

## 2. Naming Baseline
Use the following naming as canonical:

| Name | Location | Meaning |
|---|---|---|
| `lbe-extension` | `package.json` | package name |
| `LBE Wallet` | `wxt.config.ts` manifest | extension display name |
| `window.lbeWallet` | `src/cosmos/provider/inpage/index.ts` | public injected provider API |

Notes:
- Public provider object is `window.lbeWallet`.
- Legacy compatibility markers may still exist (for example `isLumexs`) and are not the canonical API brand.

## 3. Core Structure
| Directory | Responsibility |
|---|---|
| `src/entrypoints/popup` | popup entrypoint |
| `src/entrypoints/onboarding` | onboarding entrypoint |
| `src/entrypoints/background` | service worker and controllers |
| `src/entrypoints/content` | content bridge |
| `src/entrypoints/inpage.ts` | page-context provider injection |
| `src/popup` | UI pages and view logic |
| `src/components` | reusable components |
| `src/cosmos` | domain logic (provider, storage, wallet, tx) |
| `src/shared` | shared types, protocol, utilities |
| `scripts` | contract/regression checks |
| `tests` | e2e and manual regression assets |
| `docs` | architecture, audit, regression docs |
| `examples` | dApp integration samples |

## 4. Runtime Paths
### 4.1 dApp Path
1. Web page calls `window.lbeWallet.*`.
2. Inpage provider forwards request.
3. Content script bridges to background.
4. Background provider controller applies guardrails and executes.
5. Response returns via the same bridge.

### 4.2 UI Path
1. Popup/onboarding UI triggers operation.
2. Shared messaging contract forwards to background controller.
3. Background services execute (keyring/preference/permission/session).
4. UI updates state with response.

## 5. Provider API Baseline
Canonical source: `src/cosmos/provider/inpage/index.ts`.

Key methods:
- `window.lbeWallet.request({ method, params })`
- `window.lbeWallet.enable(chainIds)`
- `window.lbeWallet.disable(chainIds?)`
- `window.lbeWallet.getChainInfos()`
- `window.lbeWallet.getKey(chainId)`
- `window.lbeWallet.signAmino(chainId, signer, signDoc)`
- `window.lbeWallet.signDirect(chainId, signer, signDoc)`
- `window.lbeWallet.signArbitrary(chainId, signer, data)`
- `window.lbeWallet.suggestChain(chainInfo)`

Injected signer helpers:
- `window.getOfflineSigner(chainId)`
- `window.getOfflineSignerOnlyAmino(chainId)`
- `window.getOfflineSignerAuto(chainId)`

Initialization event:
- `lbeWallet#initialized`

## 6. Data Layers
- `chrome.storage.local`: extension-global state and persisted runtime state
- `Dexie (IndexedDB)`: wallet/account/address/chain/token/asset records
- UI state (Redux/local view state): presentation and session-level state

Note:
- Internal DB name may remain `LumexsDatabase`. This is internal storage naming and does not change the public provider API baseline.

## 7. Verification Baseline
Recommended commands:

```bash
corepack yarn compile
corepack yarn verify:stage2
corepack yarn verify:css:colors
corepack yarn verify:i18n
corepack yarn build
```

Main verification assets:
- `scripts/*` for contracts and runtime checks
- `tests/e2e/verify-browser-e2e-regression-baseline.mjs`
- `tests/manual/provider-regression.html`
- `examples/lbe-test-dapp/`

## 8. Open-source Audit Notes
For audit-focused open source readiness:
- Keep provider naming and docs aligned (`window.lbeWallet`)
- Keep approval/sign/send/isolation regressions covered
- Keep audit boundary and reproducible build docs updated
- Avoid coupling hard runtime gates to documentation prose when possible
