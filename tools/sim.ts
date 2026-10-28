// 헤드리스 전투 시뮬레이터: 단순 AI로 인카운터별 승률과 평균 턴을 봐요.
// 사용: npm run sim -- [반복 수]
import { Battle } from "../src/core/battle";
import { ENCOUNTERS, cardDef } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { Run } from "../src/core/run";

const N = Number(process.argv[2] ?? 200);

function autoPlay(b: Battle, rng: Rng) {
  for (let guard = 0; guard < 60 && b.result === "ongoing"; guard++) {
    const playable = b.hand.filter((c) => b.canPlay(c).ok);
    if (!playable.length) return;
    // 공격 우선, 그다음 아무거나
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

for (const enc of ENCOUNTERS) {
  let wins = 0, turns = 0, hpLeft = 0, awakens = 0, breaks = 0, cancels = 0;
  for (let i = 0; i < N; i++) {
    const run = new Run({ seed: 1000 + i, frontId: "testu", adult: false, unlockAll: false });
    const rng = new Rng(i * 7 + 3);
    const b = new Battle(run.spirits, run.deck, enc.enemies, run.frontId, rng);
    while (b.result === "ongoing" && b.turn < 40) {
      autoPlay(b, rng);
      for (const e of b.drain()) {
        if (e.k === "awaken") awakens++;
        if (e.k === "break") breaks++;
        if (e.k === "cancel") cancels++;
      }
      if (b.result === "ongoing") b.endTurn();
      for (const e of b.drain()) {
        if (e.k === "awaken") awakens++;
        if (e.k === "break") breaks++;
        if (e.k === "cancel") cancels++;
      }
    }
    if (b.result === "victory") {
      wins++;
      hpLeft += b.spirits.reduce((a, s) => a + s.hp, 0);
    }
    turns += b.turn;
  }
  console.log(
    `${enc.id.padEnd(14)} 승률 ${((wins / N) * 100).toFixed(0).padStart(3)}%  평균 턴 ${(turns / N).toFixed(1).padStart(4)}  ` +
    `승리 시 남은 HP합 ${(wins ? hpLeft / wins : 0).toFixed(0).padStart(3)}/84  각성 ${(awakens / N).toFixed(1)}  브레이크 ${(breaks / N).toFixed(1)}  행동취소 ${(cancels / N).toFixed(1)}`,
  );
}
