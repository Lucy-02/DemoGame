# R3. 경쟁작 지형도와 "핵심 훅" 분석: 크리처 육성 + 로그라이트 덱빌더

작성일: 2026-10-30 · 대상: Lucy (결정용 참고 자료, 결정 아님)
우리 초안: 정원에서 정령을 키우고 → 런에 3마리를 데려가고 → 덱 = 세 정령이 배운 카드의 합집합 → 같은 카드도 시전 정령 스탯으로 달라짐 → 정령별 싱크율 → 일시 각성 → 속성 약점 → 실드 브레이크 → 시전 끊기 → 진화 때 성격이 드러나 덱 동작이 바뀜 → 정령이 쓰러지면 그 정령 카드 봉인. 브랜드 훅 초안: "정령을 키우면 덱이 자라요."

## 0. 조사 범위와 한계 (먼저 읽어 주세요)

- Steam 수치는 2026-10-30에 각 Steam 상점 페이지를 직접 읽은 값이에요. 대부분 **영어 리뷰만 센 수**라서 전체 리뷰 수보다 작아요(예: Aethermancer는 상점 페이지 영어 기준 1,563건, 집계 사이트 전체 기준 2,722건).
- 조사 중간에 세션 공용 웹 열람 한도(시간당 100회)가 다 떨어졌어요. 그래서 **Ryan Clark 글, Zukowski의 "장르 섞기" 사설, GameDiscoverCo 장르 분석, Monster Train GDC 포스트모템은 링크(제목)까지만 확인하고 본문은 못 열었어요.** 그 글들의 내용은 기억에 기대서 적었고 [미확인]을 붙였어요. 다음 라운드에서 본문을 열어 확인하는 게 좋아요.
- 메커니즘 설명 중 상점 페이지나 리뷰에서 확인하지 못하고 플레이 지식으로 적은 부분도 [미확인]을 붙였어요.

---

## 1. 경쟁작 카드 (가까운 순)

### 1-A. 가장 가까운 축: "크리처 파티 + 로그라이트 + 카드/주사위"

**Aethermancer (moi rai games, 2025-09-23 앞서 해보기, 영어 리뷰 93% / 1,563건, "매우 긍정적")**
- 마케팅 한 줄: "Monster Taming meets Roguelite". 신화 속 크리처와 함께 계속 바뀌는 Fractured Ruins에서 턴제 전투를 한다고 소개해요. https://store.steampowered.com/app/2288470/
- 핵심 기믹: 3마리 파티, 레벨업마다 성장 방향을 고르고, "각 몬스터의 스킬 풀이 이전 선택과 **같은 팀의 다른 몬스터에 반응해서** 바뀌어요." 몬스터가 죽으면 영구히 잃지만 영혼을 '환생'시킬 수 있고, 환생한 몬스터는 "정체성을 유지하면서 지난 생보다 강해져요"(Worthiness). 4원소 Aether 마나 시스템이 있고, 앞서 해보기 기준으로 메타 진행 경로는 4가지예요. https://store.steampowered.com/app/2288470/
- 세계·서사: 런이 끝나면 허브 마을 Pilgrim's Rest로 돌아가요. 런 중에 만난 NPC가 마을에 자리 잡고 Aether Crystal을 받고 영구 강화를 줘요. 리뷰는 NPC 상호작용이 얕다고 아쉬워했어요("우정 시스템이나 대화 선택지가 있었으면"). https://www.destructoid.com/aethermancer-early-access-review/
- 잘된 점과 아쉬운 점: 팀 조합과 아키타입의 폭, 픽셀 아트, Shifted 변종이 주는 재플레이성은 좋은 평을 받았어요. 런이 짧고 바이옴이 반복된다는 점, 아이콘이 작고 화면마다 다르게 보인다는 점은 지적받았어요(Destructoid 8/10). https://www.destructoid.com/aethermancer-early-access-review/
- 플레이 시간 중앙값은 7.4시간이에요. https://nodal.gg/game/aethermancer-2288470
- **우리와의 관계:** "런 사이에 크리처가 자란다(환생 + Worthiness)"와 "3마리 파티"가 겹쳐요. 다만 덱빌더가 아니라 스킬을 고르는 턴제 RPG예요. 각 몬스터가 스킬을 직접 쓰고, 카드 드로우나 덱 합집합은 없어요.

**Montabi (Mankibo / Akupara Games, 2026-08-06 출시, 93% / 133건)**
- 한 줄: "creature-collector roguelike deckbuilder". 상점 페이지에 "**각 진화 라인마다 고유한 덱**이 있다"고 적혀 있어요. 레벨업과 진화로 새 카드 능력이 열리고, 3x3 그리드에서 트레이너와 함께 싸워요. https://store.steampowered.com/app/3141630/Montabi/
- 구조: 5마리 보유(전투 2 + 예비 3), Lv5와 Lv10에 진화하면서 두 갈래 중 하나를 골라 특성을 붙여요. 게임 오버가 쌓이면 아이템, 장비, 새 Montabi가 열려요. 런은 30~45분이에요. 리뷰는 루프가 중독적이라고 칭찬했고, 스토리가 빈약하고 Montabi 체력이 낮아 드로우 운에 런이 끝난다고 비판했어요. https://rpgamer.com/review/montabi-review/
- 개발 일지: 처음에는 **Monster Rancher식 육성 + 대전** 게임이었는데, "반복이 빨리 지루해지고, 몬스터 랜처식 메커니즘은 서구 시장에서 매력이 제한적"이라는 피드백을 받고 2024년 초에 크리처 로그라이크 덱빌더로 바꿨어요. 덱은 "Montabi 스킬 + 트레이너 파워 + 참"으로 만들어요. https://mankibo.itch.io/montabi/devlog/958993/from-monster-duel-to-deckbuilding-adventure-montabis-journey
- **우리와의 관계:** "크리처가 카드를 가져오고 진화로 덱이 바뀐다"는 구조가 **이미 출시돼 있어요.** 그런데도 리뷰 수 133건으로 반응이 작아요. 장르 이름만으로는 팔리지 않는다는 신호로 읽혀요. 육성 파트를 버린 이유(서구 시장 반응)도 우리 '정원' 축에 직접 경고가 돼요.

**Decktamer (Horizon Edge / Assemble, 2025-10-27, 89% / 915건)**
- 한 줄: 적 크리처를 길들여 덱에 넣는 로그라이크 덱빌더예요. "카드는 그냥 주어지지 않는다, 적을 길들여야 덱에 들어간다." 크리처가 죽으면 "그 카드는 영원히 사라져요." 크리처끼리 능력을 옮겨 콤보를 만들 수 있어요. 런 사이 성장 여부는 상점 페이지에 없어요. https://store.steampowered.com/app/2870340/Decktamer/
- **우리와의 관계:** "쓰러지면 카드를 잃는다"는 긴장 장치가 겹쳐요. 우리 쪽은 '봉인'이라 일시적이고 Decktamer는 영구 손실이에요.

**Dicefolk (LEAP Game Studios + Tiny Ghoul / Good Shepherd, 2024-02-27, 89% / 872건)**
- 한 줄: "커스터마이즈하는 마법 주사위로 키메라 팀을 모집하고 지휘하는 전술 로그라이트." https://store.steampowered.com/app/1996430/
- 기믹: 카드 대신 주사위를 써요. **적 주사위까지 내가 고르는** "솔로 PvP" 구조이고, 3마리 키메라를 돌려 앞 칸을 바꿔요. 리뷰는 독창성과 높은 전략성을 칭찬했고, 주사위 운과 회복 부족, 경로를 되돌릴 수 없는 점을 비판했어요(MP1st 8.5/10). https://mp1st.com/reviews/dicefolk-review-a-spin-of-the-dice
- **우리와의 관계:** 3마리 로테이션과 크리처 정체성은 가깝지만, 런 사이 육성이나 덱 합집합은 없어요. 훅을 "몬스터"가 아니라 "적의 행동까지 내가 굴린다"는 규칙 비틀기 하나에 걸었어요.

**Moonstone Island (Studio Supersoft / Raw Fury, 2023-09-20, 영어 85% / 2,942건)**
- 한 줄: "섬 100개를 탐험하는 오픈월드 크리처 수집 라이프심." https://store.steampowered.com/app/1658150/_/
- 기믹: 정령(Spirit)을 길들이고, 직접 짠 **카드 덱으로 턴제 전투**를 해요. 그 밖에 채집, 제작, 요리, 연애·결혼이 있어요. 출시 때 정령 66종이었고 이후 27종과 진화 경로 30개가 추가됐어요. 메타크리틱 80이고 평가는 엇갈려요(Hardcore Gamer 5/5, Siliconera 6/10). 장르 혼합과 픽셀 아트는 칭찬받았고 **초반 템포**는 비판받았어요. 판매량은 공개 자료에서 찾지 못했어요. https://en.wikipedia.org/wiki/Moonstone_Island
- **우리와의 관계:** "정령 + 덱 + 아늑함"을 다 가진 가장 가까운 선례예요. 다만 로그라이트가 아니라 라이프심이에요. 마케팅 한 줄에 '덱빌딩'을 넣지 않고 **'크리처 수집 라이프심'을 앞세웠다**는 점이 눈에 띄어요(아래 3절 앵커 논리 참고).

### 1-B. 파티가 덱 하나를 나눠 쓰는 덱빌더

**Monster Train (Shiny Shoe, 2020-05-21, 96% / 12,272건)** · **Monster Train 2 (2025-05-21, 95% / 5,092건)**
- 한 줄: "지옥으로 가는 기차 위에서 세 층의 전장을 지키는 전략 로그라이크 덱빌더." https://store.steampowered.com/app/1102190/ · 2편은 출시 후 50만 장을 넘겼다고 보도됐어요. https://www.pcgamesn.com/monster-train-2/roadmap-updates-dlc
- 기믹: **주 클랜 + 동맹 클랜, 두 클랜의 카드를 섞어** 덱을 만들어요. 챔피언 유닛은 런 중에 업그레이드 경로를 골라요 [미확인: 메커니즘은 플레이 지식]. 2편은 클랜 5개를 새로 넣고 룸 카드와 장비 카드를 더했어요. https://store.steampowered.com/app/2742830/
- 참고: GDC 2021 IGS "Monster Train Postmortem" 세션이 있어요(본문 미열람). https://www.gdcvault.com/play/1027281/contactUs
- **우리와의 관계:** "두 정체성의 카드 합집합 = 덱"을 증명한 가장 큰 사례예요. 클랜 조합만으로 재플레이가 폭발하는 구조예요.

**Cobalt Core (Rocket Rat Games / Brace Yourself Games, 2023-11-08, 96% / 3,452건)**
- 한 줄: "한 축 위에서 미사일을 피하고 포를 맞추며 타임루프를 깨는 SF 로그라이크 덱빌더." https://store.steampowered.com/app/2179850/
- 기믹: 선원 3명을 골라 각자의 카드 풀을 섞어요. 적이 선원을 "Missing" 상태로 만들면 그 선원의 카드를 쓸 수 없게 돼요 [미확인: 플레이 지식]. 이게 우리 "쓰러지면 봉인"과 거의 같은 해법이에요. 서사는 선원들의 기억과 타임루프를 런마다 조금씩 밝히는 방식이에요 [미확인]. 이동 설계 분석: https://gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat

**Across the Obelisk (Dreamsite / Paradox Arc, 2021-04-08, 81% / 7,874건)**
- 한 줄: "최대 4인 협동 로그라이트 덱빌더, 전술 전투." https://store.steampowered.com/app/1385380/
- 기믹: 영웅 4명이 **각자 덱**을 가지고 이니셔티브 순서로 행동해요 [미확인]. 우리 '합집합 덱'과 반대편 해법이에요(덱을 나누면 한 명이 죽어도 다른 덱은 멀쩡하지만, 한 손에서 조합을 짜는 재미는 줄어요). 81%로 이 목록에서 평점이 가장 낮은 편이에요.

**Roguebook (Abrakam / Nacon, 2021-06-17, 84% / 1,994건)**: 영웅 **2명**의 능력을 조합하는 덱빌더예요. Richard Garfield가 공동 설계했어요. https://store.steampowered.com/app/1076200/

**Nowhere Prophet (Sharkbomb / No More Robots, 2019-07-19, 77% / 723건)**: 추종자가 곧 카드예요. **부상당한 추종자는 안전한 곳에서 회복해야 하고, 부상이 쌓이면 영구히 잃어요.** https://store.steampowered.com/app/681730 · 우리 '봉인'의 직접 선례인데, 평가는 이 목록에서 가장 낮아요.

### 1-C. 장르의 기준점이 된 덱빌더 (훅 비교용)

| 게임 | 출시 | Steam (영어) | 마케팅 한 줄 / 기믹 | 서사 |
|---|---|---|---|---|
| Slay the Spire | 2019-01-23 | 97% / 77,310 | 덱 + 유물로 탑을 올라요. 장르 원형이에요 | 최소한 |
| Inscryption | 2021-10-19 | 96% / 76,993 | 덱빌딩 + 방탈출 + 심리 호러예요 | 메타 서사가 핵심이에요 |
| Balatro | 2024-02-20 | 98% / 105,412 | 포커 족보 로그라이크예요. 조커 콤보가 있어요 | 없어요 |
| Wildfrost | 2023-04-12 | 91% / 5,368 | "원소에 맞서는 전술 로그라이크 덱빌더" | 마을 재건 메타 |
| Griftlands | 2021-06-01 | 93% / 5,293 | 협상·전투 두 덱, 선택이 런을 바꿔요 | 강한 서사 |
| Tainted Grail: Conquest | 2021-05-27 | 89% / 4,293 | 아발론 섬의 스토리 중심 덱빌더예요 | 세계관 중심 |
| Shogun Showdown | 2024-09-05 | 96% / 3,525 | 위치·타이밍 + 공격 타일 조합이에요 | 최소한 |
| Vault of the Void | 2022-10-04 | 93% / 1,417 | 운이 적고 적을 미리 보는 덱빌더예요 | 최소한 |
| Dungeons & Degenerate Gamblers | 2024-08-08 | 83% / 2,246 | 블랙잭 로그라이크예요 | 코미디 |

출처: https://store.steampowered.com/app/646570/ · https://store.steampowered.com/app/1092790/ · https://store.steampowered.com/app/2379780/ · https://store.steampowered.com/app/1811990/ · https://store.steampowered.com/app/601840/ · https://store.steampowered.com/app/1199030 · https://store.steampowered.com/app/2084000/ · https://store.steampowered.com/app/1135810/ · https://store.steampowered.com/app/2400510

DDG는 "Balatro의 그늘 아래 있다"는 평을 받았어요. 익숙한 카드놀이를 훅으로 쓰면 앵커는 강해도 비교 대상이 너무 선명해지는 사례예요. https://www.siliconera.com/review-dungeons-degenerate-gamblers-stands-in-balatros-shadow/

### 1-D. 크리처 RPG / 아늑한 정령 게임 (톤·관객 비교용)

| 게임 | 출시 | Steam | 한 줄 | 우리와 닿는 점 |
|---|---|---|---|---|
| Cassette Beasts | 2023-04-26 | 95% / 6,309 | 몬스터를 카세트에 녹음해 **변신**하고, 동료와 **퓨전**해요. 관계가 깊을수록 퓨전이 강해요 | 유대 → 전투력 연결 |
| Monster Sanctuary | 2020-12-08 | 92% / 5,015 | "몬스터 테이밍 meets 메트로배니아", 몬스터별 스킬트리 | Aethermancer 개발사 전작 |
| Temtem | 2022-09-06 | 82% / 17,974 | 멀티플레이 몬스터 테이밍 MMO. 최근 30일 64%로 하락 | 라이브 운영 리스크 |
| Coromon | 2022-03-31 | 85% / 3,224 | 정통 포켓몬라이크 RPG | 기준선 |
| Beastieball | 2024-11-12 EA | 97% / 1,500 | 턴제 배구 RPG. **비스티끼리의 관계가 새 능력과 콤보를 연다** | 성격·관계 → 덱 변화 |
| Ooblets | 2023-10-05 (Steam) | 91% / 1,391 | 농장 + 크리처 + **댄스 배틀(카드 배틀러 태그)** | 아늑함 + 카드 |
| Spirittea | 2023-11-13 | 84% / 797 | 혼자만 정령을 보는 사람이 목욕탕을 운영해요 | '정령' 아늑함 톤 |

출처: https://store.steampowered.com/app/1321440/ · https://store.steampowered.com/app/814370/ · https://store.steampowered.com/app/745920/ · https://store.steampowered.com/app/1218210/ · https://store.steampowered.com/app/1864950 · https://store.steampowered.com/app/593150 · https://nodal.gg/game/spirittea-1931010

**검증 메모:**
- "Kaichu"는 Steam에서 **카이주 연애 시뮬레이션**(2022-09-07, 88% / 87건)으로 나와요. 덱빌더나 크리처 육성 레퍼런스로는 맞지 않아요. 다른 게임을 떠올리신 거라면 이름을 다시 알려 주세요. https://store.steampowered.com/app/1848590?l=german
- "Cards of Yore"는 검색으로 존재를 확인하지 못했어요 [미확인]. 이 자리에 맞는 실재 게임은 위의 **Montabi, Decktamer**예요.

---

## 2. 빈자리(whitespace) 분석

### 2-1. "런 사이에 크리처를 키우고 → 배운 카드가 덱이 된다"는 이미 있나요?

**조각은 모두 있어요. 다만 한 게임에 다 모인 사례는 찾지 못했어요.**

| 우리 조각 | 이미 한 게임 | 차이 |
|---|---|---|
| 크리처가 카드를 가져와요 | Montabi(진화 라인별 덱), Decktamer(크리처 = 카드) | 둘 다 크리처를 **런 안에서** 얻어요 |
| 런 사이에 크리처가 자라요 | Aethermancer(환생 + Worthiness) | 카드 덱이 아니라 스킬 RPG예요 |
| 3명의 카드 합집합 = 덱 | Cobalt Core(선원 3명), Monster Train(클랜 2개) | 크리처 육성이 없어요 |
| 쓰러지면 카드를 못 써요 | Cobalt Core "Missing" [미확인], Decktamer(영구 손실), Nowhere Prophet(부상 → 영구 손실) | 우리는 '봉인'(일시) |
| 정령 + 덱 + 아늑한 허브 | Moonstone Island | 로그라이트가 아니에요 |
| 관계·성격이 능력을 바꿔요 | Beastieball(관계 → 능력·콤보), Cassette Beasts(유대 → 퓨전) | 덱빌더가 아니에요 |
| 시전자 스탯에 따라 같은 카드가 달라져요 | 확인한 사례 없음 [미확인: 폭넓게 검증하진 못했어요] | 우리 쪽에서 가장 독특해요 |

가장 가까운 순서는 이렇게 판단했어요.
① **Montabi**(구조가 가장 비슷해요: 크리처 → 카드, 진화 → 덱 변화) → ② **Aethermancer**(메타 성장과 3마리 파티) → ③ **Cobalt Core / Monster Train**(합집합 덱) → ④ **Moonstone Island**(정령 + 덱 + 아늑함).

### 2-2. 파생작처럼 보일 위험이 큰 곳

1. **"포켓몬라이크 덱빌더"라는 말 자체가 2024~2026년에 붐볐어요.** Dicefolk(2024), Aethermancer(2025), Decktamer(2025), Montabi(2026)가 연달아 나왔어요. 캡슐 이미지에 "귀여운 크리처 3마리 + 카드"만 보이면 이 목록의 하나로 묶여요.
2. **"정령(Spirit)"이라는 단어**는 Moonstone Island(크리처 이름이 Spirit), Spirittea가 이미 쓰고 있어요. 검색과 태그에서 겹칠 수 있어요.
3. **'정원 육성' 허브**는 Montabi 개발진이 서구 시장 반응 때문에 버린 바로 그 축(Monster Rancher식 육성)이에요. https://mankibo.itch.io/montabi/devlog/958993/from-monster-duel-to-deckbuilding-adventure-montabis-journey
4. **쓰러지면 카드 봉인**은 Cobalt Core와 Decktamer 해법의 중간이라, 단독 훅으로 내세울 만큼 새롭지 않아요.
5. **약점 → 실드 브레이크 → 시전 끊기**는 JRPG 브레이크 시스템(옥토패스 트래블러류 [미확인: 이번에 따로 조사하지 않음])과 같은 문법이라, 훅이 아니라 앵커(익숙함)로 쓰는 편이 맞아요.

### 2-3. 독특할 수 있는 곳

1. **같은 카드, 다른 손.** 같은 '불씨' 카드가 어느 정령이 쓰느냐에 따라 달라지는 구조는 확인한 경쟁작 어디에도 없었어요. 합집합 덱(Cobalt Core)에 '시전자 정체성'을 한 겹 더 얹는 구조예요.
2. **덱이 '자라는' 이유가 이야기예요.** 경쟁작에서 덱은 보상 화면에서 카드를 골라 자라요. 우리 덱은 "이 정령이 무엇을 배웠고 어떤 성격으로 컸는지"의 결과로 자라요. Beastieball과 Cassette Beasts는 관계가 능력을 여는 구조가 높은 평점(97%, 95%)과 함께 갈 수 있다는 걸 보여 줘요.
3. **진화 때 드러나는 성격이 덱 동작을 바꿔요.** Montabi는 진화 때 두 갈래 중 하나를 '고르는' 방식이에요(https://rpgamer.com/review/montabi-review/). 우리는 성격이 '드러나는' 쪽이라, 키운 결과를 발견하는 순간이 생겨요. 이건 런 밖 육성에 감정적 보상을 주는 장치예요.

---

## 3. 훅 방법론: 스크린샷 한 장, 문장 한 줄로 읽히게 하려면

### 3-1. Chris Zukowski: 훅과 앵커
- 정의: **훅**은 "게임을 독특하게 만들고 다른 게임과 구별하는 것"이에요(예: Superhot, "내가 움직일 때만 시간이 흐르는 FPS"). **앵커**는 "익숙하고 안전하게 느끼게 해서 위험 인식을 낮추는 것"으로, 훅의 음양 짝이에요. https://howtomarketagame.com/2019/12/23/know-your-games-anchor/
- 핵심 발견: Steam 구매자를 인터뷰해 보니 **훅을 구매 이유로 든 사람은 드물었어요.** 대부분은 "이 장르를 좋아해서", "친구가 추천해서"처럼 익숙함을 이유로 들었어요. 훅은 상점 페이지까지 끌고 오고, **사는 이유는 앵커**예요. 그리고 "훅이 너무 낯설면 무엇을 사는지 몰라서 넘긴다"고 했어요. https://howtomarketagame.com/2019/12/23/know-your-games-anchor/
- 실무 지침: 게임플레이 화면과 UI로 **장르를 즉시 보여 주라**고 해요(같은 출처).
- 장르 섞기: Zukowski는 2023-02-22에 "Editorial: Maybe mixing genres is a bad idea"라는 사설을 냈어요. https://howtomarketagame.com/2023/02/22/editorial-maybe-mixing-genres-is-a-bad-idea/ 본문은 열지 못했고, 기억으로는 이런 요지예요. 두 장르를 반반 섞으면 각 장르 팬 모두에게 '절반만 내 게임'이 돼서 위시리스트가 갈라진다. 그래서 **주 장르 하나를 앵커로 단단히 두고, 다른 장르는 그 안의 훅으로 쓰라** [미확인].
- 그 밖에 장르를 다룬 강연 공지: https://gamecity-hamburg.de/events/gamecity-xp-boost-the-importance-of-genre-on-steam-with-chris-zukowksi/

### 3-2. Ryan Clark(Crypt of the NecroDancer): 훅 이론
- Game Developer 기고 "What makes an indie hit? How to choose the right design" https://www.gamedeveloper.com/business/what-makes-an-indie-hit-how-to-choose-the-right-design (본문 미열람). 기억으로 요지는 이래요 [미확인].
  - 인디 흥행은 **훅의 힘 × 실행 품질 × 장르 시장 크기**로 결정돼요.
  - 좋은 훅은 **스크린샷이나 GIF 한 장만 봐도 '뭐가 다른지' 보여요**(NecroDancer: "리듬에 맞춰 움직이는 로그라이크").
  - 아이디어 단계에서 훅을 여러 개 만들어 비교하고, 가장 강한 것에 걸어요.
- Thomas Brush의 훅 관련 조언은 이번에 1차 자료를 확보하지 못했어요 [미확인]. 데모가 핵심이라는 영상 요약은 찾았어요. https://recapio.com/digest/why-your-indie-game-demo-is-everything-by-thomas-brush

### 3-3. 이 기준으로 본 경쟁작 훅의 '한 줄 가독성'
- 한 문장 + 한 장면으로 바로 읽히는 훅: Balatro("포커 족보로 하는 로그라이크"), Monster Train("세 층의 기차를 지키는"), Cobalt Core("한 축 위에서 회피"), Dicefolk("적 주사위까지 내가 굴린다"), Cassette Beasts("녹음해서 변신"). 모두 **동사 하나가 독특해요.**
- 한 문장으로는 약한 훅: "Monster Taming meets Roguelite"(Aethermancer)는 장르 결합만 말해요. 그래도 Monster Sanctuary라는 **스튜디오 앵커** 덕분에 잘됐어요(Zukowski가 말한 '스튜디오 신뢰'형 앵커).
- 비슷한 사례: 클로 머신 + 덱빌더인 Dungeon Clawler는 2개월에 20만 장 이상을 팔았다고 GameDiscoverCo가 다뤘어요. https://newsletter.gamediscover.co/p/how-dungeon-clawler-grabbed-200k (본문 미열람)
- **우리 초안 "정령을 키우면 덱이 자라요"**는 두 동사(키운다 → 자란다)의 인과를 말해요. 다만 스크린샷 한 장에서 그 '인과'를 보여 주기는 어려워요(키우는 장면과 덱 장면이 서로 다른 화면). 한 장에서 보이게 하려면 "**같은 카드가 정령마다 다른 값으로 빛나는 손패**"나 "**진화 순간 카드 문구가 바뀌는 장면**"처럼 한 화면 안에 인과가 들어가야 해요. 이건 시각 결정이라 Lucy 몫이에요.

### 3-4. 장르를 섞었을 때의 관객 문제: 증거
- **Wildfrost(귀여운 그림 + 어려운 게임):** 출시 초 Steam 반응이 갈렸고 "너무 어렵다"는 리뷰가 많았다는 보도가 있어요. https://thetacomaledger.com/2023/05/08/review-new-indie-game-wildfrost-receives-unwarranted-mixed-reviews/ · https://www.taptap.io/post/5234225 지금은 91%(5,368건)까지 회복했어요. https://store.steampowered.com/app/1811990/ 교훈: **그림이 약속한 난이도와 실제 난이도가 다르면 첫 주 리뷰가 다쳐요.**
- **Cult of the Lamb(귀여움 + 컬트 호러 + 로그라이트 + 경영):** 첫 주 100만 장, 이후 450만 장 이상을 팔았어요. https://gamedeveloper.com/business/cult-of-the-lamb-has-sold-1-million-copies-in-a-week · https://www.kitguru.net/tech-news/mustafa-mahmoud/cult-of-the-lamb-surpasses-4-5-million-copies-sold/ Unity는 성공 요인을 "Creepy, cute, compelling"으로 정리했어요. https://unity.com/blog/games/recipe-behind-smash-hit-cult-of-the-lamb 혼합이 통한 이유는 **'귀여운데 섬뜩하다'는 대비 자체가 한 장면에 보이는 훅**이었기 때문으로 해석돼요(해석).
- **Moonstone Island(아늑함 + 크리처 + 덱):** 85% / 2,942건으로 무난하지만 대박은 아니에요. 리뷰 일부는 덱 전투 쪽 템포와 초반 진행을 아쉬워했어요. https://en.wikipedia.org/wiki/Moonstone_Island 마케팅은 '라이프심'을 주 장르로 세웠어요. https://store.steampowered.com/app/1658150/_/
- **아늑함 시장 자체는 커지고 있어요.** PC Gamer는 'cozy' 태그가 2024년 이후 250% 넘게 늘었다고 보도했어요. 동시에 "판매는 검증되지 않았다"는 요약 기사도 있어요. https://www.pcgamer.com/games/life-sim/are-we-in-the-cozy-gaming-gold-rush-era-cozy-has-grown-over-250-percent-on-steam-and-200-percent-in-my-inbox-since-2024/ · https://macmyths.com/are-we-in-the-cozy-gaming-gold-rush-era-steams-cozy-tag-is-surging-but-sales-are-unproven/

---

## 4. 시장 데이터: 덱빌더 로그라이트 2023~2026

- 2022년 분석 기사: 로그라이크 덱빌더가 "Steam 인디 장르 중 판매 성과 1위였는데 2019년 이후 출시작은 99개뿐"이라고 했어요. https://gameworldobserver.com/2022/04/22/roguelike-deckbuilders-beat-all-indie-genres-on-steam-in-terms-of-sales-but-only-99-such-titles-released-since-2019 (본문 미열람. 제목 기준)
- 2024년 4월에는 "Steam에 갑자기 로그라이크 덱빌더가 861개"라는 기사가 나왔어요. 2년 사이에 공급이 크게 늘었다는 신호예요. https://pinoybuzzanchor.blogspot.com/2024/04/why-there-are-861-roguelike.html (재게시본. 원 출처 [미확인])
- 실시간 태그 현황: SteamDB "Roguelike Deckbuilder" 태그 https://steamdb.info/tag/1091588 와 니치 리포트 https://www.steampageanalyzer.com/niches/roguelike-deckbuilder (열람 한도 때문에 수치 미확보)
- GameDiscoverCo는 "훌륭한 로그라이크 덱빌더가 왜 크지 못했나"를 다뤘어요. https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike (본문 미열람) 같은 매체는 위시리스트 전환율과 시장의 흥행작 쏠림도 다뤘어요. https://newsletter.gamediscover.co/p/revealed-new-data-on-steam-wishlist
- Zukowski는 분기별 출시 게임을 분석해요(2026 Q1). https://howtomarketagame.com/2026/05/14/2026-q1-games/ (미열람)
- **이번에 수집한 Steam 수치로 본 경향(직접 정리):**
  - 리뷰 수만 건대의 승자(StS 7.7만, Inscryption 7.7만, Balatro 10.5만, Monster Train 1.2만)는 모두 **동사 하나로 된 훅**이 있었어요.
  - 크리처 + 덱/주사위 하이브리드는 평점은 높지만(85~93%) 리뷰 규모는 수백~수천 건이에요(Dicefolk 872, Decktamer 915, Montabi 133, Aethermancer 1,563). 이 하위 장르의 천장은 아직 증명되지 않았어요.
  - 평점이 낮은 쪽(Nowhere Prophet 77%, Across the Obelisk 81%)은 **영구 손실과 파티 관리의 부담**이 큰 게임이었어요. 인과관계는 [미확인]이지만, 우리 '봉인' 설계에 참고할 만한 상관이에요.
- 리뷰 수에 30~60을 곱해 판매량을 추정하는 관행(Boxleiter 방식)이 있지만, 이번 보고서에서는 판매량으로 환산하지 않았어요 [미확인].

---

## 5. 우리 시스템에 직접 닿는 설계 교훈

### 5-1. 여러 캐릭터가 덱 하나를 나눠 쓸 때: "한 명이 쓰러지면 덱이 무너진다" 문제
- **Cobalt Core:** 선원 카드 풀을 섞고, 'Missing' 상태로 특정 선원 카드를 **일시적으로** 막아요 [미확인]. 영구 손실이 아니라 턴 단위 제약이라 덱이 망가지지 않아요. 우리 '봉인'을 "전투 동안" 또는 "N턴 동안"으로 잡는 근거가 돼요.
- **Monster Train:** 클랜 2개가 섞이지만 유닛이 죽어도 **카드는 덱에 남아요**(유닛 카드는 다음 전투에 돌아와요) [미확인]. 손실은 전투 안에서 끝나요.
- **Across the Obelisk:** 덱을 영웅별로 나눠서 한 명이 쓰러져도 나머지 덱은 멀쩡해요 [미확인]. 대신 덱 4개를 관리하는 부담이 커요. 평점 81%.
- **Wildfrost:** 동료가 전투에서 쓰러지면 **'부상' 상태로 다음 전투에서 약해진 채** 돌아와요 [미확인: 가이드 제목으로만 확인 https://gameranx.com/features/id/461863/article/wildfrost-how-do-injuries-work-tips-tricks-guide]. 처벌을 다음 전투 하나로 제한해요.
- **Nowhere Prophet / Decktamer:** 영구 손실이에요. 긴장은 크지만 평점은 상대적으로 낮거나(77%) 리뷰에서 운 요소가 비판받아요.
- **요약:** 처벌 범위를 "전투 내 → 다음 전투 → 런 전체 → 영구" 중 어디에 둘지가 핵심 다이얼이에요. 성공작들은 대부분 **전투 내나 다음 전투 한 번**에 두었어요.

### 5-2. 메타 육성이 런을 바꾸되 파워 인플레이션은 막는 법
- **Aethermancer:** 환생으로 강해지지만 성장은 'Worthiness'로 묶여 있고, 레벨업 선택지는 무작위로 떠요. 같은 몬스터도 런마다 다르게 커요. https://store.steampowered.com/app/2288470/ 메타는 **수치 상승보다 '선택지 풀 확장'** 쪽으로 기울어 있어요(4가지 경로, NPC 강화). https://www.destructoid.com/aethermancer-early-access-review/
- **Montabi:** 게임 오버로 **새 Montabi, 아이템, 장비가 해금**될 뿐 개체 수치는 이어지지 않아요. https://rpgamer.com/review/montabi-review/
- **Cassette Beasts:** 퓨전 강도가 동료와의 관계에 묶여 있어요. 성장이 '숫자'가 아니라 '조합 가능성'으로 나타나요. https://store.steampowered.com/app/1321440/
- **Moonstone Island:** 정령 진화 경로가 업데이트로 30개 추가됐어요. 육성 깊이를 콘텐츠로 늘린 방식이에요. https://en.wikipedia.org/wiki/Moonstone_Island
- **우리에게 주는 시사점(정리):** "정원에서 배운 카드"가 **덱 후보 풀**을 넓히는 데 그치고 런 시작 수치를 올리지 않으면, 파워 인플레이션 없이 "키우면 덱이 자란다"를 지킬 수 있어요. 반대로 스탯 스케일링(같은 카드, 다른 시전자)이 메타 성장과 직접 묶이면 인플레이션이 생겨요. 이건 설계 결정이라 선택지로만 남겨요.

### 5-3. 각성·변신 레퍼런스(싱크 → 각성)
- **Slay the Spire 왓처의 자세(Stance):** Wrath(주는 피해와 받는 피해 모두 2배), Calm(빠져나올 때 에너지 +2), Mantra를 10 쌓으면 Divinity(피해 3배, 다음 턴 시작에 해제) [미확인: 위키 링크만 확인 https://slaythespire.wiki.gg/wiki/Stance]. "게이지를 쌓아 → 짧게 폭발 → 자동 해제" 구조라 우리 싱크율 → 일시 각성과 같은 문법이에요. 위험(Wrath의 받는 피해 2배)을 붙여 공짜 버프를 피했어요.
- **Monster Train:** 챔피언이 런 중에 갈래 업그레이드를 골라요 [미확인]. 각성이라기보다 '런 내 진화'예요.
- **Wildfrost 참(Charm):** 카드에 붙이는 영구 수정자예요 [미확인]. 우리 '성격'이 덱 동작을 바꾸는 방식의 참고가 돼요(카드 문구 자체는 같고 붙는 수정자가 달라요).
- **Cassette Beasts 퓨전:** 두 형태를 합친 새 형태예요. 관계가 강도를 정해요. https://store.steampowered.com/app/1321440/ 'sync rate'라는 이름과 가장 가까운 레퍼런스예요.
- **Beastieball:** 관계가 새 능력과 콤보를 열어요. https://store.steampowered.com/app/1864950 정령 사이 싱크(3마리끼리)로 넓힐 때 참고가 돼요.

---

## 6. "이 게임이 진짜 무엇에 관한 것인가": 후보 프레이밍 (고르지 않음, Lucy 결정용)

> 아래 문장은 방향을 비교하려는 작업용 문구예요. 네이밍이나 카피 확정이 아니에요.

**후보 A. "카드가 아니라 정령을 키우는 덱빌더"(육성 → 덱 인과가 주인공)**
- 한 줄: 덱을 직접 고르지 않아요. 정령을 키우면 덱은 그 결과로 자라요.
- 수요 근거: Aethermancer(런 사이 성장, 93%), Montabi(크리처 → 덱, 93%), Cassette Beasts(관계 → 전투력, 95%).
- 위험: Montabi, Aethermancer와 정면으로 비교돼요. Montabi는 바로 이 '육성' 축을 서구 반응 때문에 접었어요. 메타 성장이 수치로 새어 나가면 파워 인플레이션이 생겨요. 인과가 두 화면에 걸쳐 있어 스크린샷 한 장에 담기 어려워요.

**후보 B. "세 정령의 조합이 곧 빌드"(파티 구성 퍼즐이 주인공)**
- 한 줄: 누구를 데려가느냐가 이번 런의 덱이에요. 같은 카드도 누가 쓰느냐에 따라 달라요.
- 수요 근거: Monster Train(클랜 2개 조합, 96%, 2편 50만 장), Cobalt Core(선원 3명, 96%).
- 위험: 육성과 정원의 존재 이유가 약해져요(Cobalt Core처럼 고르기만 하면 되니까요). 장르 앵커는 단단하지만 훅이 "Cobalt Core의 크리처판"으로 읽힐 수 있어요.

**후보 C. "키운 정령의 성격을 알아 가는 이야기"(관계·발견이 주인공)**
- 한 줄: 진화할 때마다 이 아이가 어떤 성격인지 드러나고, 그 성격대로 싸워요.
- 수요 근거: Beastieball(관계 → 능력, 97%), Cassette Beasts(유대 → 퓨전, 95%), Moonstone Island와 Ooblets(아늑한 크리처, 85~91%).
- 위험: 서사와 성격 콘텐츠의 분량이 1인 개발에 무거워요. 아늑함과 로그라이트 관객이 갈라질 수 있어요(Zukowski 장르 섞기 경고 [미확인], Wildfrost 난이도 반발). 주 장르 앵커를 무엇으로 둘지 따로 정해야 해요.

**후보 D. "싱크가 차오르는 순간, 정령이 깨어나요"(전투 클라이맥스가 주인공)**
- 한 줄: 약점을 찔러 실드를 깨고, 싱크를 채워 정령을 깨워 적의 주문을 끊어요.
- 수요 근거: Slay the Spire 왓처의 Divinity 구조(게이지 → 폭발) [미확인], Cassette Beasts 변신/퓨전, Shogun Showdown이나 Cobalt Core처럼 '한 장면에 보이는 전술 동사'가 높은 평점을 받았어요(96%).
- 위험: 브레이크와 각성 문법은 익숙해서 훅보다는 앵커에 가까워요. 육성과 정원이 전투 훅과 따로 놀 수 있어요. 대신 스크린샷 한 장(각성 컷인 + 끊긴 시전 바)으로는 가장 잘 읽혀요.

**공통 메모(선택과 무관):** 어떤 프레이밍을 고르든, 경쟁작 중 우리만 가진 것으로 확인된 조각은 **"같은 카드, 다른 시전자"**와 **"진화 때 드러나는 성격이 덱 동작을 바꾼다"** 두 개예요. 이 두 조각을 어느 프레이밍에서 앞세울지가 실질적인 차별화 결정이에요.

---

## 부록: 다음 라운드에서 본문을 열어 확인할 것
1. Ryan Clark 기고 본문: 훅 판정 기준 원문 https://www.gamedeveloper.com/business/what-makes-an-indie-hit-how-to-choose-the-right-design
2. Zukowski "Maybe mixing genres is a bad idea" 본문 https://howtomarketagame.com/2023/02/22/editorial-maybe-mixing-genres-is-a-bad-idea/
3. GameDiscoverCo "Why did this excellent roguelike deckbuilder fail to scale?" https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike
4. 덱빌더 태그 수와 연도별 출시 수 https://steamdb.info/tag/1091588 · https://www.steampageanalyzer.com/niches/roguelike-deckbuilder
5. Monster Train GDC 포스트모템 https://www.gdcvault.com/play/1027281/contactUs
6. Cobalt Core 'Missing', Wildfrost 부상, ATO 사망 처리의 정확한 규칙(위키)
