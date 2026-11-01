// 배경(.c-bg), 일러스트, 그림 위 그늘(.c-scrim). 일러스트 구도·그리기는 artFit.ts (피팅 페이지와 같은 계산)
// 그림이 없는 정령은 정본 유체 자리에 X 상자로 비워 둬요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { transparentOf, withAlpha } from "../../style/color";
import { canvasTexture, ellipse, linear } from "../../style/gradient";
import { placeholderArt } from "../../style/placeholder";
import { ART, BG, FRAME, SCRIM } from "../layout";
import { paintArt, placeArt } from "../artFit";
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
  const src = scene.textures.get(art.key).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const at = placeArt(src.width, src.height, body.x + dx + body.w / 2, art.frame, art.fit);
  const fit = [art.fit.s, art.fit.dx, art.fit.dy].join(",");
  const key2 = canvasTexture(scene, `spirits:art:${art.key}:${dx}:${fit}`, FRAME.w, FRAME.h, (ctx) => paintArt(ctx, src, at));
  scene.add.image(0, 0, key2).setOrigin(0, 0);
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
