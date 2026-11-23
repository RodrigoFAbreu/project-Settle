# ss-05-server-image

Publish the server image

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

A Dockerfile and publication for `ghcr.io/rodrigofabreu/settle-server` (linux/arm64):
- it contains the built site (the same output as the release ZIP) and the server, and serves both on one
  port: the site with the SPA fallback and the MIME types and headers of `container/nginx.conf` (WASM,
  `.mjs`, ONNX, the manifest; the Content-Security-Policy meta tag untouched) and `/api`;
- it runs as an unprivileged user with a read-only root filesystem and writes only to `/tmp`, like the
  homelab `web-app` chart's constraints;
- a smoke test script like `container/smoke-test.sh` (every release file served byte for byte, SPA fallback,
  404 for a missing `/assets/` file, `/api/health`), run by the `tests.yml` image job;
- publication through `build-and-publish.yml` next to the existing `settle` image, with `latest` promoted
  the same way. The existing static `settle` image and its workflow behaviour stay as they are.

## Rules

- Do not change the static image's contents or tags.
- No database yet: the image starts and serves without `DATABASE_URL`.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `build: publish the Settle server image` ``.
