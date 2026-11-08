# R2 리뷰: prompt-engineer

## 1. 총평
C의 머리·B의 바닥 그림자는 UC로 잡혔어요. 새 실패 셋(금별·모자·부채)은 모두 제가 R1에 제안한 낱말이 Danbooru 뜻으로 읽힌 탓이에요.

## 2. 카드별 (R1+R2)
| 카드 | 가장 나은 | 판정 | 근거 | Lucy 앞에 |
|---|---|---|---|---|
| 유리 벽 | sal_01-B-c-s3101 (R2) | 고침 | 바닥 없는 얇은 판. 8장 모두 세로로 길어요 | 한 번 더 |
| 꼬리 쓸기 B | sal_03-B-o-s3101 (R2) | 유지 | 1x에서 가장 굵게 읽혀요. 달처럼도 보여 c-s3101(조각+속도선)과 같이 냄 | 된다 |
| 꼬리 쓸기 C | sal_03-C-o-s3201 (R2) | 고침 | 왼쪽에서 들어와 초승달 끝. s3101은 o·c 모두 닫힌 고리 | 한 번 더 |
| 유리 파편 | sal_08-B-o-s3101 (R1) | 고침 | R2 4장이 부채·꽃다발, s3102는 손잡이까지 | 한 번 더 |
| 들이받기 | ibex_01-C-o-s3101 (R2) | 유지 | 왼쪽 가운데 진입, 머리·바닥 없음. B 대안 B-o-s3201 | 된다 |
| 흑요석 뿔 | ibex_08-B-o-s3102 (R2) | 고침 | 8장 모두 세운 원뿔. s3101은 밑에 고리까지 = 모자 | 한 번 더 |
| 산사태 | ibex_10-B-o-s3201 (R2) | 유지 | 따로 떨어진 바위·외곽선·그림자 없음. 왼쪽 위 끝이 동전에 닿아요 | 된다 |
| 별빛 | star_01-B-c-s3101 (R2) | 유지 | 작은 네 갈래 반짝임, 여백 넉넉 | 된다 |
| 별자리 | star_03-B-o-s3102 (R1) | R2 버림 | R2 8장 모두 입체 금별, 선이 하나도 없어요 | 한 번 더 |

R1 → R2 나아진 것: C에 산양·도롱뇽 머리 0장, B 주제가 작아짐(별빛·들이받기 B·산사태), 바닥 그림자 띠 사라짐, 바위가 하나→여럿. 나빠진 것: 별자리·파편·흑요석 뿔(낱말 문제), 유리 벽은 여전히 세로·3장에 바닥 빛 번짐.

## 3. 구도 문법
B 기본 + C 일부 유지. C는 들이받기에서 처음 성공. 남은 문제는 크기: `composition_C`에 크기 문장이 없어 뿔·꼬리가 창 폭을 다 써요(ibex_01-C s3102·s3202는 왼쪽 아래=초상에서 솟음, sal_03-C s3202는 왼쪽 위로 긴 선).

## 4. 화풍 o vs c (도롱뇽만 유효)
- 같은 시드면 구도는 o·c가 같아요(sal_03-C s3101 둘 다 고리, sal_08 s3102 둘 다 부채). 차이는 질감뿐이고 작아요: o가 빛 번짐이 조금 더 커요(sal_03-B s3102 빛 고리, C s3201 빛 핵).
- 1x 가독성은 비김. 오히려 가장 잘 읽히는 꼬리 쓸기는 o예요.
- 그래도 **c 채택을 추천**: o에는 `-1::flat color::`·`-3::simple illustration::`이 들어 있어 공통의 `cel shading`·`simple background`와 정면으로 반대 방향이에요. 이미지 이득이 아니라 모순 제거 이유예요. Lucy가 고를 후보: c / o 유지.
- 참고: 산양·별 o·c는 요청이 같은데 sha가 달라요. 구도는 같아서, 시드 고정 비교는 구도 수준에서 믿을 만해요.

## 5. R3에 바꿀 것
1. **별자리**: R1 제 제안에서 `constellation`이 빠졌고, `four-pointed star`(기호 태그)+`large bright`+`bold thick`+`cel shading`이 각진 금속 별 아이콘을 만들었어요. → `1.3::constellation::, five small glowing dots of pale gold light connected by straight lines, 1.1::thick lines::, flat, 2d`, UC에 `1.2::star (symbol), gold, metal, beveled, faceted::`. 시드 R1 3101·3102 유지.
2. **흑요석 뿔**: `standing upright on its base`가 원뿔+받침(고리)을 불러 모자가 됨. → `a single short thick ram horn curled into a tight spiral, side view, ridged, glossy black obsidian, floating`, UC `witch hat, hat, cone, drill, unicorn horn, ring, halo, magic circle, base`. 둥근 말림이라 들이받기의 호와도 갈라져요.
3. **유리 파편**: `in a fan`→부채(hand fan)로 읽힘. → `three separate long triangular red glass shards flying side by side toward the upper right, parallel, evenly spaced`, UC `1.2::hand fan, folding fan, handle, stick, stem, flower, bouquet, leaf, feather::`.
4. **유리 벽**: `standing upright like a window pane`이 문·창문+바닥을 부름(o-s3102·s3202, c-s3202). → `a thin flat horizontal slab of red glass, much wider than tall, long side horizontal, seen straight on, floating`, `faceted crystal plates` 빼기. UC에 `door, doorway, window, pillar, monolith, 1.3::light on floor, reflection::`.
5. **C 크기·진입**: 부정 문장(`nothing enters from the bottom corners`)이 오히려 그 낱말을 넣어요. → `the shape enters only from the middle of the left edge, its tip stops just past the center, empty right and top`. 산양 C의 등록 UC에 남은 `cropped, out of frame`은 진입과 충돌하니 C에서만 빼요. 프롬프트의 `no head, no face`도 빼요(UC가 이미 막음).
6. **시드**: 고친 카드는 R2 시드 넷 그대로(같은 시드 문구 비교), 유지 카드는 시드 고정·c만 적용. 1024²·28스텝·1장·참조 없음 유지.

## 6. 확인 못 한 것
- 원본 1024² PNG는 안 열었어요(grid·sheet만).
- 손패 줄의 case 표기가 없어 sheet로 대조했어요.
- 빛 번짐이 `artist:wlop` 때문인지는 떼어 보지 않았어요(작가 묶음은 Lucy 몫).
- `cel shading`이 별을 각지게 만든 몫과 `four-pointed star` 몫은 따로 떼지 못했어요(추론).
