#!/bin/sh
set -e

# Applique les migrations Prisma en attente avant de démarrer l'API
node node_modules/prisma/build/index.js migrate deploy

exec node bin/server.js
