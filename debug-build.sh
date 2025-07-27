#!/bin/bash

echo "🔍 Debug Build Issues"
echo "===================="

# Check Node.js version
echo "📍 Node.js version:"
node --version

# Check NPM version  
echo "📍 NPM version:"
npm --version

# Check TypeScript installation
echo "📍 TypeScript version:"
npx tsc --version

# Check if package.json exists
echo "📍 Package.json exists:"
ls -la package.json

# Check if tsconfig.json exists
echo "📍 tsconfig.json exists:"
ls -la tsconfig.json

# Check node_modules
echo "📍 Node modules:"
ls -la node_modules/ | head -5

# Check TypeScript specific packages
echo "📍 TypeScript related packages:"
npm list typescript ts-node @types/node --depth=0

# Check environment variables
echo "📍 Environment variables:"
echo "NODE_ENV: $NODE_ENV"
echo "PWD: $PWD"

# Try building with verbose output
echo "📍 Attempting build with verbose output:"
npm run build -- --verbose

echo "🔍 Debug completed!" 