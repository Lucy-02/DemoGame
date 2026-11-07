# R1 리뷰: brand-player (브랜드·톤 + 덱빌더 플레이어)

## 1. 총평
별·흑요석·파편은 실제 크기에서 읽히지만, 거의 모든 장이 빛나는 이펙트 그림이라 "카드는 조용히"와 어긋나고, 선화 셀 채색인 정령 그림과 같은 게임으로 안 보여요.

## 2. 카드별
| 카드 | 가장 나은 case_id | 판정 | 근거 |
|---|---|---|---|
| 유리 벽 | sal_01-B-o-s3101 | 고침 | 넷 다 루비 결정·잔·원통으로 읽혀요. 벽(넓은 판)이 아니에요 |
| 꼬리 쓸기 | sal_03-C-o-s3102 | 고침 | 꼬리는 안 나오고 불고리만. s3102의 휘는 궤적이 그나마 "쓸기". B는 포털·고리로 읽혀요 |
| 유리 파편 | sal_08-B-o-s3101 | 유지 | 날아오는 조각이 바로 읽혀요. 단 아래 왼쪽 끝이 초상 홈 밑에 들어가요 |
| 들이받기 | ibex_01-C-o-s3102 | 고침 | 돌진이 안 보여요. s3101은 땅에서 솟은 뿔, x-s3102는 창 안에 두 번째 얼굴, B는 불고리 |
| 흑요석 뿔 | ibex_08-B-o-s3102 | 고침 | 뿔은 읽히나 창 가로를 꽉 채워 윗선·모서리에 잘려요. x-s3102는 물음표·뱀 같아요 |
| 산사태 | ibex_10-B-o-s3101 | 고침 | "바위 하나"로 읽혀요(사태가 아님). 떠 있는 바위+바닥 그림자가 에셋 렌더 느낌 |
| 별빛 | star_01-B-x-s3101 (Lucy가 고를 후보: o-s3101) | 고침 | o는 손패에서 가장 밝은 장이라 튀어요. x-s3101은 작고 차분하지만 표식보다 장식 별 |
| 별자리 | star_03-B-o-s3102 | 유지 | 굵은 점·선이 1x에서도 별자리로 읽혀요. x 두 장은 잡선·원이 섞여 흐려요 |

## 3. 구도 문법
- B 기본 + C 일부 추천은 유지해요. 단 C가 실제로 "몸의 일부"를 못 그렸어요(꼬리 0장, 뿔은 땅에서 솟음).
- B가 잘 맞은 곳: 파편·별자리·별빛. 덜 맞은 곳: 유리 벽(정체가 바뀜), 산사태(복수·움직임 빠짐).
- A(sal_03-A)는 귀엽지만 정령 유체(분홍, 찌푸린 눈, 머리 아가미)와 다른 생물(주황, 동그란 검은 눈)이 나왔고 1x에서 초상 얼굴과 겹쳐요. 이 라운드 근거로는 A를 늘리지 않아요.

## 4. 화풍 (o vs x)
- 이미지 차이는 작아요. x(#15)는 바탕이 밝고 회화적이라 손패에서 덜 또렷하고(ibex_10-x, star_03-x), o가 실루엣이 단단해요. o 쪽이 낫지만 결정적이지 않아요.
- 더 큰 문제는 둘 다 정령 그림(굵은 선화, 셀 채색, 흰 하이라이트)과 다르다는 점이에요. 카드는 선 없는 글로우 VFX라 Steam 덱빌더층이 "AI 이펙트"로 먼저 볼 그림이에요.
- index.json을 보면 #02_v2·#15 블록에 `{{{shiny skin, masterpiece portrait, hyper detail, intricate details, skindentation...}}}`, `-3::simple illustration::`, `-1::flat color::`가, UC에 `negative space, blank page`가 붙어요. 작은 창·사물·여백과 정면으로 반대예요(R5 1-3). b07_v2는 이 꼬리가 없고, ibex_10-o·star_03-o가 가장 평평하고 깔끔해요.

## 5. 2라운드에 바꿀 것
1. **빛 줄이기(톤)** → 공통 subject에서 `glowing ember light`, `sparks`, `embers`, `heat shimmer`, `glow`를 빼고 UC에 `1.2::glowing, light particles, sparkles, lens flare, bloom::` 추가. 빛나는 건 정령별 결정 1곳만(유리 속 심지, 뿔 균열). 근거: 손패 8장 중 6장이 발광, 해방만 크게 움직인다는 톤.
2. **정령 그림과 붓질 맞추기** → 사물 카드에서 #02_v2·#15의 품질 꼬리(위 문자열)와 `-1::flat color::`·`-3::simple illustration::`를 떼고 `lineart, cel shading, flat color, clean outlines`를 1.1로. 정령 확정 그림을 Vibe Transfer(낮은 강도)로 화풍만 참조하는 비교 1안. 근거: 정령 adult/baby의 선화와 대비, R4 3-3 고정 블록.
3. **UC의 `negative space, blank page` 제거** → 프리셋 None + 공통 uc만. 근거: R5 1-3, ibex_08·ibex_10이 창을 꽉 채운 결과.
4. **모티프를 정령에서 가져오기** → 유리 벽: `a wide flat wall of angular faceted pink-red crystal plates, like the salamander's crystal tail, seen from the front, wider than tall`. 흑요석 뿔: `ridged stripes` 대신 `smooth black horn with a network of thin orange cracks`(유체 뿔 무늬), `small, whole horn fits inside the image`. 근거: 1x에서 벽·뿔 오독, 정령 그림 무늬와 불일치.
5. **동작 카드 문장** → 들이받기: `side view, the curved horn tip thrusting to the right, short straight speed lines behind it, a small crack burst at the tip, no head, no face`. 꼬리 쓸기: Precise Reference(도롱뇽 성체 꼬리) 1장 붙이고 `only the crystal tail, no body, curling in a crescent`. 산사태: `three or four rocks tumbling down a slope from upper left to lower right, no floor, no shadow`. 근거: R1에서 동작·복수가 안 나옴.
6. **시드 전략** → 카드당 시드 4개 중 2개는 R1 최고 시드(3101/3102) 고정, 2개는 새 시드. 판정은 hand@1x에서 회색조와 같이. 근거: R1은 시드 2개라 우연 편차를 못 갈라요.

## 6. 확인 못 한 것
- 정령별 실제 윗선에서의 잘림(지금은 별 모양 임시).
- 호버·보상 화면 실물에서 확대 원화가 어떻게 보이는지(시트의 확대 카드만 봄).
- Steam 이용자 실제 반응. "AI처럼 보인다"는 제 플레이어 감각이고 측정값이 아니에요.
- 별 정령 확정 그림은 보지 않아서 별 카드의 화풍 일치는 판단 못 했어요.
