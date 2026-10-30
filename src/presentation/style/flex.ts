// 아주 작은 flexbox. 정본 CSS의 알약·줄·판(row/column)을 같은 규칙으로 재고 그려요.
// 지원: 가로/세로, gap, padding, 고정 크기, align(center·baseline·start·stretch), space-between,
// flex:1(grow), margin-left:auto, 둥근 바탕·inset 테두리. 글자 항목의 상자 = CSS 줄 상자(크기 × 1.25).
import type * as Phaser from "phaser";
import { box, circle, type BoxStyle } from "./draw";
import { icon as drawIcon } from "./icons";
import { rgba } from "./color";
import { LINE_HEIGHT, fontBox, measure, px, strikeLine, textStyle } from "./text";

interface Margins {
  ml?: number | "auto";
  mr?: number;
  mt?: number;
  mb?: number;
  /** align-self (가로 줄 안에서만) */
  self?: "start" | "end";
}

export interface TextNode extends Margins {
  t: "text";
  text: string;
  size: string;
  color: string;
  /** 고정 너비 안에서 가운데 정렬 (text-align:center + width) */
  w?: number;
  /** line-height 배수 (기본 1.25) */
  lh?: number;
  /** letter-spacing (px) */
  ls?: number;
  /** text-decoration: line-through. 색을 안 주면 글자색, 굵기를 안 주면 글꼴 값 */
  strike?: { color?: string; width?: number };
}

export interface IconNode extends Margins {
  t: "icon";
  id: string;
  w: number;
  h: number;
  tint?: string;
}

export interface ImageNode extends Margins {
  t: "image";
  key: string;
  w: number;
  h: number;
  round?: boolean;
  /** CSS box-shadow 0 0 0 <w> <color> (바깥 테) */
  outline?: { width: number; color: string };
}

/** 그림만 그리는 빈 상자 (막대·칸·점 등). draw가 x,y,w,h를 받아요. */
export interface BlockNode extends Margins {
  t: "block";
  w: number;
  h: number;
  grow?: boolean;
  draw?: (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) => void;
}

export interface BoxNode extends Margins {
  t: "row" | "col";
  children: Node[];
  gap?: number;
  pad?: [top: number, right: number, bottom: number, left: number];
  w?: number;
  h?: number;
  minH?: number;
  grow?: boolean;
  align?: "center" | "baseline" | "start" | "stretch" | "end";
  justify?: "start" | "between" | "center";
  radius?: number;
  /** 원형 바탕 (border-radius:50%) */
  round?: boolean;
  style?: BoxStyle;
}

export type Node = TextNode | IconNode | ImageNode | BlockNode | BoxNode;

interface Size {
  w: number;
  h: number;
  /** 위에서 첫 기준선까지 (없으면 아래 끝) */
  base: number;
}

const ml = (n: Node) => (typeof n.ml === "number" ? n.ml : 0);
const outerW = (n: Node, s: Size) => s.w + ml(n) + (n.mr ?? 0);
const outerH = (n: Node, s: Size) => s.h + (n.mt ?? 0) + (n.mb ?? 0);

export function size(n: Node): Size {
  switch (n.t) {
    case "text": {
      const fs = px(n.size);
      const b = fontBox(fs);
      const h = fs * (n.lh ?? LINE_HEIGHT);
      return { w: n.w ?? measure(n.text, n.size, n.ls), h, base: (h - (b.ascent + b.descent)) / 2 + b.ascent };
    }
    case "icon":
    case "image":
    case "block":
      return { w: n.w, h: n.h, base: n.h };
    default: {
      const [pt, pr, pb, pl] = n.pad ?? [0, 0, 0, 0];
      const gap = n.gap ?? 0;
      const kids = n.children.map(size);
      if (n.t === "row") {
        const inner = n.children.reduce((a, c, i) => a + outerW(c, kids[i]), 0) + gap * Math.max(0, kids.length - 1);
        let contentH: number, base: number;
        if (n.align === "baseline") {
          const above = Math.max(...n.children.map((c, i) => kids[i].base + (c.mt ?? 0)));
          const below = Math.max(...n.children.map((c, i) => outerH(c, kids[i]) - kids[i].base - (c.mt ?? 0)));
          contentH = above + below;
          base = pt + above;
        } else {
          contentH = Math.max(0, ...n.children.map((c, i) => outerH(c, kids[i])));
          base = pt + (kids[0]?.base ?? contentH);
        }
        // CSS height는 내용이 넘쳐도 그대로 (넘친 항목은 가운데 기준으로 위아래로 삐져나와요)
        const h = n.h ?? Math.max(n.minH ?? 0, contentH + pt + pb);
        if (n.align !== "baseline" && n.align !== "start" && kids[0]) {
          base = pt + (h - pt - pb - outerH(n.children[0], kids[0])) / 2 + (n.children[0].mt ?? 0) + kids[0].base;
        }
        return { w: n.w ?? inner + pl + pr, h, base };
      }
      const inner = n.children.reduce((a, c, i) => a + outerH(c, kids[i]), 0) + gap * Math.max(0, kids.length - 1);
      const w = n.w ?? Math.max(0, ...n.children.map((c, i) => outerW(c, kids[i]))) + pl + pr;
      const h = n.h ?? Math.max(n.minH ?? 0, inner + pt + pb);
      return { w, h, base: pt + (kids[0] ? (n.children[0].mt ?? 0) + kids[0].base : 0) };
    }
  }
}

/** (x, y) = 노드 상자의 왼쪽 위 (마진 바깥 아님). w·h를 주면 그 크기로 늘려요(stretch·grow). */
export function place(
  scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, n: Node, x: number, y: number, w?: number, h?: number,
): void {
  const s = size(n);
  const W = w ?? s.w, H = h ?? s.h;
  switch (n.t) {
    case "text": {
      const b = fontBox(px(n.size));
      const top = y + (H - (b.ascent + b.descent)) / 2;
      const tw = measure(n.text, n.size, n.ls);
      const tx = n.w ? x + (n.w - tw) / 2 : x;
      scene.add.text(tx, top, n.text, textStyle(n.size, n.color, n.ls));
      if (n.strike) {
        const st = strikeLine(px(n.size), n.strike.width);
        const c = rgba(n.strike.color ?? n.color);
        // 취소선은 글자 위에 (같은 Graphics면 글자 아래로 가요)
        scene.add.graphics().fillStyle(c.color, c.alpha).fillRect(tx, top + b.ascent - st.center - st.width / 2, tw, st.width);
      }
      return;
    }
    case "icon":
      drawIcon(scene, x, y, n.id, n.w, n.h, n.tint);
      return;
    case "image": {
      const key = n.round ? roundTexture(scene, n.key, W) : n.key;
      scene.add.image(x + W / 2, y + H / 2, key).setDisplaySize(W, H);
      if (n.outline) {
        // 바깥 테: 그림 뒤가 아니라 위에 얇게 둘러요 (CSS box-shadow 0 0 0 w)
        circle(g, x + W / 2, y + H / 2, W + n.outline.width * 2, { ring: n.outline });
      }
      return;
    }
    case "block":
      n.draw?.(g, x, y, W, H);
      return;
  }
  // 상자 바탕
  if (n.style) {
    if (n.round) circle(g, x + W / 2, y + H / 2, W, n.style);
    else box(g, x, y, W, H, n.radius ?? 0, n.style);
  }
  const [pt, pr, pb, pl] = n.pad ?? [0, 0, 0, 0];
  const gap = n.gap ?? 0;
  const kids = n.children.map(size);
  const innerW = W - pl - pr, innerH = H - pt - pb;

  if (n.t === "row") {
    const fixed = n.children.reduce((a, c, i) => a + (c.t !== "text" && "grow" in c && c.grow ? ml(c) + (c.mr ?? 0) : outerW(c, kids[i])), 0)
      + gap * Math.max(0, kids.length - 1);
    const growers = n.children.filter((c) => "grow" in c && c.grow).length;
    const autoIdx = n.children.findIndex((c) => c.ml === "auto");
    const free = Math.max(0, innerW - fixed);
    const growW = growers ? free / growers : 0;
    let between = 0, cx = x + pl;
    if (!growers && autoIdx < 0) {
      if (n.justify === "between" && kids.length > 1) between = free / (kids.length - 1);
      if (n.justify === "center") cx += free / 2;
    }
    const lineBase = n.align === "baseline" ? size(n).base - pt : 0;
    n.children.forEach((c, i) => {
      if (i === autoIdx && !growers) cx += free;
      cx += ml(c);
      const cw = "grow" in c && c.grow ? growW : kids[i].w;
      let cy: number;
      let ch = kids[i].h;
      if (c.self === "start") cy = y + pt + (c.mt ?? 0);
      else if (c.self === "end") cy = y + pt + innerH - kids[i].h - (c.mb ?? 0);
      else if (n.align === "baseline") cy = y + pt + lineBase - kids[i].base;
      else if (n.align === "start") cy = y + pt + (c.mt ?? 0);
      else if (n.align === "stretch") { cy = y + pt; ch = innerH; }
      else cy = y + pt + (innerH - outerH(c, kids[i])) / 2 + (c.mt ?? 0);
      place(scene, g, c, cx, cy, cw, ch);
      cx += cw + (c.mr ?? 0) + gap + between;
    });
    return;
  }
  // col
  let cy = y + pt;
  n.children.forEach((c, i) => {
    cy += c.mt ?? 0;
    const stretch = n.align === "stretch" || n.align === undefined;
    const cw = stretch && c.t !== "text" && c.t !== "icon" && c.t !== "image" ? innerW - ml(c) - (c.mr ?? 0) : kids[i].w;
    const cx = n.align === "center" ? x + pl + (innerW - outerW(c, kids[i])) / 2 + ml(c)
      : n.align === "end" ? x + pl + innerW - kids[i].w - (c.mr ?? 0)
      : x + pl + ml(c);
    place(scene, g, c, cx, cy, cw, kids[i].h);
    cy += kids[i].h + (c.mb ?? 0) + gap;
  });
}

/** 그림을 원으로 잘라 지름 d 픽셀 텍스처로 만들어요 (object-fit:cover). WebGL에선 기하 마스크가 안 돼서 미리 구워요. */
function roundTexture(scene: Phaser.Scene, key: string, d: number): string {
  const out = `${key}@round${d}`;
  if (scene.textures.exists(out)) return out;
  const src = scene.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const tex = scene.textures.createCanvas(out, d, d)!;
  const ctx = tex.getContext();
  const s = Math.max(d / src.width, d / src.height);
  ctx.beginPath();
  ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(src, (d - src.width * s) / 2, (d - src.height * s) / 2, src.width * s, src.height * s);
  tex.refresh();
  return out;
}

/** 노드를 그리고 크기를 돌려줘요. */
export function render(scene: Phaser.Scene, n: Node, x: number, y: number) {
  const g = scene.add.graphics();
  const s = size(n);
  place(scene, g, n, x, y);
  return { g, ...s };
}
