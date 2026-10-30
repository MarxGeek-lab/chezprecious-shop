#!/bin/bash
# À exécuter UNE SEULE FOIS sur le serveur pour migrer les uploads existants
# vers le dossier persistant hors du build.
#
# Usage : bash scripts/migrate-uploads.sh

set -e

API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PERSISTENT="$(dirname "$API_DIR")/uploads"

echo "API dir     : $API_DIR"
echo "Persistant  : $PERSISTENT"

mkdir -p "$PERSISTENT"

# Copier les uploads existants s'il y en a
for SRC in \
  "$API_DIR/public/uploads" \
  "$API_DIR/build/public/uploads"; do
  if [ -d "$SRC" ] && [ ! -L "$SRC" ]; then
    echo "Copie $SRC → $PERSISTENT ..."
    cp -rn "$SRC/." "$PERSISTENT/" 2>/dev/null || true
  fi
done

echo "Migration terminée. Lance maintenant 'npm run build' pour créer le symlink."
