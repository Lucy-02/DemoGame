// 게임 세션: 정원 ↔ 판 연결과 칸 사이 저장 (아키텍처 0001 PR 2)
import { describe, expect, it } from "vitest";
import { C, CARDS, GROWTH } from "../core/data";
import { joinOffer, newGarden } from "../core/garden";
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

  it("혼자 떠난 첫 판은 정한 층을 마치면 둘째 정령이 깃들어 바로 합류해요 (0156)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    const first = run.party[0];
    const deck = run.run.deck.length;
    // 정한 층 전까지는 깃들 때가 아니에요
    for (let f = 1; f <= C.run_pool.join_floor; f++) {
      expect(game.midJoinDue).toBe(false);
      run.enter(run.run.reachable()[0].id);
      if (run.phase.kind === "battle") {
        game.finishBattle(outcome(run, true));
        run.finishReward();
      } else run.leave();
    }
    expect(run.run.current!.floor).toBe(C.run_pool.join_floor);
    expect(game.midJoinDue).toBe(true);
    game.beginMidJoin();
    const offer = joinOffer(game.garden.state);
    expect(offer).toHaveLength(2);
    game.garden.dispatch({ kind: "join", id: offer[0] });
    expect(game.joinMidRun()).toBe(true);
    expect(run.party).toEqual([first, offer[0]]);
    expect(run.run.deck.length).toBeGreaterThan(deck);
    expect(run.run.receivedBy(offer[0])).toEqual([]);
    expect(game.midJoinDue).toBe(false);
    expect(game.joinMidRun()).toBe(false);
    // 판이 끝나도 더 깃들지 않아요
    game.abandonRun();
    expect(game.garden.state.spirits).toHaveLength(2);
    expect(game.joinPending).toBe(false);
  });

  it("판은 정원의 정령으로 떠나고, 이긴 전투의 경험은 판 안에만 쌓여요 (0157)", async () => {
    const store = new MemoryStore();
    const game = await GameSession.load(store, seeds);
    const run = game.startRun();
    const id = game.garden.state.spirits[0].id;
    expect(run.party).toEqual([id]);
    run.enter(run.run.reachable()[0].id);
    expect(run.phase.kind).toBe("battle");
    game.finishBattle(outcome(run, true));
    expect(run.phase.kind).toBe("reward");
    expect(run.run.spirits[0].exp).toBe(GROWTH.exp.normal);
    // 보상 창의 정령 줄이 읽는 자란 몫
    expect(run.phase.kind === "reward" && run.phase.reward.growth?.[id]).toMatchObject({ expBefore: 0, expAfter: GROWTH.exp.normal });
    await game.flush();
    expect(Object.keys(JSON.parse(store.data.get(SAVE_KEYS.garden)!).spirits[0]).sort()).toEqual(["id", "personality"]);
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

  it("판이 끝나면 레벨 · 단계 · 장비는 남지 않고, 다음 판은 다시 유체 Lv 1이에요 (0157 · 0159)", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds);
    const id = game.garden.state.spirits[0].id;
    const run = game.startRun();
    run.run.giveEquipment("bone_sword", id);
    run.enter(run.run.reachable()[0].id);
    game.finishBattle(outcome(run, true));
    run.finishReward();
    game.abandonRun();
    expect(game.lastRun?.run.spirits[0]).toMatchObject({ exp: GROWTH.exp.normal, equipment: [{ id: "bone_sword", resonance: 1 }] });
    expect(game.startRun().run.spirits[0]).toMatchObject({ stage: "baby", level: 1, exp: 0, equipment: [] });
  });

  it("완주하면 출전한 정령의 성격이 열리고, 다음 판부터 다시 뽑기를 받아요 (0157)", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds, { acts: 1 });
    const id = game.garden.state.spirits[0].id;
    const run = game.startRun();
    expect(run.run.rerolls).toBe(0);
    const personality = run.run.spirits[0].personality;
    // 보스까지 가요
    for (let guard = 0; guard < 20 && run.phase.kind !== "over"; guard++) {
      if (run.phase.kind === "map") run.enter(run.run.reachable()[0].id);
      else if (run.phase.kind === "battle") game.finishBattle(outcome(run, true));
      else if (run.phase.kind === "reward") run.finishReward();
      else run.leave();
    }
    expect(game.lastRun?.victory).toBe(true);
    expect(game.garden.state.spirits.find((x) => x.id === id)?.cleared).toEqual([personality]);
    expect(game.startRun().run.rerolls).toBe(1);
  });

  it("지도 차례에 키울 수 있는 정령을 알려 주고, 미루면 다음 지도 차례에 다시 알려요 (0157)", async () => {
    const game = await GameSession.load(new MemoryStore(), seeds);
    const run = game.startRun();
    const id = run.party[0];
    expect(run.growDue()).toEqual([]);
    // 성체 문 레벨까지 올리고 갈래 카드를 받아요
    while (run.run.spirit(id).level < 4) run.run.grantBattle("boss");
    const evo = run.run.evolveChoices(id)[0].evo;
    const cards = CARDS.filter((c) => c.spirit === id && c.branch === evo.branch).slice(0, evo.opens?.cards ?? 0);
    for (const c of cards) run.run.addCard(c.id, id);
    expect(run.growDue()).toEqual([id]);
    run.deferGrow(id);
    expect(run.growDue()).toEqual([]);
    run.enter(run.run.reachable()[0].id);
    expect(run.growDue()).toEqual([]);
    expect(() => run.evolve(id, evo.branch)).toThrow();
    game.finishBattle(outcome(run, true));
    run.finishReward();
    expect(run.growDue()).toEqual([id]);
    expect(run.evolve(id, evo.branch)).toBe(true);
    expect(run.run.spirit(id)).toMatchObject({ stage: "adult", branch: evo.branch });
    expect(run.growDue()).toEqual([]);
    // 키운 것은 바로 저장돼요
    await game.flush();
    const again = await GameSession.load((game as unknown as { store: MemoryStore }).store, seeds);
    expect(again.run?.run.spirit(id).stage).toBe("adult");
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
    expect(b.run!.run.spirits[0].exp).toBe(GROWTH.exp.normal);
  });

  it("시험 판은 저장도 정원도 건드리지 않아요", () => {
    const game = GameSession.trial({ party: ["fire_fox", "mist_cat"], frontId: "fire_fox", adult: true, unlockAll: false }, seeds);
    const run = game.startRun();
    expect(run.party).toEqual(["fire_fox", "mist_cat"]);
    run.enter(run.run.reachable()[0].id);
    const before = game.garden.state;
    game.finishBattle(outcome(run, true));
    game.abandonRun();
    expect(game.garden.state).toBe(before);
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

  it("탐험 포기는 패배와 같아요: 판이 닫혀요 (0084)", async () => {
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

  it("데모의 정령은 시작 풀 넷이고, 깃들기는 두 번이에요", () => {
    // 시작 풀이나 깃드는 때가 늘면 데모 범위를 따로 묶어야 해요
    expect(C.start_pool).toHaveLength(4);
    expect(C.party_size).toBe(3);
  });
});
