#!/bin/bash
# WoWSQL Self-Hosted — Reset Script
# This will DELETE all data and start fresh. Use with caution!

set -e

echo ""
echo "  ⚠️  WARNING: This will delete ALL WoWSQL data!"
echo "  - Database contents"
echo "  - Storage files"
echo "  - Redis cache"
echo ""
read -p "  Are you sure? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo "  Cancelled."
  exit 0
fi

echo ""
echo "  Stopping containers..."
docker compose down -v

echo "  Removing volumes..."
docker volume rm -f docker_db-data docker_redis-data docker_storage-data 2>/dev/null || true

echo "  Starting fresh..."
docker compose up -d

echo ""
echo "  ✅ WoWSQL has been reset to a clean state."
echo "  Dashboard: http://localhost:3000"
echo "  API:       http://localhost:8080"
echo ""
