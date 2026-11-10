import { describeOp } from "./battle/effects";
import { join, type Clause, type TextContext } from "./clauses";
import { cardDef } from "./data";
import { scale } from "./stats";
import type { CardDef, CardTarget } from "./types";

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

/** 시전 정령의 능력치를 반영한 최종 수치로 카드 문구를 만들어요. 효과마다의 문장은 효과 핸들러(`battle/effects.ts`)에 있어요. */
export function describeCard(def: CardDef, st: CasterStats | null): string {
  let mainUsed = false;
  const t = def.target;
  const ctx: TextContext = {
    foe: ENEMY_TO[t] ?? "",
    foeOf: t === "allEnemies" ? "모든 적의" : "대상의",
    me: t === "ally" || t === "allAllies" ? "이 정령이 " : "",
    allyOf: ALLY_OF[t] ?? "",
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
