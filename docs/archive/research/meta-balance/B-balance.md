# B. 전투 균형 조정 레퍼런스 조사

- 날짜: 2026-11-10
- 목적: 보스 승률(자동 플레이)이 83% → 14%로 떨어진 뒤, 균형을 **어떻게** 잡을지 고르기 위한 방법과 사례 숫자 모음이에요. 우리 숫자를 고치자는 처방은 하지 않아요.
- 표기: **[출처: 링크]** = 이번에 링크를 열어 직접 확인한 것. **[미검증]** = 기억이나 통념이라 확인하지 못한 것. **[계산]** = 출처 숫자로 제가 직접 계산한 것.
- 조회 상태: 웹 검색과 조회는 대체로 됐어요. 아래 페이지는 막혀서 못 읽었어요. 거기서 확인하려던 내용은 [미검증]으로 남겼어요.
  - dominionstrategy 위키(봇 차단), slaythespire.wiki.gg의 카드 데이터 모듈, gamegeeker의 "슬더슬2 승률 25%" 기사.
- 아래에서 "슬더슬"은 Slay the Spire 1, "슬더슬2"는 Slay the Spire 2예요.
- 슬더슬 짧은 설명(Lucy용): 캐릭터 한 명이 덱 10~12장으로 시작해요. 한 턴에 에너지 3을 쓰고 카드 5장을 뽑아요. 적은 이번 턴에 무엇을 할지 머리 위에 미리 보여 줘요("의도"). HP는 전투가 끝나도 회복되지 않고 다음 전투로 이어져요. 1막은 지도 15층쯤이고 맨 끝에 보스가 있어요. 전투에서 이기면 카드 3장 중 1장을 고르거나 건너뛰어요. 승천(Ascension)은 이긴 뒤 하나씩 열리는 난이도 단계예요(1~20).

---

## 0. 한눈에

1. **우리 카드 기준값은 슬더슬과 같아요.** 마력 3 · 손패 5 · 비용 1당 피해 6 / 방어 5는 슬더슬과 똑같아요(Strike 6, Defend 5). 차이는 그 값이 주인 능력치(7~13)에 따라 늘거나 준다는 점이에요. **[출처: [슬더슬 카드 목록](https://slaythespire.wiki.gg/wiki/Cards_List)]**
2. **슬더슬도 시작 덱만으로는 1막 보스를 잡게 만들지 않았어요.** 아이언클래드의 시작 덱은 1턴에 피해 10쯤을 내요. 1막 보스 HP는 140~250이에요. 약한 시작 덱과 보스 사이의 차이는 1막 15층 동안 얻는 카드 보상으로 메워요. **[계산]**
   - 같은 맥락의 실험이 있어요. 무작위 봇이 시작 덱 비슷한 10~12장으로 가디언(240)과 싸우면 실제 수치에서 승률이 약 0.5%였어요. **[출처: [CMU ETC 보고서](https://www.etc.cmu.edu/projects/ai-playtesting/?p=165)]**
3. **사람 승률의 기준점.** 커뮤니티가 모은 슬더슬2 기록(자기 기록 업로드, 표본에 치우침 있음)에서 혼자 하는 판의 승률은 20.2%, 1막 생존율은 58.1%예요. Mega Crit은 같은 시기에 "기본 난이도가 지금 꽤 어렵다"며 낮은 승천을 쉽게 하고 있어요. **[출처: [STS Tracker](https://ststracker.app/), [패치 노트 요약](https://sameteem.com/threads/slay-the-spire-2-patch-notes-address-base-game-difficulty-and-the-doormaker.34107/)]**
4. **멍청한 봇의 승률은 사람 승률이 아니라 "바닥값"이에요.** 사례가 셋 있어요.
   - King(캔디크러시)은 봇 성공률을 사람 성공률로 옮길 때 로짓 회귀를 따로 맞췄어요. 오차는 4~5%p였어요. **[출처: [Gudmundsson 외 2018](https://www.Gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf)]**
   - 도미니언 커뮤니티는 단순 봇(Big Money)을 "이걸 못 이기면 전략이 아니다"라는 **하한선**으로 써요. **[출처: [dominionstrategy](https://dominionstrategy.com/big-money)]**
   - 인디 덱빌더 개발자는 탐욕 봇의 숫자를 "바닥값"으로 보고, 바뀐 쪽이 쉬워졌는지 어려워졌는지와 어디서 막히는지만 읽었어요. **[출처: [Godot 포럼](https://forum.godotengine.org/t/tuning-a-card-roguelike-with-a-bot-120-seeded-runs-per-change-and-the-number-that-mattered-most/146538)]**
5. **봇 승률 하나를 목표로 둔 공개 사례는 찾지 못했어요.** 연구와 개발 사례는 봇을 **상대 비교**(변경 전과 후, 같은 시드로 짝지어 비교)와 **막히는 지점 찾기**에 써요.
   - 슬더슬2 봇 개발자는 같은 덱 · 같은 시드로 짝지은 보스전 8,000판을 돌려서 7.5% → 8.8% 같은 작은 차이까지 잡아냈어요. 그러면서 "절대 승률은 믿지 말라"고 적었어요. **[출처: [tomokinotes](https://tomokinotes.pages.dev/en/blog/sts2-bot-03-boss-simulator/)]**
6. **Mega Crit이 본 지표.** 공개된 것은 넷이에요. 승률 목표 수치는 공개되지 않았어요. **[출처: [Game Developer 2018](https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)]**
   - 카드가 제시됐을 때 골라지는 비율(픽률)
   - 무엇을 제치고 골라졌는지
   - 이긴 덱에 들어 있던 비율
   - 그 카드를 쓸 때 특정 적에게서 받은 평균 피해
7. **인원이 바뀌는 게임의 대표 공식(글룸헤이븐).**
   - 적 레벨 = 파티 평균 레벨 ÷ 2(올림).
   - 적 수는 2 · 3 · 4인 배치를 따로 그려요.
   - **혼자 하는 플레이어도 캐릭터를 둘 이상 조작하게 하고**, 대신 적 레벨을 +1 해요. 캐릭터 1명 솔로는 기본 규칙에 없어요. **[출처: [글룸헤이븐 규칙서](https://mahmati.kapsi.fi/bg/gloomhaven/gloomhaven_rulebook.html)]**
8. **영구 성장의 크기 사례.**
   - Hades 거울: 최대 HP가 +50까지(시작 HP의 약 2배, 시작 HP는 [미검증]). 부활 3회. 신 모드는 받는 피해 -20%에서 시작해 죽을 때마다 +2%, 최대 -80%.
   - Vampire Survivors: 피해 +25%, 최대 HP +30%.
   - 우리 정령: 각성체 Lv6이면 HP +10, 주 능력치 +4(13 → 17, 약 +31%), 해방까지 붙어요. **[출처: [Hades 위키](https://hades.wiki.fextralife.com/Mirror+of+the+Night), [Inverse](https://inverse.com/gaming/hades-god-mode-interview), [VS 위키](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=2256)]**

---

## 1. 덱빌더 로그라이트의 기준 수치 곡선

### 1-1. 슬더슬 시작 상태 (승천 0)

| 캐릭터 | 시작 HP | 시작 덱 | 시작 유물 |
| --- | --- | --- | --- |
| 아이언클래드 | 80 | 타격 5 · 수비 4 · 강타 1 (10장) | 전투 끝에 HP 6 회복 |
| 사일런트 | 70 | 타격 5 · 수비 5 · 생존자 1 · 무력화 1 (12장) | 전투 시작에 2장 더 뽑기 |
| 디펙트 | 75 | 타격 4 · 수비 4 · 전격 1 · 이중 시전 1 (10장) | 전투 시작에 번개 오브 1 |
| 와처 | 72 | 타격 4 · 수비 4 · 분출 1 · 경계 1 (10장) | 전투 시작에 기적(에너지 카드) 1장 |

**[출처: [bloxodes 캐릭터 정리](https://bloxodes.com/wiki/slay-the-spire-1/characters), [사일런트 위키](https://slaythespire.wiki.gg/wiki/Silent)]**

| 카드 | 비용 | 효과 (강화 후) |
| --- | --- | --- |
| 타격 Strike | 1 [미검증] | 피해 6 (9) |
| 수비 Defend | 1 [미검증] | 방어도 5 (8) |
| 강타 Bash | 2 | 피해 8 + 취약 2 (10 + 취약 3) |
| 폼멜 타격 (일반) | 1 [미검증] | 피해 9 + 1장 뽑기 |
| 털어내기 (일반) | 1 [미검증] | 방어도 8 + 1장 뽑기 |
| 철의 파동 (일반) | 1 [미검증] | 방어도 5 + 피해 5 |
| 학살 (일반이 아님) | 2 [미검증] | 피해 20, 손에 남으면 사라짐 |

**[출처: [카드 목록](https://slaythespire.wiki.gg/wiki/Cards_List), [강타](https://slaythespire.wiki.gg/wiki/Bash)]**

읽는 법: 시작 카드(타격 6)는 기준선이에요. 보상으로 받는 일반 카드는 같은 비용에 **효과 하나를 더 얹거나**(9 + 뽑기), 수치를 1.3~1.6배로 올려요. 시작 카드가 "가장 약한 1비용 카드"라서, 무엇을 받든 덱이 좋아지게 짜여 있어요. **[계산]**

### 1-2. 슬더슬 1막 적 (승천 0, 괄호는 높은 승천)

| 등급 | 적 | HP | 주 공격 | 플레이어 HP 80 대비 |
| --- | --- | --- | --- | --- |
| 일반 | 이 (빨강/초록) | 10~15 / 11~17 | 5~7 | 6~9% |
| 일반 | 균류 짐승 | 22~28 | 6 | 8% |
| 일반 | 산성/가시 슬라임(중) | 28~32 | 10 / 8 | 10~13% |
| 일반 | 턱벌레 | 40~44 | 11 | 14% |
| 일반 | 광신자 | 48~54 | 6 (매 턴 힘이 쌓여 점점 세짐) | 8% → 커짐 |
| 일반 | 약탈자 | 44~48 | 10~12 | 13~15% |
| 정예 | 그렘린 놉 | 82~86 | 14 (스킬 카드를 쓸 때마다 힘 +2) | 18% |
| 정예 | 라가불린 | 109~111 | 18 | 23% |
| 정예 | 센트리 ×3 | 38~42씩 | 9씩 | 11%씩 |
| 보스 | 헥사고스트 | 250 (264) | 디바이더 = (플레이어 HP ÷ 12 + 1) × 6 | HP 80이면 42 = 53% |
| 보스 | 슬라임 보스 | 140 (150) | 내려찍기 35 (38), 2턴 전에 예고 | 44% |
| 보스 | 가디언 | 240 (250) | 맹렬한 강타 32 (36) | 40% |

**[출처: [적 데이터 모듈](https://slaythespire.wiki.gg/wiki/Module:Enemies/data), [가디언](https://slaythespire.wiki.gg/wiki/Guardian), [슬라임 보스](https://slaythespire.wiki.gg/wiki/Slime_Boss), [헥사고스트](https://slaythespire.wiki.gg/wiki/Hexaghost), [그렘린 놉](https://slaythespire.wiki.gg/wiki/Gremlin_Nob)]**

비율 요약 **[계산]**

- 보스 HP ÷ 플레이어 HP: 1.75 ~ 3.1배
- 정예 HP ÷ 플레이어 HP: 1.0 ~ 1.4배. 센트리는 셋을 합쳐 약 1.5배예요.
- 보스의 가장 큰 한 방: 플레이어 최대 HP의 40~53%. 큰 한 방은 모두 **미리 보이거나(슬라임 보스는 2턴 전 "준비 중"), 플레이어 상태에 비례해요(헥사고스트는 HP가 많을수록 세짐).**
- 시작 덱의 1턴 피해: 아이언클래드는 타격 5장(30)과 강타(8)가 10장 중 6장이에요. 3마력이면 평균 피해 약 10/턴이에요(취약 제외).
  - 이대로라면 가디언 240에 약 24턴, 슬라임 보스 140에 약 14턴이 걸려요.
  - 실제로는 1막 동안 카드 보상 십여 장, 유물, 카드 제거가 그 차이를 메워요.

### 1-3. 전투 길이 목표

- 슬더슬 개발자가 "일반 전투 몇 턴, 보스 몇 턴"을 목표로 밝힌 자료는 찾지 못했어요. **[미검증]**
- 통념은 이래요. 일반 전투는 3~5턴, 정예는 5~8턴, 1막 보스는 7~12턴 안팎이고, 보스는 "덱이 스스로 굴러가는지(스케일링)"를 보는 길이로 잡는다고 해요. **[미검증]**
- 간접 근거: 헥사고스트는 한 바퀴가 7수(3~9턴)이고, 9턴째 "인페르노"부터 화상 카드가 강해져요. 9턴 안에 끝내라는 시계 구실을 해요. **[출처: [헥사고스트](https://slaythespire.wiki.gg/wiki/Hexaghost)]**

### 1-4. 다른 게임 (대부분 확인 못 함)

| 게임 | 확인한 것 | 미검증 |
| --- | --- | --- |
| 슬더슬2 | 1막 보스 HP 사례: 올빼미 판관 234 → 231, 점액 광전사 266 → 261 (패치 노트, 괄호 승천 값 생략). 피해 11 → 10 같은 1~2 단위 조정 **[출처: [패치 노트 요약](https://sameteem.com/threads/slay-the-spire-2-patch-notes-address-base-game-difficulty-and-the-doormaker.34107/)]** | 위 보스들이 몇 막인지 |
| Monster Train | 개발자: "대부분 클랜의 승률이 비슷하다" **[출처: [PC Gamer](https://www.pcgamer.com/games/monster-train-2-lost-arsenal-update/)]** | 화로(Pyre) HP, 서약별 적 HP 증가율 |
| Wildfrost | 데모가 어렵다는 반응에 출시판 난이도를 "한 단계" 내리고 도전 모드를 따로 둠. 보스는 눈(행동 정지)에 1턴 내성 **[출처: [Chucklefish](https://chucklefish.org/?p=3468)]** | 수치 |
| Across the Obelisk, Chrono Ark | – | 영웅 4명 고정 파티라 인원별 조정이 없다는 점 **[미검증]** |

---

## 2. 목표 승률

### 2-1. 공개된 숫자

| 게임 | 숫자 | 성격 | 출처 |
| --- | --- | --- | --- |
| 슬더슬2 | 혼자 하는 판 승률 20.2% (70,664판), 1막 생존 58.1%, 2막 58.9%, 3막 62.6% | 커뮤니티 업로드라 실력 있는 쪽으로 치우쳤을 수 있음. 앞서 해보기 기간 | [STS Tracker](https://ststracker.app/) |
| 슬더슬2 | "기본 난이도가 지금 꽤 어렵다", 낮은 승천을 조금씩 쉽게 함. 보스를 볼 때 "처치율 · 입힌 피해"를 봄 | 개발사 발언, 목표 수치 없음 | [패치 노트 요약](https://sameteem.com/threads/slay-the-spire-2-patch-notes-address-base-game-difficulty-and-the-doormaker.34107/), [GamesRadar](https://www.gamesradar.com/games/roguelike/slay-the-spire-2-devs-say-the-doormaker-boss-that-sparked-so-many-negative-steam-reviews-is-actually-slightly-weaker-than-the-other-act-3-bosses/) |
| 슬더슬2 | "승률 25%"라는 기사 제목 | 본문을 못 읽음 | [미검증] |
| 슬더슬 | 개발사가 준 50M판 중 아이언클래드 일부: 전부 지는 쪽으로 찍는 기준선이 92.5% 정확 → 승률 약 7.5% (모든 승천 포함) | 간접 추정 | [vegasera 2020](https://vegasera.github.io/2020-03-03-predicting-win-rate-and-card-combinations-slay-the-spire) |
| 슬더슬 | 스팀 업적: 아이언클래드로 엔딩 56.0%, 승천 10 클리어 14.8%, 승천 20 클리어 7.3% | "한 번이라도 해낸 사람" 비율. 판당 승률이 아님 | [스팀 통계](https://steamcommunity.com/stats/646570/achievements) |
| Hades | 업적: 타르타로스 통과 81.8%, 첫 탈출 46.7% | 같음 | [스팀 통계](https://steamcommunity.com/stats/1145360/achievements) |
| Hades | 커뮤니티 설문: 첫 탈출까지 보통 20~40판. 첫 판에 깬 사람은 "몇 명", 14%는 아직 못 깸 | 자기 응답 설문 | [r/HadesTheGame](https://lr.eu.psf.lt/r/HadesTheGame/comments/jx0cds/data_chart_how_many_runs_did_it_take_to_clear_the) |
| Balatro | 업적: 첫 승 71.5%, 빨강 판돈 이상 43.6%, 검정 30.2%, 금 12.2% | 업적 비율 | [스팀 통계](https://steamcommunity.com/stats/2379780/achievements) |
| Balatro | 하양 · 초록 · 보라 판돈에서 판돈 오름폭을 줄여 "중반 난이도 급등"을 완화 | 패치 | [Press Start](https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/) |

### 2-2. 풀이

- **"1막 보스만의 통과율"을 개발사가 공개한 자료는 없었어요.** 가장 가까운 것은 두 가지예요. 슬더슬2 커뮤니티 기록의 1막 생존율 58%(1막 전체), 그리고 1막 보스 층(16층)에서 봇이 많이 죽는다는 봇 연구들이에요(3절).
- 첫 판 승률이나 "첫 승까지 평균 몇 판"을 개발사가 밝힌 자료도 찾지 못했어요. Hades 커뮤니티 설문(20~40판)이 유일한 숫자예요.
- 영구 성장이 있는 게임이 초회 승률을 "몇 %로" 잡는다는 발언도 찾지 못했어요. Supergiant는 실패의 아픔을 줄이는 쪽으로 말해요. "실패의 쓰라림을 최대한 줄이는 게 처음부터 큰 초점"이라고 했고, 대신 신 모드를 따로 뒀어요. **[출처: [Inverse](https://inverse.com/gaming/hades-god-mode-interview)]**
- Rogue Legacy 2 개발자는 이렇게 말했어요. "누구는 3시간, 누구는 40시간 걸린다. 그래서 RPG식 성장을 좋아한다." 성장은 실력 차를 메우는 장치로 본다는 뜻이에요. **[출처: [Siliconera](https://www.siliconera.com/rogue-legacy-2-interview/)]**

---

## 3. 데이터 · 시뮬레이션 기반 밸런싱 방법

### 3-1. 개발사 사례

| 누가 | 무엇을 봤나 | 교훈 | 출처 |
| --- | --- | --- | --- |
| Mega Crit (슬더슬) | 결정 하나하나를 서버에 기록. 픽률, 무엇을 제치고 골랐나, 이긴 덱에 든 비율, 카드별로 특정 적에게서 받은 피해. 그래프 3개 → 90개 이상 | 데이터를 보기 전에 **질문부터 정해요**. 픽률이 아주 낮으면 "사실상 게임에 없는 카드"예요 | [Game Developer](https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder) |
| Mega Crit, 깨어난 자 보스 | 파워 카드를 많이 쓰는 덱이 이 보스에게 유독 졌어요(파워를 쓸 때마다 보스가 힘을 얻음) | 보스가 **특정 빌드만 벌주면** 그 증가량을 줄이고, 대신 전체 피해를 올렸어요. 이후 처치율이 올랐어요 | 같음 |
| Mega Crit, GDC 2019 | 이긴 덱에 많은 카드가 꼭 센 카드는 아님(광기는 늦게 얻는 카드라 많아 보였음). 많이 하는 테스터가 평균을 끌어올려서 승천별로 나눠 봄 | **선택 편향을 경계**해요. 강타가 "승리를 가장 잘 예측하는 카드"로 나온 것도 실은 강타를 지운 판 = 잘 풀린 판이라서였어요 | [GDC 요약](https://summ-www.pages.dev/en-GB/summary/slay-the-spire-metrics-driven-design), [77M판 공개 글](https://lr.eu.psf.lt/r/slaythespire/comments/jt5y1w/77_million_runs_an_sts_metrics_dump) |
| Mega Crit (슬더슬2) | "수백만 판" 데이터와 함께, 바로 고치지 않고 플레이어가 적응할 시간을 둠 | "즉흥 반응에 맞춰 밸런싱하지 않으려고" | [GamesRadar](https://www.gamesradar.com/games/roguelike/slay-the-spire-2-devs-say-the-doormaker-boss-that-sparked-so-many-negative-steam-reviews-is-actually-slightly-weaker-than-the-other-act-3-bosses/) |
| Shiny Shoe (Monster Train 2) | 클랜별 · 서약별 승률 | **계속 쌓여 커지는 경로가 승률이 가장 낮아요.** 초반에 약하고 후반에 세기 때문이에요. 데이터상 같은 세기여도 "느낌"이 다를 수 있어요 | [PC Gamer](https://www.pcgamer.com/games/monster-train-2-lost-arsenal-update/) |

### 3-2. 자동 플레이 봇으로 밸런스 보기

| 사례 | 봇 | 숫자 | 교훈 |
| --- | --- | --- | --- |
| CMU ETC, 슬더슬 가디언전 재구현 | 무작위 봇, 심층 Q러닝 | 무작위 봇 5~8%(보스 HP를 낮춘 쉬운 설정). 학습 봇은 덱 하나로 약 80%. 실제 수치(보스 240, 플레이어 75)로 올리자 약 0.5% | 쉬운 설정에서 낸 결과는 실제 설정으로 옮겨지지 않아요. 덱 10~12장 고정 **[출처: [보고서](https://www.etc.cmu.edu/projects/ai-playtesting/?p=165)]** |
| 슬더슬2 봇 개발기 | 휴리스틱 + 보스전 전용 시뮬 | 실전 A/B 8판씩은 p=0.63으로 판단 불가. 차이를 보려면 한쪽에 보스전 50판 이상이 필요했어요. 같은 덱 · 같은 시드로 짝지은 8,000판에서 처치율 7.5% → 8.8%(p=0.0001) | **짝지은 비교**(둘 다 이기거나 둘 다 진 판은 버리고 갈린 판만 셈). 시뮬의 절대 승률은 실전과 어긋났어요(11.8% vs 8.6%, 2.3% vs 19.2%). 순위 비교에만 써요 **[출처: [tomokinotes](https://tomokinotes.pages.dev/en/blog/sts2-bot-03-boss-simulator/)]** |
| AscensionAI (슬더슬, 강화학습) | PPO, 휴리스틱 기준선 | 휴리스틱 평균 15.78층. 학습 봇의 보스 처치율 21~31%, 정예 승률 약 80%. 16층(1막 보스)에서 죽음의 약 절반 | 단순 봇의 벽은 **1막 보스**예요 **[출처: [기술 문서](https://justinochan.github.io/AscensionAI/AscensionAI_Technical_Writeup.pdf)]** |
| 에든버러 학부 과제 | spirecomm(단순 휴리스틱) + 덱 고르기 알고리즘 | spirecomm은 승천 0에서도 "드물게 이긴다" | 단순 휴리스틱 봇의 승률은 사람보다 훨씬 낮아요 **[출처: [보고서](https://project-archive.inf.ed.ac.uk/ug4/20233951/ug4_proj.pdf)]** |
| 인디 덱빌더 (Godot 포럼) | 탐욕 봇(1~5장 조합을 전부 점수 매겨 최선) | 덱 6 × 시드 20 = 변경마다 120판. 승률 대신 "평균 도달 단계"와 "어디서 끝났나"를 봄. 진 판 118판 중 55판이 4단계에서 끝남 → 벽 | 봇 숫자는 **바닥값**이에요. 쉬워졌나 어려워졌나, 어디가 벽인가만 읽고, 재미는 직접 해서 판단해요 **[출처: [포럼 글](https://forum.godotengine.org/t/tuning-a-card-roguelike-with-a-bot-120-seeded-runs-per-change-and-the-number-that-mattered-most/146538)]** |
| Hearthstone 메타 진화 (연구) | 너비 우선 탐색 휴리스틱 봇 | 목표는 덱끼리 승률 50%. 후보마다 300판이라 잡음이 컸고, 맞붙기 하나는 1만 판 | 봇이 "최적이 아님"을 인정해요. 사람은 덱을 바꿔 적응하는데 봇은 고정이에요 **[출처: [de Mesentier Silva 외 2019](https://ar5iv.arxiv.org/html/1907.01623)]** |
| 도미니언 | Big Money(돈 카드만 사는 봇) | 학습 봇이 Big Money를 97% 이김. 단순 봇도 "초보자는 자주 이김" | 단순 봇 = **하한선 기준** **[출처: [dominionstrategy](https://dominionstrategy.com/big-money), [Dominion 논문](https://ar5iv.labs.arxiv.org/html/2405.06846)]** |

### 3-3. 봇 승률을 사람 승률로 옮기기

- **King(캔디크러시)**
  - 레벨 800개로 "봇 성공률 → 사람 성공률" 회귀식(로짓, 레벨 특징 보정)을 맞추고, 200개 레벨로 검증했어요.
  - 평균 오차는 MCTS 봇 5.4%, 학습 봇 4.0~4.9%였어요.
  - 봇은 사람보다 훨씬 덜 무작위하게 둬요. 깊은 전략이 필요한 레벨에서는 사람이 봇보다 잘해서, 관계가 직선이 아니에요.
  - **[출처: [Gudmundsson 외 2018](https://www.Gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf), [요약 글](https://koaning.io/posts/playtesting)]**
- **Angry Birds Dream Blast 연구**
  - 봇 결과에 "실력 · 끈기 · 지루함이 다른 가상 플레이어 집단"을 얹으니 이탈과 통과율 예측이 크게 나아졌어요.
  - **[출처: [Roohi 외 2020](https://arxiv.org/abs/2008.12937)]**
- 정리: 봇 승률을 사람 승률로 옮기려면 **같은 콘텐츠에 대한 사람 데이터가 있어야** 회귀를 맞출 수 있어요. 사람 데이터가 없으면 봇 승률은 "상대 비교"와 "어디가 벽인지"까지만 말해 줘요.
- **봇 목표 승률을 몇 %로 잡았다는 공개 사례는 찾지 못했어요.** Hearthstone 연구의 50%는 덱끼리 맞붙는 대칭 게임 기준이라 보스전에는 맞지 않아요.

### 3-4. 표본 크기 [계산]

- 200판에 승률 14%면 95% 신뢰구간이 약 ±4.8%p예요(9~19%). 50%면 ±6.9%p예요.
- 승률이 5%p 바뀐 것을 시드가 다른 두 묶음으로 확인하려면 묶음당 수백 판이 필요해요.
- 같은 시드로 짝지어 비교하면(위 슬더슬2 봇 사례처럼) 훨씬 적은 판으로 판단할 수 있어요.

---

## 4. 시작 덱 설계

| 게임 | 공격 : 방어 : 고유 | 장수 |
| --- | --- | --- |
| 슬더슬 아이언클래드 | 5 : 4 : 1 (강타) | 10 |
| 슬더슬 사일런트 | 5 : 5 : 2 (생존자, 무력화) | 12 (유물로 첫 턴 7장) |
| 슬더슬 디펙트 · 와처 | 4 : 4 : 2 | 10 |
| 도미니언 | 동 7 : 사유지 3 (사유지는 점수만 주는 "죽은 카드") [미검증] | 10 |

**[출처: [bloxodes](https://bloxodes.com/wiki/slay-the-spire-1/characters)]**

- **약하고 균일한 이유**
  - 코넬 강의 자료: "덱은 아주 약하게 시작한다, 그래도 처음부터 재미있게 할 수 있어야 한다", "덱을 늘리지 않으면 뒤의 도전을 넘을 수 없다", "덱 크기는 구성만큼 중요하다", "덱을 줄이게 만드는 장치가 있어야 한다". **[출처: [Cornell CS5152](https://www.cs.cornell.edu/courses/cs5152/2026sp/lectures/lecture15/slides-15.pdf)]**
  - 시작 카드가 약하면 보상이 무엇이든 "고를 이유"가 생겨요. 카드 제거(상점, 값이 점점 오름)가 하나의 성장 경로가 돼요. **[출처: [감산형 덱빌딩 정리](https://saschb2b.github.io/game-mechanics/concepts/subtractive-deckbuilding)]**
- **고유 카드 수**: 슬더슬은 캐릭터마다 1~2장이고 나머지 8~10장은 같은 이름의 기본 카드예요. 고유 카드가 캐릭터의 "첫 문장"을 맡아요. 강타는 취약, 생존자는 버리기 시너지, 분출은 자세예요. **[미검증: 의도 해석]**
- **작은 덱(4~12장)의 순환 문제**
  - 덱이 손패(5장)와 비슷하거나 작으면 매 턴 덱 전체를 보게 돼요. "무엇을 뽑았나" 고민이 사라지고, 같은 턴이 반복돼요.
  - 대신 강한 카드 한 장의 비중이 아주 커서, 보상 하나로 전투 양상이 확 바뀌어요.
  - 슬더슬은 이 문제를 시작 덱 10~12장(손패 5의 2배 이상)으로 피해요.
  - 위 두 항목은 **[미검증: 통념]**이에요.

---

## 5. 파티 크기에 따른 적 조정

| 게임 | 방식 | 출처 |
| --- | --- | --- |
| 글룸헤이븐 | 적 레벨 = 평균 레벨 ÷ 2 올림(쉬움 -1, 어려움 +1, 매우 어려움 +2). 적 수 · 정예 여부는 2 · 3 · 4인 배치를 시나리오마다 따로 그림. **혼자 하는 플레이어는 캐릭터를 둘 이상 조작하고 적 레벨 · 함정 피해 +1** | [규칙서](https://mahmati.kapsi.fi/bg/gloomhaven/gloomhaven_rulebook.html) |
| 슬더슬2 협동 | 인원이 늘면 적 HP가 커지고, "단순한 인원 비례보다 조금 더 가파름". 에너지 · 덱 · 유물은 사람마다 따로. 패치에서 협동 때 적 특수 능력(인공물 등)의 인원별 증가를 약하게 함 | [allthings.how](https://allthings.how/slay-the-spire-2-co-op-multiplayer-every-mechanic-and-rule-explained/), [패치 노트 요약](https://sameteem.com/threads/slay-the-spire-2-patch-notes-address-base-game-difficulty-and-the-doormaker.34107/) |
| Spirit Island | 정령(플레이어)마다 섬 판 하나를 더해서, 침략도 판 수에 비례해 늘어남. 공포 카드 문턱도 인원에 비례 | [미검증] |
| Across the Obelisk, Chrono Ark, Darkest Dungeon 2, Slice & Dice | 파티 인원 고정(4~5). 온라인 협동은 고정 파티를 나눠 조작 | [미검증] |
| Gordian Quest, For the King | 확인 못 함 | [미검증] |

풀이:
- 확인된 두 사례(글룸헤이븐 · 슬더슬2)는 **행동 경제를 사람(캐릭터)마다 따로 줘요.** 손패 · 에너지가 캐릭터 단위라서 인원이 줄면 행동량도 그만큼 줄고, 적을 그만큼 줄이거나 약하게 해요.
- 글룸헤이븐은 아예 "1캐릭터 솔로"를 피하고 둘 이상 조작하게 했어요. 그만큼 1인 조정이 어려운 문제라는 뜻으로 읽을 수 있어요. **[해석]**
- 우리처럼 **행동 경제(마력 3 · 손패 5)를 파티 전체가 공유하는** 구조에서 인원별 조정 공식을 공개한 사례는 찾지 못했어요. 공유 경제에서는 인원이 줄어도 한 턴에 내는 카드 수는 그대로예요. 줄어드는 것은 세 가지예요.
  - 몸의 수(맞을 대상 · 총 HP)
  - 카드 주인의 다양성(역할)
  - 시간축의 줄 수
- 이 셋은 슬더슬1(캐릭터 1명)과 오히려 비슷해요. 슬더슬 캐릭터 한 명의 HP는 70~80이에요. **[계산 · 해석]**

---

## 6. 영구 성장과 균형 기준선

| 게임 | 영구 성장의 크기 | 출처 |
| --- | --- | --- |
| Hades 거울 | 최대 HP +5 × 10단계 = +50, 부활(HP 50%) 3회, 등 뒤 공격 피해 +10% × 5 = +50%(또는 다치지 않은 적에게 +15% × 5) | [Hades 위키](https://hades.wiki.fextralife.com/Mirror+of+the+Night) |
| Hades 신 모드 | 받는 피해 -20%에서 시작, 죽을 때마다 +2%, 최대 -80% | [Inverse](https://inverse.com/gaming/hades-god-mode-interview) |
| Vampire Survivors | 피해 +5% × 5 = +25%, 최대 HP +10% × 3 = +30%, 방어 -1 × 3, 부활 1 | [VS 위키](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=2256) |
| Rogue Legacy 2 | "1편보다 영구 성장이 훨씬 많다"(Dead Cells의 옆으로 넓어지는 해금과 비교) | [Siliconera](https://www.siliconera.com/rogue-legacy-2-interview/) |
| Dead Cells, Darkest Dungeon 2, Monster Train 2 | 확인 못 함 | [미검증] |

풀이:
- "적 수치를 성장 0 기준으로 맞출지, 중간 성장 기준으로 맞출지"를 밝힌 개발자 발언은 찾지 못했어요. **[미검증]**
- 통념은 이래요. 성장 0으로 **이길 수는 있게**(숙련자 기준) 하고, 성장은 실수를 받아 주는 여유분으로 둬요. Hades 거울 HP +50처럼 "버티기"에 많이 주고 "공격"에는 덜 줘요. 그러면 전투 길이(재미의 모양)는 크게 바뀌지 않아요. **[미검증]**
- 사례에서 확인되는 모양:
  - Hades와 VS 모두 **생존 쪽(HP · 피해 감소 · 부활)이 공격 쪽보다 커요.** HP +100% · +30% 대 피해 +25~50%예요.
  - Hades 신 모드처럼 "죽을수록 쉬워지는" 장치는 기본 난이도와 **따로 켜는 옵션**이에요.
- 성장 상한을 "총 파워의 몇 %"로 정한다는 공개 기준은 찾지 못했어요. **[미검증]**

---

## 7. 보스전 설계

### 7-1. 슬더슬 1막 보스가 시험하는 것

| 보스 | 장치 | 시험하는 것 |
| --- | --- | --- |
| 슬라임 보스 (140) | 점액 뿌리기(쓸모없는 카드 3장을 덱에 섞음) → 준비 중(아무것도 안 함) → 내려찍기 35. HP 50% 이하에서 남은 HP를 그대로 가진 큰 슬라임 둘로 갈라짐 | **방어 시험**(예고된 큰 한 방) + **다수 대응**(분열) + 덱 오염 |
| 가디언 (240) | 피해를 30 받으면 형태 전환: 방어도 20, 방어 형태(공격 카드를 쓸 때마다 반사 피해 3). 전환 문턱은 매번 +10. 패턴: 충전(방어도 9) → 맹렬한 강타 32 → 증기(약화 · 취약) → 회오리 5×4 | **폭딜과 끊기**(문턱을 넘기면 강타를 피함) + 공격만 하는 덱 벌주기 |
| 헥사고스트 (250) | 2턴째 디바이더 = (HP ÷ 12 + 1) × 6. 6턴째 방어도 12 + 힘 2. 9턴째 인페르노가 덱의 화상 카드를 강화 | **스케일링 시험**(길어지면 점점 세짐 = 시간 제한) + 높은 HP 벌주기 |
| 그렘린 놉 (정예, 82~86) | 스킬 카드를 쓸 때마다 힘 +2 | 방어 · 스킬 위주 덱 벌주기 |

**[출처: [슬라임 보스](https://slaythespire.wiki.gg/wiki/Slime_Boss), [가디언](https://slaythespire.wiki.gg/wiki/Guardian), [헥사고스트](https://slaythespire.wiki.gg/wiki/Hexaghost), [그렘린 놉](https://slaythespire.wiki.gg/wiki/Gremlin_Nob)]**

### 7-2. 수치 관례 [계산 · 해석]

- **예고 길이**: 가장 큰 한 방(35)은 2턴 전부터 보여요. 다른 공격은 1턴 전(의도)에 보여요.
- **큰 한 방의 크기**: 최대 HP의 40~53%예요. 한 방에 죽지는 않지만, 방어를 놓치면 다음 전투까지 아파요.
- **끊기 문턱**: 가디언 30은 시작 덱으로 1~2턴 집중하면 넘는 값이에요. 매번 +10씩 오르니 반복할수록 어려워져요.
- **격노 · 시간 제한**은 대개 "턴 수"가 아니라 **패턴 속 강화 행동**(헥사고스트의 힘 +2와 인페르노)으로 걸어요. 보스 HP를 덱이 감당할 수 있는 턴 수와 패턴 한 바퀴(7수)를 맞춰 둔 모양이에요.
- **보스 뒤 회복**: 승천 0에서는 보스를 잡으면 잃은 HP를 100% 회복해요(승천 5부터 75%). 1막 보스전에 HP를 다 써도 다음 막은 새로 시작해요. **[출처: [승천 목록](https://www.hermitgamer.com/slay-the-spire-ascension/)]**

### 7-3. 승천(난이도 단계)의 순서

어떤 손잡이를 먼저 돌리는지 보는 사례예요. 1단계 정예 수 약 60% 증가 → 2~4단계 일반 · 정예 · 보스의 **피해** 증가 → 5단계 보스 뒤 회복 감소 → 6단계 시작 HP -10% → 7~9단계 일반 · 정예 · 보스의 **HP** 증가 → 10단계 저주 카드 → 14단계 최대 HP -4~5 → 17~19단계 적 패턴이 어려워짐 → 20단계 보스 둘. **[출처: [Hermit Gamer](https://www.hermitgamer.com/slay-the-spire-ascension/)]**

---

## 우리 게임에 대 보기

`src/data/constants.json`, `enemies.json`, `encounters.json`, `spirits.json`, `cards/*.json`, `growth.json`, `src/core/run.ts`, `tools/autoplay.ts`, `tools/sim.ts`를 읽고 사례와 다른 점만 적어요. 처방은 하지 않아요.

### 같은 점
- 마력 3, 손패 5, 1비용 피해 6 / 방어 5는 슬더슬 시작 카드와 같아요.
- 1막 보스 160은 슬더슬 1막 보스 범위(140~250) 안이에요. 파티 HP 합(기본 파티 24 + 32 + 26 = 82) 대비 약 1.95배로, 슬더슬 비율(1.75~3.1)의 낮은 쪽이에요. **[계산]**

### 다른 점 (사실)
1. **1막 길이**: 우리는 보스 전 7층(7층은 휴식, `run.ts` `FLOORS = 7`)이라 보스 전 전투는 많아야 6번이에요. 슬더슬 1막은 15층쯤이에요([미검증], AscensionAI는 1막 보스를 16층으로 적음). 보스 전까지 받는 카드 보상 수가 대략 절반 이하예요.
2. **시뮬의 조건이 런과 달라요.** `autoBattle`은 인카운터마다 새 `Run`을 만들어요. 그래서 다섯 가지가 런과 달라요.
   - 보스전도 **시작 덱 그대로**예요(보상 0장).
   - HP가 가득 찬 채로 시작해요.
   - `adult: false`라 해방을 쓰지 않아요.
   - 장비 · 레벨 성장이 없어요.
   - 14%는 슬더슬로 치면 "시작 덱으로 1막 보스" 상황이에요. 비슷한 조건의 봇 사례로는 무작위 봇이 시작 덱 비슷한 덱으로 가디언 240에 약 0.5%, 실력 있는 휴리스틱 봇이 보스전 2~18%(슬더슬2, 보상을 받은 덱)예요.
3. **자동 플레이 봇의 성격**: 공격 카드를 먼저 고르고 나머지는 무작위예요. 고른 카드는 방어부터 줄에 놓아요. 허점 창 · 차징 끊기 · 품기 · 숨기 타이밍은 따로 노리지 않아요. 사례 기준으로는 "하한선 봇"(Big Money · 탐욕 봇)에 해당해요.
4. **시작 덱 구성 (기본 파티 12장)**
   - 할퀴기 3, 막기 3, 잉걸 흩뿌리기 2(피해 3 + 화상 3), 유리벽 2(벽 5), 안개 입김 2(냉기만)예요.
   - 피해만 주는 카드는 3장, 피해가 붙은 카드는 5장이에요. 슬더슬은 10장 중 6장(아이언클래드), 12장 중 6장(사일런트)이 공격이에요.
   - 피해는 주인 파워에 비례해서, 할퀴기가 불여우 13이면 약 8, 도롱뇽 9면 약 5, 고양이 7이면 약 4예요(`pipelines.ts` power ÷ 10).
5. **막기(`basic_block`)는 대상이 자기 자신이에요.** 정령마다 자기 몸만 지켜요. 적은 대부분 `front` · `random`을 노려요. 슬더슬은 몸이 하나라 방어 카드가 늘 맞는 몸을 지켜요.
6. **보스 2페이즈**: HP 50% 아래에서 매 턴 시작에 방어도 12를 새로 얻어요. 시작 덱의 한 턴 피해(3장)가 12보다 크지 않으면 방어도를 넘기 어려워요.
   - 수액 흡수(15 회복)는 화상이 있으면 회복 대신 피해가 돼요.
   - 슬더슬 1막 보스 중 "매 턴 방어도"를 가진 보스는 없어요. 헥사고스트의 방어도 12는 7턴에 한 번이에요.
7. **큰 한 방의 크기**: 2페이즈 대지 가르기 24(차징, 앞열)와 1페이즈 가지 내리치기 14(앞열)가 있어요.
   - 정령 한 마리 HP(24~32)로 보면 24는 75~100%예요.
   - 파티 HP 합 82로 보면 29%예요. 슬더슬의 큰 한 방은 40~53%예요.
   - 맞는 몸 기준으로는 슬더슬보다 훨씬 아프고, 파티 합 기준으로는 덜 아파요.
8. **첫 판 정령 1마리**: 시작 덱이 정령당 4장이라 첫 판 덱은 **4장으로 손패 5보다 작아요.** 매 턴 덱 전체를 들고, 마력 3이라 그중 3장을 내요.
   - 몸은 하나(HP 24~32)예요. 슬더슬 캐릭터 1명(70~80)보다 HP가 약 1/3이에요.
   - 적은 파티 3마리 기준 하나뿐이에요(인원별 조정 없음, `party_size: 3`).
   - 확인된 인원 조정 사례(글룸헤이븐 · 슬더슬2)는 행동 경제가 캐릭터마다 따로라서, 우리 공유 경제와 그대로 견줄 수 없어요.
9. **정예**: 우리 정예 HP 50~60은 파티 합의 0.6~0.7배예요. 슬더슬은 플레이어 HP의 1.0~1.4배예요. 일반 적 HP 9~30도 슬더슬 일반(10~54)의 아래쪽이에요.
10. **영구 성장의 크기**: 각성체 Lv6이면 정령 하나가 HP +10(공격형 24 → 34, 약 +42%), 주 능력치 13 → 17(약 +31%), 해방(정체성 2배, 2턴)을 얻어요.
    - Hades(HP 약 +100% [미검증 시작 HP 50 기준], 부활 3)보다 작고, VS(피해 +25%, HP +30%)와 비슷한 크기예요.
    - 우리는 공격 쪽(파워)도 같이 커져요.
11. **기준선 문서에 목표 승률 · 평균 턴이 비어 있어요** (`TODO_TOKEN`). 사례에서도 봇 목표 승률을 공개한 곳은 없었고, 사람 기준점으로는 슬더슬2 커뮤니티 기록의 1막 생존 58%가 있었어요.

---

## 출처 목록

슬더슬 데이터 · 위키
- https://slaythespire.wiki.gg/wiki/Module:Enemies/data
- https://slaythespire.wiki.gg/wiki/Cards_List
- https://slaythespire.wiki.gg/wiki/Bash
- https://slaythespire.wiki.gg/wiki/Silent
- https://slaythespire.wiki.gg/wiki/Guardian
- https://slaythespire.wiki.gg/wiki/Slime_Boss
- https://slaythespire.wiki.gg/wiki/Hexaghost
- https://slaythespire.wiki.gg/wiki/Gremlin_Nob
- https://bloxodes.com/wiki/slay-the-spire-1/characters
- https://www.hermitgamer.com/slay-the-spire-ascension/

승률 · 통계
- https://ststracker.app/
- https://steamcommunity.com/stats/646570/achievements
- https://steamcommunity.com/stats/1145360/achievements
- https://steamcommunity.com/stats/2379780/achievements
- https://vegasera.github.io/2020-03-03-predicting-win-rate-and-card-combinations-slay-the-spire
- https://lr.eu.psf.lt/r/slaythespire/comments/jt5y1w/77_million_runs_an_sts_metrics_dump
- https://lr.eu.psf.lt/r/HadesTheGame/comments/jx0cds/data_chart_how_many_runs_did_it_take_to_clear_the
- https://pcgamer.com/part-of-slay-the-spires-brilliance-is-that-getting-to-the-end-isnt-the-hard-part

개발사 발언 · 패치
- https://gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder
- https://summ-www.pages.dev/en-GB/summary/slay-the-spire-metrics-driven-design
- https://sameteem.com/threads/slay-the-spire-2-patch-notes-address-base-game-difficulty-and-the-doormaker.34107/
- https://www.gamesradar.com/games/roguelike/slay-the-spire-2-devs-say-the-doormaker-boss-that-sparked-so-many-negative-steam-reviews-is-actually-slightly-weaker-than-the-other-act-3-bosses/
- https://www.pcgamer.com/games/monster-train-2-lost-arsenal-update/
- https://chucklefish.org/?p=3468
- https://press-start.com.au/news/2024/04/08/the-latest-balatro-update-has-some-massive-changes-that-should-make-winning-easier/
- https://inverse.com/gaming/hades-god-mode-interview
- https://www.siliconera.com/rogue-legacy-2-interview/
- https://allthings.how/slay-the-spire-2-co-op-multiplayer-every-mechanic-and-rule-explained/

봇 · 시뮬레이션 연구
- https://www.etc.cmu.edu/projects/ai-playtesting/?p=165
- https://tomokinotes.pages.dev/en/blog/sts2-bot-03-boss-simulator/
- https://justinochan.github.io/AscensionAI/AscensionAI_Technical_Writeup.pdf
- https://project-archive.inf.ed.ac.uk/ug4/20233951/ug4_proj.pdf
- https://forum.godotengine.org/t/tuning-a-card-roguelike-with-a-bot-120-seeded-runs-per-change-and-the-number-that-mattered-most/146538
- https://ar5iv.arxiv.org/html/1907.01623
- https://dominionstrategy.com/big-money
- https://ar5iv.labs.arxiv.org/html/2405.06846
- https://www.Gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf
- https://koaning.io/posts/playtesting
- https://arxiv.org/abs/2008.12937

설계 일반 · 인원 조정 · 성장
- https://www.cs.cornell.edu/courses/cs5152/2026sp/lectures/lecture15/slides-15.pdf
- https://saschb2b.github.io/game-mechanics/concepts/subtractive-deckbuilding
- https://mahmati.kapsi.fi/bg/gloomhaven/gloomhaven_rulebook.html
- https://hades.wiki.fextralife.com/Mirror+of+the+Night
- https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=2256
