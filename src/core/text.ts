import { describeOp } from "./battle/effects";
import { join, type Clause, type TextContext } from "./clauses";
import { josa } from "./korean";
import { C, cardDef } from "./data";
import { scale } from "./stats";
import type { CardDef, CardTarget, EquipStat, EquipTier, StatCondition } from "./types";

export interface CasterStats {
  power: number;
  guard: number;
  focus: number;
  /** 북돋기로 받은 이번 턴 피해 보너스 */
  empower?: number;
  /** 성장으로 쌓인 주 수치 보너스 */
  grow?: number;
}

/** 적에게 가는 효과의 대상 (끌어서 고른 적 하나는 생략) */
const ENEMY_TO: Partial<Record<CardTarget, string>> = { allEnemies: "모든 적에게 " };

/** 아군에게 가는 효과: 카드 대상별 [대상, 동사]. 자기 자신은 대상을 생략하고 "얻다" */
const ALLY = {
  block: { self: ["", "얻"], ally: ["아군 하나에게 ", "주"], allAllies: ["모든 아군이 ", "얻"] },
  empower: { self: ["", "얻"], ally: ["아군 하나에게 ", "부여하"], allAllies: ["모든 아군에게 ", "부여하"] },
  thorns: { self: ["", "얻"], ally: ["아군 하나에게 ", "부여하"], allAllies: ["모든 아군이 ", "얻"] },
} as const;
/** 아군의 수치가 바뀌는 효과 (회복): "아군 하나의 HP를 …" */
const ALLY_OF: Partial<Record<CardTarget, string>> = { ally: "아군 하나의 ", allAllies: "모든 아군의 " };
/** 아군에게 거는 상태의 주어 */
const ALLY_WHO: Partial<Record<CardTarget, string>> = { ally: "고른 아군의 ", allAllies: "모든 아군의 " };

/** 시전 정령의 능력치를 반영한 최종 수치로 카드 문구를 만들어요. 효과마다의 문장은 효과 핸들러(`battle/effects.ts`)에 있어요. */
export function describeCard(def: CardDef, st: CasterStats | null): string {
  let mainUsed = false;
  const t = def.target;
  const ctx: TextContext = {
    foe: ENEMY_TO[t] ?? "",
    foeOf: t === "allEnemies" ? "모든 적의" : "대상의",
    me: t === "ally" || t === "allAllies" ? "이 정령이 " : "",
    allyOf: ALLY_OF[t] ?? "",
    allyWho: ALLY_WHO[t] ?? "",
    enemies: t === "enemy" || t === "allEnemies",
    ally: (op, what): Clause => {
      const [to, verb] = (ALLY[op] as Record<string, readonly [string, string]>)[t] ?? ALLY[op].self;
      return { to, core: `${what} ${verb}` };
    },
    sc: (v, k) => (st ? scale(v, st[k]) : v),
    dmg: (v) => (st ? scale(v + (st.empower ?? 0), st.power) : v),
    main: (v) => {
      if (mainUsed) return v;
      mainUsed = true;
      return v + (st?.grow ?? 0);
    },
  };
  const body = join(def.effects.flatMap((op) => describeOp(op, ctx)));
  return def.exhaust ? `${body} 소멸.` : body;
}

export const cardName = (id: string) => cardDef(id).name;

// ───────────────────────── 장비 효과문 (0064) ─────────────────────────

const pct = (v: number) => Math.round(v * 100);

/** 수치 이름과 "높습니다" 앞에 오는 조사 */
const EQUIP_STAT_NAME: Record<EquipStat, string> = {
  hp: "최대 HP가", power: "파워가", guard: "가드가", focus: "포커스가", speed: "스피드가", crit_chance: "치명 확률이", crit_mult: "치명 피해가",
};
/** 화면에 숫자(a→b)로 보이지 않는 수치는 문장으로 써요 */
const TEXT_STATS: readonly EquipStat[] = ["speed", "crit_chance", "crit_mult"];
const RATIO_STATS: readonly EquipStat[] = ["crit_chance", "crit_mult"];

const WHEN: Record<StatCondition["k"], (w: StatCondition) => string> = {
  hpBelow: (w) => (w.k === "hpBelow" && w.ratio !== 0.5 ? `HP가 ${pct(w.ratio)}% 아래이면 ` : "HP가 절반 아래이면 "),
  released: () => "해방 중이면 ",
  hurt: () => "HP가 가득이 아니면 ",
};

/** 장비가 정령의 동사를 바꾸는 효과의 문장. 키는 `EQUIP_PASSIVES`와 같아요 */
export const EQUIP_PASSIVE_TEXT: Record<string, (v: number) => string> = {
  start_block: (v) => `전투 시작 시 방어도를 ${v} 얻습니다.`,
  start_block_return: (v) => `전투 시작 시 방어도를 ${v} 얻습니다. 쓰러졌다 돌아올 때 HP를 ${C.equip_return_hp} 더 회복합니다.`,
  first_hit: (v) => `내 턴의 첫 타격은 피해를 추가로 ${v} 입힙니다.`,
  longest_card_hit: (v) => `이번 턴에 시간이 가장 긴 카드의 타격은 피해를 추가로 ${v} 입힙니다.`,
  linger_once: (v) => `전투마다 한 번 적의 화상, 약화, 취약이 줄어들 때 ${v} 덜 줄어듭니다.`,
  linger_turn: (v) => `턴마다 한 번 적의 화상, 약화, 취약이 줄어들 때 ${v} 덜 줄어듭니다.`,
  first_card_time: (v) => `내 턴의 첫 카드는 시간이 ${v}ms 줄어듭니다.`,
  first_card_time_opening: (v) => `내 턴의 첫 카드는 시간이 ${v}ms 줄어듭니다. 허점타 피해가 ${pct(C.equip_opening_bonus)}% 높습니다.`,
  crit_vs_full: (v) => `대상의 HP가 가득이면 치명 확률이 ${pct(v)}% 높습니다.`,
  crit_vs_healthy: (v) => `대상의 HP가 절반보다 많으면 치명 확률이 ${pct(v)}% 높습니다.`,
  first_card_cost: (v) => `내 턴의 첫 카드는 비용이 ${v} 줄어듭니다.`,
  time_cut: (v) => `카드 시간이 ${v}ms 줄어듭니다.`,
  carry_block: (v) => `내 턴 시작 시 방어도가 ${pct(v)}% 남습니다.`,
};

/**
 * 장비 한 층(공명 단계 또는 대가)의 효과문. 한 줄에 한 효과예요.
 * 조건 없는 HP · 파워 · 가드 · 포커스 보정은 화면이 숫자(a→b)로 보여 줘서 여기에 넣지 않아요.
 */
export function describeEquipTier(tier: EquipTier): string[] {
  const lines: string[] = [];
  for (const m of tier.stats ?? []) {
    if (!m.when && !TEXT_STATS.includes(m.stat)) continue;
    const ratio = m.op === "pct" || RATIO_STATS.includes(m.stat);
    const n = `${ratio ? pct(Math.abs(m.value)) : Math.abs(m.value)}${ratio ? "%" : ""}`;
    const cond = m.when ? WHEN[m.when.k](m.when) : "";
    lines.push(`${cond}${EQUIP_STAT_NAME[m.stat]} ${n} ${m.when ? "더 " : ""}${m.value < 0 ? "낮습니다" : "높습니다"}.`);
  }
  for (const e of tier.effects ?? []) {
    const text = EQUIP_PASSIVE_TEXT[e.passive];
    if (!text) throw new Error(`효과문이 없는 장비 효과: ${e.passive}`);
    lines.push(text(e.value));
  }
  return lines;
}

/** 전용 무기가 대표 카드를 기술로 바꾸는 효과문 (0055) */
export const describeSignatureSwap = (from: string, to: string) =>
  `${josa(cardName(from), "이/가")} ${josa(cardName(to), "으로/로")} 바뀝니다.`;
