// ⚠ 임시 플레이스홀더 장면 묶음. 새 화면(presentation/flow.ts의 게임 흐름)이 아직 없는 칸(지도·덱 보기)만 맡아요.
// 새 화면이 src/core 규칙에 연결될 때마다 해당 장면을 지워요(Lucy 2026-10-31). 타이틀은 메인 화면이, 전투는 새 전투 화면이,
// 이벤트·휴식·판 결과는 새 화면(event · rest · runEnd)이 맡아 지웠어요.
import type * as Phaser from "phaser";
import { MapScene } from "./scenes/MapScene";
import { DeckScene } from "./scenes/DeckScene";

export { LEGACY_FLOW, type LegacyFlow } from "./flow";

/** 장면 키 */
export const LEGACY = {
  map: "MapScene", deck: "DeckScene",
} as const;

/** [키, 장면] (게임에 add 할 때) */
export const LEGACY_SCENES: [string, typeof Phaser.Scene][] = [
  [LEGACY.map, MapScene], [LEGACY.deck, DeckScene],
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
