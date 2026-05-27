import { useEffect } from 'react';
import { Platform } from 'react-native';

interface SEOParams {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  /** 게시글 JSON-LD 구조화 데이터 (Google 리치 결과용) */
  jsonLd?: Record<string, unknown>;
  /** 페이지 색인 차단 (비공개 페이지용) */
  noindex?: boolean;
}

const SITE_NAME = '은둔마을';
const DEFAULT_TITLE = '은둔마을 - 은둔·고립 청년을 위한 익명 소통 공간';
const DEFAULT_DESC =
  '은둔마을은 은둔·고립 청년들이 익명으로 마음을 나누고 서로 연결되는 소통 공간입니다.';
const DEFAULT_IMAGE = 'https://www.eundunmaeul.store/og-image.png';
const SITE_URL = 'https://www.eundunmaeul.store';

const JSON_LD_ID = '__seo-json-ld';

function setMetaTag(property: string, content: string) {
  if (typeof document === 'undefined') return;
  const isOg = property.startsWith('og:') || property.startsWith('twitter:');
  const attr = isOg ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function setJsonLd(data: Record<string, unknown> | undefined) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = JSON_LD_ID;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * 웹에서 document.title, meta description, OG 태그, JSON-LD를 동적 업데이트.
 * Google: 구조화 데이터 + robots meta 지원
 * 네이버: OG 태그 + description 지원
 * 네이티브에서는 아무것도 하지 않음.
 */
export function useSEO({ title, description, url, image, jsonLd, noindex }: SEOParams) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const pageUrl = url ? `${SITE_URL}${url}` : SITE_URL;
    const ogImage = image || DEFAULT_IMAGE;

    // 기본 메타
    document.title = fullTitle;
    setMetaTag('description', desc);

    // Google robots meta (noindex 지원)
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag(
        'robots',
        'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      );
    }

    // OG
    setMetaTag('og:title', fullTitle);
    setMetaTag('og:description', desc);
    setMetaTag('og:url', pageUrl);
    setMetaTag('og:image', ogImage);

    // Twitter
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', desc);
    setMetaTag('twitter:image', ogImage);

    // Canonical
    setCanonical(pageUrl);

    // JSON-LD 구조화 데이터 (Google 리치 결과)
    setJsonLd(jsonLd);

    // cleanup: 페이지 이탈 시 기본값 복원
    return () => {
      if (Platform.OS !== 'web') return;
      document.title = DEFAULT_TITLE;
      setMetaTag('description', DEFAULT_DESC);
      setMetaTag(
        'robots',
        'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      );
      setMetaTag('og:title', DEFAULT_TITLE);
      setMetaTag('og:description', DEFAULT_DESC);
      setMetaTag('og:url', SITE_URL);
      setMetaTag('og:image', DEFAULT_IMAGE);
      setMetaTag('twitter:title', DEFAULT_TITLE);
      setMetaTag('twitter:description', DEFAULT_DESC);
      setMetaTag('twitter:image', DEFAULT_IMAGE);
      setCanonical(SITE_URL);
      setJsonLd(undefined);
    };
  }, [title, description, url, image, jsonLd, noindex]);
}
