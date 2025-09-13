#!/bin/bash

# Health Check Script for Polling App
# Usage: ./scripts/health-check.sh [your-production-url]

set -e

# Default URL (replace with your actual Vercel URL)
DEFAULT_URL="https://your-production-url.vercel.app"
URL=${1:-$DEFAULT_URL}

echo "🔍 Health Check for: $URL"
echo "=================================="

# Check if URL is still the default placeholder
if [[ "$URL" == "$DEFAULT_URL" ]]; then
    echo "⚠️  Please provide your actual production URL:"
    echo "   ./scripts/health-check.sh https://your-app.vercel.app"
    echo ""
    echo "💡 To get your Vercel URL:"
    echo "   1. Go to https://vercel.com/dashboard"
    echo "   2. Find your project"
    echo "   3. Copy the production URL"
    exit 1
fi

echo "1️⃣ Checking homepage availability..."
if curl -I -s --max-time 10 "$URL" | head -1 | grep -q "200 OK"; then
    echo "   ✅ Homepage is accessible"
else
    echo "   ❌ Homepage is not accessible"
    exit 1
fi

echo ""
echo "2️⃣ Checking health API endpoint..."
HEALTH_RESPONSE=$(curl -sS --max-time 10 "$URL/api/health" || echo "ERROR")

if [[ "$HEALTH_RESPONSE" == "ERROR" ]]; then
    echo "   ❌ Health API is not accessible"
    exit 1
fi

# Parse the health response
STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
TIMESTAMP=$(echo "$HEALTH_RESPONSE" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)

if [[ "$STATUS" == "healthy" ]]; then
    echo "   ✅ Application is healthy"
    echo "   📅 Last check: $TIMESTAMP"
    
    # Extract database status if available
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")
    if [[ "$DB_STATUS" == "up" ]]; then
        echo "   🗄️  Database: Connected"
    else
        echo "   🗄️  Database: $DB_STATUS"
    fi
else
    echo "   ❌ Application is unhealthy: $STATUS"
    echo "   📅 Last check: $TIMESTAMP"
    exit 1
fi

echo ""
echo "🎉 All health checks passed!"
echo "   Your polling app is running smoothly at: $URL"
