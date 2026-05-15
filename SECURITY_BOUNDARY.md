# Security Boundary and Sensitive Data Handling

This document explains the intended security boundary for mnemonic/private key safety in this codebase.

## Sensitive Material

Sensitive material includes:

1. Mnemonic phrases
2. Private keys
3. Encrypted vault data
4. Session secrets used for key operations

## Intended Handling Principles

1. Sensitive material is processed locally in extension context.
2. Mnemonic/private key plaintext must not be transmitted to remote RPC/HTTP services.
3. UI and logs must avoid printing mnemonic/private key plaintext.
4. Persistence should use protected storage flow defined in wallet/keyring modules.

## Data Flow Boundary

1. dApp requests: `inpage -> content -> background controller`
2. Signing and high-privilege operations are gated by approval and permission checks.
3. Storage access should go through storage API modules, not ad hoc direct writes in UI.

## Outbound Network Data

Outbound requests may include:

1. Chain RPC requests
2. Public chain REST/indexer requests
3. Price or metadata fetches (if enabled)

Sensitive secrets should not be included in outbound payloads.

## Audit Pointers

Reviewers can prioritize:

1. Provider request handlers in background controller modules
2. Wallet/keyring encryption and unlock flows
3. Storage read/write paths for sensitive fields
4. Message bridge boundaries across inpage/content/background

## Security Reporting

If you suspect leakage of mnemonic/private key materials, report privately via [SECURITY.md](./SECURITY.md).
