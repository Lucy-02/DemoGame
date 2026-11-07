# 0043. 못 내는 카드는 카드째 회색으로 뿌옇게

- 날짜: 2026-11-07
- 단계: 카드 UI
- 상태: 수락됨 (Lucy, 2026-11-07 "카드 자체가 투명해지는 게 좋을 것 같고 좀 더 뿌얘지는 게 좋아 보임, 회색 필터로" → 보드 안 3 "안 3이 좋아 보이네", "단 활성화 조건이나 경고 문구는 흐려지지 않는 게 좋겠지", 얼굴도 흐림 "ㅇㅇ")

## 맥락
정본(0007, `battle-r5`)과 게임(`HandCard.ts`)은 못 내는 카드의 틀을 밝은 회색으로 바꾸고 그림만 투명도 0.45로 낮춰요. 밝은 창이 비쳐 오히려 창백하고 밝아 보였어요.

## Lucy의 결정
- 카드 전체(틀·그림·숫자)에 필터를 걸어요: 회색조 1, 대비 0.7, 밝기 1.1, 투명도 0.62. 흐림은 넣지 않아요 (우윳빛, 보드 안 3).
- **못 내는 조건과 경고는 흐리지 않아요**: 이유 띠(`.why`, 예: "화상 필요")와 비용 동전(마력 부족 빨간 테 포함)은 필터 밖에서 또렷하게 그려요. 그림: `design/card/art/rounds/picks/unplayable-haze@2x.jpg`.
- 비교 그림: 결과 보드 "비활성 카드: 카드째 회색으로 뿌옇게" (https://claude.ai/artifact/MW7rxJHEQiypJoAhS4a3kL).

## 정본·코드에 반영한 것
- 정령 얼굴도 함께 흐려요 (Lucy 2026-11-07 "ㅇㅇ", 0007의 "얼굴은 컬러"를 대체). 장부 §2에 적었어요.
- 값: `design/tokens/tokens.json` `provisional.effect.unplayable`. 그리기: `src/presentation/card/HandCard.ts`(몸에만 `adjustColor`, 비용 동전·이유 띠는 `drawSignals`로 위에), 행렬은 `src/presentation/style/opacity.ts`의 `colorMatrix`.
- 안 쓰게 된 못 내는 카드 색 토큰(`off`, `off2`, `offLine`, `offInk`, `cardOff*`, `upOff`, `bandShineOff`)은 지웠어요.
- 정본 페이지(`battle-r5/page.html`)는 원본 보관이라 고치지 않고, `design/canon/README.md` "따르지 않는 것"에 적었어요.
