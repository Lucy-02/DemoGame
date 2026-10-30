// 새 화면(정본 기준)으로 게임을 띄워요. 기준 해상도는 정본 프레임과 같은 1280×800.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import { BATTLE_SCENE, BattleScene } from "./battle/BattleScene";
import { FRAME } from "./battle/layout";
import { loadFonts } from "./style/fonts";

export interface GameOptions {
  /** 시각 검증용: 화면 확대 없이 1:1 픽셀로 그려요. */
  pixelExact?: boolean;
  /** 시각 검증용: 이 key의 손패 카드에 호버한 상태로 시작 */
  hover?: string;
}

export async function startGame(parent: string, opts: GameOptions = {}): Promise<Phaser.Game> {
  await loadFonts();
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: FRAME.w,
    height: FRAME.h,
    backgroundColor: tokens.provisional.palette.floor,
    scale: opts.pixelExact
      ? { mode: Phaser.Scale.NONE }
      : { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [],
    callbacks: {
      postBoot: (game) => game.scene.add(BATTLE_SCENE, BattleScene, true, { hover: opts.hover }),
    },
  });
}
