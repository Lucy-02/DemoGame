// 게임 세션: 정원 하나와 진행 중인 판 하나를 묶고, 둘을 저장소에 남겨요.
// 정원 ↔ 판 연결은 여기서만 해요: 판을 떠날 때 정원의 정령으로(toRunSpirit), 이긴 전투마다 경험·재료(grantBattle),
// 판이 끝나면 판 수와 갈래 조건(endRun · openBranches). 저장은 platform의 문자열 저장만 써요 (아키텍처 0001).
import { GardenSession } from "./garden";
import { RunSession, type BattleOutcome, type BattleWin, type RunSaveFile } from "./run";
import { C } from "../core/data";
import { deepStartOpen, defaultFront, type Garden } from "../core/garden";
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
}

export const SAVE_KEYS = { garden: "garden", run: "run" } as const;

/** 판의 범위. 데모 빌드는 막 수를 묶어요 (0101) */
export interface GameScope {
  /** 몇 막까지 가는지. 없으면 constants.acts_enabled */
  acts?: number;
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

  private constructor(
    readonly garden: GardenSession,
    private store: SaveStore | undefined,
    private newSeed: () => number,
    private trialOpts?: TrialOptions,
    private scope: GameScope = {},
  ) {
    garden.onChange(() => this.write(SAVE_KEYS.garden, garden.snapshot()));
  }

  /** 저장을 읽어요. 정원이 없으면 새로 하기의 정원을 만들어 바로 남겨요 (0053) */
  static async load(store: SaveStore, newSeed: () => number = randomSeed, scope: GameScope = {}): Promise<GameSession> {
    const gardenText = await store.read(SAVE_KEYS.garden);
    const fresh = !gardenText;
    const garden = gardenText ? GardenSession.restore(gardenText) : GardenSession.fresh(newSeed());
    const game = new GameSession(garden, store, newSeed, undefined, scope);
    if (fresh) game.write(SAVE_KEYS.garden, garden.snapshot());
    const runText = await store.read(SAVE_KEYS.run);
    if (runText) {
      game.attach(RunSession.restore(JSON.parse(runText) as RunSaveFile));
      game.runText = runText;
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
  planRun(deep = false): RunPlan {
    const g = this.garden.state;
    const seed = this.newSeed();
    const party = g.spirits.slice(0, C.party_size).map((s) => s.id);
    // 뒤 막에서 출발하면 그 막의 센 기운을 미리 보여 줘요 (0108)
    // 데모처럼 그 막까지 가지 않는 범위에서는 뒤 막 출발이 없어요 (0101)
    const inScope = (this.scope.acts ?? C.acts_enabled) >= C.deep_start.act;
    const startAct = deep && inScope && deepStartOpen(g, party) ? C.deep_start.act : undefined;
    const strongElement = new Rng(seed ^ STRONG_SALT).pick(C.acts[(startAct ?? 1) - 1].elements as Element[]);
    return { seed, strongElement, party, front: defaultFront(g), startAct };
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
      opts = { seed: p.seed, garden: this.garden.state, frontId, adult: false, unlockAll: false, ...(plan ? { strongElement: p.strongElement } : {}), ...(p.startAct ? { startAct: p.startAct } : {}), ...(this.scope.acts ? { acts: this.scope.acts } : {}) };
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
   * 전투가 끝났어요. 이겼으면 출전한 정령이 경험과 자람 조건을, 정원이 재료를 받아요 (져도 이긴 만큼은 남아요).
   * 보스를 이기거나 지면 판이 그 자리에서 닫혀요. 끝난 판은 run.phase가 over인 채로 돌려받아 결과를 그려요.
   */
  finishBattle(outcome: BattleOutcome): BattleWin | undefined {
    const run = this.need();
    const win = run.finishBattle(outcome);
    if (win && !this.trialOpts) {
      this.garden.dispatch({ kind: "grantBattle", party: win.party, tier: win.tier });
      if (win.deeds) this.garden.dispatch({ kind: "deeds", tally: win.deeds });
    }
    if (run.phase.kind === "over") this.close(run);
    return win;
  }

  /**
   * 탐험 포기 (0084 5번): 패배와 같아요. 판이 그 자리에서 닫히고, 이긴 전투의 경험과 지닌 장비는 남아요.
   * 끝난 판은 lastRun으로 결과를 그려요.
   */
  abandonRun() {
    const run = this.need();
    run.abandon();
    this.close(run);
  }

  /**
   * 메인으로 나가요 (0084 6번): 판을 마지막 저장(그 칸에 들어온 때)으로 되돌려요.
   * 다시 이으면 그 칸의 처음부터예요. 전투는 같은 시드로 처음부터 다시 해요. 끈 뒤 다시 켠 것과 같아요.
   */
  suspendRun() {
    if (!this._run || !this.runText) return;
    this.attach(RunSession.restore(JSON.parse(this.runText) as RunSaveFile));
  }

  /**
   * 판을 닫고 정원으로 돌아가요. 판 수가 오르고, 이번 탐험에서 받은 카드로 갈래 조건이 쌓여요.
   * 지닌 장비는 모두 남겨요(0056: 남기는 수 = 지닌 수, 져도 남김). 남길지 고르는 화면은 아직 없어요(OPEN_QUESTIONS).
   */
  private close(run: RunSession) {
    const before = run.run.opts.garden ?? this.garden.state;
    if (!this.trialOpts) {
      const party = run.run.spirits;
      const keep = Object.fromEntries(party.map((s) => [s.id, s.equipment.map((e) => e.id)]));
      this.garden.dispatch({ kind: "keepEquipment", party, keep });
      this.garden.dispatch({ kind: "endRun", received: run.run.receivedBySpirit() });
    }
    const victory = run.phase.kind === "over" && run.phase.victory;
    this._last = { run: run.run, victory, before, after: this.garden.state };
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

  /** 저장은 부른 순서대로 하나씩 해요 */
  private queue(job: () => Promise<void>) {
    this.writes = this.writes.then(job).catch((e) => console.error("저장 실패", e));
  }
}

/** 출전 준비의 다음 판 */
export interface RunPlan {
  seed: number;
  strongElement: Element;
  party: string[];
  front: string;
  /** 3막에서 출발 (0108). 없으면 1막부터 */
  startAct?: number;
}

const STRONG_SALT = 0x5e7a;

const randomSeed = () => Math.floor(Math.random() * 1e9);
