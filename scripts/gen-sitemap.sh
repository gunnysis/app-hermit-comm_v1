#!/usr/bin/env bash
# gen-sitemap.sh — Supabase에서 활성 게시글을 조회하여 sitemap.xml 동적 생성
#
# 사용법:
#   bash scripts/gen-sitemap.sh          # public/sitemap.xml 생성
#
# 빌드 전 실행하여 최신 게시글 URL을 sitemap에 반영

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# .env에서 환경변수 로드
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
fi

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL:-}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
SITE_URL="https://www.eundunmaeul.store"
OUTPUT_FILE="$ROOT/public/sitemap.xml"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "❌ EXPO_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다."
  echo "   .env 파일을 확인하세요."
  exit 1
fi

echo "=== Sitemap 생성 ==="

# 임시 파일 생성
TMPFILE="$(mktemp)"
trap 'rm -f "$TMPFILE"' EXIT

# Supabase REST API로 활성 게시글 조회 (deleted_at IS NULL, post_type = post)
curl -s \
  "${SUPABASE_URL}/rest/v1/posts?deleted_at=is.null&post_type=eq.post&select=id,updated_at&order=updated_at.desc&limit=1000" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/json" \
  -o "$TMPFILE"

# JSON 파싱 에러 체크
if grep -q '"message"' "$TMPFILE"; then
  echo "❌ Supabase API 에러:"
  cat "$TMPFILE"
  exit 1
fi

# sitemap.xml 생성 (Node.js로 JSON 파싱 + XML 출력)
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const siteUrl = 'https://www.eundunmaeul.store';
const now = new Date().toISOString();

console.error('📄 활성 게시글 ' + (Array.isArray(data) ? data.length : 0) + '개 조회 완료');

let xml = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n';
xml += '<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n';

// 정적 페이지
xml += '  <url>\n';
xml += '    <loc>' + siteUrl + '/</loc>\n';
xml += '    <lastmod>' + now + '</lastmod>\n';
xml += '    <changefreq>hourly</changefreq>\n';
xml += '    <priority>1.0</priority>\n';
xml += '  </url>\n';

xml += '  <url>\n';
xml += '    <loc>' + siteUrl + '/search</loc>\n';
xml += '    <changefreq>daily</changefreq>\n';
xml += '    <priority>0.6</priority>\n';
xml += '  </url>\n';

// 동적 게시글 페이지
if (Array.isArray(data)) {
  for (const post of data) {
    const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : now;
    xml += '  <url>\n';
    xml += '    <loc>' + siteUrl + '/post/' + post.id + '</loc>\n';
    xml += '    <lastmod>' + lastmod + '</lastmod>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }
}

xml += '</urlset>\n';
process.stdout.write(xml);
" "$TMPFILE" > "$OUTPUT_FILE"

URLS=$(grep -c '<loc>' "$OUTPUT_FILE")
echo "✅ Sitemap 생성 완료: $OUTPUT_FILE (${URLS}개 URL)"
