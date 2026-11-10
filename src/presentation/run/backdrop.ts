// 결과 창 계열 배경 (P1 .bg): 왼쪽 가운데가 살짝 밝은 어두운 바닥.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { canvasTexture, ellipse } from "../style/gradient";
import { BG, FRAME } from "./layout";

const P = tokens.provisional.palette;

export function drawBackdrop(scene: Phaser.Scene) {
  const key = canvasTexture(scene, "run:bg", FRAME.w, FRAME.h, (ctx) => {
    ctx.fillStyle = P.stageLo;
    ctx.fillRect(0, 0, FRAME.w, FRAME.h);
    ellipse(ctx, FRAME.w, FRAME.h, BG, [[P.stageHi, 0], [P.floor, BG.mid], [P.stageLo, 1]]);
  });
  return scene.add.image(0, 0, key).setOrigin(0, 0);
}
