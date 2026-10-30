// 새 화면(정본 기준)으로 게임을 띄워요. 기준 해상도는 정본 프레임과 같은 1280×800.
// 창 크기에 맞춰 늘이지 않고 1280×800 고정 뷰포트로 그려요.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import { BATTLE_SCENE, BattleScene } from "./battle/BattleScene";
import { FIXTURES } from "./battle/fixtures";
import { FRAME } from "./battle/layout";
import { SPIRITS_SCENE, SpiritsScene, type SpiritsSceneData } from "./spirits/SpiritsScene";
import type { TabId } from "./spirits/viewmodel";
import { loadFonts } from "./style/fonts";

export interface GameOptions {
  /** 띄울 화면 (기본 전투). spirits = 정령 관리 */
  screen?: "battle" | "spirits";
  /** 정령 관리: 처음 고를 정령·탭, 패널 접힘 (?select=&tab=&closed) */
  select?: string;
  tab?: string;
  closed?: boolean;
  /** 시각 검증용: 이 key의 손패 카드에 호버한 상태로 시작 */
  hover?: string;
  /** 고정 장면 이름 (전투: battle/fixtures FIXTURES, 정령 관리: spirits/fixtures GARDENS). 없으면 기본 */
  scene?: string;
  /** 들기 크기 바꿔 보기 (battle/layout LIFT_STYLES) */
  lift?: string;
}

export async function startGame(parent: string, opts: GameOptions = {}): Promise<Phaser.Game> {
  await loadFonts();
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
        if (opts.screen === "spirits") {
          const data: SpiritsSceneData = { scene: opts.scene, select: opts.select, tab: opts.tab as TabId | undefined, closed: opts.closed };
          game.scene.add(SPIRITS_SCENE, SpiritsScene, true, data);
          return;
        }
        game.scene.add(BATTLE_SCENE, BattleScene, true, { hover: opts.hover, vm: opts.scene ? FIXTURES[opts.scene] : undefined, lift: opts.lift });
      },
    },
  });
}
