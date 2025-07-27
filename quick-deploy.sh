#!/bin/bash

echo "🚀 Quick Deploy Test"

# Stop PM2 if running
pm2 stop spotify-clone-api 2>/dev/null || true

# Build
echo "🏗️  Building..."
npm run build

# Migrate database (preserve existing data)
echo "🗄️  Database migration..."
NODE_ENV=production npm run db:migrate

# Start with ecosystem
echo "▶️  Starting PM2..."
pm2 start ecosystem.config.js

# Status
echo "✅ Deployment complete!"
pm2 status 