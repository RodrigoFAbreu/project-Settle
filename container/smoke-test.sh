#!/usr/bin/env bash
# Starts an image under the homelab web-app chart's constraints (user 101,
# read-only root filesystem, 16 MiB /tmp, no capabilities) and checks that it
# serves every file of the release ZIP with a usable type, falls back to
# index.html for application routes and 404s for missing build output.
# Usage: container/smoke-test.sh IMAGE RELEASE.zip
set -euo pipefail
image=${1:?image}
zip=${2:?release zip}
name=settle-smoke-$$
work=$(mktemp -d)
# shellcheck disable=SC2317  # runs through the EXIT trap
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$work"; }
trap cleanup EXIT

unzip -q "$zip" -d "$work/site"
docker run -d --name "$name" -p 127.0.0.1:18080:8080 \
  --user 101:101 --read-only --tmpfs /tmp:size=16m,mode=1777 \
  --cap-drop ALL --security-opt no-new-privileges "$image" >/dev/null
for _ in $(seq 30); do
  curl -fsS -o /dev/null http://127.0.0.1:18080/ && break
  sleep 1
done
base=http://127.0.0.1:18080
fail=0
expect() { # url status [content-type-prefix]
  local code type
  read -r code type < <(curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$base$1")
  if [[ $code != "$2" || ( -n ${3:-} && $type != "$3"* ) ]]; then
    echo "FAIL $1: got $code $type, want $2 ${3:-}"; fail=1
  fi
}

expect / 200 text/html
expect /bills/some/deep/route 200 text/html   # SPA fallback
expect /assets/does-not-exist.js 404
expect /vendor/does-not-exist.wasm 404
expect /vendor/ort/ort-wasm-simd-threaded.wasm 200 application/wasm
expect /vendor/ort/ort-wasm-simd-threaded.mjs 200 text/javascript
expect /vendor/pdfjs/pdf.worker.min.mjs 200 text/javascript
expect /manifest.webmanifest 200 application/manifest+json

# Every file in the release is served, byte for byte.
count=0
while IFS= read -r -d '' file; do
  rel=${file#"$work/site/"}
  got=$(curl -s "$base/$rel" | sha256sum | cut -d' ' -f1)
  want=$(sha256sum "$file" | cut -d' ' -f1)
  if [[ $got != "$want" ]]; then echo "FAIL /$rel differs from the release"; fail=1; fi
  count=$((count + 1))
done < <(find "$work/site" -type f -print0)
echo "checked $count release files"

# The CSP stays exactly as upstream built it (a meta tag in index.html).
grep -q 'http-equiv="Content-Security-Policy"' "$work/site/index.html"
curl -s "$base/" | cmp - "$work/site/index.html"

# Licences and notices ship in the image.
expect /THIRD_PARTY_NOTICES.md 200
expect /vendor/licenses/heic-to-LICENSE.txt 200

# Nothing wrote outside /tmp, or the read-only root would have failed the start.
if docker logs "$name" 2>&1 | grep -E '\[(emerg|crit|alert)\]'; then fail=1; fi
exit $fail
