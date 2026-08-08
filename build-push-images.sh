#!/bin/bash
# WoWSQL — Build and Push Docker Images to Docker Hub
# Run from the wowmysql monorepo root:
#   bash wowsql-self/build-push-images.sh [version]
#
# Builds auth/storage/realtime from services/ (same as cloud data plane).

set -e

VERSION="${1:-latest}"
ORG="wowsql"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "══════════════════════════════════════════════"
echo "  WoWSQL — Building & Pushing Docker Images"
echo "  Version: $VERSION"
echo "  Root: $ROOT"
echo "══════════════════════════════════════════════"
echo ""

docker info >/dev/null 2>&1 || { echo "ERROR: Docker not running"; exit 1; }

echo "─── Building wowsql/auth ─────────────────────"
docker build -t "$ORG/auth:$VERSION" -t "$ORG/auth:latest" "$ROOT/services/wowsql-auth"
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/storage ──────────────────"
docker build -t "$ORG/storage:$VERSION" -t "$ORG/storage:latest" "$ROOT/services/wowsql-storage"
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/realtime ─────────────────"
docker build -t "$ORG/realtime:$VERSION" -t "$ORG/realtime:latest" "$ROOT/services/wowsql-realtime"
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/studio (self-hosted) ─────"
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 \
  --build-arg NEXT_PUBLIC_KONG_URL=http://localhost:8080 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:8080 \
  --build-arg NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_SELF_HOSTED=true \
  -t "$ORG/studio:$VERSION" -t "$ORG/studio:latest" \
  "$ROOT/wowsql-self/studio"
echo "    ✓ Built"

echo ""
echo "─── Building wowsql/self-backend ─────────────"
docker build -t "$ORG/self-backend:$VERSION" -t "$ORG/self-backend:latest" "$ROOT/wowsql-self/backend"
echo "    ✓ Built"

echo ""
echo "══════════════════════════════════════════════"
echo "  Pushing images to Docker Hub..."
echo "══════════════════════════════════════════════"
echo ""

for img in auth storage realtime studio self-backend; do
  echo "─── Pushing wowsql/$img ─────────────────────"
  docker push "$ORG/$img:$VERSION"
  docker push "$ORG/$img:latest"
  echo "    ✓ Pushed"
done

if docker image inspect "$ORG/postgres:18" >/dev/null 2>&1; then
  echo "─── Pushing wowsql/postgres ─────────────────"
  docker push "$ORG/postgres:18" || true
  docker tag "$ORG/postgres:18" "$ORG/postgres:latest" 2>/dev/null || true
  docker push "$ORG/postgres:latest" 2>/dev/null || true
  echo "    ✓ Pushed"
fi

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ Images pushed to hub.docker.com/u/$ORG"
echo "══════════════════════════════════════════════"
