// 배경 벽(타원 방사 그라데이션) + 아래쪽 바닥 그늘. 정본 .bg, .floor
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { BG, FLOOR, FRAME } from "../layout";

const P = tokens.palette;
const KEY = "battle:backdrop";

export function drawBackdrop(scene: Phaser.Scene) {
  if (!scene.textures.exists(KEY)) {
    const tex = scene.textures.createCanvas(KEY, FRAME.w, FRAME.h)!;
    const ctx = tex.getContext();
    ctx.fillStyle = P.floor;
    ctx.fillRect(0, 0, FRAME.w, FRAME.h);

    // CSS 타원 그라데이션: 원 그라데이션을 세로로 눌러서 그려요.
    const rx = FRAME.w * BG.rx, ry = FRAME.h * BG.ry;
    ctx.save();
    ctx.translate(FRAME.w * BG.cx, FRAME.h * BG.cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, P.wallHi);
    g.addColorStop(BG.mid, P.wall);
    g.addColorStop(1, P.wallLo);
    ctx.fillStyle = g;
    ctx.fillRect(-FRAME.w, -FRAME.h * (rx / ry), FRAME.w * 2, FRAME.h * 2 * (rx / ry));
    ctx.restore();

    // 바닥 그늘: --floor 색의 투명도만 바뀌어요.
    const f = ctx.createLinearGradient(0, FLOOR.top, 0, FRAME.h);
    for (const [at, a] of FLOOR.stops) f.addColorStop(at, withAlpha(P.floor, a));
    ctx.fillStyle = f;
    ctx.fillRect(0, FLOOR.top, FRAME.w, FRAME.h - FLOOR.top);
    tex.refresh();
  }
  return scene.add.image(0, 0, KEY).setOrigin(0, 0);
}

function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
