#!/bin/sh
set -e  # Exit on error

echo "=========================================="
echo "Starting application in production mode..."
echo "Node version: $(node --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
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