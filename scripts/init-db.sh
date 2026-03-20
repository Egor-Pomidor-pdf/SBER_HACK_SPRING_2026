#!/bin/bash
set -e

echo "Running migrations..."
for f in /docker-entrypoint-initdb.d/migrations/*.sql; do
    echo "Applying $f..."
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$f"
done

echo "Running seed data..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/migrations/seed.sql 2>/dev/null || true

echo "Database initialization complete."
