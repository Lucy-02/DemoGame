import { ELEMENT_NAME, cardDef } from "./data";
import { scale } from "./stats";
import type { CardDef, CardOp } from "./types";

export interface CasterStats {
  power: number;
  guard: number;
  focus: number;
  /** 북돋기로 받은 이번 턴 피해 보너스 */
  empower?: number;
  /** 성장으로 쌓인 주 수치 보너스 */
  grow?: number;
}

const TARGET_PREFIX: Record<string, string> = {
  enemy: "", allEnemies: "적 전체 ", self: "", ally: "아군 1 ", allAllies: "아군 전체 ",
};

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

  const one = (op: CardOp): string => {
    switch (op.op) {
      case "damage": {
        const d = dmg(main(op.value));
        const hits = op.hits && op.hits > 1 ? `${d}을 ${op.hits}번` : `${d}`;
        const again = op.againIf === "burned" ? ". 대상이 화상이면 한 번 더" : "";
        return `피해 ${hits}${again}`;
      }
      case "block": return `방어도 ${sc(main(op.value), "guard")}`;
      case "heal": return `회복 ${sc(main(op.value), "focus")}`;
      case "burn": return `화상 ${sc(main(op.value), "focus")}`;
      case "ignite": return "점화";
      case "chill": return `냉기 ${sc(main(op.value), "focus")}`;
      case "freeze": return `즉시 빙결 (보스에게는 냉기 ${op.bossChill})`;
      case "thorns": return `반격 ${sc(main(op.value), "guard")}`;
      case "grow": return `성장 ${op.value}`;
      case "draw": return `드로우 ${op.value}`;
      case "vulnerable": return `취약 ${op.turns}턴`;
      case "weak": return `약화 ${op.turns}턴`;
      case "empower": return `강화 ${sc(main(op.value), "focus")}`;
      case "taunt": return "도발";
      case "moveFront": return "이 정령이 앞열로";
      case "manaNextTurn": return `다음 턴 마력 +${op.value}`;
      case "sync": return `싱크로율 +${op.value}%p`;
      case "aura":
        switch (op.aura) {
          case "blaze_wing": return `지속. 화상을 부여할 때마다 +${op.value}`;
          case "deep_water": return `지속. 매 턴 시작에 방어도 ${sc(op.value, "guard")}`;
          case "root_down": return `지속. 매 턴 끝에 HP가 가장 낮은 아군 회복 ${sc(op.value, "focus")}`;
          case "eye_of_storm": return `지속. 매 턴 ${op.value}번째로 쓰는 카드는 비용 0`;
        }
        return "지속";
      case "damageFromBlock": return "현재 방어도만큼 피해 (파워 보정 없음)";
      case "burnMultiply": return `대상의 화상 ${op.value}배`;
      case "damagePerPlayed": {
        const per = st ? `${ELEMENT_NAME[op.element]} 카드 1장당 피해 ${op.value}×파워` : `${ELEMENT_NAME[op.element]} 카드 1장당 피해 ${op.value}`;
        return `이번 전투에서 쓴 ${per}`;
      }
      case "repeatNext": return `이번 턴 다음에 쓰는 비용 ${op.maxCost} 이하 카드가 한 번 더 발동`;
      case "combo": return `연속 ${op.n}: ${op.then.map(one).join(", ")}`;
    }
  };

  const body = def.effects.map(one).join(", ");
  const tail = def.exhaust ? ". 소멸" : "";
  return `${TARGET_PREFIX[def.target] ?? ""}${body}${tail}`;
}

export const cardName = (id: string) => cardDef(id).name;
