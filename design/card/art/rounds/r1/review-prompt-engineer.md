# R1 리뷰: prompt-engineer

## 1. 총평
사물 B는 통했고, 빗나간 건 대부분 프롬프트 탓이에요: 사람용 블록, `close-up`+동물 이름, C 구도와 UC `cropped` 충돌, 크기 지시 부족.

## 2. 카드별
| 카드 | 가장 나은 | 판정 | 근거 |
|---|---|---|---|
| 유리 벽 | sal_01-B-o-s3101 | 고침 | 4장 모두 꽃병·컵·보석. 판이 아니라 덩어리 |
| 꼬리 쓸기 | sal_03-B-o-s3101 | 유지 | 초승달 호가 가운데, 회색조도 또렷. C는 꼬리 없이 고리만 |
| 유리 파편 | sal_08-B-x-s3102 | 고침 | 셋이 아니라 1~2덩이. o는 왼쪽 아래(초상)로 뻗어요 |
| 들이받기 | ibex_01-C-o-s3101 | 고침 | 뿔이 바닥에서 솟고 위 가장자리에 닿아요. x 두 장엔 산양 머리 |
| 흑요석 뿔 | ibex_08-B-o-s3102 | 고침 | 창 폭 전체 호. 들이받기 C-o-s3102와 실루엣이 같아요 |
| 산사태 | ibex_10-B-o-s3102 | 고침 | 바위 한 덩이 + 아래 납작한 그림자 띠 |
| 별빛 | star_01-B-o-s3102 | 유지 | 손패에서 가장 잘 읽혀요. s3101은 윗선에 닿아요 |
| 별자리 | star_03-B-o-s3102 | 고침 | 선·점이 가늘어 실제 크기에서 거의 안 보여요 |

## 3. 구도 문법
- B: 별빛·꼬리 쓸기 B·산사태·파편에서 실제 크기로 읽혀요.
- C: 두 카드 다 실패. 꼬리는 닫힌 고리, 뿔은 머리가 붙거나 바닥에서 솟아요. 원인 둘: (1) "가장자리에서 들어옴"과 UC `cropped, cut off`, 구도 문장 `empty space in all four corners`가 서로 막아 모델이 닫힌 형태로 피해요. (2) `close-up`은 Danbooru에서 주로 얼굴 클로즈업이에요.
- A: 귀엽지만 창의 얼굴이 바로 옆 초상과 겹쳐 보여요(sheet-2). A 프롬프트의 `chibi`가 #02_v2의 `-3::chibi::`와 정면 충돌해요.
- 추천 유지: B 기본 + C 일부. 단 C는 고친 프롬프트로 R2에서 한 번 더 보고 판정해요.

## 4. 화풍
- o(b07_v2·#02_v2)가 대체로 나아요: 바탕이 깨끗하고 머리가 없어요. #15는 바닥·그림자를 더 끌고(sal_01-x 두 장), 들이받기에서 머리가 나와요.
- 비교가 공정하지 않아요. #15만 scale 8.5·rescale 0.4·**Variety+ 켬**(`skip_cfg_above_sigma: 58`)이에요. PIPELINE은 Variety+ 끔이고, R5 §4대로 켜면 초반 스텝에 UC가 덜 먹어 머리가 생길 수 있어요.
- 블록 안 캐릭터용 조각: #02_v2·#15의 `{{{shiny skin, masterpiece portrait, …, skindentation…}}}`, `-1::oiled skin::`, #15의 `1.5::mature female::`·`beautiful gunbari`, 등록 UC의 `negative space, blank page`(여백과 반대, R5 §1-3), `fused legs, bad fingers` 류. b07_v2는 작가 접두만 있고 UC에 `negative space`가 없어요. 작가 차이와 겹쳐 효과를 따로 떼어 볼 수는 없어요.
- **Lucy가 고를 후보**(jjal 규칙은 "블록 그대로"):
  - ① 그대로 두고 카드 쪽 UC·음수 가중치로 막기. 정령 그림과 같은 블록이 유지돼요. 대신 사람 쪽 끌림이 늘 남아요.
  - ② 작가 블록만 떼고 캐릭터 조각과 `negative space, blank page`를 뺀 `*_obj` 변형 키 만들기. 사물에 가장 깨끗해요. 대신 규칙 예외라 provenance에 변형 키를 따로 적어야 하고, 붓질이 정령 그림과 조금 멀어질 수 있어요.
  - ③ R2에서 같은 시드로 ①·② 한 쌍만 돌려 보고 정하기. 제 추천이에요.

## 5. R2에 바꿀 것
1. **설정**: 모든 화풍 Variety+ 끔, scale·rescale 통일(기본 6/0.1). 그래야 화풍만 비교돼요(R5 §4).
2. **C 전용 UC·문장**: C에서 `cropped, cut off` 빼고 `animal, goat, head, snout, muzzle, eyes, fur, 2::face::` 더하기. `close-up`→`object focus`. 프롬프트에서 `ibex` 빼고 `-1::animal head::`. 진입은 `from the left edge at middle height`로(지금 "lower left"는 초상 자리, R4 5-1). 꼬리: `the tapered tip of a segmented lizard tail curls into a crescent in the center, the base exits the left edge`.
3. **유리 벽**: `a thin rectangular sheet of red glass, front view, wider than tall, like a window pane floating upright, glowing edges`, UC `vase, cup, bottle, jar, container, gem, gemstone, crystal, floor`. "수호=가로 넓은 형태"(R4 4장).
4. **크기 문장**: 자연어 대신 `small subject, centered, wide shot` 태그 + `the subject spans about half the image`. 작게 뽑으면 후처리(PIPELINE ⑤)에서 잘라 키울 수 있지만, 크게 뽑은 건 되돌릴 수 없어요. 흑요석 뿔은 `large`→`short thick compact horn, standing on its base, spiral ridges`로 바꿔 들이받기 호와 실루엣을 갈라요.
5. **그림자·개수**: 산사태 UC에 `cast shadow, floor, ground, horizon`, 본문은 `four separate boulders tumbling down a diagonal, largest in front`. 파편은 `three separate shards in a fan, gaps between them, pointing up-right`(정면으로 날아오는 단축이 덩어리를 만들어요). 별자리는 `five large bright four-pointed stars joined by bold glowing lines, the shape fills the middle half`로 `thin`·`seven small`을 빼요.
6. **시드**: 고친 카드는 R1 시드 3101·3102 유지(같은 시드에서 문구만 바꾸는 비교, R5 §3-3) + 새 시드 2개(예: 3201·3202). 유지 카드(별빛·꼬리 쓸기 B)는 시드를 고정하고 화풍 ①/② 한 가지만 바꿔요. 1024²·28스텝·1장씩·참조 없음, Opus 무료 범위예요. 선택 실험: 캐릭터 박스 하나를 Custom C2에 두고 사물을 적어 위치 고정(R5 §1-6, 미검증, 비용 없음).

## 6. 확인 못 한 것
- jjal의 레지스트리 규칙 원문(이 저장소에 없음). 의뢰 문구대로 적었어요.
- `negative space` 제거의 단독 효과(작가 블록과 겹침). Variety+가 머리를 만들었다는 인과도 추론이에요.
- 손패 줄이 어떤 시드인지 표기가 없어 sheet로 대조했어요(s3101 o로 보여요).
- 원본 1024² PNG는 직접 열지 않았어요(grid·sheet 축소본만 봤어요).
