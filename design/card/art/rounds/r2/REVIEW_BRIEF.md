# 카드 일러스트 R2 평가 브리프 (리뷰어 공통)

Lucy가 "초안 생성 + 전문가 페르소나 + 노하우 문서 + 성공사례 기반 에이전트 평가 피드백 루프 2라운드 이상"을 요청했어요. 당신은 그 루프의 리뷰어 한 명이에요. 다른 리뷰어 결과는 보지 않아요.

## 읽을 것
- 계획: `design/card/art/PIPELINE.md` (구도 문법 A/B/C, 그림 창 제약, 추천: B 기본 + 몸짓 카드는 C)
- 성공 사례·관례: `design/card/research/R4-card-illustration-conventions.md`
- NovelAI 4.5 노하우: `design/card/research/R5-novelai-v45-prompting.md`
- 카드 정본 요약: `design/card/CONTEXT.md` (톤: "카드는 조용히, 정령은 또렷하게", 휘황찬란·과한 장식 금지)
- R2 입력: `design/card/art/rounds/r2/briefs.json` (카드별 Focus·구도·프롬프트 조각)
- R2 결과 메타: `design/card/art/rounds/r2/index.json` (case별 실제 prompt·uc·seed·화풍 키·scale)
- R2 이미지 (Read로 보세요):
  - `shots/grid.jpg`: 산양·별 c 변형을 뺀 46장 원본(1024² → 축소) 한눈에. 라벨 = case_id + 화풍 키
  - `shots/hand@1x.png`: 손패 한 줄, **실제 크기**(카드 92×129, 그림 창 84×90). 판단 기준은 이거예요
  - `shots/hand@2x.jpg`: 같은 줄 2배
  - `shots/sheet-1.jpg`~`sheet-6.jpg`: 카드별 후보마다 [손패 카드 · 회색조 손패 카드 · 확대 카드(정본 .x, 그림 창 208×150 가로)] 2배 화면
- case_id 읽는 법: `<카드id>-<구도 A|B|C>-<o=정령 배정 화풍|x=비교 화풍 #15>-s<시드>`. 화풍 키: 도롱뇽 #02_v2, 산양·별 b07_v2, 비교 #15.
- 틀 주의: 윗선은 정령별 정본이 없어 별 모양을 임시로 썼어요. 숫자판·비용·얼굴은 정본 자리 그대로예요. 카드 문구는 자리표시예요.

## 쓸 것
`design/card/art/rounds/r2/review-<당신의 키>.md` 하나 (한국어, 해요체, 6KB 안쪽):
1. 한 줄 총평
2. 카드별 표: 카드 | 가장 나은 case_id | 판정(유지/고침/버림) | 근거 한 줄 (이미지에서 확인한 것만)
3. 구도 문법 판정: A·B·C 중 무엇이 어디에 맞는지, 추천안(B 기본 + C 일부)을 유지할지
4. 화풍 판정: 배정 화풍(o) vs #15(x)
5. 2라운드에 바꿀 것 최대 6개: 무엇을 → 어떻게(프롬프트 문구·UC·구도 문장·시드 전략 수준으로 구체적으로) → 근거(R4/R5 절이나 이미지)
6. 확인 못 한 것

규칙: 이미지에서 확인되지 않는 주장은 쓰지 않아요. 색·크기 값을 새로 정하지 않아요(바탕 톤은 임시 값). 기각된 결정(`docs/design-decisions/`)을 다시 꺼내지 않아요. 최종 미적 선택은 Lucy 몫이라 "Lucy가 고를 후보"로 표시해요. 마지막 메시지로 5줄 요약을 돌려줘요.

## R2에서 달라진 것 (꼭 함께 보세요)
- R1 평가 종합: `design/card/art/rounds/r1/SYNTHESIS.md`, R1 이미지: `design/card/art/rounds/r1/shots/grid.jpg`, 당신의 R1 리뷰: `design/card/art/rounds/r1/review-<당신의 키>.md`
- case_id 셋째 칸: `o` = 레지스트리 화풍 묶음 그대로, `c` = 같은 작가 블록에서 캐릭터용 태그·UC의 negative space/blank page·Variety+를 뺀 사물용. **b07_v2(산양·별)는 뺄 것이 없어 o와 c가 같은 요청**이라 비교는 도롱뇽(#02_v2)에서만 의미가 있어요. 화풍 x(#15)는 R2에서 쉬었어요.
- 공통 변화: 주제를 작게, 빛 낱말 줄임, `clean lineart, cel shading, thick outline`, 바닥·그림자 UC, C는 왼쪽 가운데 진입 + 동물 머리 UC.
- 생성 쪽 관찰(검증 전): star_03이 입체 금별로 크게 나옴, ibex_08이 마법사 모자처럼 읽힘, sal_08 s3102 부채처럼 손잡이 생김, sal_01 s3102·s3202 바닥 원근, 일부 C가 가장자리 잘림.

## 추가로 쓸 것
- 2번 표에 **R1과 R2를 합쳐** 카드마다 가장 나은 case_id(라운드 표시)를 골라요.
- "R1 → R2에서 나아진 것 / 나빠진 것"을 짧게.
- 5번은 "R3에 바꿀 것"으로, 그리고 **이 카드를 지금 Lucy 앞에 후보로 내도 되는지**(된다/한 번 더) 카드별로.
