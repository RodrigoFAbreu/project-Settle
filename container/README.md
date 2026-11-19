# Container image

Settle is a static site (React/Vite, no backend, no database). The release ZIP
(`settle-vX.Y.Z.zip`, built by `build-and-publish.yml`) is the only input. This directory
packages it into an unprivileged nginx image that the homelab runs.

| | |
| --- | --- |
| Image | `ghcr.io/jfilipegm/settle` (`linux/arm64`) |
| Tags | `X.Y.Z` (immutable), the source commit SHA, and `latest` (the newest completed release) |
| Port | 8080, user 101, read-only root filesystem, writes only to `/tmp` |
| Files | `Dockerfile`, `nginx.conf`, `smoke-test.sh`; workflow `.github/workflows/build-and-publish.yml` |

## How a release becomes an image

0. On every PR, the `image` job of `tests.yml` (part of `ci.yml`) builds the image from that
   commit's own app build and runs `smoke-test.sh`, so a change here is
   checked before it merges.
1. A PR merges to `master`; `ci.yml` re-runs CI on the merged commit and then
   calls `build-and-publish.yml`, whose `release` job publishes `vX.Y.Z` with
   `settle-vX.Y.Z.zip`.
2. Its `image` job packages that tag. A release created by `GITHUB_TOKEN`
   cannot trigger other workflows, so it runs in the same workflow.
3. `image` downloads the ZIP, checks it against the SHA-256 digest GitHub
   records for the release asset, refuses to overwrite an existing `X.Y.Z` tag,
   builds the image on a native ARM64 runner and runs `smoke-test.sh` on it.
4. It then pushes `X.Y.Z` and the commit SHA as one plain manifest, and the
   shared `promote-image.yml` (RodrigoFAbreu/action-workflows) copies that
   digest to `latest`.
5. In the homelab, Argo CD Image Updater follows the digest behind `latest` and
   Argo rolls the Deployment (homelab-gitops, `namespaces/apps/settle`).

To package an existing release, or to retry after a failure, run **Build and publish** from
the Actions tab with the tag (for example `v0.7.0`). A version already
published cannot be rebuilt; a change to `container/` ships as the next release
(use a `build:` PR title).

## What the image guarantees

- It contains exactly the release ZIP: models, OCR/PDF/HEIC/QR WASM and
  workers, fonts, `THIRD_PARTY_NOTICES.md` and `vendor/licenses/`. The build
  fails if the notices, licences, models or ONNX Runtime WASM are missing, and
  `smoke-test.sh` compares every served file byte for byte with the ZIP.
- Unknown application paths return `index.html` (SPA fallback); missing files
  under `/assets/`, `/vendor/` and `/icons/` return a real 404, never HTML.
- WASM, ES modules (`.mjs`), the web manifest and the ONNX models get correct
  types. `/assets/*` is immutable-cached; everything else revalidates.
- The Content-Security-Policy is the `<meta>` tag upstream builds into
  `index.html` (`app/cspMeta.ts`). nginx neither adds nor changes it, and adds
  only `nosniff`, `no-referrer` and `X-Frame-Options: DENY`.

## Running locally

```sh
gh release download v0.7.0 --pattern 'settle-v0.7.0.zip' --output container/settle.zip
docker build -t settle container
container/smoke-test.sh settle container/settle.zip
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp settle
```

(`container/settle.zip` is git-ignored.)

## Registry access

The workflow publishes with the repository's `GITHUB_TOKEN`. The package must
be readable by whoever pulls it: make `ghcr.io/jfilipegm/settle` public (the
repository is public, and the image holds only the public release), or grant
the pulling account read access.

## Upgrading

Re-check upstream requirements at each upgrade: a release that adds a backend,
database, upload storage or new response headers needs changes here and in the
homelab deployment, not just a new image.
