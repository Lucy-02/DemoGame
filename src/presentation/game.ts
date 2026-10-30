// 새 화면(정본 기준)으로 게임을 띄워요. 기준 해상도는 정본 프레임과 같은 1280×800.
// 창 크기에 맞춰 늘이지 않고 1280×800 고정 뷰포트로 그려요.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import { BATTLE_SCENE, BattleScene } from "./battle/BattleScene";
import { FIXTURES } from "./battle/fixtures";
import { FRAME } from "./battle/layout";
import { loadFonts } from "./style/fonts";

export interface GameOptions {
  /** 시각 검증용: 이 key의 손패 카드에 호버한 상태로 시작 */
  hover?: string;
  /** 고정 장면 이름 (battle/fixtures FIXTURES). 없으면 정본 쉬는 상태 */
  scene?: string;
  /** 들기 크기 바꿔 보기 (battle/layout LIFT_STYLES) */
  lift?: string;
  /** 여러 대상 조준선 후보 비교 (aim/layout AIM_LINE_STYLES) */
  lines?: string;
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
      postBoot: (game) => game.scene.add(BATTLE_SCENE, BattleScene, true, { hover: opts.hover, vm: opts.scene ? FIXTURES[opts.scene] : undefined, lift: opts.lift, lines: opts.lines }),
    },
  });
}
