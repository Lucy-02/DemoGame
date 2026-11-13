# A. 메타 진행 사례 조사: 하나로 시작, 파티 늘리기, 해금 리듬, 분기 진화, 영구 성장과 난이도

작성일: 2026-11-10. 대상: 정령 3마리 파티 덱빌더 로그라이트의 런 밖 진행(0021 · 0027 · 0032 · 0045 · 0052 전제).
이 문서는 **사례 조사**예요. 추천안을 정하지 않고, UI 배치·색·이름도 제안하지 않아요.

## 읽기 전에 알아 둘 점 (한계)

- **표기:** **[출처: URL]**는 링크를 직접 열어 확인한 내용이에요. **[미검증]**은 기억이나 통념이라 결정 근거로 쓰기 전에 다시 확인해야 해요. **[계산]**은 확인한 수치에서 제가 산술로 옮긴 값이에요.
- **웹 조회 상태:** 한도가 바닥나지는 않았어요. 다만 여러 사이트가 막혔어요(Bulbapedia, slaythespire.wiki.gg, touchtapplay, pokemoncoders, progameguides 일부는 `client_error`). 그래서 아래 항목은 대부분 **[미검증]**으로 남았어요.
  - Slay the Spire 1 캐릭터 해금 조건 (점수 문턱만 확인)
  - Monster Train **1편**의 클랜 해금 순서·조건 (2편은 일부 확인)
  - Cobalt Core 크루 7명의 개별 해금 조건 (8번째 Cat만 확인)
  - PokéRogue 새 계정의 기본 스타터 목록과 종별 비용표
  - Chrono Ark 동료 영입 시점과 시작 인원
  - Slice & Dice 레벨업(영웅 교체) 방식과 영웅 해금
  - Darkest Dungeon 1의 "경험 있는 신병" 업그레이드, DD2 제단의 양초 비용
  - Fire Emblem 계열의 벤치 경험 분배, Siralim, Coromon, Temtem, Backpack Hero, Ratropolis, Astrea, Roguebook, Gordian Quest의 해금
  - 질문 7의 "적 강도를 파티 크기에 맞추는 방식": 확인한 사례가 거의 없어요(7절 참고)
- **기존 조사와 겹치는 곳은 다시 조사하지 않았어요.** 가리키기만 해요.
  - A-deckbuilders(브랜치 `claude/project-thread-tx53pr`, `docs/archive/research/out-of-run/A-deckbuilders.md`): StS2 "포기해도 런 종료로 쳐서 해금", Monster Train "해금 카드는 보상 풀에만 들어가고 등장 보장 없음", Kaycee's Mod "승리 1회 = 해금 1개", Wildfrost "건물마다 다음 과제 하나만 공개", Cobalt Core 크루 3명 선택과 랜덤 버튼
  - B-hub-raising(같은 브랜치): Cassette Beasts 스타터(질문으로 결정), Monster Sanctuary 패밀리어 4택, 리마스터·시프트의 되돌림 여부, DD2 시작 파티
  - R3(`docs/archive/research/core-design/R3-genre-hooks-competitors.md`): Aethermancer · Montabi · Decktamer · Monster Train · Cobalt Core · Across the Obelisk 개요, 5-2 "메타 육성이 런을 바꾸되 인플레이션을 막는 법"

---

## 0. 한눈에 (핵심 발견 8개)

1. **"하나로 시작"하는 크리처·파티 로그라이트는 대부분 빈 자리를 런 안에서 채워요.** Aethermancer는 스타터 하나로 출발해 런 중에 몬스터를 잡아 파티를 채우고, Wildfrost는 리더 한 장으로 출발해 런 중에 동료를 "3명 중 1명" 골라 데려와요. 런 밖에서만 동료를 얻고 첫 판을 빈 자리로 떠나는 사례는 이번 조사에서 확인하지 못했어요. 우리 0052("빈 줄은 비워 둠, 동료는 판 밖 경로로")는 장르 안에서 드문 쪽이에요.
2. **완전 무작위 1마리보다 "무작위 후보 몇 중 고르기"가 흔해요.** Wildfrost는 리더 9명(부족당 3명)의 능력치·능력을 무작위로 만들고 그중에서 골라요. Cassette Beasts는 생물을 보여 주지 않고 질문 하나로 정해요. 순수 무작위 하나를 받는 사례는 확인하지 못했어요.
3. **캐릭터 해금 조건은 크게 넷이에요.** (가) 판 끝내기(StS2: 포기해도 됨, 5명이 4판 만에 다 열림) (나) 누적 행동(Monster Train 2: "잃은 체력 300 회복", Wildfrost: 적 50/100 처치) (다) 런 중 이벤트 퀘스트(Across the Obelisk: 16명 중 12명이 막을 넘나드는 퀘스트로 열림) (라) 메타 화폐(Hades 무기: 열쇠 총 24개, DD2 양초). 첫 몇 판 안에 두 번째 캐릭터가 열리는 리듬이 공통이에요.
4. **분기 진화 조건이 "이상한 플레이"를 만드는 대표 사례는 사용 횟수형이에요.** 포켓몬 SV·아르세우스의 "분노의 주먹 20회", "같이 가기로 1000걸음", "반동 피해 294 받기(기절 금지)"가 그래요. 디지몬 월드 1은 능력치·체중·케어 미스·보너스 4개 중 3개를 맞춰야 하고, 공략 사이트도 "안내 없이는 막막하다"고 써요.
5. **"배운 기술이 진화를 연다"는 조건은 본가 포켓몬에 이미 있어요.** 님피아(요정 기술을 알고 레벨업), 다투곰·노고고치 계열의 "특정 기술을 알고 레벨업"이 그래요. Cassette Beasts는 "질문에 답해 고르기 + 스티커(장착물) + 시간대"를 섞고, **같은 종을 다시 녹음하면 못 간 갈래를 얻을 수 있어요.**
6. **영구 파워가 큰 게임은 난이도 장치를 따로 둬요.** Hades 거울은 죽음 저항 3회, 체력 +50, 뒤치기 피해 +50% 같은 큰 수치를 주지만, 별도로 God Mode(피해 감소 20%에서 시작, 죽을 때마다 +2%, 상한 80%)와 열기(역방향 난이도)를 둬요. Rogue Legacy 개발자는 "갈 필요가 없게 만들었는데도 많은 플레이어가 갈아야 한다고 느꼈다"고 말했어요.
7. **안 데려간 동료의 경험 문제는 "공유 경험"과 "따라잡기" 두 갈래로 풀어요.** 포켓몬 6~7세대 학습장치는 안 싸운 포켓몬에게 경험 50%를 주고(Let's Go는 늘 켜짐), Fire Emblem 창염·새벽은 보너스 경험을 거점에서 아무에게나 나눠 줘요. 수집형 NIKKE는 약한 캐릭터 레벨을 강한 캐릭터에 맞추는 장치를 둬요.
8. **"솔로로 굴러가는 캐릭터"와 "파티 크기에 맞춘 적 강도"를 직접 다룬 설계 글은 거의 찾지 못했어요.** 확인한 장치는 반대 방향이에요. Chrono Ark는 같은 캐릭터 스킬을 연달아 쓰면 비용이 올라 한 명에 기대는 걸 막고, Wildfrost는 리더가 죽으면 판이 끝나 "지켜야 하는 하나"로 만들어요.

---

## 1. 무작위 스타터와 "하나로 시작"

### 이 질문이 다루는 상황
새 게임을 켰을 때 처음 받는 캐릭터·몬스터가 하나뿐이거나 무작위일 때, (가) 무엇을 기준으로 시작 후보에 넣는지 (나) 마음에 들지 않을 때 어떻게 달래는지 (다) 두 번째 동료를 언제 주는지예요.

### 사례 표

| 게임 | 시작 방식 | 다시 뽑기·선택 | 두 번째 동료가 오는 시점 | 근거 |
|---|---|---|---|---|
| Aethermancer | 새 저장마다 스타터 4종 중 **하나를 골라** 시작. 스타터는 "매우 희귀하고 꽤 강하다" | 고름(무작위 아님) | **런 중에 잡아요.** 바이옴마다 잡을 수 있는 몬스터 약 8종, 한 판에 다 보이진 않음 | [출처: https://www.destructoid.com/aethermancer-early-access-review/] 스타터 이름 Jotunn·Nixe·Minokawa·Cherufe, 허브 NPC Lily가 "스타터 풀을 넓힌다" [출처: https://bonus-action.com/guides/aethermancer-guide-best-monsters-teams-starters/] |
| Wildfrost | 판마다 리더 한 장. 부족 3개 × 후보 3명 = 9명, **이름·능력·능력치·외형이 무작위 생성** | 9명 중 고름. 다시 뽑기 여부는 확인 못 함 | **런 중** "얼어붙은 여행자" 노드에서 3명을 풀어 주고 그중 1명을 영입. 원치 않으면 바로 내보낼 수 있음 | [출처: https://wildfrostwiki.com/Leaders], [출처: https://wildfrostwiki.com/Companions] |
| Cassette Beasts | 동료가 "sweet or spooky"를 묻고 답에 따라 Candevil 또는 Bansheep. 고를 때 생물을 못 봄 | 질문 답으로 간접 선택 | 필드에서 녹음(포획)으로 바로 늘어남 [미검증] | B-hub-raising [출처: CB-starter] 재인용 |
| Monster Sanctuary | 스펙트럴 패밀리어 4종(독수리·사자·두꺼비·늑대) 중 하나 | 고름 | 필드에서 알·몬스터 획득 [미검증] | B-hub-raising [출처: MS-starters] 재인용 |
| PokéRogue | 클래식 모드는 **스타터 포인트 10점** 예산 안에서 여러 마리를 골라요. 종마다 비용이 다르고 사탕으로 비용을 영구히 낮춰요(예: 리자몽 3점 → 1점, 꼬렛 1점 → 0.25점, 최대 두 번) | 고름(예산형) | 런 중 포획한 종은 사탕이 쌓이고, 등록된 스타터는 이후 스타터로 고를 수 있음 [미검증: 등록 조건]. 알 가챠(바우처)로도 얻음 | 10점·비용 예시: [출처: https://pokerogue-wiki.com/en/wiki/items/candies/] (한 플레이어의 글, 공식 아님). 사탕 얻는 법·최대 두 번 감소: [출처: https://pol1.lr.ggtyler.dev/r/pokerogue/comments/1czask1/faq_and_comprehensive_guide]. 새 계정 기본 스타터 목록 [미검증] |
| Slay the Spire 2 | 아이언클래드 하나만 열림 | 고를 게 없음 | 아이언클래드로 **한 판만 끝내면**(포기 포함) 다음 캐릭터. 5명이 차례로 열림 | [출처: https://primagames.com/tips/how-to-unlock-each-character-in-slay-the-spire-2] |
| Hades | 스틱스 검 하나 | 고를 게 없음 | 무기 해금은 크토니안 열쇠: 활 1, 방패 3, 창 4, 주먹 8(앞 넷 뒤), 레일 8(전부 뒤), 총 24개 | [출처: https://hades.fandom.com/wiki/Infernal_Arms] |
| Dicey Dungeons | 전사부터 시작. 전사 → 도적 → 로봇 → 발명가 → 마녀 → 광대 순서. 캐릭터마다 에피소드 6개(6번째는 보너스 라운드) | 고를 게 없음 | 앞 캐릭터의 에피소드를 깨면 다음 캐릭터 [미검증: 정확한 조건]. 광대는 "보너스 라운드 6개 완료" | [출처: https://steamcommunity.com/app/861540/discussions/0/1643171537289009349] (2019년 스레드, 오래됐을 수 있음) |

### 풀이
- **시작 후보의 기준을 공개한 개발자 글은 찾지 못했어요.** 확인된 것은 결과뿐이에요. Aethermancer는 스타터를 "희귀하고 강한" 몬스터로 줬다고 리뷰가 적었어요. StS2·Hades·Dicey Dungeons처럼 순서가 고정된 게임은 첫 캐릭터가 늘 같아서, 첫 캐릭터를 "가장 단순하고 혼자 해결하는" 키트로 만들었다는 통념이 있어요 [미검증]. (예: StS1 아이언클래드는 전투가 끝날 때마다 체력 6을 회복하는 시작 유물을 가져요 [미검증]. 덱이 망가져도 다음 전투까지 버틸 여유를 주는 장치로 읽혀요.)
- **원치 않는 스타터에 대한 완화책은 세 가지로 보여요.**
  1. **무작위 후보 중 고르기:** Wildfrost는 리더를 무작위로 만들되 9명 중에서 고르게 해요. "무작위"의 신선함과 "내가 골랐다"는 납득을 같이 가져가요.
  2. **빠른 두 번째 획득:** Aethermancer·Wildfrost는 첫 판 안에서 동료가 생겨요. StS2는 한 판(포기 포함)이면 두 번째 캐릭터가 열려요.
  3. **결과를 숨긴 선택:** Cassette Beasts는 생물을 보여 주지 않고 성향 질문으로 정해요. 고른 느낌은 주지만 "좋은 걸 놓쳤다"는 비교를 막아요.
- **순수 무작위 1개 + 다시 뽑기 금지**를 쓰는 확인된 사례는 없었어요. 이 조합에 대한 플레이어 반응 자료도 찾지 못했어요.

---

## 2. 파티원을 늘리는 경로

### 이 질문이 다루는 상황
파티 자리(우리는 3)가 있는데 가진 캐릭터가 그보다 적을 때, 동료를 (가) 그 판 안에서 임시로 모으는지 (나) 판 밖에서 영구히 여는지 (다) 둘 다인지예요.

### 사례 표

| 게임 | 방식 | 파티 크기 | 보유가 자리보다 적을 때 | 근거 |
|---|---|---|---|---|
| Wildfrost | (다) 둘 다. 판 안: 얼어붙은 여행자에서 3중 1 영입. 판 밖: 온천에서 동료 6명을 과제로 해금(예: "참 10개 장착", "아군 50 소환") → 이후 판의 영입 후보에 들어감 | 보드 칸 수만큼 [미검증] | 첫 판은 리더 + 시작 덱으로 출발하고 판 안에서 채워요 | 영입: [출처: https://wildfrostwiki.com/Companions], 온천 6명·과제: [출처: https://gameranx.com/features/id/464720/article/wildfrost-how-to-unlock-every-companion-at-the-hot-spring-unlock-guide/] |
| Aethermancer | (다). 판 안에서 포획, 판 밖은 NPC가 스타터 풀·경로를 넓힘 | 3 (R3) | 스타터 하나로 출발해 잡아서 채움 | [출처: https://www.destructoid.com/aethermancer-early-access-review/] |
| Across the Obelisk | (나)에 가까움. 영웅 16명 중 **4명이 시작**(Magnus·Andrin·Evelyn·Reginald), **12명은 런 중 퀘스트로 영구 해금.** 퀘스트는 1막에서 받고 2·3막 포털 선택을 거쳐 완료(예: Grukli는 1막 작은 호수에서 큰 물고기를 얻어 녹색 포털 너머 폭포에서 건넴) | 4 고정 | 처음부터 4명이 있어서 부족 문제가 없음 | [출처: https://kosgames.com/across-the-obelisk-how-to-unlock-all-characters-version-1-0-29665/] |
| Darkest Dungeon 2 | (다). 고백 모드: 시작 영웅 4명(병사·노상강도·도굴꾼·역병의사), 나머지는 제단(양초)에서 해금. 판 중에는 영웅이 죽으면 다음 여관에서 대체 영웅 합류 | 4 | 처음부터 4명 | [출처: https://darkestdungeon.wiki.gg/wiki/Heroes_(Darkest_Dungeon_II)] |
| Monster Train 2 | (나). 클랜 해금. 시작 클랜 2개(Banished·Pyreborne), 나머지는 누적 과제(예: Lazarus League "장비 100번 장착"). 1편 클랜은 "파이어 하트 6개 해금 → Hellhorned", Awoken "잃은 체력 300 회복", Stygian Guard "한 턴에 주문 5개를 5번", Umbra "방 수용량 20번 늘리기", Melting Remnant "유닛 50번 되살리기". 승리 불필요 | 주 클랜 + 보조 클랜 = 2 | 처음부터 2개가 있어 자리가 다 참 | [출처: https://www.destructoid.com/how-to-unlock-the-lazarus-league-in-monster-train-2/], [출처: https://parrot-spinach-nd46.squarespace.com/articles/how-to-unlock-the-original-old-clans-in-monster-train-2] |
| Cobalt Core | (나). 크루 일부가 잠겨 있고, 8번째 Cat은 전원의 기억 3개씩을 모은 뒤 엔딩에서 열림 | 3 | "처음 셋"(Dizzy·Riggs·하나 더)이 있어 자리가 다 참 | Cat: [출처: https://gamepressure.com/newsroom/how-to-unlock-8th-character-in-cobalt-core/z66547], 처음 셋: [출처: https://steamcommunity.com/app/2179850/discussions/0/4143942846476783702]. 나머지 해금 조건 [미검증] |
| Chrono Ark | (다). 시작 둘을 고르고(그 둘만 판에 보장), 나머지는 판 중 "더 작은 후보" 중에서 드래프트. 판 밖에서 조사원별 조건으로 해금 | 최대 4 | 둘로 출발해 판 안에서 채움 | 시작 둘·드래프트: [출처: https://laughica.pages.dev/posts/beginner-tips-and-tricks-for-chrono-ark], 최대 4: [출처: https://game8.co/articles/reviews/chrono-ark-gameplay-and-story-info]. 영입 시점 [미검증] |
| Slice & Dice | 매 판 5명. 전투 뒤 "영웅 레벨업 또는 아이템" | 5 | [미검증] | [출처: https://store.steampowered.com/app/1775490/Slice__Dice] |
| PokéRogue | (다). 포인트 예산으로 시작 파티, 런 중 포획으로 6마리까지 [미검증: 6] | 6 | 예산이 작으면 적게 데리고 시작하고 포획으로 채움 | 1절 출처 |
| Gordian Quest | 영웅 10명 중 3명 파티 | 3 | 해금 방식 [미검증] | [출처: https://store.steampowered.com/app/981430?l=english] |

### 풀이
- **(가) 판 안에서 모으기**의 장점: 첫 판부터 파티 전투의 재미가 다 보이고, "이번 판의 동료"가 매번 달라 재플레이성이 생겨요(Wildfrost, Chrono Ark). 단점: 동료가 판이 끝나면 사라져서 "키운다"는 감각이 약해요. 우리 필러 2("키우면 강해지고, 달라진다")와는 결이 달라요.
- **(나) 판 밖에서 영구히 열기**의 장점: 해금 하나하나가 큰 사건이 되고 성장 대상이 남아요(MT 클랜, AtO 영웅). 단점: 확인한 게임은 모두 **시작 때 이미 자리를 다 채울 만큼 줘요**(AtO 4/4, DD2 4/4, MT2 2/2, Cobalt Core 3/3). "자리가 남는 초반"을 판 밖 해금만으로 버티는 사례는 찾지 못했어요.
- **(다) 둘 다**는 크리처 계열(Aethermancer, PokéRogue, Wildfrost)에서 흔해요. 판 밖 해금은 "판 안 후보 풀"을 넓히는 데 쓰여요(Wildfrost 온천 동료 → 이후 영입 후보, Aethermancer 스타터 풀).
- **AtO의 "런 중 퀘스트 → 영구 해금"**은 우리 "막 보스를 가라앉히면 정원에 깃듦"(0032)과 같은 계열이에요. 차이는 AtO가 1막에서 퀘스트를 받고 **경로 선택(포털)**까지 맞춰야 한다는 점이에요. 공략 글이 따로 있을 만큼 조건이 길어요.
- **빈 자리 처리**: DD2는 판 중 죽은 영웅 자리를 "다음 여관"에서 대체 영웅으로 메우고, 왕국 모드에선 영웅이 아닌 임시 민병대도 있어요 [출처: https://darkestdungeon.wiki.gg/wiki/Heroes_(Darkest_Dungeon_II)]. "임시 동료" 개념의 확인된 사례예요.

---

## 3. 캐릭터 해금 조건의 유형과 리듬

### 사례 표 (조건 유형별)

| 유형 | 게임 · 구체 조건 | 첫 몇 판 안에 열리는 수 | 전체를 다 여는 데 | 근거 |
|---|---|---|---|---|
| 판 끝내기(패배·포기 포함) | StS2: 앞 캐릭터로 한 판 → 다음 캐릭터 | 4판이면 5명 전원 [계산] | 4판 [계산] | [출처: https://primagames.com/tips/how-to-unlock-each-character-in-slay-the-spire-2] |
| 누적 점수 | StS1: 캐릭터별 누적 점수 300 / 750 / 1000 / 1500 / 2000에서 카드·유물·캐릭터·열쇠가 열림 | 300점 단계에서 캐릭터가 열리는 경우가 있음 | [미검증] | [출처: https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/] |
| 누적 행동 | MT2: Awoken "잃은 체력 300 회복" 등(2절 표). 승리 불필요, 진행도는 잠긴 클랜에 마우스를 올리면 보임 | [미검증] | [미검증] | [출처: https://parrot-spinach-nd46.squarespace.com/articles/how-to-unlock-the-original-old-clans-in-monster-train-2] |
| 누적 처치 | Wildfrost 부족: Shademancers 적 50 처치(다른 출처는 100), Clunkmasters 100(작성자 기억) | 두 번째 부족은 몇 판 안 [미검증] | [미검증] | 50/100: [출처: https://cardgamer.com/guides/how-to-unlock-tribes-in-wildfrost], 100: [출처: https://wildfrostwiki.com/Tribes] (출처끼리 다름) |
| 업적·과제형 | Wildfrost 온천 동료 6명: "참 10개 장착", "아군에게 피해 10", "4연속 처치 콤보", "반격으로 20 처치", "아군 50 소환", "클렁커에 스크랩 10" | 온천 자체가 "한 전투에서 블링 50" 뒤에 열림 | [미검증] | [출처: https://gameranx.com/features/id/464720/article/wildfrost-how-to-unlock-every-companion-at-the-hot-spring-unlock-guide/] |
| 런 중 만남·퀘스트 | AtO 12명: 1막에서 퀘스트를 받고 포털 경로를 맞춰 완료 | 판마다 많아야 한두 명 [추정, 미검증] | [미검증] | [출처: https://kosgames.com/across-the-obelisk-how-to-unlock-all-characters-version-1-0-29665/] |
| 메타 화폐 | Hades 무기: 열쇠 총 24개. DD2: 제단 양초("주로 원정을 성공해야" 얻음) | [미검증] | [미검증] | [출처: https://hades.fandom.com/wiki/Infernal_Arms], [출처: https://darkestdungeon.wiki.gg/wiki/Altar_of_Hope] |
| 엔딩·수집 완성 | Cobalt Core Cat: 전원 기억 3개씩 → 엔딩 | 마지막 | 전원 기억 수집 | [출처: https://gamepressure.com/newsroom/how-to-unlock-8th-character-in-cobalt-core/z66547] |
| 보스 처치 | Kaycee's Mod: 레시를 이길 때마다 하나(A-deckbuilders) | 승리 1회 = 1개 | — | A-deckbuilders 재인용 |

### 풀이
- **"첫 3시간"의 직접 수치는 찾지 못했어요.** 간접 수치로는 StS2가 4판이면 전원(5명), AtO는 시작 4명 + 런 퀘스트, Wildfrost는 첫 판(튜토리얼) 뒤 부족의 집이 열리고 50~100 처치에서 두 번째 부족이 와요.
- **15명 안팎 로스터:** AtO는 16명 중 4명 시작, 12명 해금이에요. DD2 위키 표에 보이는 영웅 직업은 15개이고 고백 모드는 4명으로 시작해요. 둘 다 시작 인원이 파티 크기(4)와 같아요.
- **누적 행동형의 장점과 문제:** MT2·Wildfrost는 "그 클랜/부족이 잘하는 행동"을 해금 조건으로 걸어 해금 전에 맛보기를 시켜요(Awoken = 회복, Melting Remnant = 되살리기 [미검증: 클랜 특성과의 대응]). 반대로 Balatro는 일부 해금 조건이 승리와 충돌해 승리 뒤 따로 노리게 된다고 해요(A-deckbuilders 재인용).
- **리듬 장치:** 런당 해금 1개 고정(Kaycee's Mod), 건물당 다음 과제 하나만 공개(Wildfrost)는 A-deckbuilders에 있어요.

---

## 4. 분기 진화 조건 설계

### 사례 표 (조건 유형별)

| 조건 유형 | 게임 · 사례 | 확인된 반응·문제 | 못 간 갈래 얻기 | 근거 |
|---|---|---|---|---|
| 능력치·케어(복합 숨은 조건) | 디지몬 월드 1: 능력치·체중·케어 미스·보너스 중 **3/4 충족**. 예: 마메몬은 케어 미스 15회 **이상**, 메탈마메몬은 15회 **이하**. 보너스 조건은 전투 10~100회, 기술 25~40개, 훈육 60%/95%, 행복 90%/95% 등. 똥을 방치하면 스카몬이 됨 | 공략 사이트가 "게임 안 안내가 없어 신규에게 막막하다", "쓸모없는 누메몬·스카몬이 되기 쉽다", "나쁜 디지몬을 버리기 어렵다"고 씀 | 다음 세대로 다시 키움 [미검증] | [출처: https://almarsguides.com/retro/walkthroughs/PS1/Games/DigimonWorld/Misc/RaisingDigimon/] |
| 숨은 수치·우연 | 몬스터 랜처: 수명·피로·스트레스가 숫자로 안 보이고, 합성은 사실상 공략이 필요. 일부 종은 특정 주·스트레스 조건 등 | "숨겨진 게 너무 많다"는 정리 | 합성으로 다시 | [출처: https://www.tvtropes.org/pmwiki/pmwiki.php/GuideDangIt/MonsterRancher] |
| 아이템 · 시간 · 배운 기술 | 이브이(SV): 불꽃·물·천둥·얼음·리프의 돌 / 낮·밤 + 높은 친밀도 / **요정 기술을 알고 레벨업(님피아)** | — | 이브이를 여러 마리 키움(같은 종 여러 마리 가능) [미검증: 상식 수준] | [출처: https://videogameschronicle.com/guide/eevee-evolution-all-eeveelution-methods-pokemon-scarlet-and-violet] |
| 배운 기술 | SV: 키링키(트윈빔을 알고 레벨업), 노고고치(드릴롤라를 알고 레벨업), 꼬시레(독침천발을 알고) | — | 같은 종 여럿 | [출처: https://serebii.net/scarletviolet/evolution.shtml] |
| 사용 횟수·행동량 | SV: 성원숭은 "분노의 주먹 20회 사용 후 레벨업", 빠모트 등은 "같이 가기로 한 번에 1000걸음", 타부자고는 "코인 999개". 아르세우스: 배쓰나이 흰줄은 "**기절하지 않고 반동 피해 294**" | 기사 작성자가 성원숭 방식이 "다소 실망스럽다"고 평함(작성자 의견). 플레이어 반응 통계는 못 찾음 | 같은 종 여럿 | [출처: https://serebii.net/scarletviolet/evolution.shtml], [출처: https://www.pockettactics.com/how-to-evolve-basculin], [출처: https://gamerant.com/pokemon-scarlet-violet-primeape-evolution-how-annihilape-faint-lore/] |
| 질문으로 고르기 · 장착물 · 시간대 | Cassette Beasts: 별 5개가 되면 쉬는 곳에서 리마스터. Masquerattle은 질문 "우아함/잔혹함"으로 갈림. 바람 스티커를 붙이면 질문 없이 다른 형태. Dominoth는 낮/밤으로 갈림. **분기는 되돌릴 수 없음** | 공략도 되돌릴 수 없음을 강조(B-hub-raising) | **다시 녹음**해서 다르게 답하면 됨. 못 간 형태 상당수는 후반에 직접 녹음 가능 | [출처: https://www.thegamer.com/cassette-beasts-evolution-guide/] |
| 아이템 선택, 되돌림 가능 | Monster Sanctuary: Sun Palace 뒤 빛/어둠 시프트. 시프트 돌로 정하고, 전환 돌로 빛↔어둠, 해제 돌로 원래대로. 빛 패시브 18종, 어둠 15종. 전투마다 25% 확률로 시프트 개체가 나오고 다음 개체는 반대 시프트. "시프트 알이 시프트 돌보다 훨씬 구하기 쉽다" | 되돌릴 수 있어 부담이 적음 | 돌로 전환 또는 시프트 알 | [출처: https://monster-sanctuary.fandom.com/wiki/Monster_Shifting] |
| 레벨 문턱 + 두 갈래 선택 | Montabi: Lv5·Lv10에 진화하며 두 갈래 중 하나(R3) | — | — | R3 재인용 |

### 풀이
- **"일부러 이상하게 플레이하게 만드는" 문제는 사용 횟수형에서 가장 분명해요.** "분노의 주먹 20회"나 "반동 294"는 평소 싸움과 상관없이 그 행동을 반복하게 만들어요. 우리 0027이 "전투에서 한 일"을 갈래 조건에서 뺀 이유와 같은 위험이에요. 반대로 0045의 각성체 자람 조건(역할대로 하면 차는 누적량)은 "그 정령이 원래 하는 일"이라 MT2 클랜 해금 과제(그 클랜이 잘하는 행동)와 결이 같아요.
- **"배운 기술이 갈래를 연다"는 조건은 숨은 수치형보다 덜 불투명해요.** 님피아·키링키처럼 "이 기술을 알고 있으면"은 조건이 한 줄이고 확인하기 쉬워요. 디지몬·몬스터 랜처처럼 조건이 여럿이고 안 보이면 "막막하다"는 반응이 공략 사이트에 남아요.
- **못 간 갈래를 얻는 방법은 세 가지예요.** (1) 같은 종을 하나 더 키우기(포켓몬·Cassette Beasts 재녹음) (2) 되돌리기 아이템(Monster Sanctuary 돌) (3) 다음 세대로 다시(디지몬·몬스터 랜처). 우리 규칙은 정령 줄당 한 개체이고 되돌릴 수 없어서(0052 5번) 셋 중 어느 것도 아직 없어요.
- **Loop Hero 등 "런 중 선택이 영구 형태를 결정"하는 로그라이트 사례는 이번에 확인하지 못했어요** [미검증].

---

## 5. 영구 성장과 난이도

### 이 질문이 다루는 상황
판 밖에서 영구히 세지는 장치가 있으면 같은 판이 점점 쉬워져요. 그때 (가) 얼마나 세지는지 (나) "이기려면 갈아야 한다"는 불만을 어떻게 피하는지 (다) 쉬워진 만큼 다시 어렵게 만드는 장치가 무엇인지예요.

### 사례 표

| 게임 | 영구 파워 종류 | 확인된 수치 | 난이도 장치 | 근거 |
|---|---|---|---|---|
| Hades | 거울(재능 24종, 빨강/초록 중 하나만 켜짐) | 뒤치기 피해 +10%/단계 최대 +50%, 체력 +5/단계 최대 +50, **죽음 저항 3회(체력 50%로 부활)**, 방마다 부활 1회(30%) 대안, 시작 오볼 최대 +100, 희귀 은총 확률 최대 +40% 등. 빨강↔초록 전환은 무료, 전체 환불은 열쇠 1개 | God Mode: 피해 감소 20%에서 시작, 죽을 때마다 +2%, 상한 80%. 열기(역방향 난이도) [미검증: 열기 수치] | 거울: [출처: https://hades.fandom.com/wiki/Mirror_of_Night], God Mode: [출처: https://inverse.com/gaming/hades-god-mode-interview] |
| Rogue Legacy 1·2 | 영구 업그레이드가 많음 | — | 2편은 House Rules(난이도 조절) [미검증: 상세] | 개발자 Teddy Lee: "Rogue Legacy의 요점은 갈 필요가 없다는 것"이었는데 많은 플레이어가 갈아야 한다고 느끼거나 갈고 싶어 했다. "Rogue Legacy는 Dead Cells의 수평적 진행에 비해 영구 진행이 아주 많다." [출처: https://www.siliconera.com/rogue-legacy-2-interview/] |
| Vampire Survivors | 파워업(골드로 구매) | 힘(Might): 단계당 피해 +5%, 5단계 최대 +25%, 첫 비용 200. 가격은 그 파워업 구매 수 **와 전체 구매 수**에 따라 오름(표에서 순서상 660) | [미검증] | [출처: https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=5168] |
| Dead Cells | 셀로 영구 업그레이드 | 회복 플라스크 I~IV(+1, +1, +2(300셀), +3(700셀)), 금 보존 6,000~15,000, 재활용 7%→15%. 무기·능력은 청사진을 찾아 해금 | 보스 셀(역방향 난이도) [미검증: 상세] | [출처: https://www.gamepressure.com/dead-cells/what-uprgrades-should-be-unlocked-first/z0b356] |
| Across the Obelisk | 영웅별 퍽(perk) | 영웅당 50포인트로 보임(가이드·댓글), 예: 체력 +8, 저항 35% 퍽 | 광기(Madness) 단계. 가이드는 광기 6~10 기준으로 추천 | [출처: https://gameplay.tips/guides/across-the-obelisk-new-perk-system-guide.html] (50포인트는 간접 언급) |
| Darkest Dungeon 2 | 제단: 영웅 해금, 영웅 능력치 강화, 장신구·마차 업그레이드, 기억(영웅별 작은 보너스) | 수치 [미검증] | 댐: 선택형 런 수정자 | [출처: https://darkestdungeon.wiki.gg/wiki/Altar_of_Hope] |
| Monster Train | 클랜 레벨 = **카드 해금만**, 해금 카드는 보상 풀에만 | 수치 상승 없음 | 코버넌트 등급 | A-deckbuilders 재인용 |
| Slay the Spire | 해금만(카드·유물·캐릭터) | 수치 상승 없음 | 승천 20단계 [미검증: 단계 수] | 1·3절 출처 |
| Aethermancer, Montabi | 해금·선택지 확장 위주 | — | — | R3 5-2 재인용 |

### 풀이
- **수직(수치) vs 수평(선택지) 논의:** 개발자 1차 발언으로 확인한 건 Rogue Legacy 쪽 하나예요. "갈 필요가 없게 의도했지만 플레이어는 갈아야 한다고 느꼈다"는 말과 Dead Cells를 "수평적"이라 부른 대비예요 [출처: https://www.siliconera.com/rogue-legacy-2-interview/]. 플레이어 쪽 불만은 커뮤니티 글로 확인했어요. 매 판 강해져서 돌아오니 "잘했는지 못했는지 알 수 없다", "이겨도 메타 덕분 같아서 공허하다", "더 갈면 된다고 생각하게 된다"는 내용이에요. 같은 글이 선택지를 넓히는 해금이나 초보를 돕는 해금은 좋다고 했어요 [출처: https://scribe.disroot.org/comment/9255518]. 이건 개인 의견 하나라 일반화하면 안 돼요. GDC 발표나 포스트모템에서 이 논의를 정리한 1차 자료는 이번에 찾지 못했어요 [미검증].
- **Hades의 분리:** 거울(큰 수치)과 God Mode를 **따로** 둬요. Kasavin은 "그냥 밀어붙일 수 있으면 게임의 재미가 사라진다"며 쉬운 모드 대신 적은 그대로 두고 플레이어가 맞을 수 있는 횟수만 늘렸다고 해요 [출처: https://inverse.com/gaming/hades-god-mode-interview]. 즉 "실패의 아픔을 줄이는 장치"와 "성장 보상"을 다른 손잡이로 나눠요.
- **상한과 감쇠:** Vampire Survivors는 살 때마다 **모든** 파워업 가격이 올라 총량이 자연스럽게 묶여요. Hades 거울은 재능마다 단계 상한이 있고, 같은 칸의 두 재능 중 하나만 켜져요. Dead Cells 플라스크는 단계가 오를수록 비싸져요.
- **우리 수치와 비교할 거리:** 0021의 성장 폭(레벨당 HP +2 최대 +10, 성체·각성체 주 성장 +2씩)은 아직 임시값이에요. 위 사례 중 "판 밖 성장이 캐릭터 단위로 묶인" 경우는 AtO 퍽(영웅당 50포인트)과 DD2 제단(영웅 능력치)이에요. 둘 다 별도의 역방향 난이도(광기, 댐)를 같이 둬요.

---

## 6. 육성 대상이 여럿일 때 성장 분배

### 사례 표

| 게임 | 문제 | 장치 | 수치 | 근거 |
|---|---|---|---|---|
| 포켓몬 | 안 싸운 포켓몬이 뒤처짐 | 학습장치. 1세대 "학습장치(전체)"는 경험을 반으로 나눠 분배, 2~5세대는 지닌 포켓몬과 반반, **6~7세대는 켜고 끄는 중요한 도구로 안 싸운 포켓몬이 경험 50%**, Let's Go는 늘 켜짐(끌 수 없음) | 50% | [출처: https://bulbapedia.bulbagarden.net/wiki/Exp._Share] (8~9세대 상세는 이 페이지에 없음) |
| Fire Emblem 창염의 궤적·새벽의 여신 | 출전 안 한 유닛이 뒤처짐 | 보너스 경험: 장 클리어로 받고(빨리 깨면 더), 거점에서 원하는 유닛에게 나눠 줌. 필요량은 레벨이 오를수록 증가(창염: 1레벨 약 85 → 20레벨 143) | 난이도가 높을수록 적게 받음 | [출처: https://fireemblemwiki.org/wiki/Bonus_experience] |
| NIKKE (수집형) | 새로 얻은 캐릭터가 낮은 레벨 | 싱크로 디바이스: 약한 캐릭터 레벨을 강한 캐릭터들에 맞춤 | 정확한 기준 [미검증: "상위 5명 중 최저"는 통념] | [출처: https://www.prydwen.gg/nikke/guides/synchro-device-trick] |
| Darkest Dungeon 1 | 로스터 관리 | 마차 업그레이드: 주당 영입 후보 3 → 7명, 로스터 상한 12 → 25명 | 비용 3·8·12·16·21 | [출처: https://gamepressure.com/darkestdungeon/stage-coach/z675b8]. 높은 레벨 신병 업그레이드 [미검증] |
| PokéRogue | 새 스타터가 약함 | 사탕으로 비용 감소·패시브 해금, 매일 무작위 스타터 3마리에 포켓러스(추가 경험) | 1절 참고 | [출처: https://wiki.pokerogue.net/gameplay:faq] |
| Chrono Ark | 한 명만 키우기 | 같은 캐릭터 스킬을 연달아 쓰면 비용 증가(신속 스킬은 예외). 친밀도 최대면 첫 레벨업 때 고를 수 있는 스킬 수가 영구히 늘어남 | — | [출처: https://laughica.pages.dev/posts/beginner-tips-and-tricks-for-chrono-ark] |

### 풀이
- **두 갈래:** (가) 전투 중에 경험을 나눠 주기(학습장치) (나) 전투 밖에서 따로 몰아 주기(FE 보너스 경험, NIKKE 싱크로). 우리 0021은 "출전한 셋이 똑같이(쓰러져도)" 받는 규칙이라 (가)의 "출전자 전원 균등"에 해당하고, **출전하지 않은 정령**에 대한 장치는 아직 없어요.
- **새로 얻은 캐릭터가 Lv1이라 안 쓰게 되는 문제**에 대해, 확인된 해법은 레벨 맞추기(NIKKE), 몰아주기 경험(FE)이에요. 로그라이트 쪽에서 "새 캐릭터를 높은 레벨로 들이는" 사례는 확인하지 못했어요(DD1 신병 업그레이드는 [미검증]).
- **이브이식 "같은 종 여러 마리"**를 허용하면 분배 문제가 더 커져요(키울 대상이 늘어남). 우리 규칙은 줄당 한 개체라 이 문제는 작아요.

---

## 7. "혼자서도 굴러가는" 캐릭터의 조건

### 확인된 것
- **솔로 생존성을 다룬 설계 글은 찾지 못했어요.** 아래는 "하나에 기대게 하는 장치"와 "하나를 지키게 하는 장치"의 사례예요.
- **Wildfrost:** 리더가 죽으면 판이 끝나요. 리더는 "보호를 요구한다" [출처: https://wildfrostwiki.com/Leaders]. 혼자 시작하는 캐릭터를 "혼자 버티는 존재"가 아니라 "동료가 지키는 존재"로 만든 반대 방향 사례예요.
- **Chrono Ark:** 같은 캐릭터 스킬을 연달아 쓰면 비용이 올라 한 명 위주 플레이에 벌이 있어요 [출처: https://laughica.pages.dev/posts/beginner-tips-and-tricks-for-chrono-ark].
- **Aethermancer:** 스타터를 "희귀하고 강한" 몬스터로 줘서 혼자 출발해도 버티게 했다고 읽혀요 [출처: https://www.destructoid.com/aethermancer-early-access-review/]. 개발자가 이유를 밝힌 자료는 못 찾았어요.
- **StS1 아이언클래드의 전투 후 회복 6**: 가장 먼저 열리는 캐릭터에 자가 회복을 준 사례로 자주 언급돼요 [미검증].

### 적 강도를 파티 크기에 맞추는 방식
- **확인하지 못했어요.** AtO·DD2·Gordian Quest·Cobalt Core는 파티 크기가 고정이라(4·4·3·3) 이 문제가 없어요. Slice & Dice도 매 판 5명이에요 [출처: https://store.steampowered.com/app/1775490/Slice__Dice]. 파티가 판 중에 늘어나는 Aethermancer·Wildfrost·Chrono Ark는 "늘어난 파티를 전제로 뒤 구역이 어려워지는" 구조로 보이지만 수치 자료는 못 찾았어요 [미검증].
- 다음에 확인할 곳: PokéRogue(파티 1~6 자유, 웨이브 기반 적 레벨), Pokémon Mystery Dungeon 계열, Backpack Hero, 협동 인원에 따라 적을 늘리는 게임(Gordian Quest 협동은 [미검증]).

---

## 8. 우리 결정과 닿는 곳 (근거 연결만, 추천 아님)

| 우리 열린 질문 (0052 등) | 닿는 사례 | 사례가 보여 주는 것 |
|---|---|---|
| **첫 판을 정령 하나로 떠나고 빈 자리를 비워 둠** (0052 02:04) | Aethermancer · Wildfrost · Chrono Ark(판 안에서 채움), AtO · DD2 · MT2 · Cobalt Core(처음부터 자리를 다 줌), DD2 임시 민병대 | 확인한 사례 중 "빈 자리 + 판 밖에서만 채움"은 없었어요. 빈 자리를 판 안에서 채우는 게 흔하고, 판 밖 해금만 쓰는 게임은 시작 인원이 파티 크기와 같았어요. 혼자 싸우는 판의 밸런스는 규칙 작업 몫이에요. |
| **시작 풀 기준 (혼자서도 굴러가는 정령)** | Aethermancer(희귀·강한 스타터), StS1 아이언클래드 회복 [미검증], Wildfrost 리더(지켜야 하는 존재) | 기준을 밝힌 1차 자료는 없어요. "혼자 버티는 키트"와 "동료가 지키는 키트"라는 상반된 선례가 있어요. |
| **무작위 1마리, 원치 않을 때** | Wildfrost(무작위 후보 중 고르기), Cassette Beasts(결과를 숨긴 선택), StS2(한 판이면 다음 캐릭터) | 완화책 세 가지: 후보 중 고르기, 빠른 두 번째 획득, 비교를 막는 선택. 순수 무작위 1개 + 다시 뽑기 금지의 확인된 선례는 없어요. |
| **정령을 얻는 경로: 막 보스 깃듦 말고** (0052, 0032 "나머지 줄은 보상·이벤트로") | AtO 런 중 퀘스트(12명), MT2 누적 행동, Wildfrost 처치 수·과제, StS2 판 끝내기, Hades·DD2 메타 화폐 | 메타 화폐 경로는 우리 금지(정령과 무관한 화폐로 파워 사기)와 부딪힐 수 있어요. 누적 행동형은 "그 계열이 잘하는 행동"을 조건으로 걸어 맛보기를 주는 패턴이에요(MT2). 런 중 퀘스트형은 조건이 길면 공략이 필요해져요(AtO). |
| **해금 리듬과 15줄 로스터** | StS2 4판에 5명, AtO 16명 중 4명 시작, DD2 15직업 중 4명 시작 | 15명 안팎 게임은 시작 인원 = 파티 크기였어요. 우리는 시작 1이라 리듬 설계 몫이 더 커요. |
| **갈래 조건 = 이번 탐험에서 받은 카드** (0027, 0045) | 님피아·키링키(기술을 알면 진화), Cassette Beasts(질문 선택 + 장착물), 디지몬(복합 숨은 조건) | "알고 있으면"형은 한 줄 조건이라 투명하고, 숨은 복합 조건은 "막막하다"는 반응이 남아요. 0027의 "조건은 항상 보임"과 맞는 쪽은 앞쪽이에요. |
| **자람 조건 = 역할대로 하면 차는 누적량** (0045 3절) | 포켓몬 사용 횟수형(분노의 주먹 20회, 반동 294), MT2 클랜 과제 | 사용 횟수형이 "그 행동만 반복"하게 만드는 대표 사례예요. 수치가 "평소 플레이로 자연히 차는지"가 갈림길이에요. |
| **갈래는 되돌릴 수 없음, 안 간 갈래** (0052 5·6번) | Cassette Beasts(되돌릴 수 없지만 재녹음), Monster Sanctuary(돌로 되돌림), 포켓몬(같은 종 여러 마리) | 되돌릴 수 없는 게임도 "두 번째 개체"로 출구를 둬요. 우리 줄당 한 개체 규칙에서는 출구가 없는 상태예요. 출구를 둘지는 Lucy·규칙 작업 몫이에요. |
| **필러 2 "키우면 강해진다"와 난이도** (0045 2절) | Hades(거울 + God Mode + 열기 분리), AtO(퍽 + 광기), DD2(제단 + 댐), Rogue Legacy 개발자 발언, VS 가격 상승 | 수직 성장이 있는 게임은 역방향 난이도나 상한·감쇠를 같이 둬요. "갈아야 한다"는 불만은 개발 의도와 달리 생길 수 있어요(Rogue Legacy). |
| **출전 안 한 정령의 경험** (0021 "출전한 셋이 똑같이") | 포켓몬 학습장치 50%, FE 보너스 경험, NIKKE 레벨 맞추기 | 출전자 균등은 확인했고, 벤치 정령 장치는 아직 비어 있어요. 시작 1마리 → 차차 늘어나는 구조에서는 "늦게 온 정령이 Lv1" 문제가 생길 수 있어요. |
| **출전 인원: 보유가 셋 미만일 때** (0052 열린 질문) | DD2 대체 영웅·민병대, Chrono Ark 시작 둘 + 드래프트 | 임시 동료로 자리를 메우는 선례가 있어요. 적 강도를 파티 크기에 맞추는 자료는 못 찾았어요. |

---

## 출처 목록

직접 열어 확인한 링크만 적어요. 기존 조사에서 재인용한 출처는 해당 문서를 보세요.

- https://www.destructoid.com/aethermancer-early-access-review/
- https://bonus-action.com/guides/aethermancer-guide-best-monsters-teams-starters/
- https://wildfrostwiki.com/Leaders
- https://wildfrostwiki.com/Companions
- https://wildfrostwiki.com/Tribes
- https://cardgamer.com/guides/how-to-unlock-tribes-in-wildfrost
- https://gameranx.com/features/id/464720/article/wildfrost-how-to-unlock-every-companion-at-the-hot-spring-unlock-guide/
- https://pokerogue-wiki.com/en/wiki/items/candies/
- https://pol1.lr.ggtyler.dev/r/pokerogue/comments/1czask1/faq_and_comprehensive_guide
- https://pol1.lr.ggtyler.dev/r/pokerogue/comments/1c4wde6/a_quick_beginners_guide/l01vhtp
- https://wiki.pokerogue.net/gameplay:faq
- https://primagames.com/tips/how-to-unlock-each-character-in-slay-the-spire-2
- https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/
- https://www.gamedeveloper.com/disciplines/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-
- https://hades.fandom.com/wiki/Infernal_Arms
- https://hades.fandom.com/wiki/Mirror_of_Night
- https://inverse.com/gaming/hades-god-mode-interview
- https://steamcommunity.com/app/861540/discussions/0/1643171537289009349
- https://kosgames.com/across-the-obelisk-how-to-unlock-all-characters-version-1-0-29665/
- https://gameplay.tips/guides/across-the-obelisk-new-perk-system-guide.html
- https://darkestdungeon.wiki.gg/wiki/Heroes_(Darkest_Dungeon_II)
- https://darkestdungeon.wiki.gg/wiki/Altar_of_Hope
- https://gamepressure.com/darkestdungeon/stage-coach/z675b8
- https://www.destructoid.com/how-to-unlock-the-lazarus-league-in-monster-train-2/
- https://parrot-spinach-nd46.squarespace.com/articles/how-to-unlock-the-original-old-clans-in-monster-train-2
- https://dood.gg/es/monster-train-2/guides/clan-selection
- https://gamepressure.com/newsroom/how-to-unlock-8th-character-in-cobalt-core/z66547
- https://steamcommunity.com/app/2179850/discussions/0/4143942846476783702
- https://laughica.pages.dev/posts/beginner-tips-and-tricks-for-chrono-ark
- https://game8.co/articles/reviews/chrono-ark-gameplay-and-story-info
- https://store.steampowered.com/app/1775490/Slice__Dice
- https://earlyguides.pages.dev/slice-and-dice/beginners-guide
- https://store.steampowered.com/app/981430?l=english
- https://almarsguides.com/retro/walkthroughs/PS1/Games/DigimonWorld/Misc/RaisingDigimon/
- https://www.tvtropes.org/pmwiki/pmwiki.php/GuideDangIt/MonsterRancher
- https://videogameschronicle.com/guide/eevee-evolution-all-eeveelution-methods-pokemon-scarlet-and-violet
- https://serebii.net/scarletviolet/evolution.shtml
- https://www.pockettactics.com/how-to-evolve-basculin
- https://gamerant.com/pokemon-scarlet-violet-primeape-evolution-how-annihilape-faint-lore/
- https://www.thegamer.com/cassette-beasts-evolution-guide/
- https://monster-sanctuary.fandom.com/wiki/Monster_Shifting
- https://www.siliconera.com/rogue-legacy-2-interview/
- https://scribe.disroot.org/comment/9255518
- https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=5168
- https://www.gamepressure.com/dead-cells/what-uprgrades-should-be-unlocked-first/z0b356
- https://bulbapedia.bulbagarden.net/wiki/Exp._Share
- https://fireemblemwiki.org/wiki/Bonus_experience
- https://www.prydwen.gg/nikke/guides/synchro-device-trick
- https://jwittsf.design.blog/2020/04/06/metasystems-matter-in-roguelite-games (메타 시스템 일반론. 본문에서는 인용하지 않음)
