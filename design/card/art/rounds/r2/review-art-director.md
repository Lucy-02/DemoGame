# R2 리뷰: art-director

## 1. 총평
크기 줄이기는 통했어요(별빛·들이받기 B·산사태). 그런데 낱말이 사물을 바꿔 버렸어요(fan→부채, spiral horn→고깔모자, gold star→입체 금별). 들이받기 C는 두 번째로 실패했어요.

## 2. 카드별 (R1+R2, hand@1x·sheet 기준, 모두 Lucy가 고를 후보)
| 카드 | 가장 나은 case_id | 판정 | 근거 |
|---|---|---|---|
| sal_01 유리 벽 | R2 sal_01-B-c-s3201 | 고침 | 8장 모두 세로 기둥·문이에요. 꽃병은 사라졌고 c-s3201·c-s3101은 바닥 없이 창 안에 들어와요. o는 결정 보석형 |
| sal_03 꼬리 쓸기 | R2 sal_03-B-c-s3101 | 고침 | 사선 초승달 + 파편이라 방향이 읽혀요. C-o-s3201만 마디 꼬리 + 심이 보이지만 1x에선 B와 같은 초승달이에요 |
| sal_08 유리 파편 | R1 sal_08-B-x-s3102 | 유지(R1) | R2 4장은 부채·꽃(o-s3102 손잡이, c-s3101 줄기)이고 "셋"이 없어요. R1 V자 두 조각이 여전히 가장 또렷해요 |
| ibex_01 들이받기 | R2 ibex_01-B-o-s3101 | 고침 | 작은 돌 + 방사 균열, 가운데 위에 작게 앉아요. 1x에선 약해요. C 4장: 뿔만 나왔지만 충돌점이 없고, s3102·s3202는 왼쪽 아래 초상 위로 들어와요 |
| ibex_08 흑요석 뿔 | R1 ibex_08-B-o-s3101 | 고침 | R2 원뿔 4장은 고깔모자·드릴로 읽혀요(s3101·s3201 테두리 고리). 뿔로 읽히는 건 R1의 휜 뿔과, R2 C 실패작 ibex_01-C-o-s3202의 굵은 검은 뿔이에요 |
| ibex_10 산사태 | R2 ibex_10-B-o-s3201 | 고침 | 따로 떨어진 돌 여럿이 처음으로 "구르는 무더기"로 읽혀요. 줄이 비용 동전에서 숫자판까지 대각선 끝에서 끝이에요. s3101은 회색조에서 거의 사라져요 |
| star_01 별빛 | R2 star_01-B-o-s3101 | 유지 | 작은 반짝임이 가운데 위 원 안, 손패에서 조용해요. 다섯 꼭짓점이 아니라 네 꼭짓점이에요(Lucy 확인) |
| star_03 별자리 | R1 star_03-B-o-s3102 | 버림(R2) | R2 8장 모두 입체 금별, 손패에서 가장 밝아 초상보다 시선을 끌어요. 선이 없어요 |

## 3. 구도 문법
- **B 유지.** 작게 문장은 단일 사물에서 들어요. 대각선 주제는 여전히 끝에서 끝까지 걸쳐요.
- **C: 들이받기는 B로 돌려요.** R1에서 붙인 조건(R2 실패 시 B)대로예요. 충돌을 그린 장이 없고, 꼬리 쓸기 C도 1x에서 B와 같아요.
- 그래서 추천안은 "B 기본, C는 지금 증명된 카드 없음"으로 좁혀요. C를 버릴지는 Lucy가 정해요.
- C를 빼면 휜 뿔 실루엣이 비어 ibex_08에 돌려줄 수 있어요.

## 4. 화풍 (o vs c, 도롱뇽만)
- c가 나아요. sal_01 c는 평평한 판, o는 결정 기둥이에요. sal_03 c-s3101은 방향이 있고 o는 달·고리예요. sal_08은 둘 다 실패지만 c-s3101이 가장 작고 덜 번져요.
- c에서 빠진 `-1::flat color::`(셀 채색과 충돌)가 원인 후보지만 분리하지 못했어요.
- 산양·별은 o=c 같은 그림이에요.

## 5. R1 → R2
- 나아진 것: 크기·여백, 바닥 그림자·꽃병 대부분 사라짐, 산사태가 여러 돌로, 별빛이 조용해짐. 남은 바닥: sal_01 o-s3102·o-s3202·c-s3102·c-s3202.
- 나빠진 것: 별자리(선 → 입체 금별), 흑요석 뿔(뿔 → 모자), 유리 파편(V자 → 부채). 셋 다 카드별 문장의 낱말 탓이에요.

## 6. R3에 바꿀 것
1. **ibex_01 → B 고정, ibex_08 → 휜 뿔**: ibex_01 C 줄 삭제. ibex_08 문장을 `1.2::a single thick curved horn of glossy black obsidian, crescent shape, seen from the side::, thin orange cracks`로, UC에 `cone, hat, witch hat, drill, spike, spiral, ring, halo` 추가. 시드에 3202 포함(C-o-s3202 모양 습관, R5 3-3). 근거: 2절, R4 4장 실루엣.
2. **sal_01 가로 만들기**: `standing upright like a window pane`, `angular faceted crystal plates` 삭제 → `1.3::a low horizontal wall of red glass, much wider than tall, landscape-shaped object::`, UC에 `pillar, column, door, doorway, monolith, prism, vertical`. 그래도 세로면 가로 해상도를 Lucy에게 물어요(R5 2-1).
3. **sal_08 부채 끊기**: `in a fan` 삭제 → `three separate long triangular glass shards flying up-right side by side, clear gaps between them`, UC에 `fan, hand fan, folding fan, handle, stick, stem, flower, leaf, petals`. 근거: o-s3102 손잡이, c-s3101 줄기, R1 x-s3102.
4. **star_03 평면 기호로**: `large`, `gold`, `the shape fills the middle half`(작게 문장과 충돌) 삭제 → `five small glowing dots joined by thick straight pale lines, flat constellation diagram`, UC에 `metallic, gold, golden, beveled, shiny`. 근거: R2 8장 입체 금별, 손패 시선.
5. **대각선 주제를 짧게**: ibex_10 `down a diagonal from upper left to lower right` → `a short tight cluster of four boulders tumbling to the right, largest in front`. sal_03 B도 `across the center` → `a short crescent arc in the center`. 근거: 산사태·꼬리 쓸기가 동전~숫자판까지 걸침(R4 5-1).
6. **변수 하나씩**: 도롱뇽은 c만 쓰고 o는 쉬어요. 시드 3101·3102·3201·3202 그대로, 1~5번은 카드별 문장만 바꿔요. c 안에서 `-1::flat color::`만 되돌린 1장을 sal_03에 붙여 원인을 가려요.

## 7. 지금 Lucy 앞에 내도 되나
| 카드 | 판단 |
|---|---|
| star_01 별빛 | 된다 (R2 o-s3101 / R1 o-s3102 비교) |
| sal_08 유리 파편 | 된다 (R1 x-s3102), R3 한 번 더 병행 |
| sal_03 꼬리 쓸기 | 된다 (B-c-s3101 vs C-o-s3201: B/C 판단 재료) |
| ibex_10 산사태 | 한 번 더 |
| ibex_01 들이받기 | 한 번 더 (C 중단 여부만 먼저 물어요) |
| ibex_08 흑요석 뿔 | 한 번 더 |
| sal_01 유리 벽 | 한 번 더 |
| star_03 별자리 | 한 번 더 |

## 8. 확인 못 한 것
- hand@1x에 case 표시가 없어 모양으로 각 카드 첫 case로 보았어요.
- 준비 표식이 뜬 상태, 손패 10장 섞임, 정령 12장 나란히는 아직 없어요.
- 윗선이 임시라 sal_01·ibex_08 끝 잘림은 정본에서 달라질 수 있어요.
