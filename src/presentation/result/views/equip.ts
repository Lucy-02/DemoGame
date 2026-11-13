// 정예 장비 줄(왼쪽 열, 카드 아래)과 장비 말풍선 (0051 자리 · 0064 Q2-A 모양).
// 화면에 늘 보이는 것은 그림 · 이름 · 희귀도 · 얻는 수치뿐이고, 달라지는 것은 말풍선 하나에만 나와요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { createHandCard } from "../../card/HandCard";
import { HAND_CARD } from "../../card/layout";
import { cardWithFace } from "../../run/cards";
import { COPY as RUN_COPY, STAT_ICON } from "../../run/copy";
import { RARITY_MARK, drawEquipArt, drawPips, drawRarityMark, pipsSize } from "../../run/equip";
import { FRAME } from "../../run/layout";
import type { EquipVM, LaneVM } from "../../run/viewmodel";
import { P, text } from "../../spirits/views/parts";
import { rgba, withAlpha } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { shadowTexture } from "../../style/shadow";
import { COPY } from "../copy";
import { EQUIP_TIP, STRIP } from "../layout";
import type { EquipOfferVM, EquipStatId, EquipTipVM, StatChangeVM } from "../viewmodel";

const T = tokens.provisional.text.result;
const TIP = EQUIP_TIP;

/** HP는 회복 기호를 임시로 빌려요 (TODO_ICON) */
const ICON: Record<EquipStatId, string> = { ...STAT_ICON, hp: "fx-heal" };
const COLOR: Record<EquipStatId, string> = { ...P.stat, hp: P.ink3 };

export const EQUIP_ICONS = (Object.values(ICON) as string[]).flatMap((id) => [[id, STRIP.gain.icon], [id, TIP.stat.icon]] as const);

type Handlers = { click?: () => void; over?: () => void; out?: () => void };

/** 장비 줄. on = 지금 장비를 고를 차례 (카드를 받거나 넘긴 뒤) */
export function drawEquipStrip(scene: Phaser.Scene, offer: EquipOfferVM, on: boolean, handlers: Handlers) {
  const S = STRIP;
  const g = scene.add.graphics();
  if (on) {
    const o = S.hot.outer;
    box(g, S.x - o, S.y - o, S.w + o * 2, S.h + o * 2, S.radius + o, { ring: { width: o, color: withAlpha(P.accHi, S.hot.alpha) } });
  }
  box(g, S.x, S.y, S.w, S.h, S.radius, { fill: on ? P.glass : withAlpha(P.glass, S.off), ring: { width: 1, color: on ? P.accHi : P.glassLine } });
  const tx = S.x + S.padL, ty = S.y + (S.h - S.tile.size) / 2;
  box(g, tx, ty, S.tile.size, S.tile.size, S.tile.radius, { fill: P.veil["05"], ring: { width: 1, color: P.veil["20"] } });
  const art = S.tile.size - S.tile.inset * 2;
  drawEquipArt(scene, offer.item.id, tx + S.tile.inset, ty + S.tile.inset, art, art);
  drawRarityMark(scene.add.graphics(), offer.item.rarity, tx - 5, ty - 5);
  const label: Node = {
    t: "col", gap: S.textGap,
    children: offer.item.name
      ? [text(offer.item.name, T.equipName, P.ink), text(offer.item.rarityName, T.equipMeta, P.ink3)]
      : [text(offer.item.rarityName, T.equipName, P.ink)],
  };
  render(scene, label, tx + S.tile.size + S.gap, S.y + (S.h - size(label).h) / 2);
  const gain: Node = {
    t: "row", gap: S.gain.between, align: "center",
    children: offer.gain.map((c): Node => ({
      t: "row", gap: S.gain.gap, align: "center",
      children: [
        { t: "icon", id: ICON[c.stat], w: S.gain.icon, h: S.gain.icon, tint: COLOR[c.stat] },
        text(RUN_COPY.delta(c.delta), T.stat, c.delta < 0 ? P.danger : P.ink3),
      ],
    })),
  };
  const gs = size(gain);
  render(scene, gain, S.x + S.w - S.padR - gs.w, S.y + (S.h - gs.h) / 2);
  const zone = scene.add.zone(S.x, S.y, S.w, S.h).setOrigin(0, 0).setInteractive();
  if (handlers.over) zone.on("pointerover", handlers.over);
  if (handlers.out) zone.on("pointerout", handlers.out);
}

/** 수치 한 줄: 기호 + a→b (받을 정령이 없으면 증감). 이전 값은 작고 흐리게, 이후 값이 주인공이에요 (Lucy 2026-11-13) */
function statRow(c: StatChangeVM): Node {
  const neg = c.delta < 0;
  const after = neg ? P.danger : P.ink;
  const value: Node[] = c.from === undefined || c.to === undefined
    ? [text(RUN_COPY.delta(c.delta), T.tipStat, after)]
    : [text(`${c.from}${RUN_COPY.arrow}`, T.was, P.ink3Spirit), text(String(c.to), T.tipStat, after)];
  return {
    t: "row", gap: TIP.stat.iconGap, align: "center",
    children: [
      { t: "icon", id: ICON[c.stat], w: TIP.stat.icon, h: TIP.stat.icon, tint: neg ? P.danger : COLOR[c.stat] },
      { t: "row", align: "baseline", children: value },
    ],
  };
}

const para = (s: string, w: number, color: string, extra: Partial<Node> = {}): Node =>
  ({ ...text(s, T.tipBody, color, { lh: TIP.line.lh, wrap: w, keepAll: true }), ...extra } as Node);

function head(scene: Phaser.Scene, item: EquipVM, x: number, y: number, w: number): number {
  const H = TIP.head;
  const mark = RARITY_MARK[item.rarity];
  const markW = mark ? H.tag.mark.d + (mark.n - 1) * H.tag.mark.step : 0;
  const tag: Node = {
    t: "row", pad: [H.tag.padY, H.tag.padX, H.tag.padY, H.tag.padX], radius: H.tag.radius, gap: H.tag.gap, align: "center",
    style: { ring: { width: 1, color: P.veil["20"] } },
    children: [
      ...(mark ? [{ t: "block", w: markW, h: H.tag.mark.d, draw: (g, bx, by) => drawRarityMark(g, item.rarity, bx, by, H.tag.mark) } as Node] : []),
      text(item.rarityName, T.tipTag, P.ink2),
    ],
  };
  const row: Node = {
    t: "row", w, gap: H.gap, align: "center",
    children: [
      { t: "block", w: H.thumb, h: H.thumb },
      ...(item.name ? [text(item.name, T.tipTitle, P.ink)] : []),
      tag,
      { t: "block", ml: "auto", w: pipsSize(item.cap, H.pip), h: H.pip.d, draw: (g, bx, by) => drawPips(g, item, bx, by, H.pip, false) },
    ],
  };
  const s = size(row);
  render(scene, row, x, y);
  drawEquipArt(scene, item.id, x, y + (s.h - H.thumb) / 2, H.thumb, H.thumb);
  return s.h;
}

/** 말풍선 몸: 위에서 아래로 쌓을 조각. draw는 (x, y)에 그리고 높이를 돌려줘요 */
type Piece = { mt: number; h: number; draw: (x: number, y: number) => void };

const piece = (scene: Phaser.Scene, node: Node, mt: number): Piece => ({ mt, h: size(node).h, draw: (x, y) => { render(scene, node, x, y); } });

function body(scene: Phaser.Scene, tip: EquipTipVM, inner: number, owner?: LaneVM): Piece[] {
  const out: Piece[] = [];
  if (tip.lose) {
    const W = TIP.two;
    const colW = (inner - 1) / 2 - W.colPad;
    const sign = (label: string, color: string, thumb?: EquipVM): Node => ({
      t: "row", h: W.sign, gap: W.signGap, align: "center",
      children: [...(thumb ? [{ t: "block", w: W.thumb, h: W.thumb } as Node] : []), text(label, T.tipTitle, color)],
    });
    const get: Node = {
      t: "col", w: colW, gap: W.gap,
      children: [sign(COPY.gain, P.ok), ...tip.stats.map(statRow), ...tip.lines.map((l) => para(l, colW, P.ink2))],
    };
    const lose: Node = {
      t: "col", w: colW, gap: W.gap,
      children: [
        sign(COPY.lose, P.danger, tip.lose.item), ...tip.lose.stats.map(statRow),
        ...(tip.lose.back ? [para(tip.lose.back, colW, P.ink2)] : []),
        ...tip.lose.lines.map((l) => para(l, colW, P.ink3Spirit, { strike: {} })),
      ],
    };
    const h = Math.max(size(get).h, size(lose).h);
    const lost = tip.lose.item;
    out.push({
      mt: W.mt, h,
      draw: (x, y) => {
        render(scene, get, x, y);
        const lx = x + colW + W.colPad;
        box(scene.add.graphics(), lx, y, 1, h, 0, { fill: P.glassLine });
        render(scene, lose, lx + 1 + W.colPad, y);
        drawEquipArt(scene, lost.id, lx + 1 + W.colPad, y, W.thumb, W.thumb, W.thumbAlpha);
      },
    });
    out.push(piece(scene, para(COPY.dropWarn, inner, P.danger), TIP.line.mt));
    return out;
  }
  if (tip.stats.length) out.push(piece(scene, { t: "row", gap: TIP.stat.gap, align: "center", children: tip.stats.map(statRow) }, TIP.stat.mt));
  if (tip.swap) {
    const { from, to } = tip.swap;
    const arrow = text(RUN_COPY.arrow, T.tipStat, P.accHi);
    const as = size(arrow);
    out.push({
      mt: TIP.swap.mt, h: HAND_CARD.h,
      draw: (x, y) => {
        // 이전 카드는 작고 흐리게, 아래를 맞춰요
        const k = TIP.swap.wasScale;
        // 키운(줄인) 카드는 원래 상자의 아래 가운데를 기준으로 놓여요
        const was = createHandCard(scene, cardWithFace(scene, from, owner, k), x - (HAND_CARD.w * (1 - k)) / 2, y, { showRarity: true, scale: k });
        was.opacity = TIP.swap.was;
        const ax = x + HAND_CARD.w * k + TIP.swap.gap;
        render(scene, arrow, ax, y + (HAND_CARD.h - as.h) / 2);
        createHandCard(scene, cardWithFace(scene, to, owner), ax + as.w + TIP.swap.gap, y, { showRarity: true });
      },
    });
  }
  for (const l of tip.lines) out.push(piece(scene, para(l, inner, P.ink2), TIP.line.mt));
  if (tip.note) out.push(piece(scene, para(tip.note, inner, P.ink3Spirit), TIP.line.mt));
  return out;
}

/** 말풍선을 놓을 자리. lane: 정령 줄 왼쪽에 붙고 꼬리가 pointY를 가리켜요. below: 오른쪽 끝을 맞춰 이 y 아래에 (화면 밖으로 나가면 올려요) */
export type EquipTipAt = { kind: "lane"; right: number; pointY: number } | { kind: "below"; right: number; top: number };

export function drawEquipTip(scene: Phaser.Scene, tip: EquipTipVM, at: EquipTipAt, owner?: LaneVM) {
  const [pt, pr, pb, pl] = TIP.pad;
  const w = tip.lose ? TIP.w.two : tip.swap ? TIP.w.swap : TIP.w.plain;
  const inner = w - pl - pr;
  const pieces = body(scene, tip, inner, owner);
  const headH = size({ t: "row", align: "center", children: [{ t: "block", w: TIP.head.thumb, h: TIP.head.thumb }, text(tip.item.rarityName, T.tipTitle, P.ink)] }).h;
  const h = pt + headH + pieces.reduce((a, p) => a + p.mt + p.h, 0) + pb;
  const left = at.right - w;
  const top = at.kind === "lane"
    ? Math.max(TIP.edge, Math.min(FRAME.h - TIP.edge - h, at.pointY - h / 2))
    : Math.min(at.top, FRAME.h - TIP.edge - h);
  const fill = withAlpha(P.glassD, 1);
  const sh = shadowTexture(scene, w, h, TIP.radius, { y: TIP.shadow.y, blur: TIP.shadow.blur, color: P.tipShadow });
  scene.add.image(left - sh.margin, top - sh.margin, sh.key).setOrigin(0, 0);
  const g = scene.add.graphics();
  if (at.kind === "lane") {
    // 오른쪽 꼬리: 45° 돌린 정사각형의 오른쪽 절반 + 두 변의 선
    const half = (TIP.tail * Math.SQRT2) / 2;
    const cy = Math.max(top + TIP.radius + half, Math.min(top + h - TIP.radius - half, at.pointY));
    const f = rgba(fill), l = rgba(P.veil["20"]);
    g.fillStyle(f.color, f.alpha).fillTriangle(left + w - 1, cy - half, left + w - 1 + half, cy, left + w - 1, cy + half);
    g.lineStyle(TIP.ring, l.color, l.alpha).lineBetween(left + w - 1, cy - half, left + w - 1 + half, cy).lineBetween(left + w - 1 + half, cy, left + w - 1, cy + half);
  }
  box(g, left, top, w, h, TIP.radius, { fill, ring: { width: TIP.ring, color: P.veil["20"] } });
  if (at.kind === "lane") {
    // 꼬리가 붙는 자리의 테를 덮어요
    const half = (TIP.tail * Math.SQRT2) / 2;
    const cy = Math.max(top + TIP.radius + half, Math.min(top + h - TIP.radius - half, at.pointY));
    const f = rgba(fill);
    g.fillStyle(f.color, f.alpha).fillRect(left + w - TIP.ring - 1, cy - half + 1, TIP.ring + 1, half * 2 - 2);
  }
  let y = top + pt;
  y += head(scene, tip.item, left + pl, y, inner);
  for (const p of pieces) {
    y += p.mt;
    p.draw(left + pl, y);
    y += p.h;
  }
}
