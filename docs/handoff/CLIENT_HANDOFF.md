# 클라이언트 인수인계 (2026-10-30, main 5a3f1ea 기준)

전투 화면을 정본에 맞춰 옮겨 온 세션(PR #6~#13)이 남기는 노트예요. 다음 세션은 `CLAUDE.md` → 이 문서 → `design/canon/README.md` → `docs/architecture/0001-client-architecture.md` 순서로 읽으면 돼요.

---

## 1. Lucy와 일하는 원칙

### Lucy가 직접 준 지시
- "정본에 충실하게. 비율·배치·정렬을 시각 검증하며 따라가." 감으로 맞추지 않고, 정본 CSS 수치를 옮긴 다음 `pnpm visual`로 겹쳐 봐요.
- "단계별로 바로바로 머지하면서 진행." 한 단계가 끝나면 PR을 올리고, CI가 초록이면 머지해요.
- "미확정 값과 그림은 임시 구역으로 분리하고 플레이스홀더로." (2026-10-30) → 4절 참고.
- 메타 고민(예: "이게 게임 UI 같냐")은 지금 하지 않기로 했어요. 시각 스킨 방향은 나중에 Lucy가 꺼낼 때 다뤄요.
- 작업 방식: Lucy가 자기 PC(luddal-win)에서 에이전트를 직접 돌려요. 원격에서 대신 조작하는 방식은 Lucy가 불편해했어요.

### 실제로 혼났거나 고친 것 (반복하지 말 것)
- **정본 값을 확정 토큰에 넣었던 것.** 정본 시안의 색·크기는 Lucy가 확정한 값이 아니에요. "정본을 따른다"와 "그 값을 확정한다"는 다른 일이에요. 지금은 `provisional` 구역에만 둬요.
- **정본에 없는 선을 지어낸 것.** 말풍선 `.calc`의 `border-top: 1px solid var(--me)`는 정본에서 `--me`가 정의되지 않아 실제로는 그려지지 않아요. 저는 처음에 선을 그렸다가 지웠어요. **정본 CSS를 읽을 때는 그 값이 브라우저에서 실제로 적용되는지(정의 안 된 변수, 덮어쓰기, 무효 선언)까지 확인해요.** 판단 기준은 CSS 원문이 아니라 정본 캡처(frame-*.png)예요.
- 개발 서버가 레거시 화면으로 뜬다는 지적 → 기본 주소를 새 전투 화면으로 바꿨어요(`?screen=legacy`가 예전 UI).
- 화면이 창에 맞춰 확대돼 흐려진다는 지적 → 1280×800 고정 뷰포트로 바꾸고, 브라우저에서는 개발용 창 틀(제목줄·전체 화면·닫기)을 씌웠어요.

### 결정이 필요한 것은 묻기
- 새 레이아웃, 새 색, 새 모션 값, 새 그림, 네이밍은 만들지 않고 2~3개 선택지와 근거를 들고 Lucy에게 물어요. 결정 카드 하나에 추천 하나.
- 정해지지 않은 값은 `TODO_TOKEN`. 정본에도 없는 값(예: 정본 스크립트에 "시안 값"이라고 적힌 수치)은 `provisional`에 두고 주석에 출처를 적어요.

---

## 2. 정본 (canon)

- 위치: `design/canon/battle-r5/` (전투 R5 "판단 동선", 1280×800). 원본 아티팩트: https://claude.ai/artifact/Kqa9pCZnjAs6juuboj1wRh
  - `page.html`, `frame-old.css`, `r5.css`, `page-base.css`, `img/`: 시안 소스 그대로. 수정 금지.
  - `frame-rest.png`, `frame-h1.png`, `frame-h2.png`, `frame-h3.png`, `frame-gimmick.png`: 상태별 캡처.
- 상태 프레임과 구현 현황

| 프레임 | 내용 | 구현 |
| --- | --- | --- |
| rest | 쉬는 상태 전체 | ✅ (차이 3.75%, 대부분 플레이스홀더 그림) |
| H1 | 손패 호버: 들기, 옆 카드 밀림, 흐림, 말풍선, 적 호버 숨김 | ✅ (`--hover claw` 3.85%) |
| H2 | 카드 집기·끌어 대기·대상 강조와 결과 미리보기 (0013, 조준선 없음) | ✅ PR #15, 끌기 브랜치 |
| H3 | (정본 프레임 참고) | ❌ |
| gimmick | 기믹·차징 상태 | ❌ |

- 정본 H1 캡처의 drops 카드는 held/aim 상태가 섞여 있어요. 그 부분은 H2 범위라서 H1 비교는 `claw`로 해요.
- 관련 결정: `docs/design-decisions/0006`(팔레트·글꼴), `0007`(전투 R5), `0008~0011`(카드), 장부 `design/concepts/LEDGER.md` §2.

---

## 3. 정본 → 코드 옮기는 방식 (관행)

1. **수치는 정본 CSS에서 그대로.** `src/presentation/<화면>/layout.ts`에 모으고, 주석에 출처 선택자와 원문을 적어요.
   - 예: `/** .mana left 22 top 672 80×80, inset 1.5 테, padding-top 16 · .ml bottom 13 */`
   - 화면 파일 안에 숫자를 직접 쓰지 않아요. `pnpm check:design`이 `design/strict-paths.txt` 경로에서 리터럴을 잡아요.
2. **색·글자 크기·재질·모션은 토큰에서.** `tokens.provisional.palette / text / pattern / motion`. `layout.ts`에는 색을 두지 않아요.
3. **CSS 의미를 그대로 재현.**
   - 글자 상자 = 브라우저 인라인 상자(글꼴 ascent+descent). 줄 높이 = 크기 × line-height. 기준선 맞춤. → `style/text.ts`
   - flex(gap, padding, align, space-between, grow, margin-left:auto) → `style/flex.ts`
   - `inset box-shadow` 테두리, 바깥 `box-shadow`, 그라데이션, 반복 무늬 → `style/draw.ts`, `shadow.ts`, `gradient.ts`
   - `cubic-bezier`, `160ms` → `style/ease.ts`
   - CSS `opacity`(겹친 자식이 한 덩어리로 흐려짐) → 컨테이너 alpha가 아니라 ColorMatrix 필터 alpha (6절)
4. **겹쳐 보고 고치기.** `pnpm visual` → `test-results/visual/side.png`, `overlay.png`, `diff.png`, 필요하면 `--crop x,y,w,h`(3배 확대). 남는 차이는 원인을 설명할 수 있어야 해요(플레이스홀더 그림, 글꼴 래스터 차이 정도).
5. **정본 데이터는 fixture로.** `src/presentation/battle/fixtures/canonRest.ts`는 정본 스크립트의 CARDS·적·정령 데이터를 옮긴 고정 장면이에요. 아직 `src/core`와 연결되어 있지 않아요.

---

## 4. 값과 그림의 자리

### 토큰
- 원본: `design/tokens/tokens.json` (DTCG). `pnpm tokens` → `src/design/tokens.ts`. 생성 파일은 손으로 고치지 않아요.
- **확정 구역** `color · font · size · motion · screen`: Lucy가 고른 값만 넣어요. 지금은 글꼴만 확정이에요(Orbit + 빠진 글자는 Pretendard, 결정 0006). 나머지 53개는 `TODO_TOKEN`이에요.
- **임시 구역** `provisional`: 정본에서 옮긴 값.
  - `palette`: 정본 CSS 변수 그대로. 별칭은 `{provisional.palette.x}`로 써요.
  - `text.battle`: 정본 글자 크기.
  - `pattern.material`: 카드 재질 무늬(불=밝은 용암석 등).
  - `motion.hover`: `160ms`, `cubic-bezier(.2,.7,.2,1)`. 정본 스크립트에서도 TODO로 표시된 "시안 값"이에요.
- Lucy가 값을 고르면 `provisional`에서 확정 구역으로 옮기고, 코드는 확정 토큰을 보게 바꿔요.

### 그림
- 미확정 그림(아군 실루엣 sil-*, 적 도형 en-*, 카드 그림 자리)은 `style/placeholder.ts`의 `placeholderArt`(X 상자)로 비워 둬요. 자리와 크기만 맞아요.
- 기능 기호(수치·상태·시스템)는 정본 `<symbol>`을 `tools/canon/extract-icons.ts`로 꺼낸 SVG(`public/assets/ui/icons`)를 써요. 한 색 기호는 흰색으로 저장돼 있고, 틴트로 칠해요(`style/icons.ts`).
- 정령 얼굴은 `public/assets/ui/faces/<face>-face.webp`(TTI 결과물, provenance 기록됨)예요. `src/presentation/faces.ts`의 `FACES`.
- 모든 SVG는 `assets/provenance.jsonl`에 placeholder로 기록돼 있어요(37개). `pnpm check:assets --release`는 출시 전에 이걸 잡아요. 새 TTI 에셋은 반드시 기록해요(`assets/PROVENANCE.md`).

---

## 5. 코드 지도

```
src/app/main.ts                기본 = 새 전투 화면, ?screen=legacy = 예전 임시 UI, ?hover=<cardKey>
                               브라우저면 개발용 창 틀(index.html #dev-window, body.dev-window)을 켬
src/presentation/game.ts       Phaser.Game (WEBGL, 1280×800, Scale.NONE). 글꼴 로드 후 시작, postBoot에서 BattleScene 추가
src/presentation/faces.ts      IconId, FaceId, FACES, faceKey, preloadFaces (battle↔card 순환을 끊으려고 여기 둠)
src/presentation/battle/
  BattleScene.ts               init({vm?, hover?}) → create()에서 views를 순서대로 그림
  layout.ts                    FRAME BG FLOOR WHERE SYS ORDER ALLY ENEMY GROUND HOVER_RING INFO INTENT BAND MANA HAND END ETIP HOVER
  viewmodel.ts, copy.ts        BattleVM 타입, 화면 문구
  fixtures/canonRest.ts        정본 고정 장면
  views/backdrop.ts            배경 방사 그라데이션 + 바닥
  views/topbar.ts, order.ts    위치·시스템 버튼, 행동 순서 띠
  views/units.ts               아군·적(그림 자리, 그림자, 정보판, 의도 알약). drawEnemy → { ring }
  views/enemyTip.ts            적 툴팁 (gather로 Container)
  views/hand.ts                손패: 묶음·카드·얼굴, 호버 상호작용. createHand(scene, hand, onHover?) → { setHover(key|null, instant?) }
src/presentation/card/
  HandCard.ts                  createHandCard → { root(원점=아래 가운데), setLifted(on), opacity }
  CardBubble.ts                drawCardBubble(scene, detail, left, bottom, tipX) → Container
  materials.ts                 bandTexture, windowTexture, paintPattern, MATERIAL_FILL, liftedBodyTexture
  layout.ts                    HAND_CARD, WINDOW_PATH(정령별 창 윗선 SVG path), BUBBLE
  viewmodel.ts                 CardVM(key, detail…), CardDetailVM {text, calc?, why?, owner}, RichText
src/presentation/style/        CSS 재현 도우미 (6절)
src/presentation/placeholder/  예전 임시 UI. 새 화면이 규칙에 연결될 때마다 해당 화면을 지움
src/core, src/data             게임 로직·데이터. UI 작업에서 건드리지 않음. 바꾸면 골든 스냅샷 이유를 PR에
src/platform, electron/        저장·창. 렌더러는 Electron을 직접 import하지 않음(window.platformBridge)
tools/visual/compare.ts        pnpm visual
tools/canon/extract-icons.ts   정본 기호 꺼내기
scripts/                       build-tokens, check-literals, check-assets
```

의존 방향은 `pnpm lint:deps`(dependency-cruiser, 순환 금지 포함)가 강제해요. presentation 안에서 battle과 card가 서로를 import하면 순환으로 걸려요. 공용 타입은 `faces.ts` 같은 상위 파일로 빼요.

---

## 6. 렌더링 디테일 (Phaser 4에서 CSS를 맞추며 배운 것)

### 글자
- 글꼴이 준비된 뒤에 Phaser를 시작해야 폭이 맞아요(`loadFonts()` → `new Phaser.Game`).
- `textStyle()`은 `metrics`에 브라우저와 같은 `fontBoundingBoxAscent/Descent`를 넣어요. 안 넣으면 Phaser가 자체 측정해서 세로 위치가 1~2px 어긋나요.
- 한 줄에 크기가 다른 조각 → `inlineLine(scene, x, top, strut, spans, lineHeight)`. strut = 부모 글자 크기(CSS 기본 16px 포함), 반-leading까지 계산해요.
- Phaser Text 너비는 정수로 올림돼서, 다음 조각의 위치는 canvas `measureText` 폭으로 계산해요. letter-spacing은 마지막 글자 뒤에도 붙어요(CSS와 같음).
- 줄바꿈 `wrapSpans`: 브라우저 기본처럼 공백과 **한글 음절 사이**에서 끊고, 줄 끝 공백은 버려요. 끊은 뒤 같은 모양의 이웃 조각은 다시 합쳐요(자간이 브라우저와 같아지게).
- 점선 밑줄 `Span.dotted`: 1px 점을 2px 간격으로(Chrome dotted와 같은 결), offset은 `text-underline-offset`.

### 도형
- WebGL에서는 선에 안티에일리어싱이 없어서, 얇은 테(1~1.5px)나 둥근 테는 **canvas에 구워서** 텍스처로 써요(적 호버 링, 원형 얼굴 자르기, 그림자).
- `fillRoundedRect`에 반지름 0을 주면 일부만 그려져요. `draw.box`는 r=0이면 `fillRect`를 써요(밴드 1px 선이 사라졌던 원인).
- `fillPoints`는 타입 문제가 있어서 마름모(말풍선 꼬리)는 `fillTriangle` 두 번으로 그려요.
- 그리는 순서 = 겹침 순서. 같은 Graphics에 그린 것은 그 뒤에 올린 이미지 아래로 가요. 카드의 비용 동전·홈은 창 그림 위에 오도록 별도 "top" Graphics에 그려요.
- CSS `transparent`로 그라데이션을 끝내면 검정이 섞여 탁해져요. `transparentOf(color)`(같은 색 alpha 0)를 써요.
- 바깥 그림자 `shadowTexture(scene, w, h, radius, {y, blur, color})`: canvas `shadowBlur` = CSS blur 반경. 돌려준 margin만큼 빼서 놓아요.

### 묶음과 움직임
- `gather(scene, x, y, draw)`: draw 안에서 장면에 바로 올린 객체를 Container로 옮겨요. 기존 그리기 코드를 고치지 않고 통째로 움직이거나 키울 때 써요(카드, 묶음, 툴팁).
- CSS `opacity`는 자식들을 한 장으로 합친 뒤 흐리게 해요. 컨테이너 `alpha`는 자식마다 따로 흐려서 겹친 부분이 탁해져요. → `root.enableFilters().filters.internal.addColorMatrix()`로 행렬 alpha를 써요(`HandCardView.opacity`).
- 호버 H1 동작(정본 스크립트 "시안 값", `HOVER`)
  - 든 카드: `translateY(-30) scale(1.2)`, 원점은 카드 아래 가운데. 든 몸통 텍스처(재질 전체 + 흰 광택선 + 1px 테)와 그림자 `0 10px 24px`로 바꿔요.
  - 같은 묶음 옆 카드 ±12, 옆 묶음 ±10, 나머지 카드 opacity .62.
  - 말풍선: 폭 240, 아래 끝 y=598, 가로는 `clamp(8, 1280-8-240, cx-120)`. 꼬리는 카드 가운데. 나타날 때 alpha 0 + translateY 6에서 올라와요.
  - 카드 사이를 옮겨 다닐 때 깜빡이지 않게 pointerout은 1ms 늦게 처리해요.
  - 카드에 호버하는 동안 적 호버 링과 적 툴팁을 숨겨요.
  - 트윈 길이와 곡선은 `tokens.provisional.motion.hover`.
- 말풍선 문단: 본문 13px/1.5(강조 14.5, 용어 점선 밑줄 offset 3), 계산 12px(강조 13, padding-top 5, **선 없음**), 이유 12.5px, 주인 12px.

### 뷰포트
- 1280×800 고정(`Scale.NONE`). 가운데 정렬은 Phaser autoCenter를 쓰지 않고 `index.html`의 flex가 맡아요(둘 다 쓰면 두 번 밀려요).
- Electron 창도 1280×800(useContentSize). Windows 배율이 100%가 아니면 브라우저가 캔버스를 늘려서 살짝 흐릴 수 있어요. 고해상도 대응(devicePixelRatio)은 아직 안 했어요.

---

## 7. 실행·검증

```
pnpm install
pnpm dev:web                    # http://localhost:5173 (개발용 창 틀 포함). ?hover=claw 처럼 호버 상태로 시작 가능
pnpm dev                        # Electron
pnpm check                      # 타입 + 의존 규칙 + 단위 테스트 + 리터럴 (CI와 같음)
pnpm test:e2e                   # Electron 스모크 (리눅스 무화면 환경은 xvfb-run -a)
pnpm tokens                     # tokens.json → tokens.ts
pnpm visual [--crop x,y,w,h]    # 쉬는 상태 정본 비교
pnpm visual --hover <cardKey>   # H1 비교 (다른 .fig는 숨기고 카드에 mouseenter)
```

- 처음 한 번 `pnpm exec playwright install chromium`. 이미 깔린 크로미움은 `CHROMIUM_PATH=<경로>`.
- 결과 기준치(이 세션 끝): rest 3.75%, `--hover claw` 3.85%. 이보다 크게 늘면 무언가 어긋난 거예요.
- CI(`.github/workflows`): Node 22, `pnpm install --frozen-lockfile` → typecheck → lint:deps → test → check:design → xvfb e2e.

### luddal-win(Windows) 주의
- 사용자 경로에 한글(`C:\Users\지석`)이 있어서 전역 pnpm 10이 pnpm 12로 넘겨주는 과정이 깨져요. `npm i -g pnpm@12.16.1`로 맞추거나, `%LOCALAPPDATA%\pnpm\.tools\pnpm\12.16.1\node_modules\@pnpm\exe.win32-x64\pnpm.exe`를 직접 실행해요.
- Electron postinstall이 돌지 않았을 수 있어요. `pnpm dev`가 Electron 바이너리를 못 찾으면 `pnpm rebuild electron`.
- pnpm이 "phaser" 에이전트 스킬 승인을 물었는데 승인하지 않았어요.
- `C:\tmp\DemoGame\.claude\settings.json`에 JSON이 깨진 권한 블록(여분의 `{`)이 들어가 있어요. 이 파일은 커밋되는 파일이에요. 권한은 `.claude/settings.local.json`으로 옮기고 settings.json은 `git checkout`으로 되돌려요.
- `src/core/__snapshots__/*.snap`이 CRLF 때문에 수정됨으로 보이면 내용 변경이 아니니 커밋하지 마세요(`git config core.autocrlf false`).

---

## 8. Git·PR 관행

- 기능마다 브랜치 → PR → CI 초록 → 머지(merge commit). force-push, amend, rebase로 히스토리를 고치지 않아요.
- PR 본문: 바뀐 점 / 확인(실행한 검사와 visual 차이 %) 형식. 규칙을 바꿔 골든 스냅샷이 바뀌면 이유를 적어요.
- 커밋 메시지는 한국어로, 무엇을 왜 했는지 한 줄 + 필요하면 본문.
- Lucy에게 보여 줄 스크린샷은 정본과 나란히(side) 붙여요.

---

## 9. 다음 할 일 (순서는 Lucy에게 확인)

1. ~~**H2 집기·조준**~~ 끝: 결정 0013(끌어 대기 + 집고 클릭, 조준선 없음). 상태는 `battle/targeting.ts`, 그리기는 `BattleScene.drawField`.
2. **session 층**: `src/session`에서 `src/core` 전투 상태 → `BattleVM` 변환, 카드 사용·턴 종료 명령. fixture 대신 실제 상태로 그리기. 의존 방향은 아키텍처 문서를 따라요.
3. **모션 디테일**: 지금 모션 값은 `provisional.motion.hover` 하나뿐이에요. 들기·밀림·말풍선·카드 사용(결정 0009 "가벼운 종이", 0010 "빛 한 번 쓸기")의 길이·곡선은 Lucy가 정할 값이에요. 선택지를 만들어 보여 주고 고르게 해요.
4. 기믹·차징(`frame-gimmick.png`), H3.
5. 고해상도 화면(devicePixelRatio) 대응. 글자·구운 텍스처 해상도까지 같이 다뤄야 해요.
6. 레거시 UI(`src/presentation/placeholder`, `?screen=legacy`)는 화면 단위로 지워요: 새 화면이 `src/core` 규칙에 연결되면 같은 일을 하던 레거시 화면을 그 PR에서 함께 지워요 (Lucy 2026-10-31). 연결 전에는 남겨 둬요. 지금 규칙으로 끝까지 플레이되는 화면은 레거시뿐이에요. 예: 2번 session 층으로 새 전투 화면이 실제 전투를 돌리면 `placeholder/scenes/BattleScene.ts`를 지우고 레거시 흐름(지도 → 전투)을 새 전투로 잇거나, 흐름째 정리해요.
