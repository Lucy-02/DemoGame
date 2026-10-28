import { C, personalityDef, spiritDef } from "./data";
import type { PersonalityDef, RunSpirit, StatKey } from "./types";

/** 마지막에 한 번만 하는 반올림. 6.5 같은 값이 부동소수 오차로 6이 되지 않게 보정해요. */
export const round = (x: number) => Math.round(x + 1e-9);

/** 유체 때는 성격이 숨겨져 있고 효과도 꺼져 있어요. */
export function activePersonality(rs: RunSpirit): PersonalityDef | null {
  return rs.adult ? personalityDef(rs.personality) : null;
}

/** HP 조건(용맹)을 뺀 기본 능력치. */
export function baseStat(rs: RunSpirit, k: StatKey): number {
  const def = spiritDef(rs.id);
  let v = def.stats[k];
  if (rs.adult && def.adultMain.includes(k)) v += 1;
  const p = activePersonality(rs);
  if (p && p.kind === "stat" && p.stat === k && p.mult) v *= p.mult;
  return v;
}

export function maxHpOf(rs: RunSpirit): number {
  const def = spiritDef(rs.id);
  let hp = def.stats.hp + (rs.adult ? C.adult_hp_bonus : 0);
  if (rs.adult && def.adultMain.includes("hp")) hp += 1;
  const p = activePersonality(rs);
  if (p && p.kind === "stat" && p.stat === "hp" && p.mult) hp *= p.mult;
  return round(hp) + rs.maxHpBonus;
}

/** 카드 수치 보정: 기본값 × 능력치/10. */
export const scale = (base: number, stat: number) => round((base * stat) / C.stat_base);
