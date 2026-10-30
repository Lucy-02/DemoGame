// ⚠ 임시 플레이스홀더 UI의 진입점. 새 화면이 src/core 규칙에 연결될 때마다 해당 장면을 지워요(Lucy 2026-10-31).
import * as Phaser from "phaser";
import { SpinePlugin } from "@esotericsoftware/spine-phaser-v4";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { MapScene } from "./scenes/MapScene";
import { BattleScene } from "./scenes/BattleScene";
import { RewardScene } from "./scenes/RewardScene";
import { ShopScene } from "./scenes/ShopScene";
import { EventScene } from "./scenes/EventScene";
import { RestScene } from "./scenes/RestScene";
import { DeckScene } from "./scenes/DeckScene";
import { EndScene } from "./scenes/EndScene";
import { H, W } from "./ui/widgets";

/** 한글 웹폰트가 준비된 뒤 시작해야 텍스트 폭이 어긋나지 않아요. */
async function waitForFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load("16px 'Noto Sans KR'"), document.fonts.load("bold 16px 'Noto Sans KR'")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* 폰트 없이도 진행 */
  }
}

export async function startPlaceholderGame(parent: string): Promise<Phaser.Game> {
  await waitForFonts();
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: W,
    height: H,
    backgroundColor: "#14121c",
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    plugins: { scene: [{ key: "spine.SpinePlugin", plugin: SpinePlugin, mapping: "spine" }] },
    scene: [BootScene, TitleScene, MapScene, BattleScene, RewardScene, ShopScene, EventScene, RestScene, DeckScene, EndScene],
  });
}
