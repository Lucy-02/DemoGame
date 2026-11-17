// 판(Run) → 덱 보기 VM
import type { Run } from "../../core/run";
import { cardVM, lane } from "../run/fromCore";
import type { DeckVM } from "./viewmodel";

export function deckVM(run: Run): DeckVM {
  return {
    rows: run.spirits.map((rs) => {
      const l = lane(rs);
      return {
        id: rs.id, name: l.name, face: l.face,
        gained: run.received.filter((c) => c.owner === rs.id).length,
        cards: run.deck.filter((c) => c.owner === rs.id).map((c) => ({ ...cardVM(c.cardId, rs.id), key: `d${c.uid}` })),
      };
    }),
  };
}
