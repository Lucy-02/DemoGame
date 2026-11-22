// 끝난 판(RunRecord) → 판 결과 화면 값 (0046). 정령 줄은 그 판에서 자란 마지막 모습이에요 (0157: 레벨 · 단계는 정원에 남지 않아요).
import type { RunRecord } from "../../session/game";
import { cardVM, lane, levelFill } from "../run/fromCore";
import { COPY } from "./copy";
import type { RunEndVM } from "./viewmodel";

export function runEndVM(r: RunRecord): RunEndVM {
  const run = r.run;
  const floor = run.current?.floor ?? 0;
  const record = [COPY.act(run.act), COPY.floor(floor), r.victory ? COPY.victory : COPY.defeat].join(" · ");
  return {
    victory: r.victory, record,
    gold: run.gold,
    cards: run.received.map((c) => ({ card: cardVM(c.cardId, c.owner), owner: c.owner })),
    lanes: run.spirits.map((s) => {
      const fill = levelFill(s.exp);
      return lane(s, { exp: { before: fill, after: fill } });
    }),
  };
}
