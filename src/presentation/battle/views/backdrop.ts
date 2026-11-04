// 배경 벽(타원 방사 그라데이션) + 아래쪽 바닥 그늘. 정본 .bg, .floor
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { withAlpha } from "../../style/color";
import { canvasTexture, ellipse } from "../../style/gradient";
import { BG, FLOOR, FRAME } from "../layout";

const P = tokens.provisional.palette;
const KEY = "battle:backdrop";

export function drawBackdrop(scene: Phaser.Scene) {
  canvasTexture(scene, KEY, FRAME.w, FRAME.h, (ctx) => {
    ctx.fillStyle = P.floor;
    ctx.fillRect(0, 0, FRAME.w, FRAME.h);
    ellipse(ctx, FRAME.w, FRAME.h, BG, [[P.wallHi, 0], [P.wall, BG.mid], [P.wallLo, 1]]);

    // 바닥 그늘: --floor 색의 투명도만 바뀌어요.
    const f = ctx.createLinearGradient(0, FLOOR.top, 0, FRAME.h);
    for (const [at, a] of FLOOR.stops) f.addColorStop(at, withAlpha(P.floor, a));
    ctx.fillStyle = f;
    ctx.fillRect(0, FLOOR.top, FRAME.w, FRAME.h - FLOOR.top);
  });
  return scene.add.image(0, 0, KEY).setOrigin(0, 0);
}
