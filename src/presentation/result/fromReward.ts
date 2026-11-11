// 보상 세션 → 화면 값.
import { cardDef } from "../../core/data";
import type { RewardSession } from "../../session/reward";
import { cardVM, lane, statOf } from "../run/fromCore";
import type { ResultVM } from "./viewmodel";

export function resultVM(s: RewardSession): ResultVM {
  return {
    gold: { total: s.run.gold, gained: s.gained },
    cards: s.offers.map((o) => ({
      card: cardVM(o.cardId, o.learners.length === 1 ? o.learners[0] : undefined),
      owners: o.learners, stat: statOf(cardDef(o.cardId)),
    })),
    skipGold: s.skipGold,
    // 경험 정산이 아직 런에 연결되지 않아서 링은 비어 있고 문턱 표식도 없어요 (0044 열린 질문)
    lanes: s.run.spirits.map((rs) => lane(rs)),
  };
}
