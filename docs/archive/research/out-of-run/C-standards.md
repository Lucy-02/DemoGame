# C. 게임 밖 화면 업계 표준·사례 조사

작성일: 2026-11-10. 대상: 정령 덱빌더(Phaser 4 + Electron, 기준 캔버스 1280x800)의 게임 밖 화면(타이틀, 첫 실행, 정원 허브, 런 준비, 진화 분기, 일시정지·포기, 설정, 도감·기록, 해금 알림).

표기 규칙:
- **[출처: URL]**: 링크에서 직접 확인한 내용이에요.
- **[미검증]**: 일반 상식이나 기억에 기댄 내용이에요. 결정 근거로 쓰기 전에 다시 확인해야 해요.
- **[계산]**: 확인한 수치에서 제가 산술로 옮긴 값이에요.
- 이 문서는 정보 구조, 필수 항목, 흐름만 다뤄요. 배치·색·폰트·이름은 제안하지 않아요.
- 조사 도중 웹 가져오기 한도가 바닥나서 Steam Input API와 ISteamUtils 문서는 직접 열어 보지 못했어요. 해당 API 이름은 [미검증]으로 표시했어요.

---

## 1) 설정 표준

### 1-1. 근거가 되는 가이드라인

- Game Accessibility Guidelines(GAG) 기본 등급에는 "모든 설정이 저장·기억되게 하기", "조작 재배치(리맵) 허용", "게임 속도 조절 옵션", "UI 전체를 게임플레이와 같은 입력 방식으로 접근 가능하게", "햅틱 토글/슬라이더", "읽기 쉬운 기본 글자 크기", "텍스트와 배경의 높은 대비", "색만으로 필수 정보를 전달하지 않기", "여러 단계 메뉴를 거치지 않고 게임 시작 가능" 같은 항목이 있어요. **[출처: https://gameaccessibilityguidelines.com/full-list/]**
- 같은 목록의 중급 등급에는 "인터페이스 크기 조절", "누르고 있기 대신 대안 제공", "배경 움직임 끄기 옵션", "대비 조절", "플레이 도중 난이도 변경", "핵심이 아닌 요소 건너뛰기"가 있고, 고급 등급에는 "글자 크기 조절", "설정을 프로필로 저장", "서사와 안내 다시 보기"가 있어요. **[출처: https://gameaccessibilityguidelines.com/full-list/]**
- Xbox 접근성 가이드라인(XAG)은 101~123번으로 구성되고, 설정 화면과 직접 관련된 것은 101 텍스트 표시, 102 대비, 105 오디오 접근성, 107 입력, 112 UI 탐색, 113 포커스, 115 오류 메시지와 파괴적 행동, 116 시간 제한, 117 시각적 산만함과 모션 설정, 118 광과민성이에요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines]**
- XAG 115는 설정을 바꾼 뒤 나갈 때 "적용 안 한 변경 사항" 확인(적용/버리기)과 "기본값으로 되돌리기"를 예시로 들어요. 파괴적 행동 확인을 버튼 길게 누르기로만 받지 말라고도 해요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115]**
- XAG 112는 첫 실행의 첫 화면으로 접근성 설정 안내를 보여 주라고 권하고, 설정 메뉴로 가는 모든 경로가 처음부터 접근 가능해야 한다고 해요. 플랫폼 설정을 읽을 수 있으면 기본값을 그에 맞추라고 해요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112]**
- Steam Cloud 문서는 비디오 설정처럼 기기마다 다른 설정은 클라우드 저장에서 빼라고 해요. **[출처: https://partner.steamgames.com/doc/features/cloud]**
- PC 게임 설정 메뉴가 보통 화면/그래픽, 오디오, 조작, 게임플레이, 접근성, 언어로 나뉜다는 것은 업계 관행이에요. 공식 표준 문서로 확인하지는 못했어요. **[미검증]**

### 1-2. 체크리스트

필수 = 스팀덱 Verified 또는 기본 등급 가이드라인이 요구하거나, 없으면 리뷰에서 바로 지적받는 항목. 권장 = 중급 가이드라인이거나 장르에서 흔히 기대되는 항목. 선택 = 있으면 좋은 항목.

| 분류 | 항목 | 근거 | 등급 |
|---|---|---|---|
| 공통 | 모든 설정 저장·기억 | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/] | 필수 |
| 공통 | 기본값으로 되돌리기 | XAG 115 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115] | 권장 |
| 공통 | 적용 안 한 변경 확인(적용/버리기) | XAG 115 [출처: 같은 URL] | 권장 |
| 공통 | 런 도중에도 설정 열기(일시정지 메뉴에서) | 업계 관행 [미검증] | 필수 |
| 공통 | 기기별 설정(해상도 등)은 클라우드 저장과 분리 | Steam Cloud 문서 [출처: https://partner.steamgames.com/doc/features/cloud] | 권장 |
| 화면 | 창 모드 / 전체 화면 / 테두리 없는 창 | PC 관행 [미검증] | 필수 |
| 화면 | 해상도(1280x800 지원 포함) | 스팀덱 Verified: 1280x800 권장 [출처: https://partner.steamgames.com/doc/steamdeck/compat] | 필수 |
| 화면 | 수직동기화 / 프레임 제한 | PC 관행 [미검증] | 권장 |
| 화면 | UI 크기·글자 크기 조절 | GAG 중급 "인터페이스 크기 조절", 고급 "글자 크기 조절", XAG 101 최대 200% [출처: https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md] | 권장 |
| 화면 | 모니터 선택(다중 모니터) | PC 관행 [미검증] | 선택 |
| 오디오 | 마스터 / 음악 / 효과음 분리 볼륨 | XAG 105 오디오 접근성 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines] (세부 항목은 미열람) | 필수 |
| 오디오 | 환경음·음성 별도 볼륨 | 관행 [미검증] | 선택 |
| 오디오 | 창 비활성 시 음소거 | PC 관행 [미검증] | 권장 |
| 언어 | 게임 내 언어 선택 | Steam 다국어 출시 관행 [미검증] | 필수(다국어 출시 시) |
| 조작 | 키 재배치 | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/] | 권장(마우스 중심 게임이라도 단축키가 있으면) |
| 조작 | 컨트롤러 전체 탐색 | 스팀덱 Verified [출처: https://partner.steamgames.com/doc/steamdeck/compat], XAG 112 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112] | 필수(덱 Verified 목표 시) |
| 조작 | 현재 입력에 맞는 버튼 그림 자동 전환 | 스팀덱 Verified [출처: https://partner.steamgames.com/doc/steamdeck/compat] | 필수(덱 Verified 목표 시) |
| 조작 | 길게 누르기 대신 토글 | GAG 중급 [출처: https://gameaccessibilityguidelines.com/full-list/], XAG 115 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115] | 권장 |
| 조작 | 진동(햅틱) 끄기·세기 | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/] | 권장(진동을 쓰면 필수) |
| 게임플레이 | 연출·애니메이션 속도 | GAG 기본 "게임 속도 조절" [출처: 같은 URL] | 권장 |
| 게임플레이 | 턴 종료·카드 사용 확인 여부 | XAG 115 되돌리기·확인 원칙 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115] | 권장 |
| 게임플레이 | 툴팁 표시 지연 | 관행 [미검증] | 선택 |
| 게임플레이 | 튜토리얼·힌트 다시 켜기/끄기 | GAG 고급 "안내 다시 보기" [출처: https://gameaccessibilityguidelines.com/full-list/] | 권장 |
| 접근성 | 화면 흔들림 끄기 | XAG 117 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117] | 권장 |
| 접근성 | 배경 움직임 끄기·정지 | XAG 117, GAG 중급 [출처: 같은 URL들] | 권장 |
| 접근성 | 섬광 줄이기 | XAG 118, GAG 기본 "깜빡임 피하기" [출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines] | 필수(섬광 연출이 있으면) |
| 접근성 | 고대비 모드 | XAG 102 (고대비 시 7:1) [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102] | 선택 |
| 접근성 | 색각 보조(색 외 형태·기호 병행) | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/] | 필수(설정이 아니라 기본 설계로) |

### 우리 게임에 주는 시사점
- 설정은 "처음부터 맞게 설계해야 하는 것"(색 외 구분, 컨트롤러 탐색, 설정 저장)과 "토글로 노출하는 것"(흔들림, 연출 속도, 확인 창)을 나눠서 정보 구조를 짜는 게 좋아요.
- 기기별 값(해상도·창 모드·프레임)과 계정별 값(언어·볼륨·접근성·게임플레이)을 저장 단위에서부터 분리해야 Steam Cloud 지침과 맞아요.
- 설정 화면에는 "기본값으로 되돌리기"와 "적용 안 한 변경 확인" 흐름이 들어가야 해요.
- 일시정지 메뉴에서 같은 설정 화면에 들어갈 수 있어야 해요.
- 구체적인 슬라이더 범위·기본값은 정해진 근거가 없으니 TODO_TOKEN으로 남겨요.

---

## 2) 스팀덱·컨트롤러·저장

### 2-1. 스팀덱 / Steam Machine 호환성 검토 (Valve 공식)

- 등급은 Verified, Playable, Unsupported, Unknown이고, Verified 체크리스트에서 떨어지면 대부분 Playable이 돼요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- 입력: 기본 컨트롤러 설정만으로 모든 콘텐츠에 접근할 수 있어야 하고, 이를 위해 게임 안 설정을 바꿀 필요가 없어야 해요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- 문자 입력: 문자 입력이 필요하면 Steamworks API로 화면 키보드를 띄우거나, 컨트롤러만으로 쓸 수 있는 자체 입력을 넣어야 해요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]** (해당 API는 ISteamUtils의 ShowGamepadTextInput / ShowFloatingGamepadTextInput으로 알고 있지만 직접 열람하지 못했어요. **[미검증]**)
- 버튼 그림: 화면의 버튼 그림은 현재 입력 장치(덱, Steam 컨트롤러, Xbox)와 맞아야 하고, 키보드·마우스 그림은 그것이 현재 입력이 아닐 때 나오면 안 돼요. Steam Input API 사용을 강하게 권장해요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- 해상도: 덱이 지원하는 해상도로 돌아야 하고, 1280x800(우선) 또는 1280x720을 권장해요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- 글자 가독성: 가장 작은 글자가 1280x800에서 9픽셀 미만이면 안 되고, 권장은 12픽셀이에요. 30cm 거리에서 읽을 수 있어야 하고, 가능하면 글자 크기·대비를 사용자가 바꿀 수 있게 하라고 해요. **[출처: https://partner.steamgames.com/doc/steamhardware/compat]**
- 성능: 기본 설정으로 덱 800p에서 30fps가 나와야 해요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- 런처: 런처도 같은 요구를 만족해야 하고(컨트롤러 전체 탐색 포함), 런처를 거쳐야만 시작하는 구조는 강하게 비권장이에요. 기기가 미지원이라는 경고를 띄우면 안 돼요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]**
- Steam Machine 등급은 덱과 따로 매기지만, 덱 Verified면 Machine도 Verified가 보장돼요. 디스플레이 검사는 덱에만 있어요. **[출처: https://partner.steamgames.com/doc/steamhardware/compat]**
- 네이티브 리눅스 빌드가 없으면 Proton으로 돌고, Proton에서 막히는 버그는 Unsupported가 돼요. **[출처: https://partner.steamgames.com/doc/steamdeck/compat]** Electron 앱이 Proton에서 대체로 돌아간다는 것은 커뮤니티 경험담 수준이에요. **[미검증]**

### 2-2. 글자 크기 수치 비교

| 기준 | 값 | 출처 |
|---|---|---|
| 스팀덱 최소 | 1280x800에서 9px | [출처: https://partner.steamgames.com/doc/steamhardware/compat] |
| 스팀덱 권장 | 1280x800에서 12px | [출처: 같은 URL] |
| XAG 101 PC 최소 본문 | 1080p에서 18px (디센더 끝~어센더 끝) | [출처: https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md] |
| XAG 101 PC 기준을 800p로 환산 | 약 13.3px | [계산] 18 x 800 / 1080 |
| XAG 101 크기 조절 | 최소값의 200%까지 내용 손실 없이 | [출처: XAG 101 URL] |
| XAG 101 줄 길이 | 영문 80자, CJK 40자 이하(공백 제외) | [출처: XAG 101 URL] |
| XAG 102 대비 | 일반 글자 4.5:1, 큰 글자 3:1, 비활성 항목 글자 3:1, 고대비 모드 7:1 | [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102] |

우리 기준 캔버스가 1280x800이라 스팀덱 수치를 캔버스 단위 그대로 읽을 수 있어요. 다만 이 수치는 "최소선"일 뿐 우리 토큰 값이 아니에요. 실제 크기는 Lucy가 정할 때까지 TODO_TOKEN이에요.

### 2-3. 컨트롤러 기대치

- XAG 112: UI는 키보드와 컨트롤러의 디지털 입력만으로 모두 탐색 가능해야 하고, 모든 하위 메뉴에서 메인으로 돌아가는 경로가 늘 있어야 하며, 선택/뒤로 같은 매핑을 모든 화면에서 같게 유지해야 해요. 한 줄짜리 목록은 끝에서 처음으로 돌아가고(wrap), 격자형은 돌아가지 않게 하라고 해요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112]**
- 도감처럼 여러 쪽짜리 콘텐츠는 두 가지 이상의 방법(필터 탭과 검색 등)으로 찾을 수 있게 하라고 해요. **[출처: 같은 URL]**
- 버튼 안내는 버튼 구성이 바뀌어도 같은 자리, 같은 순서를 지키라고 해요. **[출처: 같은 URL]**

### 2-4. Steam Cloud

- 방법은 두 가지예요. 코드에서 쓰는 Steam Cloud API(ISteamRemoteStorage)와, 코드 수정 없이 Steamworks 사이트에서 경로만 지정하는 Auto-Cloud예요. **[출처: https://partner.steamgames.com/doc/features/cloud]**
- 동기화는 실행 전 내려받기, 종료 후 올리기가 기본이에요. 덱처럼 일시 중지되는 세션은 "동적 동기화"로 중지 시 올리고 재개 시 내려받으며, 게임에 파일 변경을 알려 줘요. **[출처: 같은 URL]**
- 파일은 작게, 바뀌는 빈도별로 나누고, Steam 사용자별로 경로를 분리하라고 해요. 기기별 비디오 설정은 클라우드에서 빼라고 해요. **[출처: 같은 URL]**
- 체험판과 정식판이 저장을 공유하는 "Shared Cloud App ID"가 있어요. **[출처: 같은 URL]**

### 2-5. 로그라이트 저장·이어하기 관행

- 덱빌더 로그라이트는 보통 진행 중인 런 하나를 자동 저장 슬롯 하나에 두고, "저장 후 종료"로 나간 뒤 타이틀에서 "이어하기"로 돌아오는 구조예요. 슬레이 더 스파이어는 방(노드)에 들어갈 때 저장하고, 전투 도중 종료하면 그 방의 시작으로 돌아가는 방식으로 알려져 있어요. **[미검증]**
- 런 포기는 되돌릴 수 없는 행동이라 확인 단계가 필요해요. XAG 115는 영구적·파괴적 행동에 검토·확인·되돌리기 수단을 두고, 확인을 길게 누르기로만 받지 말라고 해요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115]** 기본 포커스를 안전한 선택지(취소)에 두는 것은 XAG가 명시하지 않은 추론이에요. **[미검증]**
- 덱의 일시 중지·재개는 플랫폼이 처리하지만, 동적 클라우드 동기화가 있으므로 저장 파일은 언제 끊겨도 일관된 상태여야 해요. **[출처: https://partner.steamgames.com/doc/features/cloud]** (원자적 쓰기 같은 구현 방식은 일반 관행이에요. **[미검증]**)

### 우리 게임에 주는 시사점
- 기준 캔버스가 덱 네이티브와 같아서, 모든 게임 밖 화면에서 가장 작은 글자가 캔버스 기준 9px 아래로 내려가지 않는지가 검사 항목이 될 수 있어요. 권장선 12px과 XAG 환산치 약 13px도 참고선으로 둘 수 있어요.
- 모든 게임 밖 화면(허브, 런 준비, 진화 분기, 도감 포함)이 컨트롤러 디지털 입력만으로 끝까지 가야 해요. 마우스 호버에만 기대는 정보(툴팁)는 포커스로도 열려야 해요.
- 버튼 안내 그림은 마지막 입력 장치에 따라 바뀌어야 해요. 키보드·마우스 그림이 컨트롤러 사용 중에 남아 있으면 Verified에서 떨어져요.
- 문자 입력(예: 정령 이름 짓기, 시드 입력)이 생기면 화면 키보드 연동이 필요해요. 문자 입력을 아예 두지 않는 것도 선택지예요.
- 별도 런처 없이 바로 타이틀로 들어가야 해요.
- 저장은 "메타 진행(정원·정령·해금·기록)"과 "진행 중 런" 두 덩어리, 그리고 클라우드에서 뺄 "기기 설정"으로 나누는 구조가 문서 권고와 맞아요.
- 런 포기와 저장 후 종료는 다른 행동이므로 일시정지 메뉴에서 분명히 구분되어야 해요.

---

## 3) 접근성: 턴제 카드 게임에서 싸고 기대되는 항목

### 3-1. 턴제 카드 게임이라 이미 유리한 점
- 시간 압박이 없는 구조는 GAG 고급 "정밀한 타이밍을 필수로 만들지 않기", XAG 116 시간 제한 항목을 기본으로 만족해요. **[출처: https://gameaccessibilityguidelines.com/full-list/]**, **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines]**
- 연타·QTE가 없으면 GAG 중급 "반복 입력 피하기"도 만족해요. **[출처: https://gameaccessibilityguidelines.com/full-list/]**
- 음성 대사가 거의 없다면 자막 부담이 작아요. 다만 XAG 104는 중요한 효과음에도 캡션을 요구하니, 소리로만 알리는 정보가 없게 하면 돼요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines]** (104 세부 내용은 미열람)

### 3-2. 싸고 기대되는 항목

| 항목 | 근거 | 비용 감 |
|---|---|---|
| 색만으로 정보를 전달하지 않기(속성·희귀도·상태에 기호·글자 병행) | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/], XAG 103 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines] | 설계 단계에서는 쌈, 나중엔 비쌈 |
| 텍스트 대비 기준 지키기(4.5:1 / 3:1, 비활성 항목 3:1) | XAG 102 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102] | 쌈 |
| 글자를 이미지에 굽지 않기(로고 제외) | XAG 102 [출처: 같은 URL] | 쌈 |
| 글자·UI 크기 단계 조절 | GAG 중급·고급, XAG 101 [출처: XAG 101 URL] | 중간(레이아웃이 늘어남을 견뎌야 함) |
| 화면 흔들림·섬광·배경 움직임 끄기 | XAG 117, 118 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117] | 쌈 |
| 연출 속도 조절(빠르게/건너뛰기) | GAG 기본 "게임 속도 조절" [출처: https://gameaccessibilityguidelines.com/full-list/] | 쌈 |
| 텍스트를 자기 속도로 넘기기(자동 넘김 없음) | GAG 기본 [출처: 같은 URL] | 쌈 |
| 길게 누르기 대신 토글 / 길게 누르기 확인 금지 | GAG 중급, XAG 115 [출처: 위 URL들] | 쌈 |
| 키 재배치 | GAG 기본 [출처: https://gameaccessibilityguidelines.com/full-list/] | 중간 |
| 상호작용 가능한 요소가 상호작용 가능해 보이게 | GAG 중급 [출처: 같은 URL] | 쌈 |
| 안내·튜토리얼 다시 보기 | GAG 고급 [출처: 같은 URL] | 쌈(도감·도움말에 넣으면 됨) |
| 파괴적 행동 확인·되돌리기(카드 사용 취소, 런 포기 확인) | XAG 115 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115] | 쌈~중간 |
| 첫 실행에 핵심 접근성 선택지 노출 | XAG 112 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112] | 쌈 |
| 대문자만 쓰지 않기, 가운데·양끝 정렬 피하기(긴 글) | XAG 101 [출처: XAG 101 URL] | 쌈(한국어는 대문자 문제 없음) |
| 스크린 리더 / 음성 내레이션 | XAG 106 [출처: https://learn.microsoft.com/en-us/gaming/accessibility/guidelines] | 비쌈(선택) |

### 우리 게임에 주는 시사점
- 가장 싸고 효과가 큰 것은 "설정"이 아니라 "기본 설계"예요. 정령 속성·카드 희귀도·상태 표시 같은 구분은 처음부터 색 외 단서를 함께 가져야 해요.
- 글자 크기 조절을 넣을 거라면 게임 밖 화면 레이아웃이 글자 200% 확대를 두 방향 스크롤 없이 견디도록 정보 구조를 정해야 해요. XAG 101은 한 방향 스크롤은 허용해요.
- 흔들림·섬광·배경 움직임·연출 속도는 토글 네 개 정도로 묶여서 비용이 작아요.
- 첫 실행에 언어, 글자 크기, 모션 줄이기 같은 몇 가지를 먼저 묻는 흐름이 XAG 112와 맞아요. 다만 GAG 기본 "여러 단계 메뉴 없이 게임 시작"과도 균형을 맞춰야 해서, 묻는 개수는 적게 두는 편이 맞아요.
- 대비 기준(4.5:1 등)은 시안 단계에서 측정 가능한 검사 항목으로 쓸 수 있어요. 미적 판단과 별개예요.

---

## 4) 온보딩 성공·실패 사례

### 4-1. 확인된 데이터

- Steam 환불은 구매 후 14일 이내, 플레이 2시간 미만이면 요청할 수 있어요. 앞서 해보기 기간 플레이도 2시간에 포함돼요. **[출처: https://store.steampowered.com/steam%5Frefunds/]**
- 4만 5천 명 이상을 대상으로 한 A/B 연구(Andersen 외, CHI 2012)에서, 튜토리얼은 가장 복잡한 게임에서만 플레이 시간을 최대 29% 늘렸고, 더 단순한 두 게임에서는 유의미한 효과가 없었어요. 실험으로 배울 수 있는 게임이면 튜토리얼 투자 가치가 낮을 수 있다고 결론 내렸어요. **[출처: https://grail.cs.washington.edu/projects/game-abtesting/chi2012/]**
- Steam 체험판 130개를 모은 조사에서 플레이 시간 중앙값의 중앙값은 14분, 하위 30%는 10분 이하, 평균 19.75분이었어요. 매출 등급별 중앙값은 브론즈 7분, 실버 18분, 골드 38분, 다이아 65분이었어요. 대부분의 개발자는 30분짜리 체험판을 의도했지만 평균 플레이어는 의도한 길이를 다 하지 않는다고 해요. **[출처: https://howtomarketagame.com/2022/10/26/what-is-a-good-median-play-time-for-a-demo-benchmark/]**
- 같은 저자는 구간별 분석 이벤트를 넣어 어디서 이탈하는지 보라고 권하고, 한 개발자는 특정 이벤트에서 급격한 이탈을 발견해 버그를 찾았다고 해요. 덱빌더 Peglin 체험판은 중앙값 67분이었어요. **[출처: https://howtomarketagame.com/2021/11/08/retention-the-most-important-number-you-are-not-paying-attention-to/]**
- 발라트로 개발자는 포커 테마를 "주로 온보딩 도구로" 얹었다고 말했어요. 익숙한 규칙을 빌려 학습 비용을 줄인 사례예요. **[출처: https://rogueliker.com/balatro-interview/]**
- 하데스는 죽음을 이야기 진행의 보상으로 만들어 실패의 좌절을 줄였어요. 캐릭터가 실패한 런에 반응하고, Kasavin은 "모든 런이 의미 있다(every run counts)"를 목표로 말했어요. 죽을 때마다 피해 저항이 조금씩 쌓이는 God Mode도 있어요. 일일 접속 보상 같은 장치는 의도적으로 넣지 않았어요. **[출처: https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible]**, **[출처: https://www.gamedaily.biz/?p=588]**
- 같은 기사에 실린 Steam 업적 기준 완주율(기자 스스로 비과학적이라고 밝힘): 하데스 27.5%, 로그 레거시 22.2%, 데드 셀 37.3%, 스펠렁키 8.1%, FTL 4.0%. **[출처: https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible]**
- GAG는 기본 등급에서 "상호작용형 튜토리얼"을, 중급에서 "실패 없는 연습 수단", "맥락에 맞는 게임 내 도움말", "조작 상기"를 권해요. **[출처: https://gameaccessibilityguidelines.com/full-list/]**

### 4-2. 장르 사례 (출처 미확인 포함)

- 슬레이 더 스파이어 1은 별도 튜토리얼 없이 첫 런에 바로 들어가고, 첫 전투 몇 번에 짧은 안내를 띄우는 방식이에요. 캐릭터 하나만 열린 상태로 시작해요. **[미검증]** 캐릭터별 누적 점수 300/750/1000/1500/2000에서 카드·유물·다음 캐릭터가 해금된다는 정리는 팬 사이트에서 확인했어요. **[출처: https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/]**
- 몬스터 트레인 시리즈는 첫 실행에 짧은 안내 런을 거치게 하고 일부 클랜만 열어 둔다고 알려져 있어요. **[미검증]** 몬스터 트레인 2는 런 승패와 관계없이 고른 클랜에 경험치가 쌓이고, 일정 단계마다 그 클랜의 카드가 열려요. **[출처: https://www.destructoid.com/how-to-unlock-new-cards-in-monster-train-2/]**
- 인투 더 브리치는 첫 실행에 짧은 튜토리얼 전투를 제공하고 건너뛸 수 있다고 알려져 있어요. **[미검증]** 해금 가능한 분대는 런 시작 전에 구성이 정해져 무작위성을 줄이는 역할을 한다고 개발자가 설명했어요. **[출처: https://gamedeveloper.com/design/-i-into-the-breach-s-i-designers-explain-how-to-follow-up-from-a-hit-game]**
- 인스크립션은 규칙 설명 자체를 이야기 연출(상대가 규칙을 알려 주는 형식)에 녹였다는 평가가 많아요. **[미검증]**
- 발라트로는 첫 실행에 짧은 안내 모드를 켜고 끌 수 있게 했다고 알려져 있어요. **[미검증]**
- 실패 사례로 흔히 꼽히는 패턴은 "첫 실행 전에 긴 글 튜토리얼", "건너뛸 수 없는 튜토리얼", "첫 런에 모든 시스템을 한꺼번에 공개"예요. 덱빌더에 대한 정량 실패 데이터는 찾지 못했어요. **[미검증]**
- 슬레이 더 스파이어 GDC 2019 강연은 지표 기반 밸런싱이 주제이고, 온보딩을 다룬다는 내용은 소개 기사에서 확인되지 않았어요. **[출처: https://gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019]**

### 우리 게임에 주는 시사점
- 환불 기준이 2시간이므로, 첫 세션 안에 "런 하나 끝 → 정원 복귀 → 정령 성장 한 번 → 무언가 해금"까지 핵심 고리 전체를 한 번 경험하게 흐름을 짜는 것이 목표가 될 수 있어요. 시간 목표 자체는 근거가 없어 TODO로 남겨요.
- 체험판 중앙값이 10~20분대라는 점을 보면, 타이틀에서 첫 전투까지 거치는 화면 수를 최소로 두는 것이 중요해요. 첫 실행 설정 질문, 정원 소개, 정령 소개가 모두 첫 전투 앞에 몰리면 위험해요.
- 카드 규칙이 실험으로 배울 수 있는 수준이면 별도 튜토리얼보다 첫 런 안의 맥락형 안내가 맞다는 것이 CHI 연구와 장르 관행이 함께 가리키는 방향이에요. 정원(메타) 화면은 첫 런을 끝낸 뒤에 소개하는 순서가 자연스러워요.
- 하데스처럼 첫 패배가 "허브에서 무언가 진행된다"로 이어져야 첫 실패의 이탈을 줄일 수 있어요.
- 안내는 끄고 다시 보기가 가능해야 하고(GAG), 도감·도움말에서 다시 열 수 있어야 해요.
- 출시 전 플레이테스트 빌드에 구간별 이탈 이벤트(타이틀, 첫 전투 시작, 첫 런 종료, 첫 허브 진입 등)를 넣는 것을 권해요.

---

## 5) 메타 진행·해금 알림

### 5-1. 무엇이 런 밖에 남나 (사례)

- 하데스: 런 사이에 영구 진행 시스템과 이어지는 이야기가 남아요. Kasavin은 영구 진행을 전통 로그라이크와의 차이점으로 꼽았어요. **[출처: https://www.gamedaily.biz/?p=588]**
- 슬레이 더 스파이어 1: 캐릭터별 누적 점수로 카드·유물·캐릭터가 열리고, 한 캐릭터로 처음 클리어하면 승천(난이도) 모드가 열려요. **[출처: https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/]**
- 발라트로: 조커 150장 중 105장이 처음부터 열려 있고 45장은 특정 조건을 만족해야 열려요. **[출처: https://www.giga.de/games/balatro-alle-joker-freischalten--01JYP8RPYMGMY8WQJHTKKGXH3E]** 판돈(난이도) 단계는 덱마다 따로 진행돼요. **[출처: https://casualgameguides.com/walkthroughs/balatro/unlock-guide-decks-jokers-stakes]**
- 몬스터 트레인 2: 고른 클랜에 런마다 경험치가 쌓이고 단계마다 카드가 열려요. **[출처: https://www.destructoid.com/how-to-unlock-new-cards-in-monster-train-2/]**
- 슬레이 더 스파이어 2: "에포크"가 타임라인의 장(章)으로 배치되고, 첫 런 완료, 특정 캐릭터로 막 클리어, 엘리트·보스 처치 수, 유물·포션 해금 수 같은 조건으로 열려요. **[출처: https://www.destructoid.com/how-to-unlock-all-epochs-in-slay-the-spire-2/]** 런 도중이나 끝에 "에포크 발견/해금" 알림이 뜨고, 보상은 자동으로 런에 들어가지 않아서 플레이어가 타임라인 메뉴를 열어 직접 공개해야 해요. 열리는 것은 카드, 유물, 포션, 캐릭터 등이에요. **[출처: https://gamerblurb.com/articles/slay-the-spire-2-epoch-system-how-epoch-unlocks-work]**

### 5-2. 처음에 잠가 두는 이유

- 처음부터 일부 카드를 잠가 첫 런의 선택지를 줄이고, 해금이 곧 다음 런의 동기가 되게 한다는 설명은 장르에서 널리 쓰이지만 개발자 원문으로는 확인하지 못했어요. **[미검증]**
- 인투 더 브리치 개발자는 해금형 분대가 무작위성을 줄이고 런마다 접근을 바꾸게 한다고 설명했어요. **[출처: https://gamedeveloper.com/design/-i-into-the-breach-s-i-designers-explain-how-to-follow-up-from-a-hit-game]**
- 발라트로는 잠긴 비율이 약 30%(45/150)로, 대부분을 열어 둔 채 일부만 목표로 남긴 사례예요. **[계산]** 위 출처 수치 기준.

### 5-3. 알림과 피로

- 알림 배지를 남발하면 사용자가 배지를 무시하게 되는 "레드 닷 맹시"가 생기고, 중요도에 맞춰 신호 강도를 고르며 덜 급한 정보는 조용한 방식으로 알리라는 권고가 있어요(앱 일반 글). **[출처: https://www.braze.com/resources/articles/beware-red-dot-badging.md]**
- XAG 101은 토스트·알림 텍스트도 글자 크기·가독성 요구 대상에 넣어요. **[출처: https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md]**
- XAG 117은 자동으로 갱신되는 콘텐츠에 갱신 빈도 조절과 멈춤·숨김 수단을 두라고 해요. **[출처: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117]**
- 슬레이 더 스파이어 2의 "직접 열어 공개" 방식은 알림을 런 흐름 밖(허브 메뉴)으로 모아 한 번에 보게 하는 구조예요. **[출처: https://gamerblurb.com/articles/slay-the-spire-2-epoch-system-how-epoch-unlocks-work]** 이것이 알림 피로를 줄이려는 의도였는지는 개발자 발언으로 확인하지 못했어요. **[미검증]**
- 하데스는 일일 보상 같은 외부 동기 장치를 의도적으로 뺐어요. **[출처: https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible]**
- 일반적인 게임 UI 관행으로는 (1) 런 결과 화면에서 이번 런으로 열린 것을 한 번에 묶어 보여 주기, (2) 처음 보는 항목에 "새것" 표시를 두고 한 번 보면 지우기, (3) 표시를 상위 메뉴로 전파하되 개수를 제한하기, (4) 전투 중에는 끼어들지 않고 런 종료 후로 미루기가 쓰여요. **[미검증]**

### 우리 게임에 주는 시사점
- 런 밖에 남는 것을 "정령 성장(진화 분기 포함)", "해금된 카드·요소", "기록·도감", "이야기/정원 상태"처럼 범주로 먼저 정리하고, 화면마다 어느 범주를 보여 주는지 정하는 것이 정보 구조의 출발점이에요.
- 해금 알림은 전투 중이 아니라 런 결과 화면이나 정원 복귀 시점으로 모으는 흐름이 장르 사례와 맞아요. 한 번에 여러 개가 열리면 묶어서 보여 주는 단계가 필요해요.
- "직접 열어 받기"(StS2 방식)와 "자동 지급 + 요약"(StS1·몬스터 트레인 방식) 중 무엇을 쓸지는 결정 사항이에요. 직접 받기는 허브에 들를 이유를 만들지만, 보상을 놓칠 위험이 있어 알림이 꼭 필요해요.
- "새것" 표시는 한 번 보면 사라지게 하고, 정원 허브 최상위에서 표시가 쌓이지 않도록 기준을 두는 게 좋아요. 구체 표현은 Lucy 결정 사항이에요.
- 첫 실행에는 일부만 열어 두되(발라트로처럼 대부분 열고 일부 잠그기, 또는 StS처럼 캐릭터 단위로 잠그기), 잠긴 항목이 도감에서 어떻게 보일지(조건 공개/비공개)도 함께 정해야 해요.
- 진화 분기 선택은 되돌릴 수 없다면 XAG 115의 확인·검토 원칙을 적용해야 해요.
- 첫 패배 직후에도 무언가 진행되도록 해금 속도를 맞추는 것이 4장의 이탈 시사점과 이어져요. 구체 곡선은 근거가 없어 TODO로 남겨요.

---

## 출처 목록

Valve / Steam
- https://partner.steamgames.com/doc/steamdeck/compat
- https://partner.steamgames.com/doc/steamhardware/compat
- https://partner.steamgames.com/doc/features/cloud
- https://partner.steamgames.com/doc/features/steam_controller (목차만 확인)
- https://store.steampowered.com/steam%5Frefunds/

접근성 가이드라인
- https://gameaccessibilityguidelines.com/full-list/
- https://learn.microsoft.com/en-us/gaming/accessibility/guidelines
- https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/112
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/115
- https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117

온보딩·데이터
- https://grail.cs.washington.edu/projects/game-abtesting/chi2012/
- https://howtomarketagame.com/2022/10/26/what-is-a-good-median-play-time-for-a-demo-benchmark/
- https://howtomarketagame.com/2021/11/08/retention-the-most-important-number-you-are-not-paying-attention-to/
- https://rogueliker.com/balatro-interview/
- https://www.vice.com/en/article/how-hades-made-a-genre-known-for-being-impossibly-hard-accessible
- https://www.gamedaily.biz/?p=588
- https://gamedeveloper.com/design/-i-into-the-breach-s-i-designers-explain-how-to-follow-up-from-a-hit-game
- https://gamedeveloper.com/design/learn-i-slay-the-spire-i-s-metrics-driven-approach-to-game-balancing-at-gdc-2019

메타 진행·해금
- https://slaythespire.info/en/how-to-unlock-characters-cards-and-relics-spoiler-warning/
- https://www.giga.de/games/balatro-alle-joker-freischalten--01JYP8RPYMGMY8WQJHTKKGXH3E
- https://casualgameguides.com/walkthroughs/balatro/unlock-guide-decks-jokers-stakes
- https://www.destructoid.com/how-to-unlock-new-cards-in-monster-train-2/
- https://www.destructoid.com/how-to-unlock-all-epochs-in-slay-the-spire-2/
- https://gamerblurb.com/articles/slay-the-spire-2-epoch-system-how-epoch-unlocks-work
- https://www.braze.com/resources/articles/beware-red-dot-badging.md

확인하지 못한 것: Steam Input / ISteamUtils API 문서(가져오기 한도 소진), StS·몬스터 트레인·인스크립션·발라트로의 튜토리얼 구조에 대한 개발자 원문, 덱빌더 첫 세션 이탈률 정량 데이터.
