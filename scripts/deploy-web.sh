#!/usr/bin/env bash
# deploy-web.sh — Expo Web 빌드 + Vercel 배포 + 도메인 alias 갱신
#
# 사용법: npm run deploy:web

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOMAIN="eundunmaeul.store"
WWW_DOMAIN="www.eundunmaeul.store"

echo "=== 1. Expo Web 빌드 ==="
npx expo export -p web

echo ""
echo "=== 2. Vercel 배포 ==="
DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://gns-hermit-comm-[a-z0-9]*-jeonggeon-parks-projects\.vercel\.app' | tail -1)

if [ -z "$DEPLOY_URL" ]; then
  # fallback: vercel ls로 최신 배포 URL 가져오기
  DEPLOY_URL=$(vercel ls 2>/dev/null | grep Ready | head -1 | awk '{print $3}')
fi

echo "배포 URL: $DEPLOY_URL"

echo ""
echo "=== 3. 도메인 alias 갱신 ==="
vercel alias set "$DEPLOY_URL" "$DOMAIN"
vercel alias set "$DEPLOY_URL" "$WWW_DOMAIN"

echo ""
echo "✅ 배포 완료: https://$DOMAIN"
