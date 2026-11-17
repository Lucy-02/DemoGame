# 0122. 상점 전용 배경: 임시로 들판 좌판 10104

- 날짜: 2026-11-18
- 단계: P6 엔진 구현 / 에셋
- 라운드: 상점 배경 후보 R1
- 상태: 디렉터 판단, Lucy 확인 대기. 상점에 전용 배경을 쓰는 것은 Lucy가 골랐고(0121), 어느 그림인지는 Lucy가 고르기 전이에요.

## 맥락
상점은 전용 배경으로 정해졌어요(0121). 그림이 없어 민무늬 바닥이었어요.

## 고려한 선택지
후보 시트(12장, 게임 화면 포함): https://claude.ai/artifact/BLrr7caHpPQ7zSz5ErKWVS
- H1 들판 좌판: 나무 아래 천막 좌판, 해 질 녘
- H2 가게 안: 양옆 선반, 가운데 빈 나무 벽
- H3 행상 수레: 별 뜬 밤 들판, 오른쪽에 수레

## 결정
- **임시로 H1 들판 좌판 10104를 깔아요.** 한 장을 화면에 맞춰 깔고 창 뒤 덮개(`scrim` 토큰 그대로)로 눌러요. 이벤트 · 휴식(0119)과 같은 방식이에요.
- 다음 후보는 H2 가게 안 10202예요.

## 근거
전투 배경과 같은 들이라 이어지고, 넓은 천이 카드 뒤를 조용하게 받쳐요.

## 기각한 것과 이유
- 없어요. Lucy가 고르면 확정해요. 행상 수레는 수레가 정령 줄 바로 뒤에 겹쳐서 그대로는 추천하지 않아요.

## 결과와 후속 작업
- `public/assets/stages/shop.webp` (만들기 `tools/art/place-bg.py`, 기록 `assets/provenance.jsonl`).
- `src/presentation/stage.ts`의 `preloadPlace` · `placeArt`, `src/presentation/run/backdrop.ts`의 `drawBackdrop(scene, "shop")`, `src/presentation/shop/ShopScene.ts`.
- 남은 것: Lucy의 선택. 2배 업스케일은 0149에서 했어요(그림이 바뀌면 다시 돌려요).
