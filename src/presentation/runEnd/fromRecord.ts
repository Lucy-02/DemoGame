// 끝난 판(RunRecord) → 판 결과 화면 값 (0046). 정령 줄은 그 판에서 자란 마지막 모습이에요 (0157: 레벨 · 단계는 정원에 남지 않아요).
import { personalityDef } from "../../core/data";
import { rerollsOf } from "../../core/garden";
import type { RunRecord } from "../../session/game";
import { cardVM, lane, levelFill } from "../run/fromCore";
import { COPY } from "./copy";
import type { RunEndVM } from "./viewmodel";

export function runEndVM(r: RunRecord): RunEndVM {
  const run = r.run;
  const floor = run.current?.floor ?? 0;
  const record = [COPY.act(run.act), COPY.floor(floor), r.victory ? COPY.victory : COPY.defeat].join(" · ");
  // 이 판으로 새로 열린 성격 (완주한 판의 성격, 정령마다 많아야 하나)
  const opened = (id: string) => {
    const was = r.before.spirits.find((s) => s.id === id)?.cleared ?? [];
    return r.after.spirits.find((s) => s.id === id)?.cleared?.find((p) => !was.includes(p));
  };
  const rerolls = { from: rerollsOf(r.before), to: rerollsOf(r.after) };
  return {
    victory: r.victory, record,
    gold: run.gold,
    cards: run.received.map((c) => ({ card: cardVM(c.cardId, c.owner), owner: c.owner })),
    lanes: run.spirits.map((s) => {
      const fill = levelFill(s.exp);
      const p = opened(s.id);
      return { ...lane(s, { exp: { before: fill, after: fill } }), ...(p ? { opened: COPY.opened(personalityDef(p).name) } : {}) };
    }),
    ...(rerolls.to > rerolls.from ? { reroll: rerolls } : {}),
  };
}
