// 손패 호버 말풍선 (정본 H1 .bub): 카드 위에 설명·계산·사유·주인 줄. 카드가 바뀌면 살짝 올라오며 바뀌어요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { box } from "../style/draw";
import { gather } from "../style/gather";
import { rgba } from "../style/color";
import { shadowTexture } from "../style/shadow";
import { LINE_HEIGHT, inlineLine, lineBox, wrapSpans, type Span } from "../style/text";
import { BUBBLE as B } from "./layout";
import type { CardDetailVM, RichText } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

interface Para {
  lines: Span[][];
  strut: string;
  lh: number;
  /** .calc 위 여백 */
  rule?: boolean;
}

const rich = (r: RichText, size: string, strongSize: string, color: string, strongColor = color): Span[] =>
  r.map((s) => ({
    text: s.text,
    size: s.strong ? strongSize : size,
    color: s.strong ? strongColor : color,
    dotted: s.term ? { offset: B.termOffset, color } : undefined,
  }));

function paragraphs(d: CardDetailVM): Para[] {
  const inner = B.w - B.pad[1] - B.pad[3];
  const out: Para[] = [
    { lines: wrapSpans(rich(d.text, T.bubbleText, T.bubbleStrong, P.paperInk), inner), strut: T.bubbleText, lh: B.textLh },
  ];
  if (d.calc) {
    out.push({
      lines: wrapSpans(rich(d.calc, T.bubbleCalc, T.bubbleCalcStrong, P.bubbleSub, P.paperInk), inner),
      strut: T.bubbleCalc, lh: LINE_HEIGHT, rule: true,
    });
  }
  if (d.why) out.push({ lines: wrapSpans([{ text: d.why, size: T.bubbleWhy, color: P.bubbleWhy }], inner), strut: T.bubbleWhy, lh: LINE_HEIGHT });
  out.push({ lines: wrapSpans([{ text: d.owner, size: T.bubbleOwner, color: P.bubbleSub }], inner), strut: T.bubbleOwner, lh: LINE_HEIGHT });
  return out;
}

// 정본 .calc의 border-top은 var(--me)가 말풍선 밖에선 정의되지 않아 실제로는 안 그려져요. 위 여백만 남아요.
const ruleH = B.calcRule.padTop;
const paraH = (p: Para) =>
  (p.rule ? ruleH : 0) + p.lines.reduce((a, l) => { const b = lineBox(p.strut, l, p.lh); return a + b.above + b.below; }, 0);

/**
 * 말풍선을 그려요. (left, bottom) = 말풍선 몸통 왼쪽 아래, tipX = 꼬리 가운데 x (몸통 기준).
 * 돌려주는 Container 원점은 몸통 왼쪽 위.
 */
export function drawCardBubble(scene: Phaser.Scene, d: CardDetailVM, left: number, bottom: number, tipX: number) {
  const paras = paragraphs(d);
  const [pt, , pb, pl] = B.pad;
  const h = pt + paras.reduce((a, p) => a + paraH(p), 0) + B.gap * (paras.length - 1) + pb;
  return gather(scene, left, bottom - h, () => {
    const sh = shadowTexture(scene, B.w, h, B.radius, { ...B.shadow, color: P.bubbleShadow });
    scene.add.image(-sh.margin, -sh.margin, sh.key).setOrigin(0, 0);
    const g = scene.add.graphics();
    box(g, 0, 0, B.w, h, B.radius, { fill: P.bubble, ring: { width: B.ring, color: P.cardLine } });
    // 꼬리: 45° 돌린 정사각형. 아래 두 변에 box-shadow 1px 1px 선
    const half = (B.arrow.size * Math.SQRT2) / 2;
    const line = rgba(P.cardLine);
    g.lineStyle(B.arrow.line, line.color, line.alpha)
      .lineBetween(tipX - half, h + B.arrow.line * Math.SQRT1_2, tipX, h + half + B.arrow.line * Math.SQRT2)
      .lineBetween(tipX, h + half + B.arrow.line * Math.SQRT2, tipX + half, h + B.arrow.line * Math.SQRT1_2);
    const fill = rgba(P.bubble);
    g.fillStyle(fill.color, fill.alpha)
      .fillTriangle(tipX - half, h, tipX, h - half, tipX + half, h)
      .fillTriangle(tipX - half, h, tipX, h + half, tipX + half, h);

    let y = pt;
    paras.forEach((p, i) => {
      if (i > 0) y += B.gap;
      if (p.rule) y += ruleH;
      for (const l of p.lines) y += inlineLine(scene, pl, y, p.strut, l, p.lh).height;
    });
  });
}
