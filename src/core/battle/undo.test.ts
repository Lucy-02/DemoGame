// 놓은 카드 되돌리기 (0074 7번): 마지막에 놓은 카드만, 거꾸로 하나씩. 새 정보를 연 놓기와 그 앞은 되돌릴 수 없어요
import { describe, expect, it } from "vitest";
import { ENCOUNTERS } from "../data";
import { Rng } from "../rng";
import { Run } from "../run";
import { Battle } from "./battle";

const start = (enemies: string[], party = ["fire_fox", "mist_cat", "glass_salamander"], seed = 7) => {
  const run = new Run({ seed, frontId: party[0], adult: true, unlockAll: true, party });
  const b = new Battle(run.spirits, run.battleDeck(), enemies, run.frontId, new Rng(seed));
  b.keepUndo = true;
  b.drain();
  return { b, run };
};

/** 되돌리기가 돌려놓아야 하는 것 전부 (판의 정령은 빼요) */
const shot = (b: Battle) => JSON.stringify(
  Object.entries(b).filter(([k, v]) => !["events", "undos", "rng"].includes(k) && typeof v !== "function"),
  (k, v) => (k === "run" || k === "def" ? undefined : v instanceof Map ? [...v] : v),
);

const placeOne = (b: Battle, n: number) => {
  const c = b.hand.filter((x) => b.canPlay(x).ok)[n % Math.max(1, b.hand.filter((x) => b.canPlay(x).ok).length)];
  if (!c) return false;
  const need = b.needsTarget(c);
  return b.play(c.uid, need === "enemy" ? { side: "e", uid: b.aliveEnemies()[0].uid } : need === "ally" ? { side: "s", id: b.frontId } : undefined);
};

describe("놓은 카드 되돌리기", () => {
  it("되돌리면 놓기 직전과 똑같아요: 모든 조우 × 3턴, 거꾸로 하나씩", () => {
    const bad: string[] = [];
    let undone = 0;
    for (const party of [undefined, ["star_spirit", "magma_ibex", "pearl_oyster"], ["prism_chameleon", "fire_fox", "mist_cat"]]) {
      for (const enc of ENCOUNTERS) {
        const { b } = start(enc.enemies, party);
        for (let turn = 0; turn < 3 && b.result === "ongoing"; turn++) {
          if (b.stars.choice) b.chooseFall(b.stars.choice.options.slice(0, b.stars.choice.picks));
          const shots: string[] = [];
          for (let n = 0; n < 6; n++) {
            const was = shot(b), rng = b.rng.state;
            if (!placeOne(b, turn + n)) break;
            // 되돌릴 수 없는 놓기면 그 앞도 못 돌아가요
            if (!b.canUndo()) shots.length = 0;
            else {
              shots.push(was);
              if (b.rng.state !== rng) bad.push(`${enc.id} ${turn}턴: 난수를 쓴 놓기를 되돌릴 수 있어요`);
            }
          }
          while (shots.length) {
            const want = shots.pop()!;
            if (!b.undo()) bad.push(`${enc.id} ${turn}턴: 되돌리지 못함`);
            else if (shot(b) !== want) bad.push(`${enc.id} ${turn}턴: 되돌린 뒤 상태가 달라요`);
            undone++;
          }
          expect(b.canUndo()).toBe(false);
          for (let n = 0; n < 6 && placeOne(b, n); n++);
          b.endTurn();
          if (b.holdChoice) b.confirmHold([]);
          expect(b.canUndo()).toBe(false);
          b.drain();
        }
      }
    }
    expect(bad).toEqual([]);
    expect(undone).toBeGreaterThan(ENCOUNTERS.length);
  });

  it("되돌린 카드는 손패로, 마력도 돌아오고 판의 정령과 이어진 채예요. 해방도 되돌려요", () => {
    const { b, run } = start(["moss_slime"]);
    run.spirit("fire_fox").stage = "awakened";
    const mana = b.mana, hand = b.hand.map((c) => c.uid);
    expect(placeOne(b, 0)).toBe(true);
    expect(b.release("fire_fox")).toBe(true);
    expect(b.planned.length).toBe(2);
    expect(b.undo()).toBe(true);
    expect(b.spirit("fire_fox").releaseUsed).toBe(false);
    expect(b.undo()).toBe(true);
    expect(b.undo()).toBe(false);
    expect(b.mana).toBe(mana);
    expect(b.hand.map((c) => c.uid)).toEqual(hand);
    expect(b.planned).toEqual([]);
    for (const s of b.spirits) expect(s.run).toBe(run.spirit(s.id));
  });

  it("켜지 않으면 기록하지 않아요 (봇 · 시뮬레이션)", () => {
    const { b } = start(["moss_slime"]);
    b.keepUndo = false;
    expect(placeOne(b, 0)).toBe(true);
    expect(b.canUndo()).toBe(false);
  });
});
