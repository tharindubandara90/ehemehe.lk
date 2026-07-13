#!/usr/bin/env bash
set -euo pipefail
SITE_URL="${1:-https://wspwvv3ia8.youware.app/}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/public"
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"
cd "$PUBLIC_DIR"

wget \
  --mirror \
  --page-requisites \
  --adjust-extension \
  --convert-links \
  --no-parent \
  --span-hosts \
  --domains=wspwvv3ia8.youware.app,youware.app \
  --restrict-file-names=windows \
  --execute robots=off \
  "$SITE_URL"

# Move downloaded host folder contents to public root if wget created one.
if [ -d "$PUBLIC_DIR/wspwvv3ia8.youware.app" ]; then
  shopt -s dotglob
  mv "$PUBLIC_DIR/wspwvv3ia8.youware.app"/* "$PUBLIC_DIR/"
  rm -rf "$PUBLIC_DIR/wspwvv3ia8.youware.app"
fi

# Vercel needs an index.html at public root.
if [ ! -f "$PUBLIC_DIR/index.html" ]; then
  echo "ERROR: public/index.html was not created. Check the site URL or wget output." >&2
  exit 1
fi

echo "Done. Static site files are in: $PUBLIC_DIR"
