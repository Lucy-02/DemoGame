# R1. 컨셉·프리프로덕션 단계의 코어 게임 디자인 워크플로

작성: 2026-10-30 · 리서치 에이전트(R1) · 대상: 1인 개발 정령 덱빌더(Phaser, 스팀)

> 읽는 법: 주장 뒤에 출처 URL을 붙였어요. 원문을 직접 확인하지 못하고 기억에 기댄 내용은 **[미확인]**으로 표시했어요. 이 보고서는 리서치 결과이고, 필라·판타지·세계관 같은 결정은 CLAUDE.md 규칙대로 Lucy가 골라야 해요. 아래 7장의 절차도 "Claude가 2~3안 제시 → Lucy가 선택"을 전제로 썼어요.
>
> 조사 한계: 세션의 WebFetch 한도(시간당 100회, 여러 에이전트 공유)가 중간에 소진돼서 몇몇 원문(Daniel Cook의 skill atom 글, Jagex의 GDD 기사 등)은 검색 결과 제목까지만 확인했어요. 해당 부분에 표시해 두었어요.

---

## 0. 한 줄 결론

업계의 현재 관행을 요약하면 이래요. **경험 목표(판타지)를 한 문장으로 먼저 정하고 → 3~5개 필라를 판단 기준으로 세우고 → 코어 루프를 그림 한 장으로 고정한 뒤 → 문서보다 플레이 가능한 프로토타입으로 검증하고 → 문서는 가볍게, 살아 있게 유지해요.** 이미 훅·전투 규칙·정령 3종·카드 40장·화면 설계가 있으니, 지금 할 일은 새로 만드는 것보다 **흩어진 결정을 위의 틀로 다시 묶고, 빠진 칸(필라, 코어 판타지, USP 검증, 루프 층위, 세계관)을 채우는 것**이에요.

---

## 1. 표준 단계와 단계별 산출물

### 1.1 고전적 순서: 컨셉 → 제안 → 명세

1999년 Tim Ryan의 "The Anatomy of a Design Document"는 문서를 **게임 컨셉 문서 → 게임 제안서(proposal) → 기능 명세(functional spec) → 기술 명세 → 레벨 디자인 문서** 순서로 정리했어요. 컨셉 문서의 목차는 소개, 배경(선택), 설명, 핵심 기능(Key features), 장르, 플랫폼, 컨셉 아트(선택)예요. https://www.gamedeveloper.com/design/the-anatomy-of-a-design-document-part-1-documentation-guidelines-for-the-game-concept-and-proposal
이 순서는 지금도 큰 틀로 쓰이지만, 오늘날 인디 개발에서는 "제안서" 단계가 퍼블리셔 피치나 스팀 페이지로 대체되고, "기능 명세"는 거대한 한 문서 대신 시스템별 짧은 문서로 쪼개지는 경우가 많아요.

### 1.2 프리프로덕션의 목적: "발견"은 프로덕션 전에

Mark Cerny의 "Method"는 프리프로덕션과 프로덕션을 나눠요. 프리프로덕션은 게임을 성공시킬 요소를 **발견**하는 기간이고, 프로덕션은 "히트할 걸 이미 알고 나서 그걸 납품하는" 기간이에요. "Production is not the time for teams to be discovering what will make them successful." https://mobilefreetoplay.com/why-games-fail-pre-production/
같은 글은 Cerny의 생각을 바탕으로, 전체 루프(경제, 메커닉 등 핵심 전부)가 들어간 못생기고 싼 "완전한 프로토타입"을 만들고, 실패 시나리오를 미리 상상하는 "프리-포스트모템"으로 프로덕션 진입 조건(체크리스트)을 정하라고 권해요. https://mobilefreetoplay.com/why-games-fail-pre-production/
Cerny 원 강연의 "publishable first playable" 개념과 "프리프로덕션 중에는 설계 문서를 최소화한다"는 세부 내용은 원문을 확인하지 못했어요 **[미확인]** (슬라이드: https://www.slideshare.net/holtt/cerny-method).

### 1.3 프로토타입 vs 버티컬 슬라이스

Rami Ismail은 둘을 이렇게 구분해요. **프로토타입은 "이 게임을 만들어야 하나?"**에 답하고(아이디어의 물음표를 푸는 빠르고 버리는 물건), **버티컬 슬라이스는 "이 게임을 만들 수 있나?"**에 답하는 생산 검증이에요. 슬라이스는 "모든 종류를 하나씩" 출시 품질에 가깝게 만들어 파이프라인을 한 번 끝까지 돌려 보고, 두 번째 인스턴스를 만드는 데 걸린 시간으로 전체 일정을 추정해요. 프로토타입 코드는 프로덕션에 가져가지 말라고 해요. https://ltpf.ramiismail.com/prototypes-and-vertical-slice/

### 1.4 플레이센트릭 절차 (Fullerton)

Tracy Fullerton의 *Game Design Workshop*은 ① 플레이어 경험 목표 설정 → ② 아이디어·시스템 구상 → ③ 이른 프로토타입(가능하면 종이) → ④ 플레이테스트 → ⑤ 목표 대비 평가 → ⑥ 우선순위 정해 수정 → ⑦ 반복 순서를 제시해요. 경험 목표는 "기능이 아니라 플레이어가 놓이기를 바라는 흥미롭고 독특한 상황"이고, 목표와 코어 메커닉이 잘 이해되기 전에는 프로덕션을 시작하지 말라고 해요. https://gamedeveloper.com/design/book-excerpt-game-design-workshop

### 1.5 산출물 순서 (여러 출처를 종합한 권장 순서)

| 순서 | 산출물 | 답하는 질문 | 근거 |
|---|---|---|---|
| 1 | 경험 문단 / 코어 판타지 | 플레이어가 무엇을 느끼나 | Schell 렌즈 #2, Fullerton ①, Koster의 원시트 순서 |
| 2 | 훅 + 앵커 한 줄 | 남과 뭐가 다르고, 뭐가 익숙한가 | Zukowski |
| 3 | 디자인 필라 3~5개 | 판단이 갈릴 때 무엇을 택하나 | Koster, Pears, Maine |
| 4 | 코어 루프 그림(+층위) | 무엇이 반복되나 | Cook, Roblox 문서 |
| 5 | 기능 목록 / 시스템 원페이저 | 무엇을 만들어야 하나 | Ryan, Librande |
| 6 | 프로토타입 → 플레이테스트 | 실제로 재미있나 | Blow, Fullerton, Mega Crit |
| 7 | 스토리 바이블 / 세계관 | 왜 이 세계에서 이런 일이 일어나나 | Schell 렌즈 #11(통일), Supergiant |
| 8 | 버티컬 슬라이스 | 끝까지 만들 수 있나 | Rami Ismail |

Raph Koster는 자기 원시트(one-sheet)에서 **게임 경험 문단 → 기능 목록 → 필라** 순으로 둔다고 밝혔고, 필라마다 목표 3개, 목표마다 구체 규칙을 내린다고 했어요. https://www.raphkoster.com/?p=46260

### 1.6 왜 100쪽 GDD를 안 쓰나

- Stone Librande(GDC 2010, "One-Page Designs")는 전통적 GDD는 거의 아무도 읽지 않고, 위키는 설계 요소 사이의 연결을 끊는다고 지적했어요. 대안은 여백이 많고 중심 이미지가 강하며 짧은 주석이 달린 **한 장짜리 도식**이에요. 한 장에 그리려면 문제를 깊이 이해해야 하고, 넘치면 "무엇이 정말 중요한가"를 묻게 되고, 공유가 쉬워요. 인쇄본엔 날짜를 적으라고 했고, "People will read your designs!"로 끝맺었어요. https://www.gamedeveloper.com/design/video-one-page-designs
- Supergiant의 Amir Rao는 Hades 2 1.0 직전(2025-09) 인터뷰에서 "The game is the design document."라고 했고, 미래를 길게 적은 설계 문서는 없으며 "반복을 통해 어디로 갈지 모른다"고 했어요. https://www.gamesradar.com/games/hades/the-game-is-the-design-document-hades-2-devs-dont-have-long-elaborate-plans-that-lay-out-the-future-of-the-things-were-making-because-supergiant-is-a-heavily-iterative-studio
- Koster도 팀이 필라를 잊어버리는 일이 생겨서, 설계 문서 맨 위에 관련 비전 문장을 붙이게 한 적이 있다고 했어요. 즉 **문서는 짧되, 판단 기준(필라)은 매 문서 머리에 다시 나타나게** 하는 게 실무 요령이에요. https://www.raphkoster.com/?p=46260
- Jagex의 James Sweatman이 "중앙 설계 문서가 항상 통하지는 않는 이유와 대안"을 다룬 MCV 기사가 있어요. 원문은 확인하지 못했어요 **[미확인]**. https://www.mcvuk.com/development-news/death-of-the-game-design-document/

1인 개발에 대한 시사점: 독자가 본인(과 Claude)뿐이라도 문서는 필요해요. 결정을 기억하고, 같은 논쟁을 반복하지 않기 위해서예요. 다만 형식은 **원페이저 + 결정 기록(ADR식)**이 맞아요. 이 저장소에 이미 있는 `docs/design-decisions/NNNN-*.md` 방식이 바로 그 형태예요.

---

## 2. 디자인 필라

### 2.1 정의와 개수

- 필라는 "이 게임은 무엇인가"에 대한 핵심 답이고, 게임이 탐구하고 플레이어가 느끼게 하려는 주요 요소·감정이에요. 3~5개를 권해요. 팀원이 "이 아이디어가 필라에 맞나?"를 물어서 맞지 않으면 빼는 **필터**로 써요. (Max Pears, 2017) https://www.gamedeveloper.com/design/design-pillars-the-core-of-your-game
- Stuart Maine(Wireframe 52호 인용)은 필라를 **약 3개의 짧은 문장**으로, 긍정형·능동형으로, **기능이 아니라 플레이어가 느낄 것**에 초점을 두어 쓰라고 해요. 필라는 아이디어를 만드는 도구가 아니라 길을 지키는 도구라서, **코어 컨셉이 합의된 다음에** 정해요. 매일 보이는 곳에 붙여 두고, 제안마다 "필라에 도움/중립/해로움"으로 판정하고, 일정이 밀리면 무엇을 자를지 정할 때 써요. https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/

### 2.2 좋은 필라 vs 나쁜 필라

Maine이 든 좋은 예: "Live through the apocalypse by any means necessary", "Does it make me feel loved?", "Small actions = epic reactions", "Trust the player – it's their game, let them play how they like." https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/

출처들을 종합한 판별 기준:

| 좋은 필라 | 나쁜 필라 |
|---|---|
| 플레이어의 감정·경험을 말함 ("작은 행동, 거대한 반응") | 기능 이름 ("크래프팅", "멀티플레이") |
| 무언가를 **거절**하게 만듦 (DOOM의 재장전 제거) | 모든 게임에 해당 ("재미있다", "고품질") |
| 서로 긴장 관계라 우선순위를 정해 줌 | 서로 겹치거나 동어반복 |
| 짧아서 외울 수 있음 | 문단 길이 |

참고: Pears가 든 The Last of Us(크래프팅, 스토리, AI 동료, 잠입)와 BotW(탐험, 이동, 수집, 선택지, 전투) 예시는 저자의 분석이지 개발사 공식 필라가 아니에요. 또 기능명에 가까워서 위 기준으로는 "약한" 형태예요. https://www.gamedeveloper.com/design/design-pillars-the-core-of-your-game

### 2.3 공개된 사례

| 게임 | 공개된 필라·원칙 | 필터로 쓴 예 | 출처 |
|---|---|---|---|
| **DOOM (2016)** | "Push forward combat"를 필터로. 기둥: 빠른 이동, 개성 있는 무기, 뚜렷한 AI 원형, 플레이어의 완력. 만트라 "make me think, make me move" | 재장전은 공격을 멈추게 해서 제거, 더블 점프는 거리를 좁혀서 유지, 체력·탄약은 적이 떨어뜨림(글로리 킬 보너스) | https://gdconf.com/news/speaker-qa-kurt-loudy-jake-campbell-break-combat-philosophy-doom , https://www.gamedeveloper.com/game-platforms/pushing-push-forward-combat-with-gameplay |
| **Dishonored** | 공식 "필라" 목록은 확인 못 함. GDC 2013에서 밝힌 원칙: 경로를 지시하지 말고 유도하기, 여러 방법으로 성공하기, 반응하는 세계, 탐색으로 끌어오는 서사, 플레이어가 쓰는 경험 | — | https://www.pcgamer.com/dishonored-arkane-player-improvisation |
| **Hades** | 공식 필라 목록은 확인 못 함. Kasavin이 밝힌 지향: 실험을 허용하는 설계, 겹치는 시스템, 즉시성(Bastion 계승), "죽음의 고통을 덜어서" 매 죽음이 이야기를 진전시키기, "게임이 나를 보고 있다"는 반응성 | 죽음 = 서사 보상으로 루프와 이야기를 묶음 | https://gamedeveloper.com/design/supergiant-s-fourth-outing-i-hades-i-introduces-a-more-mature-organized-dev-process , https://gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death |
| **Slay the Spire** | 공개된 "필라" 문서는 찾지 못했어요. 밝혀진 목표: "최고의 싱글플레이 덱빌더", 싱글이라 강한 콤보를 허용, 지배적 전략이 하나만 있지 않게 적을 설계, 핵심은 위험 대 보상 | 수천 장의 카드 아이디어를 영향력 큰 것만 남기고 잘라냄 | https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i- , https://justingarydesign.substack.com/p/anthony-giovannetti-crafting-slay |
| **Wildfrost** | 두 가지 원칙 "simplicity and consistency" | 턴 넘기기 버튼을 잡동사니로 보고 거절, "히트"의 정의 같은 일관성 규칙을 세움 | https://mcvuk.com/business-news/when-we-made-wildfrost/ |
| **Dead Cells** | 공식 필라는 확인 못 함. 랜덤과 큐레이션 약 50:50, 방 조각은 손으로 디자인, 불공정한 조합을 만드는 무작위 적 배치는 제거 | 불공정함을 만드는 요소를 잘라냄 | https://www.pcgamesinsider.biz/indie-interview/66988/how-motion-twin-stopped-dead-cells-being-just-another-roguelike-pixel-art-metroidvania-game/ |
| **Into the Breach** | 공식 필라는 확인 못 함. 도시 건설·연구 트리·다중 분대 등 "게임의 60%"를 잘라내고 그리드 전투만 남긴 것이 돌파구 | "작동하는 것만 남기고 나머지를 자른다" | https://kotaku.com/the-creators-of-into-the-breach-came-very-close-to-givi-1833498295 , https://pcgamer.com/into-the-breach-originally-had-city-building-and-tech-trees-creators-reveal |
| **Hollow Knight** | 공개된 필라 문서는 찾지 못했어요 **[미확인]** | — | — |

정리하면, **"필라"라는 이름으로 공식 목록을 공개한 사례는 생각보다 드물고**(DOOM은 명시적), 대부분은 인터뷰에서 원칙 형태로 드러나요. 중요한 건 이름이 아니라 **실제로 무언가를 거절할 때 근거로 쓰였는가**예요.

---

## 3. 코어 판타지와 코어 기믹(USP)

### 3.1 경험 우선 방법

- Schell 렌즈 #2(본질적 경험): "게임은 경험이 아니다. 게임은 경험을 가능하게 할 뿐이다." 질문은 ① 플레이어가 어떤 경험을 하길 바라나 ② 그 경험의 본질은 무엇인가 ③ 어떻게 담아낼 수 있나. https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
- Schell 렌즈 #11(통일): 내 테마는 무엇이고, 모든 수단으로 그것을 강화하고 있나. 렌즈 #12(공명): 내 게임에서 강력하고 특별하게 느껴지는 것, 설명할 때 사람들이 흥분하는 아이디어는 무엇인가. 같은 노트에 렌즈 #9 기본 4요소(메커닉·스토리·미학·기술이 서로 받쳐야 함)도 있어요. https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
- MDA: 디자이너는 메커닉 → 다이내믹스 → 미학 순으로 보지만, 플레이어는 미학(경험)부터 느껴요. 미학 분류 8가지는 감각, 판타지(make-believe), 서사, 도전, 교류, 발견, 표현, 시간 보내기(submission)예요. https://users.cs.northwestern.edu/%7Ehunicke/MDA.pdf
  → 실무 적용: 이 8개 중 **1~2개를 주 미학으로 고르는 것**이 코어 판타지를 정하는 가장 빠른 방법이에요. (이건 문헌을 바탕으로 한 제 추천이에요.)
- Supergiant는 컨셉을 정할 때 "팀이 공통으로 몰두하는 것의 교집합"을 최우선으로 찾고, 그 결과를 한 문장으로 만들었어요: "a roguelike dungeon crawler where you defy the god of death." https://gamedeveloper.com/design/supergiant-s-fourth-outing-i-hades-i-introduces-a-more-mature-organized-dev-process
  → 1인 개발에서는 "팀의 교집합"이 "내가 끝까지 몰두할 수 있는 것"이 돼요. Balatro의 LocalThunk도 동기가 사라지면 멈추는 습관을 말했어요. https://localthunk.com/blog/balatro-timeline-3aarh

**코어 판타지 문장 형식(권장)**: "당신은 ___이 되어 ___을 한다. 그러면 ___을 느낀다." Hades의 문장처럼 장르와 극적 동사(defy)를 한 줄에 담아요.

### 3.2 코어 기믹(USP)과 "훅"

- Chris Zukowski: "A hook is what distinguishes your game from the rest." 앵커는 타깃에게 게임을 "익숙하고 안전하게" 만드는 요소예요. "The hook gets them to your store page but the anchor is what makes them push the buy button." 예시 훅: Superhot "시간은 네가 움직일 때만 흐르는 FPS", Untitled Goose Game "당신은 거위다". 그는 스팀 구매자 조사에서 사람들이 훅보다 **익숙함**을 구매 이유로 더 자주 꼽았다고 하고, 무슨 게임인지 모를 만큼 독창적인 훅을 경계해요. https://howtomarketagame.com/2019/12/23/know-your-games-anchor/
- David Logan(Zukowski 영향)도 훅(새로운 것)과 앵커(익숙한 것)를 **한 문장에 합치라**고 하고, Shadow of Mordor(훅: 네메시스 시스템 / 앵커: 아캄식 전투)를 예로 들었어요. https://www.gamedeveloper.com/business/indie-insights-hooks-and-anchors
- Miyamoto의 "아이디어란 여러 문제를 한 번에 해결하는 것"이라는 생각은 Iwata Asks에서 이토이 시게사토가 정리하고 미야모토가 확인한 말이에요("something which solves multiple issues at once"). https://iwataasks.nintendo.com/interviews/wii/mario25th/0/4
  → 좋은 코어 기믹은 **여러 시스템 문제를 동시에 풀어요**. Hades의 "죽으면 이야기가 진행된다"는 로그라이트의 좌절과 서사 전달 문제를 한 번에 풀었어요. https://gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death

**기믹 검증 방법(문헌 종합)**

1. **한 문장 테스트**: 훅 + 앵커를 한 문장으로 말할 수 있나 (Zukowski, Logan).
2. **스크린샷 한 장 테스트**: 캡슐·첫 스크린샷만으로 장르(앵커)와 다른 점(훅)이 보이나. Zukowski는 스팀 쇼퍼가 게임 종류를 파악하려고 플레이 영상과 UI를 본다고 해요. https://howtomarketagame.com/2019/12/23/know-your-games-anchor/
3. **장난감 테스트**: Schell 렌즈 #17 "목표가 없어도 재미있나?" https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
4. **프로토타입 테스트**: 기믹만 남긴 최소판을 다른 사람이 해 보게 해요(6장).

---

## 4. 코어 루프와 메타 루프 정리

### 4.1 루프와 아크 (Daniel Cook)

루프는 "멘탈 모델 → 행동 → 시스템 → 피드백 → 모델 갱신"이 반복되는 구조이고, 여러 층에 프랙털처럼 존재하며 반복해서 쓰일 때 가치를 줘요. 아크는 한 번 경험하도록 만든 "바로 빠져나오는 끊긴 루프"(이야기, 퍼즐)라서 다시 볼수록 가치가 떨어져요. 분석 질문은 "무엇이 반복되고 무엇이 반복되지 않는가?"이고, 퍼즐·미션·서사처럼 "깰 수 있는" 것을 다 빼도 남는 루프가 버티는지로 코어를 검사해요. https://lostgarden.com/2012/04/30/loops-and-arcs
→ 이 게임에 적용하면, 전투·보상·정원 육성은 **루프**이고, 정령별 유대 에피소드와 스토리는 **아크**예요. 아크는 루프 위에 얹는 보상으로 설계하면 돼요(Hades가 그런 예예요).

### 4.2 층위로 나누어 그리기

Roblox 문서는 코어 루프를 ① 분 단위 상호작용 ② 가장 자주 반복되는 행동 ③ 진행 엔진의 세 부분으로 나누고, 세 원을 화살표로 순환시키는 그림을 권해요. 진행 엔진이 없으면 반복적이고 얕아질 위험이 있다고 해요. https://create.roblox.com/docs/production/game-design/core-loops.md

로그라이트 덱빌더에 맞춰 확장한 층위(업계 관행 종합, 제 정리):

| 층 | 시간 | 이 게임에서 | 질문 |
|---|---|---|---|
| L0 순간 | 초 | 카드 한 장 내기, 대상 고르기 | 손맛·피드백이 즉각적인가 |
| L1 턴 | 10~60초 | 드로우 → 에너지 배분 → 카드 → 적 행동 | 매 턴 의미 있는 선택이 있나 |
| L2 전투 | 2~5분 | 전투 → 보상 3장 중 1장 → **어느 정령이 배울지** 선택 | 보상이 덱 방향을 바꾸나 |
| L3 런 | 30~60분 | 정령 3 선택 → 지도 노드 → 보스 | 런마다 다른 빌드가 나오나 |
| L4 메타 | 여러 런 | 정원: 재료로 육성 → 카드 해금(보상 후보 풀 확장) → 유대 에피소드 | 다음 런을 하고 싶게 만드나 |

시간 값은 예시예요. 실제 목표 시간은 플레이테스트로 정해야 해요(CLAUDE.md 규칙상 지어낸 값을 확정하지 않아요).

### 4.3 장르 사례: 루프는 어떻게 만들어졌나

- **Slay the Spire**: 덱빌딩과 로그라이크가 "특히 강한 메커닉 조합"이라는 판단에서 출발해 Giovannetti가 설계 문서를 썼고, 카드 아이디어를 수천 개 브레인스토밍해 추린 뒤 "철저하고 광범위한 플레이테스트와 반복"을 거쳤어요. 지도 경로는 FTL에서 영감을 받아 위험/보상 판단을 겹겹이 넣으려고 넣었어요. https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-
  밸런스는 얼리 액세스 내내 지표(메트릭) 중심으로 했고, GDC 2019에서 "Metrics Driven Design and Balance"로 발표했어요. https://www.gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019 , https://www.gdcvault.com/browse/gdc-19/play/1025731
  Giovannetti는 "생각보다 더 많이 플레이테스트하라"를 원칙으로 들고, 로컬 인디 행사와 디스코드로 테스터를 모았어요. https://justingarydesign.substack.com/p/anthony-giovannetti-crafting-slay
- **Balatro**: LocalThunk의 공개 타임라인에는 설계 문서 언급이 없고, 2021-12 첫 프로토타입에 이미 CHIP × MULT 점수 체계가 있었어요("very natural for a scoring system"). 조커와 보스 블라인드는 2022-02에 들어왔고, 별도 리롤 화폐 같은 시스템은 빠르게 만들고 버렸어요. 약 300명 클로즈드 베타 이후 "플레이어 중심 개발"로 바꿨고, Slay the Spire는 2023-05에야 해 봤다고 해요(승천 시스템을 가져옴). https://localthunk.com/blog/balatro-timeline-3aarh
- **Monster Train**: 2018-09 사내 게임잼에서 나왔어요. 첫 프로토타입은 성을 지키는 실시간 게임이었고, 남은 것은 "여러 층"과 "유닛 배치의 중요성" 두 가지뿐이었어요. 이것이 "수직 다층 전투"라는 훅이 됐어요. https://www.digitallydownloaded.net/?p=42235
  GDC 2021 IGS "Monster Train Postmortem"도 있어요(세부는 확인 못 함 **[미확인]**). https://www.gdcvault.com/play/1027281/contactUs
- **Wildfrost**: 여러 프로토타입을 실패한 뒤에도 계속 **카운터(턴 타이머) 시스템**으로 돌아왔고, 개념 단계에서 **실물 카드 게임**으로 만들어 카운터 시스템을 다듬었어요. 기본 메커닉에 "수년의 반복"을 들였고, 출시 후 난이도 곡선을 더 부드럽게 했어야 했다고 돌아봤어요. https://mcvuk.com/business-news/when-we-made-wildfrost/
- **Inscryption**: Ludum Dare 43("Sacrifices Must Be Made") 48시간 잼작에서 시작했고, 코어 규칙(줄다리기 승리 조건, 희생, 레인 전투)은 "잼에서 빠르게 만들어졌다"고 해요. 오두막 퍼즐은 런마다 큰 목표로 나아가는 느낌을 주는 **메타 진행**을 위해 넣었어요. https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption
- **Hades**: 처음부터 얼리 액세스를 계획하고 월 단위 마일스톤(초반 코드 변경 → 코드 잠금 → 데이터·서사 → 폴리시 → 플레이테스트)으로 돌렸어요. https://gamedeveloper.com/design/supergiant-s-fourth-outing-i-hades-i-introduces-a-more-mature-organized-dev-process

**공통 패턴**: 장르를 정의한 게임들은 **루프를 문서로 먼저 완성하지 않았어요.** 핵심 규칙 하나(CHIP×MULT, 다층, 카운터, 희생)를 빠른 프로토타입에서 찾고, 나머지는 플레이테스트로 붙이거나 잘랐어요.

---

## 5. 체계적 방법론: 무엇을 쓸까

| 방법 | 핵심 | 1인 개발 적용도 | 출처 |
|---|---|---|---|
| **MDA** | 디자이너는 M→D→A, 플레이어는 A→D→M. 미학 8분류 | **높음**. 코어 판타지를 미학 1~2개로 좁히는 데 씀 | https://users.cs.northwestern.edu/%7Ehunicke/MDA.pdf |
| **Schell 렌즈** | 질문 목록. 본질 경험, 통일, 공명, 장난감, 루프 규칙(테스트·개선 횟수가 많을수록 좋다), 8 필터, 50% 규칙 | **높음**. 결정마다 체크리스트로 씀 | https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell |
| **Cook 루프와 아크** | 반복되는 것 vs 한 번 소비되는 것 | **높음**. 정원·스토리를 메타에 어떻게 붙일지 정할 때 | https://lostgarden.com/2012/04/30/loops-and-arcs |
| **Cook 스킬 아톰** | 행동→시뮬레이션→피드백→모델링의 최소 학습 단위와 그 사슬 | **중간**. 튜토리얼·카드 해금 순서 설계에 유용 | https://lostgarden.com/2007/07/19/the-chemistry-of-game-design/ (원문 재확인 못 함, 구성 요소는 기억 기반 **[미확인]**) |
| **Koster, 재미 이론** | 재미는 패턴을 배우는 것이고, 다 배우면 지루해진다 | **중간**. "런이 지루해지는 시점" 진단에 씀 | 기억 기반 **[미확인]**, 저자 자료: https://www.raphkoster.com/wp-content/uploads/2026/07/Theory-of-Fun-10-Years-Later.pdf |
| **Rational Game Design (Ubisoft)** | 아토믹 파라미터(난이도에 영향 주는 작은 요인, 5단계로 평가, 모호한 파라미터는 없다), 매크로 플로(학습·난이도·페이싱·다양성·동기), 새 메커닉은 소개→검증→도전 3단계 | **나중에**. 적·카드 수치 튜닝 단계에서 씀. 코어 컨셉 단계엔 과함 | https://www.gamedeveloper.com/design/rational-design-the-core-of-i-rayman-origins-i- |
| **지표 기반 밸런스(Mega Crit)** | 플레이 데이터로 카드 픽률·승률 확인 | **나중에**. 플레이테스터가 생긴 뒤 | https://www.gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019 |

**추천 조합**: 지금은 **MDA(무엇을 느끼게 할까) + Schell 렌즈(질문 목록) + Cook 루프/아크(무엇이 반복되나)** 셋이면 충분해요. Rational Design과 지표 기반 밸런스는 프로토타입이 돌아가고 테스터가 생긴 다음 단계 도구예요.

---

## 6. 프로토타입 우선 vs 문서 우선

### 6.1 현재 합의: "짧은 문서 → 바로 플레이 가능한 것"

- **Jonathan Blow**(GDC 2007 IGS): 기술이 아니라 **게임플레이를 시험**하라. 재미없는 프로토타입도 전에 없던 느낌을 주면 성공이다(Oracle Billiards → Braid). "good enough" 수준의 아이디어는 하지 마라. https://www.gamedeveloper.com/pc/gdc-prototyping-for-indie-developers
  Braid는 위에서 아래로 설계했다기보다 시스템에 질문을 던져 "발견"했다고 했어요. https://mcvuk.com/development-news/blow-braid-designed-itself
- **Fullerton**: 코드·아트 전에 종이 프로토타입으로 코어를 증명하라. https://gamedeveloper.com/design/book-excerpt-game-design-workshop
- **Schell**: "품질은 잊고 질문에 빨리 답하라." 결정 마비에 빠지지 말고 빨리 정해라. https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
- **Rami Ismail**: 프로토타입은 물음표 하나를 겨냥해 작게, 버릴 각오로. https://ltpf.ramiismail.com/prototypes-and-vertical-slice/
- **LocalThunk / Supergiant / Subset**: 각각 "설계 문서 언급 없음, 프로토타입부터"(https://localthunk.com/blog/balatro-timeline-3aarh), "게임이 곧 설계 문서"(https://www.gamesradar.com/games/hades/the-game-is-the-design-document-hades-2-devs-dont-have-long-elaborate-plans-that-lay-out-the-future-of-the-things-were-making-because-supergiant-is-a-heavily-iterative-studio), "6개월 작업을 서너 번 버렸다"(https://kotaku.com/the-creators-of-into-the-breach-came-very-close-to-givi-1833498295).
- **Mega Crit**은 반대편 예처럼 보이지만, 설계 문서로 시작한 뒤 플레이테스트와 지표로 크게 고쳤어요. https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-
- **Derek Yu**의 "Finishing a Game"은 끝내는 능력을 강조하는 글로 널리 인용돼요. 원문은 직접 확인하지 못했어요 **[미확인]**. 관련 인용글: https://www.gamedeveloper.com/business/finish-your-game
- **Chris Zukowski**: 인디에게는 디자인과 마케팅이 같은 것이라는 PC Gamer 기고가 있어요(제목만 확인 **[미확인]**). https://www.pcgamer.com/opinion-for-indie-devs-game-design-and-marketing-are-the-same-thing
- Jason Rohrer의 프로토타입 관련 견해는 찾지 못했어요 **[미확인]**.

### 6.2 이 프로젝트에 대한 시사점

이 게임은 "문서 먼저"가 이미 꽤 진행됐어요(기획서 v0.2, 화면 설계, 카드 40장). 위 사례들이 공통으로 경고하는 위험은 **코어 기믹이 플레이로 검증되기 전에 콘텐츠와 화면을 많이 만드는 것**이에요. Into the Breach는 그래서 60%를 버렸어요. https://pcgamer.com/into-the-breach-originally-had-city-building-and-tech-trees-creators-reveal
그러니 다음 순서는 문서를 더 쓰는 게 아니라, **"정령이 배우는 순간"이 실제로 재미있는지**를 시험하는 아주 작은 프로토타입이에요. Wildfrost처럼 실물 카드나 스프레드시트로도 할 수 있어요. https://mcvuk.com/business-news/when-we-made-wildfrost/

---

## 7. 이 1인 개발에 맞춘 단계별 워크플로

### 7.1 현재 상태 진단 (저장소 기준)

이미 있는 것: 훅 "정령을 키우면, 덱이 자란다", 앵커(덱빌딩 로그라이트, 비교작 Cassette Beasts·Wildfrost·Slay the Spire), 타깃, 성격 슬라이더(`design/BRAND_BRIEF.md`), 정원↔탐험 루프와 메타 진행 초안(`docs/handoff/01_기획서_v0.2.md`), 전투 규칙, 정령 3종, 카드 40장, 화면 설계.

빠진 것: ① 코어 판타지 문장 ② 필라 ③ USP를 플레이로 검증한 기록 ④ 루프 층위 그림과 층별 "재미의 질문" ⑤ 세계관·스토리 바이블.

참고로 훅과 앵커는 이미 Zukowski 방식에 거의 맞아요("정령을 키우면[훅], 덱이 자란다 + 덱빌딩 로그라이트[앵커]"). 남은 질문은 **그 훅이 메커닉으로 얼마나 깊은가**예요. 기획서상 기믹은 "보상 카드를 어느 정령이 배울지 고르고, 같은 카드도 정령에 따라 수치가 달라진다"인데, 이것이 Miyamoto식으로 **여러 문제를 한 번에 푸는지**(덱 정체성, 정령 애착, 보상 선택의 깊이) 확인하는 게 핵심이에요.

### 7.2 단계 (먼저 정할 것 → 미룰 것)

CLAUDE.md의 디자인 루프(넓게 펼치고 → 조각 고르고 → 좁히기)를 코어 디자인에도 똑같이 적용하는 형태로 짰어요. 각 단계에서 Claude는 2~3안과 근거를 내고, **Lucy가 고른 것만 확정**해요.

| 단계 | 할 일 | 산출물 | 결정자 | 지금/나중 |
|---|---|---|---|---|
| S1 | 코어 판타지 후보 3~4개. MDA 주 미학 1~2개와 묶어서 제시 | `docs/design/01-vision.md` 초안 | Lucy | **지금** |
| S2 | 필라 후보 세트 2~3개(각 3~4개 문장). 기존 결정(0001~0012)에 대입해 "이 필라였다면 무엇을 거절했을까" 시뮬레이션 첨부 | `02-pillars.md` | Lucy | **지금** |
| S3 | 루프 층위 L0~L4 그림 한 장(Librande식). 층마다 "재미의 질문" 한 줄 | `03-core-loop.md` | Lucy 확인 | **지금** |
| S4 | USP 검증 프로토타입: 정령 2~3, 카드 15장 정도, 전투 3회 + "누가 배울까" 보상만. 종이나 스프레드시트, 또는 기존 placeholder UI | 플레이 기록 + 결정 기록 | Lucy가 플레이 | **지금** |
| S5 | 세계관 방향 2~3안(톤·핵심 갈등·정원의 의미). 판타지·필라에 맞는지로 고름 | `05-world.md` 한 장 | Lucy | 판타지 확정 후 |
| S6 | 시스템 원페이저(전투, 성장, 지도, 정원, 경제). 각 머리에 관련 필라 | `systems/*.md` | 반복 | 프로토타입 후 |
| S7 | 스토리 바이블(인물, 정령별 유대 아크) | `story-bible.md` | Lucy | **미룸** (Hades처럼 루프에 얹는 아크라서 루프가 굳은 뒤) |
| S8 | 버티컬 슬라이스: 한 런을 출시 품질로 한 번 | 슬라이스 빌드 | — | **미룸** |
| — | 수치 튜닝(아토믹 파라미터), 지표 기반 밸런스, 도전 모드 사다리 | — | — | **미룸** |

먼저 정할 것: 판타지, 필라, 루프 층위, USP 검증. 이 넷이 나머지 모든 결정의 필터라서요(Maine: 필라는 코어 컨셉 합의 후 정함 https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/ ).
미룰 것: 이름, 상세 스토리, 카드 수치 튜닝, 콘텐츠 확장. 루프가 바뀌면 다시 해야 해서요.

### 7.3 문서 템플릿

**(A) 비전/컨셉 원페이저** — `01-vision.md` (한 화면 안에)
```
# 비전 (vN, YYYY-MM-DD)
상태: 초안 / Lucy 확정
## 한 문장 (high concept)        ← 훅 + 앵커 한 줄 (예: Hades "a roguelike dungeon crawler where you defy the god of death")
## 코어 판타지                    ← "당신은 ___이 되어 ___을 한다. 그러면 ___을 느낀다."
## 주 미학 (MDA 8개 중 1~2개)
## 핵심 경험 3장면                ← 플레이어가 놓일 상황 (Fullerton 경험 목표)
## 훅 / 앵커 / 비교작
## 타깃 / 플랫폼 / 세션 길이
## 하지 않을 것 (non-goals)
## 미결 질문
```

**(B) 디자인 필라** — `02-pillars.md`
```
# 디자인 필라 (vN)
## 필라 1: <짧은 능동형 문장, 감정 중심>
- 뜻:
- 그래서 하는 것 (예 2~3):
- 그래서 하지 않는 것 (예 2~3):     ← DOOM의 "재장전 제거"처럼
- 하위 목표 2~3 (Koster식)
## 필라 2 / 3 (/ 4)
## 필라끼리 충돌할 때 우선순위
## 판정 기록: 제안 → 도움/중립/해로움 (Maine)
```

**(C) 코어 루프** — `03-core-loop.md`
```
# 코어 루프 (vN)
## 그림 한 장 (L0~L4 동심원 또는 층 다이어그램)
## 층별 표: 시간 단위 / 플레이어 행동 / 선택 / 보상 / 재미의 질문
## 루프 vs 아크 (Cook): 반복되는 것 / 한 번 소비되는 것
## 진행 엔진: 런 내 성장 / 런 간 성장, 상한 규칙
## 검증 방법: 어떤 프로토타입으로, 무엇을 보면 통과인가
```

**(D) 기능/시스템 원페이저** — `systems/<시스템>.md`
```
# <시스템> (vN, YYYY-MM-DD)
관련 필라: P1, P3        ← Koster: 문서 머리에 비전 문장 붙이기
## 목적 (어떤 경험을 위해)
## 플레이어가 보는 것 / 하는 것
## 규칙 (최소한, 표 위주)
## 다른 시스템과의 연결 (도식)
## 튜닝 노브 (값은 TODO_TOKEN 또는 플레이테스트로)
## 미결 질문 / 실험 계획
## 변경 기록 → 결정 기록 링크
```

**(E) 살아 있는 GDD 구조** (위키처럼 폴더로)
```
docs/design/
  00-index.md           ← 각 문서 한 줄 요약 + 상태(초안/확정/폐기)
  01-vision.md
  02-pillars.md
  03-core-loop.md
  04-usp-validation.md  ← 프로토타입 기록, 무엇을 배웠나
  05-world.md           ← 세계관 한 장
  systems/              ← 시스템별 원페이저
  content/              ← 정령·카드 데이터 표 (src/data와 동기화)
  story-bible/          ← (나중)
docs/design-decisions/  ← 기존 ADR 그대로 사용
```
원칙: 한 문서는 한 화면 안팎(Librande). 날짜·버전 표기. 확정된 결정은 `docs/design-decisions/`와 `docs/handoff/DECISIONS.md`에 한 줄로 남겨요(CLAUDE.md 규칙).

### 7.4 Lucy가 비전공자로서 할 수 있는 판단 도구

- 필라 판정: "이 제안은 필라에 도움/중립/해로움?" 세 칸만 고르면 돼요. https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/
- 공명 질문(Schell #12): "설명할 때 사람들이 가장 반응한 부분은?" https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
- 직감 체크: Into the Breach도 결정적 판단은 "느낌이 맞지 않는다"는 직감이었어요. 플레이해 보고 느낀 것을 그대로 말해 주면 그게 데이터예요. https://pcgamer.com/into-the-breach-originally-had-city-building-and-tech-trees-creators-reveal

---

## 부록: 주요 출처 목록

- Tim Ryan, The Anatomy of a Design Document Pt.1 (1999): https://www.gamedeveloper.com/design/the-anatomy-of-a-design-document-part-1-documentation-guidelines-for-the-game-concept-and-proposal
- Stone Librande, One-Page Designs (GDC 2010): https://www.gamedeveloper.com/design/video-one-page-designs
- Cerny Method 해설: https://mobilefreetoplay.com/why-games-fail-pre-production/
- Rami Ismail, Prototypes and Vertical Slice: https://ltpf.ramiismail.com/prototypes-and-vertical-slice/
- Fullerton 발췌: https://gamedeveloper.com/design/book-excerpt-game-design-workshop
- Schell 렌즈 노트: https://notesbylex.com/the-art-of-game-design-a-book-of-lenses-2nd-edition-by-jesse-schell
- MDA 논문: https://users.cs.northwestern.edu/%7Ehunicke/MDA.pdf
- Daniel Cook, Loops and Arcs: https://lostgarden.com/2012/04/30/loops-and-arcs
- Rational Design (Rayman Origins): https://www.gamedeveloper.com/design/rational-design-the-core-of-i-rayman-origins-i-
- 필라: https://www.gamedeveloper.com/design/design-pillars-the-core-of-your-game , https://www.raspberrypi.com/news/how-pillars-and-triangles-can-focus-your-game-design/ , https://www.raphkoster.com/?p=46260
- DOOM: https://gdconf.com/news/speaker-qa-kurt-loudy-jake-campbell-break-combat-philosophy-doom
- Dishonored: https://www.pcgamer.com/dishonored-arkane-player-improvisation
- Hades/Supergiant: https://gamedeveloper.com/design/supergiant-s-fourth-outing-i-hades-i-introduces-a-more-mature-organized-dev-process , https://gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death , https://www.gamesradar.com/games/hades/the-game-is-the-design-document-hades-2-devs-dont-have-long-elaborate-plans-that-lay-out-the-future-of-the-things-were-making-because-supergiant-is-a-heavily-iterative-studio
- Slay the Spire: https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i- , https://www.gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019 , https://justingarydesign.substack.com/p/anthony-giovannetti-crafting-slay
- Balatro: https://localthunk.com/blog/balatro-timeline-3aarh
- Monster Train: https://www.digitallydownloaded.net/?p=42235
- Wildfrost: https://mcvuk.com/business-news/when-we-made-wildfrost/
- Inscryption: https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption
- Into the Breach: https://kotaku.com/the-creators-of-into-the-breach-came-very-close-to-givi-1833498295 , https://pcgamer.com/into-the-breach-originally-had-city-building-and-tech-trees-creators-reveal
- Dead Cells: https://www.pcgamesinsider.biz/indie-interview/66988/how-motion-twin-stopped-dead-cells-being-just-another-roguelike-pixel-art-metroidvania-game/
- Jonathan Blow: https://www.gamedeveloper.com/pc/gdc-prototyping-for-indie-developers , https://mcvuk.com/development-news/blow-braid-designed-itself
- 훅/앵커: https://howtomarketagame.com/2019/12/23/know-your-games-anchor/ , https://www.gamedeveloper.com/business/indie-insights-hooks-and-anchors
- Miyamoto/Itoi (Iwata Asks): https://iwataasks.nintendo.com/interviews/wii/mario25th/0/4
- Roblox 코어 루프 문서: https://create.roblox.com/docs/production/game-design/core-loops.md
