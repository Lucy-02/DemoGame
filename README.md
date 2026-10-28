# DemoGame · 정령 덱빌더 (프로토타입 v0.1)

Phaser 4 + Vite + TypeScript. `npm install` 후 `npm run dev`.

## 구조
- `src/data/*.json`: 기획 데이터 (정령, 카드 40, 적 11+새끼, 성격 8, 인카운터, 이벤트, 상수). 수치 조정은 여기서만.
- `src/data/assets.json`: 정령/적 비주얼 지정 (shape / image / spine). 아트 교체는 여기서.
- `src/core/`: 게임 로직. Phaser를 import하지 않아요. 전투 규칙(battle.ts), 런·맵·보상(run.ts), 능력치(stats.ts), 카드 문구(text.ts).
- `src/scenes/`, `src/ui/`: **임시 플레이스홀더 UI.** 레이아웃·디자인 미확정이고, Lucy의 디자인으로 통째로 교체할 예정이에요. core는 UI에 의존하지 않아서 이 두 폴더만 갈아끼우면 돼요.
- `tools/sim.ts`: 헤드리스 전투 시뮬레이터 (`npm run sim -- 200`).

## 디자인 작업
브랜딩·UI/UX는 Lucy가 정하고 Claude가 제안·구현해요. 규칙은 `CLAUDE.md`, 근거는 `docs/design-workflow-report.md`.
- `docs/handoff/`: 기획서, MVP 데이터, 화면별 정보·행동 목록, 체형 템플릿, 지금까지의 결정 요약(`DECISIONS.md`)
- `docs/design-decisions/`: 라운드별 결정 기록
- `design/DESIGN_SYSTEM.md`: 디자인 시스템 (값은 Lucy 확정분만)
- `design/tokens/tokens.json` → `npm run tokens` → `src/design/tokens.ts`
- `design/review/card.schema.json`: 리뷰어 지적 카드 형식. 리뷰어 정의는 `.claude/agents/`
- `npm run check:design`: 색·폰트·크기·시간 리터럴 검사 (Claude Code 종료 시 hook으로도 실행)
- `assets/provenance.jsonl`, `npm run check:assets`: TTI 에셋 출처 기록과 출시 점검
