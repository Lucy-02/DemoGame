// 판 안 화면의 위 띠 (Lucy 2026-11-17, 공용 UI 기획): 골드는 왼쪽 위, 덱 · 기록 · 설정 기호 버튼은 오른쪽 위. 지도 · 이벤트 · 휴식 · 덱 고르기가 같은 자리.
import type * as Phaser from "phaser";
import { SYS } from "../battle/layout";
import { SYS_ICONS, drawSys } from "../battle/views/topbar";
import { GOLD_ICONS, drawGold, type GoldLook } from "./gold";
import { GOLD_AT } from "./layout";

export const RUN_TOP_ICONS = [...GOLD_ICONS, ...SYS_ICONS.map((id) => [id, SYS.icon] as const)] as const;

export function drawRunTop(scene: Phaser.Scene, gold: number, look: GoldLook = {}, onDeck?: (scene: Phaser.Scene) => void) {
  drawGold(scene, gold, look, GOLD_AT);
  drawSys(scene, { "i-deck": onDeck && (() => onDeck(scene)) });
}
