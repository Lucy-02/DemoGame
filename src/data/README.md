# 게임 데이터

| 위치 | 내용 |
|---|---|
| `cards/<묶음>.json` | 카드 정의 (수치·효과·해금). 묶음은 파일을 나누는 단위일 뿐이고, 게임은 `cards/index.ts`의 순서대로 이어 붙인 한 목록으로 써요. 새 묶음 파일은 `cards/index.ts`에 더해요. |
| `locales/<언어>/cards.json` | 카드 문구 (id → `{ name }`). `ko`가 기본 언어라 모든 카드를 채우고, 다른 언어에서 빠진 카드는 `ko`로 보여요. 새 언어는 폴더를 만들고 `locales/index.ts`에 더해요. |
| `equipment/<묶음>.json` | 장비 정의 (0048 · 0049). 형식은 `types.ts`의 `EquipDef`: 전용 정령 · 희귀도(`generic` 범용 · `exclusive` 전용 무기 · `boss` 보스 장비, 0056) · 공명 단계별 `tiers`(능력치 보정 ≤ 2 + 효과 ≤ 1) · 보스 대가 `downside` · 전용 무기의 대표 카드 변형 `signature`(갈래 → 공명 단계별 기술 카드 id, 0055). 새 파일은 `equipment/index.ts`에 더해요. 지금은 범용 6개(`generic.json`), 전용 무기 3개(`exclusive.json`), 보스 장비 3개(`boss.json`)가 있고 숫자는 시험 값이에요. 보스 장비는 공명 단계가 하나예요. |
| 그 밖의 `*.json` | 정령·적·인카운터·성장·상수 등 |

- 카드 형식은 `src/core/types.ts`의 `CardData`, 검사는 `src/core/validate.ts`예요. 새 필드는 두 곳에 함께 더해요.
- 카드 데이터 파일에는 문구를 적지 않아요. 이름은 `design/canon/naming/cards.csv`에서 정하고 `locales`로 옮겨요.
- 카드 `ms`는 기본 시간이에요. 실제 시간 = ms × 10 ÷ 정령 스피드(0036). 지금 값은 비용·역할로 잡은 시험 가정값이에요(`TODO_TOKEN`, 플레이테스트 뒤 정함).
- 적 행동 시각은 패턴 행동의 `at`(ms), 없으면 `constants.json`의 `enemy_at`(등급별). 축 길이 `axis_ms`, 허점 창 `opening_window_ms` · 배율 `opening_mult`, 빙결 늦춤 `freeze_delay_ms`도 시험 가정값이에요.
- 카드 그림은 `public/assets/cards/<카드 id>.webp`, 장비 그림은 `public/assets/equipment/<장비 id>.webp`예요.
- 장비의 능력치 보정 `op: add`는 층 4(고정값), `op: pct`는 층 5(영구 배율, 성격과 더해서 한 번 곱함), `when`이 있으면 전투 조건부 층이에요(`src/core/stats.ts` · `docs/architecture/0003-battle-engine.md`). `effects[].passive`는 `src/core/battle/passives.ts`의 `EQUIP_PASSIVES` 키예요.
- `growth.json`의 `equip_slots`는 단계별(유체 · 성체 · 각성체) 장비 칸 수예요. 지니는 수와 런 끝에 남기는 수가 같아요(0056). `equip_resonance_cap`은 단계별 공명 상한 시험 가정값이에요.
- `pnpm test`(`data.test.ts`)가 형식, id 중복, 묶음·언어 목록 누락, 문구 누락을 잡아요.
- `cards/techniques.json`은 전용 무기가 대표 카드 자리에 넣는 기술 카드예요(`obtain: "equipment"`). id는 `<대표 카드>_<갈래>_<공명>`이고, 이름은 갈래마다 하나예요(0061). 보상이나 상점에는 나오지 않아요.
- `encounters.json`: 일반 편성은 `pool`(`weak` 처음 전투들 · `strong` 그 뒤)과 `element`(오늘 센 기운과 같으면 더 자주)를 적어요. 보스 편성의 `element`는 그 기운이 센 런의 보스라는 뜻이에요 (0062).
- `enemies.json`: `acts`는 턴마다 움직이는 시각 목록(여러 번 행동), 행동의 `big`은 틈이 열릴 수 있는 큰 차징이에요. 틈 · 거친 특성 · 풀 값은 `constants.json`의 `gap` · `traits` · `run_pool` (0062).
