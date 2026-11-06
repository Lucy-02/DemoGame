# R2 리뷰: brand-player

## 1. 총평
손패가 R1보다 확실히 조용해졌고 산양 카드는 정령 그림 선화에 가까워졌어요. 하지만 프롬프트 낱말을 글자 그대로 그린 장(부채, 금별 셋, 마법사 모자)이 생겨 파편·흑요석 뿔·별자리는 R1보다 나빠졌어요.

## 2. 카드별 (R1+R2)
| 카드 | 가장 나은 case_id | 판정 | 근거 | Lucy 앞에 |
|---|---|---|---|---|
| 유리 벽 | sal_01-B-o-s3101 (R2) | 고침 | 잔·보석에서 판으로 바뀜. 그래도 8장 모두 세로 기둥이고 가운데 빛 구슬이 눈·등불처럼 읽혀요. o-s3102·s3202, c-s3202는 바닥 원근 | 한 번 더 |
| 꼬리 쓸기 | sal_03-B-c-s3101 (R2) | 고침 | 평평한 초승달 + 흩어지는 조각이라 "휘두름"이 보이는 유일한 장. 손패에 쓰인 o-s3101은 달, o-s3102는 고리. C에 꼬리는 여전히 없음(낫·깃털·혜성) | 된다 (B-c-s3101만) |
| 유리 파편 | sal_08-B-o-s3101 (R1) | 유지 | R2는 네 장 다 부채·종려잎·꽃(o-s3102·c-s3101은 손잡이·줄기) | 된다 (R1) |
| 들이받기 | ibex_01-C-o-s3101 (R2) | 고침 | 머리 없이 균열 뿔만 나옴(R1 대비 진전). 그러나 속도선·충돌점이 없어 1x에서 꼬리·촉수처럼 보여요. c-s3102·o-s3102는 초상 홈에서 솟음. B-o-s3202는 화산 | 한 번 더 |
| 흑요석 뿔 | ibex_08-B-o-s3102 (R1) | 고침 | R2 여덟 장은 원뿔·드릴·마법사 모자. o-s3101·c-s3101은 밑동에 빛 고리까지. 산양 정령의 굽은 뿔과도 달라요 | 한 번 더 |
| 산사태 | ibex_10-B-o-s3201 (R2) | 유지 | 따로 떨어진 바위 다섯이 대각으로 굴러 "여럿·움직임"이 처음 읽혀요. 첫 바위가 윗선·비용 동전 자리에 걸림 | 된다 |
| 별빛 | star_01-B-o-s3102 (R2) | 유지 | 작은 오각별 + 짧은 방사선, 손패에서 차분. s3101(o·c)은 사분 반짝이로 흔한 ✦ 아이콘 같아요 | 된다 |
| 별자리 | star_03-B-o-s3102 (R1) | 유지 | R2 여덟 장은 입체 금별, s3102·c-s3102는 금별 셋 한 줄이라 별점·등급으로 읽혀요. 손패에서 가장 튀어요 | 된다 (R1) |

## 3. 구도 문법
B 기본 + C 일부 유지. B는 산사태·별빛·꼬리 쓸기(B)에서 맞았어요. C는 머리를 지우는 데는 성공했지만 "몸짓"이 안 나와 사물 하나로 보여요. 꼬리 쓸기는 C를 쉬고 B로 확정 후보, 들이받기만 C를 한 번 더.

## 4. 화풍 (o vs c, 도롱뇽만)
c가 조금 작고 평평해요(sal_03-B-c-s3101, sal_01-B-c-s3201). 결정적 차이는 아니에요. 두 변형 모두 `artist:wlop`(회화풍)이 남아 `clean lineart`와 부딪히는 것으로 보여요: 도롱뇽 카드는 아직 매끈한 그라데이션이고, 정령 그림의 각진 유리 면·흰 하이라이트(성체 꼬리)는 C-o-s3201에만 비슷하게 나와요. b07_v2(산양)는 굵은 외곽·평면 균열이 magma-ibex 방패 바위와 같은 계열이에요(ibex_10-B-o-s3201, ibex_01-C-o-s3202).

## R1 → R2
- 나아짐: 손패 발광 6/8 → 사실상 2/8(유리 벽 구슬, 별자리 금별). 바닥 그림자 대부분 사라짐. 산사태 복수, 들이받기 머리 제거, 별빛 크기.
- 나빠짐: 낱말 직역(fan→부채, three/large→금별 셋, spiral+upright→원뿔). 별자리 선 사라짐. `3d`가 UC에 있는데도 star_03 입체 렌더 = "AI 에셋" 인상이 가장 강한 장.

## 5. R3에 바꿀 것
1. 별자리 → R1 문장으로 되돌리고 굵기만: `1.2::a constellation of seven small stars connected by thick straight lines, flat 2D line diagram::`, `large`·`bright`·`four-pointed` 삭제. UC `1.2::3d, metallic, gold, bevel, row of stars, star rating::`. 근거: R1 s3102 성공, R2 직역.
2. 유리 파편 → `fan`·`in a fan` 삭제, R1 문장(`flying forward toward the viewer`) + `gaps between them`. UC `folding fan, hand fan, palm leaf, flower, stem, handle`. 시드 3101 고정.
3. 흑요석 뿔 → `spiral`·`standing upright on its base` 삭제, `a short thick curved horn lying sideways, smooth black, network of thin orange cracks, whole horn inside the image`. UC `cone, drill, witch hat, ring, glowing ring`. 들이받기 C와 겹침은 방향(옆으로 누움 vs 왼쪽 진입)과 동작선 유무로 가름.
4. 유리 벽 → `one small warm glowing core` 삭제(빛 1곳 규칙은 테두리 결정 끝으로), `1.3::landscape orientation, twice as wide as tall::`. UC `pillar, column, door, monolith, orb, eye`. 근거: 8장 모두 세로.
5. 들이받기 C → `short straight speed lines trailing to the left, a small crack burst at the tip`을 1.2로 앞에 두고, 산양 성체 뿔처럼 `curved ridged horn`. 산양 tone의 `bright rim light`는 빛 줄이기와 반대라 빼 보는 비교 1안.
6. 도롱뇽 c에서 `artist:wlop`를 뺀 c2 변형을 2시드로 비교(레지스트리 변경이라 Lucy 판단). 근거: 선화·셀 채색이 산양만큼 안 나옴.

## 6. 확인 못 한 것
- 별 정령 확정 그림을 보지 않아 별 카드의 화풍 일치는 판단 못 했어요.
- 정령별 실제 윗선에서의 잘림(지금 별 모양 임시), 호버 실물.
- "AI 같다", "별점으로 읽힌다"는 제 플레이어 감각이고 Steam 이용자 측정값이 아니에요.
