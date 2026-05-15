# Docs Index

This directory contains audit, architecture, and regression documentation for the LBE Wallet extension.

## Language Policy
- English canonical file: `*.md`
- Simplified Chinese counterpart: `*.zh-CN.md`
- Keep EN/ZH files updated in the same change whenever behavior, API, or verification flow changes.

## Document Map

| Topic | English | 中文（简体） |
|---|---|---|
| Project Overview | [project-overview.md](./project-overview.md) | [project-overview.zh-CN.md](./project-overview.zh-CN.md) |
| Keyring Security & Encryption | [keyring-security-encryption.md](./keyring-security-encryption.md) | [keyring-security-encryption.zh-CN.md](./keyring-security-encryption.zh-CN.md) |
| i18n Guide | [i18n.md](./i18n.md) | [i18n.zh-CN.md](./i18n.zh-CN.md) |
| Runtime Chain Support Matrix | [runtime-chain-support-matrix.md](./runtime-chain-support-matrix.md) | [runtime-chain-support-matrix.zh-CN.md](./runtime-chain-support-matrix.zh-CN.md) |
| Stage 2 Regression Matrix | [stage-2-regression-matrix.md](./stage-2-regression-matrix.md) | [stage-2-regression-matrix.zh-CN.md](./stage-2-regression-matrix.zh-CN.md) |

## Notes
- CI and gating scripts currently read:
  - `docs/runtime-chain-support-matrix.md`
  - `docs/stage-2-regression-matrix.md`
- Do not rename those two English files unless scripts are updated in the same commit.
