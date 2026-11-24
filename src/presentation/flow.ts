// 게임 흐름: 메인 화면에서 판을 떠나 끝내고 돌아오는 길을 화면 사이에 이어요.
// 판의 자리(RunSession.phase)를 보고 그 자리를 맡은 화면을 열어요. 새 화면이 없는 칸은 임시 장면(placeholder)이 맡아요.
// 화면은 명령만 보내고(세션), 화면 사이 이동은 여기서만 해요 (아키텍처 0001).
import * as Phaser from "phaser";
import type { Run } from "../core/run";
import { hasGuide } from "../core/garden";
import { isBranching } from "../core/growth";
import type { GameSession } from "../session/game";
import type { SettingsSession } from "../session/settings";
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
import { DEMO_END_SCENE, type DemoEndSceneData } from "./demoEnd/DemoEndScene";
import { homeVM } from "./home/fromGame";
import { HOME_SCENE, type HomeSceneData } from "./home/HomeScene";
import { MAP_SCENE, type MapSceneData } from "./map/MapScene";
import { RUN_MENU_KEY, SETTINGS_KEY } from "./menu/hooks";
import { MENU_SCENE, type MenuSceneData } from "./menu/MenuScene";
import { GLOSSARY_SCENE, type GlossarySceneData } from "./menu/GlossaryScene";
import { SETTINGS_SCENE, type SettingsSceneData } from "./menu/SettingsScene";
import { departVM } from "./depart/fromGarden";
import { DEPART_SCENE, type DepartSceneData } from "./depart/DepartScene";
import { joinVM } from "./join/fromGarden";
import { JOIN_SCENE, type JoinSceneData } from "./join/JoinScene";
import { LEGACY, LEGACY_FLOW, type LegacyFlow } from "./placeholder";
import { REST_SCENE, type RestSceneData } from "./rest/RestScene";
import { RESULT_SCENE, type ResultSceneData } from "./result/ResultScene";
import { RUN_END_SCENE, type RunEndSceneData } from "./runEnd/RunEndScene";
import { SHOP_SCENE, type ShopSceneData } from "./shop/ShopScene";
import { gardenSource, runSource } from "./spirits/roster";
import { SPIRITS_SCENE, type SpiritsSceneData } from "./spirits/SpiritsScene";
import { VEIL_SCENE, VeilScene } from "./veil";

const SCENE_PENDING = Phaser.Scenes.PENDING;
const SCENE_SHUTDOWN = Phaser.Scenes.SHUTDOWN;

export interface FlowOptions {
  /** 시험 판(?screen=legacy): 메인 화면 없이 바로 떠나고, 끝나면 새 시험 판 */
  trial?: boolean;
  /** 메인 화면의 종료 */
  quit?: () => void;
  /** 설정 (없으면 저장하지 않는 기본 설정) */
  settings?: SettingsSession;
  /** 메인 화면 구석에 적는 버전 */
  version?: string;
  /** 데모 빌드 (0101): 마지막 막의 보스를 이긴 판 결과 다음에 데모 끝 화면이 떠요 */
  demo?: boolean;
}

export class GameFlow implements LegacyFlow {
  /** 지금 화면이 그리는 판. 판이 닫혀도 결과를 그리는 동안은 남아요 */
  private current?: RunSession;

  constructor(private game: Phaser.Game, private session: GameSession, private opts: FlowOptions = {}) {
    game.registry.set(LEGACY_FLOW, this);
    game.registry.set(RUN_MENU_KEY, (scene: Phaser.Scene) => this.menu(scene));
    if (opts.settings) game.registry.set(SETTINGS_KEY, opts.settings);
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
      vm: homeVM(this.session.run?.run, this.opts.version),
      onPrimary: () => (this.session.run ? this.resume() : this.depart()),
      onItem: (id) => {
        if (id === "spirits") this.go(SPIRITS_SCENE, { source: gardenSource(this.session.garden), onBack: () => this.home() } satisfies SpiritsSceneData);
        if (id === "quit") this.opts.quit?.();
        if (id === "settings" || id === "glossary") {
          const home = this.game.scene.getScene(HOME_SCENE);
          const back = () => home.scene.resume();
          if (id === "settings") this.settings(home, back);
          else this.glossary(home, back);
        }
        // 도감 화면은 아직 없어요
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
        audioOf(this.game)?.play("join");
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
        // 첫 판 가운데의 깃들기 (0156): 정한 층을 마치고 지도로 오면 판 끝과 같은 깃들기 화면에서 고르고, 고른 정령이 바로 합류해요
        this.session.joinMidRun();
        if (this.session.midJoinDue || (this.session.joinPending && run.run.firstRun && run.run.spirits.length === 1)) {
          this.session.beginMidJoin();
          return this.join(undefined, () => {
            this.session.joinMidRun();
            this.resume();
          });
        }
        // 키울 수 있는 정령이 있으면 지도에 앞서 정령 화면에서 키워요 (0157). 미루면 다음 지도 차례에 다시 물어요
        const due = run.growDue();
        if (due.length) return this.grow(run, due[0]);
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
          // 브레이크는 조건이 맞는 첫 순간에 한 번, 어느 전투든 (0095). 짚으면 정원에 적어요
          guide: {
            steps: !!phase.first, breakHint: !hasGuide(this.session.garden.state, "break"),
            onBreak: () => this.session.garden.dispatch({ kind: "guide", id: "break" }),
          },
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

  /**
   * 판 안에서 키우기 (0157 · 0162: 전투 보상 뒤 지도 차례에). 지금 판의 정령으로 정령 화면을 열어요.
   * 갈래 고르기면 갈래 창을 연 채로, 아니면 성장 길 탭의 키우기 버튼으로 키워요. 돌아가면 남은 정령은 다음 지도 차례로 미뤄요.
   */
  private grow(run: RunSession, id: string) {
    const data: SpiritsSceneData = {
      source: runSource(run), select: id, tab: "growth", pick: isBranching(run.run.spirit(id)),
      onLater: (later) => run.deferGrow(later),
      onBack: () => {
        for (const left of run.growDue()) run.deferGrow(left);
        this.resume();
      },
    };
    this.go(SPIRITS_SCENE, data);
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

  /** 판 안 메뉴 (0084 3번): 지금 화면은 아래에 멈춰 두고 그 위에 띄워요. 진행 중인 판이 있을 때만 열려요 */
  menu(scene: Phaser.Scene) {
    if (!this.session.run || [MENU_SCENE, SETTINGS_SCENE, GLOSSARY_SCENE].some((k) => this.game.scene.isActive(k))) return;
    const open = () => scene.scene.launch(MENU_SCENE, data);
    const close = () => scene.scene.stop(MENU_SCENE);
    const data: MenuSceneData = {
      onResume: () => {
        close();
        scene.scene.resume();
      },
      // 설정은 메뉴 자리에 뜨고, 닫으면 메뉴로 돌아와요
      onSettings: () => {
        close();
        this.settings(scene, open);
      },
      onGlossary: () => {
        close();
        this.glossary(scene, open);
      },
      // 메인으로: 판은 이 칸에 들어온 때로 저장돼 있어요. 다시 이으면 그 칸의 처음부터예요 (0084 6번)
      onHome: this.opts.trial ? undefined : () => {
        this.session.suspendRun();
        this.home();
      },
      // 탐험 포기: 패배와 같아요. 판 결과로 가요 (0084 5번)
      onGiveUp: () => {
        this.session.abandonRun();
        this.runEnd();
      },
    };
    scene.scene.pause();
    open();
  }

  /** 설정 창: under 화면은 멈춰 두고, 닫으면 then */
  private settings(under: Phaser.Scene, then: () => void) {
    const data: SettingsSceneData = {
      settings: this.opts.settings,
      onClose: () => {
        under.scene.stop(SETTINGS_SCENE);
        then();
      },
    };
    // 판 안 메뉴에서 왔으면 아래 화면은 이미 멈춰 있어요
    if (under.scene.isActive()) under.scene.pause();
    under.scene.launch(SETTINGS_SCENE, data);
  }

  /** 용어 모음 창 (0102): 설정 창과 같은 방식으로 떠요 */
  private glossary(under: Phaser.Scene, then: () => void) {
    const data: GlossarySceneData = {
      onClose: () => {
        under.scene.stop(GLOSSARY_SCENE);
        then();
      },
    };
    if (under.scene.isActive()) under.scene.pause();
    under.scene.launch(GLOSSARY_SCENE, data);
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
    // 데모에서 이긴 판은 어느 버튼이든 데모 끝을 거쳐 그 버튼이 가던 곳으로 가요 (0101)
    const demoEnd = !!this.opts.demo && record.victory;
    const to = (next: NonNullable<DemoEndSceneData["next"]>, then: () => void) => () => (demoEnd ? this.demoEnd(next, then) : then());
    const data: RunEndSceneData = { record, wishlist: !!this.opts.demo, onGarden: to("garden", () => this.finish()), onAgain: to("again", () => this.depart()) };
    this.go(RUN_END_SCENE, data);
  }

  private demoEnd(next: NonNullable<DemoEndSceneData["next"]>, then: () => void) {
    this.go(DEMO_END_SCENE, { next, onNext: then } satisfies DemoEndSceneData);
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
