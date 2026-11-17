# 업계 표준 대비 빠진 것 (첫 공개 데모 기준)

작성 2026-11-17 · 웹 조사 · 범위: 콘텐츠·UI 모션·캐릭터 아트 제외
표기: 출처를 확인한 내용에는 [n]을 붙였어요. 출처를 확인하지 못한 것은 **기억 기반(미확인)** 으로 표시했어요.

## 결론
- 바깥 플레이어가 막히거나 바로 나가는 원인은 4가지예요: **소리 없음, 첫 판 안내 없음, 설정 화면 없음(볼륨·전체화면), 판 포기·이어하기 없음.** 데모 전에 반드시 있어야 해요.
- 그다음 데모에서 기대하는 것: 게임 속도/빠른 모드, 화면 흔들림 끄기, 키워드 용어집, 판 결과 통계, 피드백 링크, 위시리스트 버튼, 데모 끝 화면.
- 우리 고정 뷰포트 1280×800은 Steam Deck 기본 해상도와 같아서 유리해요 [2]. 대신 글자 최소 크기 규칙(9px, 권장 12px)을 지켜야 해요 [2].

---

## 1. 온보딩 (스토리·긴 튜토리얼 없이)
**(a) 표준**
- GAG 기본 단계에 "상호작용 튜토리얼 넣기", "메뉴 여러 겹 없이 바로 시작", "쉬운 기본 글자 크기"가 들어 있어요 [3].
- Wildfrost: 첫 판은 부족 하나·펫 하나만 열고, 다른 부족·펫·이벤트는 도전 과제를 깨면 열려요. 첫 판에서 배울 것을 좁혀요 [9].
- Slay the Spire: 첫 판에 캐릭터 하나만 열려요. 다음 캐릭터는 판을 끝내면 열리고 이기지 않아도 돼요 [10]. StS2도 같은 방식이에요(포기해도 열림) [11]. 시작 보너스(Neow)는 지난 판이 1막 보스에 못 갔으면 생존용 2개만 줘요 [12]. 실패한 판 다음에 판을 쉽게 만들어 주는 장치예요.
- Chrono Ark: 리뷰 요약에서 가장 많은 불만이 가파른 학습 곡선(30건)과 부실한 튜토리얼이고, 위키가 필수라는 평이 많아요 [13]. 우리처럼 순서·타임라인이 복잡한 게임이 실패하는 전형이에요.
- Bramble Royale(덱빌더): "첫눈에 배우기 어려워 보인다"는 데모 피드백이 확산을 막은 이유 중 하나로 꼽혀요 [14].
- 키워드 호버 툴팁은 StS 계열의 사실상 표준이에요(카드 문구의 키워드에 마우스를 올리면 풀이 상자가 붙음) — 기억 기반(미확인), 위키에 툴팁 모듈은 있어요 [15].

**(b) 최소안**: ① 첫 전투를 고정 조우로 만들어요(적 1, 행동 예고 1종, 브레이크로 끊을 수 있는 차징 1회). ② 처음 나오는 개념(타임라인·브레이크·정령 교대 등)마다 1회성 강조(깜빡임·화살표·호버 유도)를 띄워요. 문장은 호버에만 둬요(0019·0050 규칙과 맞음). ③ 모든 키워드에 호버 풀이. ④ 첫 판은 정령 1 + 카드 풀 축소.
**(c) 나중**: 용어집 화면, "다시 보기" 토글, 패배 원인 힌트(형태·기호로).
**(d) 공수**: M **(e) 위험**: 매우 높음. 타임라인·브레이크는 처음 보는 규칙이라 Chrono Ark식 이탈이 나요.

## 2. 사운드
**(a) 표준**
- GMTK 데모 가이드: 음악이 들어갈 때까지 데모를 미뤘어요. 소리 없는 게임은 "품질이 높아 보이지 않는다"고 해요 [4].
- Hearthstone 사운드팀: 턴제라 타이밍이 정해져 있으니 카드를 내는 순간에 맞춰 설계하고, 주문은 "시전·명중" 두 박자로 나눠요. 속도가 빠르니 "알아들을 수 있어야" 해요 [16].
- Balatro: 점수 카드마다 음이 하나씩 올라가는 연출이 자주 언급돼요. 출처 글 자체가 근거를 대지 않아서 **미확인**이에요 [17].
- GAG 기본: 효과음·음성·음악 볼륨을 따로 두고, 중요한 정보는 소리로만 주지 않아요 [3].
- 음량: PlayStation 권장은 콘솔 -24 LUFS(±2), 휴대 -18 LUFS, 최대 피크 -1 dBTP예요. PC 표준은 없고 참고작을 재서 정하라고 해요 [18]. 30분 이상 실제 플레이를 녹음해서 재요 [18].

**(b) 최소 SFX 목록 (약 25~30개)**
- UI: 호버, 확인, 취소, 불가(못 누름), 화면 전환, 탭 넘김
- 카드: 집기, 타임라인에 놓기, 되돌리기, 사용(발동), 드로우, 버림, 덱 섞기
- 전투: 타격 3단계(약·중·강), 막기(방어도 흡수), 방어도 얻기, 상태 걸기(이로움/해로움 2종), 적 행동 예고 등장, 적 차징 시작, **브레이크 성공**(가장 크게), 정령 쓰러짐, 적 쓰러짐, 턴 시작/턴 끝
- 진행: 지도 이동, 노드 들어가기, 보상 열기, 골드 얻기, 카드 얻기, 레벨 업
- 스팅어: 승리, 패배, 보스 등장, 판 클리어
- 음악: 홈 1, 지도 1, 전투 1, 보스 1 (루프). 적응형은 나중.
- 소싱: Kenney UI Audio는 CC0, 50개 [19]. Sonniss GDC 번들은 로열티 프리·출처 표기 불필요·평생 무제한 프로젝트 사용이라고 소개돼요(정식 라이선스 원문은 Sonniss 사이트에서 확인 필요) [20]. 음악은 상업 게임용 라이선스가 명시된 곳만 써요 — 구체 업체 비교는 기억 기반(미확인).
**(c) 나중**: 전투 음악 레이어(긴장도·보스 페이즈에 따라 층 추가), 정령별 음색, 연속 타격 음높이 상승.
**(d) 공수**: M (소싱·연결), 음악 작곡 외주 시 L **(e) 위험**: 높음. 스트리머·첫인상에서 바로 티 나요.
- 에셋 기록: 오디오도 `assets/provenance.jsonl`처럼 출처·라이선스를 남겨야 해요(우리 규칙 연장).

## 3. 설정 화면 기본
**(a) 표준**
- GAG 기본: 게임 속도 조절, 리맵, 볼륨 분리, 설정 저장·기억, 접근성 기능 안내 [3].
- 참고작 문서 기록 [5][6][7][8]:
  - StS: 속도 조절, 화면 흔들림 끄기, 음악·효과음 분리, 키보드·마우스 리맵, 진동 끄기.
  - Balatro: 화면 흔들림 끄기, 음악·효과음 분리, 프리셋 난이도.
  - Monster Train: 화면 흔들림 끄기, 정적 배경, 적록색약 모드, UI 크기(Large도 작다는 평).
  - Cobalt Core: 화면 흔들림·진동 토글, 배경 움직임 줄이기, 픽셀 폰트 토글.
**(b) 최소안**: 마스터·음악·효과음 볼륨 / 창·전체화면 / 게임 속도(1×·2×·즉시 등 값은 TODO_TOKEN) / 화면 흔들림·번쩍임 끄기 / 턴 끝 확인 / 피드백 링크. 모두 저장.
**(c) 나중**: UI 크기, 색약 보조, 키 리맵, 언어.
**(d)** M **(e)** 높음. 볼륨·전체화면이 없으면 첫 5분에 불만이 나와요.

## 4. 저장·나가기·포기·이어하기
**(a) 표준**
- StS: 조우 시작마다 자동 저장. 껐다 켜면 그 전투 처음으로 돌아가고, 드로우가 고정이라 재시작으로 패를 바꿀 수 없어요 [21].
- Monster Train: 전투 사이 자동 저장, 전투 중 수동 저장 없음 [7]. MT2는 턴 되돌리기와 전투 재시작이 있고, 되돌리기 없이 깬 판에 배지를 줘요 [22].
- XAG 115: 파괴적 행동(포기 등)에 확인 단계를 둬요 [23].
- 시드 고정 판: Balatro·StS에 있음 — 기억 기반(미확인).
**(b) 최소안**: 노드 진입마다 자동 저장 → 홈에 "이어하기" / 일시정지 메뉴에 "저장하고 나가기"·"판 포기"(확인 창 `판을 포기할까요?`) / 전투 중 나가면 그 전투 처음부터, RNG 고정.
**(c) 나중**: 판 기록(지난 판 목록), 시드 입력, 전투 재시작.
**(d)** M **(e)** 매우 높음. 포기가 없으면 망한 판에서 탈출할 방법이 없어요.

## 5. 접근성 기본
**(a) 표준**
- GAG 기본: 고정된 색만으로 정보 전달 금지, 높은 대비, 깜빡임 피하기, 큰 상호작용 요소, 게임과 같은 입력으로 UI 전부 조작 [3].
- XAG 101: PC 기준 1080p에서 본문 18px 이상, 200%까지 키울 수 있게 권장 [24]. XAG 117(움직임 설정)·118(광과민) 별도 [23].
- Steam Deck: 1280×800에서 최소 9px, 권장 12px [2].
- 우리 규칙(상태를 형태·색·기호로)은 색만 쓰지 않으면 접근성과 맞아요. 의미색마다 기호·모양을 짝지어야 해요.
**(b) 최소안**: 의미색 = 기호 짝 점검, 최소 글자 크기 점검, 흔들림·번쩍임 끄기, 누르고 있기 대신 클릭.
**(c) 나중**: UI 크기, 색약 필터, 모션 줄이기, 키보드만으로 조작.
**(d)** S~M **(e)** 중간(데모 이탈보다는 평판 문제).

## 6. 창·해상도·Steam Deck·컨트롤러
**(a) 표준**
- Deck Verified: 컨트롤러로 모든 콘텐츠 접근(게임 안 설정 변경 없이), 입력에 맞는 버튼 그림, 해상도 1280×800 권장, 런처도 컨트롤러로, 글자 9px 이상 [2]. 대부분 실패는 "Playable" 등급으로 떨어져요 [2].
- Phaser ScaleManager: FIT(비율 유지 + 레터박스), 전체화면은 `pointerup`에서 요청해야 해요. 캔버스 내부 해상도는 기본 크기 그대로 CSS로 늘어나요 [25] → 큰 화면에서 흐려질 수 있어요.
**(b) 최소안**: FIT + 가운데 정렬, Electron 전체화면 토글(F11/설정), 창 크기 조절 허용. 1280×800 기준 유지.
**(c) 나중**: 고해상도 렌더(내부 해상도 배수), 컨트롤러 지원·버튼 그림, Deck 인증.
**(d)** S(FIT·전체화면) / L(컨트롤러) **(e)** 높음(1080p·1440p 모니터에서 작은 창만 뜨면 바로 체감).

## 7. 카드 게임 손맛 점검 (모션 정의 아님)
**(a) 표준**
- 속도 조절: StS·GAG [5][3]. 되돌리기: MT2 턴 되돌리기(적 단계 전까지) [22], MT1엔 없음 [22].
- 턴 끝 실수 방지, 받을 피해 미리보기 정확성: 참고작 공통 관행 — 기억 기반(미확인).
**(b) 최소안**: 타임라인에 놓은 카드 되돌리기(턴 끝 전까지), 쓸 수 있는 행동이 남았을 때 턴 끝 확인(설정으로 끔), 피해 미리보기가 실제 계산과 같은지 테스트로 고정, 연출 중 입력 버퍼 또는 클릭으로 건너뛰기, 우클릭 취소.
**(c) 나중**: 턴 전체 되돌리기, 전투 재시작.
**(d)** M **(e)** 중간~높음. 미리보기와 결과가 다르면 신뢰를 잃어요.

## 8. 첫 1시간 메타 진행
**(a) 표준**
- StS/StS2: 판을 끝내기만 하면(패배·포기 포함) 다음 캐릭터 [10][11].
- Wildfrost: 처음엔 선택지를 줄이고, 도전 과제로 부족·펫·이벤트를 열어요 [9].
- MT: 처음엔 난이도 설정 없음, 높은 난이도는 시간이 지나며 열림 [7].
- GMTK: 데모는 쉬운 쪽으로, 찾기 쉬운 강한 시너지를 넣어요 [4].
**(b) 최소안**: 우리 설계(첫 판 후 정령 합류, 첫 보스 승리 후 정령 합류)는 StS 방식과 같아요. 확인할 것은 ① 첫 판이 패배여도 합류가 일어나는지 ② 첫 판에서 보스까지 갈 확률(목표값은 TODO_TOKEN, 플레이테스트로 정함) ③ 매 판 끝에 무언가 열렸다는 표시.
**(c) 나중**: 해금 연대표 화면(StS2 Timeline [11]), 난이도 단계.
**(d)** S(조정) **(e)** 중간.

## 9. 데모 범위·Steam 페이지·Next Fest
**(a) 표준**
- Valve: 메인/일시정지 메뉴에 피드백 링크, Steam 토론에 데모 하위 포럼, 데모 종료 예정이면 홈 화면에 언제인지 표시, 상점 페이지 "구매 옵션 위에 표시" 체크, 빌드 리뷰 시간 확보. 언론에는 행사 약 10일 전 목록이 감 [1].
- GMTK: 중간 플레이 시간 30~90분 목표(Steamworks "median time played"로 확인), 15분은 너무 짧았음, 전체 콘텐츠 일부만(25/120 퍼크·모드 1개), 잠긴 버튼에 "정식 출시에 포함", 게임 안 상점 페이지 버튼, 행사 2주 전 공개로 위시리스트 약 2.5만, 데모 파일에는 데모 콘텐츠만 [4].
- Steam Page Analyzer: 20~40분 권장(60분 넘으면 구매 동기 약화), 완주율 40% 미만이면 너무 김, 끝 화면이 가장 전환율 높은 순간 → "End of Demo"와 위시리스트 버튼, 일시정지 메뉴에도 버튼, 게임 중 팝업 금지 [26]. 수치 근거는 출처가 밝히지 않아요.
- QA: 깨끗한 PC 설치 테스트, 첫 1시간 소프트락·저장 깨짐, 업로드할 정확한 빌드 확인 [27].
- 판 결과 화면: 우리 `runEnd/`가 있어요. 통계 항목 표준은 기억 기반(미확인): 도달 층·처치 수·가장 큰 피해·사용한 카드·시드.
**(b) 최소안**: 1막(가능하면 2막까지) + 정령 2, 데모 끝 화면(위시리스트·피드백·디스코드), 메뉴에 피드백·위시리스트 버튼, 잠긴 정령 실루엣, 데모 빌드에서 이후 콘텐츠 제외.
**(c) 나중**: Steam 업적·클라우드 저장(Steamworks 연동), 분석 이벤트.
**(d)** M **(e)** 높음(위시리스트 전환 손실).

## 10. 그 밖에 흔히 기대하는 것
- **크래시·오류 보고**: 오류 로그 파일 + 피드백 버튼에서 로그 첨부. QA 출처가 크래시 기록을 필수로 봐요 [27]. S
- **빌드 버전 표시**: 홈 구석 버전 번호(피드백 대조용) — 기억 기반(미확인). S
- **한국어 외 언어**: Bramble Royale 판매의 52%가 미국 외 4개국(중·일·한 포함)이에요 [14]. 데모는 한국어 + 영어 최소 — 판단. L(텍스트 규칙 재작성 필요)
- **일시정지 메뉴(Esc)**: 설정·저장하고 나가기·포기·위시리스트를 모으는 곳 [26]. S

---

## 우선순위 표

| 등급 | 항목 | 이유 | 최소안 | 공수 |
|---|---|---|---|---|
| P0 | 사운드 기본 세트 | 무음은 품질이 낮아 보임 [4] | SFX 25~30개 + 음악 루프 4개, CC0/로열티 프리 소싱 | M |
| P0 | 첫 판 안내 | 타임라인·브레이크는 처음 보는 규칙, 복잡 덱빌더 이탈 사례 [13][14] | 고정 첫 전투 + 개념별 1회 강조 + 키워드 호버 | M |
| P0 | 설정 화면 | GAG 기본·전 참고작 공통 [3][5] | 볼륨 3종, 창/전체화면, 속도, 흔들림·번쩍임, 턴 끝 확인, 저장 | M |
| P0 | Esc 일시정지 + 저장하고 나가기 + 판 포기 + 이어하기 | 망한 판·중단 시 막힘, XAG 115 [21][23] | 노드 진입 자동 저장, 확인 창, 전투 중 나가면 전투 처음부터 | M |
| P0 | 창 크기·전체화면 | 큰 모니터에서 작은 고정 창 | Phaser FIT + 가운데, Electron 전체화면 [25] | S |
| P1 | 게임 속도/빠른 모드 | GAG·StS [3][5] | 속도 2~3단계 + 연출 클릭 건너뛰기 | S |
| P1 | 되돌리기·턴 끝 안전장치 | MT2 표준화 [22] | 턴 끝 전 카드 회수, 남은 행동 있을 때 확인 | S~M |
| P1 | 피해 미리보기 정확성 테스트 | 신뢰 | 미리보기 = 실제 계산 골든 테스트 | S |
| P1 | 데모 끝 화면·위시리스트·피드백 버튼 | Valve·전환율 [1][26] | End of Demo + 위시리스트 + 피드백 링크, 메뉴에도 | S |
| P1 | 데모 범위 확정·빌드 분리 | 30~90분, 콘텐츠 유출 방지 [4] | 1~2막·정령 2, 데모 빌드에 이후 데이터 제외 | M |
| P1 | 접근성 점검 | GAG·Deck 글자 9/12px [2][3] | 의미색-기호 짝, 최소 글자 크기, 흔들림 끄기 | S |
| P1 | 오류 로그·버전 표시 | QA 필수 [27] | 로그 파일 + 홈 버전 번호 | S |
| P2 | 용어집 화면 | 위키 의존 방지 [13] | 키워드 목록 + 호버 풀이 재사용 | M |
| P2 | 판 기록·시드 | 장기 재미 | 지난 판 목록, 시드 표시 | M |
| P2 | 적응형 음악 | 품질 상승 | 전투 긴장도 레이어 | L |
| P2 | 컨트롤러·Deck 인증 | Deck 노출 [2] | 컨트롤러 탐색 + 버튼 그림 | L |
| P2 | UI 크기·색약 필터·리맵 | XAG 101 [24] | UI 배율 단계 | M |
| P2 | Steam 업적·클라우드 | 정식 출시 기대치 | Steamworks 연동 | M |
| P2 | 영어 | 해외 판매 비중 [14] | 문자열 분리 + 영어 | L |

---

## 출처
1. Valve, Next Fest tips — https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest/tips?l=english
2. Valve, Steam Deck compatibility review — https://partner.steamgames.com/doc/steamdeck/compat
3. Game Accessibility Guidelines, Basic — https://gameaccessibilityguidelines.com/basic/
4. GMTK, How to make a great Steam Next Fest demo — https://gmtk.substack.com/p/how-to-make-a-great-steam-next-fest
5. Family Gaming Database, Slay the Spire — https://www.familygamingdatabase.com/accessibility/Slay+the+Spire
6. Family Gaming Database, Balatro — https://www.familygamingdatabase.com/accessibility/Balatro
7. Family Gaming Database, Monster Train — https://www.familygamingdatabase.com/accessibility/Monster+Train
8. Family Gaming Database, Cobalt Core — https://www.familygamingdatabase.com/accessibility/Cobalt+Core
9. Wildfrost Wiki, Getting Started — https://wildfrostwiki.com/Getting_Started
10. StS Wiki, Silent — https://slaythespire.wiki.gg/wiki/Silent
11. Untapped, StS2 character unlocks — https://sts2.untapped.gg/en/guides/how-to-unlock-characters
12. StS Wiki, Neow — https://slaythespire.wiki.gg/wiki/Neow
13. Vaporlens, Chrono Ark 리뷰 요약 — https://vaporlens.app/app/1188930/chrono_ark
14. GameDiscoverCo, Bramble Royale — https://newsletter.gamediscover.co/p/why-did-this-excellent-roguelike
15. StS Wiki, KeywordTooltip 모듈 — https://slaythespire.wiki.gg/wiki/Module:KeywordTooltip
16. Blizzard, Hearthstone sound team — https://hearthstone.blizzard.com/en-us/blog/23964694/
17. Balatro 피드백 분석(근거 없음) — https://blakecrosley.com/guides/design/balatro
18. Audiokinetic, Mastering a game with Wwise pt.1 — https://audiokinetic.com/en/mastering-a-game-with-wwise-part1
19. Kenney, UI Audio — https://kenney.nl/assets/ui-audio
20. Rekkerd, Sonniss GDC 2026 bundle — https://rekkerd.org/sonniss-releases-gdc-2026-game-audio-bundle/
21. Twinfinite, StS 저장 — https://twinfinite.net/guides/slay-the-spire-save-how/
22. DTGRE, Monster Train 2 Undo — https://www.dtgre.com/2025/05/monster-train-2-undo-feature-guide.html
23. Microsoft, Xbox Accessibility Guidelines 목록 — https://learn.microsoft.com/en-us/gaming/accessibility/guidelines
24. Microsoft, XAG 101 Text display — https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/101
25. Phaser 4.2.1, scale-and-responsive — https://unpkg.com/phaser@4.2.1/skills/scale-and-responsive/SKILL.md
26. Steam Page Analyzer, demo best practices — https://www.steampageanalyzer.com/blog/steam-demo-best-practices
27. GameCloud, Next Fest demo QA — https://www.gamecloud-ltd.com/what-to-qa-before-steam-next-fest-demo.html
