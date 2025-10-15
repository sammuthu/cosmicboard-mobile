#!/bin/bash

# iOS Restart Script - Fixes "No script URL provided" error

echo "🔄 Restarting iOS app with fresh Metro bundler..."

# Kill Metro bundler
echo "1️⃣ Killing any existing Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "   ✓ Port 8081 is free"

# Clear caches
echo "2️⃣ Clearing Metro and Expo caches..."
rm -rf .expo node_modules/.cache ios/build 2>/dev/null
echo "   ✓ Caches cleared"

# Wait a moment
sleep 1

# Start fresh
echo "3️⃣ Starting Metro bundler with clear cache..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Metro Bundler Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next steps:"
echo "   1. Wait for 'Metro waiting on exp://...' message"
echo "   2. Press 'i' to open iOS simulator"
echo "   3. App should auto-login as nmuthu@gmail.com"
echo ""

npx expo start --clear --ios
