// 저장 읽기: 옛 저장 고정 파일과 깨진 저장 복구 (P8-01)
// saves/*-v1.json · *-v2.json은 그 버전 때 실제로 쓴 저장이에요. 고치지 않아요. 이 테스트가 깨지면 플레이어의 저장도 깨지는 것이니,
// 버전을 올리고 migrate.ts의 올리기 함수를 더해요.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GROWTH } from "../core/data";
import { GameSession, SAVE_KEYS, type SaveStore } from "./game";
import { GardenSession } from "./garden";
import { upgradeSave } from "./migrate";
import { RunSession } from "./run";

/** garden-v1.json을 지금 버전으로 올린 모양 */
const UPGRADED_GARDEN = { version: 2, act1Boss: false, seed: 7, runs: 0, joins: 0, spirits: [{ id: "glass_salamander", personality: "sturdy" }], front: "glass_salamander" };

const fixture = (name: string) => readFileSync(new URL(`./saves/${name}.json`, import.meta.url), "utf8");

class FileLikeStore implements SaveStore {
  data = new Map<string, string>();
  backup = new Map<string, string>();
  aside = new Map<string, string>();
  async read(k: string) { return this.data.get(k) ?? null; }
  async write(k: string, t: string) {
    const old = this.data.get(k);
    if (old !== undefined) this.backup.set(k, old);
    this.data.set(k, t);
  }
  async remove(k: string) { this.data.delete(k); }
  async readBackup(k: string) { return this.backup.get(k) ?? null; }
  async setAside(k: string) {
    const t = this.data.get(k);
    if (t !== undefined) this.aside.set(k, t);
    this.data.delete(k);
  }
}

const seeds = () => 500;

async function load(store: SaveStore) {
  const reports: string[] = [];
  const game = await GameSession.load(store, seeds, {}, (t) => reports.push(t));
  await game.flush();
  return { game, reports };
}

describe("저장 읽기", () => {
  it("버전 1 저장(정원 + 전투 칸에 들어간 판)을 올려서 이어요 (0157 · 0159: 성장과 장비는 판 안으로)", async () => {
    const store = new FileLikeStore();
    store.data.set(SAVE_KEYS.garden, fixture("garden-v1"));
    store.data.set(SAVE_KEYS.run, fixture("run-v1"));
    const { game, reports } = await load(store);
    expect(reports).toEqual([]);
    expect(game.recovery).toEqual({});
    // 정원에는 줄과 성격만 남아요
    expect(game.garden.state).toEqual(UPGRADED_GARDEN);
    // 판의 정령은 그때의 단계 · 레벨 그대로, 경험은 그 레벨의 문턱에서 이어요
    expect(game.run?.phase.kind).toBe("battle");
    expect(game.run?.run.spirits).toEqual([{ id: "glass_salamander", hp: 32, maxHpBonus: 0, stage: "baby", exp: 0, level: 1, deed: 0, personality: "sturdy", equipment: [] }]);
    expect(game.run?.run.rerolls).toBe(0);
    expect(game.run?.run.opts.garden).toEqual(UPGRADED_GARDEN);
  });

  it("버전 1의 자란 정원 · 남긴 장비 · 뒤 막 출발은 버리고, 지닌 장비는 지금 공명 그대로 이어요", () => {
    const old = JSON.parse(fixture("garden-v1"));
    old.material = 9;
    old.spirits[0] = { ...old.spirits[0], exp: 500, stage: "adult", branch: "hold", openBranches: ["hold"], equipment: [{ id: "bone_sword", resonance: 2 }], resonanceTokens: 1 };
    expect(GardenSession.restore(JSON.stringify(old)).state).toEqual(UPGRADED_GARDEN);
    const run = JSON.parse(fixture("run-v1"));
    run.run.opts.startAct = 3;
    run.run.bundleLeft = { battle: 2, elite: 1 };
    run.run.spirits[0] = { ...run.run.spirits[0], stage: "adult", level: 4, branch: "hold", equipment: [{ id: "bone_sword", resonance: 1, from: "kept", runBonus: 1 }] };
    const back = RunSession.restore(run);
    expect(back.run.spirits[0]).toMatchObject({ stage: "adult", level: 4, exp: GROWTH.levels[3], deed: 0, branch: "hold", equipment: [{ id: "bone_sword", resonance: 2 }] });
    expect(back.save().run).not.toHaveProperty("bundleLeft");
    expect(back.run.opts).not.toHaveProperty("startAct");
  });

  it("버전 2 저장(완주한 줄이 있는 정원 + 조금 자란 판)을 그대로 이어요", async () => {
    const store = new FileLikeStore();
    store.data.set(SAVE_KEYS.garden, fixture("garden-v2"));
    store.data.set(SAVE_KEYS.run, fixture("run-v2"));
    const { game, reports } = await load(store);
    expect(reports).toEqual([]);
    expect(game.recovery).toEqual({});
    expect(game.garden.state).toEqual(JSON.parse(fixture("garden-v2")));
    expect(game.run?.phase.kind).toBe("battle");
    expect(game.run?.run.spirits[0]).toMatchObject({ stage: "baby", exp: 10, equipment: [{ id: "bone_sword", resonance: 1 }] });
    expect(game.run?.run.rerolls).toBe(1);
    expect(game.run?.save()).toEqual(JSON.parse(fixture("run-v2")));
  });

  it("판 저장이 잘렸으면 판만 버리고 정원은 그대로 켜요", async () => {
    const store = new FileLikeStore();
    store.data.set(SAVE_KEYS.garden, fixture("garden-v1"));
    store.data.set(SAVE_KEYS.run, fixture("run-v1").slice(0, 200));
    const { game, reports } = await load(store);
    expect(game.recovery).toEqual({ run: "dropped" });
    expect(game.run).toBeUndefined();
    expect(store.data.has(SAVE_KEYS.run)).toBe(false);
    expect(store.aside.get(SAVE_KEYS.run)).toHaveLength(200);
    expect(reports).toHaveLength(1);
    expect(() => game.startRun()).not.toThrow();
  });

  it.each([
    ["잘린 글", fixture("garden-v1").slice(0, 40)],
    ["모르는 버전", JSON.stringify({ ...JSON.parse(fixture("garden-v1")), version: 0 })],
    ["정령 목록이 없음", JSON.stringify({ version: 1 })],
    ["객체가 아님", "[]"],
  ])("정원 저장을 못 읽으면(%s) 직전 저장으로 되돌려요", async (_name, broken) => {
    const store = new FileLikeStore();
    store.data.set(SAVE_KEYS.garden, broken);
    store.backup.set(SAVE_KEYS.garden, fixture("garden-v1"));
    store.data.set(SAVE_KEYS.run, fixture("run-v1"));
    const { game, reports } = await load(store);
    expect(game.recovery).toEqual({ garden: "backup" });
    expect(reports).toHaveLength(1);
    expect(store.aside.get(SAVE_KEYS.garden)).toBe(broken);
    // 되돌린 정원을 다시 남기고, 못 읽는 파일은 직전 저장 자리에 들어가지 않아요
    expect(JSON.parse(store.data.get(SAVE_KEYS.garden)!)).toEqual(UPGRADED_GARDEN);
    expect(store.backup.get(SAVE_KEYS.garden)).toBe(fixture("garden-v1"));
    // 같은 정령으로 떠난 판은 이어요
    expect(game.run?.phase.kind).toBe("battle");
  });

  it("직전 저장도 없으면 새 정원으로 켜고 진행 중이던 판은 버려요", async () => {
    const store = new FileLikeStore();
    store.data.set(SAVE_KEYS.garden, "{");
    store.data.set(SAVE_KEYS.run, fixture("run-v1"));
    const { game } = await load(store);
    expect(game.recovery).toEqual({ garden: "reset", run: "dropped" });
    expect(game.garden.state.spirits).toHaveLength(1);
    expect(game.run).toBeUndefined();
    expect(store.aside.get(SAVE_KEYS.garden)).toBe("{");
    expect(JSON.parse(store.data.get(SAVE_KEYS.garden)!).spirits).toHaveLength(1);
  });

  it("옛 버전은 한 단계씩 올리고, 길이 없거나 더 새 버전이면 던져요", () => {
    const steps = { 1: (s: Record<string, unknown>) => ({ ...s, version: 2, b: 1 }), 2: (s: Record<string, unknown>) => ({ ...s, version: 3, c: 1 }) };
    expect(upgradeSave({ version: 1, a: 1 }, 3, steps, "시험")).toEqual({ version: 3, a: 1, b: 1, c: 1 });
    expect(() => upgradeSave({ version: 4 }, 3, steps, "시험")).toThrow(/형식이 달라요: 4/);
    expect(() => upgradeSave({ version: 0 }, 3, steps, "시험")).toThrow(/형식이 달라요: 0/);
    expect(() => upgradeSave(null, 3, steps, "시험")).toThrow(/모양이 아니에요/);
  });
});
