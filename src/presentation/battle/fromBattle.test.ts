// 전투 화면 VM: core 전투 상태 → 화면 값
import { describe, expect, it } from "vitest";
import { ENCOUNTERS } from "../../core/data";
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

  it("받을 피해 미리보기는 실제로 맞는 값과 같아요 (무작위 대상 제외)", () => {
    const bad: string[] = [];
    for (const enc of ENCOUNTERS) {
      const b = new BattleSession(run(), enc.enemies).battle;
      for (let turn = 1; turn <= 6 && b.result === "ongoing"; turn++) {
        // 아군이 여럿일 때의 무작위 공격은 누가 맞을지 몰라요
        const random = b.aliveSpirits().length > 1
          && b.aliveEnemies().some((e) => b.moveQueue(e).some((q) => q.move.actions.some((a) => (a.type === "attack" || a.type === "attackRamp") && a.target === "random")));
        const want = Object.fromEntries(battleVM(b).allies.map((a) => [a.face, a.incoming ?? 0]));
        // 실제 타격마다 그 순간의 피해 계산 값을 모아요 (카드는 놓지 않고 턴만 넘겨요)
        const got: Record<string, number> = {};
        const hit = b.enemyHit.bind(b);
        b.enemyHit = (e, s, base, pierce) => {
          got[s.id] = (got[s.id] ?? 0) + b.enemyDmgPreview(e, base, s);
          hit(e, s, base, pierce);
        };
        b.endTurn();
        if (b.holdChoice) b.confirmHold([]);
        b.drain();
        b.enemyHit = hit;
        if (random) continue;
        for (const [id, n] of Object.entries(want)) if ((got[id] ?? 0) !== n) bad.push(`${enc.id} ${turn}턴 ${id}: 미리보기 ${n}, 실제 ${got[id] ?? 0}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
