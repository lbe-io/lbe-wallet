# Release Verification Policy

This repository follows a source-to-artifact verification model.

## For Each Public Release

Maintainers should publish:

1. Git tag (for example `v1.2.3`)
2. Release notes
3. Packaged artifact hash (`SHA256`)
4. Build environment summary (Node/Yarn/WXT versions)

For tag pushes matching `v*`, GitHub Actions workflow `Release Artifact Hash` builds zip artifacts and uploads:

1. Extension zip artifacts
2. `SHA256SUMS.txt`

Use these outputs as the canonical hash source for release notes.

## Release Gate Baseline (Before Publish)

Before creating or approving a release tag, maintainers should pass:

1. `corepack yarn compile`
2. `corepack yarn verify:stage2`
3. `corepack yarn verify:css:colors`
4. `corepack yarn verify:i18n`
5. `corepack yarn build`
6. `corepack yarn zip`

## Verification Workflow

1. Checkout the release tag.
2. Run steps in [REPRODUCIBLE_BUILD.md](./REPRODUCIBLE_BUILD.md).
3. Compute artifact hash.
4. Compare hash with the published release value.

## Mismatch Handling

If verification fails:

1. Re-check tool versions and lockfile.
2. Rebuild in a clean workspace.
3. Open a public issue for non-security reproducibility mismatch.
4. If suspicious behavior is discovered, follow [SECURITY.md](./SECURITY.md).
