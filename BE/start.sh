#!/bin/sh
set -e  # Exit on error

echo "=========================================="
echo "Starting application in production mode..."
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
    echo "COOLIFY_URL is set (redacted)"
else
    echo "COOLIFY_URL is not set"
fi
echo "=========================================="

# Run migrations
echo "Running database migrations..."
if ! node --es-module-specifier-resolution=node dist/migrations/run-migrations.js; then
    echo "Error: Database migrations failed!"
    exit 1
fi
echo "Database migrations completed successfully."

# Start the application
echo "Starting application..."
if ! node --es-module-specifier-resolution=node dist/index.js; then
    echo "Error: Application failed to start!"
    exit 1
fi 