#!/usr/bin/env bash
# Configuration nginx + certificats HTTPS pour chezprecious.com.
# À lancer UNE fois sur le serveur, avec sudo, APRÈS le premier déploiement
# Docker (deploy/deploy.sh) :
#
#   sudo bash ~/chezprecious/deploy/setup-server.sh
#
# Le script ne touche qu'au fichier chezprecious.conf. Si « nginx -t »
# échoue, il retire ce fichier et ne recharge pas nginx : les autres sites
# du serveur ne sont jamais affectés.
set -euo pipefail

DOMAINS=(chezprecious.com www.chezprecious.com api.chezprecious.com admin.chezprecious.com)
SRC="$(cd "$(dirname "$0")" && pwd)/nginx/chezprecious.conf"
AVAILABLE=/etc/nginx/sites-available/chezprecious.conf
ENABLED=/etc/nginx/sites-enabled/chezprecious.conf

if [[ $EUID -ne 0 ]]; then
  echo "Ce script doit être lancé avec sudo." >&2
  exit 1
fi

if [[ -e $AVAILABLE ]]; then
  echo "$AVAILABLE existe déjà : arrêt pour ne rien écraser." >&2
  echo "(Supprimez-le manuellement si vous voulez vraiment le réinstaller.)" >&2
  exit 1
fi

# Vérifie que nginx est sain AVANT d'y toucher
nginx -t

install -m 644 "$SRC" "$AVAILABLE"
ln -s "$AVAILABLE" "$ENABLED"

if ! nginx -t; then
  echo "Configuration invalide : retrait de chezprecious.conf, nginx inchangé." >&2
  rm -f "$ENABLED" "$AVAILABLE"
  exit 1
fi
systemctl reload nginx
echo "nginx rechargé (HTTP)."

# Certificat Let's Encrypt — même méthode (plugin nginx) que les autres sites
certbot --nginx --non-interactive --agree-tos $(printf -- '-d %s ' "${DOMAINS[@]}") --redirect

nginx -t
systemctl reload nginx
echo "HTTPS actif pour : ${DOMAINS[*]}"
