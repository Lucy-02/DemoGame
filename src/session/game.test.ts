// 게임 세션: 정원 ↔ 판 연결과 칸 사이 저장 (아키텍처 0001 PR 2)
import { describe, expect, it } from "vitest";
import { C, GROWTH } from "../core/data";
import { deepStartOpen, joinOffer, newGarden } from "../core/garden";
import { GameSession, SAVE_KEYS, demoScope, type SaveStore } from "./game";
import type { RunSession } from "./run";

class MemoryStore implements SaveStore {
  data = new Map<string, string>();
  async read(k: string) { return this.data.get(k) ?? null; }
  async write(k: string, t: string) { this.data.set(k, t); }
  async remove(k: string) { this.data.delete(k); }
}

let seed = 100;
const seeds = () => seed++;

const outcome = (run: RunSession, won: boolean) => ({ won, spirits: run.run.spirits.map((s) => ({ id: s.id, hp: won ? s.hp : 0, downed: !won })) });
describe("게임 세션", () => {
  it("저장이 없으면 새로 하기의 정원(정령 하나)을 만들어 남겨요", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    await game.flush();
    expect(game.garden.state.spirits).toHaveLength(1);
    expect(game.run).toBeUndefined();
    expect(JSON.parse(store.data.get(SAVE_KEYS.garden)!).spirits).toHaveLength(1);
  });

  it("판은 정원의 정령으로 떠나고, 이긴 전투는 정원에 경험·재료를 남겨요", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    const id = game.garden.state.spirits[0].id;
    expect(run.party).toEqual([id]);
    run.enter(run.run.reachable()[0].id);
    expect(run.phase.kind).toBe("battle");
    game.finishBattle(outcome(run, true));
    expect(run.phase.kind).toBe("reward");
    expect(game.garden.state.spirits[0].exp).toBe(GROWTH.exp.normal);
    expect(game.garden.state.material).toBe(GROWTH.material.normal);
    await game.flush();
    expect(JSON.parse(store.data.get(SAVE_KEYS.garden)!).material).toBe(GROWTH.material.normal);
  });

  it("지면 판이 닫혀요: 판 수가 오르고 판 저장이 지워져요", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    run.enter(run.run.reachable()[0].id);
    await game.flush();
    expect(store.data.has(SAVE_KEYS.run)).toBe(true);
    game.finishBattle(outcome(run, false));
    expect(run.phase).toEqual({ kind: "over", victory: false });
    expect(game.run).toBeUndefined();
    expect(game.garden.state.runs).toBe(1);
    await game.flush();
    expect(store.data.has(SAVE_KEYS.run)).toBe(false);
    // 끝난 판 뒤에 새 판을 떠날 수 있어요
    expect(() => game.startRun()).not.toThrow();
  });

  it("판이 끝나면 지닌 장비가 정원에 남고 다음 판에도 지녀요 (0056)", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds);
    const id = game.garden.state.spirits[0].id;
    const lose = () => {
      const run = game.startRun();
      const had = run.run.spirits[0].equipment.length;
      if (!had) run.run.giveEquipment("bone_sword", id);
      run.enter(run.run.reachable()[0].id);
      game.finishBattle(outcome(run, false));
    };
    lose();
    expect(game.garden.state.spirits[0].equipment).toEqual([{ id: "bone_sword", resonance: 1 }]);
    lose();
    expect(game.garden.state.spirits[0].equipment?.[0].id).toBe("bone_sword");
  });

  it("다시 켜면 같은 자리, 같은 드로우로 이어요 (0047 · 0052)", async () => {
    const store = new MemoryStore();
    const a = await GameSession.load(store, seeds);
    const run = a.startRun();
    // 1층은 늘 전투예요. 이기고 보상을 고른 뒤 다음 칸에 들어간 직후 꺼요
    run.enter(run.run.reachable()[0].id);
    a.finishBattle(outcome(run, true));
    run.finishReward();
    const next = run.run.reachable()[0];
    run.enter(next.id);
    await a.flush();

    const b = await GameSession.load(store, seeds);
    const back = b.run!;
    expect(back.phase).toEqual(run.phase);
    expect(back.run.visited).toEqual(run.run.visited);
    expect(back.run.gold).toBe(run.run.gold);
    expect(back.run.deck).toEqual(run.run.deck);
    // 같은 난수 자리: 둘이 다음에 뽑는 수가 같아요
    expect(back.run.rng.int(0, 1e9)).toBe(run.run.rng.int(0, 1e9));
    expect(back.run.rollBattleReward("battle")).toEqual(run.run.rollBattleReward("battle"));
  });

  it("보상을 고르는 중에 꺼도 경험은 한 번만 받아요", async () => {
    const store = new MemoryStore();
    const a = await GameSession.load(store, seeds);
    const run = a.startRun();
    run.enter(run.run.reachable()[0].id);
    a.finishBattle(outcome(run, true));
    await a.flush();
    const b = await GameSession.load(store, seeds);
    expect(b.run!.phase.kind).toBe("reward");
    expect(b.garden.state.spirits[0].exp).toBe(GROWTH.exp.normal);
  });

  it("시험 판은 저장도 정원도 건드리지 않아요", () => {
    const game = GameSession.trial({ party: ["fire_fox", "mist_cat"], frontId: "fire_fox", adult: true, unlockAll: false }, seeds);
    const run = game.startRun();
    expect(run.party).toEqual(["fire_fox", "mist_cat"]);
    run.enter(run.run.reachable()[0].id);
    game.finishBattle(outcome(run, true));
    expect(game.garden.state.material).toBe(0);
  });

  it("출전 준비: 센 기운과 앞열을 정하고 떠나면 앞열이 다음 판 기본값으로 남아요 (0076 14)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    // 첫 판을 끝내고 하나를 골라 둘이 돼요
    const first = game.startRun();
    first.enter(first.run.reachable()[0].id);
    game.finishBattle(outcome(first, false));
    expect(game.joinPending).toBe(true);
    const pick = joinOffer(game.garden.state)[0];
    game.garden.dispatch({ kind: "join", id: pick });
    expect(game.joinPending).toBe(false);
    const plan = game.planRun();
    expect(plan.party).toHaveLength(2);
    expect(plan.front).toBe(game.garden.state.spirits[0].id);
    const run = game.startRun(plan, pick);
    expect(run.run.frontId).toBe(pick);
    expect(run.run.strongElement).toBe(plan.strongElement);
    expect(game.garden.state.front).toBe(pick);
    expect(game.planRun().front).toBe(pick);
  });

  it("끝난 판마다 어디서 어떻게 끝났는지 이 기계에만 기록해요 (플레이테스트용)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const first = game.startRun();
    first.enter(first.run.reachable()[0].id);
    game.finishBattle(outcome(first, false));
    game.startRun();
    game.abandonRun();
    await game.flush();
    const log = JSON.parse(store.data.get(SAVE_KEYS.runLog)!);
    expect(log.map((e: { end: string; act: number; floor: number; fights: number }) => [e.end, e.act, e.floor, e.fights])).toEqual([["defeat", 1, 1, 1], ["abandon", 1, 0, 0]]);
    expect(log[0].party).toEqual(first.party);
    // 깨진 기록은 버리고 새로 시작해요
    store.data.set(SAVE_KEYS.runLog, "{깨짐");
    game.startRun();
    game.abandonRun();
    await game.flush();
    expect(JSON.parse(store.data.get(SAVE_KEYS.runLog)!)).toHaveLength(1);
  });

  it("탐험 포기는 패배와 같아요: 판이 닫히고 이긴 전투의 경험은 남아요 (0084)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    run.enter(run.run.reachable()[0].id);
    game.finishBattle(outcome(run, true));
    run.finishReward();
    game.abandonRun();
    expect(run.phase).toEqual({ kind: "over", victory: false });
    expect(game.run).toBeUndefined();
    expect(game.lastRun?.victory).toBe(false);
    expect(game.garden.state.runs).toBe(1);
    expect(game.garden.state.spirits[0].exp).toBe(GROWTH.exp.normal);
    await game.flush();
    expect(store.data.has(SAVE_KEYS.run)).toBe(false);
  });

  it("메인으로 나갔다 오면 그 칸의 처음부터예요: 전투가 같은 시드로 다시 열려요 (0084)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    run.enter(run.run.reachable()[0].id);
    const rng = run.run.rng.state;
    // 전투를 열면 판의 난수가 하나 나가요
    run.run.rng.int(0, 1e9);
    game.suspendRun();
    const back = game.run!;
    expect(back).not.toBe(run);
    expect(back.phase).toEqual(run.phase);
    expect(back.run.rng.state).toEqual(rng);
    // 되돌린 판도 칸 사이에 저장해요
    game.finishBattle(outcome(back, true));
    await game.flush();
    expect(JSON.parse(store.data.get(SAVE_KEYS.run)!).phase.kind).toBe("reward");
  });
});

describe("데모 범위 (0101)", () => {
  it("데모 판은 constants.demo.acts막까지만 가요", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds, demoScope());
    expect(game.startRun().run.lastAct).toBe(Math.min(C.demo.acts, C.acts_enabled));
  });

  it("범위를 안 주면 게임이 여는 막까지 가요", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds);
    expect(game.startRun().run.lastAct).toBe(C.acts_enabled);
  });

  it("데모에서는 성체 정원도 뒤 막에서 출발하지 않아요", async () => {
    const grown = { ...newGarden(1), spirits: newGarden(1).spirits.map((sp) => ({ ...sp, stage: "adult" as const })) };
    const party = grown.spirits.map((sp) => sp.id);
    expect(deepStartOpen(grown, party)).toBe(true);
    const store = new MemoryStore();
    await store.write(SAVE_KEYS.garden, JSON.stringify(grown));
    expect((await GameSession.load(store, seeds)).planRun(true).startAct).toBe(C.deep_start.act);
    expect((await GameSession.load(store, seeds, demoScope())).planRun(true).startAct).toBeUndefined();
  });

  it("데모의 정령은 시작 풀 넷이고, 깃들기는 두 번이에요", () => {
    // 시작 풀이나 깃드는 때가 늘면 데모 범위를 따로 묶어야 해요
    expect(C.start_pool).toHaveLength(4);
    expect(C.party_size).toBe(3);
  });
});
