#!/bin/sh
# Sauvegarde quotidienne PostgreSQL (à planifier via cron sur le VPS)
# Exemple cron : 0 3 * * * /opt/bbudget/scripts/backup-db.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/bbudget_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Depuis l'hôte avec docker compose :
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-bbudget}" "${POSTGRES_DB:-bbudget}" | gzip > "$FILE"

echo "Backup OK : $FILE"

# Purge des anciennes sauvegardes
find "$BACKUP_DIR" -name "bbudget_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Purge > ${RETENTION_DAYS} jours effectuée"
