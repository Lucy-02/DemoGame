# DemoGame (정령 덱빌더) 작업 규칙

Phaser 4 + Vite + TypeScript + Spine. PC(스팀) 1인 개발. 브랜딩·UI/UX·아트는 Lucy가 정하고, Claude는 제안·정리·구현을 맡아요.

## 시각 결정
- 브랜딩, 화면 구성, 레이아웃, 비주얼, 아트, 네이밍은 **Lucy 컨펌 없이 확정하거나 구현하지 않아요.** 2~3개 선택지와 근거를 먼저 보여주고, Lucy가 고른 것만 반영해요.
- 제안하기 전에 `docs/design-decisions/`를 읽어요. 기각된 선택지는 새 근거 없이 다시 제안하지 않아요.
- 색·폰트·크기·시간 값을 지어내지 않아요. 정해지지 않은 값은 `TODO_TOKEN`으로 남겨요.

## 디자인 루프 (모든 단계 공통)
넓게 펼치고 → 조각을 고르고 → 좁혀 가요. 한 화면, 한 변수씩 순서대로 정하지 않아요.
- 모든 시안은 `design/concepts/LEDGER.md`(결정·고른 조각·작업 가정 장부)에서 시작해요. 새 시안은 장부의 조각을 빠짐없이 담고, 장부와 달라진 점을 시안 머리에 적어요. Lucy가 고른 조각을 말없이 빼거나 바꾸지 않아요.
1. 공통 브리프(`design/concepts/BRIEF.md` 형식)를 쓰고, 서로 다른 축의 컨셉을 4~5개 정해요.
2. 컨셉마다 에이전트 하나가 **아티팩트 하나**를 만들어요. 여러 화면(전투·지도·보상 등)을 한 번에 담고, 꽉 찬 상황도 넣어요. 병렬로 돌리고, 저는 링크만 모아요.
3. Lucy가 화면·조각 단위로 체리피킹해요("A의 지도 밀도 + B의 질감"). 폐기된 컨셉은 다시 내지 않아요.
4. 고른 조각을 섞은 다음 라운드 2~3안을 다시 병렬로 만들어요. 화면이 확정될 때까지 반복해요.
5. 리뷰어(`.claude/agents/`)는 Lucy가 원할 때만, 확인이 필요한 화면에만 돌려요. 미적 판단은 하지 않아요.
- 시안에 쓰는 색·폰트는 임시 값이에요. Lucy가 고르기 전에는 토큰에 넣지 않아요.
- 리뷰 보드: https://claude.ai/artifact/K2By7mr5uWaJYH4RNWbLJ8 (`db` 컬렉션: personas, rounds, options, cards), 지적 카드 형식: `design/review/card.schema.json`
- 라운드가 끝나면 `docs/design-decisions/NNNN-주제.md`를 남기고 `docs/handoff/DECISIONS.md`에 한 줄 요약을 더해요.

## 코드 구조
- 구조와 의존 방향: `docs/architecture/0001-client-architecture.md`. `pnpm lint:deps`가 강제해요.
- `src/core`, `src/data`: 게임 로직과 데이터. UI 작업에서 건드리지 않아요. 규칙을 바꾸면 골든 테스트 스냅샷이 바뀌니 PR에 이유를 적어요.
- `src/presentation/placeholder`: 지금은 임시 플레이스홀더 UI. 디자인 확정 후 통째로 교체해요.
- 클라이언트(전투 화면) 작업은 `docs/handoff/CLIENT_HANDOFF.md`를 먼저 읽어요. 정본 옮기는 관행과 렌더링 디테일이 있어요.
- `src/platform`, `electron/`: 저장·창 같은 바깥 세계. 렌더러는 Electron을 직접 import하지 않아요.
- `src/design/tokens.ts`: `design/tokens/tokens.json`에서 `pnpm tokens`로 생성. 손으로 고치지 않아요.
- `pnpm check:design`: 리터럴 값 검사. `design/strict-paths.txt`에 적힌 경로는 위반 시 실패해요.
- `pnpm check`: 타입·의존 규칙·테스트·리터럴을 한 번에. `pnpm test:e2e`: Electron 스모크.

## 에셋
- TTI(NovelAI Diffusion V5/V4.5)로 만든 파일은 모두 `assets/provenance.jsonl`에 기록해요 (`assets/PROVENANCE.md` 참고). 생성은 Lucy가 하고, Claude는 프롬프트 시트·후처리·기록을 맡아요.
- `pnpm check:assets --release`는 기록 없는 에셋이나 임시 에셋이 있으면 실패해요.
