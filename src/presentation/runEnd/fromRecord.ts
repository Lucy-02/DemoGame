// 끝난 판(RunRecord) → 판 결과 화면 값. 정원이 떠날 때와 닫은 뒤에 어떻게 달라졌는지를 줄마다 읽어요 (0046).
import { CARDS } from "../../core/data";
import { canEvolve, gardenSpirit, levelOf, levelProgress, spiritUnlocks, toRunSpirit, type Garden } from "../../core/garden";
import { maxHpOf } from "../../core/stats";
import type { RunRecord } from "../../session/game";
import type { IconId } from "../faces";
import { cardVM, lane } from "../run/fromCore";
import { COPY } from "./copy";
import type { RunEndLaneVM, RunEndVM } from "./viewmodel";

/** 지금 레벨 안에서 채운 몫 (0~1). 최대 레벨이면 가득 */
function progress(exp: number): number {
  const p = levelProgress(exp);
  return p.next === undefined ? 1 : (exp - p.from) / (p.next - p.from);
}

function laneOf(r: RunRecord, id: string): RunEndLaneVM {
  const rs = r.run.spirit(id);
  const inGarden = (g: Garden) => g.spirits.some((s) => s.id === id);
  // 정원 없는 시험 판은 달라지는 것이 없어요
  if (!inGarden(r.before) || !inGarden(r.after)) return { lane: lane(rs) };
  const was = gardenSpirit(r.before, id), now = gardenSpirit(r.after, id);
  const lvWas = levelOf(was.exp), lvNow = levelOf(now.exp);
  const up = lvNow > lvWas;
  const maxOf = (s: typeof was) => maxHpOf(toRunSpirit(s));
  const opened = spiritUnlocks(now).filter((k) => !spiritUnlocks(was).includes(k));
  const unlocked = CARDS.filter((c) => opened.includes(c.unlock) && c.spirit === id).map((c) => c.name);
  const grow = !canEvolve(was)?.ok && !!canEvolve(now)?.ok;
  const badges: IconId[] = [...(up ? ["g-up" as const] : []), ...(unlocked.length ? ["g-cardnew" as const] : []), ...(grow ? ["g-seed" as const] : [])];
  // 링은 지금 레벨 안의 경험: 레벨이 올랐으면 처음부터 채운 만큼이 새로 더해진 몫이에요
  const exp = { before: up ? 0 : progress(was.exp), after: progress(now.exp) };
  const l = lane({ ...rs, level: lvNow, hp: maxOf(now) }, { exp, levelUp: up, badges, unlocked });
  const maxWas = maxOf(was), maxNow = maxOf(now);
  return { lane: { ...l, maxHp: maxWas }, maxHpTo: maxNow !== maxWas ? maxNow : undefined };
}

export function runEndVM(r: RunRecord): RunEndVM {
  const run = r.run;
  const floor = run.current?.floor ?? 0;
  const record = [COPY.act(1), COPY.floor(floor), r.victory ? COPY.victory : COPY.defeat].join(" · ");
  // 이긴 전투 = 들어간 전투 칸 수 - 진 전투 하나
  const fights = run.visited.filter((id) => ["battle", "elite", "boss"].includes(run.map.get(id)?.type ?? "")).length;
  const wins = Math.max(0, fights - (r.victory ? 0 : 1));
  const first = (r.before.runs ?? 0) === 0;
  return {
    victory: r.victory, record,
    keep: !r.victory && first && wins > 0 ? COPY.keep(wins) : undefined,
    gold: run.gold,
    cards: run.received.map((c) => ({ card: cardVM(c.cardId, c.owner), owner: c.owner })),
    lanes: run.spirits.map((s) => laneOf(r, s.id)),
  };
}

