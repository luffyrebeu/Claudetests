#!/bin/sh
set -e

# Apply any pending schema changes (creates the DB file on first run)
node_modules/.bin/prisma db push --skip-generate

exec node server.js
