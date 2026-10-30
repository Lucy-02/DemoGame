// CSS 상자 그리기 도우미: 둥근 사각형 채움, inset box-shadow 테두리, 원.
import type * as Phaser from "phaser";
import { rgba } from "./color";

export interface BoxStyle {
  fill?: string;
  /** CSS `box-shadow: inset 0 0 0 <width> <color>` */
  ring?: { width: number; color: string };
}

export function box(
  g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, radius: number, style: BoxStyle,
) {
  const r = Math.min(radius, w / 2, h / 2);
  if (style.fill) {
    const f = rgba(style.fill);
    // 반지름 0은 fillRect로 (둥근 사각형 경로는 1px 높이에서 일부만 칠해져요)
    if (r > 0) g.fillStyle(f.color, f.alpha).fillRoundedRect(x, y, w, h, r);
    else g.fillStyle(f.color, f.alpha).fillRect(x, y, w, h);
  }
  if (style.ring) {
    const s = rgba(style.ring.color);
    const k = style.ring.width / 2;
    g.lineStyle(style.ring.width, s.color, s.alpha).strokeRoundedRect(x + k, y + k, w - 2 * k, h - 2 * k, Math.max(0, r - k));
  }
  return g;
}

export function circle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, d: number, style: BoxStyle) {
  if (style.fill) {
    const f = rgba(style.fill);
    g.fillStyle(f.color, f.alpha).fillCircle(cx, cy, d / 2);
  }
  if (style.ring) {
    const s = rgba(style.ring.color);
    g.lineStyle(style.ring.width, s.color, s.alpha).strokeCircle(cx, cy, d / 2 - style.ring.width / 2);
  }
  return g;
}
