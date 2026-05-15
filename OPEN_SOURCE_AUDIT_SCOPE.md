# Open Source Audit Scope

This repository follows an audit-focused open source model.
The primary goal is security transparency and verification, rather than community feature co-development.

## Goals

1. Allow external security researchers and users to inspect wallet implementation and verify there is no malicious mnemonic/private-key exfiltration logic.
2. Support reproducible verification from public source code to released artifacts.

## Current Collaboration Boundary

1. External feature pull requests are currently not accepted (including new features, major refactors, and broad style cleanups).
2. Private security vulnerability reports are accepted.
3. Reproducible critical correctness reports are accepted.

## Security Disclosure Process

Do not publicly disclose unfixed vulnerabilities.
Please follow:

1. [SECURITY.md](./SECURITY.md)
2. GitHub private vulnerability reporting channel (preferred)
3. Security contact email: `tech@litbee.io`

## Recommended Audit Focus Areas

1. Wallet/keyring handling and encryption flow.
2. Inpage -> content -> background message path.
3. Provider high-privilege method authorization and approval boundaries.
4. Sensitive-field handling path in local storage and runtime state.

## Reproducible Build and Release Verification

Please refer to:

1. [REPRODUCIBLE_BUILD.md](./REPRODUCIBLE_BUILD.md)
2. [RELEASE_VERIFICATION.md](./RELEASE_VERIFICATION.md)

## Verification Script Baseline

1. The single source of verification scripts is repository root `scripts/`.
2. `tests/contracts` has been removed to avoid duplicate script maintenance drift.
3. For baseline audit verification, run at least:
   - `corepack yarn verify:stage2`
   - `corepack yarn verify:css:colors`
   - `corepack yarn verify:i18n`
4. Browser e2e flow uses `tests/.tmp-e2e` as runtime temporary output. This directory is runtime-generated and should not be versioned.
