// 해결 순서표: 위쪽 가운데 한 줄. 정본 .rs
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box, circle } from "../../style/draw";
import { icon, loadIcon } from "../../style/icons";
import { LINE_HEIGHT, fontBox, measure, px, textStyle } from "../../style/text";
import { COPY } from "../copy";
import { ORDER as O } from "../layout";
import type { BattleVM } from "../viewmodel";

const P = tokens.palette;
const T = tokens.text.battle;



const slotW = O.slot.padX * 2 + O.numW + O.slot.gap + O.face + O.slot.gap + (O.action.size + O.action.ml);
const lineW = O.line.w + O.line.mx * 2;

export function preloadOrder(scene: Phaser.Scene, vm: BattleVM["order"]) {
  for (const s of vm.slots) {
    loadIcon(scene, s.art, O.art.w, O.art.h);
    loadIcon(scene, s.action, O.action.size - O.action.pad * 2);
  }
}

/** 한 줄 글자의 줄 상자 높이 안에서 글자 상자 위치 (CSS: 줄 높이 = 크기 × 1.25, 글자는 가운데) */
function textTopInLine(size: string) {
  const b = fontBox(px(size));
  return (px(size) * LINE_HEIGHT - (b.ascent + b.descent)) / 2;
}

export function drawOrder(scene: Phaser.Scene, vm: BattleVM["order"]) {
  const meText = COPY.myTurn;
  const nextText = `${COPY.turn} ${vm.nextTurn}`;
  const meW = O.meDot + O.meGap + measure(meText, T.orderLabel);
  const nextW = measure(nextText, T.orderLabel);
  const innerW = meW + vm.slots.length * (lineW + slotW) + lineW + nextW;
  const w = innerW + O.padX * 2;
  const x0 = O.cx - w / 2;
  const cy = O.top + O.h / 2;

  const g = scene.add.graphics();
  box(g, x0, O.top, w, O.h, O.radius, { fill: P.glassThin, ring: { width: 1, color: P.glassLine } });

  const labelH = px(T.orderLabel) * LINE_HEIGHT;
  const labelTop = cy - labelH / 2 + textTopInLine(T.orderLabel);
  let x = x0 + O.padX;

  // 내 차례: 점 + 글
  circle(g, x + O.meDot / 2, cy, O.meDot, { fill: P.ink });
  scene.add.text(x + O.meDot + O.meGap, labelTop, meText, textStyle(T.orderLabel, P.ink));
  x += meW;

  const line = () => {
    box(g, x + O.line.mx, cy - O.line.h / 2, O.line.w, O.line.h, 0, { fill: P.glassLine });
    x += lineW;
  };

  for (const s of vm.slots) {
    line();
    const top = cy - O.slot.h / 2;
    if (s.state === "now") box(g, x, top, slotW, O.slot.h, O.slot.radius, { ring: { width: O.slot.nowRing, color: P.warn } });
    let sx = x + O.slot.padX;
    const numH = px(T.orderNum) * LINE_HEIGHT;
    const numText = String(s.n);
    scene.add.text(
      sx + (O.numW - measure(numText, T.orderNum)) / 2,
      cy - numH / 2 + textTopInLine(T.orderNum),
      numText, textStyle(T.orderNum, P.ink3),
    );
    sx += O.numW + O.slot.gap;
    circle(g, sx + O.face / 2, cy, O.face, { fill: P.face });
    icon(scene, sx + (O.face - O.art.w) / 2, cy - O.art.h / 2, s.art, O.art.w, O.art.h);
    sx += O.face + O.slot.gap + O.action.ml;
    // 행동 기호: 마진 상자(13 + 위 12)가 칸 가운데 → 위로 12 밀림
    const aTop = cy - (O.action.size + O.action.mt) / 2 + O.action.mt;
    circle(g, sx + O.action.size / 2, aTop + O.action.size / 2, O.action.size, { fill: P.face });
    const inner = O.action.size - O.action.pad * 2;
    icon(scene, sx + O.action.pad, aTop + O.action.pad, s.action, inner, inner, s.state === "now" ? P.warn : P.ink2);
    x += slotW;
  }
  line();
  scene.add.text(x, labelTop, nextText, textStyle(T.orderLabel, P.ink3));
  return g;
}
