import { ELEMENT_NAME, cardDef } from "./data";
import { andThen, polite } from "./korean";
import { scale } from "./stats";
import type { CardDef, CardOp, CardTarget } from "./types";

export interface CasterStats {
  power: number;
  guard: number;
  focus: number;
  /** 북돋기로 받은 이번 턴 피해 보너스 */
  empower?: number;
  /** 성장으로 쌓인 주 수치 보너스 */
  grow?: number;
}

// 효과 문구 규칙 (결정 0022, design/canon/text/TEXT_RULES.md 효과문):
// 합니다체 완결문, 어순 [조건] [대상] [대상물을] [수] [동사]. 숫자 뒤에는 조사를 붙이지 않아요.

/**
 * 효과 한 문장. `core`는 동사 줄기로 끝나요("피해를 6 입히").
 * 앞 문장과 `to`가 같으면 "~고"로 이어 대상을 한 번만 써요("모든 적에게 피해를 5 입히고 화상을 3 부여합니다.").
 */
interface Clause {
  to: string;
  core: string;
  /** 이 문장 뒤에 붙는 완결문 (조건·예외) */
  after?: string;
}
type Part = Clause | string;

/** 적에게 가는 효과의 대상 (끌어서 고른 적 하나는 생략) */
const ENEMY_TO: Partial<Record<CardTarget, string>> = { allEnemies: "모든 적에게 " };

/** 아군에게 가는 효과: 카드 대상별 [대상, 동사]. 자기 자신은 대상을 생략하고 "얻다" */
const ALLY = {
  block: { self: ["", "얻"], ally: ["아군 하나에게 ", "주"], allAllies: ["모든 아군이 ", "얻"] },
  empower: { self: ["", "얻"], ally: ["아군 하나에게 ", "부여하"], allAllies: ["모든 아군에게 ", "부여하"] },
  thorns: { self: ["", "얻"], ally: ["아군 하나에게 ", "부여하"], allAllies: ["모든 아군이 ", "얻"] },
} as const;
/** 아군의 수치가 바뀌는 효과 (회복·싱크로율): "아군 하나의 HP를 …" */
const ALLY_OF: Partial<Record<CardTarget, string>> = { ally: "아군 하나의 ", allAllies: "모든 아군의 " };

const sentence = (c: Clause) => `${c.to}${polite(c.core)}.${c.after ? ` ${c.after}` : ""}`;

/** 문장들을 이어요. 대상이 같은 연속 문장만 "~고"로 묶어요 (효과문 규칙 R10) */
function join(parts: Part[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < parts.length) {
    const p = parts[i];
    if (typeof p === "string") {
      out.push(p);
      i++;
      continue;
    }
    let core = p.core;
    let last = p;
    while (i + 1 < parts.length) {
      const n = parts[i + 1];
      if (typeof n === "string" || !p.to || n.to !== p.to || last.after) break;
      core = `${andThen(core)} ${n.core}`;
      last = n;
      i++;
    }
    out.push(sentence({ to: p.to, core, after: last.after }));
    i++;
  }
  return out.join(" ");
}

/** 시전 정령의 능력치를 반영한 최종 수치로 카드 문구를 만들어요. */
export function describeCard(def: CardDef, st: CasterStats | null): string {
  let mainUsed = false;
  const main = (v: number) => {
    if (mainUsed) return v;
    mainUsed = true;
    return v + (st?.grow ?? 0);
  };
  const sc = (v: number, k: "power" | "guard" | "focus") => (st ? scale(v, st[k]) : v);
  const dmg = (v: number) => (st ? scale(v + (st.empower ?? 0), st.power) : v);

  const t = def.target;
  const foe = ENEMY_TO[t] ?? "";
  const foeOf = t === "allEnemies" ? "모든 적의" : "대상의";
  /** 카드 주인에게만 가는 효과: 다른 아군을 고르는 카드에서는 "이 정령이"로 밝혀요 */
  const me = t === "ally" || t === "allAllies" ? "이 정령이 " : "";
  const ally = (op: keyof typeof ALLY, what: string): Clause => {
    const [to, verb] = (ALLY[op] as Record<string, readonly [string, string]>)[t] ?? ALLY[op].self;
    return { to, core: `${what} ${verb}` };
  };

  const one = (op: CardOp): Part[] => {
    switch (op.op) {
      case "damage": {
        const d = dmg(main(op.value));
        const hits = op.hits && op.hits > 1 ? `${d}씩 ${op.hits}번` : `${d}`;
        const again = op.againIf === "burned" ? `대상이 화상 상태이면 피해를 추가로 ${hits} ${polite("입히")}.` : undefined;
        return [{ to: foe, core: `피해를 ${hits} 입히`, after: again }];
      }
      case "block": return [ally("block", `방어도를 ${sc(main(op.value), "guard")}`)];
      case "heal": return [{ to: ALLY_OF[t] ?? "", core: `HP를 ${sc(main(op.value), "focus")} 회복하` }];
      case "burn": return [{ to: foe, core: `화상을 ${sc(main(op.value), "focus")} 부여하` }];
      case "ignite": return [{ to: foe, core: "화상 수치만큼 피해를 입히고 화상을 모두 없애" }];
      case "chill": return [{ to: foe, core: `냉기를 ${sc(main(op.value), "focus")} 부여하` }];
      case "freeze":
        return [{ to: foe, core: "빙결시키", after: `보스에게는 대신 냉기를 ${op.bossChill} ${polite("부여하")}.` }];
      case "thorns": return [ally("thorns", `반격을 ${sc(main(op.value), "guard")}`)];
      case "grow": return [{ to: "", core: `이번 전투 동안 이 카드의 수치가 ${op.value} 늘어나` }];
      case "draw": return [{ to: "", core: `카드를 ${op.value}장 뽑` }];
      case "vulnerable": return [{ to: foe, core: `취약을 ${op.turns}턴 부여하` }];
      case "weak": return [{ to: foe, core: `약화를 ${op.turns}턴 부여하` }];
      case "empower": return [ally("empower", `강화를 ${sc(main(op.value), "focus")}`)];
      case "taunt": return [{ to: me, core: "도발을 얻" }];
      case "moveFront": return [{ to: "", core: "이 정령이 앞열로 나서" }];
      case "manaNextTurn": return [{ to: "", core: `다음 턴에 마력을 ${op.value} 더 얻` }];
      case "sync": return [{ to: ALLY_OF[t] ?? "", core: `싱크로율이 ${op.value}%p 오르` }];
      case "aura": {
        const body = ((): string => {
          switch (op.aura) {
            case "blaze_wing": return `이 정령이 화상을 부여할 때마다 화상을 ${op.value} 더 ${polite("부여하")}.`;
            case "deep_water": return `내 턴 시작 시 방어도를 ${sc(op.value, "guard")} ${polite("얻")}.`;
            case "root_down": return `내 턴이 끝날 때 HP가 가장 낮은 아군의 HP를 ${sc(op.value, "focus")} ${polite("회복하")}.`;
            case "eye_of_storm": return `매 턴 ${op.value}번째로 사용하는 카드의 비용이 0이 ${polite("되")}.`;
          }
        })();
        return [`지속. ${body}`];
      }
      case "damageFromBlock":
        return [{ to: foe, core: "현재 방어도만큼 피해를 입히", after: `파워의 영향을 받지 ${polite("않")}.` }];
      case "burnMultiply": return [{ to: "", core: `${foeOf} 화상을 ${op.value}배로 늘리` }];
      case "damagePerPlayed":
        return [{ to: "", core: `이번 전투에서 사용한 ${ELEMENT_NAME[op.element]} 카드 1장당 ${foe}피해를 ${op.value} 입히` }];
      case "repeatNext": return [{ to: "", core: `이번 턴에 다음으로 사용하는 비용 ${op.maxCost} 이하 카드가 한 번 더 발동하` }];
      case "combo": return [`연속 ${op.n}: ${join(op.then.flatMap(one))}`];
    }
  };

  const body = join(def.effects.flatMap(one));
  return def.exhaust ? `${body} 소멸.` : body;
}

export const cardName = (id: string) => cardDef(id).name;
