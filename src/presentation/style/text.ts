// 글자 스타일과 줄 배치. 정본(브라우저)과 같은 자리에 글자가 오도록 CSS 인라인 배치 규칙을 그대로 따라요.
import type * as Phaser from "phaser";
import { rgba } from "./color";
import { FONT_STACK } from "./fonts";

/** 정본 프레임의 line-height (.frame line-height:1.25) */
export const LINE_HEIGHT = 1.25;

interface FontBox {
  ascent: number;
  descent: number;
}

const boxes = new Map<number, FontBox>();
let probe: CanvasRenderingContext2D | null = null;

/** 브라우저 인라인 상자와 같은 높이(글꼴 ascent + descent)를 재요. */
export function fontBox(px: number): FontBox {
  const hit = boxes.get(px);
  if (hit) return hit;
  probe ??= document.createElement("canvas").getContext("2d");
  if (!probe) throw new Error("canvas 2d context를 만들 수 없어요");
  probe.font = `${px}px ${FONT_STACK}`;
  const m = probe.measureText("가Hg");
  const box = { ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent };
  boxes.set(px, box);
  return box;
}

export const px = (size: string) => parseFloat(size);

/** Phaser Text 스타일. metrics를 직접 넣어 글자 상자 = 브라우저의 인라인 상자가 되게 해요. */
export function textStyle(size: string, color: string, letterSpacing = 0): Phaser.Types.GameObjects.Text.TextStyle {
  const s = px(size);
  const { ascent, descent } = fontBox(s);
  return {
    fontFamily: FONT_STACK,
    fontSize: size,
    color,
    letterSpacing,
    metrics: { ascent, descent, fontSize: ascent + descent },
  };
}

export interface Span {
  text: string;
  size: string;
  color: string;
  /** CSS margin-left / margin-right (px) */
  ml?: number;
  mr?: number;
  /** text-decoration: underline dotted (text-underline-offset px) */
  dotted?: { offset: number; color: string };
}

/** 점선 밑줄: 1px 점을 2px 간격으로 (Chrome dotted 밑줄과 같은 결) */
const DOT = { size: 1, step: 2 };

export interface PlacedLine {
  width: number;
  /** 줄 상자 높이 (CSS line box) */
  height: number;
  baseline: number;
  objects: Phaser.GameObjects.Text[];
}

/** 줄 상자의 기준선 위·아래 높이 (strut + 각 조각의 반-leading 포함) */
export function lineBox(strut: string, spans: Pick<Span, "size">[], lineHeight = LINE_HEIGHT) {
  const parts = [px(strut), ...spans.map((s) => px(s.size))].map((size) => {
    const b = fontBox(size);
    const half = (size * lineHeight - (b.ascent + b.descent)) / 2;
    return { above: b.ascent + half, below: b.descent + half };
  });
  return { above: Math.max(...parts.map((p) => p.above)), below: Math.max(...parts.map((p) => p.below)) };
}

/**
 * 한 줄에 크기가 다른 글자 조각을 기준선 맞춰 놓아요 (CSS 인라인 서식 맥락과 같은 계산).
 * strut = 부모 글자 크기. 각 조각의 줄 높이 = 크기 × lineHeight.
 */
export function inlineLine(
  scene: Phaser.Scene, x: number, top: number, strut: string, spans: Span[], lineHeight = LINE_HEIGHT,
): PlacedLine {
  const { above, below } = lineBox(strut, spans, lineHeight);
  const baseline = top + above;
  let cx = x;
  const objects = spans.map((s) => {
    cx += s.ml ?? 0;
    const t = scene.add.text(cx, baseline - fontBox(px(s.size)).ascent, s.text, textStyle(s.size, s.color));
    // Phaser Text 너비는 정수로 올림돼서, 다음 조각 위치는 실제 글자 폭으로 계산해요.
    const w = measure(s.text, s.size);
    if (s.dotted) {
      const c = rgba(s.dotted.color);
      const g = scene.add.graphics().fillStyle(c.color, c.alpha);
      for (let dx = 0; dx + DOT.size <= w; dx += DOT.step) g.fillRect(Math.round(cx + dx), Math.round(baseline + s.dotted.offset), DOT.size, DOT.size);
    }
    cx += w + (s.mr ?? 0);
    return t;
  });
  return { width: cx - x, height: above + below, baseline, objects };
}

/** 글자 한 조각의 너비만 재요 (배치 전에 가운데 정렬 계산용). */
export function measure(text: string, size: string, letterSpacing = 0): number {
  fontBox(px(size));
  probe!.font = `${size} ${FONT_STACK}`;
  // CSS letter-spacing은 글자마다 뒤에 붙어요 (마지막 글자 포함)
  return probe!.measureText(text).width + letterSpacing * [...text].length;
}

/**
 * 글자 조각들을 maxW 폭에 맞춰 줄로 나눠요 (브라우저 기본 줄바꿈: 공백과 한글 음절 사이에서 끊김).
 * 줄 끝 공백은 버려요.
 */
export function wrapSpans(spans: Span[], maxW: number): Span[][] {
  // 끊을 수 있는 단위로 쪼개기: 한글 한 음절, 공백 하나, 나머지 글자 묶음
  const units: Span[] = [];
  for (const s of spans) {
    for (const piece of s.text.match(/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]|\s|[^\s\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]+/g) ?? []) {
      units.push({ ...s, text: piece });
    }
  }
  const lines: Span[][] = [[]];
  let w = 0;
  for (const u of units) {
    const uw = measure(u.text, u.size);
    const line = lines[lines.length - 1];
    if (u.text.trim() === "") {
      if (line.length) { line.push(u); w += uw; }
      continue;
    }
    if (w + uw > maxW && line.length) {
      while (line.length && line[line.length - 1].text.trim() === "") line.pop();
      lines.push([u]);
      w = uw;
    } else {
      line.push(u);
      w += uw;
    }
  }
  // 같은 모양의 이웃 조각은 다시 합쳐요 (글자 사이 간격이 브라우저와 같아지게)
  return lines.map((line) => line.reduce<Span[]>((acc, u) => {
    const last = acc[acc.length - 1];
    if (last && last.size === u.size && last.color === u.color && !!last.dotted === !!u.dotted) last.text += u.text;
    else acc.push({ ...u });
    return acc;
  }, []));
}
