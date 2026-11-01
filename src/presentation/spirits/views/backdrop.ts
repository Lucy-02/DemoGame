// 배경(.c-bg), 일러스트, 그림 위 그늘(.c-scrim). 일러스트는 ART.upper·whole 구도로 크게 그리고, 그림이 없는 정령은 정본 유체 자리에 X 상자로 비워 둬요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { transparentOf, withAlpha } from "../../style/color";
import { canvasTexture, ellipse, linear } from "../../style/gradient";
import { placeholderArt } from "../../style/placeholder";
import { ART, BG, FRAME, SCRIM, STRIP, TOP } from "../layout";
import type { SpiritDetailVM } from "../viewmodel";

const P = tokens.provisional.palette;

export function drawBackdrop(scene: Phaser.Scene) {
  const key = canvasTexture(scene, "spirits:bg", FRAME.w, FRAME.h, (ctx) => {
    ellipse(ctx, FRAME.w, FRAME.h, BG, [[P.wallHi, 0], [P.wall, BG.mid], [P.wallLo, 1]]);
  });
  return scene.add.image(0, 0, key).setOrigin(0, 0);
}

/** 일러스트. 패널을 접으면 오른쪽으로 밀려요 */
export function drawArt(scene: Phaser.Scene, shifted: boolean, art?: SpiritDetailVM["art"]) {
  const dx = shifted ? ART.closedShift : 0;
  const { glow, body } = ART;
  // .q-phb radial-gradient(closest-side, veil 07 → transparent)
  const key = canvasTexture(scene, "spirits:art-glow", glow.d, glow.d, (ctx) => {
    const r = glow.d / 2;
    const g = ctx.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, P.veil["07"]);
    g.addColorStop(1, transparentOf(P.veil["07"]));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, glow.d, glow.d);
  });
  scene.add.image(glow.x + dx, glow.y, key).setOrigin(0, 0);
  if (!art || !scene.textures.exists(art.key)) {
    placeholderArt(scene, body.x + dx, body.y, body.w, body.h, P.glassLine);
    return;
  }
  const cx = body.x + dx + body.w / 2;
  const img = scene.add.image(0, 0, art.key).setOrigin(0, 0);
  const w = img.width, h = img.height;
  let s: number, x: number, y: number;
  if (art.frame) {
    const [fx, fy, fd] = art.frame;
    s = ART.upper.faceD / (fd * Math.max(w, h));
    x = cx - fx * w * s;
    y = ART.upper.faceY - fy * h * s;
  } else {
    const { whole } = ART;
    s = Math.min(whole.w / w, whole.h / h);
    x = cx - (w * s) / 2;
    y = whole.bottom - h * s;
  }
  img.setScale(s).setPosition(x, y);
  // 위 막대 아래, 아래 띠 위로만 (텍스처 좌표로 잘라요)
  const top = Math.max(0, (TOP.h - y) / s);
  const bottom = Math.min(h, (FRAME.h - STRIP.h - y) / s);
  img.setCrop(0, top, w, Math.max(0, bottom - top));
}

export function drawScrim(scene: Phaser.Scene) {
  const key = canvasTexture(scene, "spirits:scrim", FRAME.w, FRAME.h, (ctx) => {
    const shade = (a: number) => withAlpha(P.scrim, a);
    // CSS는 먼저 적은 레이어가 위예요. 캔버스는 나중에 그린 것이 위라서 거꾸로 그려요
    linear(ctx, FRAME.w, FRAME.h, 180, [[shade(SCRIM.top.a), 0], [shade(0), SCRIM.top.to]]);
    linear(ctx, FRAME.w, FRAME.h, 90, [[shade(SCRIM.left.a), 0], [shade(0), SCRIM.left.to]]);
    linear(ctx, FRAME.w, FRAME.h, 0, [[P.scrim, 0], [transparentOf(P.scrim), SCRIM.bottomTo]]);
  });
  return scene.add.image(0, 0, key).setOrigin(0, 0);
}
