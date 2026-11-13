// 장비 그림과 칸 (0064 Q2-A): 정령 줄 안 작은 칸, 희귀도 표식(마름모: 일반 없음 · 유니크 하나 · 전설 둘), 공명 점.
// 그림은 public/assets/equipment/<id>.webp(512px)를 쓰는 크기로 구워서 작은 자리에서도 또렷해요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { rgba, withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { canvasTexture } from "../style/gradient";
import { EQUIP_SLOT } from "./layout";
import type { EquipRarityId, EquipVM } from "./viewmodel";

const P = tokens.provisional.palette;

const artKey = (id: string) => `equip:${id}`;
export const equipArtFile = (id: string) => `assets/equipment/${id}.webp`;

/** 희귀도 표식 색 (0064 🛠 작업 가정: 카드 희귀도 보석과 같은 임시 색). 일반은 표식이 없어요 */
export const RARITY_MARK: Record<EquipRarityId, { color: string; n: number } | undefined> = {
  generic: undefined,
  exclusive: { color: P.rarity.advanced, n: 1 },
  boss: { color: P.rarity.rare, n: 2 },
};

export function preloadEquipArt(scene: Phaser.Scene, ids: readonly string[]) {
  for (const id of ids) if (!scene.textures.exists(artKey(id))) scene.load.image(artKey(id), equipArtFile(id));
}

/** w×h 상자 안에 비율을 지켜 맞춘 그림 (CSS background: center/contain) */
export function drawEquipArt(scene: Phaser.Scene, id: string, x: number, y: number, w: number, h: number, alpha = 1) {
  if (!scene.textures.exists(artKey(id))) return undefined;
  const src = scene.textures.get(artKey(id)).getSourceImage() as HTMLImageElement;
  const key = canvasTexture(scene, `${artKey(id)}@${w}x${h}`, w, h, (ctx) => {
    const k = Math.min(w / src.width, h / src.height);
    const dw = src.width * k, dh = src.height * k;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  });
  return scene.add.image(x, y, key).setOrigin(0, 0).setAlpha(alpha);
}

/** 마름모 표식. (x, y) = 첫 마름모 상자의 왼쪽 위. outline = 바탕과 떼어 놓는 바깥 테 색 */
export function drawRarityMark(
  g: Phaser.GameObjects.Graphics, rarity: EquipRarityId, x: number, y: number,
  m: { d: number; outline: number; step: number } = EQUIP_SLOT.mark, outline: string = withAlpha(P.glass, 1),
) {
  const mark = RARITY_MARK[rarity];
  if (!mark) return;
  const diamond = (cx: number, cy: number, r: number, color: string) => {
    const c = rgba(color);
    g.fillStyle(c.color, c.alpha).fillTriangle(cx - r, cy, cx, cy - r, cx + r, cy).fillTriangle(cx - r, cy, cx, cy + r, cx + r, cy);
  };
  const r = (m.d * Math.SQRT2) / 2;
  for (let i = 0; i < mark.n; i++) {
    const cx = x + m.d / 2 + i * m.step, cy = y + m.d / 2;
    diamond(cx, cy, r + m.outline * Math.SQRT2, outline);
    diamond(cx, cy, r, mark.color);
  }
}

/** 공명 점: 켜진 점은 채우고 나머지는 테만. vertical이면 아래에서 위로 쌓아요. (x, y) = 묶음 왼쪽 위 */
export function drawPips(
  g: Phaser.GameObjects.Graphics, item: Pick<EquipVM, "resonance" | "cap">, x: number, y: number,
  p: { d: number; gap: number; ring: number; offLine: number }, vertical: boolean,
) {
  for (let i = 0; i < item.cap; i++) {
    const at = vertical ? item.cap - 1 - i : i;
    const cx = x + p.d / 2 + (vertical ? 0 : at * (p.d + p.gap));
    const cy = y + p.d / 2 + (vertical ? at * (p.d + p.gap) : 0);
    circle(g, cx, cy, p.d, i < item.resonance ? { fill: P.ink2 } : { ring: { width: p.ring, color: withAlpha(P.ink, p.offLine) } });
  }
}
export const pipsSize = (cap: number, p: { d: number; gap: number }) => cap * p.d + Math.max(0, cap - 1) * p.gap;

export interface SlotDraw {
  /** 칸에 든 장비 (ghost면 받을 장비가 비쳐 보여요) */
  item?: EquipVM | null;
  /** cand: 받을 수 있는 칸 (점선). ghost: 받을 장비가 비친 칸 */
  state?: "cand" | "ghost";
  /** 포인터가 올라와 있어요 */
  hot?: boolean;
  /** 이 장비를 내려놓고 받아요 */
  drop?: EquipVM;
}

/** 장비 칸 하나 (왼쪽 위 x, y) */
export function drawEquipSlot(scene: Phaser.Scene, x: number, y: number, s: SlotDraw) {
  const K = EQUIP_SLOT;
  const g = scene.add.graphics();
  if (s.hot) {
    const o = K.hot.outer;
    box(g, x - o, y - o, K.size + o * 2, K.size + o * 2, K.radius + o, { ring: { width: o, color: withAlpha(P.accHi, K.hot.alpha) } });
  }
  const picked = s.state !== undefined;
  box(g, x, y, K.size, K.size, K.radius, {
    fill: s.state === "ghost" ? P.pvFill : s.item ? P.veil["05"] : undefined,
    ring: picked ? { width: K.ring, color: P.accHi, dash: K.dash }
      : s.item ? { width: K.ring, color: P.veil["20"] }
      : { width: K.ring, color: withAlpha(P.ink, K.emptyLine), dash: K.dash },
  });
  if (!s.item) return;
  drawEquipArt(scene, s.item.id, x + K.art.x, y + K.art.y, K.art.w, K.art.h, s.state === "ghost" ? K.ghostArt : 1);
  const over = scene.add.graphics();
  drawPips(over, s.item, x + K.size - K.pip.right - K.pip.d, y + (K.size - pipsSize(s.item.cap, K.pip)) / 2, K.pip, true);
  drawRarityMark(over, s.item.rarity, x + K.mark.x, y + K.mark.y);
  if (s.drop) {
    const O = K.old;
    const ox = x + K.size + O.out - O.d, oy = y + K.size + O.out - O.d;
    circle(over, ox + O.d / 2, oy + O.d / 2, O.d, { fill: P.stageHi });
    drawEquipArt(scene, s.drop.id, ox + O.inset, oy + O.inset, O.d - O.inset * 2, O.d - O.inset * 2, O.alpha);
    const top = scene.add.graphics();
    circle(top, ox + O.d / 2, oy + O.d / 2, O.d, { ring: { width: K.ring, color: P.danger } });
    const c = rgba(P.danger), k = (O.d / 2) * Math.SQRT1_2;
    top.lineStyle(O.line, c.color, c.alpha).lineBetween(ox + O.d / 2 - k, oy + O.d / 2 + k, ox + O.d / 2 + k, oy + O.d / 2 - k);
  }
}
