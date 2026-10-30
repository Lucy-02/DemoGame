import { C, GROWTH, personalityDef, spiritDef } from "./data";
import { STAGES, type PersonalityDef, type RunSpirit, type Stage, type StatKey } from "./types";

/** 마지막에 한 번만 하는 반올림. 6.5 같은 값이 부동소수 오차로 6이 되지 않게 보정해요. */
export const round = (x: number) => Math.round(x + 1e-9);

/** 유체 0 · 성체 1 · 각성체 2. 단계 보정은 이 수만큼 쌓여요. */
export const stageRank = (s: Stage) => STAGES.indexOf(s);

/** 성체부터 성격이 드러나요. */
export const isGrown = (rs: Pick<RunSpirit, "stage">) => rs.stage !== "baby";

/** 유체 때는 성격이 숨겨져 있고 효과도 꺼져 있어요. */
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

/** HP 조건(용맹)을 뺀 기본 능력치. */
export function baseStat(rs: RunSpirit, k: StatKey): number {
  let v = spiritDef(rs.id).stats[k] + stageBonus(rs, k);
  const p = activePersonality(rs);
  if (p && p.kind === "stat" && p.stat === k && p.mult) v *= p.mult;
  return v;
}

export function maxHpOf(rs: RunSpirit): number {
  let hp = spiritDef(rs.id).stats.hp + stageBonus(rs, "hp") + levelHp(rs.level);
  const p = activePersonality(rs);
  if (p && p.kind === "stat" && p.stat === "hp" && p.mult) hp *= p.mult;
  return round(hp) + rs.maxHpBonus;
}

/** 카드 수치 보정: 기본값 × 능력치/10. */
export const scale = (base: number, stat: number) => round((base * stat) / C.stat_base);
