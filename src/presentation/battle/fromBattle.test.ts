// 전투 화면 VM: core 전투 상태 → 화면 값
import { describe, expect, it } from "vitest";
import { Run } from "../../core/run";
import { BattleSession } from "../../session/battle";
import { battleVM, cardUid } from "./fromBattle";

const run = () => new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
const enemies = () => run().pickEncounter("battle").enemies;

describe("전투 화면 VM", () => {
  it("아군 · 적 · 손패가 전투 상태와 맞아요", () => {
    const s = new BattleSession(run(), enemies());
    const b = s.battle;
    const vm = battleVM(b);
    expect(vm.allies.map((a) => a.face)).toEqual(b.spirits.map((x) => x.id));
    expect(vm.allies.find((a) => a.front)?.face).toBe(b.frontId);
    expect(vm.enemies).toHaveLength(b.aliveEnemies().length);
    const keys = vm.hand.flatMap((g) => g.cards.map((c) => cardUid(c.key)));
    expect(keys.sort()).toEqual(b.hand.map((c) => c.uid).sort());
    expect(vm.mana.n).toBe(b.mana);
    // 낼 수 있는 카드만 plays에 있어요
    for (const c of b.hand) expect(!!vm.plays[`c${c.uid}`]).toBe(b.canPlay(c).ok);
  });
});
