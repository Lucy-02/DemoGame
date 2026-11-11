# DemoGame · 정령 덱빌더 (프로토타입 v0.1)

Electron + Vite + TypeScript + Phaser 4 + Spine. 구조는 `docs/architecture/0001-client-architecture.md`.

## 실행
- `corepack enable` 후 `pnpm install` (패키지 매니저는 pnpm, 버전은 package.json의 packageManager)
- `pnpm dev`: Electron 창으로 실행 (핫 리로드)
- `pnpm dev:web`: 브라우저로만 실행 (저장은 localStorage). 기본은 정본 기준 전투 화면, `?screen=spirits` 정령 관리, `?screen=result` 전투 결과, `?screen=legacy` 임시 UI(`&party=a,b,c`로 파티 고르기)
- `pnpm dist`: 배포용 폴더를 `release/`에 만들기
- `pnpm check`: 타입 검사 + 의존 방향 검사 + 테스트 + 리터럴 검사 + 문서 검사(`pnpm check:docs`)
- `pnpm test:e2e`: Electron 스모크 테스트 (GPU 없는 리눅스는 `xvfb-run -a` 앞에 붙이기)
- `pnpm sim 200 [파티 a,b,c]`: 헤드리스 전투 시뮬레이터
- `pnpm visual`: 정본과 새 화면을 겹쳐 비교 (`design/canon/README.md`)

## 구조
- `electron/main`, `electron/preload`: 창, `app://` 프로토콜, 저장 파일 IPC. 렌더러에는 `window.platformBridge`만 노출
- `src/app`: 렌더러 부트
- `src/platform`: 저장·창 모드 인터페이스와 Electron/웹 구현
- `src/data/*.json`: 기획 데이터 (정령, 카드, 장비, 적, 성격, 인카운터, 이벤트, 성장, 상수). 형식은 `src/data/README.md`. 수치 조정은 여기서만
- `src/data/assets.json`: 정령/적 비주얼 지정 (shape / image / spine)
- `src/core/`: 게임 로직. Phaser를 import하지 않아요(`pnpm lint:deps`가 막아요). 전투 규칙(battle.ts), 런·맵·보상(run.ts), 능력치(stats.ts), 카드 문구(text.ts)
- `src/presentation/battle/`, `spirits/`, `card/`, `style/`: 정본 기준 새 화면 (`docs/handoff/CLIENT_HANDOFF.md`)
- `src/presentation/placeholder/`: 임시 UI(`?screen=legacy`). 지금 규칙으로 끝까지 플레이되는 유일한 화면이라, 새 화면이 규칙에 연결될 때 화면 단위로 지워요
- `tools/`: 시뮬레이터와 자동 플레이 AI (골든 테스트도 같이 씀)

## 디자인 작업
브랜딩·UI/UX는 Lucy가 정하고 Claude가 제안·구현해요. 규칙은 `CLAUDE.md`, 문서 길잡이는 `docs/README.md`.
- `docs/handoff/`: 기획서, 결정 요약(`DECISIONS.md`), 열린 질문(`OPEN_QUESTIONS.md`), 스레드 인수인계
- `docs/design-decisions/`: 라운드별 결정 기록 (결정의 정본)
- `docs/design/`: 살아 있는 GDD (비전·필러·세계)
- `design/canon/`: Lucy가 확정한 시안 원본, 밸런스 기준선, 정령 풀, 네이밍, 문구 규칙
- `design/concepts/`: 장부(`LEDGER.md`), 브리프, 링크 이력
- `docs/archive/`, `design/archive/`: 끝난 라운드의 조사·리뷰·브리프와 대체된 문서. 결론은 결정 기록에 있어요
- `design/DESIGN_SYSTEM.md`: 디자인 시스템 (값은 Lucy 확정분만)
- `design/tokens/tokens.json` → `pnpm tokens` → `src/design/tokens.ts`
- `design/review/card.schema.json`: 리뷰어 지적 카드 형식. 리뷰어 정의는 `.claude/agents/`
- `pnpm check:design`: 색·폰트·크기·시간 리터럴 검사 (Claude Code 종료 시 hook으로도 실행)
- `assets/provenance.jsonl`, `pnpm check:assets`: TTI 에셋 출처 기록과 출시 점검
