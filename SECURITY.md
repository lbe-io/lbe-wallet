# Security Policy

## Reporting a Vulnerability

Please do **not** disclose security issues publicly.

Use one of the private channels below:

1. GitHub private vulnerability reporting (preferred).
2. Email: `tech@litbee.io`.

Include:

1. Affected version/commit.
2. Reproduction steps or proof of concept.
3. Impact assessment (funds risk, account risk, permission bypass risk).
4. Suggested remediation (optional).

## Supported Versions

We currently provide security fixes for:

1. The latest `main` branch.
2. The latest tagged release line.

Older versions may not receive patches.

## Response Process

1. Initial triage acknowledgement target: within 72 hours.
2. Severity assessment and reproduction.
3. Fix development and validation.
4. Coordinated disclosure after a patch is available.

If additional time is needed, maintainers will provide status updates through the original private report channel.

## Security Scope

In scope:

1. Wallet key management and signing flows.
2. Provider RPC authorization and permission checks.
3. Session, approval, and origin isolation.
4. Background/content/inpage messaging boundaries.
5. Sensitive data storage, encryption, and exposure.

Out of scope:

1. Issues requiring physical device compromise.
2. Vulnerabilities only present in unsupported browser versions.
3. Best-practice suggestions without a concrete exploit path.

## Responsible Disclosure

Do **not** publish proof-of-concept details, exploit code, or 0day writeups before maintainers confirm a fix is released.
