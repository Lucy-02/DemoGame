import { describe, expect, it } from "vitest";
import { Battle } from "../src/core/battle";
import { ENCOUNTERS } from "../src/core/data";
import { Rng } from "../src/core/rng";
import { Run } from "../src/core/run";
import { autoPlayTurn } from "./autoplay";
import { smartPlayTurn } from "./bot";
import { CLONED_FIELDS, cloneBattle } from "./clone";

const start = (enemies: string[], i: number, party?: string[]) => {
  const run = new Run({ seed: 1000 + i, frontId: party?.[0] ?? "glass_salamander", party, adult: true, unlockAll: true });
  const pick = new Rng(i);
  for (const c of run.rollCards(6, { common: 1, advanced: 1, rare: 1 })) run.addCard(c.id, pick.pick(run.learnersOf(c.id)).id);
  return new Battle(run.spirits, run.deck, enemies, run.frontId, new Rng(i * 7 + 3));
};
const finish = (b: Battle, bot: typeof autoPlayTurn) => {
  const out: string[] = [];
  while (b.result === "ongoing" && b.turn < 40) {
    bot(b, b.rng);
    if (b.result === "ongoing") b.endTurn();
    out.push(...b.drain().map((e) => JSON.stringify(e)));
  }
  return out.join("\n");
};

describe("전투 복제", () => {
  it("Battle의 데이터 필드를 모두 알아요 (필드가 늘면 clone.ts를 고쳐요)", () => {
    const b = start(["grimbark"], 0);
    const data = Object.entries(b).filter(([, v]) => typeof v !== "function").map(([k]) => k);
    expect(data.filter((k) => !CLONED_FIELDS.includes(k))).toEqual([]);
  });

  it("복제한 전투는 원본과 똑같이 끝나요", () => {
    const parties = [undefined, ["star_spirit", "magma_ibex", "pearl_oyster"], ["prism_chameleon", "fire_fox", "mist_cat"]];
    for (const party of parties) for (const enc of ENCOUNTERS) for (const bot of [autoPlayTurn, smartPlayTurn]) {
      const b = start(enc.enemies, 1, party);
      for (let t = 0; t < 3 && b.result === "ongoing"; t++) { bot(b, b.rng); if (b.result === "ongoing") b.endTurn(); }
      b.drain();
      const copy = cloneBattle(b);
      expect(finish(copy, bot)).toBe(finish(b, bot));
    }
  });
});
