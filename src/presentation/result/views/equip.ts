// 정예 장비 줄(왼쪽 열, 카드 아래)과 장비 말풍선 (0051 자리 · 0064 Q2-A 모양).
// 말풍선은 장비가 무엇인지만 말해요(주는 수치 · 효과문 · 기술 카드). 정령에게 일어나는 일은 정령 줄이 말해요.
// 내려놓는 장비는 같은 틀을 흐리게 한 번 더 써요.
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
import type { EquipChipVM, EquipOfferVM, EquipSheetVM, EquipStatId, EquipTipVM } from "../viewmodel";

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
    children: offer.gain.map((c) => chip(c, T.stat, S.gain.icon, S.gain.gap)),
  };
  const gs = size(gain);
  render(scene, gain, S.x + S.w - S.padR - gs.w, S.y + (S.h - gs.h) / 2);
  const zone = scene.add.zone(S.x, S.y, S.w, S.h).setOrigin(0, 0).setInteractive();
  if (handlers.over) zone.on("pointerover", handlers.over);
  if (handlers.out) zone.on("pointerout", handlers.out);
}

/** 장비가 주는 수치 하나: 기호 + 증감 */
function chip(c: EquipChipVM, size: string, icon: number, gap: number, dim?: number): Node {
  const fade = (color: string) => (dim === undefined ? color : withAlpha(color, dim));
  return {
    t: "row", gap, align: "center",
    children: [
      { t: "icon", id: ICON[c.stat], w: icon, h: icon, tint: fade(c.neg ? P.danger : COLOR[c.stat]) },
      { ...text(c.label, size, dim === undefined ? (c.neg ? P.danger : P.ink) : P.ink3Spirit), ...(dim === undefined ? {} : { strike: {} }) } as Node,
    ],
  };
}

const para = (s: string, w: number, color: string, extra: Partial<Node> = {}): Node =>
  ({ ...text(s, T.tipBody, color, { lh: TIP.line.lh, wrap: w, keepAll: true }), ...extra } as Node);

/** 머리: 그림 · 이름 · 꼬리표 · (공명 점). 내려놓는 장비는 그림이 작고 이름이 흐리며 꼬리표가 "사라짐"이에요 */
function head(scene: Phaser.Scene, item: EquipVM, w: number, dropped: boolean): Piece {
  const H = TIP.head;
  const thumb = dropped ? TIP.drop.thumb : H.thumb;
  const mark = dropped ? undefined : RARITY_MARK[item.rarity];
  const markW = mark ? H.tag.mark.d + (mark.n - 1) * H.tag.mark.step : 0;
  const tag: Node = {
    t: "row", pad: [H.tag.padY, H.tag.padX, H.tag.padY, H.tag.padX], radius: H.tag.radius, gap: H.tag.gap, align: "center",
    style: { ring: { width: 1, color: dropped ? P.danger : P.veil["20"] } },
    children: [
      ...(mark ? [{ t: "block", w: markW, h: H.tag.mark.d, draw: (g, bx, by) => drawRarityMark(g, item.rarity, bx, by, H.tag.mark) } as Node] : []),
      text(dropped ? COPY.dropped : item.rarityName, T.tipTag, dropped ? P.danger : P.ink2),
    ],
  };
  const row: Node = {
    t: "row", w, gap: H.gap, align: "center",
    children: [
      { t: "block", w: thumb, h: thumb },
      ...(item.name ? [text(item.name, T.tipTitle, dropped ? P.ink3Spirit : P.ink)] : []),
      tag,
      ...(dropped ? [] : [{ t: "block", ml: "auto", w: pipsSize(item.cap, H.pip), h: H.pip.d, draw: (g, bx, by) => drawPips(g, item, bx, by, H.pip, false) } as Node]),
    ],
  };
  const s = size(row);
  return {
    mt: 0, h: s.h,
    draw: (x, y) => {
      render(scene, row, x, y);
      drawEquipArt(scene, item.id, x, y + (s.h - thumb) / 2, thumb, thumb, dropped ? TIP.drop.thumbAlpha : 1);
    },
  };
}

/** 말풍선 조각: 위에서 아래로 쌓아요. mt = 위 조각과의 틈 */
type Piece = { mt: number; h: number; draw: (x: number, y: number) => void };

const piece = (scene: Phaser.Scene, node: Node, mt: number): Piece => ({ mt, h: size(node).h, draw: (x, y) => { render(scene, node, x, y); } });

/** 장비 하나의 설명. dropped = 내려놓아 사라지는 장비 (흐리게, 취소선) */
function sheetPieces(scene: Phaser.Scene, sheet: EquipSheetVM, inner: number, dropped: boolean, owner?: LaneVM): Piece[] {
  const out: Piece[] = [head(scene, sheet.item, inner, dropped)];
  if (sheet.chips.length) {
    const row: Node = { t: "row", gap: TIP.stat.gap, align: "center", children: sheet.chips.map((c) => chip(c, T.tipStat, TIP.stat.icon, TIP.stat.iconGap, dropped ? TIP.drop.dim : undefined)) };
    out.push(piece(scene, row, TIP.stat.mt));
  }
  const line = (l: string, w: number) => (dropped ? para(l, w, P.ink3Spirit, { strike: {} }) : para(l, w, P.ink2));
  for (const l of sheet.lines) out.push(piece(scene, line(l, inner), TIP.line.mt));
  if (sheet.card && !dropped) {
    // 효과문이 가리키는 기술 카드와, 그 오른쪽에 카드의 효과문
    const { vm, text: cardText } = sheet.card;
    const textW = inner - HAND_CARD.w - TIP.card.gap;
    const body = para(cardText, textW, P.ink2);
    out.push({
      mt: TIP.card.mt, h: Math.max(HAND_CARD.h, size(body).h),
      draw: (x, y) => {
        createHandCard(scene, cardWithFace(scene, vm, owner), x, y, { showRarity: true });
        render(scene, body, x + HAND_CARD.w + TIP.card.gap, y);
      },
    });
  }
  if (sheet.note && !dropped) out.push(piece(scene, para(sheet.note, inner, P.ink3Spirit), TIP.line.mt));
  return out;
}

/** 말풍선을 놓을 자리. lane: 정령 줄 왼쪽에 붙고 꼬리가 pointY를 가리켜요. below: 오른쪽 끝을 맞춰 이 y 아래에 (화면 밖으로 나가면 올려요) */
export type EquipTipAt = { kind: "lane"; right: number; pointY: number } | { kind: "below"; right: number; top: number };

export function drawEquipTip(scene: Phaser.Scene, tip: EquipTipVM, at: EquipTipAt, owner?: LaneVM) {
  const [pt, pr, pb, pl] = TIP.pad;
  const w = tip.sheet.card ? TIP.w.card : TIP.w.plain;
  const inner = w - pl - pr;
  const pieces = sheetPieces(scene, tip.sheet, inner, false, owner);
  if (tip.drop) {
    const [first, ...rest] = sheetPieces(scene, tip.drop, inner, true);
    // 두 설명 사이에 선 하나
    pieces.push({
      mt: TIP.drop.mt, h: TIP.drop.pt + first.h,
      draw: (x, y) => {
        box(scene.add.graphics(), x, y, inner, 1, 0, { fill: P.glassLine });
        first.draw(x, y + TIP.drop.pt);
      },
    }, ...rest);
  }
  const h = pt + pieces.reduce((a, p) => a + p.mt + p.h, 0) + pb;
  const left = at.right - w;
  const top = at.kind === "lane"
    ? Math.max(TIP.edge, Math.min(FRAME.h - TIP.edge - h, at.pointY - h / 2))
    : Math.min(at.top, FRAME.h - TIP.edge - h);
  const fill = withAlpha(P.glassD, 1);
  const sh = shadowTexture(scene, w, h, TIP.radius, { y: TIP.shadow.y, blur: TIP.shadow.blur, color: P.tipShadow });
  scene.add.image(left - sh.margin, top - sh.margin, sh.key).setOrigin(0, 0);
  const g = scene.add.graphics();
  const half = (TIP.tail * Math.SQRT2) / 2;
  const cy = at.kind === "lane" ? Math.max(top + TIP.radius + half, Math.min(top + h - TIP.radius - half, at.pointY)) : 0;
  const f = rgba(fill), l = rgba(P.veil["20"]);
  if (at.kind === "lane") {
    // 오른쪽 꼬리: 45° 돌린 정사각형의 오른쪽 절반 + 두 변의 선
    g.fillStyle(f.color, f.alpha).fillTriangle(left + w - 1, cy - half, left + w - 1 + half, cy, left + w - 1, cy + half);
    g.lineStyle(TIP.ring, l.color, l.alpha).lineBetween(left + w - 1, cy - half, left + w - 1 + half, cy).lineBetween(left + w - 1 + half, cy, left + w - 1, cy + half);
  }
  box(g, left, top, w, h, TIP.radius, { fill, ring: { width: TIP.ring, color: P.veil["20"] } });
  // 꼬리가 붙는 자리의 테를 덮어요
  if (at.kind === "lane") g.fillStyle(f.color, f.alpha).fillRect(left + w - TIP.ring - 1, cy - half + 1, TIP.ring + 1, half * 2 - 2);
  let y = top + pt;
  for (const p of pieces) {
    y += p.mt;
    p.draw(left + pl, y);
    y += p.h;
  }
}
