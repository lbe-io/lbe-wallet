# LBE Chrome Wallet

[English](./README.md) | [Chinese (Simplified)](./README.zh-CN.md)

LBE Chrome Wallet is a browser extension wallet built with `WXT + React + TypeScript`, currently focused on Cosmos ecosystem workflows.

## Open Source Positioning

This repository is an audit-focused open source project.

Primary goal:

1. Let security researchers and users inspect wallet logic and verify there is no malicious handling of mnemonic or private key materials.
2. Support reproducible build verification between source code and release artifacts.

Collaboration boundary:

1. We currently do not accept external feature pull requests.
2. We accept private security reports and critical correctness reports.

Please read:

1. [CONTRIBUTING.md](./CONTRIBUTING.md)
2. [SECURITY.md](./SECURITY.md)
3. [SECURITY_BOUNDARY.md](./SECURITY_BOUNDARY.md)
4. [REPRODUCIBLE_BUILD.md](./REPRODUCIBLE_BUILD.md)
5. [RELEASE_VERIFICATION.md](./RELEASE_VERIFICATION.md)
6. [OPEN_SOURCE_AUDIT_SCOPE.md](./OPEN_SOURCE_AUDIT_SCOPE.md)

## Overview

This project includes:

1. Extension UI flows for wallet onboarding, unlock, asset management, and approval.
2. Background services for wallet, keyring, permissions, sessions, and notifications.
3. Inpage provider injection (`window.lbeWallet`) for dApp integration.

## Core Capabilities

1. Wallet create/import/unlock/lock flows.
2. Account and address management for Cosmos-compatible chains.
3. dApp provider methods such as connect, key retrieval, and signing.
4. Transaction-related workflows in popup UI.
5. Runtime chain capability controls and approval boundaries.

## Tech Stack

### Extension and UI

- `WXT`
- `React 18`
- `React Router 6`
- `Redux Toolkit`
- `Ant Design 5`
- `TypeScript`

### Wallet and Chain

- `@cosmjs/amino`
- `@cosmjs/proto-signing`
- `@cosmjs/stargate`
- `@scure/bip32`
- `@scure/bip39`
- `Dexie`

### Tooling

- `ESLint`
- `Prettier`
- `Yarn`

## Project Structure

```text
src/
  entrypoints/   # extension entrypoints (popup/background/content/inpage)
  popup/         # popup pages, approval pages, UI hooks
  cosmos/        # chain, provider, wallet, tx, storage
  components/    # reusable UI components
  shared/        # shared protocols, utils, constants
  locales/       # i18n resources
  i18n/          # i18n initialization
```

## Getting Started

### Prerequisites

1. Node.js
2. Corepack
3. Yarn

### Install Dependencies

```bash
corepack yarn install
```

### Development

```bash
corepack yarn dev
```

Firefox development:

```bash
corepack yarn dev:firefox
```

### Build

```bash
corepack yarn build
```

Firefox build:

```bash
corepack yarn build:firefox
```

Build output is generated in `.output/`.

### Package

```bash
corepack yarn zip
```

Firefox package:

```bash
corepack yarn zip:firefox
```

### Type Check

```bash
corepack yarn compile
```

## Verification Baseline

For audit-focused validation, run:

```bash
corepack yarn verify:stage2
corepack yarn verify:css:colors
corepack yarn verify:i18n
```

Notes:

1. `scripts/` is the single source of truth for contract and regression verification scripts.
2. `tests/contracts` has been removed to avoid dual-maintenance drift.
3. `tests/.tmp-e2e` is runtime-only temporary output for browser e2e scripts and should not be committed.

## CI Baseline

GitHub Actions CI runs:

1. `corepack yarn compile`
2. `corepack yarn verify:stage2`
3. `corepack yarn verify:css:colors`
4. `corepack yarn verify:i18n`
5. `corepack yarn build`

## Security

Please review [SECURITY.md](./SECURITY.md) for vulnerability reporting and disclosure policy.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
