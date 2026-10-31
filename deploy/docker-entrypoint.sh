#!/bin/sh
set -e
echo "Sync schéma Prisma…"
node ./node_modules/prisma/build/index.js db push --skip-generate
echo "Démarrage de l'appli…"
exec node server.js
