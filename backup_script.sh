#!/bin/bash

# Configuration
BACKUP_DIR="/root/backups"
DB_NAME="quizz"
DB_USER="postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="$BACKUP_DIR/$DB_NAME-$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform Backup
echo "Starting backup for $DB_NAME..."
PGPASSWORD='welcome@123' pg_dump -U $DB_USER -h localhost $DB_NAME > $FILENAME

if [ $? -eq 0 ]; then
  echo "Backup successful: $FILENAME"
  # Compress
  gzip $FILENAME
  echo "Compressed to $FILENAME.gz"
else
  echo "Backup failed!"
  exit 1
fi

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
echo "Old backups cleaned up."
