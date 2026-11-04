# R3. 카드 연출·VFX·애니메이션 구조 리서치

작성: Claude (리서치 에이전트) · 2026-10-29 · 상태: 📝 Claude 초안 · 미검토
범위: 업계 관행 → 구조(로직/연출 분리) → Phaser 4 기능 → Spine 역할 분담 → 이 게임용 VFX 등급 체계 → 1인 개발 마일스톤
규칙: 여기 나오는 시간·크기·색 값은 모두 정해지지 않은 값이에요. 정할 값은 `TODO_TOKEN`, 출처에서 따온 범위는 출처를 붙였어요. 시각적인 선택(어떤 모션 언어, 어떤 효과)은 전부 **Lucy 컨펌 전 제안**이에요.

---

## 0. 요약

1. **연출이 "멋져야" 하기 전에 "순서가 읽혀야" 해요.** StS·Balatro·Hearthstone 모두 공통점은 "하나씩, 원인 → 결과 순서로" 보여 준다는 점이에요. 화려함은 그다음이에요.
2. **지금 코드는 출발점이 좋아요.** `Battle`이 상태를 바꾸면서 `BattleEvent`를 쌓고, 씬이 `drain()`해서 연출해요. 이미 "로직 → 이벤트 로그 → 연출" 구조예요. 다만 (a) 카드 이동(드로우/버림/소멸/셔플) 이벤트가 없고, (b) "이 피해는 어느 카드의 결과인가" 묶음 정보가 없고, (c) 연출이 `delayedCall`에 누적 ms를 하드코딩해서 빨리감기·건너뛰기를 넣기 어려워요.
3. **제안 구조:** `BattleEvent[]` → **번역기(Director)** → **스텝 트리(직렬/병렬)** → **시퀀서(Sequencer)**. 시퀀서 하나가 속도 배율·빨리감기·건너뛰기·모션 줄이기를 전부 맡아요. 효과는 카드·키워드별 **레시피 데이터**로 꺼내요.
4. **Phaser 4**는 v3의 preFX/postFX가 없어지고 **Filters**(`filters.internal/external`)로 통합됐어요. Glow·Shadow·Blur·ColorMatrix·Displacement·Wipe 등이 기본 제공이라 카드 외곽 빛·가라앉힘·재질 흔들림을 셰이더 직접 작성 없이 시작할 수 있어요. 대신 `Mesh`/`Plane`이 v4에서 빠졌다가 4.2에서 `Mesh2D`가 들어왔어요.
5. **Spine**은 정령(대기·시전·피격·각성 컷인)에 쓰고, **카드 자체는 Phaser 트윈 + 필터**로 하는 게 1인 개발에 맞아요. Spine 이벤트(`animationState.addListener({ event })`)로 "타격 순간"을 시퀀서에 알려 주면 정령 모션과 숫자 팝업이 맞아요.
6. ⚠️ **버전 확인 필요:** `package.json`은 `@esotericsoftware/spine-phaser-v4@^4.2.120`인데, Phaser 4.2의 새 Spine 렌더러(배칭·슬롯 오브젝트)는 **spine-phaser-v4 4.3.11+ / Phaser 4.2.1+** 조합이고, 런타임 major.minor가 **Spine 에디터 export 버전과 같아야** 해요. `^4.2.x`는 4.3으로 안 올라가요. 리깅 시작 전에 에디터 버전(4.2 vs 4.3)을 정해야 해요.
7. **VFX 4단계:** T0 UI 피드백 / T1 일반 카드 사용 / T2 키워드·속성 결실(점화, 빙결, 브레이크) / T3 각성 전용. "과한 장식 금지" 브랜드에 맞게 **T3만 화면 전체를 쓰고, 나머지는 대상 주변에서 끝나요.**
8. **1인 개발 순서:** 시퀀서·속도 설정 먼저(M1) → 카드 손 모션(M2) → T1/T2 레시피 몇 개(M3) → Spine 이벤트 연동(M4) → 각성 T3(M5) → 다듬기·성능(M6).

---

## 1. 업계 관행: 카드게임의 "손맛(juice)"

### 1-1. 기본 원칙 (출처 있는 것만)

| 원칙 | 내용 | 출처 |
| --- | --- | --- |
| 작은 반응을 많이 | 밋밋한 게임에 트윈·파티클·소리·반응을 하나씩 더해 가며 "같은 규칙인데 느낌이 달라지는" 걸 시연 | Jonasson & Purho, *Juice It or Lose It*, GDC Europe 2012 |
| 과잉 경계 | 같은 시기에 "인디는 juice 욕심을 참아라"는 반론도 있었음. 정보 전달을 가리는 juice는 손해 | Gamasutra 기사 "Indies, resist the urge to 'juice it or lose it'", GDC 2014 *Don't Juice It or Lose It* |
| 방향 있는 흔들림 | 화면 흔들림은 무작위가 아니라 힘의 방향 반대로 살짝 | Nijman, *The Art of Screenshake*, Control Conference 2013 |
| 효과 = 규칙 설명 | "VFX는 메커니즘을 직관적으로 전달하는 수단". 가벼운 피해와 무거운 피해는 **보기만 해도 강도가 달라야** 함 | Hearthstone VFX 아티스트 Dominic Camuglia 인터뷰 (Screenhub) |
| 단계별 투자 | Hearthstone은 전설 카드 연출 하나에 약 1주, 팩 개봉 같은 큰 시퀀스는 약 2주 | 같은 인터뷰 |
| 모션 끄기 옵션 | 화면 흔들림·모션 블러 등은 피하거나 끌 수 있게, 강도 슬라이더 권장. 글이 있는 화면의 깜빡임·움직임은 끄거나 멈출 수 있게 | Xbox Accessibility Guideline 117 |

> 우리 게임에 대입하면: **"정보를 가리지 않는 juice"** 만 남겨요. 정보 원칙(판단 정보만 항상 크게)과 같은 방향이에요.

### 1-2. 카드 한 장의 일생 (모션 수명주기)

아래는 장르 공통 단계예요. "동사"는 우리가 정할 모션 성격, 값은 전부 토큰이에요.

| 단계 | 일반적인 처리 | 핵심 포인트 | 토큰 |
| --- | --- | --- | --- |
| 드로우 | 덱 더미 → 손 슬롯으로 날아오며 뒤집힘, 여러 장이면 시차(stagger) | 한 장씩 보여야 "몇 장 뽑았는지" 읽힘 | `motion.normal`, `TODO_TOKEN(stagger)` |
| 손 배치 | 부채꼴/직선 재배치, 새 카드 들어오면 옆 카드가 비켜남 | 재배치는 항상 같은 이징으로 | `motion.normal` |
| 호버/포커스 | 살짝 커지고 위로, 옆 카드 밀림 (R5 확정) | 빠르게 반응, 빠지는 것도 빠르게 | `motion.fast` |
| 집기 | 커서에 붙음, 약간 기울며 따라옴(관성) | 따라오는 지연이 "무게감" | `TODO_TOKEN(follow lag)` |
| 조준 | 대상 지정 카드는 화살표(베지어) + 대상 하이라이트 + 결과 미리보기 (R5 확정) | 화살표 끝이 대상에 "붙는" 스냅 | `motion.fast` |
| 사용(play) | 카드가 중앙/정령 쪽으로 이동 → 잠깐 정지 → 사라짐 | **예비동작(anticipation)** 이 있어야 결과가 원인에 연결됨 | `motion.normal` |
| 해결(resolve) | 정령 시전 모션 → 타격 → 숫자 팝업 → 상태 아이콘 | 타격 순간에 숫자가 떠야 함 | `motion.emphasis`는 T2 이상만 |
| 버림 | 버린 더미로 작게 날아감, 여러 장이면 시차 | 빠르게, 눈에 덜 띄게 | `motion.normal` |
| 소멸 | 사라지는 연출(불에 타거나 흩어짐) → 소멸 더미 숫자 +1 | "다시 안 온다"가 읽히면 충분 | `TODO_TOKEN` |
| 셔플 | 버린 더미 → 뽑을 더미로 묶음 이동 | 짧게. 매 턴 볼 수 있으니 반복 피로 주의 | `motion.normal` |
| 봉인 | (우리 고유) 정령 기절 시 그 정령 카드들 일괄 가라앉음 | R5 "못 내는 카드" 표현과 같은 문법 재사용 | `TODO_TOKEN` |

### 1-3. 공통 기법

| 기법 | 설명 | 이 게임에서 |
| --- | --- | --- |
| 이징 | 들어올 때 Out 계열(빠르게 시작·부드럽게 멈춤), 나갈 때 In 계열. 탄성(Back/Elastic)은 "튀는" 성격 | 유체·성체 = 부드러운 Out, 각성 = 더 무거운 곡선 후보. 결정은 Lucy |
| 예비동작 / 따라붙기 | 움직이기 전 반대로 살짝, 멈춘 뒤 살짝 넘쳤다 돌아옴 | T1은 아주 약하게, T2부터 분명하게 |
| 히트스톱 | 타격 순간 대상(또는 전체)을 몇 프레임 멈춤 | 전체 정지는 T2 이상(브레이크·치명)만. T1은 대상만 짧게 |
| 화면 흔들림 | 크기·시간·방향. Nijman은 방향성 강조, Xbox 가이드는 끄기·강도 옵션 권장 | **기본값을 아주 약하게**, 브레이크·각성만. 옵션 0~100% |
| 숫자 팝업 | 대상 위에서 떠오르며 사라짐, 크기로 강도 표현, 같은 대상 연타는 쌓이거나 합쳐짐 | 판단 정보이므로 **항상 읽히게**: 외곽선/배경, 겹침 방지 |
| 순차 공개 | 효과를 한 번에 다 보여주지 않고 하나씩 | 연속 N·점화처럼 "왜 터졌는지" 보여야 하는 키워드에 필수 |
| 소리 음정 상승 | 연쇄될수록 음이 올라감 | 연속 N, 다단 히트에 후보 (오디오는 별도 리서치) |

### 1-4. 사례별 정리

**Slay the Spire — 액션 큐**
- 카드의 `use()`는 상태를 직접 바꾸지 않고 `AbstractGameAction`들을 `AbstractDungeon.actionManager`에 넣어요. `addToBottom()`은 뒤에, `addToTop()`은 맨 앞에 끼워 넣어요(반응 효과용). 각 액션은 자기 시간(duration) 동안 `update()`되며 끝나야 다음으로 가요. (BaseMod 위키 "Base Game Information")
- 즉 **로직과 연출이 한 큐에 섞인 구조**예요. 장점: 단순. 단점: 로직 결과를 미리 계산(미리보기·시뮬)하기 어려움. 우리 게임은 이미 `Battle`이 즉시 계산 + 이벤트 로그라서 **StS보다 유리한 구조**예요(미리보기 R5·`npm run sim`이 가능한 이유).
- 빠른 모드: 설정에 Fast Mode가 있고, 모드 SuperFastMode는 "게임이 실제보다 시간이 더 흘렀다고 믿게" 해서 병목 애니메이션만 빠르게 해요. → **전역 시간 배율 하나로 빨리감기**를 구현하는 게 실전에서 통한다는 근거예요.

**Balatro — 이벤트 매니저와 순차 득점**
- 모든 연출이 `G.E_MANAGER:add_event(Event{ trigger, delay, blocking, blockable, func })`로 큐에 들어가요. `trigger`는 `immediate / after / before / condition / ease`, `func`가 `true`를 돌려줄 때까지 매 프레임 재호출, `blocking=false`면 병렬 진행. **delay는 게임 속도 옵션에 곱해져요.** (Steamodded 위키 "Event Manager")
- 득점 순서: 카드가 한 장씩 점수를 내고, 조커가 왼→오 순서로 하나씩 반응, 누적 숫자가 단계마다 갱신돼요. 점수 규모에 따라 흔들림·소리가 커진다는 분석도 있어요(Blake Crosley 분석글 — 개발자 확인 값 아님, 수치는 인용하지 않아요).
- LocalThunk는 "가장 생산적인 밤은 불꽃 효과를 만든 날"이라고 했어요. 그 불꽃은 **목표 점수를 넘는 순간에만** 나와요(GamesRadar). → 큰 연출은 드문 순간에만 = 우리 "각성만 크게" 원칙과 같은 논리.

**Hearthstone / Marvel Snap — 등급별 연출**
- Hearthstone: 효과 강도가 카드 위력과 비례해야 하고, 전설 카드는 별도 연출을 받아요(1-1 표).
- Marvel Snap: 같은 카드가 업그레이드 단계마다 테두리·배경 마감(Foil/Prism/Ink/Gold)·테두리 효과(Glimmer/Tone/Stardust/Krackle)가 추가돼요(snap.fan). → **"카드 수집 보상으로서의 시각 등급"** 이에요. 우리 게임은 "반짝임·등급 시안"을 Lucy가 기각했으니 **이 방향은 가져오지 않아요.** 참고만.

**Monster Train**
- 전투 속도 2배·3배 옵션이 있어요(The Sixth Axis 프리뷰: "fight speed is a little slow... you can speed things up at double or triple speed"). → 로그라이트는 반복 플레이라 **속도 옵션이 사실상 필수**.

---

## 2. 구조: 게임 로직과 연출 분리

### 2-1. 지금 코드 상태 (src/core 확인 결과)

- `src/core/battle.ts`: `Battle` 클래스가 상태를 즉시 바꾸며 `events: BattleEvent[]`에 푸시, `drain()`으로 꺼냄. 이벤트 종류: `log, damage, heal, block, status, break, freeze, cancel, charge, enemyAct, spiritAct, awaken, awakenEnd, downed, enemyDead, phase2`.
- `src/scenes/BattleScene.ts`의 `animate(evts, done)`: 이벤트를 돌며 `at(dt, fn)`으로 **누적 ms 고정값**을 `time.delayedCall`에 걸어요. 마지막에 `done` 호출.
- 별도 이벤트 버스·액션 큐는 없어요. 이 정도면 충분히 좋은 출발점이에요.

**부족한 점 (연출 쪽에서 필요한 정보)**

| 빠진 것 | 왜 필요한가 | 제안 (core 변경 — Lucy 동의 필요) |
| --- | --- | --- |
| 카드 이동 이벤트 | 드로우·버림·소멸·셔플·봉인 모션 | `{k:"cardMove", uid, from, to}`, `{k:"shuffle", count}` |
| 카드 사용 시작/끝 묶음 | 피해·상태가 "어느 카드의 결과"인지, 레시피 선택 | `{k:"playBegin", uid, cardId, owner, target}` … `{k:"playEnd", uid}` |
| 피해의 출처 | 투사체 방향, 반격 연출 | `damage`에 `src?: Ref` |
| 키워드 발동 표식 | 연속 N·점화·성장은 지금 `log`/`status` 텍스트로만 있음 | `{k:"keyword", id:"combo"\|"ignite"\|..., uid}` |
| 싱크로율 변화 | 각성 직전 게이지 차오름 | `{k:"sync", id, from, to}` |

> CLAUDE.md상 UI 작업에서 `src/core`는 건드리지 않아요. 위 항목은 **로직 변경이 아니라 이벤트 추가만**이지만, 그래도 별도 작업으로 분리해 Lucy 확인 후 진행하는 걸 권해요. 이벤트를 추가해도 `npm run sim` 결과는 달라지지 않아야 해요(테스트 기준).

### 2-2. 제안 파이프라인

```
[입력] → Battle(규칙, 즉시 계산) → BattleEvent[] (로그)
                                       │ drain()
                                       ▼
                         Director (이벤트 → 스텝 번역, 레시피 조회)
                                       ▼
                    Step 트리: seq[ par[ ... ], wait, ... ]
                                       ▼
                 Sequencer (시간 배율, 빨리감기, 건너뛰기, 모션 줄이기)
                                       ▼
                 Views (CardView, SpiritView, EnemyView, Popups)
```

원칙
1. **상태는 항상 로직이 먼저 확정**해요. 연출은 "이미 일어난 일을 보여주기"만 해요. 그래서 건너뛰기를 해도 게임 결과가 안 바뀌어요.
2. 뷰는 연출이 끝나면 **로직 상태로 스냅(sync)** 해요. 건너뛰기/중단 시 어긋남이 생겨도 마지막 sync가 정답을 맞춰 줘요.
3. 입력 잠금은 "연출 중"이 아니라 **"시퀀서가 블로킹 스텝을 재생 중"** 일 때만. StS처럼 다음 카드 입력을 큐에 미리 받는 것도 가능(선택 사항).

### 2-3. TypeScript 스케치

```ts
// src/fx/step.ts — 연출 단위. 모두 "끝나면 resolve되는 Promise"로 통일
export interface FxCtx {
  scene: Phaser.Scene;
  speed: number;          // 사용자 속도 설정 × 빨리감기 배율
  reducedMotion: boolean; // 흔들림·화면 효과 끄기
  skipping: boolean;      // 건너뛰기: 즉시 최종 상태로
}
export type Step =
  | { kind: "seq"; steps: Step[] }
  | { kind: "par"; steps: Step[] }
  | { kind: "wait"; ms: TokenRef }                       // 시간은 토큰 이름으로만
  | { kind: "call"; run: (c: FxCtx) => Promise<void> | void; skippable?: boolean };

export type TokenRef = keyof typeof import("../design/tokens").motion; // 'fast' | 'normal' | 'emphasis'
```

```ts
// src/fx/sequencer.ts — 하나뿐인 재생기
export class Sequencer {
  private queue: Step[] = [];
  private running = false;
  speed = 1;              // 설정 화면의 1x/2x/…
  ff = 1;                 // 꾹 누르는 동안 빨리감기 배율
  skipRequested = false;

  constructor(private scene: Phaser.Scene, private settings: () => FxSettings) {}

  enqueue(step: Step) { this.queue.push(step); if (!this.running) void this.pump(); }

  private ctx(): FxCtx {
    const s = this.settings();
    return { scene: this.scene, speed: this.speed * this.ff, reducedMotion: s.reducedMotion, skipping: this.skipRequested };
  }

  private async pump() {
    this.running = true;
    while (this.queue.length) await this.play(this.queue.shift()!);
    this.skipRequested = false;
    this.running = false;
    this.scene.events.emit("fx-idle"); // 뷰가 로직 상태로 sync
  }

  private async play(s: Step): Promise<void> {
    const c = this.ctx();
    switch (s.kind) {
      case "seq": for (const x of s.steps) await this.play(x); return;
      case "par": await Promise.all(s.steps.map((x) => this.play(x))); return;
      case "wait": if (c.skipping) return; return delay(this.scene, msOf(s.ms) / c.speed);
      case "call": if (c.skipping && s.skippable !== false) return; await s.run(c); return;
    }
  }
}
```

- **속도 배율**은 한 곳에서: 시퀀서의 `wait`와, Phaser `this.tweens.setGlobalTimeScale(v)` / `this.time.timeScale`을 같이 맞춰요. (Phaser 4: 트윈 실효 속도 = 매니저 timeScale × 트윈 timeScale. Timeline의 `timeScale`은 자기가 만든 트윈에는 안 걸리니 주의 — Phaser 4.2.1 skills 문서)
- **빨리감기**: 키를 누르는 동안 `ff`를 올리고 global timeScale에 반영. StS SuperFastMode와 같은 "시간을 더 흐른 것처럼" 방식.
- **건너뛰기**: 남은 큐를 비우고 `fx-idle` → 뷰 sync. `skippable:false`는 각성 컷인 첫 등장처럼 "한 번은 꼭 보여줄" 것에만.
- **모션 줄이기**: 흔들림·히트스톱·화면 플래시·컷인 확대를 끄고, 대신 **같은 정보는 정적 표시**(숫자·아이콘)로 남겨요. 정보는 줄이지 않아요.

```ts
// src/fx/director.ts — 이벤트를 스텝으로 번역 (카드 사용 단위로 묶음)
export function translate(evts: BattleEvent[], lib: RecipeLib): Step[] {
  const out: Step[] = [];
  let group: Step[] | null = null;
  for (const e of evts) {
    if (e.k === "playBegin") { group = [lib.cardPlay(e)]; continue; }
    if (e.k === "playEnd" && group) { out.push({ kind: "seq", steps: group }); group = null; continue; }
    const step = lib.forEvent(e);       // damage → 히트+팝업, freeze → 빙결 레시피 ...
    if (!step) continue;
    (group ?? out).push(step);
  }
  return out;
}
```

### 2-4. 데이터 기반 레시피

카드마다 연출 코드를 쓰지 않고, **레시피 = 데이터**로 만들어요. 카드는 기본적으로 `속성 × 역할 × 대상`에서 자동 결정되고, 특별한 카드만 덮어써요.

```ts
// design/fx/recipes.json 같은 데이터 (값은 토큰 이름만)
type Tier = 0 | 1 | 2 | 3;
interface FxRecipe {
  tier: Tier;
  cast?: { spine?: string; anticipation?: "none" | "light" | "clear" };
  travel?: "none" | "projectile" | "sweep" | "rise";        // 카드→대상 경로
  impact?: { hitstop?: "target" | "global" | "none"; shake?: "none" | "light" | "strong"; particles?: string };
  material?: "lava" | "glaze" | "hanji" | "silk" | "plain"; // 속성 재질 = 모션 언어
  popup?: "number" | "status" | "both";
  durationToken: "fast" | "normal" | "emphasis";
}
// 조회 순서: card override → keyword → element×role → default
```

장점: (1) 40장을 4~6개 레시피로 시작 가능, (2) 강도 조절이 데이터 수정만으로, (3) `check:design`처럼 "레시피에 리터럴 금지" 검사도 붙일 수 있어요.

---

## 3. Phaser 4: v3 대비 바뀐 점과 카드 렌더링

### 3-1. 바뀐 점 (공식 마이그레이션 가이드·뉴스·패키지 내 skills 문서 확인)

| 영역 | Phaser 3 | Phaser 4 | 카드에 의미 |
| --- | --- | --- | --- |
| 렌더러 | Pipeline | **RenderNode** (`renderer.renderNodes`, 오브젝트별 `setRenderNodeRole`) | 커스텀 셰이더는 렌더 노드/필터 컨트롤러로 |
| FX·마스크 | preFX/postFX, BitmapMask | **Filters**: `obj.enableFilters()` 후 `filters.internal` / `filters.external`. 마스크도 `addMask` | 카드 단위 효과는 internal(싸고, 회전 따라감) |
| 기본 필터 | 일부 FX | Glow, Shadow, Blur, ColorMatrix, Displacement, GradientMap, Wipe, Threshold, Vignette, Pixelate, Barrel, Bokeh, TiltShift, Key, Quantize, ParallelFilters 등 | 아래 3-3 |
| Bloom/Shine | FX | `Phaser.Actions.AddEffectBloom()`, `AddEffectShine()` | Shine = 반짝임(보류 결정이므로 지금은 안 씀) |
| 틴트 | tintFill | `setTintMode(Phaser.TintModes.FILL/ADD/SCREEN/...)`, 4.2: `setTint2()` | 피격 플래시·가라앉힘 |
| 셰이더 | Shader | `Shader`가 `ShaderQuadConfig`, `setUniform()`, 텍스처 좌표 GL식(Y=0 아래) | 재질 셰이더 작성 시 주의 |
| 메시 | Mesh, Plane | v4.0에서 제거 → **4.2에서 `Mesh2D`** 추가 | 카드 원근 기울기(진짜 3D)는 Mesh2D 후보 |
| RenderTexture | 즉시 그림 | 명령 버퍼 → `render()` 호출 필요, `preserve()`, `capture` | 카드 굽기(bake) 시 `render()` 잊지 말기 |
| 조명 | Light2D 파이프라인 | `setLighting(true)`, 자기 그림자, ImageLight 필터 | 재질 노멀맵 실험 가능(나중) |
| 기타 | — | `Gradient`, `Noise*` 셰이더 오브젝트, `CaptureFrame`, `SpriteGPULayer`, 4.2 `Stencil` | Noise = 비단·용암 흐름 텍스처 후보 |
| 트윈/타임라인 | 3.60+ chain, timeline | 같은 계열: `tweens.chain`, `this.add.timeline([...])`(at/in/from, run/tween/sound/event), `setGlobalTimeScale` | 시퀀서 내부에 그대로 사용 |
| 파티클 | 3.60 개편 | `this.add.particles(x,y,tex,cfg)`, `explode()`, `emitParticleAt()`, `reserve`, `maxAliveParticles` | 풀링 옵션으로 GC 스파이크 방지 |

주의: 필터는 **WebGL 전용**이고, 활성 필터 하나마다 드로우 콜이 늘어요. Glow의 `quality`·`distance`는 생성 후 못 바꿔요(바꾸려면 새로 만들기). (Phaser 4.2.1 filters skill)

### 3-2. 카드 렌더링 방식 비교

| 방식 | 내용 | 장점 | 단점 | 권장 쓰임 |
| --- | --- | --- | --- | --- |
| A. Container | 그림·틀·이름띠·숫자판·초상을 자식으로 | 수치(최종값) 갱신 쉬움, 부분 애니 쉬움 | 자식 많으면 드로우·필터 비용, 필터를 컨테이너에 걸면 통째로 FBO | **손패 기본** |
| B. RenderTexture(굽기) | 정적 부분을 한 장 텍스처로 구운 뒤 숫자만 위에 | 손 10장이어도 가볍고 필터 1회 | 수치·상태 바뀌면 다시 굽기, v4는 `render()` 필수 | 덱 화면·보상 화면처럼 많이 깔릴 때 |
| C. NineSlice | 틀을 늘려 쓰는 9분할 | 해상도 독립, 아틀라스 작음 | 정령별 "그림 창 윗선 모양"처럼 비정형 틀엔 안 맞음 | 말풍선·이름띠·패널 |

추천: **A로 시작**하고, 덱/보상 화면에서 느려지면 정적 레이어만 B로 굽기. 판단 정보(최종 수치·비용)는 굽지 않고 항상 살아 있는 텍스트로 둬요(값이 자주 바뀜).

### 3-3. 카드에 쓸 효과 후보 (구현 기술만, 시각 결정은 Lucy)

| 필요 | 기술 후보 | 비고 |
| --- | --- | --- |
| 호버 확대·밀림 | 트윈(scale, x) + 재배치 함수 | R5 확정 동작 |
| 호버 기울기(가짜 3D) | ① scaleX/skew 근사 + 하이라이트 이동 ② `Mesh2D` 4꼭짓점 원근 ③ 셰이더에서 UV 기울임 | ①이 가장 싸고 쉬움. 과하면 "휘황찬란" 쪽이라 정도는 Lucy |
| 재질(이름띠→호버 시 카드 전체) | 재질 텍스처를 **마스크 필터**(`addMask`)로 띠 영역에만 → 호버 시 마스크 확장/제거 | 또는 재질 레이어 2장(띠용/전체용) 알파 크로스페이드가 제일 단순 |
| 재질 "움직임" | `Displacement` 필터 + 노이즈 텍스처 오프셋 트윈, 또는 `Noise` 셰이더 | 반짝임(shimmer)은 보류 상태이므로 "흐름"만 실험 |
| 외곽 빛(조준·선택 가능) | `addGlow(color, outer, inner, ...)` internal | 색은 TODO_TOKEN |
| 못 내는 카드 가라앉힘 | `ColorMatrix`(채도↓·밝기↓) + 초상만 제외(자식 분리) | R5: 몸체만 가라앉고 얼굴은 컬러 → 필터를 컨테이너 전체가 아니라 몸체 레이어에만 |
| 그림자/떠오름 | `addShadow` 또는 그림자 스프라이트 1장 | 스프라이트가 더 쌈 |
| 소멸 | `Wipe` 필터(가장자리부터 사라짐) 또는 `Threshold`+노이즈 디졸브 | 속성별 다르게 가능 |

### 3-4. 성능 (손 10장 + Steam Deck)

- Steam Deck 기본 해상도는 1280×800으로 기준 해상도와 같아요. GPU는 노트북 내장급이라 **풀스크린 external 필터 여러 개**가 가장 위험해요.
- 원칙: 카드 효과는 **internal**만, 그리고 **"지금 호버 중인 1장"에만** 필터를 켜요. 손에 있는 10장 모두에 Glow를 상시 걸지 않아요.
- 필터는 생성·파괴 대신 켜기/끄기로 재사용(`ignoreDestroy`, 컨트롤러 재사용).
- 파티클은 `reserve`로 미리 할당, `maxAliveParticles` 상한.
- Spine은 4.3.11+ Phaser 렌더러면 일반 스프라이트와 **배칭**돼 드로우 콜이 줄어요(Phaser 4.2 뉴스).
- 측정: M1부터 FPS·드로우 콜 표시 디버그 오버레이를 두고, Deck 실기(또는 Proton) 확인은 M6에서.

---

## 4. Spine: 어디에 쓰고 어디에 안 쓸까

### 4-1. 패키지·버전 (2026-10 확인)

- Phaser 4용 공식 패키지: **`@esotericsoftware/spine-phaser-v4`** (Phaser 3용은 `-v3`, 옛 `spine-phaser`는 유지보수 중단).
- **4.3.11+는 Phaser 4.2.1+ 필요**, 이전 v4 런타임은 Phaser 4.1.0+.
- 런타임 major.minor = **Spine 에디터 export 버전**이어야 해요(문서 예제는 4.3.*).
- 렌더러 옵션: `"phaser"`(기본, 4.2 Mesh2D 기반, 배칭), `"spine-webgl"`, `"spine-canvas"`. 생성 시 고정.
- **슬롯 오브젝트**: `addSlotObject(slot, gameObject, opts)` — Phaser 오브젝트를 Spine 슬롯에 붙여 뼈 변환·그리기 순서를 따라가게. `"phaser"` 렌더러에서만 동작, 슬롯당 1개.
- 이벤트: `spine.animationState.addListener({ start, interrupt, end, complete, dispose, event })`.

⚠️ 현재 `package.json`: `phaser@^4.2.1`, `spine-phaser-v4@^4.2.120`. 슬롯 오브젝트·배칭을 쓰려면 `~4.3.x`로 올리고 **에디터도 4.3으로 export**해야 해요. 반대로 에디터가 4.2라면 지금 버전을 유지하고 슬롯 오브젝트는 포기. 리깅 시작 전에 정해야 나중에 재export 비용이 없어요.

### 4-2. 역할 분담

| 대상 | 추천 도구 | 이유 |
| --- | --- | --- |
| 정령 대기·시전·피격·기절 | **Spine** | 이미 결정된 체형별 리그 + 스킨. 애니 재사용 |
| 정령 각성 변신·컷인 | **Spine** (+ Phaser 필터/카메라) | T3 단 하나의 큰 연출. 여기에 시간 투자 |
| 적 | Spine 또는 스프라이트 | 범위 밖, 정령 리그 재사용 여부에 따름 |
| 카드 몸체 이동·호버·기울기 | **Phaser 트윈** | 위치·스케일·회전뿐. Spine으로 하면 수치 텍스트·재질·필터 연동이 오히려 어려움 |
| 카드 틀 뼈대 애니(틀이 휘거나 열림) | 비추천 (지금은) | 정령별 윗선 모양 × 리그 = 관리 비용 큼. 반짝임처럼 "효과는 나중에" 범주 |
| 공격 효과(불덩이, 물줄기) | **Phaser 파티클 + 스프라이트 시트 + 필터** 우선 | 대상 위치가 매번 달라 경로를 코드로 잡는 게 편함. 특정 큰 기술만 Spine 이펙트 리그 |
| 숫자 팝업·상태 아이콘 | **Phaser** | 판단 정보, 폰트(Orbit) 렌더 필요 |
| 정령 손에 붙는 마법진 등 | Spine 슬롯 오브젝트(4.3.11+) | 뼈를 따라가는 Phaser 오브젝트 |

### 4-3. 타격 동기화: Spine 이벤트 → 시퀀서

Spine 에디터에서 시전 애니에 `hit` 같은 **이벤트 키**를 찍어 두면, 연출이 "몇 ms 뒤"가 아니라 "주먹이 닿는 순간"에 맞춰져요. 애니 길이를 바꿔도 코드 수정이 없어요.

```ts
// SpiritView: 애니를 재생하고, 지정 이벤트가 오면 resolve
playUntilEvent(anim: string, eventName = "hit"): { hit: Promise<void>; done: Promise<void> } {
  const entry = this.spine.animationState.setAnimation(0, anim, false);
  let onHit!: () => void, onDone!: () => void;
  const hit = new Promise<void>((r) => (onHit = r));
  const done = new Promise<void>((r) => (onDone = r));
  entry.listener = {
    event: (_e, ev) => { if (ev.data.name === eventName) onHit(); },
    complete: () => { onHit(); onDone(); },        // 이벤트 누락 대비
  };
  return { hit, done };
}

// 레시피에서: 정령 시전 ↔ 타격 효과를 병렬로, 타격은 hit 이벤트 후
const cast = spirit.playUntilEvent("cast");
await cast.hit;
await Promise.all([impact(target), popup(target, amount)]);
await cast.done;
```

- 트랙 엔트리는 `dispose` 후 무효라 밖에 저장하지 말아요(공식 문서 주의사항).
- 속도 배율: `spine.animationState.timeScale`도 시퀀서 속도와 같이 맞춰야 해요.

### 4-4. 1인 개발 비용·효과

| 항목 | 비용 | 효과 | 판단 |
| --- | --- | --- | --- |
| 정령 공통 애니(체형별 대기/시전/피격/기절) | 중 (리그당 1회) | 높음 (전투 내내 보임) | 필수 |
| 시전 애니에 이벤트 키 | 매우 낮음 | 높음 (싱크 맞음) | 필수 |
| 각성 컷인 Spine | 중~고 | 높음 (유일한 큰 장면) | 정령 1종으로 먼저 |
| 카드 틀 Spine | 고 | 낮음~중 | 보류 |
| 공격 이펙트 Spine | 중 | 중 | 파티클로 시작, 부족한 것만 |

---

## 5. 이 게임용 VFX 등급 체계 (제안)

### 5-1. 4단계

| 등급 | 언제 | 범위 | 허용 기법 | 금지 | 시간 토큰 |
| --- | --- | --- | --- | --- | --- |
| **T0 UI 피드백** | 호버, 포커스, 집기, 조준, 사용 불가 표시 | 카드 1장·UI 요소 | 확대, 이동, 재질 노출, 외곽 빛(1장만), 채도 변화 | 파티클, 흔들림, 소리 과잉 | `motion.fast` |
| **T1 일반 카드 사용** | 기본/일반 피해·방어·회복·드로우 | 시전 정령 + 대상 | 정령 시전 애니, 짧은 경로(투사체/쓸기), 대상 짧은 정지, 숫자 팝업 | 화면 전체 효과, 카메라 흔들림 | `motion.normal` |
| **T2 키워드·속성 결실** | 점화, 빙결, 브레이크, 치명, 약점 타격, 연속 N 발동, 반격, 캐스팅 끊기 | 대상 + 근처, 브레이크만 화면 살짝 | 예비동작 분명히, 대상 히트스톱, 약한 흔들림(옵션), 속성 재질 모션, 순차 공개 | 화면 덮는 색 플래시, 긴 컷인 | `motion.emphasis` |
| **T3 각성 전용** | 싱크로율 100% 각성 (2턴) | 화면 전체 | 컷인, 배경 어둡게/필터, 카메라 이동, 전용 Spine, 전역 히트스톱 | 각성 아닌 장면에서 사용 | `TODO_TOKEN(awaken.*)` |

규칙
- **등급은 위력이 아니라 "의미"로 정해요.** 희귀 카드라도 효과가 평범하면 T1. (Marvel Snap식 희귀도 연출은 Lucy가 기각한 "등급 시안" 방향과 겹치므로 안 함)
- 한 카드 사용의 연출 등급은 **그 안에서 일어난 가장 높은 이벤트**를 따르되, 각 이벤트는 자기 등급으로만 보여요(예: 피해=T1, 그중 브레이크=T2).
- 모션 줄이기 ON: T2의 흔들림·히트스톱 → 정지 표시로 대체, T3 → 짧은 버전(같은 정보, 카메라 이동·플래시 없음).
- 플래시·깜빡임: 외부 기준인 WCAG 2.3.1(초당 3회 초과 깜빡임 금지)을 넘지 않게. (Xbox 가이드 117은 수치를 주지 않고 끄기 옵션만 권장)

### 5-2. 속성별 모션 언어 (재질 = 움직이는 방식)

확정된 재질(불=밝은 용암석, 물=유약, 숲=한지+잎맥, 바람=비단, 무=무지)을 **동사**로 바꿨어요. 값은 없고, 각 줄은 Lucy가 고를 후보예요.

| 속성 | 재질 | 모션 동사 후보 | T1에서 | T2 결실(키워드) | 피해야 할 것 |
| --- | --- | --- | --- | --- | --- |
| 불 | 밝은 용암석 | 달아오르다, 갈라지다, 식으며 굳다, 튀다 | 대상에 닿는 순간 "달아올랐다 식음" | **점화**: 쌓인 화상이 "갈라진 틈으로 한꺼번에 터짐" | 불꽃이 화면을 덮는 것 |
| 물 | 유약 | 흘러내리다, 맺히다, 반사가 미끄러지다, 굳어 매끈해지다 | 표면을 "한 번 쓸고 지나감" | **빙결**: 흐르던 유약이 "그 자리에서 멈춰 굳음"(정지가 곧 연출) | 물보라 파티클 과다 |
| 숲 | 한지 + 잎맥 | 스미다, 번지다, 결을 따라 자라다, 접히다 | 잎맥을 따라 "번지듯" 퍼짐 | **재생/성장**: 결을 따라 "자라남", 성장 ▲는 한 칸씩 스며듦 | 잎사귀가 흩날리는 장식 |
| 바람 | 비단 | 나부끼다, 감기다, 미끄러지다, 펼쳐지다 | 대상을 "스치고 지나감" | **연속 N**: 앞 카드 수만큼 "한 겹씩 감김" → 마지막에 풀리며 타격 | 계속 흔들리는 상시 애니 |
| 무 | 무지 | 놓이다, 눌리다, 단정하게 멈추다 | 장식 없이 "놓이고 눌림" | (무속성 결실 = 브레이크 공통 문법 사용) | — |

공통 결실
- **브레이크**: 실드 칸이 "하나씩 빠지다가 → 마지막 칸이 깨짐"(순차 공개가 핵심, 칸 수=판단 정보).
- **캐스팅 끊기**: 적 차징 표시가 "끊기며 흩어짐". 원인(브레이크/빙결)이 먼저, 끊김이 뒤.
- **각성(T3)**: 해당 정령 재질이 처음으로 **화면 전체**로 확장되는 순간. "손패에서는 이름띠만, 호버 시 카드 전체" 규칙의 연장선 → "각성 시 화면 전체". 이 일관성을 제안의 근거로 둘 수 있어요(시안은 Lucy 선택).

### 5-3. 토큰 연결

`design/tokens/tokens.json`에 이미 `motion.fast`(hover, 선택) / `motion.normal`(카드 이동, 패널) / `motion.emphasis`(브레이크, 치명, 각성)가 `TODO_TOKEN`으로 있어요. 추가가 필요해 보이는 자리(값 없이 이름만 제안):

| 토큰 후보 | 쓰임 |
| --- | --- |
| `motion.stagger` | 드로우·버림 여러 장 시차 |
| `motion.hitstop.target` / `motion.hitstop.global` | T1/T2 정지 |
| `motion.shake.light` / `motion.shake.strong` | T2 / T3 (옵션 배율 곱) |
| `motion.awaken.*` | T3 컷인 구간들 |
| `easing.enter` / `easing.exit` / `easing.weighty` | DESIGN_SYSTEM.md 1-4의 `easing` 칸 채우기 |
| `fx.speed.options` | 설정 화면 속도 단계 (Monster Train 2x/3x, Balatro 게임 속도 옵션 참고) |

---

## 6. 1인 개발 마일스톤 (제안)

각 마일스톤은 "보이는 결과 1개 + 확인 방법 1개"로 작게 잘랐어요. 시각 선택이 필요한 지점은 ☐Lucy로 표시했어요.

| # | 목표 | 할 일 | 끝 기준 |
| --- | --- | --- | --- |
| M0 | 버전 정리 | Spine 에디터 버전 결정 → `spine-phaser-v4` 버전 맞추기, 테스트 리그 1개 로드 | 정령 1종 대기 애니가 BattleScene에 뜸 |
| M1 | 시퀀서 뼈대 | `src/fx/`에 Step/Sequencer/Director, 기존 `animate()`를 Director로 옮기기(연출은 지금 플레이스홀더 그대로), 속도 설정·빨리감기·건너뛰기·모션 줄이기 토글 | 같은 전투를 1x/빠르게/건너뛰기로 돌려도 최종 화면이 같음 |
| M1.5 | 이벤트 보강 (core, Lucy 동의 후) | `playBegin/End`, `cardMove`, `shuffle`, `keyword`, `damage.src` 추가 | `npm run sim` 결과 불변 |
| M2 | 손 모션 (T0) | 드로우·배치·호버·집기·조준·사용·버림·소멸·셔플 트윈. 재질 레이어 띠→전체 전환 ☐Lucy(정도) | 컨트롤러 포커스 = 호버 상태 동일 |
| M3 | T1/T2 레시피 4~6개 | 레시피 데이터 형식 + 속성 4종 기본 레시피 + 브레이크·빙결·점화 ☐Lucy(모션 동사 고르기) | 40장 전부 기본 레시피로 연출됨(덮어쓰기 0개) |
| M4 | Spine 동기화 | 시전 애니 `hit` 이벤트 ↔ 타격·팝업 | 애니 길이를 바꿔도 타격이 맞음 |
| M5 | 각성 T3 | 정령 1종 각성 컷인 시안 2~3개 ☐Lucy → 선택안 구현, 모션 줄이기 버전 | 각성 → 2턴 → 종료까지 연출, 건너뛰기 가능(첫 1회 제외 여부 ☐Lucy) |
| M6 | 다듬기·성능 | 토큰 값 확정 ☐Lucy, FPS/드로우콜 오버레이, Deck 실기 확인, 소리 타이밍 | Deck에서 손 10장 + 각성 중 프레임 유지 |

팁 (처음 이펙트를 배우는 입장에서)
- **효과를 만들기 전에 "끄고 켜기"부터.** M1에서 모션 줄이기·속도 옵션을 먼저 넣으면, 이후 만드는 모든 효과가 자동으로 그 옵션을 지켜요.
- 새 효과는 **한 번에 한 축만**(위치 → 크기 → 색 → 파티클 순) 더하고, 매번 "끈 것과 비교"해요. "Juice It or Lose It" 시연 방식 그대로예요.
- 레퍼런스는 녹화해서 프레임 단위로 보기(StS·Balatro·Wildfrost 각 1회 플레이 녹화). 숫자를 베끼지 말고 **순서와 비율**을 보세요.

---

## 7. 열린 질문 (Lucy 결정 필요)

1. Spine 에디터 버전: 4.2 유지 vs 4.3 (슬롯 오브젝트·배칭 이점).
2. core에 연출용 이벤트 추가 허용 여부(M1.5).
3. 속도 옵션 단계와 빨리감기 입력(꾹 누르기? 토글?).
4. 각성 컷인을 매번 보여줄지, 두 번째부터 짧게/건너뛰기 허용할지.
5. 호버 기울기(가짜 3D)를 넣을지 — "과한 장식 금지"와 경계선에 있음.

---

## 출처

- Jonasson & Purho, *Juice It or Lose It*, GDC Europe 2012 — https://gdcvault.com/play/1016487/Juice-It-or-Lose
- *Don't Juice It or Lose It*, GDC Vault — https://gdcvault.com/play/1020861/Don-t-Juice-It-or
- "Video: Indies, resist the urge to 'juice it or lose it'" — https://jikguard.com/news/video-indies-resist-the-urge-to-juice-it-or-lose-it
- Jan Willem Nijman, *The Art of Screenshake* (Control Conference 2013) 기사 — https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games
- Hearthstone VFX 인터뷰 (Dominic Camuglia) — https://www.screenhub.com.au/news/features/making-magic-behind-the-vfx-that-empowers-the-players-of-hearthstone-262603-1429647/
- Marvel Snap Splits & Flares — https://snap.fan/guides/infinity-splits-and-frame-breaks-guide/
- Slay the Spire 액션 큐 (BaseMod 위키) — https://github-wiki-see.page/m/daviscook477/BaseMod/wiki/Base-Game-Information
- SuperFastMode (StS 모드) — https://github.com/houeland/SuperFastMode
- Balatro 이벤트 매니저 (Steamodded 위키) — https://github-wiki-see.page/m/Breezebuilder/Steamodded-Wiki/wiki/Guide-%E2%80%90-Event-Manager
- LocalThunk 불꽃 효과 발언 (GamesRadar) — https://gamesradar.com/games/roguelike/after-winning-big-at-the-game-awards-and-taking-hours-of-our-time-in-2024-balatro-creator-reveals-their-most-productive-night-resulted-in-one-of-the-games-most-satisfying-features
- Balatro 피드백 분석 (Blake Crosley, 개발자 확인 아님) — https://blakecrosley.com/guides/design/balatro
- Monster Train 프리뷰 (전투 속도 옵션) — https://www.thesixthaxis.com/2020/04/21/monster-train-preview-roguelike-card-battling-in-hell/
- Xbox Accessibility Guideline 117 — https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117
- Phaser 4 Filter System 뉴스 (2026-05) — https://phaser.io/news/2026/05/phaser-4-filter-system
- Phaser v3→v4 Migration Guide — https://cdn.jsdelivr.net/npm/phaser@4.2.0/changelog/v4/4.0/MIGRATION-GUIDE.md
- Phaser 4.2 (Spine 렌더러, Mesh2D, Stencil) — https://phaser.io/news/2026/07/phaser-4-2-spine-renderer-mesh2d-stencil
- Phaser 4.2.1 패키지 내 skills 문서: filters — https://unpkg.com/phaser@4.2.1/skills/filters-and-postfx/SKILL.md · v4 new features — https://unpkg.com/phaser@4.2.1/skills/v4-new-features/SKILL.md · time/timeline — https://unpkg.com/phaser@4.2.1/skills/time-and-timers/SKILL.md · tweens — https://unpkg.com/phaser@4.2.1/skills/tweens/SKILL.md · particles — https://unpkg.com/phaser@4.2.1/skills/particles/SKILL.md
- spine-phaser 런타임 문서 — https://en.esotericsoftware.com/spine-phaser
- 저장소: `src/core/battle.ts`(BattleEvent, drain), `src/scenes/BattleScene.ts`(animate), `design/tokens/tokens.json`(motion.*), `package.json`
