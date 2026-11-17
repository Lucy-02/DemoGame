import { describe, expect, it } from "vitest";
import type { BattleEvent } from "../../core/battle";
import { cueOf, cuesOf, playbackCues } from "./battleCues";

const enemy = { side: "e", uid: 1 } as const;
const dmg = (amount: number, blocked = 0, extra: Partial<Extract<BattleEvent, { k: "damage" }>> = {}): BattleEvent => ({ k: "damage", ref: enemy, amount, blocked, ...extra });

describe("전투 소리", () => {
  it("타격은 세 무게로 갈려요", () => {
    expect(cueOf(dmg(6))).toBe("hit.medium");
    expect(cueOf(dmg(6, 0, { crit: true }))).toBe("hit.heavy");
    expect(cueOf(dmg(6, 0, { weakHit: true }))).toBe("hit.heavy");
    expect(cueOf(dmg(2, 0, { resist: true }))).toBe("hit.light");
    expect(cueOf(dmg(1, 5))).toBe("hit.light");
  });

  it("방어가 다 받아 내면 방어 소리, 아무 일도 없으면 소리 없음", () => {
    expect(cueOf(dmg(0, 4))).toBe("block");
    expect(cueOf(dmg(0, 0))).toBeUndefined();
  });

  it("브레이크와 차징", () => {
    expect(cueOf({ k: "cancel", uid: 1, reason: "break" })).toBe("break");
    expect(cueOf({ k: "charge", uid: 1, move: "x" })).toBe("charge");
  });

  it("해방 · 쓰러짐 · 회복은 제 소리가 있어요", () => {
    expect(cueOf({ k: "release", id: "a" })).toBe("release");
    expect(cueOf({ k: "downed", id: "a" })).toBe("down.ally");
    expect(cueOf({ k: "enemyDead", uid: 1 })).toBe("down.enemy");
    expect(cueOf({ k: "heal", ref: enemy, amount: 3 })).toBe("heal");
  });

  it("한 묶음에서 같은 소리는 한 번만", () => {
    expect(cuesOf([dmg(3), dmg(3), { k: "block", ref: enemy, amount: 2 }])).toEqual(["hit.medium", "block"]);
  });

  it("재생 장면과 같은 자리에서 끊어요", () => {
    const events: BattleEvent[] = [
      { k: "spiritAct", id: "a", card: "c" }, dmg(3),
      { k: "enemyAct", uid: 1, move: "m" }, { k: "block", ref: enemy, amount: 2 },
    ];
    expect(playbackCues(events)).toEqual([[], ["hit.medium"], ["block"]]);
    expect(playbackCues([dmg(3)])).toEqual([[]]);
  });
});
