#!/bin/bash

echo "🚀 Quick Deploy Test"

# Stop PM2 if running
pm2 stop spotify-clone-api 2>/dev/null || true

# Build
echo "🏗️  Building..."
npm run build

# Setup database
echo "🗄️  Database setup..."
NODE_ENV=production npm run db:setup

# Start with ecosystem
echo "▶️  Starting PM2..."
pm2 start ecosystem.config.js

# Status
echo "✅ Deployment complete!"
pm2 status 