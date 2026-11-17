# 1막 적 그림 (0100)

- 후보 시트: https://claude.ai/artifact/7aKvQVf79ermJqWDaWA25o (방향 셋, 종별 후보, 전투 화면에 세운 모습)
- 지금 연결된 것은 **임시 선택**이에요(`picks.json`). Lucy가 시트에서 고르면 바꿔요.
- 프롬프트 시트: `prompt-sheet-r6.py`(14종 × 방향 셋), `prompt-sheet-r7.py`(형태를 고친 넷). jjal 저장소의 build_enemy_r6.py · r7.py 사본이에요.
- 원본 PNG: Lucy 맥 `~/workspace/jjal/runs/enemy-r6-20261118`, `enemy-r7-20261118` (NovelAI Diffusion 4.5 Full, Anlas 0).
- 들여오기: jjal 저장소의 enemy_deliver.py(누끼) → `tools/art/import-enemies.py`(webp, provenance).
- 크기 · 발 위치: `src/presentation/battle/enemyFit.json`. 보는 장면: `?screen=battle&scene=act1-mobs-a` (`act1-mobs-b` · `-c`, `act1-toad` · `wolf` · `imp`, `act1-grimbark` · `wildfire` · `gale`).
