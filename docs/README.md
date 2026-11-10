# 문서 길잡이

무엇을 하려는지에 따라 먼저 읽을 문서예요. 작업 규칙은 루트 `CLAUDE.md`가 먼저예요.

## 하려는 일 → 읽을 문서

| 하려는 일 | 먼저 읽기 | 그다음 |
| --- | --- | --- |
| 지금까지 정해진 것 훑기 | `docs/handoff/DECISIONS.md` (한 줄 요약) | `docs/design-decisions/README.md` (색인) → 해당 번호 |
| 게임 방향·규칙 이해 | `docs/design/` (비전·필러·세계) | `docs/handoff/01_기획서_v0.2.md` (규칙 상세. 낡은 문장은 결정 기록이 우선) |
| 화면 시안 만들기 | `design/concepts/LEDGER.md` (장부), `LUCY_CRITERIA.md` | `BRIEF.md` (브리프 형식), `LINKS.md` (시안 링크), `design/canon/` (정본) |
| 화면 구현 | `docs/handoff/CLIENT_HANDOFF.md` | `docs/architecture/0001-client-architecture.md`, `design/DESIGN_SYSTEM.md` |
| 전투 규칙·카드 엔진 | `docs/architecture/0003-battle-engine.md` | `docs/handoff/CARD_ENGINE_HANDOFF.md`, `src/data/README.md` |
| 정령·카드 설계 | `design/canon/spirits/` (풀 표·시트·설계 노하우) | `design/canon/BALANCE_BASELINE.md`, `design/canon/naming/` |
| 게임 안 문구 | `design/canon/text/TEXT_RULES.md` | `src/core/text.ts`, `src/core/korean.ts` |
| 카드·정령 그림 | `design/card/art/PIPELINE.md` | `assets/PROVENANCE.md`, `docs/architecture/0002-spirit-puppet.md` |

## 폴더마다 맡는 일

| 폴더 | 맡는 일 | 고치는 법 |
| --- | --- | --- |
| `docs/design-decisions/` | 결정의 정본. 번호 하나에 결정 하나 | 수락된 기록은 고치지 않고, 바꿀 때 새 번호를 써요. 색인은 같은 폴더 `README.md` |
| `docs/handoff/DECISIONS.md` | 지금 유효한 결정의 한 줄 요약 | 결정 기록을 쓸 때 한 줄 더해요 |
| `docs/design/` | 살아 있는 기획 문서 (짧게, 근거는 결정 기록에) | 결정이 바뀌면 같이 고쳐요 |
| `docs/architecture/` | 코드 구조 결정 | 구조가 바뀌면 고쳐요 |
| `docs/handoff/` | 스레드 인수인계와 기획서 | 인수인계는 일을 넘길 때 써요 |
| `design/canon/` | Lucy가 확정한 시안 원본과 정본 표 | 시안 원본은 고치지 않아요 |
| `design/concepts/` | 장부, 브리프, 시안 링크, 연구 노트 | 장부는 Lucy가 고른 조각을 빠짐없이 |
| `docs/archive/`, `design/archive/` | 끝난 조사·리뷰·대체된 문서 | 읽지 않아도 작업할 수 있어요. 새 근거 없이 다시 제안하지 않아요 |

- 레포에 넣지 않는 파일(이미지 묶음, 영상, 음원, 시안 캡처)은 프로젝트 공유 폴더에 있고, 그 폴더의 `README.md`가 안내해요.
- `pnpm check:docs`가 결정 번호 겹침과 색인 누락, 현행 문서의 없는 경로를 알려 줘요.
