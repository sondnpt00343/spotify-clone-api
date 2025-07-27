#!/bin/bash

echo "🚀 Starting deployment..."

# Set production environment
export NODE_ENV=production

# Stop PM2 if running
echo "⏹️  Stopping PM2..."
pm2 stop spotify-clone-api 2>/dev/null || true

  # Install dependencies
  echo "📦 Installing dependencies..."
  npm i
  
  # Clean previous build
  echo "🧹 Cleaning previous build..."
  rm -rf dist/
  
  # Build the application with verbose output
  echo "🏗️  Building application..."
  NODE_ENV=production npm run build
  
  # Check TypeScript compilation
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    echo "🔍 Checking TypeScript installation..."
    npx tsc --version
    exit 1
  fi

# Check if build was successful
if [ ! -f "dist/app.js" ]; then
    echo "❌ Build failed - dist/app.js not found"
    exit 1
fi

# Setup database
echo "🗄️  Setting up database..."
npm run db:setup

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/images uploads/audio uploads/temp
chmod -R 755 uploads

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs
chmod 755 logs

# Start PM2
echo "▶️  Starting PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo "✅ Deployment complete!"
pm2 status

# Test health check
echo "🔍 Testing health check..."
sleep 3
curl -f http://localhost:3000/health || echo "⚠️  Health check failed"

echo "🎉 Deployment finished!" 