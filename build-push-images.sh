#!/bin/bash
# WoWSQL — Build and Push Docker Images to Docker Hub
# Run from the root of the wowmysql project directory
#
# Usage: bash build-push-images.sh [version]
# Example: bash build-push-images.sh v1.0.0

set -e

VERSION="${1:-latest}"
ORG="wowsql"

echo ""
echo "══════════════════════════════════════════════"
echo "  WoWSQL — Building & Pushing Docker Images"
echo "  Version: $VERSION"
echo "══════════════════════════════════════════════"
echo ""

# Check we're in the right directory
if [ ! -f "docker-compose.local.yml" ]; then
  echo "ERROR: Run this from the wowmysql project root directory"
  echo "  cd ~/projects/wowmysql && bash wowsql-self/build-push-images.sh"
  exit 1
fi

# Check docker login
docker info >/dev/null 2>&1 || { echo "ERROR: Docker not running"; exit 1; }

echo "─── Building wowsql/auth ─────────────────────"
docker build -t $ORG/auth:$VERSION -t $ORG/auth:latest ./services/wowsql-auth
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/storage ──────────────────"
docker build -t $ORG/storage:$VERSION -t $ORG/storage:latest ./services/wowsql-storage
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/realtime ─────────────────"
docker build -t $ORG/realtime:$VERSION -t $ORG/realtime:latest ./services/wowsql-realtime
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/studio ───────────────────"
docker build -t $ORG/studio:$VERSION -t $ORG/studio:latest ./dashboard
echo "    ✓ Built"

echo ""
echo "─── Checking wowsql/postgres:18 ─────────────"
if docker image inspect $ORG/postgres:18 >/dev/null 2>&1; then
  echo "    ✓ Already exists locally"
else
  echo "    ⚠ Not found locally. Build it first or skip."
  echo "    (If you've already pushed it, that's fine)"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  Pushing images to Docker Hub..."
echo "══════════════════════════════════════════════"
echo ""

echo "─── Pushing wowsql/auth ─────────────────────"
docker push $ORG/auth:$VERSION
docker push $ORG/auth:latest
echo "    ✓ Pushed"

echo ""
echo "─── Pushing wowsql/storage ──────────────────"
docker push $ORG/storage:$VERSION
docker push $ORG/storage:latest
echo "    ✓ Pushed"

echo ""
echo "─── Pushing wowsql/realtime ─────────────────"
docker push $ORG/realtime:$VERSION
docker push $ORG/realtime:latest
echo "    ✓ Pushed"

echo ""
echo "─── Pushing wowsql/studio ───────────────────"
docker push $ORG/studio:$VERSION
docker push $ORG/studio:latest
echo "    ✓ Pushed"

echo ""
echo "─── Pushing wowsql/postgres ─────────────────"
if docker image inspect $ORG/postgres:18 >/dev/null 2>&1; then
  docker push $ORG/postgres:18
  docker push $ORG/postgres:latest 2>/dev/null || docker tag $ORG/postgres:18 $ORG/postgres:latest && docker push $ORG/postgres:latest
  echo "    ✓ Pushed"
else
  echo "    ⚠ Skipped (image not found locally)"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ All images pushed to hub.docker.com/u/$ORG"
echo "══════════════════════════════════════════════"
echo ""
echo "  Images available:"
echo "    docker pull $ORG/auth:$VERSION"
echo "    docker pull $ORG/storage:$VERSION"
echo "    docker pull $ORG/realtime:$VERSION"
echo "    docker pull $ORG/studio:$VERSION"
echo "    docker pull $ORG/postgres:18"
echo ""
