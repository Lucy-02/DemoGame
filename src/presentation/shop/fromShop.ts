// 상점 세션 → 화면 값.
import type { ShopSession } from "../../session/shop";
import { cardVM, lane, statOf } from "../run/fromCore";
import type { ShopVM } from "./viewmodel";

export function shopVM(s: ShopSession): ShopVM {
  const run = s.run;
  return {
    gold: run.gold,
    cards: s.offers.map((o, slot) => {
      if (o.sold) return undefined;
      const learners = s.learners(slot);
      return {
        card: cardVM(o.card.id, learners.length === 1 ? learners[0] : undefined),
        price: o.price, affordable: s.canBuy(slot), learners, stat: statOf(o.card),
      };
    }),
    remove: { price: s.removePrice, enabled: s.canRemove() },
    heal: { price: s.healPrice, enabled: s.canHeal(), gain: s.healPreview() },
    deck: Object.fromEntries(run.spirits.map((rs) => [
      rs.id, run.deck.filter((c) => c.owner === rs.id).map((c) => ({ uid: c.uid, card: cardVM(c.cardId, rs.id) })),
    ])),
    lanes: run.spirits.map((rs) => lane(rs, { exp: { before: 0, after: 0 }, deck: run.deck.filter((c) => c.owner === rs.id).length })),
  };
}
