# stock-recommendations 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 데이터 저장 | SQLite (bun:sqlite) | 트렌드 랭킹(5/20/60일)·목표가 히스토리 차트에 과거 데이터 필요 |
| 실시간 시세 | 한국투자증권 WebSocket (KIS API) | 진짜 실시간 스트림. API 키 발급 필요 (KIS Developers) |
| 스크래핑 소스 | 한경 컨센서스 (markets.hankyung.com/consensus) | 무료, 로그인 불필요, 전 증권사 커버 |
| 스크래핑 주기 | Next.js Route Handler + 30분 revalidate | 장 중 충분한 갱신 주기, 별도 인프라 불필요 |
| 차트 | recharts | React 기반, 번들 최적화 용이, dynamic import 가능 |
| 상태 관리 | React useState + SWR | 서버 상태(SWR), 클라이언트 상태(useState) 분리 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `data/stocks.db` | SQLite 파일 | `.gitignore` 추가 | Task 1 |
| `KIS_APP_KEY` | Env var | `.env.local` | Task 3 |
| `KIS_APP_SECRET` | Env var | `.env.local` | Task 3 |

## 데이터 모델

### Recommendation (추천종목)
- id (integer, PK autoincrement)
- stock_code (text, required) — 종목 코드 (예: 005930)
- stock_name (text, required) — 종목명
- firm (text, required) — 증권사명
- opinion (text, required) — 투자의견 (매수/중립/매도)
- target_price (integer, required) — 목표가 (원)
- scraped_at (text, required) — 스크래핑 시각 (ISO 8601)
- report_date (text, required) — 리포트 날짜

### PriceSnapshot (시세 스냅샷 — 실시간 갱신용 메모리 Map)
- stock_code → current_price (number)
- 서버 재시작 시 초기화 (실시간 스트림이 재연결하면 복구)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | Task 1, 2, 3 | Route Handler 패턴, RSC 경계, async params |
| vercel-react-best-practices | Task 2, 4, 5 | bundle-dynamic-imports(차트), client-swr-dedup, rerender-use-ref-transient-values(WebSocket) |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `app/page.tsx` | Modify | Task 2 |
| `app/layout.tsx` | Modify | Task 2 (메타데이터 변경) |
| `app/api/recommendations/route.ts` | New | Task 1 |
| `app/api/recommendations/scraper.ts` | New | Task 1 |
| `app/api/price-stream/route.ts` | New | Task 3 |
| `lib/db.ts` | New | Task 1 |
| `types/stock.ts` | New | Task 1 |
| `components/stock-recommendations/RecommendationList.tsx` | New | Task 2 |
| `components/stock-recommendations/RecommendationList.test.tsx` | New | Task 2 |
| `components/stock-recommendations/StockDetailModal.tsx` | New | Task 4 |
| `components/stock-recommendations/StockDetailModal.test.tsx` | New | Task 4 |
| `components/stock-recommendations/TrendRanking.tsx` | New | Task 5 |
| `components/stock-recommendations/TrendRanking.test.tsx` | New | Task 5 |
| `hooks/useRealtimePrice.ts` | New | Task 3 |
| `hooks/useRealtimePrice.test.ts` | New | Task 3 |

---

## Tasks

### Task 1: 스크래핑 서비스 + DB 스키마 + 추천종목 API

- **담당 시나리오**: Scenario 1 (data layer only — UI 없음)
- **크기**: M (4 파일)
- **의존성**: None — 고위험(스크래핑 성공 여부 불확실), fail-fast를 위해 첫 번째
- **참조**:
  - next-best-practices — route-handlers.md (Route Handler 기본 패턴)
  - `https://markets.hankyung.com/consensus` (스크래핑 대상 URL)
- **구현 대상**:
  - `types/stock.ts` — Recommendation, ConsensusData 타입
  - `lib/db.ts` — SQLite 초기화, createTables(), insertRecommendation(), getRecommendations(), getTrendRanking()
  - `app/api/recommendations/scraper.ts` — 한경 컨센서스 스크래핑 함수 (fetch + HTML 파싱)
  - `app/api/recommendations/route.ts` — GET: DB에서 오늘 추천종목 반환, POST: 스크래핑 트리거 (30분 revalidate)
- **수용 기준**:
  - [ ] `GET /api/recommendations` 호출 시 `{ data: Recommendation[] }` 형태의 JSON을 반환한다
  - [ ] 반환된 각 항목에 stock_code, stock_name, firm, opinion, target_price, report_date가 포함된다
  - [ ] DB에 같은 (stock_code, firm, report_date) 조합이 이미 있으면 중복 삽입하지 않는다
  - [ ] `GET /api/recommendations/trend?days=5` 호출 시 최근 5일 집계 Top 10이 반환된다
- **검증**: `bun run test -- RecommendationAPI` (Route Handler 단위 테스트, DB는 인메모리 SQLite)

---

### Checkpoint: Task 1 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `GET /api/recommendations` 실제 응답에 종목 데이터가 포함됨 (Browser MCP 또는 curl)

---

### Task 2: 추천종목 목록 UI (현재가 제외)

- **담당 시나리오**: Scenario 1 (현재가·상승여력 제외), Scenario 6 (로딩·빈 상태)
- **크기**: M (3 파일)
- **의존성**: Task 1 (API Route 필요)
- **참조**:
  - vercel-react-best-practices — client-swr-dedup (SWR로 API 폴링)
  - next-best-practices — rsc-boundaries.md ('use client' 경계)
  - wireframe.html — screen-0 (홈 목록 레이아웃, 모바일 카드 / 데스크톱 테이블)
- **구현 대상**:
  - `components/stock-recommendations/RecommendationList.tsx` — 추천종목 테이블(데스크톱) + 카드 리스트(모바일), 로딩 스켈레톤, 빈 상태
  - `components/stock-recommendations/RecommendationList.test.tsx`
  - `app/page.tsx` — RecommendationList + 레이아웃 배치
- **수용 기준**:
  - [ ] 페이지 진입 시 "오늘의 추천종목" 제목이 표시된다
  - [ ] API 응답 데이터가 있을 때 종목명, 증권사, 투자의견, 목표가를 포함한 행이 1개 이상 렌더된다
  - [ ] 데이터 로딩 중일 때 스켈레톤 카드 3개가 표시된다
  - [ ] 데이터가 0건일 때 "오늘의 추천종목이 아직 없습니다" 메시지가 표시된다
  - [ ] 로딩 중 상태와 빈 상태가 시각적으로 구분된다
- **검증**: `bun run test -- RecommendationList`

---

### Task 3: KIS WebSocket 실시간 시세 연동

- **담당 시나리오**: Scenario 1 (현재가 표시), Scenario 2 (실시간 갱신)
- **크기**: M (4 파일)
- **의존성**: Task 2 (목록 UI에 현재가 컬럼 삽입)
- **참조**:
  - `https://apiportal.koreainvestment.com/apiservice/oauth2#L_5c87ba63-740a-4166-93ac-803510bb9c02` (KIS WebSocket 접속키 발급)
  - vercel-react-best-practices — rerender-use-ref-transient-values (WebSocket 메시지 → ref 처리)
  - next-best-practices — route-handlers.md (WebSocket proxy route)
- **구현 대상**:
  - `app/api/price-stream/route.ts` — KIS WebSocket 접속키 발급 + 클라이언트에 SSE(Server-Sent Events)로 시세 전달
  - `hooks/useRealtimePrice.ts` — SSE 구독, stock_code → current_price Map 반환
  - `hooks/useRealtimePrice.test.ts` — mock SSE 이벤트로 훅 동작 검증
  - `lib/calcUpside.ts` + `lib/calcUpside.test.ts` — 상승여력 계산 순수 함수 (`(목표가 - 현재가) / 현재가 × 100`, 누락 시 null 반환)
- **수용 기준**:
  - [ ] 현재가가 PriceSnapshot에서 주입되어 각 종목 행에 표시된다
  - [ ] 현재가가 변경되면 해당 행의 현재가 셀이 새 값으로 업데이트된다
  - [ ] 현재가 변경에 따라 상승여력(%)이 `(목표가 - 현재가) / 현재가 × 100`으로 재계산되어 표시된다
  - [ ] 목표가나 현재가가 없는 종목의 상승여력은 "-"로 표시된다
  - [ ] WebSocket 이벤트 수신 시 투자의견·목표가·증권사 정보는 갱신되지 않는다 (현재가·상승여력만 갱신)
  - [ ] `calcUpside(98000, 82400)` → `18.93...%` 형태의 값을 반환한다 (단위 테스트)
  - [ ] `calcUpside(null, 82400)` → `null`을 반환한다 (단위 테스트)
- **검증**: `bun run test -- useRealtimePrice calcUpside` + Browser MCP — 홈 진입 후 현재가 셀 실시간 변경 확인, 스크린샷 `artifacts/stock-recommendations/evidence/task-3-realtime.png`

---

### Checkpoint: Tasks 1-3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 홈 화면에서 추천종목 목록이 표시되고 현재가가 실시간으로 변경됨 (end-to-end)

---

### Task 4: 종목 상세 모달

- **담당 시나리오**: Scenario 3 (전체)
- **크기**: M (3 파일)
- **의존성**: Task 2 (종목 행 클릭 이벤트), Task 1 (컨센서스 데이터 API), Task 3 (useRealtimePrice — 모달 내 현재가·상승여력 실시간 표시)
- **참조**:
  - wireframe.html — screen-1 (모달 레이아웃: bottom sheet 모바일 / center 데스크톱, 모달 헤더 현재가·상승여력 ⚡)
  - vercel-react-best-practices — bundle-dynamic-imports (recharts dynamic import)
  - shadcn Dialog 컴포넌트 (`components/ui/dialog.tsx` 존재 확인 — 외부 클릭 닫기 기본 제공 여부 확인)
- **구현 대상**:
  - `app/api/recommendations/[code]/route.ts` — 특정 종목의 컨센서스 집계(평균 목표가, 의견 분포) + 증권사별 리포트 목록 + 목표가 히스토리 반환
  - `components/stock-recommendations/StockDetailModal.tsx` — 컨센서스 요약, recharts LineChart(목표가 히스토리), 증권사별 리스트
  - `components/stock-recommendations/StockDetailModal.test.tsx`
- **수용 기준**:
  - [ ] 종목 행 클릭 시 모달이 열린다
  - [ ] 모달에 평균 목표가와 매수/중립/매도 건수가 표시된다
  - [ ] 모달에 날짜별 목표가 히스토리 차트가 표시된다
  - [ ] 모달에 증권사별 날짜, 투자의견, 목표가 리스트가 표시된다
  - [ ] X 버튼 클릭 또는 모달 외부 클릭 시 모달이 닫힌다
- **검증**: `bun run test -- StockDetailModal`

---

### Task 5: 트렌드 랭킹 섹션 + 기간 선택

- **담당 시나리오**: Scenario 4 (전체), Scenario 5 (전체)
- **크기**: S (2 파일)
- **의존성**: Task 1 (`/api/recommendations/trend` API), Task 2 (`app/page.tsx` 레이아웃 구성)
- **참조**:
  - wireframe.html — screen-0 우측 트렌드 랭킹 섹션
- **구현 대상**:
  - `components/stock-recommendations/TrendRanking.tsx` — Top 10 랭킹 테이블, 5일/20일/60일 기간 선택 칩
  - `components/stock-recommendations/TrendRanking.test.tsx`
- **수용 기준**:
  - [ ] 트렌드 랭킹 섹션에 최대 10개의 종목이 순위와 추천 건수와 함께 표시된다
  - [ ] 기간 선택 기본값은 5일이다
  - [ ] 20일 또는 60일 선택 시 랭킹 순위와 추천 건수가 즉시 변경된다
- **검증**: `bun run test -- TrendRanking`

---

### Checkpoint: Tasks 4-5 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 종목 클릭 → 모달 열림 → 컨센서스·차트·리스트 표시 → 닫기 end-to-end 동작
- [ ] 트렌드 랭킹 기간 변경 시 순위 즉시 변경

---

### Task 6: E2E 스모크 테스트 + 메타데이터

- **담당 시나리오**: Scenario 1, 3, 4 (E2E 검증)
- **크기**: S (2 파일)
- **의존성**: Task 1-5 전체
- **구현 대상**:
  - `e2e/stock-recommendations.spec.ts` — 홈 진입 → 목록 렌더 → 종목 클릭 → 모달 열림 → 닫기 → 트렌드 랭킹 기간 변경
  - `app/layout.tsx` — 메타데이터: title "오늘의 추천종목", description 업데이트
- **수용 기준**:
  - [ ] E2E: 홈 진입 시 "오늘의 추천종목" 텍스트가 페이지에 존재한다
  - [ ] E2E: 종목 행 클릭 후 모달이 화면에 표시된다
  - [ ] E2E: 모달 닫기 후 모달이 화면에서 사라진다
  - [ ] E2E: 트렌드 랭킹 "20일" 클릭 후 랭킹 섹션이 업데이트된다
- **검증**: `bun run test:e2e -- stock-recommendations`

---

### Checkpoint: Task 6 이후 (최종)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] E2E 통과: `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] 불변 규칙 검증: 상승여력이 `(목표가 - 현재가) / 현재가 × 100`과 일치하는 것을 test에서 단언
- [ ] 불변 규칙 검증: 현재가 또는 목표가 누락 시 상승여력 "-" 표시를 test에서 단언

---

## 미결정 항목

- KIS API 키 발급 및 `.env.local` 설정 — Task 3 시작 전 사용자가 직접 발급 필요 (`https://apiportal.koreainvestment.com`)
- 장 마감 후 현재가 표시 방식: 종가 고정 vs 마지막 수신 시세 유지 (Task 3 구현 시 결정)
