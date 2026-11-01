// 배경(.c-bg), 일러스트 자리, 그림 위 그늘(.c-scrim). 일러스트는 정본의 유체 자리표시 상자 안에 맞춰 넣고, 그림이 없는 정령은 X 상자로 비워 둬요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { transparentOf, withAlpha } from "../../style/color";
import { canvasTexture, ellipse, linear } from "../../style/gradient";
import { placeholderArt } from "../../style/placeholder";
import { ART, BG, FRAME, SCRIM } from "../layout";

const P = tokens.provisional.palette;

export function drawBackdrop(scene: Phaser.Scene) {
  const key = canvasTexture(scene, "spirits:bg", FRAME.w, FRAME.h, (ctx) => {
    ellipse(ctx, FRAME.w, FRAME.h, BG, [[P.wallHi, 0], [P.wall, BG.mid], [P.wallLo, 1]]);
  });
  return scene.add.image(0, 0, key).setOrigin(0, 0);
}

/** 일러스트 자리. 패널을 접으면 오른쪽으로 밀려요. 그림은 상자 안에 비율을 지켜 넣고 아래 가운데에 붙여요 */
export function drawArt(scene: Phaser.Scene, shifted: boolean, art?: string) {
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
  if (!art || !scene.textures.exists(art)) {
    placeholderArt(scene, body.x + dx, body.y, body.w, body.h, P.glassLine);
    return;
  }
  const img = scene.add.image(body.x + dx + body.w / 2, body.y + body.h, art).setOrigin(0.5, 1);
  img.setScale(Math.min(body.w / img.width, body.h / img.height));
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
