// 배경(.c-bg), 일러스트, 그림 위 그늘(.c-scrim). 일러스트는 ART.upper·whole 구도로 크게 그리고 색 번짐·아래 사라짐(ART.ambient·fade)을 더해요.
// 그림이 없는 정령은 정본 유체 자리에 X 상자로 비워 둬요.
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
  const src = scene.textures.get(art.key).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const at = place(src.width, src.height, body.x + dx + body.w / 2, art.frame);
  const key2 = canvasTexture(scene, `spirits:art:${art.key}:${dx}`, FRAME.w, FRAME.h, (ctx) => paintArt(ctx, src, at));
  scene.add.image(0, 0, key2).setOrigin(0, 0);
}

interface Placed { x: number; y: number; w: number; h: number }

/** 그림을 화면 어디에 얼마나 크게 둘지 (ART.upper: 얼굴 기준 상반신, ART.whole: 몸 전체) */
function place(w: number, h: number, cx: number, frame?: readonly [number, number, number]): Placed {
  if (frame) {
    const [fx, fy, fd] = frame;
    const s = ART.upper.faceD / (fd * Math.max(w, h));
    return { x: cx - fx * w * s, y: ART.upper.faceY - fy * h * s, w: w * s, h: h * s };
  }
  const { whole } = ART;
  const s = Math.min(whole.w / w, whole.h / h);
  return { x: cx - (w * s) / 2, y: whole.bottom - h * s, w: w * s, h: h * s };
}

/** 그림 색 번짐 → 그림(아래로 사라짐). 위 막대 아래, 아래 띠 위로만 그려요 */
function paintArt(ctx: CanvasRenderingContext2D, src: CanvasImageSource, at: Placed) {
  const top = TOP.h, bottom = FRAME.h - STRIP.h;
  const A = ART.ambient;
  const glow = document.createElement("canvas");
  glow.width = FRAME.w * A.scale;
  glow.height = FRAME.h * A.scale;
  const gc = glow.getContext("2d")!;
  gc.filter = `blur(${A.blur}px) brightness(${A.brightness})`;
  gc.drawImage(src, at.x * A.scale, at.y * A.scale, at.w * A.scale, at.h * A.scale);

  const body = document.createElement("canvas");
  body.width = FRAME.w;
  body.height = FRAME.h;
  const bc = body.getContext("2d")!;
  bc.drawImage(src, at.x, at.y, at.w, at.h);
  // 아래 띠에 걸리는 그림만 서서히 사라지게 (몸 전체가 보이는 유체는 그대로)
  if (at.y + at.h > bottom) fadeOut(bc, bottom);
  bc.globalCompositeOperation = "source-over";

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, FRAME.w, bottom - top);
  ctx.clip();
  ctx.globalAlpha = A.alpha;
  ctx.drawImage(glow, 0, 0, FRAME.w, FRAME.h);
  ctx.globalAlpha = 1;
  ctx.drawImage(body, 0, 0);
  ctx.restore();
}

function fadeOut(c: CanvasRenderingContext2D, bottom: number) {
  c.globalCompositeOperation = "destination-in";
  const fade = c.createLinearGradient(0, bottom - ART.fade, 0, bottom);
  // destination-in은 알파만 봐요 (색은 아무거나, 알파는 1 → 0)
  fade.addColorStop(0, withAlpha(P.scrim, 1));
  fade.addColorStop(1, withAlpha(P.scrim, 0));
  c.fillStyle = fade;
  // 칠하지 않은 곳은 지워지니 전체를 칠해요 (기울기 위쪽은 불투명으로 이어져요)
  c.fillRect(0, 0, FRAME.w, FRAME.h);
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
