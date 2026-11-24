# RefMind — Visual Site Intelligence for mymind

**RefMind**는 `mymind`에 저장된 수많은 인터넷 사이트를 시각적으로 탐색하고, 강력한 키워드/연산자 검색, 자동 카테고리 분류, 그리고 선택한 사이트와 유사한 사이트 추천을 제공하는 **macOS 네이티브 데스크톱 앱**입니다.

- **Runtime & Framework**: Electrobun v2 (`2.0.7`) + Bun + Native macOS `WKWebView` + React 19 + Tailwind CSS v4 + SQLite (FTS5)
- **Design Inspiration**: `refto.one` (좌측 네이티브 사이드바, 스마트 폴더, 카드 밀도 슬라이더, 비주얼 중심 매이슨리 그리드) + `mymind` (Top of Mind 고정 바, 에디토리얼 세리프 타이포그래피, 컬러 상단 바 카드 디자인)

## 주요 기능

1. **mymind 공식 API 연동 (`https://api.mymind.com`)**
   - 요청별 HS256 JWT 서명 인증 (`https://access.mymind.com/api/authentication` 스펙 준수)
   - **Secret 지연 입력**: 앱 실행 시 별도 키 없이도 즉시 데모 모드로 체험 가능하며, `Settings (⌘,)`에서 나중에 `Key ID (kid)`와 `Base64 Secret`을 입력해 연결할 수 있습니다.
   - 기존 저장 사이트 전체 동기화 + 백그라운드 자동 동기화 (향후 저장되는 사이트 자동 반영) + 앱 내에서 새 사이트 저장 (`⌘N`, `POST /objects`)
   - 썸네일/스크린샷 로컬 디스크 캐시 프록시로 5분 서명 URL 만료 없이 빠른 비주얼 로딩
2. **강력한 키워드 & 연산자 검색 (`⌘F`)**
   - SQLite FTS5 + 한글/영문 부분 일치 검색
   - `#tag`, `tag:`, `domain:`, `cat:`, `type:`, `is:pinned`, `is:untagged` 연산자 및 색상 팔레트 필터 지원
3. **자동 카테고리 분류 & 스마트 폴더**
   - 도메인·키워드·태그·메모 신호를 종합해 9개 핵심 카테고리로 자동 분류 (수동 오버라이드 및 전체 재분류 가능)
   - 검색 쿼리 기반 커스텀 Smart Folder 생성
4. **유사 사이트 추천 (`Similar Sites in Your Mind`)**
   - `mymind` API 임베딩 벡터(`include=embeddings`) 코사인 유사도 + TF-IDF 콘텐츠 유사도 + 태그 Jaccard + 카테고리/컬러 팔레트 유사도를 결합한 하이브리드 추천

## 실행 방법

```bash
# 의존성 설치
bun install

# Electrobun v2 devkit 준비 (최초 1회)
bunx electrobun prepare

# macOS 데스크톱 앱 실행 (프론트엔드 빌드 + Electrobun dev)
bun run dev

# 프로덕션 macOS 앱 번들 빌드
bun run build

# 테스트 및 타입 체크
bun run typecheck
bun test
```

## 키보드 단축키

- `⌘F`: 검색창 포커스
- `⌘N`: 새 사이트 저장
- `⌘,`: mymind API Secret 및 설정 열기
- `⌘\`: 좌측 사이드바 토글
- `⌘R`: mymind 동기화 / 새로고침
- `Esc`: Inspector / 모달 닫기
