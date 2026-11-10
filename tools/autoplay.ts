// 단순 자동 플레이 AI. 시뮬레이터(tools/sim.ts)와 골든 테스트가 같이 써요.
import { Battle, type BattleEvent, type BCard } from "../src/core/battle";
import { cardDef } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { Run } from "../src/core/run";

/** 해방할 수 있으면 먼저 해방하고, 이번 턴에 낼 수 있는 카드를 다 내요. 고르는 건 공격 우선, 그다음 아무거나.
 *  시간축(0036)에서는 방어가 적 행동보다 먼저 끝나야 해서, 고른 카드는 방어부터 줄에 놓아요. 뽑기 카드는 바로 내요. */
export function autoPlayTurn(b: Battle, rng: Rng) {
  for (const s of b.aliveSpirits()) if (b.canRelease(s.id)) b.release(s.id);
  // 낙하 고르기: 유성 → 혜성 순서로 받아요
  while (b.stars.choice) b.chooseFall(["meteor", "comet", "meteor_shower", "star_veil"]);
  const has = (op: string) => (x: BCard) => cardDef(x.cardId).effects.some((o) => o.op === op);
  for (let round = 0; round < 10 && b.result === "ongoing"; round++) {
    // 이번 마력으로 낼 카드를 예전 규칙대로 고르고
    let mana = b.mana;
    const chosen: BCard[] = [];
    const pool = b.hand.filter((c) => b.canPlay(c).ok);
    for (let guard = 0; guard < 60; guard++) {
      const playable = pool.filter((c) => !chosen.includes(c) && b.cardCost(c) <= mana);
      if (!playable.length) break;
      const c = playable.find(has("damage")) ?? rng.pick(playable);
      chosen.push(c);
      mana -= b.cardCost(c);
      if (has("draw")(c)) break; // 뽑기는 새 카드를 보여 주니 여기서 끊고 다시 골라요
    }
    if (!chosen.length) return;
    // 방어 → 그 밖 순서로 줄에 놓아요
    chosen.sort((x, y) => Number(has("block")(y)) - Number(has("block")(x)));
    for (const c of chosen) {
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
}

export interface AutoBattleResult {
  battle: Battle;
  events: BattleEvent[];
}

/** 시드 i로 런을 만들고 인카운터 하나를 끝까지(최대 40턴) 자동으로 싸워요. 같은 i면 항상 같은 결과예요. */
export function autoBattle(enemies: string[], i: number, party?: string[]): AutoBattleResult {
  const frontId = party?.[0] ?? "glass_salamander";
  const run = new Run({ seed: 1000 + i, frontId, party, adult: false, unlockAll: false });
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
