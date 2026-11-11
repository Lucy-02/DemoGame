import { C, GROWTH, equipDef, personalityDef, spiritDef } from "./data";
import { STAGES, type EquipStat, type EquipTier, type PersonalityDef, type RunEquip, type RunSpirit, type Stage, type StatCondition, type StatKey, type StatMod } from "./types";

/** 마지막에 한 번만 하는 반올림. 6.5 같은 값이 부동소수 오차로 6이 되지 않게 보정해요. */
export const round = (x: number) => Math.round(x + 1e-9);

/** 유체 0 · 성체 1 · 각성체 2. 단계 보정은 이 수만큼 쌓여요. */
export const stageRank = (s: Stage) => STAGES.indexOf(s);

/** 성체부터 성격 효과가 나요 (성격 자체는 유체부터 보여요, 0033). */
export const isGrown = (rs: Pick<RunSpirit, "stage">) => rs.stage !== "baby";

/** 유체 때는 성격이 보이기만 하고 효과는 꺼져 있어요. */
export function activePersonality(rs: RunSpirit): PersonalityDef | null {
  return isGrown(rs) ? personalityDef(rs.personality) : null;
}

/** 단계로 오른 값 (0021 3절): 주 성장 능력치에 단계마다 +2, HP가 주 성장이면 단계마다 +6. 레벨은 카드 숫자를 바꾸지 않아요. */
export function stageBonus(rs: Pick<RunSpirit, "id" | "stage">, k: StatKey): number {
  if (!spiritDef(rs.id).adultMain.includes(k)) return 0;
  return stageRank(rs.stage) * (k === "hp" ? GROWTH.stage_hp_main_bonus : GROWTH.stage_main_bonus);
}

/** 레벨로 오른 최대 HP (레벨당 +2, Lv1은 0) */
export const levelHp = (level: number) => (level - 1) * GROWTH.level_hp;

// ───────────────────────── 장비 ─────────────────────────

/** 장비 칸 수 (단계별). 지니는 수 = 런 끝에 남기는 수 (0056) */
export const equipSlots = (stage: Stage) => GROWTH.equip_slots[stageRank(stage)];
/** 공명 상한 (단계별) */
export const resonanceCap = (stage: Stage) => GROWTH.equip_resonance_cap[stageRank(stage)];

/** 지금 공명: 남긴 공명 + 이번 런에 오른 공명. 장비의 단계 수를 넘지 않아요 */
export function resonanceOf(e: RunEquip): number {
  return Math.min(Math.max(1, e.resonance + (e.runBonus ?? 0)), equipDef(e.id).tiers.length);
}

/** 지닌 장비 하나에서 지금 켜진 층: 공명 단계 하나 + 대가 */
export function activeTiers(e: RunEquip): EquipTier[] {
  const def = equipDef(e.id);
  const tier = def.tiers[resonanceOf(e) - 1];
  return def.downside ? [tier, def.downside] : [tier];
}

/** 쓰러졌던 정령이 전투 뒤 돌아올 때의 HP */
export function returnHp(rs: RunSpirit): number {
  const bonus = rs.equipment.some((e) => activeTiers(e).some((t) => t.effects?.some((ef) => ef.passive === "start_block_return")));
  return C.downed_return_hp + (bonus ? C.equip_return_hp : 0);
}

/** 지닌 장비 전부의 능력치 보정을 [장비 id, 보정] 쌍으로 */
export function equipMods(rs: RunSpirit, stat: EquipStat): [string, StatMod][] {
  const out: [string, StatMod][] = [];
  for (const e of rs.equipment) for (const t of activeTiers(e)) for (const m of t.stats ?? []) if (m.stat === stat) out.push([e.id, m]);
  return out;
}

// ───────────────────────── 능력치 층 ─────────────────────────

export type StatSource = "base" | "stage" | "level" | "personality" | "run" | `equipment:${string}`;

/** 층 하나가 보탠 몫. 화면의 출처별 막대에 써요 (0046) */
export interface StatPart {
  source: StatSource;
  delta: number;
}

export interface StatCalc {
  rs: RunSpirit;
  k: StatKey;
  value: number;
  parts: StatPart[];
}

interface StatLayer {
  id: string;
  order: number;
  apply: (c: StatCalc) => void;
}

const add = (c: StatCalc, source: StatSource, delta: number) => {
  if (delta === 0) return;
  c.value += delta;
  c.parts.push({ source, delta });
};

/** 전투 밖 능력치 층: 기본 → 단계 → 레벨(HP) → 장비 고정값 → 영구 배율(성격 + 장비 비율, 같은 층은 더하고 층끼리는 곱해요) */
export const STAT_LAYERS: StatLayer[] = [
  { id: "base", order: 10, apply: (c) => add(c, "base", spiritDef(c.rs.id).stats[c.k]) },
  { id: "stage", order: 20, apply: (c) => add(c, "stage", stageBonus(c.rs, c.k)) },
  { id: "level", order: 30, apply: (c) => { if (c.k === "hp") add(c, "level", levelHp(c.rs.level)); } },
  {
    id: "equipAdd", order: 40,
    apply(c) {
      for (const [id, m] of equipMods(c.rs, c.k)) if (m.op === "add" && !m.when) add(c, `equipment:${id}`, m.value);
    },
  },
  {
    id: "permanentPct", order: 50,
    apply(c) {
      const p = activePersonality(c.rs);
      const personality = p && p.kind === "stat" && p.stat === c.k && p.mult ? p.mult : 1;
      const equip = equipMods(c.rs, c.k).filter(([, m]) => m.op === "pct" && !m.when);
      const mult = personality + equip.reduce((a, [, m]) => a + m.value, 0);
      if (mult === 1) return;
      const before = c.value;
      c.value *= mult;
      if (personality !== 1) c.parts.push({ source: "personality", delta: before * (personality - 1) });
      for (const [id, m] of equip) c.parts.push({ source: `equipment:${id}`, delta: before * m.value });
    },
  },
];

STAT_LAYERS.sort((a, b) => a.order - b.order);

/** 전투 밖 능력치. HP는 반올림한 뒤 런에서 오른 최대 HP(maxHpBonus)를 더해요 */
export function resolveStat(rs: RunSpirit, k: StatKey): StatCalc {
  const c: StatCalc = { rs, k, value: 0, parts: [] };
  for (const l of STAT_LAYERS) l.apply(c);
  if (k === "hp") {
    c.value = round(c.value);
    add(c, "run", rs.maxHpBonus);
  }
  return c;
}

/** HP 조건(용맹) 같은 전투 조건부를 뺀 능력치. */
export const baseStat = (rs: RunSpirit, k: StatKey) => resolveStat(rs, k).value;

export const maxHpOf = (rs: RunSpirit) => resolveStat(rs, "hp").value;

/** 치명 확률 · 치명 피해: 상수에 장비 고정값을 더하고 비율을 곱해요 */
export function critStat(rs: RunSpirit, k: "crit_chance" | "crit_mult"): number {
  const mods = equipMods(rs, k).filter(([, m]) => !m.when);
  const base = k === "crit_chance" ? C.crit_base : C.crit_mult;
  const flat = mods.filter(([, m]) => m.op === "add").reduce((a, [, m]) => a + m.value, 0);
  const pct = mods.filter(([, m]) => m.op === "pct").reduce((a, [, m]) => a + m.value, 0);
  return (base + flat) * (1 + pct);
}

/** 전투 중 조건이 맞는지 */
export function conditionHolds(w: StatCondition, s: { hp: number; maxHp: number; release: number }): boolean {
  switch (w.k) {
    case "hpBelow": return s.hp <= s.maxHp * w.ratio;
    case "released": return s.release > 0;
    case "hurt": return s.hp < s.maxHp;
  }
}

/** 카드 수치 보정: 기본값 × 능력치/10. */
export const scale = (base: number, stat: number) => round((base * stat) / C.stat_base);
