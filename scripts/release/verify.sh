#!/usr/bin/env bash
# Checks a built release ZIP: it is a valid archive and holds the app shell, the
# third-party notices and licences, the OCR models and the WASM runtime that the
# container image (container/Dockerfile) and the app need.
# Usage: scripts/release/verify.sh dist/settle-vX.Y.Z.zip
set -euo pipefail
zip=${1:?release zip}
unzip -tq "$zip" >/dev/null
listing=$(unzip -Z1 "$zip")
for required in index.html THIRD_PARTY_NOTICES.md vendor/paddle/det.onnx vendor/paddle/rec.onnx \
                vendor/ort/ort-wasm-simd-threaded.wasm vendor/zxing/zxing_reader.wasm; do
  grep -qx "$required" <<<"$listing" || { echo "missing from $zip: $required" >&2; exit 1; }
done
grep -q '^vendor/licenses/' <<<"$listing" || { echo "no vendor/licenses/ in $zip" >&2; exit 1; }
echo "verified $zip"
