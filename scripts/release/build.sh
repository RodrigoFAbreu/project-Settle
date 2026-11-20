#!/usr/bin/env bash
# Builds the release artifacts for one version into dist/ at the repository root:
# settle-vX.Y.Z.zip (the built site, as the release publishes it) and SHA256SUMS.
# Usage: scripts/release/build.sh X.Y.Z   (also .workflow-controller/policy.json)
set -euo pipefail
version=${1:?version, such as 0.8.0}
root=$(git rev-parse --show-toplevel)
out="$root/dist"
rm -rf "$out"
mkdir -p "$out"
(cd "$root/app" && npm ci && npm run build)
(cd "$root/app/dist" && zip -qr "$out/settle-v$version.zip" .)
(cd "$out" && sha256sum "settle-v$version.zip" > SHA256SUMS)
echo "built $out/settle-v$version.zip"
