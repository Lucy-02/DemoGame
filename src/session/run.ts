// 판 세션: 한 판(Run)과 지금 있는 자리(phase)를 들고, 화면이 보내는 명령으로 판을 진행해요 (아키텍처 0001 PR 2).
// getRun/setRun 전역을 대신해요. 저장은 칸 사이에서만 해요: 칸에 들어간 직후(전투는 편성을 뽑은 뒤)와 칸을 마친 뒤.
// 전투 중간에 끄면 그 전투 처음부터 이어요 (0047). 같은 저장이면 같은 드로우예요 (0052).
import { returnHp } from "../core/stats";
import { RUN_SAVE_VERSION, Run, type BattleReward, type MapNode, type RunOptions, type RunSave } from "../core/run";
import type { BattleTier } from "../core/garden";

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
  /** 이긴 전투의 보상을 고르는 중. 골드와 정원 경험은 이미 들어갔어요 */
  | { kind: "reward"; reward: BattleReward }
  /** 판이 끝났어요 (보스를 이기거나 모두 쓰러짐) */
  | { kind: "over"; victory: boolean };

/** 전투가 끝났을 때 정령마다 남은 상태 */
export interface BattleOutcome {
  won: boolean;
  spirits: { id: string; hp: number; downed: boolean }[];
}

export interface RunSaveFile {
  version: number;
  run: RunSave;
  phase: RunPhase;
}

/** 이긴 전투가 정원에 남기는 것 (GameSession이 정원에 넘겨요) */
export interface BattleWin {
  party: string[];
  tier: BattleTier;
}

export class RunSession {
  private listeners = new Set<() => void>();

  private constructor(readonly run: Run, private _phase: RunPhase) {}

  static start(opts: RunOptions): RunSession {
    const run = new Run(opts);
    // 뒤 막에서 출발한 판은 출발 묶음의 첫 보상부터 골라요 (0108)
    const reward = run.rollBundleReward();
    return new RunSession(run, reward ? { kind: "reward", reward } : { kind: "map" });
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
    this.set(phaseOf(this.run, node));
    return this._phase;
  }

  /** 상점·이벤트·휴식을 마치고 지도로 */
  leave() {
    this.expect("shop", "event", "rest");
    this.set({ kind: "map" });
  }

  /**
   * 전투가 끝났어요. 쓰러진 정령은 돌아오는 HP로 일어나요.
   * 이기면 BattleWin을 돌려줘요(정원에 경험·재료). 보스를 이기거나 지면 판이 끝나요.
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
    const win = { party: this.party, tier };
    if (tier === "boss" && this.run.hasNextAct()) {
      // 막 사이: 정예와 같은 보상을 받고 다음 막 지도로 가요
      const reward = this.run.rollBattleReward("elite");
      this.run.nextAct();
      this.set({ kind: "reward", reward });
    } else if (tier === "boss") {
      this.run.bossDefeated = true;
      this.set({ kind: "over", victory: true });
    } else {
      this.set({ kind: "reward", reward: this.run.rollBattleReward(tier === "elite" ? "elite" : "battle") });
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
    // 출발 묶음이 남았으면 다음 보상으로 이어져요 (0108)
    const reward = this.run.rollBundleReward();
    this.set(reward ? { kind: "reward", reward } : { kind: "map" });
  }

  save(): RunSaveFile {
    return { version: RUN_SAVE_VERSION, run: this.run.save(), phase: structuredClone(this._phase) };
  }

  static restore(file: RunSaveFile): RunSession {
    if (file.version !== RUN_SAVE_VERSION) throw new Error(`판 저장 형식이 달라요: ${file.version}`);
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
