#!/usr/bin/env bash
# Déploie ChezPrecious sur le serveur depuis ce poste.
#
#   ./deploy/deploy.sh
#
# - envoie le code dans ~/chezprecious sur le serveur (rsync, sans node_modules,
#   builds, secrets ni uploads) ;
# - construit les images une par une (pour ménager la RAM des autres sites) ;
# - (re)démarre uniquement le projet compose « chezprecious ».
#
# Les fichiers .env et api/.env.production doivent déjà exister sur le serveur
# (voir .env.example et api/.env.production.example).
set -euo pipefail

SERVER=${SERVER:-econstructiv@169.58.204.147}
REMOTE_DIR=${REMOTE_DIR:-chezprecious}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'api/build/' \
  --exclude 'api/tmp/' \
  --exclude 'api/public/uploads/' \
  --exclude '.env' \
  --exclude '.env.production' \
  --exclude '.env.local' \
  --exclude '.codex' \
  --exclude '.claude' \
  --exclude '*.pdf' \
  --exclude '/*.png' \
  --exclude '/*.jpg' \
  --exclude '/*.jpeg' \
  "$ROOT/" "$SERVER:$REMOTE_DIR/"

ssh "$SERVER" bash -s -- "$REMOTE_DIR" <<'EOF'
set -euo pipefail
cd "$1"

for f in .env api/.env.production; do
  if [[ ! -f $f ]]; then
    echo "Fichier manquant sur le serveur : ~/$1/$f" >&2
    exit 1
  fi
done

docker compose build api
docker compose build site
docker compose build admin
docker compose up -d
docker compose ps
EOF
