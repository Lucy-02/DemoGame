// 전투 위 창 (라운드 X1): 무대를 어둡게 덮는 막 + 그림자 + 불투명한 창 바탕.
import type * as Phaser from "phaser";
import { P } from "../../spirits/views/parts";
import { box } from "../../style/draw";
import { shadowTexture } from "../../style/shadow";
import { FRAME } from "../../run/layout";
import { WINDOW } from "../layout";

export function drawWindow(scene: Phaser.Scene, win: { x: number; y: number; w: number; h: number }) {
  const W = WINDOW;
  box(scene.add.graphics().setScrollFactor(0), 0, 0, FRAME.w, FRAME.h, 0, { fill: P.scrim });
  const sh = shadowTexture(scene, win.w, win.h, W.radius, { y: W.shadow.y, blur: W.shadow.blur, color: P.tipShadow });
  scene.add.image(win.x - sh.margin, win.y - sh.margin, sh.key).setOrigin(0, 0);
  box(scene.add.graphics(), win.x, win.y, win.w, win.h, W.radius, { fill: P.floor });
  box(scene.add.graphics(), win.x, win.y, win.w, win.h, W.radius, { ring: { width: W.ring, color: P.glassLine } });
}
