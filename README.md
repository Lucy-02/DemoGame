# DemoGame · 정령 덱빌더 (프로토타입 v0.1)

Electron + Vite + TypeScript + Phaser 4 + Spine. 구조는 `docs/architecture/0001-client-architecture.md`.

## 실행
- `corepack enable` 후 `pnpm install` (패키지 매니저는 pnpm, 버전은 package.json의 packageManager)
- `pnpm dev`: Electron 창으로 실행 (핫 리로드)
- `pnpm dev:web`: 브라우저로만 실행 (저장은 localStorage)
- `pnpm dist`: 배포용 폴더를 `release/`에 만들기
- `pnpm check`: 타입 검사 + 의존 방향 검사 + 테스트 + 리터럴 검사
- `pnpm test:e2e`: Electron 스모크 테스트 (GPU 없는 리눅스는 `xvfb-run -a` 앞에 붙이기)
- `pnpm sim 200`: 헤드리스 전투 시뮬레이터
- `pnpm dev:web`: 정본 기준으로 새로 만드는 전투 화면 (`?screen=legacy`: 예전 임시 UI)
- `pnpm visual`: 정본과 새 화면을 겹쳐 비교 (`design/canon/README.md`)

## 구조
- `electron/main`, `electron/preload`: 창, `app://` 프로토콜, 저장 파일 IPC. 렌더러에는 `window.platformBridge`만 노출
- `src/app`: 렌더러 부트
- `src/platform`: 저장·창 모드 인터페이스와 Electron/웹 구현
- `src/data/*.json`: 기획 데이터 (정령, 카드 40, 적 11+새끼, 성격 8, 인카운터, 이벤트, 상수). 수치 조정은 여기서만
- `src/data/assets.json`: 정령/적 비주얼 지정 (shape / image / spine)
- `src/core/`: 게임 로직. Phaser를 import하지 않아요(`pnpm lint:deps`가 막아요). 전투 규칙(battle.ts), 런·맵·보상(run.ts), 능력치(stats.ts), 카드 문구(text.ts)
- `src/presentation/placeholder/`: **임시 플레이스홀더 UI.** Lucy의 디자인으로 통째로 교체할 예정
- `tools/`: 시뮬레이터와 자동 플레이 AI (골든 테스트도 같이 씀)

## 디자인 작업
브랜딩·UI/UX는 Lucy가 정하고 Claude가 제안·구현해요. 규칙은 `CLAUDE.md`, 근거는 `docs/design-workflow-report.md`.
- `docs/handoff/`: 기획서, MVP 데이터, 화면별 정보·행동 목록, 체형 템플릿, 지금까지의 결정 요약(`DECISIONS.md`)
- `docs/design-decisions/`: 라운드별 결정 기록
- `design/DESIGN_SYSTEM.md`: 디자인 시스템 (값은 Lucy 확정분만)
- `design/tokens/tokens.json` → `pnpm tokens` → `src/design/tokens.ts`
- `design/review/card.schema.json`: 리뷰어 지적 카드 형식. 리뷰어 정의는 `.claude/agents/`
- `pnpm check:design`: 색·폰트·크기·시간 리터럴 검사 (Claude Code 종료 시 hook으로도 실행)
- `assets/provenance.jsonl`, `pnpm check:assets`: TTI 에셋 출처 기록과 출시 점검
