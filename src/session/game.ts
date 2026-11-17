// 게임 세션: 정원 하나와 진행 중인 판 하나를 묶고, 둘을 저장소에 남겨요.
// 정원 ↔ 판 연결은 여기서만 해요: 판을 떠날 때 정원의 정령으로(toRunSpirit), 이긴 전투마다 경험·재료(grantBattle),
// 판이 끝나면 판 수와 갈래 조건(endRun · openBranches). 저장은 platform의 문자열 저장만 써요 (아키텍처 0001).
import { GardenSession } from "./garden";
import { RunSession, type BattleOutcome, type BattleWin, type RunSaveFile } from "./run";
import type { Run, RunOptions } from "../core/run";
import type { Garden } from "../core/garden";

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

/** 정원 없이 도는 시험 판(?screen=legacy). 저장하지 않고 정원에 아무것도 남기지 않아요 */
export type TrialOptions = Omit<RunOptions, "seed" | "garden">;

export class GameSession {
  private _run?: RunSession;
  private _last?: RunRecord;
  private writes: Promise<void> = Promise.resolve();

  private constructor(
    readonly garden: GardenSession,
    private store: SaveStore | undefined,
    private newSeed: () => number,
    private trialOpts?: TrialOptions,
  ) {
    garden.onChange(() => this.write(SAVE_KEYS.garden, garden.snapshot()));
  }

  /** 저장을 읽어요. 정원이 없으면 새로 하기의 정원을 만들어 바로 남겨요 (0053) */
  static async load(store: SaveStore, newSeed: () => number = randomSeed): Promise<GameSession> {
    const gardenText = await store.read(SAVE_KEYS.garden);
    const fresh = !gardenText;
    const garden = gardenText ? GardenSession.restore(gardenText) : GardenSession.fresh(newSeed());
    const game = new GameSession(garden, store, newSeed);
    if (fresh) game.write(SAVE_KEYS.garden, garden.snapshot());
    const runText = await store.read(SAVE_KEYS.run);
    if (runText) game.attach(RunSession.restore(JSON.parse(runText) as RunSaveFile));
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

  /** 정원의 정령으로 새 판을 떠나요. 앞열은 첫 정령이에요 (출전 준비 화면 0054는 Lucy 확인 대기) */
  startRun(): RunSession {
    if (this._run) throw new Error("이미 진행 중인 판이 있어요");
    const seed = this.newSeed();
    const opts: RunOptions = this.trialOpts
      ? { ...this.trialOpts, seed }
      : { seed, garden: this.garden.state, frontId: this.garden.state.spirits[0].id, adult: false, unlockAll: false };
    const run = RunSession.start(opts);
    this.attach(run);
    this.saveRun();
    return run;
  }

  /**
   * 전투가 끝났어요. 이겼으면 출전한 정령이 경험을, 정원이 재료를 받아요 (져도 이긴 만큼은 남아요).
   * 보스를 이기거나 지면 판이 그 자리에서 닫혀요. 끝난 판은 run.phase가 over인 채로 돌려받아 결과를 그려요.
   */
  finishBattle(outcome: BattleOutcome): BattleWin | undefined {
    const run = this.need();
    const win = run.finishBattle(outcome);
    if (win && !this.trialOpts) this.garden.dispatch({ kind: "grantBattle", party: win.party, tier: win.tier });
    if (run.phase.kind === "over") this.close(run);
    return win;
  }

  /**
   * 판을 닫고 정원으로 돌아가요. 판 수가 오르고, 이번 탐험에서 받은 카드로 갈래 조건이 쌓여요.
   * 장비 남기기(keepEquipment)는 런 결과 화면(0046, Lucy 결정 대기)에서 고르므로 아직 부르지 않아요: 판에서 얻은 장비는 사라지고 정원의 장비는 그대로예요.
   */
  private close(run: RunSession) {
    const before = run.run.opts.garden ?? this.garden.state;
    if (!this.trialOpts) this.garden.dispatch({ kind: "endRun", received: run.run.receivedBySpirit() });
    const victory = run.phase.kind === "over" && run.phase.victory;
    this._last = { run: run.run, victory, before, after: this.garden.state };
    this._run = undefined;
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
    this.write(SAVE_KEYS.run, JSON.stringify(run.save()));
  }

  private write(key: string, text: string) {
    if (this.store) this.queue(() => this.store!.write(key, text));
  }

  /** 저장은 부른 순서대로 하나씩 해요 */
  private queue(job: () => Promise<void>) {
    this.writes = this.writes.then(job).catch((e) => console.error("저장 실패", e));
  }
}

const randomSeed = () => Math.floor(Math.random() * 1e9);
