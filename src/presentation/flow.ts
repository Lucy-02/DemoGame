// 게임 흐름: 메인 화면에서 판을 떠나 끝내고 돌아오는 길을 화면 사이에 이어요.
// 판의 자리(RunSession.phase)를 보고 그 자리를 맡은 화면을 열어요. 새 화면이 없는 칸은 임시 장면(placeholder)이 맡아요.
// 화면은 명령만 보내고(세션), 화면 사이 이동은 여기서만 해요 (아키텍처 0001).
import * as Phaser from "phaser";
import type { Run } from "../core/run";
import type { GameSession } from "../session/game";
import { BattleSession } from "../session/battle";
import { RewardSession } from "../session/reward";
import type { BattleOutcome, RunSession } from "../session/run";
import { ShopSession } from "../session/shop";
import { BATTLE_SCENE, type BattleSceneData } from "./battle/BattleScene";
import { COPY as BATTLE_COPY } from "./battle/copy";
import { departVM } from "./depart/fromGarden";
import { DEPART_SCENE, type DepartSceneData } from "./depart/DepartScene";
import { homeVM } from "./home/fromGame";
import { HOME_SCENE, type HomeSceneData } from "./home/HomeScene";
import { joinVM } from "./join/fromGarden";
import { JOIN_SCENE, type JoinSceneData } from "./join/JoinScene";
import { LEGACY, LEGACY_FLOW, type LegacyFlow } from "./placeholder";
import { RESULT_SCENE, type ResultSceneData } from "./result/ResultScene";
import { SHOP_SCENE, type ShopSceneData } from "./shop/ShopScene";
import { SPIRITS_SCENE, type SpiritsSceneData } from "./spirits/SpiritsScene";

const SCENE_PENDING = Phaser.Scenes.PENDING;
const SCENE_SHUTDOWN = Phaser.Scenes.SHUTDOWN;

export interface FlowOptions {
  /** 시험 판(?screen=legacy): 메인 화면 없이 바로 떠나고, 끝나면 새 시험 판 */
  trial?: boolean;
  /** 메인 화면의 종료 */
  quit?: () => void;
}

export class GameFlow implements LegacyFlow {
  /** 지금 화면이 그리는 판. 판이 닫혀도 결과를 그리는 동안은 남아요 */
  private current?: RunSession;

  constructor(private game: Phaser.Game, private session: GameSession, private opts: FlowOptions = {}) {
    game.registry.set(LEGACY_FLOW, this);
  }

  get run(): Run {
    if (!this.current) throw new Error("진행 중인 판이 없어요");
    return this.current.run;
  }

  /** 게임을 켰을 때 */
  start() {
    if (this.opts.trial) this.depart();
    // 고르지 않고 껐던 깃들기는 켜자마자 골라요 (0076 9)
    else if (this.session.joinPending) this.join();
    else this.home();
  }

  home() {
    this.current = undefined;
    const data: HomeSceneData = {
      vm: homeVM(this.session.garden.state, this.session.run?.run),
      onPrimary: () => (this.session.run ? this.resume() : this.depart()),
      onItem: (id) => {
        if (id === "spirits") this.go(SPIRITS_SCENE, { session: this.session.garden, onBack: () => this.home() } satisfies SpiritsSceneData);
        if (id === "quit") this.opts.quit?.();
        // 설정 · 도감 화면은 아직 없어요
      },
    };
    this.go(HOME_SCENE, data);
  }

  /** 떠나기. 정령이 둘 이상이면 메인 화면 위에 출전 준비를 띄워 앞열을 정하고 떠나요 (0076 14) */
  depart() {
    const garden = this.session.garden.state;
    if (this.opts.trial || garden.spirits.length < 2) {
      this.session.startRun();
      return this.resume();
    }
    if (this.session.joinPending) return this.join();
    const plan = this.session.planRun();
    const data: DepartSceneData = {
      vm: departVM(garden, plan),
      onCancel: () => {
        this.game.scene.stop(DEPART_SCENE);
        this.game.scene.resume(HOME_SCENE);
      },
      onDepart: (front) => {
        this.session.startRun(plan, front);
        this.resume();
      },
    };
    const open = () => {
      this.game.scene.pause(HOME_SCENE);
      this.game.scene.run(DEPART_SCENE, data);
    };
    if (this.game.scene.isActive(HOME_SCENE)) return open();
    this.home();
    this.game.scene.getScene(HOME_SCENE).events.once(Phaser.Scenes.Events.CREATE, open);
  }

  /** 깃들기: 판 끝에 꼭 골라요. 둘이면 연달아 골라요 (0076 9 · 10). prev = 바로 앞에 고른 정령 */
  private join(prev?: string) {
    const garden = this.session.garden;
    let picked: string | undefined;
    const data: JoinSceneData = {
      vm: joinVM(garden.state, prev),
      onPick: (id) => {
        picked = id;
        garden.dispatch({ kind: "join", id });
      },
      onDone: () => (this.session.joinPending ? this.join(picked) : this.home()),
    };
    this.go(JOIN_SCENE, data);
  }

  /** 판의 지금 자리를 맡은 화면을 열어요 (이어하기도 여기로) */
  resume() {
    const run = this.session.run;
    if (!run) return this.home();
    this.current = run;
    const phase = run.phase;
    switch (phase.kind) {
      case "map": return this.go(LEGACY.map);
      case "battle": {
        const session = new BattleSession(run.run, phase.enemies);
        const floor = run.run.current?.floor;
        const data: BattleSceneData = {
          session, onOver: (scene) => this.battleOver(scene, session.outcome()),
          place: floor === undefined ? undefined : BATTLE_COPY.floor(floor),
        };
        return this.go(BATTLE_SCENE, data);
      }
      case "event": return this.go(LEGACY.event);
      case "rest": return this.go(LEGACY.rest);
      case "shop": {
        const data: ShopSceneData = { session: new ShopSession(run.run), onLeave: () => this.leave() };
        return this.go(SHOP_SCENE, data);
      }
      case "reward": {
        // 이어하기로 돌아온 보상은 싸우던 장면 없이 창만 열어요
        const data: ResultSceneData = { session: new RewardSession(run.run, { kind: "battle", reward: phase.reward }), onDone: () => this.rewardDone() };
        return this.go(RESULT_SCENE, data);
      }
      case "over": return this.home();
    }
  }

  enter(nodeId: string) {
    this.need().enter(nodeId);
    this.resume();
  }

  leave() {
    this.need().leave();
    this.resume();
  }

  battleOver(scene: Phaser.Scene, outcome: BattleOutcome) {
    const run = this.need();
    this.session.finishBattle(outcome);
    const phase = run.phase;
    if (phase.kind === "over") return this.go(LEGACY.end, { victory: phase.victory });
    if (phase.kind !== "reward") return this.resume();
    // 싸우던 장면은 아래에 멈춰 두고 그 위에 창으로 띄워요 (0069)
    const data: ResultSceneData = {
      session: new RewardSession(run.run, { kind: "battle", reward: phase.reward }), over: true, onDone: () => this.rewardDone(),
    };
    scene.scene.launch(RESULT_SCENE, data);
    scene.scene.pause();
  }

  /** 판 결과 뒤. 깃들기가 남았으면 먼저 골라요 */
  finish() {
    if (this.opts.trial) return this.depart();
    if (this.session.joinPending) return this.join();
    this.home();
  }

  private rewardDone() {
    this.need().finishReward();
    this.resume();
  }

  private need(): RunSession {
    if (!this.current) throw new Error("진행 중인 판이 없어요");
    return this.current;
  }

  /** 떠 있는 장면(멈춘 것 포함)을 모두 닫고 이 장면을 열어요 */
  private go(key: string, data?: object) {
    const scenes = this.game.scene;
    for (const s of scenes.getScenes(false)) {
      const { key: k, status } = s.sys.settings;
      // 막 만들어지는 중(불러오기·create)인 장면도 닫아요
      if (k !== key && status > SCENE_PENDING && status < SCENE_SHUTDOWN) scenes.stop(k);
    }
    scenes.start(key, data);
  }
}
