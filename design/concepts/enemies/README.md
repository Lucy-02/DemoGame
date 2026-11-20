# 적 그림과 도감 (0100 · 0114 ~ 0117 · 0158)

## 지금 상태
- 다섯 막 61종 모두 "사나운 짐승" 방향의 **임시 선택**이 연결돼 있어요(`picks.json`). 방향과 종별 칸은 Lucy가 후보 시트에서 고르면 바꿔요.
- 누끼는 정령과 같은 정식 공정이에요(하이브리드 + ViTMatte, 경계 정리, 2배 업스케일). 반딧불 떼만 옛 누끼예요.
- 크기는 도감의 크기 등급대로예요(0158). 도감의 글과 수치(`bestiary.json`)는 초안이에요.

## 후보 시트
| 범위 | 시트 | 프롬프트 시트 | 원본 (Lucy 맥 `~/workspace/jjal/runs/`) |
|---|---|---|---|
| 1막 14종 | https://claude.ai/artifact/7aKvQVf79ermJqWDaWA25o | `prompt-sheet-r6.py`, `prompt-sheet-r7.py` | `enemy-r6-20261118`, `enemy-r7-20261118` |
| 2막 13종 | https://claude.ai/artifact/S4vDobYCAuUKrCaRtX6HUo | `prompt-sheet-act2-r1.py`, `-r2.py` | `enemy-act2-r1-20261118`, `-r2-` |
| 3 · 4 · 5막 34종 | https://claude.ai/artifact/Bumv4LR8TcqD4yh5scif5Z | `prompt-sheet-act345-r1.py`, `-r2.py`, `-r3.py` | `enemy-act345-r1-20261118`, `-r2-`, `-r3-` |
| 도감과 크기 시안 | https://claude.ai/artifact/GM3qTuN3umPNbp8y4Zabow | | `exports/enemy-bestiary-20261120/` |

모두 NovelAI Diffusion 4.5 Full(Anlas 0)이에요. 1막 시트의 "보스 크기 세 안"은 0158로 대신했어요.

## 파일
- `picks.json`: 어느 후보를 연결했는지 (적 id → 실행 · 칸 · seed).
- `bestiary.json`: 도감 초안 (정체성 한 줄 · 몸 크기 · 체중 · 크기 등급).
- `src/presentation/battle/enemyFit.json`: 화면 크기(`size` · `h` · `w`), 발 위치(`sink` · `dx`), 떠 있는지(`float`), 순서표 얼굴(`face`).
- `src/presentation/battle/layout.ts`의 `ENEMY.sizes`: 등급별 상자와 체력 막대 폭. 자리 계산은 `enemyLayout.ts`.

## 바꾸는 법
- **칸을 바꿀 때**: jjal의 `exports/enemy-*/picks.json`을 고치고 → jjal의 배경 제거 도구(bgrm)로 누끼 → jjal의 enemy_final.py(crop · upscale) → 이 저장소의 `tools/art/import-enemies.py <전달 폴더> .` (webp와 출처 기록) → `enemyFit.json`의 `h` · `w` · `face`를 새 그림에 맞춰요.
- **등급을 바꿀 때**: `bestiary.json`과 `enemyFit.json`의 `size`를 같이 바꾸고, `h` · `w`를 그 등급 상자(`ENEMY.sizes`) 안에 그림 비율대로 맞춰요. `pnpm test`가 상자를 넘는지, 조우가 화면 폭을 넘는지 검사해요.
- **보는 장면**: `?screen=battle&scene=act1-mobs-a&stage=1` (`act1-*` ~ `act5-*`, 목록은 `src/presentation/battle/fixtures/act1.ts`).
