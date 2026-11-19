# syntax=docker/dockerfile:1
# Packages an upstream Settle release ZIP (settle-vX.Y.Z.zip, the built site)
# into a static web image. Build context: this directory plus settle.zip
# (container/README.md). The ZIP is unpacked on the build platform, so an
# ARM64 image needs no emulation.
FROM --platform=$BUILDPLATFORM alpine:3.22 AS site
COPY settle.zip /tmp/settle.zip
RUN mkdir /site && unzip -q /tmp/settle.zip -d /site \
 && test -f /site/index.html \
 && test -f /site/THIRD_PARTY_NOTICES.md \
 && test -d /site/vendor/licenses \
 && test -f /site/vendor/paddle/det.onnx \
 && test -f /site/vendor/paddle/rec.onnx \
 && test -f /site/vendor/ort/ort-wasm-simd-threaded.wasm \
 && chmod -R a+rX /site

FROM nginx:1.28-alpine
ARG SETTLE_VERSION=unknown
ARG SOURCE_REVISION=unknown
LABEL org.opencontainers.image.source="https://github.com/RodrigoFAbreu/project-Settle" \
      org.opencontainers.image.title="Settle" \
      org.opencontainers.image.version="${SETTLE_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_REVISION}"
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=site /site /usr/share/nginx/html
# Unprivileged port, nginx user; all writes go to /tmp.
USER 101:101
EXPOSE 8080
