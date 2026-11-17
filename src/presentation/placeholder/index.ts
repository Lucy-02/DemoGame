import type * as Phaser from "phaser";
import { DeckScene } from "./scenes/DeckScene";

export { LEGACY_FLOW, type LegacyFlow } from "./flow";

/** 장면 키 */
export const LEGACY = {
  deck: "DeckScene",
} as const;

/** [키, 장면] (게임에 add 할 때) */
export const LEGACY_SCENES: [string, typeof Phaser.Scene][] = [
  [LEGACY.deck, DeckScene],
];

/** 임시 UI 글자(Noto Sans KR, index.html의 CDN)가 준비된 뒤 그려야 폭이 어긋나지 않아요. */
export async function waitForLegacyFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load("16px 'Noto Sans KR'"), document.fonts.load("bold 16px 'Noto Sans KR'")]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* 폰트 없이도 진행 */
  }
}
