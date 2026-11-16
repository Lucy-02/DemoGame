// 게임 세션: 정원 ↔ 판 연결과 칸 사이 저장 (아키텍처 0001 PR 2)
import { describe, expect, it } from "vitest";
import { GROWTH } from "../core/data";
import { GameSession, SAVE_KEYS, type SaveStore } from "./game";
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
});
