// 적 호버 설명 (정본 .etip): 유리판 + 그림자, 이름·등급, 줄바꿈되는 설명 문단.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { inlineLine, lineBox, wrapSpans, type Span } from "../../style/text";
import { ETIP as E } from "../layout";
import type { EnemyTipVM, TipLine } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

/** CSS box-shadow 바깥 그림자를 canvas로 구워요 (canvas shadowBlur = CSS blur 반경). */
function shadowTexture(scene: Phaser.Scene, w: number, h: number): { key: string; margin: number } {
  const margin = E.shadow.blur + E.shadow.y;
  const key = `etip:shadow:${w}x${h}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w + margin * 2, h + margin * 2)!;
    const ctx = tex.getContext();
    // 판은 캔버스 밖으로 밀고 그림자만 제자리에 떨어지게 해요
    const shift = (w + margin * 2) * 2;
    ctx.shadowColor = P.tipShadow;
    ctx.shadowBlur = E.shadow.blur;
    ctx.shadowOffsetX = shift;
    ctx.shadowOffsetY = E.shadow.y;
    ctx.beginPath();
    ctx.roundRect(margin - shift, margin, w, h, E.radius);
    ctx.fill();
    tex.refresh();
  }
  return { key, margin };
}

const spans = (l: TipLine): Span[] =>
  l.map((s) => ({ text: s.text, size: s.strong ? T.tipStrong : T.tipBody, color: s.strong ? P.ink : P.ink2 }));

export function drawEnemyTip(scene: Phaser.Scene, tip: EnemyTipVM) {
  const [pt, pr, pb, pl] = E.pad;
  const title: Node = {
    t: "row", align: "center", gap: E.title.gap,
    children: [
      { t: "text", text: tip.name, size: T.tipTitle, color: P.ink, lh: E.lh },
      ...(tip.rank ? [{
        t: "row", pad: [0, E.rank.padX, 0, E.rank.padX], radius: E.rank.radius,
        style: { ring: { width: E.rank.ring, color: P.glassLine } },
        children: [{ t: "text", text: tip.rank, size: T.tipChip, color: P.ink3, lh: E.lh }],
      } as Node] : []),
    ],
  };
  // 문단(p)마다 판 폭에 맞춰 줄바꿈
  const paras = tip.lines.map((l) => wrapSpans(spans(l), E.w - pl - pr));
  const lineH = (l: Span[]) => { const b = lineBox(T.tipBody, l, E.lh); return b.above + b.below; };
  const titleH = size(title).h;
  const h = pt + titleH + paras.reduce((a, p) => a + E.gap + p.reduce((b, l) => b + lineH(l), 0), 0) + pb;

  const sh = shadowTexture(scene, E.w, h);
  scene.add.image(E.x - sh.margin, E.y - sh.margin, sh.key).setOrigin(0, 0);
  box(scene.add.graphics(), E.x, E.y, E.w, h, E.radius, { fill: P.glassD, ring: { width: E.ring, color: P.glassLine } });
  render(scene, title, E.x + pl, E.y + pt);
  let y = E.y + pt + titleH;
  for (const p of paras) {
    y += E.gap;
    for (const l of p) y += inlineLine(scene, E.x + pl, y, T.tipBody, l, E.lh).height;
  }
}
