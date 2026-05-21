# stock-recommendations Learnings

## Task 실행 순서

1 → 2 → 3 → 4 → 5 → 6 순서로 의존성 순서대로 실행. Task 3(KIS WebSocket)은 API 키 발급이 선행 조건이어서 Task 4/5 이전에 처리가 맞았다.

---

## 무엇이 잘 됐는가

- **Vertical Slice가 효과적이었다.** 각 Task가 DB→API→UI 전체를 아우르는 slice여서, Task 2 완료 시점에 실제로 추천종목 리스트가 화면에 표시됐다. 회귀 발생 시점이 빨라졌다.
- **TDD RED→GREEN 흐름이 명확했다.** 특히 `calcUpside`와 `useRealtimePrice`는 순수 함수 / 상태 훅으로 테스트가 쉬웠다. 테스트 먼저 작성하니 인터페이스 설계가 자연스럽게 잡혔다.
- **SSE + WebSocket 클린업 패턴이 테스트로 검증됐다.** `useRealtimePrice`의 `return () => es.close()`를 테스트에서 직접 assert하여 메모리 누수 경로를 사전 차단했다.
- **KIS API 키가 클라이언트에 절대 노출되지 않았다.** `NEXT_PUBLIC_` prefix 없는 환경변수로만 사용하고, SSE 프록시 패턴(서버 → KIS WebSocket → 클라이언트 SSE)으로 시크릿이 서버에만 머물렀다.

---

## 무엇이 안 됐는가

- **jsdom에 EventSource가 없다.** `StockDetailModal` 테스트에서 `useRealtimePrice`가 EventSource를 참조해 에러 발생. `vi.mock("@/hooks/useRealtimePrice")` 추가로 해결했지만, EventSource를 사용하는 컴포넌트를 테스트할 때마다 이 mock이 필요하다는 점을 알아야 한다.
  - **applied: not-yet** — EventSource를 사용하는 모든 컴포넌트 테스트에 useRealtimePrice mock 패턴 필요
- **jsdom은 CSS media query를 무시한다.** `RecommendationList`가 데스크톱 테이블 + 모바일 카드를 동시 렌더해서 `getByText("삼성전자")`가 multiple elements 에러 발생. `getAllByText`로 수정. CSS 기반 반응형 렌더링에서는 기본적으로 `getAllByText`를 사용해야 한다.
  - **applied: not-yet**
- **`|| 0` fallback이 잘못된 데이터를 묵인한다.** `parseInt(...) || 0` 패턴이 0원 목표가를 DB에 저장해서 상승여력 -100% 표시 버그를 잠재적으로 만든다. 숫자 파싱 후 항상 range validation이 필요하다.
  - **applied: not-yet**

---

## 다음에도 쓸 인사이트

1. **KIS API 키 없이 실행 시 price-stream 라우트는 graceful하게 실패(SSE 스트림 종료)한다.** 로컬 개발 시 빈 Map을 반환하므로 현재가/상승여력이 `—`로 표시되고 다른 기능은 정상 동작한다.

2. **better-sqlite3 multi-worker 이슈는 현재 로컬/단일 서버 환경에서 잠재적이다.** WAL 모드로 read concurrency는 안전하나 write path에 retry 처리를 나중에 추가하면 더 견고해진다. Vercel serverless 배포 시 SQLite 파일 기반 접근은 근본적으로 불가능하므로 Turso 등으로 전환 필요.

3. **next/dynamic import는 테스트에서 vi.mock이 먹히지 않을 수 있다.** recharts를 dynamic import 없이 직접 import하고 vi.mock("recharts")으로 처리하는 방식이 테스트 안정성이 높다. 번들 최적화는 page 레벨의 dynamic import로 별도 처리 가능.

4. **SSE 서버 코드 리뷰에서 C-2(ws:// → wss://)가 항상 체크 항목이 돼야 한다.** 외부 실시간 API 연동 시 항상 TLS 적용 여부를 명시적으로 검증한다.

5. **POST scrape 엔드포인트는 항상 최소한의 인가가 필요하다.** CRON_SECRET가 없으면 공개 엔드포인트가 돼서 외부 서비스 남용이 가능하다. 환경변수 미설정 시에도 경고 로그를 남기거나 dev 환경에서만 허용하도록 처리할 수 있다.

---

## Code Reviewer 판정 처리

| ID | 분류 | 처리 |
|---|---|---|
| C-1 | Critical | `.gitignore`에 `.env*` 이미 포함 — 문제없음 |
| C-2 | Critical | `ws://` → `wss://` 수정 완료 |
| C-3 | Critical | CRON_SECRET 인가 추가 완료 |
| I-1 | Important | SQLite multi-worker — 현재 단일 서버 환경이므로 learnings에만 기록 |
| I-2 | Important | `parseTargetPrice` 헬퍼로 <= 0 skip 수정 완료 |
| I-3 | Important | 정규식 취약성 — MVP 범위 내 허용, learnings에 기록 |
| I-4 | Important | `console.error` 로그 추가 완료 |
| I-5 | Important | 분석 후 이미 안전한 패턴으로 확인 — 변경 불필요 |
| I-6 | Important | `eslint-disable` → `useMemo` 교체 완료 |
| S-1 | Suggestion | codes 입력 검증 — MVP 후 개선 항목 |
| S-2 | Suggestion | opinion 로직 중복 — MVP 후 개선 항목 |
| S-3 | Suggestion | RSC 초기 데이터 — MVP 후 개선 항목 |
| S-4 | Suggestion | `"—%"` → `"—"` 수정 완료 |
| S-5 | Suggestion | avg_target_price 전체 기간 — MVP 후 개선 항목 |
