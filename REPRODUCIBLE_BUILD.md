# Reproducible Build Guide

This document describes how to build the extension from source and verify local artifacts.

## Environment Baseline

1. OS: Windows 10/11, macOS, or Linux
2. Node.js: use the same major version declared by maintainers for release builds
3. Corepack enabled
4. Yarn lockfile must be unchanged

## Build Steps

1. Install dependencies:

```bash
corepack yarn install
```

2. Type check:

```bash
corepack yarn compile
```

3. Run audit verification baseline:

```bash
corepack yarn verify:stage2
corepack yarn verify:css:colors
corepack yarn verify:i18n
```

4. Build extension:

```bash
corepack yarn build
```

5. Package zip:

```bash
corepack yarn zip
```

Build outputs are generated under `.output/`.

Runtime note:

1. Browser e2e scripts may create temporary files under `tests/.tmp-e2e`.
2. `tests/.tmp-e2e` is transient runtime output and should not be committed.

## Verify Artifact Hashes

Example on PowerShell:

```powershell
Get-FileHash .output\*.zip -Algorithm SHA256
```

Compare the computed hash with the release hash published by maintainers.

## Determinism Notes

1. Use the exact repository tag for the target release.
2. Do not modify `yarn.lock`.
3. Build with a clean working tree.
4. If hash mismatch occurs, compare:
   - Node.js version
   - Yarn version
   - release tag
   - lockfile state

## Security Expectation

Verification should demonstrate that published extension artifacts are generated from the corresponding public source tag.
