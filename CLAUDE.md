# DemoGame (정령 덱빌더) 작업 규칙

Phaser 4 + Vite + TypeScript + Spine. PC(스팀) 1인 개발. 브랜딩·UI/UX·아트는 Lucy가 정하고, Claude는 제안·정리·구현을 맡아요.

## 시각 결정
- 브랜딩, 화면 구성, 레이아웃, 비주얼, 아트, 네이밍은 **Lucy 컨펌 없이 확정하거나 구현하지 않아요.** 2~3개 선택지와 근거를 먼저 보여주고, Lucy가 고른 것만 반영해요.
- 제안하기 전에 `docs/design-decisions/`를 읽어요. 기각된 선택지는 새 근거 없이 다시 제안하지 않아요.
- 색·폰트·크기·시간 값을 지어내지 않아요. 정해지지 않은 값은 `TODO_TOKEN`으로 남겨요.

## 디자인 루프 (모든 단계 공통)
브리프와 차별화 축 선언 → 시안 2~3개 → Lucy 선택 → 리뷰어(`.claude/agents/`) 독립 병렬 리뷰 → 종합 → 리뷰 보드 핀 카드 → Lucy와 스레드 토론 → 수락/기각/보류 → 결정 기록.
- 리뷰 보드: https://claude.ai/artifact/K2By7mr5uWaJYH4RNWbLJ8 (`db` 컬렉션: personas, rounds, options, cards)
- 지적 카드 형식: `design/review/card.schema.json`
- 리뷰어는 한 스레드에서 2~3번까지만 말하고, 미적 판단은 하지 않아요. 최종 판단은 Lucy.
- 라운드가 끝나면 `docs/design-decisions/NNNN-주제.md`를 남기고 `docs/handoff/DECISIONS.md`에 한 줄 요약을 더해요.

## 코드 구조
- `src/core`, `src/data`: 게임 로직과 데이터. UI 작업에서 건드리지 않아요.
- `src/scenes`, `src/ui`: 지금은 임시 플레이스홀더 UI. 디자인 확정 후 통째로 교체해요.
- `src/design/tokens.ts`: `design/tokens/tokens.json`에서 `npm run tokens`로 생성. 손으로 고치지 않아요.
- `npm run check:design`: 리터럴 값 검사. `design/strict-paths.txt`에 적힌 경로는 위반 시 실패해요.

## 에셋
- TTI(NovelAI Diffusion V5/V4.5)로 만든 파일은 모두 `assets/provenance.jsonl`에 기록해요 (`assets/PROVENANCE.md` 참고). 생성은 Lucy가 하고, Claude는 프롬프트 시트·후처리·기록을 맡아요.
- `npm run check:assets -- --release`는 기록 없는 에셋이나 임시 에셋이 있으면 실패해요.
