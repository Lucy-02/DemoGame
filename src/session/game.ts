// 게임 세션: 정원 하나와 진행 중인 판 하나를 묶고, 둘을 저장소에 남겨요.
// 정원 ↔ 판 연결은 여기서만 해요: 판을 떠날 때 정원의 정령으로(toRunSpirit, 늘 유체 Lv1), 첫 보스의 깃들기(grantBattle),
// 판이 끝나면 판 수와 완주로 연 성격(endRun). 성장과 장비는 판 안에서 끝나요 (0157 · 0159). 저장은 platform의 문자열 저장만 써요 (아키텍처 0001).
import { GardenSession } from "./garden";
import { RunSession, type BattleOutcome, type BattleWin } from "./run";
import { C } from "../core/data";
import { defaultFront, toRunSpirit, type Garden } from "../core/garden";
import { Rng } from "../core/rng";
import type { Run, RunOptions } from "../core/run";
import type { Element } from "../core/types";

/** 끝난 판 하나 (판 결과 화면, 0046). before = 떠날 때의 정원, after = 판을 닫은 뒤의 정원 */
export interface RunRecord {
  run: Run;
  victory: boolean;
  before: Garden;
  after: Garden;
}

/** platform 저장 가운데 세션이 쓰는 것만 */
export interface SaveStore {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** 덮어쓰기 직전 저장 (없는 저장소는 안 둬도 돼요) */
  readBackup?(key: string): Promise<string | null>;
  /** 못 읽는 저장을 옆에 치워 둬요 */
  setAside?(key: string): Promise<void>;
}

/**
 * 켤 때 저장을 못 읽어서 한 일 (P8-01). 플레이어에게 어떻게 보일지는 아직 안 정했어요(Lucy 확인).
 * garden: backup = 직전 저장으로 되돌림, reset = 새 정원으로 시작. run: dropped = 진행 중이던 판을 버림.
 */
export interface SaveRecovery {
  garden?: "backup" | "reset";
  run?: "dropped";
}

export const SAVE_KEYS = { garden: "garden", run: "run", runLog: "runlog" } as const;

/**
 * 끝난 판 한 줄 (플레이테스트용 로컬 기록, docs/release/PLAYTEST.md). 이 기계의 저장 폴더에만 남고 어디로도 보내지 않아요.
 * 어느 막 · 어느 층에서 어떻게 끝났는지만 적어요.
 */
export interface RunLogEntry {
  /** 끝난 시각 (ISO) */
  at: string;
  seed: number;
  party: string[];
  /** 끝난 막과 층 (지도에 들어서기 전이면 0층) */
  act: number;
  floor: number;
  /** 들어간 전투 칸 수 */
  fights: number;
  end: "victory" | "defeat" | "abandon";
  /** 이 판이 가는 마지막 막 (데모는 2) */
  lastAct: number;
}

/** 기록은 최근 이만큼만 남겨요 */
const RUN_LOG_MAX = 200;

/** 판의 범위. 데모 빌드는 막 수를 묶어요 (0101) */
export interface GameScope {
  /** 몇 막까지 가는지. 없으면 constants.acts_enabled */
  acts?: number;
  /** 시험용(개발 빌드의 ?grown): 정령이 각성체로 떠나요. 화면 봇이 지는 판을 거듭하지 않고 막을 넘길 때 써요 */
  grown?: boolean;
}

/** 데모 범위 (0101): constants.demo.acts막까지. 게임이 여는 막(acts_enabled)을 넘지 않아요 */
export const demoScope = (): GameScope => ({ acts: Math.min(C.demo.acts, C.acts_enabled) });

/** 정원 없이 도는 시험 판(?screen=legacy). 저장하지 않고 정원에 아무것도 남기지 않아요 */
export type TrialOptions = Omit<RunOptions, "seed" | "garden">;

export class GameSession {
  private _run?: RunSession;
  private _last?: RunRecord;
  /** 마지막으로 남긴 판 저장 (메인으로 나갔다 올 때 그 칸의 처음으로 되돌려요) */
  private runText?: string;
  private writes: Promise<void> = Promise.resolve();
  /** 켤 때 저장을 복구했으면 무엇을 했는지 */
  recovery: SaveRecovery = {};
  /** 저장을 못 읽거나 못 썼을 때 알릴 곳 (오류 기록) */
  private report: (text: string) => void = () => {};

  private constructor(
    readonly garden: GardenSession,
    private store: SaveStore | undefined,
    private newSeed: () => number,
    private trialOpts?: TrialOptions,
    private scope: GameScope = {},
  ) {
    garden.onChange(() => this.write(SAVE_KEYS.garden, garden.snapshot()));
  }

  /**
   * 저장을 읽어요. 정원이 없으면 새로 하기의 정원을 만들어 바로 남겨요 (0053).
   * 못 읽는 저장이 있어도 게임은 켜져요: 정원은 직전 저장 → 새 정원 순으로, 판은 버려요. 못 읽은 파일은 옆에 치워 두고 report로 알려요.
   */
  static async load(store: SaveStore, newSeed: () => number = randomSeed, scope: GameScope = {}, report: (text: string) => void = () => {}): Promise<GameSession> {
    const recovery: SaveRecovery = {};
    const failed = (what: string, e: unknown) => report(`${what} ${e instanceof Error ? e.message : String(e)}`);
    const gardenText = await store.read(SAVE_KEYS.garden);
    let garden: GardenSession | undefined;
    if (gardenText) {
      try {
        garden = GardenSession.restore(gardenText);
      } catch (e) {
        failed("정원 저장을 못 읽었어요.", e);
        try {
          const backup = await store.readBackup?.(SAVE_KEYS.garden);
          if (backup) garden = GardenSession.restore(backup);
        } catch (e2) {
          failed("정원 직전 저장도 못 읽었어요.", e2);
        }
        recovery.garden = garden ? "backup" : "reset";
        // 다음 쓰기가 못 읽는 파일을 직전 저장 자리에 덮지 않게 먼저 치워요
        await store.setAside?.(SAVE_KEYS.garden);
      }
    }
    const rewrite = !garden || recovery.garden !== undefined;
    garden ??= GardenSession.fresh(newSeed());
    const game = new GameSession(garden, store, newSeed, undefined, scope);
    game.recovery = recovery;
    game.report = report;
    if (rewrite) game.write(SAVE_KEYS.garden, garden.snapshot());
    const runText = await store.read(SAVE_KEYS.run);
    if (runText) {
      try {
        const run = RunSession.restore(JSON.parse(runText));
        // 새 정원으로 시작했거나 되돌린 정원에 없는 정령이 나간 판은 잇지 않아요
        const owned = run.run.spirits.every((s) => garden.state.spirits.some((x) => x.id === s.id));
        if (recovery.garden === "reset" || !owned) throw new Error("정원과 맞지 않는 판이에요");
        game.attach(run);
        game.runText = runText;
      } catch (e) {
        failed("판 저장을 못 읽었어요.", e);
        recovery.run = "dropped";
        if (store.setAside) await store.setAside(SAVE_KEYS.run);
        else await store.remove(SAVE_KEYS.run);
      }
    }
    return game;
  }

  static trial(opts: TrialOptions, newSeed: () => number = randomSeed): GameSession {
    return new GameSession(GardenSession.fresh(newSeed()), undefined, newSeed, opts);
  }

  /** 마지막으로 끝난 판 (판 결과 화면이 그려요) */
  get lastRun(): RunRecord | undefined {
    return this._last;
  }

  /** 진행 중인 판 (없으면 undefined) */
  get run(): RunSession | undefined {
    return this._run;
  }

  /**
   * 떠나기 전에 정하는 다음 판 (출전 준비, 0076 14): 시드, 오늘 센 기운, 가진 정령 모두, 기본 앞열(지난 판의 앞열).
   * 센 기운은 판을 만들기 전에 보여 줘야 해서 여기서 굴려 판에 넘겨요.
   */
  planRun(): RunPlan {
    const g = this.garden.state;
    const seed = this.newSeed();
    const party = g.spirits.slice(0, C.party_size).map((s) => s.id);
    const strongElement = new Rng(seed ^ STRONG_SALT).pick(C.acts[0].elements as Element[]);
    return { seed, strongElement, party, front: defaultFront(g) };
  }

  /** 정원의 정령으로 새 판을 떠나요. plan(출전 준비)이 없으면 지금 계획으로, 앞열을 주면 그 정령이 앞열이에요 */
  startRun(plan?: RunPlan, front?: string): RunSession {
    if (this._run) throw new Error("이미 진행 중인 판이 있어요");
    let opts: RunOptions;
    if (this.trialOpts) opts = { ...this.trialOpts, seed: this.newSeed() };
    else {
      const p = plan ?? this.planRun();
      const frontId = front && p.party.includes(front) ? front : p.front;
      if (frontId !== this.garden.state.front) this.garden.dispatch({ kind: "setFront", id: frontId });
      // 정령이 하나뿐인 판(첫 판)은 출전 준비 없이 떠나고 센 기운도 판이 굴려요
      opts = { seed: p.seed, garden: this.garden.state, frontId, adult: !!this.scope.grown, ...(this.scope.grown ? { awakened: true } : {}), unlockAll: false, ...(plan ? { strongElement: p.strongElement } : {}), ...(this.scope.acts ? { acts: this.scope.acts } : {}) };
    }
    const run = RunSession.start(opts);
    this.attach(run);
    this.saveRun();
    return run;
  }

  /** 판 끝에 고를 깃들기가 남았나 (0076 9: 미루지 않아요) */
  get joinPending(): boolean {
    return (this.garden.state.joins ?? 0) > 0;
  }

  /**
   * 첫 판 가운데의 깃들기를 고를 때인가 (0156): 혼자 떠난 첫 판이 1막의 정한 층(run_pool.join_floor)을 마치고 지도로 돌아왔어요.
   * 화면은 이때 beginMidJoin → 깃들기 고르기 → joinMidRun 순서로 불러요
   */
  get midJoinDue(): boolean {
    const run = this._run;
    if (!run || this.trialOpts || run.phase.kind !== "map" || !run.run.firstRun || run.run.act !== 1) return false;
    return run.run.spirits.length === 1 && this.garden.state.spirits.length === 1 && (run.run.current?.floor ?? 0) >= C.run_pool.join_floor;
  }

  /** 첫 판 가운데의 깃들기를 정원에 걸어요. 고르기는 판 끝의 깃들기와 같은 화면이에요 (0156) */
  beginMidJoin() {
    if (this.midJoinDue) this.garden.dispatch({ kind: "grantMidJoin" });
  }

  /**
   * 첫 판 가운데 깃든 정령을 지금 판에 합류시켜요 (0156). 정원에는 있고 판에는 없는 둘째 정령이 들어와요.
   * 고르는 도중에 껐다 켜도 이어하기에서 여기로 와서 합류해요. 합류했으면 true
   */
  joinMidRun(): boolean {
    const run = this._run;
    if (!run || this.trialOpts || !run.run.firstRun || run.run.spirits.length !== 1) return false;
    const mate = this.garden.state.spirits.find((s) => !run.party.includes(s.id));
    if (!mate) return false;
    run.run.addSpirit(toRunSpirit(mate));
    this.saveRun();
    return true;
  }

  /**
   * 전투가 끝났어요. 이겼으면 출전한 정령이 판 안에서 경험과 자람 조건을 받아요 (0157). 정원에는 첫 보스의 깃들기만 알려요.
   * 보스를 이기거나 지면 판이 그 자리에서 닫혀요. 끝난 판은 run.phase가 over인 채로 돌려받아 결과를 그려요.
   */
  finishBattle(outcome: BattleOutcome): BattleWin | undefined {
    const run = this.need();
    const win = run.finishBattle(outcome);
    if (win && !this.trialOpts) this.garden.dispatch({ kind: "grantBattle", tier: win.tier });
    if (run.phase.kind === "over") this.close(run);
    return win;
  }

  /**
   * 탐험 포기 (0084 5번): 패배와 같아요. 판이 그 자리에서 닫혀요.
   * 끝난 판은 lastRun으로 결과를 그려요.
   */
  abandonRun() {
    const run = this.need();
    run.abandon();
    this.close(run, true);
  }

  /**
   * 메인으로 나가요 (0084 6번): 판을 마지막 저장(그 칸에 들어온 때)으로 되돌려요.
   * 다시 이으면 그 칸의 처음부터예요. 전투는 같은 시드로 처음부터 다시 해요. 끈 뒤 다시 켠 것과 같아요.
   */
  suspendRun() {
    if (!this._run || !this.runText) return;
    this.attach(RunSession.restore(JSON.parse(this.runText)));
  }

  /**
   * 판을 닫고 정원으로 돌아가요. 판 수가 오르고, 완주했으면 출전한 정령마다 그 판의 성격이 열려요 (0157).
   * 레벨 · 단계 · 장비는 남지 않아요 (0157 · 0159).
   */
  private close(run: RunSession, abandoned = false) {
    const before = run.run.opts.garden ?? this.garden.state;
    const victory = run.phase.kind === "over" && run.phase.victory;
    if (!this.trialOpts) this.garden.dispatch({ kind: "endRun", done: { party: run.run.spirits.map((s) => ({ id: s.id, personality: s.personality })), victory } });
    this._last = { run: run.run, victory, before, after: this.garden.state };
    if (!this.trialOpts) this.logRun({ at: new Date().toISOString(), seed: run.run.opts.seed, party: run.party, act: run.run.act, floor: run.run.current?.floor ?? 0, fights: run.run.fights, end: victory ? "victory" : abandoned ? "abandon" : "defeat", lastAct: run.run.lastAct });
    this._run = undefined;
    this.runText = undefined;
    if (this.store) this.queue(() => this.store!.remove(SAVE_KEYS.run));
  }

  /** 기다리는 저장이 모두 끝나면 풀려요 (시험·종료 전) */
  flush(): Promise<void> {
    return this.writes;
  }

  private need(): RunSession {
    if (!this._run) throw new Error("진행 중인 판이 없어요");
    return this._run;
  }

  private attach(run: RunSession) {
    this._run = run;
    run.onSave(() => this.saveRun());
  }

  private saveRun() {
    const run = this._run;
    // 끝난 판은 남기지 않아요. close가 지워요
    if (!run || run.phase.kind === "over") return;
    this.runText = JSON.stringify(run.save());
    this.write(SAVE_KEYS.run, this.runText);
  }

  private write(key: string, text: string) {
    if (this.store) this.queue(() => this.store!.write(key, text));
  }

  /** 끝난 판을 기록 끝에 덧붙여요. 기록이 깨져 있으면 새로 시작해요 */
  private logRun(entry: RunLogEntry) {
    const store = this.store;
    if (!store) return;
    this.queue(async () => {
      let log: RunLogEntry[] = [];
      try {
        const parsed: unknown = JSON.parse((await store.read(SAVE_KEYS.runLog)) ?? "[]");
        if (Array.isArray(parsed)) log = parsed as RunLogEntry[];
      } catch {
        // 깨진 기록은 버려요
      }
      await store.write(SAVE_KEYS.runLog, JSON.stringify([...log, entry].slice(-RUN_LOG_MAX)));
    });
  }

  /** 저장은 부른 순서대로 하나씩 해요 */
  private queue(job: () => Promise<void>) {
    this.writes = this.writes.then(job).catch((e) => {
      console.error("저장 실패", e);
      this.report(`저장에 실패했어요. ${e instanceof Error ? e.message : String(e)}`);
    });
  }
}

/** 출전 준비의 다음 판 */
export interface RunPlan {
  seed: number;
  strongElement: Element;
  party: string[];
  front: string;
}

const STRONG_SALT = 0x5e7a;

const randomSeed = () => Math.floor(Math.random() * 1e9);
