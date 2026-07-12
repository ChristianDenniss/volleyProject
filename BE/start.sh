#!/bin/sh
set -e  # Exit on error

echo "=========================================="
echo "Starting application (NODE_ENV=${NODE_ENV:-development})..."
echo "Node version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "=========================================="

# Log environment variable presence
echo "Environment variables:"
if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set (redacted)"
else
    echo "DATABASE_URL is not set"
fi
if [ -n "$COOLIFY_URL" ]; then
    echo "COOLIFY_URL is set (redacted) - This is your API URL"
fi
echo "=========================================="

# Run migrations in production only; local docker dev syncs schema on startup
if [ "$NODE_ENV" = "production" ]; then
    echo "Running database migrations..."
    if ! node --es-module-specifier-resolution=node dist/migrations/run-migrations.js; then
        echo "Error: Database migrations failed!"
        exit 1
    fi
    echo "Database migrations completed successfully."
else
    echo "Skipping migrations in development (schema syncs on startup)."
fi

# Start the application
echo "Starting application..."
if ! node --es-module-specifier-resolution=node dist/index.js; then
    echo "Error: Application failed to start!"
    exit 1
fi 