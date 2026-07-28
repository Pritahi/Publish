#!/bin/sh
set -e

# NotaryPro Docker Entrypoint
# Runs Prisma migrations on startup, then starts the Next.js server

echo "==> NotaryPro SaaS Starting..."

# Run Prisma database push (for SQLite, this creates/migrates the DB file)
echo "==> Running database setup..."
npx prisma db push --skip-generate

echo "==> Starting Next.js server..."
exec "$@"
