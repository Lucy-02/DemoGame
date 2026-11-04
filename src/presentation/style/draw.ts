// CSS 상자 그리기 도우미: 둥근 사각형 채움, inset box-shadow 테두리, 원.
import type * as Phaser from "phaser";
import { rgba } from "./color";

export interface BoxStyle {
  fill?: string;
  /** CSS `box-shadow: inset 0 0 0 <width> <color>`. dash를 주면 border dashed (선 길이 = 간격 = dash) */
  ring?: { width: number; color: string; dash?: number };
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
    g.lineStyle(style.ring.width, s.color, s.alpha);
    if (style.ring.dash) dashedRoundRect(g, x + k, y + k, w - 2 * k, h - 2 * k, Math.max(0, r - k), style.ring.dash);
    else g.strokeRoundedRect(x + k, y + k, w - 2 * k, h - 2 * k, Math.max(0, r - k));
  }
  return g;
}

/** 점선 둥근 테: 곧은 변은 dash 간격으로 끊고, 모서리 호는 이어 그려요 (lineStyle은 미리 정해 두세요) */
function dashedRoundRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, dash: number) {
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < len; t += dash * 2) {
      const a = t / len, b = Math.min(len, t + dash) / len;
      g.lineBetween(x0 + (x1 - x0) * a, y0 + (y1 - y0) * a, x0 + (x1 - x0) * b, y0 + (y1 - y0) * b);
    }
  };
  seg(x + r, y, x + w - r, y);
  seg(x + w, y + r, x + w, y + h - r);
  seg(x + w - r, y + h, x + r, y + h);
  seg(x, y + h - r, x, y + r);
  const arc = (cx: number, cy: number, from: number) => {
    g.beginPath();
    g.arc(cx, cy, r, from, from + Math.PI / 2);
    g.strokePath();
  };
  if (r > 0) {
    arc(x + w - r, y + r, -Math.PI / 2);
    arc(x + w - r, y + h - r, 0);
    arc(x + r, y + h - r, Math.PI / 2);
    arc(x + r, y + r, Math.PI);
  }
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
