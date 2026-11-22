// 판 세션: 한 판(Run)과 지금 있는 자리(phase)를 들고, 화면이 보내는 명령으로 판을 진행해요 (아키텍처 0001 PR 2).
// getRun/setRun 전역을 대신해요. 저장은 칸 사이에서만 해요: 칸에 들어간 직후(전투는 편성을 뽑은 뒤)와 칸을 마친 뒤.
// 전투 중간에 끄면 그 전투 처음부터 이어요 (0047). 같은 저장이면 같은 드로우예요 (0052).
import { returnHp } from "../core/stats";
import { RUN_SAVE_VERSION, Run, type BattleReward, type MapNode, type RunOptions, type RunSave } from "../core/run";
import { GROWTH } from "../core/data";
import type { BattleTier } from "../core/growth";
import type { DeedTally } from "./deeds";
import { upgradeGarden } from "./garden";
import { upgradeSave, type SaveStep } from "./migrate";

/** 옛 판 저장을 올리는 함수 (버전 n → n + 1) */
const RUN_STEPS: Readonly<Record<number, SaveStep>> = {
  /**
   * 1 → 2 (0157 · 0159): 성장이 판 안으로 들어왔어요. 정령은 그때의 단계 · 레벨 그대로 잇고, 경험은 그 레벨의 문턱에서 시작해요.
   * 뒤 막 출발(출발 묶음)과 남긴 장비 표시는 없어졌어요. 지닌 장비는 지금 공명 그대로 이 판에서만 써요.
   */
  1: (old) => {
    const file = structuredClone(old) as { version: number; run: Record<string, unknown>; phase: unknown };
    const run = file.run;
    const spirits = (run.spirits as Record<string, unknown>[]).map((s) => ({
      ...s,
      exp: GROWTH.levels[Math.min(GROWTH.levels.length, Math.max(1, Number(s.level) || 1)) - 1],
      deed: 0,
      equipment: ((s.equipment ?? []) as { id: string; resonance: number; runBonus?: number }[]).map((e) => ({ id: e.id, resonance: e.resonance + (e.runBonus ?? 0) })),
    }));
    const { bundleLeft: _b, ...rest } = run;
    const { startAct: _s, garden, ...opts } = run.opts as Record<string, unknown>;
    // 떠날 때의 정원도 같이 올려요
    return { ...file, version: 2, run: { ...rest, version: 2, opts: { ...opts, ...(garden ? { garden: upgradeGarden(garden) } : {}) }, spirits, rerolls: 0 } };
  },
};

/** 판 안에서 지금 있는 자리 */
export type RunPhase =
  /** 지도에서 다음 칸을 고를 차례 */
  | { kind: "map" }
  /** 전투 칸에 들어왔어요. 편성은 들어올 때 뽑아 둬요 */
  | { kind: "battle"; tier: BattleTier; enemies: string[]; /** 첫 판의 첫 전투 (고정 편성, 처음 한 번 짚어 줘요 0088) */ first?: true }
  /** 이벤트 칸. 이벤트는 들어올 때 뽑아 둬요 (이어하기에도 같은 이벤트) */
  | { kind: "event"; eventId?: string }
  | { kind: "shop" }
  | { kind: "rest" }
  /** 이긴 전투의 보상을 고르는 중. 골드와 경험은 이미 들어갔어요 */
  | { kind: "reward"; reward: BattleReward }
  /** 판이 끝났어요 (보스를 이기거나 모두 쓰러짐) */
  | { kind: "over"; victory: boolean };

/** 전투가 끝났을 때 정령마다 남은 상태 */
export interface BattleOutcome {
  won: boolean;
  spirits: { id: string; hp: number; downed: boolean }[];
  /** 이 전투에서 센 자람 조건 (0021 · 0045). 이긴 전투만 쌓여요 */
  deeds?: DeedTally;
}

export interface RunSaveFile {
  version: number;
  run: RunSave;
  phase: RunPhase;
}

/** 이긴 전투 하나 (GameSession이 정원에 알려요: 첫 보스의 깃들기) */
export interface BattleWin {
  party: string[];
  tier: BattleTier;
}

export class RunSession {
  private listeners = new Set<() => void>();

  /** 이번 지도 차례에 키우기를 미룬 정령 (0157). 칸에 들어가면 지워져서 다음 지도 차례에 다시 물어요. 저장하지 않아요 */
  private deferred = new Set<string>();

  private constructor(readonly run: Run, private _phase: RunPhase) {}

  static start(opts: RunOptions): RunSession {
    return new RunSession(new Run(opts), { kind: "map" });
  }

  get phase(): RunPhase {
    return this._phase;
  }

  /** 출전한 정령 id (파티 순서) */
  get party(): string[] {
    return this.run.spirits.map((s) => s.id);
  }

  /** 상태가 바뀌어 저장할 때가 됐어요 (칸 사이) */
  onSave(f: () => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  private set(phase: RunPhase) {
    this._phase = phase;
    for (const f of this.listeners) f();
  }

  private expect<K extends RunPhase["kind"]>(...kinds: K[]): Extract<RunPhase, { kind: K }> {
    if (!kinds.includes(this._phase.kind as K)) throw new Error(`지금(${this._phase.kind})은 할 수 없어요`);
    return this._phase as Extract<RunPhase, { kind: K }>;
  }

  /** 지도에서 칸 하나에 들어가요. 전투면 편성을 여기서 뽑아요 */
  enter(nodeId: string): RunPhase {
    this.expect("map");
    const node = this.run.reachable().find((n) => n.id === nodeId);
    if (!node) throw new Error(`갈 수 없는 칸: ${nodeId}`);
    this.run.enter(node);
    this.deferred.clear();
    this.set(phaseOf(this.run, node));
    return this._phase;
  }

  /** 지도 차례에 지금 키울 수 있는 정령 (0157). 이번 차례에 미룬 정령은 빠져요 */
  growDue(): string[] {
    return this._phase.kind === "map" ? this.run.evolvable().filter((id) => !this.deferred.has(id)) : [];
  }

  /** 키우기 (지도 차례에만). 갈래 고르기면 고른 갈래를 줘요. 키웠으면 저장하고 true */
  evolve(spiritId: string, branch?: string): boolean {
    this.expect("map");
    if (!this.run.evolve(spiritId, branch)) return false;
    this.set(this._phase);
    return true;
  }

  /** 이 정령의 키우기를 다음 지도 차례로 미뤄요 */
  deferGrow(spiritId: string) {
    this.deferred.add(spiritId);
  }

  /** 상점·이벤트·휴식을 마치고 지도로 */
  leave() {
    this.expect("shop", "event", "rest");
    this.set({ kind: "map" });
  }

  /**
   * 전투가 끝났어요. 쓰러진 정령은 돌아오는 HP로 일어나요.
   * 이기면 출전한 정령이 경험과 자람 조건을 받고(0157) BattleWin을 돌려줘요. 보스를 이기거나 지면 판이 끝나요.
   */
  finishBattle(outcome: BattleOutcome): BattleWin | undefined {
    const { tier } = this.expect("battle");
    for (const s of outcome.spirits) {
      const rs = this.run.spirit(s.id);
      rs.hp = s.downed ? returnHp(rs) : s.hp;
    }
    if (!outcome.won) {
      this.set({ kind: "over", victory: false });
      return undefined;
    }
    const win: BattleWin = { party: this.party, tier };
    // 보상을 굴리기 전에 자라요: 이 전투로 열린 카드가 바로 보상에 나올 수 있어요
    const growth = this.run.grantBattle(tier, outcome.deeds);
    if (tier === "boss" && this.run.hasNextAct()) {
      // 막 사이: 정예와 같은 보상을 받고 다음 막 지도로 가요
      const reward = this.run.rollBattleReward("elite");
      this.run.nextAct();
      this.set({ kind: "reward", reward: { ...reward, growth } });
    } else if (tier === "boss") {
      this.run.bossDefeated = true;
      this.set({ kind: "over", victory: true });
    } else {
      this.set({ kind: "reward", reward: { ...this.run.rollBattleReward(tier === "elite" ? "elite" : "battle"), growth } });
    }
    return win;
  }

  /** 탐험 포기: 어느 자리에서든 판을 패배로 끝내요 (0084 5번). 그 칸에서 하던 일은 버려요 */
  abandon() {
    if (this._phase.kind === "over") throw new Error("이미 끝난 판이에요");
    this.set({ kind: "over", victory: false });
  }

  /** 보상을 다 고르고 지도로 */
  finishReward() {
    this.expect("reward");
    this.set({ kind: "map" });
  }

  save(): RunSaveFile {
    return { version: RUN_SAVE_VERSION, run: this.run.save(), phase: structuredClone(this._phase) };
  }

  static restore(raw: unknown): RunSession {
    const file = upgradeSave(raw, RUN_SAVE_VERSION, RUN_STEPS, "판") as unknown as RunSaveFile;
    if (typeof file.phase?.kind !== "string") throw new Error("판 저장에 자리가 없어요");
    return new RunSession(Run.load(file.run), structuredClone(file.phase));
  }
}

function phaseOf(run: Run, node: MapNode): RunPhase {
  switch (node.type) {
    case "battle":
    case "elite":
    case "boss": {
      const enc = run.pickEncounter(node.type);
      return { kind: "battle", tier: node.type === "battle" ? "normal" : node.type, enemies: enc.enemies, ...(enc.pool === "first" ? { first: true as const } : {}) };
    }
    case "event": return { kind: "event", eventId: run.pickEvent().id };
    case "shop": return { kind: "shop" };
    case "rest": return { kind: "rest" };
  }
}
