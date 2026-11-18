// 턴 재생 장면: 실제 전투의 턴 종료 이벤트를 턴 종료 직전 화면에 입혀요
import { describe, expect, it } from "vitest";
import { Run } from "../../core/run";
import { BattleSession } from "../../session/battle";
import { battleVM, cardUid } from "./fromBattle";
import { opensStep, playbackCues } from "../audio/battleCues";
import { playbackFrames } from "./playback";

function turn(seed: number, plays: number) {
  const run = new Run({ seed, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
  const s = new BattleSession(run, run.pickEncounter("battle").enemies);
  for (let i = 0; i < plays; i++) {
    const vm = battleVM(s.battle);
    const key = Object.keys(vm.plays)[0];
    if (!key) break;
    const enemy = s.battle.aliveEnemies()[0];
    s.dispatch({ kind: "play", uid: cardUid(key), target: vm.plays[key].target.kind === "pick" ? { side: "e", uid: enemy.uid } : undefined });
  }
  const before = battleVM(s.battle);
  const cast = { allies: s.battle.spirits.map((x) => x.id), enemies: s.battle.enemies.filter((e) => !e.dead).map((e) => e.uid) };
  const events = s.dispatch({ kind: "endTurn" });
  return { s, before, frames: playbackFrames(before, cast, events), events };
}

describe("턴 재생", () => {
  it("행동 하나마다 한 장면: 첫 장면은 재생 시작, 마지막 장면에는 모두 지나가요", () => {
    const { before, frames, events } = turn(7, 2);
    const acts = events.filter((e, i) => opensStep(events, i)).length;
    expect(frames).toHaveLength(acts + 1);
    expect(frames[0].order.playing).toBe(true);
    expect((frames[0].order.bundles ?? []).flat().some((t) => t.past)).toBe(false);
    const last = frames[frames.length - 1];
    expect((last.order.bundles ?? []).flat().every((t) => t.past)).toBe(true);
    expect(last.order.slots.every((x) => x.state === "past" || x.cut === "done")).toBe(true);
    // 턴 종료 직전 화면은 그대로예요
    expect(before.order.playing).toBeUndefined();
  });

  it("재생 중에는 카드를 낼 수 없고, 지금 차례는 지나가지 않은 첫 적 행동이에요", () => {
    const { frames } = turn(7, 1);
    for (const f of frames) {
      expect(f.plays).toEqual({});
      const open = f.order.slots.filter((x) => x.state !== "past" && x.cut !== "done");
      expect(f.order.slots.filter((x) => x.state === "now")).toEqual(open.slice(0, 1));
    }
  });

  it("턴 끝 효과(화상)는 마지막 행동에 붙지 않고 행동자 없는 걸음으로 따로 보여요", () => {
    const run = new Run({ seed: 7, frontId: "fire_fox", adult: false, unlockAll: false, party: ["fire_fox", "mist_cat", "glass_salamander"] });
    const s = new BattleSession(run, ["moss_slime"]);
    s.battle.addStatus(s.battle.enemies[0], "burn", 6);
    const before = battleVM(s.battle);
    const events = s.dispatch({ kind: "endTurn" });
    const frames = playbackFrames(before, { allies: s.battle.spirits.map((x) => x.id), enemies: [s.battle.enemies[0].uid] }, events);
    const end = events.findIndex((e) => e.k === "turnEnd");
    const burn = events.slice(end).find((e) => e.k === "damage" && e.ref.side === "e");
    expect(burn).toBeDefined();
    const last = frames[frames.length - 1];
    expect(last.acted?.actor).toBeUndefined();
    expect(last.acted?.pops).toEqual([{ ref: { side: "enemy", i: 0 }, kind: "damage", n: burn && burn.k === "damage" ? burn.amount : 0 }]);
    // 앞 걸음(적 행동)에는 화상 알약이 없어요
    for (const f of frames.slice(0, -1)) expect(f.acted?.pops.filter((p) => p.ref.side === "enemy") ?? []).toEqual([]);
    // 소리도 같은 자리에서 끊어요
    expect(playbackCues(events)).toHaveLength(frames.length);
  });

  it("걸음마다 바뀐 유닛의 바뀌기 전 값을 남겨요: 결과는 맞는 때에 바뀌어 보여요", () => {
    const { frames } = turn(7, 2);
    let seen = 0;
    frames.forEach((f, k) => {
      for (const w of f.acted?.was ?? []) {
        const prev = frames[k - 1], unit = (vm: typeof f) => (w.ref.side === "ally" ? vm.allies : vm.enemies)[w.ref.i];
        expect({ hp: w.hp, block: w.block }).toEqual({ hp: unit(prev).hp, block: unit(prev).block });
        seen++;
      }
    });
    expect(seen).toBeGreaterThan(0);
  });

  it("마지막 장면의 HP는 확정된 전투 상태와 같아요 (턴 끝 효과가 없을 때)", () => {
    const { s, frames, events } = turn(7, 2);
    const last = frames[frames.length - 1];
    const lastAct = events.map((e) => e.k).lastIndexOf("enemyAct");
    const after = events.slice(lastAct).filter((e) => e.k === "damage" || e.k === "heal");
    // 마지막 행동 뒤(턴 끝 · 다음 턴 시작)에 HP가 바뀌지 않았을 때만 견줘요
    if (after.length === 0) expect(last.allies.map((a) => a.hp)).toEqual(s.battle.spirits.map((x) => x.hp));
  });
});
