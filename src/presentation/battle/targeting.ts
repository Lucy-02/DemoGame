// 카드 대상 고르기 (그리기 없음, 순수 함수). 결정 0013: 조준선 없이, 카드를 대상에 끌어 대거나(끌기)
// 카드를 클릭해 집고 대상을 클릭해요(집기). 둘 다 "카드 + 포인터가 있는 곳"에서 같은 강조 상태를 만들어요.
//   - 대상이면 글로우, 고를 수 있는 대상은 점선 고리, 나머지는 흐리게
//   - 결과가 바뀌는 캐릭터(예: 차징이 끊겨 받을 피해가 줄어드는 아군)는 흐리게 하지 않아요 (미리보기 예산 ②)
import type { OutcomeVM, PlayVM, Side, UnitRef } from "./viewmodel";

/** 포인터가 있는 곳: 캐릭터 위, 필드 빈 곳(손패 띠 위), 손패 띠 */
export type Over = UnitRef | "field" | "hand";

export interface Focus {
  /** 그릴 결과 (없으면 강조만) */
  outcome?: OutcomeVM;
  /** 글로우로 강조할 대상 */
  lit: UnitRef[];
  /** 고를 수 있다는 점선 고리 */
  cand: UnitRef[];
  /** 강조·결과가 없는 나머지를 흐리게 */
  dim: boolean;
  /** 지금 놓거나 클릭하면 낼 수 있어요. target은 고른 대상 (pick만) */
  ready?: { target?: UnitRef };
  /** 같은 모습이면 같은 key (그린 필드를 다시 써요) */
  key: string;
}

export type Counts = Record<Side, number>;

const all = (side: Side, counts: Counts): UnitRef[] => Array.from({ length: counts[side] }, (_, i) => ({ side, i }));
const isUnit = (o: Over): o is UnitRef => typeof o === "object";

export function focusFor(card: string, play: PlayVM, over: Over, counts: Counts): Focus {
  const { kind, side } = play.target;
  const onField = over !== "hand";
  if (kind === "pick") {
    if (isUnit(over) && over.side === side && over.i < counts[side]) {
      return {
        outcome: play.outcomes?.[over.i], lit: [over], cand: [], dim: true,
        ready: { target: over }, key: `${card}:${side}${over.i}`,
      };
    }
    return { lit: [], cand: all(side, counts), dim: false, key: `${card}:cand` };
  }
  if (!onField) return { lit: [], cand: all(side, counts), dim: false, key: `${card}:cand` };
  // 전체는 모두 강조, 무작위는 누가 맞을지 모르니 점선 고리만 (정본 규칙 상태 3: 카드가 대상을 정해요)
  const units = all(side, counts);
  return {
    outcome: play.outcomes?.all,
    lit: kind === "all" ? units : [], cand: kind === "random" ? units : [], dim: true,
    ready: {}, key: `${card}:armed`,
  };
}

/** 이 캐릭터를 흐리게 할지: 흐림 상태에서 강조·고리·결과가 없는 캐릭터만 */
export function dimmed(f: Focus, u: UnitRef): boolean {
  if (!f.dim) return false;
  const same = (r: UnitRef) => r.side === u.side && r.i === u.i;
  if (f.lit.some(same) || f.cand.some(same)) return false;
  if (u.side === "enemy" && f.outcome?.enemies[u.i]) return false;
  if (u.side === "ally" && f.outcome?.incoming[u.i]) return false;
  return true;
}
