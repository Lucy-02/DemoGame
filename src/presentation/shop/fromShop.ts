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
    // 빼기는 덱 고르기 화면이 생기면 켜요
    remove: { price: s.removePrice, enabled: false },
    heal: { price: s.healPrice, enabled: s.canHeal(), gain: s.healPreview() },
    lanes: run.spirits.map((rs) => lane(rs, { exp: { before: 0, after: 0 }, deck: run.deck.filter((c) => c.owner === rs.id).length })),
  };
}
