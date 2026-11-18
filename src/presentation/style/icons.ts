// 정본에서 꺼낸 기호 SVG(public/assets/ui/icons)를 필요한 픽셀 크기로 올려요.
// 한 색 기호는 흰색으로 저장돼 있어서 틴트로 색을 입혀요.
import type * as Phaser from "phaser";
import { rgba } from "./color";
import { RES, logicalSize } from "./resolution";

export const iconKey = (id: string, w: number, h = w) => `icon:${id}@${w}x${h}`;

/** preload 단계에서 부르세요. 같은 키는 한 번만 올려요. */
export function loadIcon(scene: Phaser.Scene, id: string, w: number, h = w): string {
  const key = iconKey(id, w, h);
  if (!scene.textures.exists(key)) {
    // 그리는 배수만큼 촘촘하게 올리고, 놓이는 크기는 w×h 그대로
    const k = RES();
    scene.load.svg(key, `assets/ui/icons/${id}.svg`, { width: w * k, height: h * k });
    if (k !== 1) scene.load.once(`filecomplete-svg-${key}`, () => logicalSize(scene.textures.get(key), w, h));
  }
  return key;
}

/** 왼쪽 위 기준으로 기호를 놓아요. tint를 주면 그 색으로 칠해요. */
export function icon(
  scene: Phaser.Scene, x: number, y: number, id: string, w: number, h = w, tint?: string,
): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, iconKey(id, w, h)).setOrigin(0, 0);
  if (tint) {
    const c = rgba(tint);
    img.setTint(c.color).setAlpha(c.alpha);
  }
  return img;
}

const inks = new Map<string, { dx: number; dy: number }>();
/** 잉크 상자를 잴 때 벡터 기호를 키워 그리는 크기 */
const INK_PROBE = 240;

/** 기호 잉크(불투명한 곳) 상자의 가운데가 그림 상자 가운데에서 벗어난 양 (w 크기 기준 px) */
export function inkOffset(scene: Phaser.Scene, id: string, w: number): { dx: number; dy: number } {
  const key = iconKey(id, w);
  let o = inks.get(key);
  if (!o) {
    const S = INK_PROBE;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(scene.textures.get(key).getSourceImage() as CanvasImageSource, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S).data;
    let x0 = S, x1 = -1, y0 = S, y1 = -1;
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        if (d[(j * S + i) * 4 + 3] <= 40) continue;
        if (i < x0) x0 = i;
        if (i > x1) x1 = i;
        if (j < y0) y0 = j;
        if (j > y1) y1 = j;
      }
    }
    o = x1 < 0 ? { dx: 0, dy: 0 } : { dx: (((x0 + x1 + 1) / 2 - S / 2) * w) / S, dy: (((y0 + y1 + 1) / 2 - S / 2) * w) / S };
    inks.set(key, o);
  }
  return o;
}

/** 기호를 잉크 가운데가 w×w 상자 가운데에 오게, 픽셀에 붙여 놓아요. fit y = 세로만, xy = 가로도 */
export function iconFit(
  scene: Phaser.Scene, x: number, y: number, id: string, w: number, tint: string | undefined, fit: "y" | "xy",
): Phaser.GameObjects.Image {
  const o = inkOffset(scene, id, w);
  return icon(scene, Math.round(x - (fit === "xy" ? o.dx : 0)), Math.round(y - o.dy), id, w, w, tint);
}

/** 캔버스에 기호를 한 색으로 그려요 (구워 두는 텍스처용) */
export function paintIcon(ctx: CanvasRenderingContext2D, scene: Phaser.Scene, id: string, w: number, x: number, y: number, color: string) {
  const c = document.createElement("canvas");
  const d = Math.ceil(w * RES());
  c.width = c.height = d;
  const t = c.getContext("2d")!;
  t.drawImage(scene.textures.get(iconKey(id, w)).getSourceImage() as CanvasImageSource, 0, 0, d, d);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = color;
  t.fillRect(0, 0, d, d);
  ctx.drawImage(c, x, y, w, w);
}
