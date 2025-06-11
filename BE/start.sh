#!/bin/sh

# Run migrations
echo "Running database migrations..."
node --es-module-specifier-resolution=node dist/migrations/run-migrations.js

# Start the application
echo "Starting application..."
node --es-module-specifier-resolution=node dist/index.js 