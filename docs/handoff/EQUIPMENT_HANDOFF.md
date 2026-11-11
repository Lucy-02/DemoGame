# 장비 기반 핸드오프 (기획 → 카드 엔진·규칙)

- 날짜: 2026-11-10 · 작성: 장비 시스템 도입 검토 스레드
- 근거 결정: 0048 정령 장비·공명, 0049 전투 보상 구조 (PR #59), 0021 성장 메타, 0033 성격, 0036 시간축, 0045 성장 규칙(필러 2 "키우면 강해지고, 달라진다", 재료 보류)
- 근거 코드: `src/core/stats.ts`(`baseStat`, `maxHpOf`, `stageBonus`, `levelHp`), `src/core/battle/battle.ts` `stat()`(용맹)·치명 계산, `src/core/types.ts` `RunSpirit`, `src/data/personalities.json`, `src/data/constants.json`, `assets/PROVENANCE.md`
- ★ = 아직 정하지 않은 것. 구현은 기본값(제안)으로 하되 데이터로 바꿀 수 있게 두기.

## 0. 장비 효과의 모양 (Lucy 2026-11-10 확정)
**작은 능력치 보정 1~2개(`stats`) + 그 정령의 동사를 바꾸는 효과 0~1개(`effects`).** 능력치 보정은 레벨·단계보다 작은 폭, 치명 확률·치명 피해도 대상이에요. 공명이 오르면 둘 다 커질 수 있고, 단계 중 하나 이상은 조건이 풀리거나 효과가 붙어요. 0048 6절이 이렇게 바뀌었어요(PR #59).

**바뀐 것 (Lucy 2026-11-11, 결정 0055):** 정령 전용 장비는 동사 효과(`effects`) 대신 **시작 덱의 대표 카드 2장 중 1장을 그 무기의 기술로 바꿔요.** 덱 장수는 그대로이고, 공명이 오르면 바뀐 카드가 자라요. 범용·보스 장비는 카드를 바꾸지 않고 위 모양(능력치 + 효과) 그대로예요.

## 1. 데이터 스키마 (초안)
파일: `src/data/equipment/<owner>.json` (정령별 묶음, 카드와 같은 방식) + 문구는 `src/data/locales/<lang>/equipment.json` (id 키, 카드 l10n과 같은 구조). 로드 시 `validate.ts`로 검증.

```ts
type EquipStat = StatKey | "crit_chance" | "crit_mult";   // StatKey = hp·power·guard·focus·speed

interface StatMod {
  stat: EquipStat;
  op: "add" | "pct";        // add = 고정값, pct = 퍼센트(0.1 = +10%)
  value: number;
  when?: Condition;          // 있으면 전투 중 조건부 층(4절 L6)으로 감
}

type Condition =             // ★ 목록은 효과 설계 때 늘림
  | { k: "hpBelow"; ratio: number }
  | { k: "released" }        // 해방 중
  | { k: "targetHas"; status: string; atLeast?: number };

interface EquipTier {        // 공명 단계 하나 (1부터)
  stats?: StatMod[];
  effects?: EffectRef[];     // 기존 카드 효과 문법/훅 재사용 ★ 훅 목록은 엔진 스레드 판단
}

interface EquipDef {
  id: string;                // snake_case, 에셋 이름과 같음
  owner: string | null;      // 정령 id(전용) | null(누구나) ★ 기본 제안: 정령 전용
  grade: "elite" | "boss";   // 어디서 나오나 (0049)
  tiers: EquipTier[];        // 길이 = 최대 공명 (제안 3)
  downside?: EquipTier;      // 보스 장비의 대가 (0049), 공명과 무관하게 늘 적용 ★
  opensBranch?: { spirit: string; branch: string };  // 0027 갈래 보조 조건 (0048 5절)
}
```

- **대표 카드 변형 (0055)**: `EquipTier`에 대표 카드를 바꾸는 필드가 필요해요(필드 모양은 엔진 스레드 판단 ★). `effects`는 범용·보스 장비용으로 남겨요.
- **칸/부위**: 부위(무기·장신구 등)는 두지 않아요. 정령마다 "남길 칸 수"만 있어요(아래 2절). ★ 부위가 필요해지면 `slot` 필드 추가.
- **착용 조건**: `owner`가 있으면 그 정령만. 단계 조건은 따로 두지 않고 "칸 수"와 "공명 상한"이 단계로 막아요.
- **공명은 단계(층)가 아니라 데이터 선택**이에요. 공명 n이면 `tiers[n-1]`을 써요. 리졸버에 공명 층을 따로 두지 않아요.
- 수치는 모두 `TODO_TOKEN` (데이터 값은 시험판 가정값, 주석/README에 표시).

## 2. 남기기·공명·분해 규칙 (0048)
| 규칙 | 값 | 비고 |
| --- | --- | --- |
| 런 중 지닐 수 있는 수 | ★ 제안: 정령당 제한 없음 또는 2 | 0048 "TODO_TOKEN" |
| 런 끝 남길 칸 수 | 단계별 ★ 제안 유체 0 · 성체 1 · 각성체 2 | `growth.json`에 `equip_keep_slots: [0,1,2]` |
| 공명 상한 | 단계별 ★ 제안 유체 1 · 성체 2 · 각성체 3 | `equip_resonance_cap: [1,2,3]` |
| 같은 id를 다시 남김 | 공명 +1 (상한까지) | 상한이면 그대로 |
| 분해 | 공명이 상한인 장비만, 그 정령 전용 "공명 권" +1 | 권 이름 `TODO_NAME` |
| 권 사용 | 그 정령의 남긴 장비 하나 공명 +1, 상한 못 넘음 | |

- 유체 0칸이면 유체는 장비를 남길 수 없어요(런 중엔 씀). ★ Lucy 확인
- 저장(`garden.ts` 정령 상태)에 추가:
```ts
interface GardenEquip { id: string; resonance: number }   // resonance 1..cap
// GardenSpirit 에: equipment: GardenEquip[]  (길이 ≤ keep slots), resonanceTokens: number
```
- 단계가 내려가는 일은 없어서 칸·상한이 줄어드는 경우는 없어요.

## 3. 이미지
- 경로: `public/assets/equipment/<id>.webp` (카드 그림 `public/assets/cards/<id>.webp`와 같은 규칙).
- 크기·형식 가정: 정사각 512px webp 원본 1장, 화면 크기별 축소는 런타임 ★ 아이콘용 별도 파일이 필요한지는 화면 시안 뒤.
- 공명 단계별 그림을 따로 둘지 ★ (한 장 + 단계 표식 / 단계별 3장). 기본 제안: 한 장.
- 생성은 Lucy(NovelAI), Claude는 프롬프트 시트·후처리·기록. 모든 파일 `assets/provenance.jsonl` 한 줄(`path`, `sha256`, `status`, `model`, `prompt_sheet`, `prompt`/`seed`/`settings`, `source_png`, `human_work`, `note`). 그림이 없을 땐 플레이스홀더 + `status: placeholder`. `pnpm check:assets --release`가 막아요.
- 장비 이름·모양·아이콘은 Lucy 컨펌 전 확정하지 않아요(CLAUDE.md 시각 결정).

## 4. 스탯 리졸버와의 관계 (제안 순서)
지금은 `baseStat` = 기본 + 단계 → 성격 배율, `maxHpOf` = 기본 + 단계 + 레벨 → 성격 배율 → 반올림 + `maxHpBonus`, 전투 `stat()`에서 용맹. 이를 층 목록으로 바꾸면:

| 층 | 내용 | 연산 | 어디서 |
| --- | --- | --- | --- |
| L1 기본 | `spiritDef.stats` | 값 | 어디서나 |
| L2 단계 | `stageBonus` | 더하기 | 어디서나 |
| L3 레벨 | `levelHp` (HP만) | 더하기 | 어디서나 |
| L4 장비 고정값 | `op: add`, `when` 없음 | 더하기 | 어디서나 |
| L5 영구 배율 | 성격 능력치형 × 장비 `op: pct`(`when` 없음) | 곱하기 ★ | 어디서나 |
| (반올림) | HP만 여기서 반올림 후 `maxHpBonus`(이벤트) 더하기 | | |
| L6 전투 조건부 | 용맹, 장비 `when`, 해방 보정 | 곱하기 | 전투 중만 |
| (카드 수치) | `scale(base, stat)`에서 마지막 한 번 반올림 | | |

- **L5 합산 방식 ★**: 성격 +15%와 장비 +10%를 곱(×1.15×1.10)으로 할지 합(×1.25)으로 할지. 기본 제안: 같은 층 안의 퍼센트는 **합**, 층끼리는 곱. 예측이 쉽고 0046의 출처별 막대와 맞아요.
- **치명**: `crit_chance`, `crit_mult`는 StatKey가 아니라 파생 수치. 지금 `C.crit_base`·`C.crit_mult` 상수 + `critPity`. 장비 보정은 L4(더하기)로 얹어요(예: 치명 +3%p). 기획서 v0.2의 "치명은 장비와 카드가 올린다"가 여기서 처음 연결돼요.
- **출처 태그**: 층마다 기여분을 `{source: "base"|"stage"|"level"|"personality"|"equipment:<id>"|"run", delta}`로 돌려주면, 0046 "탐험 중 정령 보기"의 출처별 쪼갠 막대를 그대로 그릴 수 있어요.
- **전투 밖 값 vs 전투 중 값**: 달라도 돼요. 정원·정령 관리 = L1~L5(남긴 장비 기준), 런 화면(보상·상점·런 결과) = L1~L5(이번 런에 지닌 장비 기준) + `maxHpBonus`, 전투 = L1~L6. 조건부(L6)는 화면에서 "조건부" 줄로 따로 보여요(값에 섞지 않음).
- **골든 스냅샷**: 장비가 없는 판(자동 플레이·골든 테스트)은 지금과 같은 값이 나와야 해요. 층 바꾸기 리팩터링만으로는 스냅샷이 안 바뀌는 게 목표.

## 5. 보상·Run 상태 (0049)
| 시점 | 무엇이 생기나 | Run에 어디 |
| --- | --- | --- |
| 런 시작 | 각 정령의 남긴 장비(정원 `GardenEquip`)가 그대로 따라옴 | `RunSpirit.equipment: RunEquip[]` (`{id, resonance, from: "kept"}`) |
| 정예 승리 | 장비 1개(정예 풀, 정령 전용이면 파티 정령 것 중) → 누구에게 줄지 고름 | 고른 정령의 `equipment`에 `{id, resonance: 1, from: "run"}` 추가 ★ 이미 남긴 같은 id면 공명 그대로 + 표시만? |
| 보스 승리 (1막) | 런 결과에서 보스 장비 3택 1(대가 붙음) → 바로 남기기 화면 | `RunResult.bossEquipChoices: string[]` |
| 런 끝 (이기든 지든) | 정령마다 남길 장비 고르기, 같은 id면 공명 +1, 분해 | `RunResult.equipment[spiritId]` → `garden.ts`가 반영 |
| 상점 | 장비 팔지 않음 | |
| 이벤트 | ★ 장비를 주는 이벤트를 둘지 (0049엔 없음) | |

- 정예 장비 풀 고르기: 파티 정령 전용 장비 중 무작위, 이미 가진 것 제외 ★. 확률을 슬더슬 물약처럼 적응형으로 둘지는 데이터로.
- 보스 장비 `downside`는 지닌 동안 늘 적용.
- 진 런도 남기기를 해요(0048 2절, 이긴 전투만큼 얻은 것까지).

## 6. ★ 목록 (Lucy 또는 다음 기획에서)
1. 정령 전용 vs 누구나 (기본 제안 전용)
2. 런 중 지닐 수, 남길 칸 수, 공명 상한 값
3. L5 퍼센트 합산 방식
4. 공명 단계별 그림 따로/한 장
5. 같은 id를 런 중 또 얻었을 때 처리
6. 이벤트 장비 유무
7. 이름: 장비 자체, 공명 권, 분해 (`TODO_NAME`)
