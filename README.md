# 📰 정책/지원금 통합 모니터링 대시보드

대한민국 정부 전 부처 공식 보도자료를 실시간으로 모니터링하고, AI 블로그 포스팅 프롬프트를 자동 생성하는 개인용 대시보드입니다.

## ✨ 주요 기능

- **통합 RSS 수집**: 대한민국 정책브리핑(`korea.kr`) 전체 보도자료 RSS 실시간 파싱
- **스마트 카테고리 탭**: 전체보기 / 📌 상세·신청(알맹이) / 경제·부동산 / 생활·복지 / 기타 부처
- **블랙리스트 필터링**: 단순 동정·행사 기사(장관 방문, 간담회, MOU 등) 자동 제외
- **키워드 검색**: 제목·요약·부처명 기준 실시간 검색
- **블로그 프롬프트 복사**: 보수적 사실 기반 포스팅 초안 작성용 프롬프트를 클립보드에 복사
- **포스팅 완료 표시**: LocalStorage 활용, 완료된 카드 흐리게 처리 및 숨기기/보기 토글
- **모바일 최적화**: Mobile-First 반응형 UI, 탭 가로 스크롤, 터치 친화적 버튼

## 🛠 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| RSS 파싱 | rss-parser |
| 아이콘 | lucide-react |
| 배포 | Vercel |

## 🚀 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── rss/
│   │       └── route.ts   # RSS Proxy API (CORS 우회 + 파싱)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
└── components/
    └── Dashboard.tsx      # 전체 UI 컴포넌트
```

## 🔗 데이터 소스

- 대한민국 정책브리핑 통합 보도자료 RSS: `https://www.korea.kr/rss/pressrelease.xml`
