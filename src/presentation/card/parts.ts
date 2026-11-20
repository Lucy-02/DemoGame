// 카드 두 얼굴(HandCard · BigCard)이 같이 쓰는 조각: 비용 동전, 수치 줄, 키운 카드 또렷하게 하기, 빈 얼굴.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { canvasTexture } from "../style/gradient";
import { iconKey, loadIcon } from "../style/icons";
import { RES, createCanvas } from "../style/resolution";
import { HAND_CARD } from "./layout";
import type { CardVM, CardValueVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

export const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

const sharpSize = (w: number, scale: number) => Math.round(w * scale);
// 기호 텍스처는 이미 배수만큼 촘촘해요(style/icons). 키운 카드는 그 위에 키운 만큼 더 촘촘한 것으로 바꿔요
const ICON_KEY = /^icon:(.+)@([\d.]+)x([\d.]+)$/;

/** 기호를 쓰는 크기로, 키운 배율이 있으면 그 크기로도 불러 둬요 */
export function loadIcons(scene: Phaser.Scene, icons: [id: string, w: number][], scales: number[]) {
  for (const [id, w] of icons) {
    loadIcon(scene, id, w);
    for (const s of scales) if (s !== 1) loadIcon(scene, id, sharpSize(w, s));
  }
}

/** 키운 카드에서 글자와 기호를 화면 크기에 맞는 해상도로 바꿔요 (구운 그림은 처음부터 그 크기로 구워요) */
export function sharpen(scene: Phaser.Scene, root: Phaser.GameObjects.Container, scale: number) {
  for (const o of root.list) {
    if (o instanceof Phaser.GameObjects.Container) sharpen(scene, o, scale);
    else if (o instanceof Phaser.GameObjects.Text) o.setResolution(Math.ceil(scale * RES()));
    else if (o instanceof Phaser.GameObjects.Image) {
      const m = ICON_KEY.exec(o.texture.key);
      if (!m) continue;
      const w = Number(m[2]), h = Number(m[3]);
      const key = iconKey(m[1], sharpSize(w, scale), sharpSize(h, scale));
      if (scene.textures.exists(key)) o.setTexture(key).setDisplaySize(w, h);
    }
  }
}

/** 비용 동전. 마력이 모자라면 붉은 테와 붉은 숫자. 못 내는 카드에서도 흐리지 않아요 (0043) */
export function drawCost(scene: Phaser.Scene, c: CardVM, x: number, y: number, K: { x: number; y: number; d: number; ring: number; shortRing: number }) {
  const cx = x + K.x + K.d / 2, cy = y + K.y + K.d / 2;
  circle(scene.add.graphics(), cx, cy, K.d, {
    fill: P.mana, ring: c.costShort ? { width: K.shortRing, color: P.danger } : { width: K.ring, color: P.veil["50"] },
  });
  const n = text(String(c.cost), T.cardCost, c.costShort ? P.danger : P.manaInk, { lh: 1, bold: true });
  const s = size(n);
  render(scene, n, cx - s.w / 2, cy - s.h / 2);
}

/** 수치 줄: 기호 + 최종 수치 (연타는 ×N). 오른 값은 숫자 색으로 알려요 (0161: ▲ 대신) */
export function valuesRow(values: CardValueVM[], sz: string, K: { icon: number; gap: number; between: number }): Node {
  return {
    t: "row", align: "center", gap: K.between,
    children: values.map((v): Node => ({
      t: "row", align: "center", gap: K.gap,
      children: [
        { t: "icon", id: v.icon, w: K.icon, h: K.icon, tint: P.ink2 },
        text(String(v.n), sz, v.up ? P.ok : P.ink, { lh: 1, bold: true }),
        ...(v.mult ? [text(`×${v.mult}`, T.cardMult, v.up ? P.ok : P.ink, { lh: 1 })] : []),
      ],
    })),
  };
}

const NO_FACE = "card:no-face";

/** 얼굴 그림이 없다는 표시 텍스처 (1×1 빈 칸). 그림 없는 정령의 구운 얼굴(spiritArt.bakeSpiritFace)도 같은 크기예요 */
export function noFace(scene: Phaser.Scene): string {
  if (!scene.textures.exists(NO_FACE)) canvasTexture(scene, NO_FACE, 1, 1, () => {});
  return NO_FACE;
}

export function isBlankFace(scene: Phaser.Scene, key: string): boolean {
  if (!scene.textures.exists(key)) return true;
  return (scene.textures.get(key).getSourceImage() as { width: number }).width <= 1;
}

/** 집은(고른) 카드 바깥 테: 카드 상자에서 offset 띄우고 width 굵기, 모서리는 border-radius + offset 기준으로 둥글게.
 *  WebGL 선은 둥근 모서리가 거칠어서 canvas에 구워요. 카드 왼쪽 위에서 (offset + width)만큼 바깥에 놓아요 */
export function heldOutlineTexture(scene: Phaser.Scene, w: number, h: number, radius: number): string {
  const key = `card:held-outline:${w}x${h}`;
  if (scene.textures.exists(key)) return key;
  const { width, offset } = HAND_CARD.held;
  const m = offset + width;
  const tex = createCanvas(scene, key, w + m * 2, h + m * 2);
  const ctx = tex.getContext();
  ctx.strokeStyle = P.accHi;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.roundRect(width / 2, width / 2, w + m * 2 - width, h + m * 2 - width, radius + offset + width / 2);
  ctx.stroke();
  tex.refresh();
  return key;
}
