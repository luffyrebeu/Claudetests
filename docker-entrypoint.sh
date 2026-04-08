#!/bin/sh
set -e

# Apply any pending schema changes (creates the DB file on first run)
node node_modules/prisma/build/index.js db push --skip-generate

exec node server.js
