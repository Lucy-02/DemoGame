// 단순 자동 플레이 AI. 시뮬레이터(tools/sim.ts)와 골든 테스트가 같이 써요.
import { Battle, type BattleEvent } from "../src/core/battle";
import { cardDef } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { Run } from "../src/core/run";

/** 이번 턴에 낼 수 있는 카드를 다 내요. 공격 우선, 그다음 아무거나. */
export function autoPlayTurn(b: Battle, rng: Rng) {
  for (let guard = 0; guard < 60 && b.result === "ongoing"; guard++) {
    const playable = b.hand.filter((c) => b.canPlay(c).ok);
    if (!playable.length) return;
    const c = playable.find((x) => cardDef(x.cardId).effects.some((o) => o.op === "damage")) ?? rng.pick(playable);
    const def = cardDef(c.cardId);
    let target;
    if (def.target === "enemy") {
      const es = b.aliveEnemies();
      target = { side: "e" as const, uid: es.sort((a, z) => a.hp - z.hp)[0].uid };
    } else if (def.target === "ally") {
      const ss = b.aliveSpirits().sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp);
      target = { side: "s" as const, id: ss[0].id };
    }
    b.play(c.uid, target);
  }
}

export interface AutoBattleResult {
  battle: Battle;
  events: BattleEvent[];
}

/** 시드 i로 런을 만들고 인카운터 하나를 끝까지(최대 40턴) 자동으로 싸워요. 같은 i면 항상 같은 결과예요. */
export function autoBattle(enemies: string[], i: number): AutoBattleResult {
  const run = new Run({ seed: 1000 + i, frontId: "testu", adult: false, unlockAll: false });
  const rng = new Rng(i * 7 + 3);
  const b = new Battle(run.spirits, run.deck, enemies, run.frontId, rng);
  const events: BattleEvent[] = [];
  while (b.result === "ongoing" && b.turn < 40) {
    autoPlayTurn(b, rng);
    events.push(...b.drain());
    if (b.result === "ongoing") b.endTurn();
    events.push(...b.drain());
  }
  return { battle: b, events };
}
