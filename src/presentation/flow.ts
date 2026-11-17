// 게임 흐름: 메인 화면에서 판을 떠나 끝내고 돌아오는 길을 화면 사이에 이어요.
// 판의 자리(RunSession.phase)를 보고 그 자리를 맡은 화면을 열어요. 새 화면이 없는 칸은 임시 장면(placeholder)이 맡아요.
// 화면은 명령만 보내고(세션), 화면 사이 이동은 여기서만 해요 (아키텍처 0001).
import * as Phaser from "phaser";
import type { Run } from "../core/run";
import type { GameSession } from "../session/game";
import { BattleSession } from "../session/battle";
import { EventSession } from "../session/event";
import { RestSession } from "../session/rest";
import { RewardSession } from "../session/reward";
import type { BattleOutcome, RunSession } from "../session/run";
import { ShopSession } from "../session/shop";
import { audioOf, type MusicId } from "./audio";
import { BATTLE_SCENE, type BattleSceneData } from "./battle/BattleScene";
import { COPY as BATTLE_COPY } from "./battle/copy";
import { EVENT_SCENE, type EventSceneData } from "./event/EventScene";
import { DECK_SCENE, type DeckSceneData } from "./deck/DeckScene";
import { homeVM } from "./home/fromGame";
import { HOME_SCENE, type HomeSceneData } from "./home/HomeScene";
import { MAP_SCENE, type MapSceneData } from "./map/MapScene";
import { departVM } from "./depart/fromGarden";
import { DEPART_SCENE, type DepartSceneData } from "./depart/DepartScene";
import { joinVM } from "./join/fromGarden";
import { JOIN_SCENE, type JoinSceneData } from "./join/JoinScene";
import { LEGACY, LEGACY_FLOW, type LegacyFlow } from "./placeholder";
import { REST_SCENE, type RestSceneData } from "./rest/RestScene";
import { RESULT_SCENE, type ResultSceneData } from "./result/ResultScene";
import { RUN_END_SCENE, type RunEndSceneData } from "./runEnd/RunEndScene";
import { SHOP_SCENE, type ShopSceneData } from "./shop/ShopScene";
import { SPIRITS_SCENE, type SpiritsSceneData } from "./spirits/SpiritsScene";
import { VEIL_SCENE, VeilScene } from "./veil";

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
    // 판 결과의 다시 떠나기: 깃들기를 먼저 고르고 이어서 떠나요
    if (!this.opts.trial && this.session.joinPending) return this.join(undefined, () => this.depart());
    const garden = this.session.garden.state;
    if (this.opts.trial || garden.spirits.length < 2) {
      this.session.startRun();
      return this.resume();
    }
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
    // 메인 화면이 다 뜬 뒤에 띄워요 (장면을 다시 시작하면 그 장면의 이벤트 구독이 지워져서 게임 단계로 기다려요)
    this.home();
    const wait = () => {
      if (!this.game.scene.isActive(HOME_SCENE)) return;
      this.game.events.off(Phaser.Core.Events.POST_STEP, wait);
      open();
    };
    this.game.events.on(Phaser.Core.Events.POST_STEP, wait);
  }

  /** 깃들기: 판 끝에 꼭 골라요. 둘이면 연달아 골라요 (0076 9 · 10). prev = 바로 앞에 고른 정령 */
  private join(prev?: string, then: () => void = () => this.home()) {
    const garden = this.session.garden;
    let picked: string | undefined;
    const data: JoinSceneData = {
      vm: joinVM(garden.state, prev),
      onPick: (id) => {
        picked = id;
        garden.dispatch({ kind: "join", id });
      },
      onDone: () => (this.session.joinPending ? this.join(picked, then) : then()),
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
      case "map": {
        const data: MapSceneData = { run: run.run, onEnter: (id) => this.enter(id), onDeck: (scene) => this.deck(scene) };
        return this.go(MAP_SCENE, data);
      }
      case "battle": {
        const session = new BattleSession(run.run, phase.enemies);
        const floor = run.run.current?.floor;
        const data: BattleSceneData = {
          session, onOver: (scene) => this.battleOver(scene, session.outcome()), onDeck: (scene) => this.deck(scene),
          place: floor === undefined ? undefined : BATTLE_COPY.floor(floor),
          // 첫 판의 첫 전투에서만 개념을 한 번씩 짚어요 (0088)
          ...(phase.first ? { guide: {} } : {}),
        };
        return this.go(BATTLE_SCENE, data);
      }
      case "event": {
        const data: EventSceneData = {
          session: new EventSession(run.run, phase.eventId),
          onDone: () => this.leave(), onDeck: (scene) => this.deck(scene),
          // 카드 보상은 결과를 적용한 뒤 보상 창으로 받아요 (주인이 정해지지 않은 카드 묶음)
          onCards: (_scene, cardIds) => this.go(RESULT_SCENE, {
            session: new RewardSession(run.run, { kind: "cards", cardIds }), onDone: () => this.leave(),
          } satisfies ResultSceneData),
        };
        return this.go(EVENT_SCENE, data);
      }
      case "rest": {
        const data: RestSceneData = { session: new RestSession(run.run), onLeave: () => this.leave(), onDeck: (scene) => this.deck(scene) };
        return this.go(REST_SCENE, data);
      }
      case "shop": {
        const data: ShopSceneData = { session: new ShopSession(run.run), onLeave: () => this.leave(), onDeck: (scene) => this.deck(scene) };
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
    if (phase.kind === "over") return this.runEnd();
    if (phase.kind !== "reward") return this.resume();
    audioOf(this.game)?.play("reward");
    // 싸우던 장면은 아래에 멈춰 두고 그 위에 창으로 띄워요 (0069)
    const data: ResultSceneData = {
      session: new RewardSession(run.run, { kind: "battle", reward: phase.reward }), over: true, onDone: () => this.rewardDone(),
    };
    scene.scene.launch(RESULT_SCENE, data);
    scene.scene.pause();
  }

  /** 덱 보기: 지금 화면은 아래에 멈춰 두고 그 위에 창으로 띄워요 (0069 · 0076 15번) */
  deck(scene: Phaser.Scene) {
    const data: DeckSceneData = {
      run: this.need().run,
      onClose: () => {
        scene.scene.stop(DECK_SCENE);
        scene.scene.resume();
      },
    };
    scene.scene.launch(DECK_SCENE, data);
    scene.scene.pause();
  }

  /** 판 결과 뒤. 깃들기가 남았으면 먼저 골라요 */
  finish() {
    if (this.opts.trial) return this.depart();
    if (this.session.joinPending) return this.join();
    this.home();
  }

  /** 판 결과 (0046): 정원으로 또는 다시 떠나기 */
  private runEnd() {
    const record = this.session.lastRun;
    if (!record) return this.finish();
    audioOf(this.game)?.play(record.victory ? "victory" : "defeat");
    const data: RunEndSceneData = { record, onGarden: () => this.finish(), onAgain: () => this.depart() };
    this.go(RUN_END_SCENE, data);
  }

  private rewardDone() {
    this.need().finishReward();
    this.resume();
  }

  private need(): RunSession {
    if (!this.current) throw new Error("진행 중인 판이 없어요");
    return this.current;
  }

  /** 떠 있는 장면(멈춘 것 포함)을 모두 닫고 이 장면을 열어요. 지난 화면은 흐려지고 새 화면이 떠올라요 (0086) */
  private go(key: string, data?: object) {
    const scenes = this.game.scene;
    const open = () => scenes.getScenes(false).filter((s) => {
      const { key: k, status } = s.sys.settings;
      // 막 만들어지는 중(불러오기·create)인 장면도 닫아요
      return k !== VEIL_SCENE && status > SCENE_PENDING && status < SCENE_SHUTDOWN;
    });
    const swap = () => {
      for (const s of open()) if (s.sys.settings.key !== key) scenes.stop(s.sys.settings.key);
      scenes.start(key, data);
      audioOf(this.game)?.music(this.musicOf(key));
    };
    const veil = scenes.getScene(VEIL_SCENE) as VeilScene | null;
    if (!veil) return swap();
    veil.cross(swap, () => scenes.isActive(key), open().length === 0);
  }

  /** 화면이 틀 음악 (0084 1번): 판 밖은 메인, 판 안은 지도, 전투는 전투 · 보스 */
  private musicOf(key: string): MusicId {
    if (key === BATTLE_SCENE) return this.current?.run.current?.type === "boss" ? "boss" : "battle";
    return [MAP_SCENE, EVENT_SCENE, REST_SCENE, SHOP_SCENE, RESULT_SCENE].includes(key) ? "map" : "menu";
  }
}
