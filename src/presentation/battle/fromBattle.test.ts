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

describe("2막 규칙 표시 (0096)", () => {
  const act2 = (enemies: string[]) => new BattleSession(new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"], acts: 2 }), enemies).battle;

  it("방전 칸은 띠 조각으로, 띠에 놓은 카드는 받을 피해에 더해요", () => {
    const b = act2(["spark_bug"]);
    const z = b.zones[0];
    const before = battleVM(b);
    expect(before.order.bands?.[0]).toMatchObject({ dmg: z.dmg, head: true, n: 0 });
    // 띠 안에서 끝나는 카드를 찾아 놓아요
    const c = b.hand.find((x) => b.canPlay(x).ok && b.previewEnd(x) >= z.from && b.previewEnd(x) < z.to);
    if (!c) return;
    const held = before.plays[`c${c.uid}`].slot?.bands ?? [];
    expect(held.reduce((n, x) => n + x.n, 0)).toBe(1);
    const owner = before.allies.findIndex((a) => a.face === c.owner);
    const need = b.needsTarget(c);
    b.play(c.uid, need === "enemy" ? { side: "e", uid: b.enemies[0].uid } : need === "ally" ? { side: "s", id: c.owner } : undefined);
    const after = battleVM(b);
    expect((after.allies[owner].incoming ?? 0) - (before.allies[owner].incoming ?? 0)).toBe(z.dmg);
  });

  it("특성 칩과 땅속: 되돌리기 · 가속은 칩, 땅속인 적은 올라오기 전 카드로 고를 수 없어요", () => {
    const b = act2(["mole", "mirror_shard", "lightning_rod"]);
    expect(battleVM(b).enemies.map((e) => e.traits?.length ?? 0)).toEqual([0, 1, 1]);
    b.endTurn();
    if (b.result !== "ongoing") return;
    const vm = battleVM(b);
    expect(vm.enemies[0].buried).toBe(true);
    const mole = b.enemies[0];
    for (const c of b.hand) {
      const play = vm.plays[`c${c.uid}`];
      if (!play || play.target.kind !== "pick" || play.target.side !== "enemy") continue;
      expect(!!play.target.not?.includes(0)).toBe(b.buriedAt(mole, b.previewEnd(c)));
    }
  });
});
