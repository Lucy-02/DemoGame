// 새 화면(정본 기준)으로 게임을 띄워요. 기준 해상도는 정본 프레임과 같은 1280×800.
// 창 크기에 맞춰 늘이지 않고 1280×800 고정 뷰포트로 그려요.
// screen이 없으면 저장에 이어진 게임(메인 화면에서 시작, flow.ts)이고, 화면 이름을 주면 그 화면의 고정 장면이에요.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import type { GameSession } from "../session/game";
import { GameFlow } from "./flow";
import { LEGACY_SCENES, waitForLegacyFonts } from "./placeholder";
import { BATTLE_SCENE, BattleScene } from "./battle/BattleScene";
import { FIXTURES } from "./battle/fixtures";
import { FRAME } from "./battle/layout";
import { DEPART_SCENE, DepartScene, type DepartSceneData } from "./depart/DepartScene";
import { HOME_SCENE, HomeScene, type HomeSceneData } from "./home/HomeScene";
import { JOIN_SCENE, JoinScene, type JoinSceneData } from "./join/JoinScene";
import { RESULT_SCENE, ResultScene, type ResultSceneData } from "./result/ResultScene";
import { SHOP_SCENE, ShopScene, type ShopSceneData } from "./shop/ShopScene";
import { SPIRITS_SCENE, SpiritsScene, type SpiritsSceneData } from "./spirits/SpiritsScene";
import type { TabId } from "./spirits/viewmodel";
import { installCursor } from "./style/cursor";
import { loadFonts } from "./style/fonts";

export interface GameOptions {
  /** 고정 장면으로 띄울 화면. spirits = 정령 관리, result = 전투 결과, shop = 상점. 없으면 저장에 이어진 게임 */
  screen?: "battle" | "spirits" | "result" | "shop" | "home" | "join" | "depart";
  /** 저장에 이어진 게임의 세션 (screen이 없을 때) */
  session?: GameSession;
  /** 시험 판: 메인 화면 없이 바로 떠나요 (?screen=legacy) */
  trial?: boolean;
  /** 메인 화면의 종료 */
  quit?: () => void;
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
}

export async function startGame(parent: string, opts: GameOptions = {}): Promise<Phaser.Game> {
  const live = !opts.screen && opts.session;
  await Promise.all([loadFonts(), live ? waitForLegacyFonts() : undefined]);
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: FRAME.w,
    height: FRAME.h,
    backgroundColor: tokens.provisional.palette.floor,
    // 가운데 정렬은 index.html의 #game(flex)이 맡아요.
    scale: { mode: Phaser.Scale.NONE },
    scene: [],
    callbacks: {
      postBoot: (game) => {
        // 마우스 커서(0025). 끌기·대기 같은 잠깐 상태는 game.registry.get("cursor").push/pop
        game.registry.set("cursor", installCursor(game));
        if (live) {
          for (const [key, scene] of [[HOME_SCENE, HomeScene], [BATTLE_SCENE, BattleScene], [SPIRITS_SCENE, SpiritsScene], [RESULT_SCENE, ResultScene], [SHOP_SCENE, ShopScene], [JOIN_SCENE, JoinScene], [DEPART_SCENE, DepartScene]] as const) {
            game.scene.add(key, scene, false);
          }
          for (const [key, scene] of LEGACY_SCENES) game.scene.add(key, scene, false);
          new GameFlow(game, opts.session!, { trial: opts.trial, quit: opts.quit }).start();
          return;
        }
        if (opts.screen === "spirits") {
          const data: SpiritsSceneData = { scene: opts.scene, select: opts.select, tab: opts.tab as TabId | undefined, closed: opts.closed, pick: opts.pick };
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
        if (opts.screen === "shop") {
          const data: ShopSceneData = { scene: opts.scene, hover: opts.hover };
          game.scene.add(SHOP_SCENE, ShopScene, true, data);
          return;
        }
        game.scene.add(BATTLE_SCENE, BattleScene, true, { hover: opts.hover, vm: opts.scene ? FIXTURES[opts.scene] : undefined, lift: opts.lift });
      },
    },
  });
}
