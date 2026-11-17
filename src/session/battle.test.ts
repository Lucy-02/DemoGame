// 전투 세션: 판의 전투 칸에서 core 전투를 열고 명령을 받아요
import { describe, expect, it } from "vitest";
import { Run } from "../core/run";
import { BattleSession } from "./battle";

const run = () => new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
const enemies = () => run().pickEncounter("battle").enemies;

describe("전투 세션", () => {
  it("카드를 내면 손패에서 빠지고 마력이 줄어요", () => {
    const s = new BattleSession(run(), enemies());
    const b = s.battle;
    const c = b.hand.find((x) => b.canPlay(x).ok)!;
    const mana = b.mana;
    const target = b.needsTarget(c) === "enemy" ? { side: "e" as const, uid: b.aliveEnemies()[0].uid } : undefined;
    s.dispatch({ kind: "play", uid: c.uid, target });
    expect(b.hand.includes(c)).toBe(false);
    expect(b.mana).toBe(mana - b.cardCost(c));
  });

  it("턴 종료를 반복하면 끝나고, 결과를 판에 넘길 모양으로 줘요", () => {
    const s = new BattleSession(run(), enemies());
    for (let i = 0; i < 60 && !s.over; i++) {
      for (const c of [...s.battle.hand]) {
        if (!s.battle.canPlay(c).ok) continue;
        const e = s.battle.aliveEnemies()[0];
        s.dispatch({ kind: "play", uid: c.uid, target: s.battle.needsTarget(c) === "enemy" && e ? { side: "e", uid: e.uid } : s.battle.needsTarget(c) === "ally" ? { side: "s", id: c.owner } : undefined });
      }
      s.dispatch({ kind: "endTurn" });
    }
    expect(s.over).toBe(true);
    expect(s.outcome().spirits.map((x) => x.id)).toEqual(["fire_fox", "mist_cat", "glass_salamander"]);
  });
});

