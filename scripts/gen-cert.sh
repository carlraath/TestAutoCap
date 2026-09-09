#!/usr/bin/env bash
# Generates a self-signed certificate for local HTTPS (npm run start:https).
# Production hosts terminate TLS themselves or use a real certificate; see guides/hosting-guide.md.
set -euo pipefail
# Git Bash on Windows rewrites /CN=... as a path unless told not to.
export MSYS_NO_PATHCONV=1
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 90 \
  -keyout certs/dev-key.pem -out certs/dev-cert.pem \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
echo "Wrote certs/dev-key.pem and certs/dev-cert.pem (self-signed, 90 days)."
