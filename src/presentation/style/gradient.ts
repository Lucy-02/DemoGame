// CSS 그라데이션을 canvas 2D로 그대로 그려요 (재질 띠·배경용).
// linear-gradient(<deg>, …), repeating-linear-gradient, radial-gradient(circle at x% y%, … px) 타일.
import type * as Phaser from "phaser";

/** 색 멈춤: at = 0~1 비율 또는 { px } 절대 길이 */
export type Stop = [color: string, at: number | { px: number }];

/** CSS 각도(0deg = 위쪽, 시계 방향)의 그라데이션 선을 상자에 맞춰 구해요. */
function line(w: number, h: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a), dy = -Math.cos(a);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = w / 2, cy = h / 2;
  return { x0: cx - (dx * len) / 2, y0: cy - (dy * len) / 2, x1: cx + (dx * len) / 2, y1: cy + (dy * len) / 2, len };
}

const frac = (at: Stop[1], len: number) => (typeof at === "number" ? at : at.px / len);

export function linear(ctx: CanvasRenderingContext2D, w: number, h: number, deg: number, stops: Stop[], repeating = false) {
  const l = line(w, h, deg);
  const g = ctx.createLinearGradient(l.x0, l.y0, l.x1, l.y1);
  const fs = stops.map(([c, at]) => [c, frac(at, l.len)] as const);
  if (!repeating) {
    for (const [c, f] of fs) g.addColorStop(Math.min(1, Math.max(0, f)), c);
  } else {
    const period = fs[fs.length - 1][1];
    for (let k = 0; k * period < 1; k++) {
      for (const [c, f] of fs) {
        const at = k * period + f;
        if (at <= 1) g.addColorStop(at, c);
      }
    }
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** radial-gradient(circle at px% py%, stops…) 를 tw×th 타일로 반복해요. stops는 px 반지름. */
export function radialTiles(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  at: [number, number], stops: [color: string, r: number][], tile: [number, number],
) {
  const [tw, th] = tile;
  const rMax = stops[stops.length - 1][1];
  for (let ty = 0; ty < h; ty += th) {
    for (let tx = 0; tx < w; tx += tw) {
      const cx = tx + at[0] * tw, cy = ty + at[1] * th;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
      for (const [c, r] of stops) g.addColorStop(r / rMax, c);
      ctx.fillStyle = g;
      ctx.fillRect(cx - rMax, cy - rMax, rMax * 2, rMax * 2);
    }
  }
}

/** radial-gradient(<rx> <ry> at <cx> <cy>, stops…): 비율은 상자 크기 기준. 원 그라데이션을 세로로 눌러서 그려요. */
export function ellipse(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  e: { rx: number; ry: number; cx: number; cy: number }, stops: [color: string, at: number][],
) {
  const rx = w * e.rx, ry = h * e.ry;
  ctx.save();
  ctx.translate(w * e.cx, h * e.cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  for (const [c, at] of stops) g.addColorStop(at, c);
  ctx.fillStyle = g;
  ctx.fillRect(-w, -h * (rx / ry), w * 2, h * 2 * (rx / ry));
  ctx.restore();
}

/** 캔버스 텍스처를 한 번만 만들어요 (같은 key면 다시 그리지 않아요) */
export function canvasTexture(
  scene: Phaser.Scene, key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void,
): string {
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w, h)!;
    paint(tex.getContext());
    tex.refresh();
  }
  return key;
}
