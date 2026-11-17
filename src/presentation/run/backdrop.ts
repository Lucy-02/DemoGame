// 결과 창 계열 배경 (P1 .bg): 왼쪽 가운데가 살짝 밝은 어두운 바닥.
// 막을 주면(이벤트 · 휴식, 0119) 그 막의 전투 배경을, 장소를 주면(상점, 0122) 그 장소의 그림을 깔고 창 뒤 덮개(scrim)로 눌러요. 그림을 못 불렀으면 바닥 그대로.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { box } from "../style/draw";
import { canvasTexture, ellipse } from "../style/gradient";
import { placeArt, stageArt, type Place } from "../stage";
import { BG, FRAME } from "./layout";

const P = tokens.provisional.palette;

export function drawBackdrop(scene: Phaser.Scene, where?: number | Place) {
  const art = typeof where === "string" ? placeArt(scene, where) : stageArt(scene, where);
  if (art) {
    const layers = typeof art === "string" ? [art] : [art.far, art.ground];
    return scene.add.container(0, 0, [
      ...layers.map((key) => scene.add.image(0, 0, key).setOrigin(0, 0)),
      box(scene.add.graphics(), 0, 0, FRAME.w, FRAME.h, 0, { fill: P.scrim }),
    ]);
  }
  const key = canvasTexture(scene, "run:bg", FRAME.w, FRAME.h, (ctx) => {
    ctx.fillStyle = P.stageLo;
    ctx.fillRect(0, 0, FRAME.w, FRAME.h);
    ellipse(ctx, FRAME.w, FRAME.h, BG, [[P.stageHi, 0], [P.floor, BG.mid], [P.stageLo, 1]]);
  });
  return scene.add.image(0, 0, key).setOrigin(0, 0);
}
