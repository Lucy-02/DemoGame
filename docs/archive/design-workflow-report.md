# 고르고, 토론하고, 기록하는 1인 디자인 루프

이 리포트는 Lucy가 만드는 정령 키우기 덱빌딩 로그라이트(PC/스팀, Phaser 4 + Vite + TS + Spine, 아트는 Lucy 맥에서 NovelAI Diffusion V5로 프롬프팅)의 브랜딩·UI/UX 워크플로를 어떻게 다시 짜면 좋을지 정리한 거예요. 결론부터 말하면, 지금 핸드오프 번들에서 빠진 것은 좋은 원칙이 아니라 **원칙을 강제하고 기록하는 장치**예요. 앞으로는 "시안 2~3개 → Lucy 선택 → 전문가 페르소나 독립 리뷰 → 와이어프레임에 꽂힌 토론 스레드 → Lucy 결정 → 결정 기록" 루프를 단계마다 돌리고, 결정된 값은 토큰 잠금 파일과 린트, 스크린샷 검사로 지켜야 해요. 연구 근거로 보면 LLM 디자인 비평은 쓸 만한 초안일 뿐 판정자가 될 수는 없어요. 제로샷 비평 중 유효한 것은 13.1%뿐이었고, 같은 성향의 에이전트끼리 토론하면 최대 86%가 그냥 합의로 무너졌어요. 그래서 페르소나는 3~5명으로 줄이고, 루브릭이 서로 겹치지 않게 나누고, 먼저 각자 따로 평가하게 하고, 한 스레드에서 에이전트 발언은 2~3회로 제한하고, 최종 판단은 항상 Lucy가 내리는 구조가 맞아요. 리뷰 보드로는 claude.ai 아티팩트(네이티브 댓글 스레드 + 공유 DB)를 기본으로 추천해요. 진실의 원천(토큰, 결정 기록, 테스트)은 저장소에 두고요. Figma는 비용과 API 제약 때문에 선택 사항으로 남겨요.

---

## 1. 요약

- **루프는 그대로, 장치는 새로.** Open Design에서 빌린 원칙(값 지어내지 않기, 회색 박스 먼저, 2~3개 방향 제시, 5축 자기 점검)과 ✅/📝/🧪 표시, 빈 값 디자인 시스템 뼈대는 그대로 둬요. 여기에 컨펌 게이트, 페르소나 리뷰, 결정 기록(ADR/DDR), 토큰 강제, TTI 출처 기록을 더해요.
- **페르소나는 판사가 아니라 감사관이에요.** 게임 UX·가독성, 아트 디렉션 일관성, 브랜드 전략, 접근성, 플레이어 페르소나까지 4~5명을 두고, 각자 다른 루브릭(Pinelle, Nielsen, 스팀덱 글자 기준, GAG/XAG 등)으로만 평가하게 해요. 매 라운드 한 명은 반대 의견 역할을 맡아요. 미적 판단("재미있다", "예쁘다")은 Lucy 몫이에요.
- **리뷰 보드는 claude.ai 아티팩트 하이브리드를 추천해요.** 페르소나 지적은 Claude가 `db`에 핀 카드로 써 넣고, Lucy는 핀마다 네이티브 댓글 스레드를 열어 "Send to Claude"로 해당 페르소나를 불러 토론해요. Claude는 네이티브 스레드를 직접 만들 수 없어서 이렇게 나눠야 해요.
- **결정은 기계가 지키게 해요.** 값은 `DESIGN_SYSTEM.md` → DTCG JSON → `tokens.ts`로 생성하고, 리터럴 값 금지 린트와 `TODO_TOKEN` 자리 표시, 1280x800 Playwright 스크린샷 검사를 Stop hook과 CI에 걸어요.
- **TTI 에셋은 전부 출처를 남겨요.** 프롬프트, 시드, 모델, 레퍼런스, 사람이 수정한 내역을 에셋마다 기록해요. 이 기록이 스팀 AI 공개 문구와 저작권(사람 기여분) 주장의 근거가 돼요. 로고, 작은 아이콘, 나인슬라이스 프레임은 TTI로 탐색만 하고 최종본은 다시 그려요.

---

## 2. 현재 방식(핸드오프 번들) 진단: 원칙은 좋고, 강제와 기록이 없어요

`/mnt/project-files/handoff-branding-uiux/`에 있는 묶음은 "Lucy 컨펌 없이 시각 요소를 확정하지 않는다"는 원칙을 아주 분명히 적어 두었어요. 이 점이 가장 큰 자산이에요. `KICKOFF_PROMPT.md`는 Lucy의 역할(TTI 프롬프팅, 브랜딩, UI/UX는 Lucy 담당, Claude는 질문하고 선택지를 내고 기록하는 역할)과 프로젝트 상태, 파일 표, 세션 목표를 한 화면에 담았어요. `DECISIONS.md`의 ✅ Lucy 확정 / 📝 Claude 초안·미검토 / 🧪 가설 구분 덕분에 에이전트가 "무엇을 다시 물으면 안 되고 무엇은 바꿔도 되는지" 알 수 있어요. 특히 MVP 정령 이름과 카드 이름을 📝로 두고 "브랜딩 결정 대상"으로 못 박은 것, 116장 테스트 이미지를 "화풍 기준으로 쓰면 안 된다"고 막아 둔 것은 연구가 경고한 "임시 에셋이 최종으로 굳는" 사고(아래 Crimson Desert 사례)를 미리 막는 좋은 습관이에요. `DESIGN_SYSTEM.md`는 Open Design의 DESIGN.md 틀을 게임용으로 바꿨어요. 속성·역할·실드·싱크로율·적 의도처럼 이 게임에만 있는 토큰과 컴포넌트를 미리 나열하고 값은 전부 비워 두었고, 상태도 ⬜ → 🟨 → ✅ 3단계로 관리해요. 이건 Open Design이 말하는 "정직한 자리 표시가 가짜 값보다 낫다"를 그대로 따른 거예요([discovery.ts](https://github.com/nexu-io/open-design/blob/main/packages/contracts/src/prompts/discovery.ts)).

그대로 가져갈 것은 다음과 같아요. 질문은 방향을 실제로 바꾸는 것만, 한 번에 5개 이내로, 이미 정한 값은 다시 묻지 않기. 값을 지어내지 않기. 2~3개 방향 제시. 회색 박스 와이어프레임 먼저. 철학·위계·완성도·구체성·절제 5축 자기 점검. 그리고 ✅/📝/🧪 표시와 빈 값 뼈대예요. 하나 주의할 점이 있어요. Open Design 0.10.0은 새 브랜드 소스가 없으면 "사용자에게 방향을 고르게 하지 말고 에이전트가 고르라"는 쪽으로 기본값을 바꿨어요([directions.ts](https://github.com/nexu-io/open-design/blob/main/packages/contracts/src/prompts/directions.ts)). Lucy의 프로젝트는 반대로 가야 해요. 업스트림을 다시 참고할 때 이 기본값이 섞여 들어오지 않게 막아야 해요.

빠진 것은 크게 일곱 가지예요. 첫째, **리뷰 루프가 없어요.** 시안을 낸 뒤의 평가는 Claude의 자기 점검뿐이에요. Claude Code 공식 가이드는 "만든 추론에 흔들리지 않는" 별도 서브에이전트 리뷰를 권하는데([Claude Code best practices](https://code.claude.com/docs/en/best-practices)), 번들에는 이런 독립 검토가 없어요. 둘째, **페르소나 비평과 토론 공간이 없어요.** Lucy가 원하는 "와이어프레임에 꽂힌 스레드에서 전문가와 토론"을 담을 그릇이 없어요. 셋째, **컨펌 게이트가 정의돼 있지 않아요.** 세션 목표는 나열돼 있지만 단계별로 Lucy가 무엇을 골라야 다음으로 넘어가는지가 없어요. 넷째, **결정 기록이 요약표뿐이에요.** `DECISIONS.md`에는 "무엇을 정했는지"만 있고 "어떤 대안을 왜 버렸는지"가 없어요. 그래서 에이전트가 이미 버린 안을 다시 제안할 수 있어요([Tian Pan](https://tianpan.co/blog/2026/07/02/the-adr-your-agent-never-read)). 다섯째, **토큰 강제가 없어요.** "값을 지어내지 않는다"는 프롬프트 문장일 뿐이라 보장이 안 돼요. Anthropic도 강조를 아무리 더해도 지켜지지 않는 규칙은 hook으로 옮기라고 해요([best practices](https://code.claude.com/docs/en/best-practices)). 여섯째, **TTI 출처 기록이 없어요.** 스팀 AI 공개와 저작권 대응에 필요한 에셋별 프롬프트·시드·모델·수정 내역 기록이 없어요. 일곱째, **플랫폼 기준이 비어 있어요.** 기준 해상도, 최소 글자 크기, 접근성 등급이 "⬜ 미정"인데, 이 중 스팀덱 9px/12px 같은 것은 취향이 아니라 외부 합격선이라 Lucy가 정할 "목표 수준"과 구분해서 미리 적어 둘 수 있어요. 그 밖에 레퍼런스 수집 단계(Lucy가 고른 레퍼런스/안티 레퍼런스), 이름·로고·캡슐 검증 절차(소리 내어 읽기, 120×45 축소, 장르 인지 테스트), 상표 검색도 빠져 있어요.

---

## 3. 리서치 핵심 발견

### 브랜딩·아트 디렉션: 전략은 짧게 먼저, 이름·로고·캡슐은 늦게

일반 브랜드 디자인 방법론은 전략을 정체성보다 앞에 둬요. Wheeler의 5단계는 조사·감사 → 전략(브랜드 브리프, 네이밍 전략, 크리에이티브 브리프) → 아이덴티티 디자인 → 터치포인트(상표 보호 착수 포함) → 자산 관리·가이드라인 순서이고, 브리프 뒤와 디자인 뒤에 "합의" 게이트가 있어요([Logo Design Love, Wheeler 요약](https://www.logodesignlove.com/brand-identity-process)). GV Brand Sprint는 이 전략 단계를 약 3시간짜리 연습 6개로 압축했어요. 20년 로드맵, What/How/Why, 핵심 가치 3개, 핵심 고객 3개, 성격 슬라이더, 경쟁 지형이고, 결과물은 한 장짜리 "브랜드 치트시트"예요([Follow the Fox](https://followthefox.substack.com/p/how-a-brand-sprint-led-to-something)). 그런데 실제 소규모 덱빌더 팀들은 순서가 달랐어요. **메커닉 프로토타입 → 핵심 UI와 가독성 제약 → 아트 스타일 적용 → 로고·캡슐은 마지막**이었어요. Cobalt Core는 UI를 "일찍 대부분 확정"한 뒤 아트를 맞췄고([Game Developer, 2024](https://www.gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat)), Balatro는 프로토타입 이름이 "Joker Poker"였고 로고 스케치는 단 한 장이었어요([80.lv](https://80.lv/articles/balatro-dev-reveals-early-development-footage-and-screenshots)). Dicey Dungeons는 기존 메커닉을 유지한 채 외형만 바꾸는 "비주얼은 메커닉을 따른다" 방식을 썼고, 애니메이션 예산을 먼저 정했어요([Cliqist](https://cliqist.com/2019/07/02/marlowe-dobbe-on-the-art-of-dicey-dungeons/)). 두 흐름을 합치면 이렇게 돼요. 반나절짜리 브랜드 전략(가치·고객·성격 슬라이더·경쟁작)을 먼저 정해서 톤의 기준선을 세우고, 이름·로고·캡슐 같은 고정 자산은 아트 스타일이 잠긴 뒤로 미뤄요.

일관성을 만든 것은 두꺼운 아트 바이블이 아니라 **제약**이었어요. Cassette Beasts는 몬스터 120종을 약 20색 공유 팔레트로 묶었고, "빨리 정하고 밀고 나간다"는 원칙을 따랐어요([Pocket Tactics](https://www.pockettactics.com/cassette-beasts/interview)). 이 사례는 팔레트 값이 아니라 "공유 제약으로 일관성을 만든다"는 절차로만 참고하세요. 반대로 2인 팀 회고에서는 "개별 에셋의 완성도보다 스타일 일관성이 중요하다"는 교훈이 나왔어요. 하루하루 달라지는 본인 스타일이 주된 실패 원인이었고요([itch.io devlog](https://itch.io/devlog/242179/devlog-09-reflections-on-our-art-direction.amp)). 스튜디오 관행에서 빌릴 만한 것은 네 가지예요. 시각 기둥마다 레퍼런스 3~5장과 스타일 밖 예시를 붙이기, 엔진 안에서 히어로 에셋 1~3개를 만들어 잠그기, 마감일이 있는 결정 게이트("계속 진화하는 무드보드는 잠긴 방향이 아니다"), 승인자 한 명([Juego Studio](https://www.juegostudio.com/blog/art-direction-in-games), [Nasty Rodent](https://nastyrodent.com/game-art-bible/)). 아트 바이블에서 리뷰 때 가장 많이 쓰이는 부분은 해도 되는 것/하지 말 것 대비 예시(안티 레퍼런스)예요([Nasty Rodent](https://nastyrodent.com/game-art-bible/)). Valorant는 실루엣과 형태 언어 같은 "고정 기본기"와 의상·장신구 같은 "바뀌어도 되는 표면"을 나눴는데([Inverse](https://inverse.com/gaming/valorant-art-style-interview-moby-francke)), 체형 템플릿에 스킨을 교체하는 Lucy의 Spine 구조와 잘 맞아요.

스팀 쪽은 기준이 분명해요. 캡슐에는 아트워크, 게임 이름, 공식 부제만 들어갈 수 있고, 라이브러리 히어로에는 글자가 없어야 하고, 로고는 투명 배경이어야 해요([Steamworks 에셋 규칙](https://partner.steamgames.com/doc/store/assets/rules)). 로고는 가장 큰 크기(메인 캡슐 1232×706)부터 디자인하고 120×45 스몰 캡슐에서 읽히는지 확인하는 게 권장 순서예요([presskit.gg](https://presskit.gg/field-guides/steam-capsule-art-guide)). 캡슐 하나 교체로 일 판매가 0~3에서 40~60(약 20배)으로 오른 사례가 있어요. 통제된 실험이 아니라 전후 비교라는 점은 감안하세요([How To Market A Game](https://howtomarketagame.com/2020/04/13/how-one-new-image-increased-sales-by-20x/)). 이름은 스팀 게임 94,371개를 분석한 결과 길이와 판매량 사이에 상관이 없었어요. 시끄러운 방에서 말해 보고 상대가 받아 적은 철자를 확인하는 테스트가 권장돼요([How To Market A Game, 2025](https://howtomarketagame.com/2025/02/03/are-game-names-getting-longer-how-to-quit-your-job-and-write-a-title-for-your-steam-game-in-2025-naming-seo-tips-faq-guide-profits-earnings-optimization/)). 스팀에는 자체 A/B 테스트가 없어요. 그래서 실제 크기 검색 그리드에 캡슐을 넣고 장르 플레이어 약 10명에게 "무슨 게임 같냐"고 묻는 무료 테스트를 먼저 하는 것이 현실적이에요([SteamPageAnalyzer](https://www.steampageanalyzer.com/blog/steam-page-ab-testing)).

### 게임 UI 프로세스·도구: 합격선은 플랫폼이 이미 정해 줬어요

게임 UI 파이프라인에 표준 정답은 없지만 **테스트 가능한 외부 합격선**은 있어요. 스팀덱 Verified는 1280x800 기준으로 가장 작은 글자가 9px 아래로 내려가면 안 되고, 12px를 권장해요. 기본 컨트롤러 설정으로 모든 콘텐츠에 접근할 수 있어야 하고, 입력 장치에 맞는 글리프를 보여 줘야 해요([Steamworks Steam Deck compat](https://partner.steamgames.com/doc/steamdeck/compat)). Blendo Games는 글자 크기 기준과 글리프 교체 시스템을 일찍 정하라고 해요. 나중에 글자를 키우면 "지저분한 레이아웃 문제"가 생기고, 덱 대응에서 가장 자주 걸리는 항목이 글자 크기라는 거예요([Blendo Games, 2026-02](https://blendogames.com/news/post/2026-02-19-steamdeckverification/)). Xbox XAG 101은 PC 본문 최소 높이를 1080p 기준 18px로 잡고, 200% 확대, 줄 간격 1.5배 이상, 한중일 언어는 줄당 40자 이하를 요구해요([Xbox XAG 101](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md)). 18px를 800p로 환산하면 약 13.3px라서 밸브의 12px 권장과 거의 맞아요. Game Accessibility Guidelines의 Basic 등급에는 "색만으로 필수 정보를 전달하지 않기", 높은 대비, 쉬운 언어가 들어 있고, Intermediate에는 맥락 도움말(덱빌더의 키워드 툴팁)과 "상호작용 요소는 상호작용 가능하다는 것을 분명히" 하기가 들어 있어요([GAG 전체 목록](https://gameaccessibilityguidelines.com/full-list/)). 이 숫자들은 "Lucy가 고르는 값"이 아니에요. 각 단계 사이의 **수락 기준**으로 그대로 쓸 수 있어요.

덱빌더에 특화된 근거는 많지 않지만 방향은 분명해요. Marvel Snap은 실물 카드 프로토타입으로 능력 문구를 짧게 유지했어요([Game Developer](https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards)). Balatro는 특정 카드를 배치해서 튜토리얼 역할을 하게 했어요("저칼로리 튜토리얼", [Game Developer](https://www.gamedeveloper.com/design/balatro-creator-unveils-a-few-slick-signposting-strategies)). Monster Train 2는 턴 결과를 미리 보여 주는 UI가 게임의 중심이라는 평을 받아요([Laura Michet](https://blog.lauramichet.com/monster-train-2/)). 정령 능력치에 따라 카드 수치가 바뀌고 실드·브레이크·차징 끊기가 있는 Lucy의 전투에서는, 적 의도와 결과 미리보기가 정보 우선순위 논의의 첫 질문이 될 거예요. 도구 쪽에서는 W3C DTCG 토큰 포맷이 2025-10-28에 첫 안정판(2025.10)을 냈어요([W3C](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)). Penpot은 DTCG를 지원한다고 문서에 적었지만, 2026-05 포럼에서 실제 내보내기 형식은 Tokens Studio 형식이라는 보고가 나왔어요([Penpot 커뮤니티](https://community.penpot.app/t/token-export-is-tokens-studio-format-not-dtcg-2025-10/10544)). 디자인 툴 프레임을 엔진 오브젝트로 자동 변환하는 도구는 Unity용조차 "아주 초기이고 버그가 많다"는 수준이에요([UnityFigmaBridge](https://github.com/simonoliver/UnityFigmaBridge)). Phaser에서 현실적인 경로는 "토큰 → 생성된 TS 상수", "스프라이트 → 나인슬라이스 데이터가 든 아틀라스"예요. TexturePacker 7.1.0 이상에서 내보낸 슬라이스 값은 Phaser 3.70 이후 자동으로 읽혀요([Phaser Nine Slice](https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice)). Phaser 4.0.0은 2026-04에 나왔고([phaser.io](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games)), rexUI도 `phaser4-rex-plugins`로 46개 컴포넌트(Sizer, Dialog, ScrollablePanel 등)를 제공해요([Rex notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/)). 에이전트가 좌표를 손으로 박지 않고 선언형 레이아웃을 쓸 수 있다는 뜻이에요.

### 에이전트 디자인 워크플로: DESIGN.md + 토큰 + 강제 검사의 3종 세트

업계 관행은 이미 한 방향으로 모이고 있어요. 사람이 읽는 `DESIGN.md`(근거, 해도 되는 것/하지 말 것, 알려진 빈칸) + 기계가 읽는 토큰 원천 + 토큰 밖 값을 거부하는 검사예요. Open Design은 DESIGN.md 문장과 `tokens.css`가 "같은 결정을 표현해야" 하고, 파생물은 손으로 고치지 않고 재생성하며, `pnpm guard`로 이를 강제해요([Open Design docs](https://github.com/nexu-io/open-design/blob/main/docs/design-systems.md)). Google의 `design.md` 스펙은 YAML 앞머리 토큰에 lint 규칙 11개(contrast-ratio, orphaned-tokens 등)와 diff, DTCG 내보내기를 붙였어요([google-labs-code/design.md](https://github.com/google-labs-code/design.md)). Lovable은 생성물마다 "원시 색 리터럴, 토큰을 우회한 일회성 값, 디자인 시스템 컴포넌트의 로컬 재구현"을 스캔하고 위반이 있으면 다시 생성해요([Lovable docs](https://docs.lovable.dev/features/design-systems)). 상용 도구가 이걸 자동화했다는 것 자체가 에이전트의 값 지어내기가 흔하다는 증거예요. Anthropic의 Claude Code 가이드는 지시를 "비결정적"(프롬프트, CLAUDE.md, 스킬)과 "결정적"(hook, deny 규칙)으로 나누고, 반드시 지켜야 하는 규칙은 hook으로 옮기라고 해요. Stop hook이 종료 코드 2를 내면 Claude는 작업으로 돌아가요(연속 8회까지)([best practices](https://code.claude.com/docs/en/best-practices)).

획일화도 실제로 일어나는 일이에요. GPT-4로 디자인 해법 4,000개를 생성해 보니 사람 해법의 다양성이 일관되게 더 높았어요([Ma et al., JCISE 2025](https://codesign.berkeley.edu/papers/ma-llmdiverse-JCISE)). NN/g는 시각 사양 없이 만든 AI 프로토타입이 "평평하고 서로 바꿔 끼울 수 있는" 화면이 된다고 했어요([NN/g](https://nngroup.com/articles/ai-prototyping/)). Anthropic도 "분포 수렴" 문제를 인정했어요. 흔한 기본값을 금지하자 모델이 그다음으로 흔한 기본값 하나로 다시 수렴했다는 거예요([Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)). 금지 목록만으로는 부족하고, **Lucy가 직접 고른 레퍼런스와 결정**이 다양성의 원천이 돼야 한다는 뜻이에요. Shin et al.은 일부러 넣는 장애물인 "생산적 마찰"이 기본값을 벗어나게 해 준다고 제안해요([arXiv 2603.13036](https://arxiv.org/abs/2603.13036)). 참고로 Anthropic Labs의 Claude Design(2026-04-17 공개)은 코드베이스에서 디자인 시스템을 만들고 Claude Code로 핸드오프 번들을 넘겨요([Anthropic](https://www.anthropic.com/news/claude-design-anthropic-labs)). 다만 결과물이 HTML이라서, 캔버스로 그리는 Phaser UI에 얼마나 쓸모 있는지는 검증되지 않았어요.

### 페르소나 비평: 근거는 "초안으로는 유용, 판정자로는 위험"

이 부분이 Lucy가 원하는 루프의 설계를 가장 많이 좌우해요. UICrit(UIST 2024)은 디자이너 7명이 화면 983개에 쓴 비평 3,059개를 모은 데이터셋이에요. 각 비평은 바운딩 박스와 "기대 기준 / 현재와의 차이 / 고치는 법" 구조를 갖고 있어요. 제로샷 Gemini 비평은 5,927개 중 **13.1%만 유효**했어요. 전문가 평가 점수는 제로샷 0.31, 퓨샷+시각 프롬프트 0.48(약 55% 향상), 사람 비평 0.75였고, 전문가들은 최선의 LLM 설정보다 사람 비평을 81% 더 선호했어요. 위치 지정은 더 약했어요. 스크린샷만 줬을 때 IoU가 0.004였고, 격자를 덮으면 오히려 더 나빠졌어요. 그리고 **비평 생성과 위치 지정을 한 번에 시키면 비평 품질이 떨어져서** 저자들은 두 호출로 나눴어요([UICrit](https://arxiv.org/html/2407.08850v3)). MeasuringU 2026 연구에서는 LLM 두 개가 사람이 검증한 문제 9개 중 4~5개를 찾았어요. AI만 찾은 문제 11개 중 진짜는 1개(9%), 오경보 7개(64%), 아예 없던 일을 지어낸 환각 3개(27%)였고, 실행할 때마다 결과가 달랐어요([MeasuringU](https://measuringu.com/does-ai-find-real-ui-problems-or-just-hallucinations/)). "MLLM as a UI Judge" 연구에서는 모델이 명료성과 시각 위계에서는 사람과 약 0.5점 차이로 가까웠지만, 사용 편의성은 과대평가하고 미적 즐거움과 "흥미로움"은 과소평가했어요([arXiv 2510.08783](https://arxiv.org/html/2510.08783v1)).

다중 에이전트 토론에도 고유한 실패 방식이 있어요. 아첨(sycophancy)이 핵심 실패 모드로, 맞는 답을 버리는 행동과 아첨의 상관이 r=0.902였어요. 같은 성향끼리의 토론은 최대 86%가 합의로 무너졌고, 둘 다 동조형인 조합이 가장 나빴어요. 동조형과 반대형을 섞고, 중앙 판정자를 두고, 라운드를 2~3회로 제한하는 것이 권고예요([arXiv 2509.23055](https://arxiv.org/pdf/2509.23055)). 페르소나 붕괴 연구에서는 LLM 8개에 상세한 인물 프로필을 줘도 응답이 몇 개 군집으로 뭉쳤고, **페르소나를 늘려도 붕괴가 줄지 않았어요**([arXiv 2604.24698](https://www.alphaxiv.org/abs/2604.24698)). 정리하면 이래요. 페르소나는 "캐릭터"가 아니라 **서로 겹치지 않는 루브릭**으로 정의하고, 3~5명만 두고, 먼저 독립 병렬로 평가하고, 증거 필드가 없으면 버리고, 토론은 사람이 이끄는 스레드에서만 짧게 하고, 미적 판단은 사람이 해요. 게임 쪽 루브릭으로는 Pinelle의 게임 사용성 휴리스틱 10개(108개 게임 리뷰, 문제 285개에서 도출. "게임 상태의 명확한 표시", "세세한 관리를 줄이는 읽기 쉬운 시각 요소" 등)가 근거가 있어요([Pinelle CHI'08](https://course.ccs.neu.edu/is4300f15/ssl/pinelle-chi08.pdf)). 구현 수단으로는 Claude Code 서브에이전트(`.claude/agents/*.md`)가 각자 독립된 컨텍스트, 도구 허용 목록, 모델을 가지고 기본 20개까지 동시에 돌 수 있어서 이 구조에 잘 맞아요([Claude Code subagents](https://code.claude.com/docs/en/sub-agents.md)). 다만 게임 UI를 LLM 페르소나로 비평하거나 사람-에이전트가 스레드로 토론하는 것을 직접 평가한 연구는 아직 없어요. 이 루프는 근거에서 추론한 설계라는 점을 기억해 두세요.

### TTI 파이프라인·법적 이슈: V5와 V4.5를 나눠 쓰고, 모든 것을 기록하기

NovelAI Diffusion V5는 공식 문서에 "최신 이미지 생성 모델"로 올라 있어요([NovelAI Docs](https://docs.novelai.net/en/image/models)). 2차 보도에 따르면 출시일은 2026-08-21이고, 네이티브 투명 배경을 지원해요. 하지만 **Precise Reference(캐릭터/스타일 레퍼런스)와 Vibe Transfer는 V4.5에서만 돌아요**([weavai.app](https://weavai.app/blog/2026/08/29/novelai-diffusion-v5-review-anime-character-art/)). 공식 문서도 Precise Reference는 V4.5 전용이고 Vibe Transfer와 함께 쓸 수 없다고 적고 있어요([NovelAI Precise Reference](https://docs.novelai.net/en/image/precisereference)). 사용자 LoRA 학습은 없으니, 일관성은 고정 프롬프트 블록, 레퍼런스 키트(`.naiv4vibe` 파일, PNG 메타데이터), 시드 기록, 컨택트 시트 선별, 사람의 페인트오버로 만들어야 해요([Vibe Transfer 문서](https://docs.novelai.net/en/image/vibetransfer)). Download 버튼으로 받은 PNG에는 프롬프트, 시드, 바이브가 메타데이터로 남아서 재현에 쓸 수 있어요. 자동화는 조심해야 해요. 인기 있던 비공식 Python 래퍼는 2024-08-31에 보관(archived) 처리됐고([GitHub](https://github.com/HanaokaYuzu/NovelAI-API)), 자동 접근에 관한 ToS 조항은 이번 조사에서 원문을 확인하지 못했어요.

법·플랫폼 쪽에서는 이래요. 스팀은 2026-01-16 개정으로 코딩 보조 같은 "효율 도구"는 공개 대상에서 뺐지만, 출시물과 **마케팅 자료에 들어가는 사전 생성 AI 콘텐츠는 여전히 공개 대상**이에요([Tech Insider](https://tech-insider.org/steam-ai-disclosure-2026)). 공개가 자발적인지 의무인지는 보도마다 엇갈리는데([GIGAZINE](https://gigazine.net/gsc_news/en/20260120-steam-updates-ai-disclosure-guidelines)), 의무로 보고 대비하는 게 안전해요. 2025년 10월 Next Fest에서는 데모 504개(약 17%)가 생성형 AI 사용을 공개했어요([PCGamesN](https://www.pcgamesn.com/steam/next-fest-generative-ai)). 미국 저작권청은 프롬프트 입력만으로는 저작권이 생기지 않는다고 봐요. 다만 AI 요소가 들어갔다고 사람이 만든 전체 저작물의 보호가 사라지지는 않아요([Lowenstein Sandler](https://www.lowenstein.com/news-insights/publications/client-alerts/us-copyright-office-issues-report-on-copyrightability-of-generative-ai-outputs-ai)). 한국도 AI만으로 만든 결과물은 보호 대상 저작물이 아닌 "산출물"이고, 사람이 창작적으로 기여한 부분만 보호한다는 입장이에요([Daum 뉴스, 2026-04-21](https://v.daum.net/v/20260421144511956)). AI로 만든 로고도 상표 등록은 가능하지만, 학습 데이터를 재조합하기 때문에 기존 상표와 닮을 위험이 있어 철저한 검색이 필요해요([Gerben Law](https://www.gerbenlaw.com/blog/ai-guided-trademark-development-mitigating-infringement-risks/)). 반발 사례는 대부분 **공개하지 않았거나** 눈에 띄게 품질이 낮은 AI 아트에서 나왔어요. Jurassic World Evolution 3는 AI 초상화를 빼야 했고([Hitmarker](https://hitmarker.net/news/frontier-announces-it-will-remove-ai-artwork-from-jurassic-world-evolution-3-following-player-backlash-1473986)), Crimson Desert는 초기 실험용 AI 소품이 "의도치 않게" 남아 있다가 발견돼 패치로 교체했어요([GIGAZINE](https://www.gigazine.net/gsc_news/en/20260323-crimson-desert-ai-art)). 임시 에셋 태깅과 출시 전 점검이 왜 필요한지 보여 주는 사례예요.

---

## 4. 후보 워크플로 3개 비교: 보는 곳, 토론하는 곳, 진실이 사는 곳

세 후보는 "Lucy가 시안을 어디서 보고 어디서 토론하는가"에서 갈려요. 세 후보 모두 토큰·결정 기록·테스트는 저장소에 둔다고 가정해요.

| 기준 | A) Figma/Penpot 중심 | B) 코드 우선 + 로컬 리뷰 보드 | C) claude.ai 아티팩트 리뷰 보드 |
| --- | --- | --- | --- |
| Lucy가 시안을 보는 방법 | 디자인 툴 캔버스. 직접 픽셀을 밀 수 있음 | 맥에서 Vite 개발 페이지(`localhost`). 맥 앞에서만 | 브라우저/모바일 어디서나 비공개 URL로. 공유도 가능 |
| 스레드 토의 | Figma 댓글 API에 핀 위치·답글이 있지만 **resolve 엔드포인트가 없음**. Penpot은 셀프호스트 커뮤니티 MCP에 resolve 있음 | 자체 스키마라 무엇이든 가능. 대신 UI와 알림을 직접 만들어야 함 | 네이티브 댓글 스레드 + `customAnchors`로 캔버스·이미지 위 핀. 페이지가 앵커 위치에서 작성창을 열 수 있음 |
| 에이전트 읽기/쓰기 | Figma: PAT로 읽기/쓰기, View/Collab 좌석은 분당 5회. Penpot: 플러그인 창을 열어 둬야 함 | 파일 직접 편집. 가장 쉬움 | 모든 스레드를 읽을 수 있지만, **Lucy가 "Send to Claude"/@claude로 보낸 스레드에만 답하거나 resolve 가능.** 새 네이티브 스레드는 못 만듦 → 지적 카드는 `db`에 씀 |
| 세션 깨우기 | 웹훅/폴링을 직접 구성 | 파일 감시나 수동 | "Send to Claude"가 Claude 세션을 깨움. 프로젝트 스레드도 Lucy 메시지로 깨어남 |
| 비용 | Figma MCP 무료 등급은 월 6회. 실사용엔 Dev/Full 유료 좌석 필요(2026 가격 미확인). Penpot은 무료(Docker) | 무료 | 기존 claude.ai 플랜 안에서 |
| Phaser 캔버스 화면 적합성 | 프레임→Phaser 자동 변환은 손실이 큼. 토큰 추출과 레퍼런스 스크린샷 용도가 현실적 | 최고. Phaser 씬을 그대로 띄우고 스크린샷에 정규화 좌표 핀 | 좋음. Playwright 스크린샷을 `assets`로 올려 그 위에 핀. HTML 와이어프레임도 그대로 |
| 셋업 난이도 | 중(Figma 좌석·MCP) ~ 상(Penpot 셀프호스트) | 중. 보드 페이지·저장·알림을 만들어야 함 | 낮음. 아티팩트 한 장과 capability 선언 |
| 주요 리스크 | 유료 좌석 의존, 레이트 리밋, 웹 중심 출력(React+Tailwind) | 맥 앞에 있어야 함, 보드 유지보수가 부채, 알림 부재로 루프가 멈춤 | 런타임이 세션 내에서만 확인됐고 공개 문서는 아님. 네이티브 스레드 생성 불가라서 하이브리드 구조가 필수. 큰 기록은 저장소로 옮겨야 함 |

**A안**은 Lucy가 디자인 툴 안에서 직접 손으로 레이아웃을 만지고 싶을 때 강해요. Figma MCP는 성숙했고, `get_variable_defs`로 변수를 뽑는 데는 정말 유용해요. 하지만 무료 등급의 월 6회 호출 제한 때문에 사실상 유료 기능이고([mcp-server-guide](https://cdn.jsdelivr.net/gh/figma/mcp-server-guide@main/README.md)), 코드 출력은 기본적으로 React + Tailwind라서 Phaser GameObject로 바로 이어지지 않아요. 댓글 API에는 resolve가 없어서([figma-comments-mcp](https://glama.ai/mcp/servers/junsimon/figma-comments-mcp)) "해결됨" 상태를 답글로 흉내 내야 해요. View/Collab 좌석의 분당 5회 제한은 페르소나 5명이 각자 지적 5개씩만 올려도 걸려요([Figma rate limits](https://developers.figma.com/docs/rest-api/rate-limits)). Penpot은 무료이고 셀프호스트 커뮤니티 MCP에 댓글 생성·답글·resolve가 다 있지만([ancrz/penpot-mcp-server](https://github.com/ancrz/penpot-mcp-server)), Docker 운영과 열어 둬야 하는 플러그인 창, 토큰 내보내기 형식 불일치가 1인 개발자에게는 운영 부담이에요.

**B안**은 연구 노트가 가장 추천한 구조예요. Phaser는 캔버스에 그려서 DOM 앵커가 없으니, 스크린샷 위에 0~1로 정규화한 좌표로 핀을 꽂는 방식이 HTML 와이어프레임과 게임 화면 모두에 똑같이 통해요. 서브에이전트가 `reviews/<round>/threads.json`을 일반 Read/Edit로 고칠 수 있어서 MCP도 필요 없어요. 약점은 운영 쪽이에요. Lucy가 맥 앞에 있어야 보드를 볼 수 있고, 답글을 저장해도 Claude를 깨우는 알림 구조를 따로 만들어야 하고, 보드 자체가 또 하나의 유지보수 대상이 돼요.

**C안**은 B안의 "핀 + JSON" 발상을 claude.ai 아티팩트 런타임으로 옮긴 거예요(claude.ai Artifact 런타임 문서 (세션 내 확인, 2026-10-28)). 페이지는 비공개가 기본이고 공유할 수 있어요. 여기에 `comments`(네이티브 댓글 스레드, `customAnchors`로 캔버스·이미지 위 핀 위치를 페이지가 직접 지정), `db`(Claude가 ArtifactData 도구로 채우고 읽고 쓰는 공유 문서), `assets`(스크린샷 업로드), `user`, `sample`(페이지가 Claude에게 질문) 기능을 선언할 수 있어요. 제약이 하나 결정적이에요. Claude는 모든 스레드를 읽을 수 있지만, **Lucy가 "Send to Claude"나 @claude로 보낸 스레드에만 답하거나 resolve할 수 있고, 새 네이티브 스레드는 만들 수 없어요.** 그래서 하이브리드 구조가 자연스러워요. 페르소나 지적은 Claude가 `db`에 "핀 카드"로 쓰고 와이어프레임 위에 핀으로 그려요. Lucy가 어떤 핀에서 네이티브 스레드를 열어 반박하거나 질문한 뒤 Send to Claude를 누르면, 세션이 깨어나 해당 페르소나 에이전트가 그 스레드에 답해요. 2~3개 시안 중 Lucy의 선택도 `db`에 기록돼요. 이 프로젝트는 Lucy 메시지로 Claude 스레드가 깨어나는 프로젝트 채팅 구조도 쓰고 있어서, 아티팩트에서 토론하고 프로젝트 스레드에서 단계 전환을 지시하는 이중 동선이 이미 갖춰져 있어요.

**추천: C를 리뷰 표면으로, B의 저장소 구조를 진실의 원천으로, A는 선택 사항으로.** 아티팩트는 Lucy가 어디서든 보고 토론하는 곳이에요. 저장소(`docs/design-decisions/`, `design/tokens/`, `design/reviews/` 아카이브, `assets/provenance.jsonl`)는 결정과 값이 영구히 사는 곳이에요. 라운드가 끝나면 Claude가 아티팩트 `db`의 카드·선택·스레드 요약을 저장소로 옮겨 적어요. Lucy가 특정 화면(예: 상점 패널 구성)을 직접 픽셀 단위로 다루고 싶어지면, 그때 Penpot이나 Figma를 "Lucy의 스케치 패드"로 붙이고 토큰만 읽어 오는 정도면 충분해요. C안의 런타임 동작은 이 세션에서 확인한 사실이지만 공개 문서로 교차 확인한 것은 아니에요. 그러니 첫 라운드를 파일럿으로 돌려서 "Send to Claude → 페르소나 답변" 왕복이 실제로 매끄러운지 확인하는 게 좋아요. 안 되면 B안으로 내려갈 수 있게 카드 스키마를 두 안에서 똑같이 쓰도록 설계했어요.

---

## 5. 추천 파이프라인과 반복 루프

### 단계별 파이프라인: 여덟 단계, 단계마다 Lucy가 고르는 것 하나

아래 순서는 Wheeler/GV 방식의 "전략 먼저"와 인디 사례의 "UI·가독성 먼저, 이름·로고·캡슐은 나중"을 합친 거예요. 모든 단계에서 시각 값(색, 폰트, 이름, 비주얼)은 Lucy만 정해요. Claude는 선택지와 근거, 와이어프레임, 기록을 맡아요.

| 단계 | 목표 | Claude가 하는 일 | Lucy가 하는 일 | 도구 | 산출물 | 컨펌 게이트 (Lucy가 고르는 것) |
| --- | --- | --- | --- | --- | --- | --- |
| P0 브랜드 전략 | 톤의 기준선과 "누구를 위한 무엇"을 정하기 | GV Brand Sprint 6개 연습을 1인용 질문지로 진행. 가치·고객·성격 슬라이더·경쟁작(스팀 덱빌더/육성물) 정리안을 2~3개 포지셔닝 문장으로 제시 | 답변, 경쟁작 선정, 포지셔닝 1개 선택 | 프로젝트 스레드 + 아티팩트 | `brand/BRIEF.md`(한 장), 훅·장르 한 문장 후보 | 포지셔닝 문장과 성격 슬라이더 위치 |
| P1 아트 디렉션 | 화풍 기준과 일관성 제약을 잠그기 | 시각 기둥 틀 제시(기둥마다 레퍼런스 3~5장 + 스타일 밖 예시 칸), TTI 프롬프트 시트 구조(고정 스타일 블록 / 에셋 유형 블록 / 개별 블록) 작성, 컨택트 시트 생성 스크립트, 체형 템플릿 재검증 계획 | **레퍼런스와 안티 레퍼런스를 직접 고름**, NAI 태그 작성·생성·선별, 전투 화면 기준 스타일 테스트 1~3장 선택 | Lucy 맥(NovelAI), ImageMagick 컨택트 시트, 아티팩트 | `art/ART_BIBLE.md`(1~2장, 제약 + on/off 이미지 격자), 히어로 에셋 1~3개, 프롬프트 시트 | 화풍 방향 1개와 마감일 있는 잠금 |
| P2 UI 정보구조·흐름 | 화면별 정보 우선순위와 화면 흐름 | `03` 목록을 바탕으로 화면별 정보 순위 초안과 흐름도(정원 ↔ 출전 준비 → 지도 → 전투/보상/상점/이벤트/휴식 → 런 종료)를 2~3안으로. 적 의도·결과 미리보기 같은 장르 패턴을 질문으로 제시 | 화면별 "가장 먼저 읽혀야 할 것" 순위 확정 | 아티팩트(흐름도), 저장소 | `ui/IA.md`, 흐름도 | 정보 우선순위와 흐름 1안 |
| P3 회색 박스 와이어프레임 | 구조만으로 레이아웃 비교 | 1280x800 기준 회색 박스(라벨 붙은 사각형만)를 화면당 2~3개 구조안으로. 전투 화면부터. 가능하면 Phaser 씬으로 직접 그려 실제 크기로 캡처 | 구조안 선택, 스레드 토론 | Phaser 디버그 씬 + Playwright 캡처 → 아티팩트 | `design/reviews/R-xx/`, 선택 기록 | 화면별 구조안 1개 |
| P4 하이파이 목업 | 선택한 구조에 아트·타이포·상태 입히기 | Lucy가 정한 값만 사용하고, 없는 값은 `TODO_TOKEN`. 시안 대신 한 변형 안의 "트윅"(간격·위계·강조 위치)으로 다듬기 | 미정 값 결정(🟨 → ✅), 최종 목업 승인 | 엔진 내 목업 + 아티팩트. 원하면 Penpot/Figma 스케치 | 목업 스크린샷 세트 | 화면별 목업 승인 + 새 토큰 값 |
| P5 디자인 시스템·토큰 | 결정을 기계가 지키는 형태로 | `DESIGN_SYSTEM.md` 채우기(Lucy 확정 값만), DTCG JSON 작성, `tokens.ts` 생성 스크립트, 린트·hook 설정, 컴포넌트 목록과 상태표 | 토큰 "승격" 승인(사람만 실행 가능한 `/design-gate` 스킬) | Style Dictionary/Terrazzo 또는 소형 코드 생성, ESLint | `design/tokens/*.json`, `src/design/tokens.ts` | 토큰 세트 버전 잠금 |
| P6 엔진 구현 | Phaser 씬·UI 구현 | rexUI 사이저, NineSlice + 아틀라스, 토큰 import. 게임 로직(`src/core`, `src/data`)은 건드리지 않음 | 구현 화면과 목업 비교 승인 | Phaser 4, rexUI, TexturePacker | `src/scenes`, `src/ui` | 화면별 "목업과 같음" 승인 |
| P7 플레이테스트·검증 | 외부 합격선과 실제 플레이어 반응 | 1280x800 글자 높이 검사, 컨트롤러 도달성 체크리스트, 회귀 스크린샷, 처음 하는 사람용 테스트 스크립트, 캡슐 그리드 테스트 준비 | 테스터 섭외·관찰, 결과에 따른 수정 우선순위 결정 | Playwright, (가능하면) 스팀덱 실기 | 검증 리포트, 수정 백로그 | 출시 가능 여부, 수정 우선순위 |

이름·로고·캡슐은 별도 트랙(B-트랙)으로 P1 화풍이 잠긴 뒤 시작하고, 스토어 페이지 전에 끝내요. 순서는 훅 문장 → 이름 후보(Lucy가 고른 후보만 소리 내어 읽기 테스트, 스팀·구글 검색 중복 확인, KIPRIS/USPTO 상표 검색) → 마스터 키아트 브리프 → 로고(큰 크기로 디자인하고 120×45에서 검증) → 캡슐 세트 → 장르 플레이어 약 10명 대상 실제 크기 그리드 테스트예요. 정령·카드·성격 이름(📝 초안)을 그대로 쓸지는 이 트랙의 "네이밍 규칙" 게이트에서 Lucy가 정해요.

### 반복 루프: 발산 → 선택 → 독립 리뷰 → 핀 스레드 → 토론 → 종합 → 결정 기록

모든 단계(P0~P7)는 같은 루프를 돌아요. 한 바퀴는 다음과 같아요.

**① 브리프와 차별화 축 선언.** Claude는 이번 라운드에서 무엇을 정하는지, 이미 확정된 것(✅)과 기각된 것(결정 기록), 그리고 시안끼리 **어느 축에서 다르게 만들지**를 먼저 적어요. 축은 정보 밀도, 위계 중심, 손패/유닛 배치 구조처럼 구조나 톤의 축이고, 색이나 폰트 같은 값의 축이 아니에요. 축을 명시하지 않은 "시안 3개"는 비슷한 것끼리 모이기 쉬워요. 이 단계에서 Lucy가 고른 레퍼런스(P1의 on/off 격자)를 반드시 인용해요. 레퍼런스가 없는 라운드는 시작하지 않는 것이 "생산적 마찰" 규칙이에요.

**② 발산: 2~3개 시안.** 회색 박스 단계에서는 Open Design의 `wireframe-greybox` 원칙("구조만, 실제 색·문구·이미지 없음")을 따르고 "와이어프레임"이라고 분명히 말해요. 시안마다 근거 한 단락과 Open Design 5축 자기 점검 점수를 붙여요. 3점 미만인 축이 있으면 고친 뒤에 내요.

**③ Lucy 선택.** 아티팩트에서 시안을 나란히 보고 하나를 고르거나 섞어요("A의 손패 + B의 적 의도"). 선택과 이유 한 줄은 `db`의 `choices` 문서에 기록돼요. 고르지 않은 시안은 버리지 않고 "기각, 사유"와 함께 결정 기록 후보로 남겨요.

**④ 독립 병렬 1차 리뷰.** 선택된 시안의 스크린샷을 페르소나 서브에이전트 4~5개가 **서로의 결과를 보지 않은 채** 동시에 평가해요. 페르소나마다 지적은 최대 5개이고, "내 영역에는 문제 없음"이라고 답할 수 있어요. 이건 아첨 전염을 막는 장치예요. UICrit 교훈에 따라 **비평 호출과 위치 지정 호출을 나눠요.** 비평 단계에서는 "어떤 요소의 어떤 문제인지"를 요소 ID로만 말하고, 위치 지정 단계에서 그 요소 ID를 좌표로 바꿔요. 이때 좌표는 모델이 픽셀을 눈으로 읽어서 정하지 않아요. 와이어프레임을 Claude가 직접 생성했으니 **레이아웃 소스(HTML 요소 경계, Phaser 씬의 GameObject 경계를 내보낸 JSON)에서 정확한 좌표를 계산**해요. 이 방식이면 UICrit에서 IoU 0.004로 실패했던 위치 지정 문제를 대부분 피할 수 있어요.

**⑤ 종합자(synthesizer) 정리.** 메인 세션이나 별도 종합자 에이전트가 중복을 합치고, 증거가 스크린샷에서 보이지 않는 지적(환각 의심)은 버리고, 심각도순으로 정렬해요. 페르소나끼리 부딪히는 지점(예: 접근성은 정보를 더 넣자, 아트 디렉터는 덜어내자)은 "충돌" 카드로 따로 표시해서 Lucy가 판정하게 해요. 정리된 카드는 아티팩트 `db`의 `review_cards`에 쓰여서 와이어프레임 위 핀으로 그려져요.

**⑥ 핀 스레드 토론.** Lucy는 핀 카드를 읽고 관심 있는 핀에서 네이티브 댓글 스레드를 열어요. "이건 의도한 거예요, 왜 문제라고 봐요?"처럼 반박하거나 질문한 뒤 Send to Claude(또는 @claude)를 누르면 세션이 깨어나고, 해당 카드의 페르소나 에이전트가 그 스레드에 답해요. 규칙은 네 가지예요. 에이전트는 **한 스레드에서 최대 2~3번만** 발언해요. 새 근거 없이 같은 주장을 반복하면 거기서 멈춰요. 반대 의견 역할을 맡은 페르소나는 Lucy 의견에 바로 동의하지 않고, 가장 강한 반론을 한 번은 내야 해요. 그리고 Lucy가 "결정"이라고 쓰면 토론이 닫혀요. 각 카드는 Lucy가 수락 / 기각 / 보류 중 하나로 처리해요.

**⑦ 종합과 결정 기록.** 라운드가 끝나면 Claude가 수락한 수정을 반영한 다음 버전을 만들고, `docs/design-decisions/NNNN-<주제>.md`에 ADR 형식으로 기록해요. 내용은 맥락, 고려한 선택지(기각된 시안 포함), Lucy의 결정, 근거, 결과, 상태(제안됨 / 수락됨 / 대체됨)예요. 수락된 기록은 고치지 않고, 바꿀 때는 새 기록으로 대체해요. `DECISIONS.md`에는 한 줄 요약과 링크만 추가해요. CLAUDE.md에는 "제안 전에 결정 기록을 확인하라, 기각된 선택지는 새 근거 없이 다시 제안하지 않는다"는 한 줄을 넣어요. 낡은 기록은 없는 것보다 해로우니 대체 표시를 꼭 해요([Tian Pan](https://tianpan.co/blog/2026/07/02/the-adr-your-agent-never-read)).

**⑧ 다음 라운드 또는 다음 단계.** 같은 단계에서 다듬을 게 남았으면 이번엔 발산하지 않고 한 시안 안에서 트윅만 해요(Open Design의 "중반부에는 트윅"). 게이트 조건을 채웠으면 다음 단계로 넘어가요. 한 단계에서 라운드는 3회 정도가 상한이라고 정해 두는 게 좋아요. 인디 사례들도 반복 횟수가 적었어요(VFX 약 3회, 로고 스케치 1장).

### 페르소나 구성: 네 명의 감사관, 한 명의 플레이어, 돌아가며 맡는 반대자

페르소나는 "성격"이 아니라 **관할 범위, 루브릭, 범위 밖 목록**으로 정의해요. 모델이 비교적 정확한 구체적 차원(위계, 명료성, 일관성, 가독성)만 다루게 하고, "재미있다", "예쁘다", "느낌" 같은 판단은 명시적으로 범위 밖에 둬요.

| 페르소나 | 관할 | 루브릭(ID 체계) | 범위 밖 |
| --- | --- | --- | --- |
| 게임 UX·가독성 리뷰어 | 전투·지도·보상 화면의 상태 표시, 읽는 순서, 조작 흐름, 결과 예측 가능성 | Pinelle 게임 휴리스틱 10개(`PIN-1`~`PIN-10`), Nielsen 10(`NN-1`~`NN-10`), 스팀덱 텍스트 9px 하한/12px 권장(`SD-TXT`), 컨트롤러 도달성(`SD-CTL`) | 색·폰트 선택, 아트 품질 |
| 아트 디렉터(일관성 감사) | Lucy가 고른 시각 기둥·레퍼런스 대비 일관성, 실루엣·아이콘 영역 규칙, 아트와 UI의 위계 관계, TTI 적합성 | `ART_BIBLE.md`의 기둥 ID(`AB-P1`…), on/off 예시 대비(`AB-ONOFF`), 고정 기본기 vs 바뀌어도 되는 표면(`AB-CORE`/`AB-SURF`) | **새 스타일 제안 금지.** Lucy 레퍼런스에 없는 방향 제시 금지 |
| 브랜드 전략가 | 포지셔닝·성격 슬라이더와의 정합성, 용어·톤 일관성, 스팀 에셋 규칙, 이름·로고 검증 절차 | `BRIEF.md` 항목(`BR-…`), 스팀 캡슐 규칙(`ST-CAP`), 120×45 축소(`ST-SMALL`), 소리 내어 읽기·상표 검색(`NM-…`) | 레이아웃 세부, 이름 후보 창작(후보는 Lucy 요청이 있을 때만) |
| 접근성 감사관 | 색 단독 정보, 대비, 글자 크기·간격, 확대, 쉬운 언어, 툴팁 | GAG Basic/Intermediate 항목(`GAG-B-…`/`GAG-I-…`), XAG 101(`XAG101-…`), 대비 검사(`CONTRAST`) | 미적 판단 |
| 플레이어 페르소나 | 처음 하는 사람이 이 화면에서 무엇을 이해하고 무엇을 놓치는지 | 과업 시나리오 체크(`TASK-…`: "적이 다음에 뭘 할지 3초 안에 말할 수 있나", "이 카드가 어느 정령 것인지" 등), 학습 부담 | 전문 휴리스틱 인용(그건 다른 페르소나 몫) |
| (역할) 반대자 | 매 라운드 위 다섯 중 하나에 추가로 부여 | "가장 강한 반론 1개"를 낼 의무. Lucy의 선택이 틀렸을 경우의 시나리오 제시 | 반대를 위한 반대(증거 필드 필수) |

플레이어 페르소나는 붕괴 연구를 고려해 **한 명만** 두고, 덱빌더 숙련자와 장르 입문자 중 이번 라운드에서 어느 쪽을 쓸지 Lucy가 정해요. 한 번에 여러 명을 만드는 건 근거상 이득이 없어요. 반대자 역할은 고정하지 않고 돌아가며 맡아요. 같은 에이전트가 늘 반대하면 그것도 하나의 패턴으로 굳으니까요. 실제 플레이어 테스트(P7, 장르 인지 테스트 약 10명)는 페르소나가 대신할 수 없어요. 파이프라인에 반드시 남겨 둬요.

### 지적 카드 스키마

모든 페르소나는 UICrit/Sadler 구조(기대 기준 → 관찰된 차이 → 고치는 법)에 심각도, 휴리스틱 ID, 증거, 위치를 더한 형식으로만 답해요. 아티팩트 `db`와 로컬 JSON에서 똑같이 써요.

```json
{
  "id": "R03-UX-002",
  "round": "R03",
  "stage": "P3",
  "option_id": "B",
  "persona": "game-ux",
  "dissent_role": false,
  "heuristic_id": "PIN-8",
  "severity": 3,
  "target_element": "enemy.intent[0]",
  "pin": { "image": "R03/B/battle@1280x800.png", "x": 0.62, "y": 0.18, "w": 0.08, "h": 0.06, "source": "layout-dump" },
  "standard": "적의 다음 행동과 피해량은 손패를 보기 전에 읽혀야 한다 (Lucy 확정 정보 우선순위 #1)",
  "gap": "의도 영역이 HP 바 아래에 겹쳐 손패 선택 중에 가려진다",
  "evidence": "스크린샷의 해당 영역. 손패 hover 상태 캡처 R03/B/battle-hover.png 에서 의도 텍스트가 보이지 않음",
  "suggestion": "의도 영역을 손패 hover 시에도 가려지지 않는 레이어로 이동하는 구조안 검토 (값 결정은 Lucy)",
  "confidence": "medium",
  "status": "open",
  "lucy_decision": null,
  "thread_ref": null,
  "duplicates": []
}
```

`severity`는 0~4(0 = 문제 아님, 4 = 진행 불가)이고, `pin.source`는 `layout-dump`(레이아웃에서 계산)여야 하며 모델 추정 좌표는 쓰지 않아요. `suggestion`에는 구조나 행동만 적고 색·폰트·크기 값은 적지 않아요. `status`는 open / accepted / rejected / deferred / superseded 중 하나예요.

### 근거에서 나온 안전장치 요약

제로샷 비평의 유효성이 낮다는 결과(13.1%)에 대응해, 페르소나 프롬프트에 이 프로젝트의 확정 결정과 레퍼런스, 그리고 좋은 지적 예시 몇 개를 퓨샷으로 넣어요. Lucy가 수락한 지적이 쌓이면 그것을 예시 풀로 써요. 증거 필드가 없거나 증거가 스크린샷에서 보이지 않는 지적은 종합 단계에서 버려요. 실행할 때마다 결과가 달라진다는 MeasuringU 결과에 대응해, 중요한 게이트(P3 전투 화면, P4 목업)에서는 1차 리뷰를 두 번 돌려서 두 번 다 나온 지적만 "높은 확신"으로 표시해요. 아첨에는 독립 1차 평가, 반대자 역할, 스레드당 2~3턴 제한, 새 근거 없는 반복 시 중단으로 대응해요. 페르소나 붕괴에는 성격 대신 루브릭으로 구분하고 인원을 늘리지 않는 것으로 대응해요. AI 미감의 획일화에는 Lucy가 고른 레퍼런스 없이는 라운드를 시작하지 않고, 시안마다 차별화 축을 선언하고, 미적 판단은 Lucy만 하는 것으로 대응해요. 그리고 모든 지적은 가설이에요. 수락·기각은 Lucy가 해요.

---

## 6. 거버넌스·안전장치: 프롬프트가 아니라 hook과 기록으로

**토큰 잠금 파일.** 진실의 원천은 `design/tokens/*.json`(DTCG 2025.10 형식)이에요. `DESIGN_SYSTEM.md`는 사람이 읽는 근거 문서로, 같은 결정을 문장으로 담아요. `src/design/tokens.ts`(`as const`)는 JSON에서 **생성만** 하고 손으로 고치지 않아요. Phaser 씬과 UI는 이 모듈만 import해요. Google `design.md` 스펙의 lint/diff를 쓰거나 같은 역할의 작은 스크립트로 "문서와 JSON이 같은 결정을 말하는지", "고아 토큰이 없는지"를 검사해요. 토큰 승격(🟨 → ✅)은 `disable-model-invocation: true`를 건 `/design-gate` 스킬로만 하게 해서, Lucy가 직접 실행해야만 값이 잠기게 해요([best practices](https://code.claude.com/docs/en/best-practices)).

**리터럴 금지 린트와 자리 표시.** `src/design/` 밖에서 색처럼 보이는 리터럴(`0x` 6자리 숫자, `'#…'` 문자열), 직접 쓴 폰트 이름, 글자 크기·시간 값 리터럴이 나오면 ESLint `no-restricted-syntax`(또는 작은 커스텀 규칙)가 실패하게 해요. Mozilla의 `use-design-tokens` 규칙을 Phaser 식으로 옮긴 셈이에요([Mozilla](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/color.html)). 아직 정하지 않은 값은 `TODO_TOKEN('용도')`로 쓰고, 이건 눈에 확 띄는 디버그 표시로 렌더링되게 해서 빈칸이 숨지 않게 해요. 동시에 `DESIGN_SYSTEM.md`의 "알려진 빈칸" 목록에 자동으로 추가돼요. 이 검사는 Claude Code **Stop hook**(종료 코드 2)과 CI 양쪽에 걸어요.

**1280x800 스크린샷 검사.** Playwright로 Phaser `<canvas>`를 1280x800, 고정 DPR로 캡처해요. 결정적인 기준선을 얻으려면 시드 고정, 트윈·파티클 정지용 디버그 쿼리 파라미터, 같은 OS·브라우저에서 기준선 생성이 필요해요([Playwright](https://playwright.dev/docs/test-snapshots)). 이건 Playwright 문서의 주의 사항에서 추론한 것이고 Phaser 전용 사례는 찾지 못했어요. 글자 하한은 캡처 이미지를 픽셀로 재기보다, 레이아웃 덤프에서 텍스트 오브젝트의 렌더 높이를 읽어 9px 미만이면 실패, 12px 미만이면 경고로 처리하는 편이 안정적이에요. 같은 캡처가 리뷰 보드의 원본 이미지가 돼서, 리뷰한 화면과 테스트한 화면이 항상 같아요. 16:9 같은 다른 화면비는 Lucy가 정한 스케일 방식(FIT/EXPAND)에 맞춰 보조 캡처를 추가해요.

**TTI 출처 기록.** TTI가 들어간 모든 파일에 대해 `assets/provenance.jsonl`에 한 줄씩 남겨요. 필드는 `asset_id`, 파일 경로와 해시, 모델(V5 Full/Curated, V4.5 등), 프롬프트 시트 ID와 실제 프롬프트, 네거티브, 시드, 주요 설정, 사용한 레퍼런스(바이브 파일·Precise Reference 이미지와 그 출처), 원본 PNG 보관 위치, 사람이 한 작업(선별, 인페인트, 페인트오버, 합성, 재작도와 그 정도), 상태(탐색용 / 임시 / 출시용), 출시 포함 여부예요. 원본 PNG는 메타데이터가 남도록 Download 버튼으로 받은 파일을 보관해요. 이 기록에서 스팀 "AI Generated Content Disclosure" 문구 초안(사전 생성 콘텐츠: 어떤 에셋 유형에 어떻게 썼는지)을 생성하고, 저작권 등록이나 분쟁 때 사람 기여분을 증명하는 근거로 써요. 출시 전 점검 스크립트는 출처 기록이 없거나 "임시" 상태인 에셋이 빌드에 들어 있으면 실패하게 해요. Crimson Desert 같은 사고를 막는 장치예요.

**TTI와 재작도의 분담.** 아래 표는 연구 노트의 적합도 판단을 정리한 거예요. 작은 크기 아이콘의 가독성은 측정 연구가 없어서 추론이라는 점을 밝혀 둬요.

| 에셋 | TTI 적합도 | 권장 흐름 |
| --- | --- | --- |
| 키아트 / 캡슐 아트 | 좋음 | TTI → 컨택트 시트 → 인페인트 → 사람 페인트오버. 제목·로고는 편집기에서 사람이 배치 |
| 배경 | 좋음 | 큰 크기로 생성 → 업스케일 → 해상도별 크롭 |
| 정령 원화(Spine 파츠용) | 레퍼런스와 함께 좋음 | 일관성이 필요하면 V4.5 + Precise Reference(캐릭터) 또는 Vibe Transfer(동시 사용 불가). 탐색과 투명 배경은 V5. 파츠 분리·페인트오버는 사람 |
| 카드 일러스트 창 | 좋음 | 정령 원화와 같음. 비율은 프롬프트 시트에 고정 |
| 카드 프레임 / UI 패널 | 혼합 | 장식 탐색만 TTI → 대칭·타일 가능한 가장자리는 재작도 → 나인슬라이스 |
| 작은 아이콘 / 의도·상태 아이콘 | 최종 크기에선 낮음 | TTI는 콘셉트만 → 사람 재작도 또는 벡터화 → 실제 픽셀 크기로 확인 |
| 로고 / 워드마크 | 탐색만 | 사람이 그린 벡터 마크 + 라이선스 확인된 서체 → 상표 검색 |

**NovelAI 자동화 주의.** Claude가 NovelAI를 직접 호출하는 자동화는 권하지 않아요. 비공식 래퍼는 보관 처리됐고, 자동 접근에 관한 ToS 조항은 확인하지 못했어요. Claude는 프롬프트 시트(CSV/JSON) 확장, PNG 메타데이터 파싱, 컨택트 시트 생성, 배경 제거·업스케일·아틀라스 패킹 같은 로컬 후처리, 출처 기록 작성만 맡고, 생성 버튼은 Lucy가 눌러요. V5 출시일, V5에서의 레퍼런스 기능 지원, 쿼터는 2차 출처라서 앱 안에서 다시 확인해야 해요. "NAI5"라고 부르던 모델의 공식 이름은 "NovelAI Diffusion V5"예요.

---

## 7. 수정된 킥오프 프롬프트

아래를 기존 `KICKOFF_PROMPT.md` 대신 붙여 넣으면 돼요. 색·폰트·이름·비주얼은 하나도 정하지 않았어요.

```markdown
정령 덱빌더 인디게임의 **브랜딩과 UI/UX를 단계별로 같이 정하는 세션**이에요. 이 폴더의 파일을 먼저 읽고 시작해 주세요. 읽는 순서: `DECISIONS.md` → `docs/design-decisions/`(있으면) → `DESIGN_SYSTEM.md` → `03_화면별_정보·행동_목록_미검토.md` → 나머지.

## 나(Lucy)의 역할

- TTI 프롬프팅(NovelAI Diffusion V5, 내 맥), 브랜딩, UI/UX 디자인은 내가 직접 맡아요.
- 브랜딩·시각 요소(화면 구성, 레이아웃, 비주얼, 아트, 네이밍, 색, 폰트, 크기)는 **내 컨펌 없이 확정하거나 만들지 않아요.** 먼저 선택지와 근거를 보여주고, 내가 고른 것만 정리하거나 구현해요.
- 미적 판단(예쁜지, 재미있어 보이는지, 느낌이 맞는지)은 내가 해요. 너와 페르소나 에이전트는 구체적으로 확인할 수 있는 것(위계, 명료성, 일관성, 가독성, 접근성, 규칙 준수)만 평가해요.
- 네가 할 일: 질문하고, 2~3개 선택지를 만들고, 페르소나 리뷰를 돌려 정리하고, 내 결정을 기록하고, 결정된 값만 구현해요.

## 프로젝트 상태

- 장르는 덱빌딩 로그라이트 + 정령 키우기. 정원(홈)에서 정령을 키우고, 정령 3마리로 탐험(런)을 떠나요. 덱은 세 정령이 배운 카드의 합이에요.
- 핵심 규칙(능력치, 속성 상성, 싱크로율→각성, 브레이크, 기절 처리, 용어)은 확정. 스택은 Phaser 4 + Vite + TS + Spine(spine-phaser-v4). PC(스팀).
- MVP 콘텐츠 데이터(정령·카드·적 이름과 수치)와 프로토타입 화면은 Claude 초안이고 내가 아직 검토하지 않았어요. 프로토타입 화면은 전부 임시 플레이스홀더라 디자인 참고가 아니에요. 게임 로직(`src/core`, `src/data`)은 건드리지 않고 UI(`src/scenes`, `src/ui`)만 바꿔요.
- 체형 템플릿은 가설 단계. 기존 테스트 이미지는 내 태그 없이 뽑아서 화풍 기준이 아니에요.
- 상태 표시: ✅ Lucy 확정 / 📝 Claude 초안·미검토 / 🧪 가설. 디자인 시스템 항목은 ⬜ 미정 → 🟨 후보 논의 중 → ✅ Lucy 확정.

## 파일

| 파일 | 내용 | 상태 |
| --- | --- | --- |
| `DECISIONS.md` | 결정 요약 (확정/미검토/가설). 결정 기록 링크 | 먼저 읽기 |
| `docs/design-decisions/NNNN-*.md` | 결정 기록(ADR 형식). 고려한 선택지·기각 사유 포함 | 제안 전에 확인 |
| `01_기획서_v0.2.md` | 게임 기획서 | 확정 (수치는 가안) |
| `02_MVP_콘텐츠_데이터_미검토.md` | 성격·정령 3종·카드 40장·적 11종 | 미검토. 이름은 브랜딩 결정 대상 |
| `03_화면별_정보·행동_목록_미검토.md` | 화면 9개가 보여줄 정보와 행동 | 미검토, UI/UX 출발점 |
| `04_체형_템플릿_가설.md` | 체형 4종 리그 템플릿, NAI 프롬프트 시트 | 가설 |
| `~/workspace/jjal/docs/spirit-deckbuilder-nai5.md` | NAI 사용 노트 (내 맥) | 참고 |
| `DESIGN_SYSTEM.md` | 디자인 시스템 근거 문서. 값은 내가 고른 것만 | 단계별로 채움 |
| `design/tokens/*.json` → `src/design/tokens.ts` | 토큰 원천(DTCG) → 생성 파일 | 생성 파일은 손으로 고치지 않음 |
| `brand/BRIEF.md`, `art/ART_BIBLE.md`, `ui/IA.md` | 단계별 산출물 | 단계에서 만듦 |
| `design/reviews/R-xx/` | 라운드별 시안 스크린샷, 지적 카드, 스레드 요약 아카이브 | 라운드마다 |
| `assets/provenance.jsonl` | TTI 에셋 출처 기록 | 에셋마다 |
| `.claude/agents/*.md` | 페르소나 리뷰어 정의 | 아래 참고 |
| `reference/임시_플레이스홀더_프로토타입_build.zip` | 규칙 확인용 빌드 | 화면은 참고 금지 |

## 단계와 게이트

단계마다 내가 하나를 골라야 다음 단계로 넘어가요. 게이트를 통과하지 않은 단계의 결과는 다음 단계에서 확정 값으로 쓰지 않아요.

| 단계 | 내가 고르는 것 (게이트) |
| --- | --- |
| P0 브랜드 전략 (1인용 브랜드 스프린트: 가치, 핵심 고객, 성격 슬라이더, 경쟁작) | 포지셔닝 문장 1개, 성격 슬라이더 위치 |
| P1 아트 디렉션 (시각 기둥, 레퍼런스/안티 레퍼런스, 스타일 테스트 화면) | 화풍 방향 1개 + 잠금 날짜. 레퍼런스는 내가 고름 |
| P2 UI 정보구조·흐름 | 화면별 정보 우선순위, 화면 흐름 1안 |
| P3 회색 박스 와이어프레임 (1280x800, 전투 화면부터) | 화면별 구조안 1개 |
| P4 하이파이 목업 | 화면별 목업 승인, 새 값 결정 |
| P5 디자인 시스템·토큰 | 토큰 세트 잠금 (`/design-gate`는 내가 실행) |
| P6 엔진 구현 | "목업과 같다" 승인 |
| P7 플레이테스트·검증 | 수정 우선순위 |
| B-트랙 이름·로고·캡슐 (P1 잠금 후) | 이름 후보 → 검증 통과 후보 중 1개, 로고 방향, 캡슐 |

## 반복 루프 (모든 단계 공통)

1. **브리프**: 이번 라운드에서 정할 것, 이미 확정된 것, 기각된 것(결정 기록), 시안끼리 다르게 만들 **차별화 축**(구조·밀도·위계 같은 축. 색·폰트 값이 아님)을 먼저 적어요. 내가 고른 레퍼런스가 없는 라운드는 시작하지 말고 레퍼런스부터 요청해요.
2. **발산**: 2~3개 시안. 처음엔 회색 박스(라벨 붙은 사각형만)이고 "와이어프레임"이라고 밝혀요. 시안마다 근거 한 단락 + 철학·위계·완성도·구체성·절제 5축 자기 점검(1~5). 3 미만이면 고친 뒤 내요.
3. **내 선택**: 리뷰 보드에서 하나를 고르거나 섞어요. 선택과 이유를 기록해요.
4. **독립 병렬 리뷰**: 선택된 시안을 페르소나 서브에이전트들이 서로 결과를 보지 않고 동시에 평가해요. 페르소나당 지적 최대 5개, "문제 없음" 허용. 비평 호출과 위치 지정 호출은 나눠요. 핀 좌표는 레이아웃 소스(HTML 요소/Phaser 오브젝트 경계)에서 계산하고 눈대중으로 정하지 않아요. 중요한 게이트에서는 두 번 돌려 두 번 다 나온 지적만 "높은 확신"으로 표시해요.
5. **종합**: 중복을 합치고, 스크린샷에서 증거가 안 보이는 지적은 버리고, 심각도순으로 정렬하고, 페르소나끼리 부딪히는 지점은 "충돌" 카드로 나에게 넘겨요.
6. **핀 스레드**: 정리된 지적 카드를 리뷰 보드의 와이어프레임 위 핀으로 올려요. 나는 핀에서 스레드를 열어 답하고, 보내면 해당 페르소나가 그 스레드에서 답해요. 한 스레드에서 에이전트 발언은 최대 2~3번. 새 근거 없이 같은 주장을 반복하지 않아요. 반대자 역할은 가장 강한 반론을 한 번은 내요. 내가 "결정"이라고 쓰면 토론을 닫아요.
7. **결정 기록**: 수락한 지적을 반영한 다음 버전을 만들고, `docs/design-decisions/NNNN-<주제>.md`에 맥락 / 고려한 선택지(기각 시안 포함) / 내 결정 / 근거 / 결과 / 상태를 남겨요. 수락된 기록은 고치지 않고 새 기록으로 대체해요. `DECISIONS.md`에는 한 줄과 링크만 추가해요. **기각된 선택지는 새 근거 없이 다시 제안하지 않아요.**
8. **다음**: 같은 단계에서 더 다듬을 때는 발산하지 않고 한 시안 안에서 트윅만 해요. 한 단계의 라운드는 3회 안팎. 게이트를 통과하면 다음 단계로 가요.

## 리뷰 보드

- 기본: claude.ai 아티팩트 한 장. `comments`(customAnchors로 이미지 위 핀), `db`(시안, 내 선택, 지적 카드), `assets`(스크린샷)를 써요. 지적 카드는 네가 `db`에 쓰고, 나는 핀에서 네이티브 스레드를 열어 Send to Claude로 너를 불러요. 너는 새 네이티브 스레드를 만들 수 없으니 카드로 시작해요.
- 라운드가 끝나면 `db` 내용(카드, 선택, 스레드 요약)을 `design/reviews/R-xx/`에 옮겨 적어요. 진실의 원천은 저장소예요.
- 아티팩트를 쓸 수 없는 환경이면 같은 카드 스키마로 로컬 Vite 리뷰 페이지(`design/reviews/R-xx/threads.json`)를 써요.

## 페르소나 리뷰어 (`.claude/agents/`, 도구는 읽기 + 카드 쓰기만)

| 페르소나 | 루브릭 | 범위 밖 |
| --- | --- | --- |
| game-ux (게임 UX·가독성) | Pinelle 게임 휴리스틱 PIN-1~10, Nielsen NN-1~10, 스팀덱 텍스트 SD-TXT(1280x800에서 9px 하한, 12px 권장), 컨트롤러 도달성 SD-CTL | 색·폰트 선택, 미적 판단 |
| art-director (일관성 감사) | ART_BIBLE의 기둥 ID, on/off 예시 대비, 고정 기본기/바뀌어도 되는 표면 | 새 스타일 제안, 내 레퍼런스에 없는 방향 |
| brand-strategist | BRIEF 항목, 스팀 에셋 규칙, 120×45 축소, 이름 검증 절차 | 레이아웃 세부, 요청 없는 이름 창작 |
| accessibility | Game Accessibility Guidelines Basic/Intermediate, Xbox XAG 101, 대비, 색 단독 정보 금지 | 미적 판단 |
| player (라운드마다 숙련자/입문자 중 내가 지정) | 과업 시나리오 체크(예: 적의 다음 행동을 바로 말할 수 있는가) | 전문 휴리스틱 인용 |

- 매 라운드 한 명에게 **반대자 역할**을 돌아가며 붙여요.
- 지적 카드 형식(필수): id, round, stage, option_id, persona, dissent_role, heuristic_id, severity(0~4), target_element, pin{image, x, y, w, h(0~1 정규화), source:"layout-dump"}, standard(기대 기준), gap(관찰된 차이), evidence(스크린샷에서 보이는 근거), suggestion(구조·행동만, 값 없음), confidence, status(open/accepted/rejected/deferred/superseded), lucy_decision, thread_ref.
- 모든 지적은 가설이에요. 수락·기각은 내가 해요.

## 값과 토큰 규칙

- 문서나 내 결정에 없는 색·폰트·크기·간격·시간 값을 지어내지 않아요. 모르는 값은 `TODO_TOKEN('용도')`로 두고 `DESIGN_SYSTEM.md`의 "알려진 빈칸"에 추가해요.
- 토큰 원천은 `design/tokens/*.json`(DTCG). `src/design/tokens.ts`는 생성만 하고 손으로 고치지 않아요. 씬과 UI는 이 모듈만 import해요.
- `src/design/` 밖의 리터럴 값을 막는 린트와, 이를 돌리는 Stop hook·CI를 세팅해요. 실패를 우회하지 말고 고치거나 나에게 물어요.
- 토큰 승격(🟨→✅)은 내가 `/design-gate`를 실행할 때만 해요.
- 화면 검증은 1280x800 기준 Playwright 캡처(시드 고정, 애니메이션 정지, 고정 DPR)로 해요. 텍스트 렌더 높이 9px 미만은 실패, 12px 미만은 경고. 리뷰 보드의 이미지는 이 캡처를 그대로 써요.
- 질문은 방향을 실제로 바꾸는 것만, 한 번에 5개 이내로, 추천 기본값을 붙여서 해요. 이미 정한 값은 다시 묻지 않아요.

## TTI 출처 기록

- TTI가 들어간 모든 파일은 `assets/provenance.jsonl`에 한 줄씩 남겨요: asset_id, 경로·해시, 모델(V5 Full/Curated, V4.5 등), 프롬프트 시트 ID와 프롬프트, 네거티브, 시드, 설정, 레퍼런스(바이브/Precise Reference 이미지와 출처), 원본 PNG 위치, 사람이 한 작업(선별/인페인트/페인트오버/합성/재작도), 상태(탐색/임시/출시용).
- 출시 빌드에 출처 기록이 없거나 "임시" 상태인 에셋이 있으면 점검 스크립트가 실패해요. 스팀 AI 공개 문구 초안은 이 기록에서 만들어요.
- 로고·작은 아이콘·나인슬라이스 프레임은 TTI로 탐색만 하고 최종본은 다시 그려요.
- NovelAI를 직접 호출하는 자동화는 만들지 않아요. 너는 프롬프트 시트 확장, PNG 메타데이터 파싱, 컨택트 시트, 로컬 후처리, 출처 기록만 맡아요. 생성은 내가 해요.

## 참고: Open Design (github.com/nexu-io/open-design, Apache-2.0)

구조와 진행 방식만 빌리고, 그 안의 기본 색·폰트·스타일 방향은 쓰지 않아요(웹/SaaS용). 빌릴 것: DESIGN.md 틀(게임용으로 바꾼 것이 `DESIGN_SYSTEM.md`), 질문 규칙, 값 지어내지 않기와 정직한 자리 표시, 2~3개 방향과 회색 박스 먼저, 5축 자기 점검. **빌리지 않을 것: 0.10.0의 "에이전트가 방향을 스스로 골라 바로 적용" 기본값.** 이 프로젝트는 방향을 항상 내가 골라요.

## 시작

1. 파일을 읽고, 이 프롬프트의 규칙 중 지금 환경에서 바로 세팅할 수 없는 것(리뷰 보드, 린트, hook, Playwright)을 알려줘요.
2. P0 브랜드 전략용 질문을 5개 이내로 뽑아 주세요(추천 기본값 포함).
3. 동시에 P2 정보구조를 위해 `03` 목록 기준으로 "화면별로 가장 먼저 정해야 할 질문"을 3~5개 뽑아 주세요.
4. 페르소나 파일(`.claude/agents/*.md`)과 지적 카드 스키마 초안을 만들어 보여 주세요. 루브릭 범위가 맞는지는 내가 확인해요.
```

---

## 8. 다음 단계 제안과 열린 질문

### 다음 단계 제안

첫째, **파일럿 라운드 하나로 리뷰 보드를 검증하세요.** 전투 화면 회색 박스 2안을 claude.ai 아티팩트(`comments` + `db` + `assets`)에 올리고, 페르소나 2명(game-ux, accessibility)만으로 한 바퀴를 돌려 보는 거예요. "카드 → 핀 → Lucy 스레드 → Send to Claude → 페르소나 답변 → 결정 기록" 왕복이 매끄러운지, 세션이 제때 깨어나는지 확인해요. 매끄럽지 않으면 같은 스키마로 B안(로컬 Vite 보드)으로 바꿔요. 둘째, **저장소 뼈대와 강제 장치를 먼저 깔아 두세요.** `docs/design-decisions/`, `design/tokens/`, `src/design/tokens.ts` 생성 스크립트, 리터럴 금지 린트, Stop hook, `TODO_TOKEN`, 1280x800 Playwright 캡처 스크립트, `assets/provenance.jsonl`과 출시 전 점검 스크립트예요. 값이 하나도 없어도 지금 만들 수 있고, 만들어 두면 첫 결정부터 지켜져요. 셋째, **페르소나 5개 파일을 만들고 Lucy가 루브릭 범위를 검토하세요.** 처음 몇 라운드에서 Lucy가 수락한 지적을 퓨샷 예시 풀로 모아요. 넷째, **P0 브랜드 스프린트를 반나절로 진행하세요.** 경쟁작 목록과 레퍼런스 수집(P1 준비)도 같이 시작하면 좋아요. 다섯째, **NovelAI 앱에서 직접 확인할 것들을 점검하세요.** V5에서 Precise Reference/Vibe Transfer가 지원되는지, Director Tools가 V5에서 되는지, 쿼터가 어떤지예요. 결과에 따라 정령 원화의 일관성 전략(V4.5 레퍼런스 vs V5 + 페인트오버)이 정해져요.

### 열린 질문 (셋업을 바꾸는 것만)

1. **리뷰 보드를 어디서 보고 싶어요?** claude.ai 아티팩트(어디서나, 셋업 가벼움, 추천)로 할지, 맥 로컬 Vite 보드(맥 앞에서만, 완전 통제)로 할지, 유료 Figma 좌석을 쓰는 디자인 툴 중심으로 할지에 따라 카드 저장 위치와 알림 구조가 달라져요.
2. **Claude Code 세션은 주로 어디서 돌려요?** Lucy 맥 로컬이면 NovelAI PNG와 출처 기록, Playwright 기준선이 한 기기에 모여요. 클라우드/프로젝트 스레드 세션이면 맥의 파일을 옮기는 단계와 기준선 환경을 따로 정해야 해요.
3. **스팀덱 Verified를 출시 목표로 잡을까요?** 잡으면 1280x800 기준 해상도, 컨트롤러 도달성, 입력 장치별 글리프 교체가 P3부터 하드 게이트가 되고, 아니면 이 항목들은 P7 권장 사항으로 내려가요.

---

## 결론

이 리서치로 바뀐 그림은 이래요. Lucy가 원하는 "전문가 페르소나와의 토론"은 정답을 주는 장치가 아니라, **Lucy의 판단을 빨리, 그리고 기록이 남게 만드는 장치**로 설계해야 제값을 해요. 근거는 일관되게 같은 말을 해요. LLM 비평가는 구체적인 결함 찾기에는 쓸 만하지만 미감과 재미에서는 사람과 어긋나고, 같은 성향끼리 모이면 쉽게 동조하고, 인원을 늘려도 다양해지지 않아요. 그러니 루프의 가치는 페르소나 수가 아니라 독립 1차 평가, 증거 필드, 짧은 스레드, 그리고 기각된 안이 다시 돌아오지 않게 하는 결정 기록에서 나와요.

또 하나 중요한 점은 1인 개발에서 가장 비싼 실패가 나쁜 시안이 아니라 **조용한 표류**라는 거예요. 지어낸 값이 코드에 스며들고, 임시 TTI 에셋이 출시 빌드에 남고, 이미 버린 방향이 세션이 바뀔 때마다 다시 제안되는 것이요. 그래서 이번 재설계의 무게중심은 프롬프트 문장을 더 다듬는 데가 아니라 토큰 잠금, 린트, hook, 스크린샷 검사, 출처 기록처럼 기계가 지키는 쪽에 있어요. 원칙은 지금 번들에 이미 다 있어요. 남은 일은 그 원칙이 Lucy가 보지 않을 때도 지켜지게 만드는 거예요.

---

## 9. 출처

1. Open Design 저장소 — https://github.com/nexu-io/open-design
2. Open Design discovery.ts(시스템 프롬프트) — https://github.com/nexu-io/open-design/blob/main/packages/contracts/src/prompts/discovery.ts
3. Open Design directions.ts — https://github.com/nexu-io/open-design/blob/main/packages/contracts/src/prompts/directions.ts
4. Open Design docs/design-systems.md — https://github.com/nexu-io/open-design/blob/main/docs/design-systems.md
5. Google design.md 스펙 — https://github.com/google-labs-code/design.md
6. Lovable Design Systems — https://docs.lovable.dev/features/design-systems
7. Anthropic, Improving frontend design through skills — https://claude.com/blog/improving-frontend-design-through-skills
8. Anthropic, Claude Design — https://www.anthropic.com/news/claude-design-anthropic-labs
9. Claude Code best practices — https://code.claude.com/docs/en/best-practices
10. Claude Code subagents — https://code.claude.com/docs/en/sub-agents.md
11. Playwright 스크린샷 테스트 — https://playwright.dev/docs/test-snapshots
12. Mozilla use-design-tokens 규칙 — https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/color.html
13. Figma MCP server guide — https://cdn.jsdelivr.net/gh/figma/mcp-server-guide@main/README.md
14. Figma REST API rate limits — https://developers.figma.com/docs/rest-api/rate-limits
15. figma-comments-mcp — https://glama.ai/mcp/servers/junsimon/figma-comments-mcp
16. ancrz/penpot-mcp-server — https://github.com/ancrz/penpot-mcp-server
17. Penpot 토큰 내보내기 형식 이슈 — https://community.penpot.app/t/token-export-is-tokens-studio-format-not-dtcg-2025-10/10544
18. W3C DTCG 2025.10 — https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
19. UnityFigmaBridge — https://github.com/simonoliver/UnityFigmaBridge
20. Phaser Nine Slice — https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice
21. Phaser 4 출시 — https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games
22. rexUI (Phaser 4) — https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/
23. Steamworks Steam Deck 호환성 — https://partner.steamgames.com/doc/steamdeck/compat
24. Blendo Games, Steam Deck verification — https://blendogames.com/news/post/2026-02-19-steamdeckverification/
25. Xbox XAG 101 — https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
26. Game Accessibility Guidelines — https://gameaccessibilityguidelines.com/full-list/
27. Pinelle et al., CHI 2008 게임 사용성 휴리스틱 — https://course.ccs.neu.edu/is4300f15/ssl/pinelle-chi08.pdf
28. UICrit (UIST 2024) — https://arxiv.org/html/2407.08850v3
29. MeasuringU, AI UI 문제 탐지 — https://measuringu.com/does-ai-find-real-ui-problems-or-just-hallucinations/
30. MLLM as a UI Judge — https://arxiv.org/html/2510.08783v1
31. Peacemaker or Troublemaker(다중 에이전트 아첨) — https://arxiv.org/pdf/2509.23055
32. The Chameleon's Limit(페르소나 붕괴) — https://www.alphaxiv.org/abs/2604.24698
33. Ma et al., LLM 디자인 다양성 — https://codesign.berkeley.edu/papers/ma-llmdiverse-JCISE
34. Shin et al., 생산적 마찰 — https://arxiv.org/abs/2603.13036
35. NN/g, AI 프로토타이핑 — https://nngroup.com/articles/ai-prototyping/
36. Tian Pan, The ADR your agent never read — https://tianpan.co/blog/2026/07/02/the-adr-your-agent-never-read
37. Wheeler 브랜드 아이덴티티 프로세스 요약 — https://www.logodesignlove.com/brand-identity-process
38. GV Brand Sprint 실무 후기 — https://followthefox.substack.com/p/how-a-brand-sprint-led-to-something
39. Juego Studio, 아트 디렉션 — https://www.juegostudio.com/blog/art-direction-in-games
40. Nasty Rodent, 게임 아트 바이블 — https://nastyrodent.com/game-art-bible/
41. Cobalt Core (Game Developer) — https://www.gamedeveloper.com/design/how-cobalt-core-makes-movement-as-exciting-as-fighting-in-its-roguelike-deckbuilder-combat
42. Balatro 초기 개발 (80.lv) — https://80.lv/articles/balatro-dev-reveals-early-development-footage-and-screenshots
43. Dicey Dungeons 아트 (Cliqist) — https://cliqist.com/2019/07/02/marlowe-dobbe-on-the-art-of-dicey-dungeons/
44. Cassette Beasts 인터뷰 — https://www.pockettactics.com/cassette-beasts/interview
45. itch.io 아트 디렉션 회고 — https://itch.io/devlog/242179/devlog-09-reflections-on-our-art-direction.amp
46. Valorant 아트 (Inverse) — https://inverse.com/gaming/valorant-art-style-interview-moby-francke
47. Marvel Snap 프로토타입 — https://www.gamedeveloper.com/design/why-second-dinner-first-prototyped-marvel-snap-using-physical-cards
48. Balatro 시그널링 — https://www.gamedeveloper.com/design/balatro-creator-unveils-a-few-slick-signposting-strategies
49. Monster Train 2 (Laura Michet) — https://blog.lauramichet.com/monster-train-2/
50. Steamworks 에셋 규칙 — https://partner.steamgames.com/doc/store/assets/rules
51. presskit.gg 캡슐 가이드 — https://presskit.gg/field-guides/steam-capsule-art-guide
52. How To Market A Game, 캡슐 20배 사례 — https://howtomarketagame.com/2020/04/13/how-one-new-image-increased-sales-by-20x/
53. How To Market A Game, 2025 네이밍 데이터 — https://howtomarketagame.com/2025/02/03/are-game-names-getting-longer-how-to-quit-your-job-and-write-a-title-for-your-steam-game-in-2025-naming-seo-tips-faq-guide-profits-earnings-optimization/
54. SteamPageAnalyzer, 스팀 A/B 테스트 — https://www.steampageanalyzer.com/blog/steam-page-ab-testing
55. NovelAI 이미지 모델 — https://docs.novelai.net/en/image/models
56. NovelAI Precise Reference — https://docs.novelai.net/en/image/precisereference
57. NovelAI Vibe Transfer — https://docs.novelai.net/en/image/vibetransfer
58. NovelAI FAQ — https://docs.novelai.net/en/faq
59. weavai.app, NovelAI V5 리뷰(2차) — https://weavai.app/blog/2026/08/29/novelai-diffusion-v5-review-anime-character-art/
60. 비공식 NovelAI-API 래퍼(보관됨) — https://github.com/HanaokaYuzu/NovelAI-API
61. Tech Insider, 스팀 AI 공개 2026 — https://tech-insider.org/steam-ai-disclosure-2026
62. GIGAZINE, 스팀 AI 공개 개정 — https://gigazine.net/gsc_news/en/20260120-steam-updates-ai-disclosure-guidelines
63. GIGAZINE, Crimson Desert AI 아트 — https://www.gigazine.net/gsc_news/en/20260323-crimson-desert-ai-art
64. PCGamesN, Next Fest 생성형 AI 공개 — https://www.pcgamesn.com/steam/next-fest-generative-ai
65. Lowenstein Sandler, 미국 저작권청 Part 2 요약 — https://www.lowenstein.com/news-insights/publications/client-alerts/us-copyright-office-issues-report-on-copyrightability-of-generative-ai-outputs-ai
66. Daum 뉴스, 한국 AI 저작권 입장(2026-04-21) — https://v.daum.net/v/20260421144511956
67. Gerben Law, AI 상표 — https://www.gerbenlaw.com/blog/ai-guided-trademark-development-mitigating-infringement-risks/
68. Hitmarker, Jurassic World Evolution 3 — https://hitmarker.net/news/frontier-announces-it-will-remove-ai-artwork-from-jurassic-world-evolution-3-following-player-backlash-1473986
69. claude.ai Artifact 런타임 문서 (세션 내 확인, 2026-10-28) — comments(customAnchors), db, assets, user, sample capability와 "Send to Claude" 스레드 동작
70. 기존 핸드오프 번들 — /mnt/project-files/handoff-branding-uiux/ (DECISIONS.md, KICKOFF_PROMPT.md, DESIGN_SYSTEM.md, 03_화면별_정보·행동_목록_미검토.md)
