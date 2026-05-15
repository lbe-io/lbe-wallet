# Keyring Security & Encryption Overview

Last updated: 2026-05-14  
Language: English

## 1. Purpose
This document summarizes how password, master key, mnemonic, private key material, and unlock session state are handled in the current codebase.

Scope:
- storage boundaries
- encryption/decryption paths
- unlock guardrails
- operational caveats for audit-focused reviews

## 2. Key Source Files
- `src/entrypoints/background/service/keyring/index.ts`
- `src/entrypoints/background/service/keyring/secureVaultCrypto.ts`
- `src/entrypoints/background/service/keyring/keystoreAccess.ts`
- `src/entrypoints/background/service/keyring/keystoreWriteAccess.ts`
- `src/entrypoints/background/service/keyring/keystoreSessionState.ts`
- `src/entrypoints/background/service/keyring/unlockGuard.ts`
- `src/entrypoints/background/service/keyring/signerMaterialResolver.ts`

## 3. Security Model (High-level)
- User password is used to protect access to encrypted master-key material.
- Sensitive wallet secrets (mnemonic/private key data) are encrypted under master-key-based flows.
- Runtime unlock/session state is in-memory and not equivalent to full persistent plaintext exposure.
- Unlock retry behavior is guarded by lockout/backoff controls.

## 4. Data Boundaries
- Persistent extension state: `chrome.storage.local` (keyring state envelope, preferences, runtime flags).
- Business data view: Dexie/IndexedDB for wallet/account/address/asset records.
- In-memory runtime state: unlock/session lifecycle data.

Important note:
- Internal DB naming (for example `LumexsDatabase`) may be legacy and does not define public API/security boundary naming.

## 5. Review Baseline for Open-source Audit
When reviewing for “no mnemonic/private-key theft behavior”, verify at minimum:
- No plaintext mnemonic/private key writes to localStorage or logs.
- Provider/controller/message paths enforce approval and permission boundaries.
- Unlock/session handling clears or expires correctly.
- Sensitive operations are covered by staged regression/contract checks.

## 6. Recommended Companion Docs
- `SECURITY_BOUNDARY.md`
- `REPRODUCIBLE_BUILD.md`
- `OPEN_SOURCE_AUDIT_SCOPE.md`
- `RELEASE_VERIFICATION.md`
- `docs/runtime-chain-support-matrix.md`
