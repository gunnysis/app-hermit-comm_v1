// +html.tsx — 웹 전역 HTML 문서 (SEO 메타태그 + Open Graph + 구조화 데이터)
// https://docs.expo.dev/router/reference/static-rendering/#root-html
// https://searchadvisor.naver.com/guide/markup-content
// https://developers.google.com/search/docs/essentials?hl=ko

import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 사이트 제목 */}
        <title>은둔마을 - 은둔·고립 청년을 위한 익명 소통 공간</title>

        {/* 페이지 설명 */}
        <meta
          name="description"
          content="은둔마을은 은둔·고립 청년들이 익명으로 마음을 나누고 서로 연결되는 소통 공간입니다. 일상, 감정, 고민을 편하게 글로 나눠보세요."
        />

        {/* Google: robots meta (기본 index,follow + 스니펫/이미지 미리보기 제어) */}
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />

        {/* Google Search Console 인증 (등록 후 값 교체) */}
        {/* <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" /> */}

        {/* 네이버 서치어드바이저 인증 (등록 후 값 교체) */}
        {/* <meta name="naver-site-verification" content="YOUR_VERIFICATION_CODE" /> */}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="은둔마을 - 은둔·고립 청년을 위한 익명 소통 공간" />
        <meta
          property="og:description"
          content="은둔마을은 은둔·고립 청년들이 익명으로 마음을 나누고 서로 연결되는 소통 공간입니다. 일상, 감정, 고민을 편하게 글로 나눠보세요."
        />
        <meta property="og:url" content="https://www.eundunmaeul.store" />
        <meta property="og:site_name" content="은둔마을" />
        <meta property="og:image" content="https://www.eundunmaeul.store/og-image.png" />
        <meta property="og:image:width" content="3168" />
        <meta property="og:image:height" content="1344" />
        <meta property="og:locale" content="ko_KR" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="은둔마을 - 은둔·고립 청년을 위한 익명 소통 공간" />
        <meta
          name="twitter:description"
          content="은둔마을은 은둔·고립 청년들이 익명으로 마음을 나누고 서로 연결되는 소통 공간입니다."
        />
        <meta name="twitter:image" content="https://www.eundunmaeul.store/og-image.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://www.eundunmaeul.store" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />

        {/* 모바일 친화성 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FFF8E7" />

        {/* Google: JSON-LD 구조화 데이터 — WebSite + SearchAction (사이트링크 검색창) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '은둔마을',
              alternateName: 'Eundunmaeul',
              url: 'https://www.eundunmaeul.store',
              description: '은둔·고립 청년들이 익명으로 마음을 나누고 서로 연결되는 소통 공간',
              inLanguage: 'ko',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://www.eundunmaeul.store/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
