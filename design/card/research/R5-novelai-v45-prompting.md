# R5. NovelAI Diffusion V4.5 Full 카드 일러스트 프롬프트 노하우

조사일: 2026-11-06. 대상: 카드 약 70장의 그림 창. 손패 크기에서 약 84×90px로 보이고, 호버·보상 화면에서는 더 크게 보여요. 창의 네 모서리는 UI가 덮어요.

표기:
- **[공식]**: NovelAI 문서나 공식 저장소에서 확인했어요.
- **[코드]**: 제3자 오픈소스 클라이언트 코드에서 확인했어요. 웹 클라이언트를 역공학한 것이라 바뀔 수 있어요.
- **[커뮤니티]**: 개인 경험담이에요. 검증하지 않았어요.
- **[추론]**: 제 판단이에요.

> ⚠ NovelAI는 설정과 프리셋을 자주 바꿔요. V5가 2026-08-21에 나온 뒤로 V4.5 관련 문서가 줄어들고 있어요. 이 문서에 적힌 값은 생성 화면에서 다시 확인해 주세요.
>
> 프로젝트 메모: `design/card/CONTEXT.md`에는 "원화는 NovelAI Diffusion 5"라고 적혀 있어요. 그런데 이번 조사 대상은 V4.5 Full이에요. 어느 모델을 쓸지는 Lucy가 정해요. 아래 §0에 차이를 정리했어요.

---

## 0. 모델 차이 요약

| | V4 Full/Curated | V4.5 Full | V4.5 Curated | V5 Full/Curated |
|---|---|---|---|---|
| 프롬프트 길이 | T5 약 512토큰 (베이스와 캐릭터 프롬프트 합산) | 같음 | 같음 | Full 약 1471, Curated 약 703 유효 토큰 |
| 캐릭터 수 | 최대 6 | 6 | 6 | 22 |
| 배치 방식 | 5×5 격자 | 5×5 격자 | 5×5 격자 | 캔버스에서 자유 배치 |
| 글자 렌더링 | 영어 | 영어, 118자까지 | 영어 | 영·일·중. Curated 374자, Full 750자 |
| 음수 가중치 | ✗ | ✓ | ✓ | ✓ |
| Precise/Character Reference | ✗ | ✓ | ✓ | ✗ (쓰면 V4.5로 자동 전환) |
| Vibe Transfer | ✓ | ✓ | ✓ | V4.5 엔진으로 처리 |
| 투명 배경 | ✗ | ✗ | ✗ | ✓ (32채널 VAE) |
| Opus 무료 생성 | ✓ | ✓ | ✓ | 별도 사용량 바가 있음 |

- **Full과 Curated의 차이** [공식]: Full은 "더 포괄적이지만 덜 큐레이션된" 데이터셋으로 학습했어요. Curated는 "더 깨끗하고 초점이 좁은" 데이터셋이라 스트리밍에 안전한 쪽이에요. 출처: https://docs.novelai.net/en/image/models
- **V5 정보** [2차 출처]: 출시일 2026-08-21. 처음부터 다시 학습했고 모델 크기는 2배 이상이에요. VAE는 16채널에서 32채널이 됐어요. Precise Reference와 Vibe Transfer는 V4.5로 처리되고, V5 Curated의 인페인트도 임시로 V4.5 Curated를 써요. 출처: https://weavai.app/blog/ja/2026/08/29/ (일본어 해설 기사. 공식 블로그 원문은 찾지 못했어요)
- [추론] 카드 세트 안에서 그림체를 일정하게 맞추려면 **Precise Reference(V4.5 전용)** 를 쓸 수 있는지가 모델 선택의 가장 큰 기준이에요. 반대로 투명 배경과 디테일은 V5가 앞서요.

---

## 1. 프롬프트 문법 (V4/V4.5)

### 1-1. 태그와 자연어
- [공식] V4 이상은 T5 인코더를 써요. 태그와 영어 자연어 문장을 섞어 쓸 수 있어요. 학습에 태그를 썼기 때문에 알려진 Danbooru 태그가 조종력이 가장 커요. 권장 순서는 `1girl, 캐릭터, 작품, 나머지는 아무 순서`예요. "앞쪽 태그일수록 강하다"는 규칙은 V3 이하에만 해당해요. https://docs.novelai.net/en/image/tags
- [공식] V4/V4.5 프롬프트에는 일본어 같은 비라틴 문자를 쓸 수 없어요. 영어로만 써요.
- [커뮤니티] 태그로 시작하고, 동작이나 배치처럼 관계를 설명할 때만 짧은 영어 문장을 덧붙이는 방식이 많이 쓰여요. https://red.ks32.dev/r/NovelAi/comments/1k2rbef/

### 1-2. Add Quality Tags 토글이 덧붙이는 문자열 [공식]
토글을 켜면 프롬프트 **끝에** 아래 문자열이 붙어요. https://docs.novelai.net/en/image/qualitytags

| 모델 | 덧붙는 문자열 |
|---|---|
| V4.5 Full | `, location, very aesthetic, masterpiece, no text` |
| V4.5 Curated | `, location, masterpiece, no text, -0.8::feet::, rating:general` |
| V4 Full | `, no text, best quality, very aesthetic, absurdres` |
| V4 Curated | `, rating:general, amazing quality, very aesthetic, absurdres` |
| V5 Standard | `, very aesthetic, masterpiece, no text` |
| V5 Light | `, very aesthetic, amazing quality, no text` |

- ⚠ **V4.5 Full 토글에는 `location`이 들어 있어요.** `location`은 "indoors와 outdoors를 합친 것"처럼 장소가 있는 배경을 부르는 태그예요 [공식, tags 페이지]. 배경이 단순한 카드를 원하면 토글을 끄고 품질 태그를 직접 써야 할 수 있어요 [추론].
- [공식] V4.5부터 `masterpiece`는 "very aesthetic 위의 미적 태그"로 뜻이 바뀌었어요. https://tapwavezodiac.github.io/novelaiUKB/Image-Generation.html (공식 Discord 측이 정리한 비공식 KB)

### 1-3. Undesired Content(UC) 프리셋 원문 [공식]
출처: https://docs.novelai.net/en/image/undesiredcontent

**V4.5 Full**
- Heavy: `lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page`
- Light: `lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page`
- Human Focus: Heavy와 같고, 끝에 `@_@, mismatched pupils, glowing eyes, bad anatomy`가 더 붙어요 (`blank page` 다음).
- Furry Focus는 생략했어요. None은 비어 있어요.

**V4.5 Curated**
- Heavy: `blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page`
- Light: `blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page`

**V4 Full**
- Heavy: `blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks`

- ⚠ **V4.5 프리셋에는 `negative space, blank page`가 들어 있어요.** 그래서 모델은 화면을 채우려고 해요. 피사체 둘레에 여백을 두고 싶은 카드라면 이 프리셋과 충돌해요. 그럴 때는 프리셋을 None으로 두고 UC를 직접 쓰는 방법을 고려해요 [추론].

### 1-4. 강조 문법 [공식]
출처: https://docs.novelai.net/en/image/strengthening-weakening

| 문법 | 효과 | 지원 모델 |
|---|---|---|
| `{tag}` / `[tag]` | 한 겹마다 ×1.05 / ÷1.05. 겹치면 곱해져요 (`{{` = 1.1025) | 전 모델 |
| `1.5::rain, night ::` | 숫자 가중치. 맨 `::`가 나올 때까지 적용돼요 | V4 이상 |
| `0.5::coat ::` | 약화 (0~1) | V4 이상 |
| `-1::hat ::` | 음수 가중치. 대상을 지우거나 개념을 뒤집어요 | **V4.5 이상** |

- [공식] UC 칸에서는 `{}`가 "더 피하라"는 뜻이 돼요.
- [공식] 음수 가중치는 하나를 콕 집어 지울 때 좋아요. 긴 목록은 UC 칸이 나아요. 문서의 예: `-1::monochrome ::`(색 복원), `-2.5::flat color ::`(디테일 추가).
- [공식] 맨 `::`는 열려 있는 `{}`와 `[]`도 함께 닫아요. 문장이 마침표나 숫자로 끝나면 닫는 `::` 앞에 공백을 넣어요.
- [커뮤니티] `2.0::`이 `{}` 약 15겹과 비슷하다는 경험담이 있어요. (계산상 1.05^15 ≈ 2.08로 맞아요.)
- (tag:1.2)는 A1111 문법이라 NovelAI에서는 동작하지 않아요. 일부 한국어 블로그가 잘못 적고 있어요.

### 1-5. 그 밖의 태그
- [공식] 연도 태그는 `year 2014` 형식이에요. "어느 연도든 되지만 결과는 들쭉날쭉"하대요.
- [공식] 등급 태그 `rating:general`은 V4.5 Curated의 품질 토글에 들어 있어요. 그래서 Full에서도 같은 형식이 통한다고 봐요 [추론].
- [공식/KB] 작가 태그는 `artist:이름` 형식이에요. 지어낸 작가명으로도 일관된 화풍이 나온대요.
- [커뮤니티] 작가 태그를 여러 개 쓰면 뒤쪽 작가일수록 약해져요. 작가마다 `{}`를 한 겹씩 더해 보정한다는 경험담이 있어요. https://red.ks32.dev/r/NovelAi/comments/1k2rbef/
- [추론] 실존 작가명은 상업 게임에서 저작권·평판 위험이 있어요. 쓸지 말지는 Lucy가 정해요.
- [공식] V4.5부터 `background dataset` 태그를 쓸 수 있어요 (베이스 프롬프트 맨 앞에 둬요). 배경이나 사물만 그리는 카드에 시험해 볼 만해요.

### 1-6. 캐릭터 프롬프트 박스, 위치 격자, `|` [공식]
출처: https://docs.novelai.net/en/image/multiplecharacters
- 베이스 프롬프트에는 장면, 화풍, 인원 태그(`2girls`)를 써요. 캐릭터 박스에는 숫자 없이 `girl`/`boy`/`other`와 그 캐릭터의 특징만 써요. 특징이 다른 캐릭터에게 번지면 그 캐릭터 박스의 UC에 적어요.
- 배치는 기본이 **AI's Choice**예요. 이때는 박스 순서대로 위→아래, 왼→오른쪽에 놓여요. **Custom**으로 바꾸면 V4/V4.5에서 **5×5 격자**에 직접 놓을 수 있어요. 문서는 박스 순서와 충돌하지 않게 놓고 자연어로 위치를 한 번 더 적으라고 권해요. **사물에도 쓸 수 있어요.**
- `|` 구분자는 박스 대신 한 칸에 `베이스 | 캐릭터1 | 캐릭터2`처럼 쓰는 방식이에요. 캐릭터 박스가 하나라도 있으면 꺼져요.
- 동작 태그 접두사: `source#hug`, `target#hug`, `mutual#hug`. 문서도 "항상 믿을 수는 없다"고 적어요.
- [코드] 메타데이터에 저장되는 격자 좌표는 x, y ∈ {0.1, 0.3, 0.5, 0.7, 0.9}예요. 정중앙은 (0.5, 0.5)이고, (0, 0)은 AI's Choice예요.
- [추론] 카드는 피사체가 하나라서, 캐릭터 박스 하나를 Custom C3(0.5, 0.5)이나 C2(0.5, 0.3, 중앙 위쪽)에 두면 위치를 고정하는 데 쓸 수 있을 것 같아요. 아직 검증하지 않았어요. 시험 생성이 필요해요.

---

## 2. 구도와 프레이밍

### 2-1. 카메라·샷 태그
- [공식] 문서에는 태그별 신뢰도가 없어요. 아래는 Danbooru의 표준 태그예요.

| 목적 | 태그 |
|---|---|
| 샷 크기 | `portrait`, `close-up`, `upper body`, `cowboy shot`, `full body`, `wide shot`, `very wide shot` |
| 각도 | `from above`, `from below`, `from side`, `dutch angle`, `dynamic angle` (`dutch angle`과 `dynamic angle`은 원래 이름 그대로) |
| 시선과 초점 | `looking at viewer`, `face focus`, `object focus`, `solo focus` |
| 사람 없음 | `no humans`, `scenery`, `still life`, `object focus` |
| 배경 | `simple background`, `white background`, `gradient background`, `blurry background`, `depth of field` |
| 배치 | `centered`, `symmetry`. 신뢰도는 낮아요 [커뮤니티] |

- [커뮤니티] 피사체 둘레에 여백이 필요하면 `wide shot`/`far shot`과 가로 비율, 발·신발 태그가 도움이 됐대요. https://lr.eu.psf.lt/r/NovelAi/comments/1du1xen/ (V3 시절 글이에요 ⚠)
- [커뮤니티] V4에서 `no humans`만 넣었더니 검은 배경에 경고 표시 같은 이상한 결과가 나와, `blank background`를 더했다는 경험담이 있어요. (V4 글이에요 ⚠)
- [커뮤니티] full body에서는 작은 결함이 잘 드러나요. 화풍을 버리기 전에 카메라부터 바꿔 보래요.

### 2-2. 사람 없는 사물·이펙트 일러스트 (유리벽, 떨어지는 별, 진주 등)
[추론] 공식 가이드가 없어서 아래는 제가 제안하는 시험 순서예요.
1. 베이스 프롬프트: `no humans, still life, object focus, 대상 태그(예: pearl, glass wall, falling star), simple background, 화풍 블록`.
2. 품질 토글을 끄고 `location`을 빼요. UC 프리셋은 Light나 None으로 두고, `negative space, blank page`는 빼는 것을 검토해요.
3. 사람이 계속 나오면 `-1::1girl ::`, `-1::solo ::`처럼 음수 가중치를 써요 (V4.5 이상).
4. 정령이 이펙트를 쓰는 카드라면 이펙트를 사물처럼 다루기 위해 캐릭터 박스 하나를 `other`로 두고 이펙트를 적은 뒤 C2에 놓는 방법도 있어요. 검증하지 않았어요.
5. `background dataset` 태그와의 상호작용도 시험해 봐야 해요.

### 2-3. 해상도와 Anlas 비용
- [공식] Opus는 **28스텝 이하, Normal 해상도 범위 이하, 1장씩** 생성하면 무료예요. 여러 장을 한 번에 뽑으면 Anlas가 들어요. https://docs.novelai.net/en/image/stepsguidance
- [코드] 무료 기준은 정확히 **픽셀 수 ≤ 1,048,576(=1024²), 스텝 ≤ 28**이에요.
- [코드] V4/V4.5/V5의 비용 공식은 `ceil(2.951823e-6·px + 5.753298e-7·px·steps)`이에요. SMEA를 켜면 ×1.2 또는 ×1.4가 곱해지는데, V4 이상에는 SMEA가 필요 없어요.
- 아래 표는 위 공식으로 제가 계산한 값이에요. 웹 화면의 표시값과 다를 수 있어요.

| 해상도 | 픽셀 | 23스텝 | 28스텝 | Opus 무료 |
|---|---|---|---|---|
| 832×1216 (세로, 기본값) | 1.01M | 17 | 20 | ✓ |
| 1024×1024 (정사각) | 1.05M | 17 | 20 | ✓ |
| 1216×832 (가로) | 1.01M | 17 | 20 | ✓ |
| 1024×1536 / 1536×1024 | 1.57M | 26 | 30 | ✗ |
| 1472×1472 | 2.17M | 36 | 42 | ✗ |

- 추가 비용:
  - Precise/Character Reference는 참조 1개당 이미지마다 +5 Anlas예요. Opus 무료 생성이라도 이 5는 붙어요 [공식, 코드 주석].
  - Vibe는 처음 인코딩할 때 2 Anlas가 들어요. Information Extracted 값을 바꾸면 다시 2가 들어요. 바이브를 4개보다 많이 쓰면 하나 더할 때마다 +2예요 [공식].
- [추론] 그림 창 비율이 84:90(≈0.93)으로 정사각에 가까워요. 그래서 **1024×1024로 생성하고 조금만 잘라내는 쪽**이 프레이밍 손실이 가장 적어요. 세로 832×1216에서 자르면 위아래가 많이 날아가요. 또 모서리를 UI가 덮으니 피사체는 중앙과 중앙 위쪽 약 60% 안에 두어야 해요. 세로나 가로로 생성하면 모델이 화면 끝까지 구도를 넓히는 경향이 있어서, 작게 보이는 카드에는 불리할 거예요. 시험해서 확인해야 해요.

---

## 3. 세트 일관성 도구

### 3-1. Vibe Transfer [공식]
출처: https://docs.novelai.net/en/image/vibetransfer
- **Reference Strength**: 1에 가까울수록 화풍·색 같은 시각 단서를 강하게 따라요. 너무 높으면 텍스트 프롬프트를 무시해요. 여러 바이브의 강도 합은 1.0 이하를 권해요. V4 이상에는 **Normalize Reference Strengths** 토글이 있어 합을 자동으로 맞춰요.
- **Information Extracted**: 기본값을 권해요. V4 이상에서 이 값을 낮추면 질감 같은 고주파 정보부터 빠져서 구도가 더 남고 화풍은 덜 남아요.
- 한 번에 최대 16개를 쓸 수 있고, 많을수록 느려져요. `.naiv4vibe` 파일에는 원본 이미지, 썸네일, 써 본 IE 값들의 인코딩이 들어 있어요. 그래서 같은 IE 값으로 다시 쓸 때는 비용이 들지 않아요. `.naiv4vibeBundle`로 여러 바이브를 한 파일에 묶을 수 있어요.
- **Download 버튼으로 받은 PNG에는 바이브가 들어 있어요.** 복사·붙여넣기한 이미지에는 없어요. 메타데이터에서 불러온 바이브는 인코딩 비용이 없지만 IE 값을 바꿀 수 없어요.
- **Precise Reference와 같이 쓸 수 없어요.**
- [커뮤니티] IE 0.3~0.5를 쓰라는 블로그 글이 있어요(foxcg.com). 근거가 약해요.

### 3-2. Precise Reference / Character Reference [공식]
출처: https://docs.novelai.net/en/image/precisereference, https://docs.novelai.net/en/image/characterreference
- **V4.5 모델 전용**이고 프리뷰 단계예요. Full과 Curated 모두 V4.5라서 둘 다 해당해요 [추론].
- **Style Aware** 토글은 기본으로 켜져 있어요. 캐릭터와 관련된 화풍 정보를 함께 가져와요. 끄면 화풍 영향이 줄어 스타일을 바꾸기 쉬워져요.
- **Fidelity**: 0이면 예전 모델처럼 동작해서 화풍과 구도가 유연해요. 1이면 새 모델처럼 디테일을 강하게 따르고, 프롬프트로 덮어쓰기가 어려워요.
- **Strength**: 높을수록 참조 이미지와 비슷해져요. Precise Reference 페이지에 나와요.
- 참조 이미지는 내부에서 1024×1536, 1472×1472, 1536×1024 중 하나로 패딩돼요.
- 참조 이미지 팁: 단순한 배경에 중립 자세로 선 전신, 깔끔한 선화, 캐릭터를 최대한 크게. 턴어라운드 시트를 쓸 때는 `no text`를 넣어요.
- 참조를 여러 개 쓰면 섞여 버려요. **인페인트에는 참조가 적용되지 않아요.**
- [추론] 정령마다 기준 시트를 하나 정하고, 그 정령이 주인인 카드에는 Character Reference(Style Aware 켬)를 쓰면 정령의 외형을 고정하는 수단이 돼요. 대신 Vibe Transfer로 세트 화풍을 묶을 수는 없어서, 화풍은 프롬프트의 화풍 블록과 Style Aware에 맡겨야 해요.

### 3-3. 시드, 고정 화풍 블록, img2img, 인페인트
- [공식] 같은 시드에서 프롬프트를 조금씩 바꿔 비교하는 방법을 문서가 권해요. https://docs.novelai.net/en/image/tutorial-charactercreation
- [추론] 시드는 구도 습관을 고정할 뿐, 프롬프트가 바뀌면 일관성을 지켜 주지 못해요. 세트 일관성은 아래 세 겹으로 만드는 게 현실적이에요.
  1. 고정 **화풍 블록**: 품질·작가·매체·조명 태그를 한 덩어리로 묶어 모든 카드 프롬프트에 똑같이 넣어요.
  2. 고정 **설정**: 해상도, 스케일, 샘플러, UC.
  3. 바이브 하나, 또는 캐릭터 참조 하나.

  화풍 블록 문자열은 프롬프트 시트에 버전으로 관리해요.
- [공식] img2img의 **Strength**는 프롬프트가 원본을 얼마나 바꾸는지예요. **Noise**는 새 디테일을 더하는데, 반복해서 쓰면 아티팩트가 생겨요. 둘 다 최솟값이면 거의 복제가 돼요. https://docs.novelai.net/en/image/strengthnoise
- [커뮤니티] 강도 60% 미만에서는 프롬프트를 바꿔도 거의 변하지 않았대요. 노이즈는 0을 권하는 의견이 있어요.
- [커뮤니티] 인페인트할 때는 마스크를 경계보다 조금 넓게 잡고, 이음새가 생기면 "Overlay Original Image"를 켜요. 끝으로 낮은 강도의 img2img로 다듬어요.

### 3-4. Director Tools, Enhance, Upscale [공식]
- **Director Tools**: Remove Background(결과 3종: Masked, Generated, Blend), Line Art, Sketch, Colorize, Emotion, Declutter(떠다니는 글자·사물·노이즈 제거). 문서에 비용은 없어요. https://docs.novelai.net/en/image/directortools
  - [코드] 배경 제거는 Opus에서도 무료가 아니에요.
- **Enhance**: Magnitude 프리셋(Strength와 Noise 조합)과 Upscale Amount가 있어요. 정확한 배율과 비용은 문서에 없어요. https://docs.novelai.net/en/image/enhance
- [코드] Upscale 비용은 픽셀 구간별로 1~4 Anlas예요.
- [추론] 84×90px에서는 업스케일이 필요 없어요. 호버·보상 화면에서 쓸 가장 큰 표시 크기에 맞춰 한 번만 Enhance하면 충분해요.

---

## 4. 샘플러, 스텝, 가이던스

| 항목 | 내용 | 근거 |
|---|---|---|
| 샘플러 | 문서는 "DPM++ 2M, Euler Ancestral"을 권해요. 웹 기본값은 `k_euler_ancestral`이에요 | [공식] sampling, [코드] |
| 노이즈 스케줄 | 위 샘플러들은 기본이 `karras`예요. `exponential`과 `polyexponential`은 큰 차이가 없어요 | [KB], [코드] |
| 스텝 | 웹 기본값은 23이에요. 28 이하면 Opus 무료예요. 구도를 찾는 동안은 낮게 두라는 게 공식 권고예요 | [코드], [공식] |
| Prompt Guidance | V3 이상은 5~6을 권해요(공식). KB는 "V3, V4는 2~6"이라고 적어요. 웹 기본값은 6.0이에요. 높이면 대비와 외곽선이 세지고 일부 요소가 지배해요. 낮추면 회화적이 돼요 | [공식] stepsguidance, [KB], [코드] |
| Guidance Rescale | 가이던스가 높을 때 생기는 과채도를 누그러뜨려요. 대신 흐려지고 채도가 떨어질 수 있어요. 0에서 시작해 같은 시드로 0.1~0.2씩 올려 보래요 | [KB] |
| Variety+ | 처음 몇 스텝은 가이던스 없이 돌려 구도를 다양하게 하고, 그다음 가이던스를 켜요. UC가 덜 먹혀서 이상한 소품이 생길 수 있어요. 메타데이터에는 `skip_cfg_above_sigma` 값으로 남아요 | [KB], [코드] |
| SMEA, Decrisper | V4 이상에는 필요 없어요. Decrisper는 V4에서 효과가 없어요 | [KB] |

- [추론] 카드 세트에서는 **Variety+를 꺼야** 같은 프롬프트 틀에서 구도가 덜 흩어지고 UC도 잘 먹어요. 탐색 라운드에서만 켜는 게 맞아요.
- KB 출처: https://tapwavezodiac.github.io/novelaiUKB/Image-Generation.html

---

## 5. PNG 메타데이터 (출처 기록용)

### 5-1. 구조 [공식 저장소 + 코드]
출처: https://github.com/NovelAI/novelai-image-metadata (`nai_meta.py`, `nai_sig.py`)

**① PNG tEXt 청크**: 키는 `Title`, `Description`, `Software`, `Source`, `Generation time`, `Comment`예요.
- `Description`: 프롬프트 텍스트.
- `Software`: `NovelAI`.
- `Source`: `NovelAI Diffusion V4.5 <8자리 해시>` 형식이에요.
  - [코드] Full과 Curated는 **해시로만 구분돼요.** 예: `B9F340FD`와 `F3D95188`은 V4.5 Full, `5AB81C7C`와 `B5A2A797`은 V4.5 Curated예요. V5도 `NovelAI Diffusion V5 <해시>` 형식이에요. 출처: https://github.com/LlmKira/novelai-python `src/novelai_python/sdk/ai/_enum.py`
- `Comment`: JSON 문자열이에요.

**② 알파 채널 LSB (stealth pnginfo)**: 알파 채널 최하위 비트를 열 우선(`alpha.T`) 순서로 읽어요.
- 매직 문자열 `stealth_pngcomp`
- 32비트 빅엔디언 길이(**비트 단위**)
- gzip으로 압축한 JSON (①과 같은 키)
- 그다음 32비트 FEC 길이. `0xFFFFFFFF`이면 FEC가 없다는 뜻이에요. NovelAI는 아직 FEC를 넣지 않아요.

메타데이터가 지워지는 경우:
- 클립보드로 복사하거나 다른 프로그램에서 다시 저장하면 tEXt가 사라져요.
- JPEG로 바꾸거나 알파를 없애면 LSB도 사라져요.
- 따라서 **원본은 Download 버튼으로 받은 PNG를 그대로 보관**해요.

**③ `signed_hash`**: Comment 안에 있는 Ed25519 서명이에요. NovelAI 모델이 만든 이미지인지 확인할 수 있어요. 사용자 정보는 들어 있지 않아요 [공식 README]. 이미지 픽셀이 조금이라도 바뀌면 검증에 실패해요.

**WebP**: EXIF에 저장돼요. 대응: DocumentName→Title, ImageDescription→Description, Software→Source, UserComment→Comment.

### 5-2. Comment JSON 필드 [코드]
출처: novelai-python `tool/image_metadata/__init__.py`의 `CommentModel`

| 분류 | 필드 |
|---|---|
| 기본 | `prompt`, `uc`, `seed`, `steps`, `width`, `height`, `n_samples`, `request_type`, `version`, `signed_hash` |
| 샘플링 | `scale`(Prompt Guidance), `cfg_rescale`, `sampler`(예: `k_euler_ancestral`), `noise_schedule`(`karras` 등), `skip_cfg_above_sigma`(Variety+), `uncond_scale`, `sm`, `sm_dyn`, `dynamic_thresholding`, `prefer_brownian`, `deliberate_euler_ancestral_bug` |
| 바이브 | `reference_strength_multiple`, `reference_information_extracted_multiple` (단일 값 버전도 있어요) |
| V4 구조 | `v4_prompt` = `{caption:{base_caption, char_captions:[{char_caption, centers:[{x,y}]}]}, use_coords, use_order}` |
| | `v4_negative_prompt` = `{caption:{base_caption, char_captions:[…]}, legacy_uc}` |

- [추론] img2img·인페인트일 때 `strength`, `noise` 같은 필드가 추가로 들어올 수 있어요. 모르는 키도 버리지 말고 원문 JSON을 통째로 기록하는 게 안전해요.

### 5-3. 추출 코드 (Python, Pillow + numpy)
```python
import gzip, json, sys
import numpy as np
from PIL import Image

def read_text_chunks(img: Image.Image) -> dict:
    info = {k: v for k, v in img.info.items() if isinstance(v, str)}
    if isinstance(info.get("Comment"), str):
        try: info["Comment"] = json.loads(info["Comment"])
        except json.JSONDecodeError: pass
    return info

def read_stealth(img: Image.Image) -> dict | None:
    if "A" not in img.getbands():
        return None
    a = np.array(img.convert("RGBA"))[..., 3].T.reshape(-1)   # 열 우선
    a = a[: (a.size // 8) * 8] & 1
    data = np.packbits(a.reshape(-1, 8), axis=1).reshape(-1).tobytes()
    magic = b"stealth_pngcomp"
    if not data.startswith(magic):
        return None
    p = len(magic)
    nbits = int.from_bytes(data[p:p+4], "big"); p += 4
    meta = json.loads(gzip.decompress(data[p:p + nbits // 8]))
    if isinstance(meta.get("Comment"), str):
        meta["Comment"] = json.loads(meta["Comment"])
    return meta

if __name__ == "__main__":
    im = Image.open(sys.argv[1])
    out = {"text": read_text_chunks(im), "stealth": read_stealth(im)}
    print(json.dumps(out, ensure_ascii=False, indent=2))
```
- 서명 검증은 공식 `nai_sig.py`를 써요. 필요한 패키지: `pynacl`, `pydantic`, `numpy`, `Pillow`.
- [추론] `assets/provenance.jsonl`과의 대응:
  - `model`: `Source`의 해시로 판별
  - `prompt`: `Comment.prompt`와 `v4_prompt`
  - `negative`: `uc`와 `v4_negative_prompt`
  - `seed`: `seed`
  - `settings`: 나머지 Comment 필드 전체
  - `sha256`: 원본 PNG 해시
  - `signed_hash`는 `note`에 넣거나 원문 JSON에 함께 보관

---

## 6. 이용약관과 Steam 공개

- [공식] NovelAI는 사용자가 만든 이미지의 소유권을 주장하지 않아요: "NovelAI does not claim any ownership over the images you generate". 대신 저작권 침해 여부 확인은 사용자 책임이고, 상업적으로 쓸 거라면 결과물을 검토하라고 해요. https://docs.novelai.net/en/faq, 약관 원문: https://novelai.net/terms/ (원문은 이번에 직접 읽지 못했어요. 출시 전에 다시 확인해 주세요 ⚠)
- [추론] AI 생성물은 많은 법역에서 저작권 보호가 약해요. 그래서 `human_work`(선별, 페인트오버, 합성)를 기록해 두는 지금의 방식이 맞아요. 법률 자문은 아니에요.
- [2차 출처] Steam은 2026년 1월에 AI 공개 양식의 문구를 바꿨어요.
  - **미리 생성한 콘텐츠(Pre-generated)**: 게임에 포함되어 "ships with your game, and is consumed by players"이거나 마케팅에 쓰이는 경우 공개해야 해요.
  - **효율 도구**(코딩 보조 등): 공개 대상이 아니에요.
  - **실시간 생성(Live-generated)**: 불법 콘텐츠를 막는 장치를 설명해야 해요.

  카드 일러스트는 Pre-generated에 해당해서 공개 대상이에요. https://www.pcgamer.com/software/ai/steam-updates-ai-disclosure-form-to-specify-that-its-focused-on-ai-generated-content-that-is-consumed-by-players-not-efficiency-tools-used-behind-the-scenes/

---

## 7. 알려진 함정과 대응

| 함정 | 대응 | 근거 |
|---|---|---|
| 글자, 서명, 워터마크가 생김 | V4.5 Full 품질 토글에 `no text`가 들어 있어요. UC에 `logo, too many watermarks`(프리셋), `signature, watermark, artist name`을 더해요. 남은 것은 Declutter나 인페인트로 지워요 | [공식] + [추론] |
| 원치 않는 장소 배경 | 토글의 `location` 때문일 수 있어요. 토글을 끄고 직접 써요 | [공식] + [추론] |
| 여백 없이 꽉 찬 구도 | V4.5 UC 프리셋의 `negative space, blank page`가 원인일 수 있어요. 프리셋을 수정해요 | [공식] + [추론] |
| `multiple views`가 필요한데 막힘 | Heavy와 Light 프리셋에 들어 있어요. 원하면 UC에서 빼요 | [커뮤니티] |
| 팔다리가 더 생기거나 손이 망가짐 | Human Focus UC를 쓰거나 `bad anatomy`를 더해요. 치비 체형은 손이 작아 덜 눈에 띄어요. 프레이밍을 바꾸고 인페인트로 고쳐요 | [공식] + [추론] |
| 작은 크기에서 배경이 지저분함 | `simple background`, `blurry background`, `depth of field`를 쓰고 소품 태그를 줄여요. 84px에서는 피사체의 실루엣과 명암 대비가 거의 전부예요 | [추론] |
| 색이 번짐 (예: `red scarf`가 눈·배경까지 빨갛게) | 캐릭터 박스로 분리하고, 해당 박스의 UC를 쓰고, 음수 가중치(`-1::red background ::`)를 써요 | [공식] multiplecharacters + [추론] |
| `chibi` | Danbooru 표준 태그지만 V4.5에서 어떻게 나오는지 공식 설명이 없어요. V5에서 치비·스프라이트 계열 태그가 강화됐다는 2차 출처가 있어요. `chibi, super deformed`와 `full body`를 같이 써야 비율이 안정된다는 말이 있어요 | [커뮤니티], 미검증 |
| 이펙트 입자가 화면 전체에 퍼짐 | `sparkle, particles, light particles` 계열은 화면 전체로 번지기 쉬워요. 가중치를 0.6~0.8로 낮추거나, 이펙트 위치를 자연어로 한정해요("sparkles around her hands") | [추론], 미검증 |
| 가이던스가 높을 때 과채도·탄 듯한 결과 | 스케일을 낮추거나 Rescale을 0.1~0.2씩 올려요 | [KB] |
| 메타데이터 소실 | Download 버튼으로 받은 원본 PNG만 보관해요. 편집본은 따로 저장해요 | [공식] |

---

## 8. 카드 생성 시험 순서 제안 [추론]
Lucy가 화풍을 고르기 전까지 쓰는 탐색 절차예요. 이 문서는 화풍, 색, 작가를 정하지 않아요.

1. 1024×1024, 23~28스텝, Euler Ancestral/karras, 스케일과 Rescale은 기본값, Variety+는 꺼요.
2. 품질 토글을 끄고, 직접 쓴 품질 태그와 화풍 블록을 넣어요 (TODO: Lucy 선택).
3. UC는 V4.5 Full Light 프리셋에서 `negative space, blank page`를 뺀 것과 그대로인 것을 A/B로 비교해요.
4. 정령이 나오는 카드: 캐릭터 박스 하나를 Custom C2 또는 C3에 두고 `upper body` 또는 `cowboy shot`으로 생성해요. 사물·이펙트 카드: §2-2 방식으로 생성해요.
5. 각 결과를 84×90으로 줄여서 판독되는지 확인해요. 판독은 리뷰어 범위이고, 미적 판단은 Lucy가 해요.
6. 정령이 정해지면 Character Reference(Style Aware 켬)로 그 정령의 카드들을 묶어요. Vibe Transfer와 같이 쓸 수 없다는 점에 주의해요.
