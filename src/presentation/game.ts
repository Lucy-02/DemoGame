// 새 화면(정본 기준)으로 게임을 띄워요. 기준 해상도는 정본 프레임과 같은 1280×800.
// 화면 좌표는 1280×800 그대로이고, 창에 맞춰 비율을 지키며 늘여요. 남는 곳은 바닥색이에요 (0084 4번). 큰 모니터에서는 배수만큼 촘촘히 그려요.
// screen이 없으면 저장에 이어진 게임(메인 화면에서 시작, flow.ts)이고, 화면 이름을 주면 그 화면의 고정 장면이에요.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import type { GameSession } from "../session/game";
import type { SettingsSession } from "../session/settings";
import { defaultSettings } from "../session/settings";
import { installAudio } from "./audio";
import { GameFlow } from "./flow";
import { LEGACY_SCENES, waitForLegacyFonts } from "./placeholder";
import { BATTLE_SCENE, BattleScene } from "./battle/BattleScene";
import { FIXTURES } from "./battle/fixtures";
import { FRAME } from "./battle/layout";
import { DEMO_END_SCENE, DemoEndScene, type DemoEndSceneData } from "./demoEnd/DemoEndScene";
import { DEPART_SCENE, DepartScene, type DepartSceneData } from "./depart/DepartScene";
import { HOME_SCENE, HomeScene, type HomeSceneData } from "./home/HomeScene";
import { JOIN_SCENE, JoinScene, type JoinSceneData } from "./join/JoinScene";
import { RESULT_SCENE, ResultScene, type ResultSceneData } from "./result/ResultScene";
import { EVENT_SCENE, EventScene, type EventSceneData } from "./event/EventScene";
import { REST_SCENE, RestScene, type RestSceneData } from "./rest/RestScene";
import { RUN_END_SCENE, RunEndScene, type RunEndSceneData } from "./runEnd/RunEndScene";
import { SHOP_SCENE, ShopScene, type ShopSceneData } from "./shop/ShopScene";
import { DECK_SCENE, DeckScene, type DeckSceneData } from "./deck/DeckScene";
import { MAP_SCENE, MapScene, type MapSceneData } from "./map/MapScene";
import { SETTINGS_KEY } from "./menu/hooks";
import { MENU_SCENE, MenuScene, type MenuSceneData } from "./menu/MenuScene";
import { GLOSSARY_SCENE, GlossaryScene, type GlossarySceneData } from "./menu/GlossaryScene";
import { SETTINGS_SCENE, SettingsScene, type SettingsSceneData } from "./menu/SettingsScene";
import { EVOLUTION_SCENE, EvolutionScene } from "./evolution/EvolutionScene";
import { SPIRITS_SCENE, SpiritsScene, type SpiritsSceneData } from "./spirits/SpiritsScene";
import type { TabId } from "./spirits/viewmodel";
import { installCursor } from "./style/cursor";
import { loadFonts } from "./style/fonts";
import { installResolution, pickResolution } from "./style/resolution";
import { VEIL_SCENE, VeilScene } from "./veil";

export interface GameOptions {
  /** 고정 장면으로 띄울 화면. spirits = 정령 관리, result = 전투 결과, shop = 상점. 없으면 저장에 이어진 게임 */
  screen?: "battle" | "spirits" | "result" | "shop" | "home" | "rest" | "event" | "runEnd" | "demoEnd" | "deck" | "map" | "join" | "depart" | "menu" | "settings" | "glossary";
  /** 저장에 이어진 게임의 세션 (screen이 없을 때) */
  session?: GameSession;
  /** 시험 판: 메인 화면 없이 바로 떠나요 (?screen=legacy) */
  trial?: boolean;
  /** 메인 화면의 종료 */
  quit?: () => void;
  /** 설정: 소리 볼륨과 재생 속도가 여기서 와요. 없으면 기본값 */
  settings?: SettingsSession;
  /** 메인 화면 구석에 적는 버전 */
  version?: string;
  /** 데모 빌드: 데모 끝 화면을 켜요 (0101) */
  demo?: boolean;
  /** 전투 결과: 받은 상태로 시작 (카드 key 또는 skip, 시각 검증용) */
  taken?: string;
  /** 정령 관리: 처음 고를 정령·탭, 패널 접힘 (?select=&tab=&closed) */
  select?: string;
  tab?: string;
  closed?: boolean;
  /** 정령 관리: 고른 정령의 갈래 고르기 창을 연 채로 (?pick) */
  pick?: boolean;
  /** 시각 검증용: 이 key의 손패 카드에 호버한 상태로 시작 */
  hover?: string;
  /** 고정 장면 이름 (전투: battle/fixtures FIXTURES, 정령 관리: spirits/fixtures GARDENS, 전투 결과: result/fixtures RESULTS, 상점: shop/fixtures SHOPS, 깃들기: join/fixtures JOINS, 출전 준비: depart/fixtures DEPARTS). 없으면 기본 */
  scene?: string;
  /** 들기 크기 바꿔 보기 (battle/layout LIFT_STYLES) */
  lift?: string;
  /** 전투 고정 장면에 깔 배경의 막 (?stage=1) */
  stage?: number;
  /** 그리는 해상도 배수를 정해 보기 (?res=2). 없으면 모니터 크기로 골라요 */
  res?: number;
  /** 모션 느리게 보기 (?slow=4 는 4배 느리게). 모션을 확인할 때만 써요 */
  slow?: number;
}

export async function startGame(parent: string, opts: GameOptions = {}): Promise<Phaser.Game> {
  const live = !opts.screen && opts.session;
  await Promise.all([loadFonts(), live ? waitForLegacyFonts() : undefined]);
  // 큰 모니터에서는 같은 화면을 배수만큼 촘촘히 그려요. 화면 좌표는 그대로 1280×800이에요 (style/resolution.ts)
  const res = pickResolution(FRAME, { w: window.screen.width, h: window.screen.height }, window.devicePixelRatio || 1, opts.res);
  installResolution(res, Phaser.Cameras.Scene2D.CameraManager);
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: FRAME.w * res,
    height: FRAME.h * res,
    backgroundColor: tokens.provisional.palette.floor,
    // 부모(#game) 크기에 맞춰 비율을 지키며 늘여요. 가운데 정렬은 index.html의 #game(flex)이 맡고, 남는 곳은 그 바닥색이에요
    scale: { mode: Phaser.Scale.FIT },
    scene: [],
    callbacks: {
      postBoot: (game) => {
        // 마우스 커서(0025). 끌기·대기 같은 잠깐 상태는 game.registry.get("cursor").push/pop
        game.registry.set("cursor", installCursor(game));
        if (opts.slow && opts.slow > 0) {
          const k = 1 / opts.slow;
          game.events.on(Phaser.Core.Events.PRE_STEP, () => {
            for (const s of game.scene.getScenes(true)) {
              s.tweens.timeScale = k;
              s.time.timeScale = k;
            }
          });
        }
        // 소리 (0084 1번). 화면은 audioOf(scene)로 꺼내 써요
        const audio = installAudio(game, (opts.settings?.state ?? defaultSettings()).volume);
        // 설정에서 바꾼 볼륨은 바로 들려요. 화면은 hooks의 settingsOf(scene)로 설정을 읽어요
        if (opts.settings) {
          game.registry.set(SETTINGS_KEY, opts.settings);
          opts.settings.onChange((s) => audio?.setVolumes(s.volume));
        }
        if (live) {
          for (const [key, scene] of [[HOME_SCENE, HomeScene], [BATTLE_SCENE, BattleScene], [SPIRITS_SCENE, SpiritsScene], [EVOLUTION_SCENE, EvolutionScene], [RESULT_SCENE, ResultScene], [SHOP_SCENE, ShopScene], [DECK_SCENE, DeckScene], [MAP_SCENE, MapScene], [REST_SCENE, RestScene], [EVENT_SCENE, EventScene], [RUN_END_SCENE, RunEndScene], [DEMO_END_SCENE, DemoEndScene], [JOIN_SCENE, JoinScene], [DEPART_SCENE, DepartScene], [MENU_SCENE, MenuScene], [SETTINGS_SCENE, SettingsScene], [GLOSSARY_SCENE, GlossaryScene]] as const) {
            game.scene.add(key, scene, false);
          }
          for (const [key, scene] of LEGACY_SCENES) game.scene.add(key, scene, false);
          // 화면 전환 막: 맨 나중에 더해 늘 맨 위에 있어요 (0086)
          game.scene.add(VEIL_SCENE, VeilScene, true);
          new GameFlow(game, opts.session!, { trial: opts.trial, quit: opts.quit, version: opts.version, settings: opts.settings, demo: opts.demo }).start();
          return;
        }
        if (opts.screen === "spirits") {
          const data: SpiritsSceneData = { scene: opts.scene, select: opts.select, tab: opts.tab as TabId | undefined, closed: opts.closed, pick: opts.pick };
          game.scene.add(EVOLUTION_SCENE, EvolutionScene, false);
          game.scene.add(SPIRITS_SCENE, SpiritsScene, true, data);
          return;
        }
        if (opts.screen === "result") {
          const data: ResultSceneData = { scene: opts.scene, hover: opts.hover, taken: opts.taken };
          game.scene.add(RESULT_SCENE, ResultScene, true, data);
          return;
        }
        if (opts.screen === "home") {
          // 메인 화면과 정령 관리를 오가요. 나머지 줄은 화면이 생기면 이어요.
          const home: HomeSceneData = {
            scene: opts.scene, hover: opts.hover,
            onItem: (id) => {
              if (id !== "spirits") return;
              game.scene.stop(HOME_SCENE);
              game.scene.start(SPIRITS_SCENE, spirits);
            },
          };
          const spirits: SpiritsSceneData = {
            onBack: () => {
              game.scene.stop(SPIRITS_SCENE);
              game.scene.start(HOME_SCENE, { ...home, hover: undefined });
            },
          };
          game.scene.add(SPIRITS_SCENE, SpiritsScene, false);
          game.scene.add(EVOLUTION_SCENE, EvolutionScene, false);
          game.scene.add(HOME_SCENE, HomeScene, true, home);
          return;
        }
        if (opts.screen === "join") {
          const data: JoinSceneData = { scene: opts.scene, select: opts.select, hover: opts.hover, taken: opts.taken };
          game.scene.add(JOIN_SCENE, JoinScene, true, data);
          return;
        }
        if (opts.screen === "depart") {
          // 메인 화면 위에 떠요
          const data: DepartSceneData = { scene: opts.scene, select: opts.select, hover: opts.hover };
          game.scene.add(HOME_SCENE, HomeScene, true, { scene: "full" } satisfies HomeSceneData);
          game.scene.add(DEPART_SCENE, DepartScene, true, data);
          return;
        }
        if (opts.screen === "map") {
          game.scene.add(MAP_SCENE, MapScene, true, { scene: opts.scene, select: opts.select } satisfies MapSceneData);
          return;
        }
        if (opts.screen === "deck") {
          // 덱 보기는 다른 화면 위에 뜨는 창이라, 확인할 때는 전투 고정 장면 위에 띄워요
          game.scene.add(BATTLE_SCENE, BattleScene, true, {});
          game.scene.add(DECK_SCENE, DeckScene, true, { scene: opts.scene } satisfies DeckSceneData);
          return;
        }
        if (opts.screen === "menu") {
          game.scene.add(BATTLE_SCENE, BattleScene, true, {});
          game.scene.add(MENU_SCENE, MenuScene, true, { hover: opts.hover, confirm: opts.scene === "confirm", onHome: () => {} } satisfies MenuSceneData);
          return;
        }
        if (opts.screen === "glossary") {
          game.scene.add(BATTLE_SCENE, BattleScene, true, {});
          game.scene.add(GLOSSARY_SCENE, GlossaryScene, true, { hover: opts.hover } satisfies GlossarySceneData);
          return;
        }
        if (opts.screen === "settings") {
          game.scene.add(BATTLE_SCENE, BattleScene, true, {});
          game.scene.add(SETTINGS_SCENE, SettingsScene, true, { settings: opts.settings, hover: opts.hover } satisfies SettingsSceneData);
          return;
        }
        if (opts.screen === "shop") {
          const data: ShopSceneData = { scene: opts.scene, hover: opts.hover };
          game.scene.add(SHOP_SCENE, ShopScene, true, data);
          return;
        }
        if (opts.screen === "demoEnd") {
          const data: DemoEndSceneData = { next: opts.scene === "again" ? "again" : "garden" };
          game.scene.add(DEMO_END_SCENE, DemoEndScene, true, data);
          return;
        }
        if (opts.screen === "runEnd") {
          const data: RunEndSceneData = { scene: opts.scene };
          game.scene.add(RUN_END_SCENE, RunEndScene, true, data);
          return;
        }
        if (opts.screen === "event") {
          const data: EventSceneData = { scene: opts.scene, hover: opts.hover };
          game.scene.add(EVENT_SCENE, EventScene, true, data);
          return;
        }
        if (opts.screen === "rest") {
          const data: RestSceneData = { scene: opts.scene, hover: opts.hover };
          game.scene.add(REST_SCENE, RestScene, true, data);
          return;
        }
        game.scene.add(BATTLE_SCENE, BattleScene, true, { hover: opts.hover, vm: opts.scene ? FIXTURES[opts.scene] : undefined, lift: opts.lift, stage: opts.stage });
      },
    },
  });
}
