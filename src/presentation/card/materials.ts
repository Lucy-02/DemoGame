// 재질 띠·그림 창 텍스처를 canvas로 구워요. 정본 .bnd(재질 배경 + inset 반사선·테), .winsvg
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { transparentOf } from "../style/color";
import { linear, radialTiles, type Stop } from "../style/gradient";
import type { FaceId } from "../faces";
import { HAND_CARD as C, WINDOW_PATH } from "./layout";
import type { Material } from "./viewmodel";

const P = tokens.provisional.palette;

type Layer =
  | { kind: "dots"; at: [number, number]; color: string; solid: number; fade: number; tile: [number, number] }
  | { kind: "linear" | "repeating"; deg: number; stops: Stop[] };

const PATTERN: Record<Material, Layer[]> = {
  none: [],
  fire: tokens.provisional.pattern.material.fire as unknown as Layer[],
  water: tokens.provisional.pattern.material.water as unknown as Layer[],
  wind: tokens.provisional.pattern.material.wind as unknown as Layer[],
};

export const MATERIAL_FILL: Record<Material, { fill: string; edge: string }> = {
  none: { fill: P.paper, edge: P.cardLine },
  fire: { fill: P.material.fire, edge: P.material.fireEdge },
  water: { fill: P.material.water, edge: P.material.waterEdge },
  wind: { fill: P.material.wind, edge: P.material.windEdge },
};

/** CSS 배경 레이어를 아래부터 칠해요 (목록 첫 번째가 맨 위). */
export function paintPattern(ctx: CanvasRenderingContext2D, w: number, h: number, m: Material) {
  for (const layer of [...PATTERN[m]].reverse()) {
    if (layer.kind === "dots") {
      radialTiles(ctx, w, h, layer.at, [[layer.color, 0], [layer.color, layer.solid], [transparentOf(layer.color), layer.fade]], layer.tile);
    } else {
      linear(ctx, w, h, layer.deg, layer.stops, layer.kind === "repeating");
    }
  }
}

function bottomRounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.closePath();
}

/** 손패 카드 이름 띠 텍스처 (재질 바탕 + 위 반사선 + 안쪽 테). off는 재질 없이 가라앉힘. */
export function bandTexture(scene: Phaser.Scene, m: Material, off: boolean): string {
  const key = `card:band:${m}:${off ? "off" : "on"}`;
  if (scene.textures.exists(key)) return key;
  const { w, h, radius } = C.band;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  bottomRounded(ctx, 0, 0, w, h, radius);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = off ? P.cardOffWin : MATERIAL_FILL[m].fill;
  ctx.fillRect(0, 0, w, h);
  if (!off) paintPattern(ctx, w, h, m);
  // inset 0 1px 0 반사선
  ctx.fillStyle = off ? P.bandShineOff : P.bandShine;
  ctx.fillRect(0, 0, w, 1);
  if (!off) {
    // inset 0 0 0 1px 테
    ctx.strokeStyle = MATERIAL_FILL[m].edge;
    ctx.lineWidth = 1;
    bottomRounded(ctx, 0.5, 0.5, w - 1, h - 1, radius - 0.5);
    ctx.stroke();
  }
  ctx.restore();
  tex.refresh();
  return key;
}

/** 정령별 그림 창 (정본 SVG path, 채움 + 1px 선) */
export function windowTexture(scene: Phaser.Scene, owner: FaceId, off: boolean): string {
  const key = `card:win:${owner}:${off ? "off" : "on"}`;
  if (scene.textures.exists(key)) return key;
  const { w, h } = C.win;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  const path = new Path2D(WINDOW_PATH[owner]);
  ctx.fillStyle = off ? P.cardOffWin : P.paper2;
  ctx.fill(path);
  ctx.strokeStyle = off ? P.cardOffLine : P.cardLine;
  ctx.lineWidth = 1;
  ctx.stroke(path);
  tex.refresh();
  return key;
}
