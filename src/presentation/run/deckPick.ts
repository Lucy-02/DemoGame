// 덱에서 카드 한 장 고르기 (Lucy 2026-11-17, 공용 UI 기획 r6): 큰 정령 줄 없이 덱 보기 창 틀(얼굴 머리 + 덱 장수 + 카드 줄)에서 골라요.
// 상점 빼기 · 휴식 강화 · 이벤트(빼기 · 강화 · 복제)가 같이 써요. 고르기 → 확인 두 단계, 창은 내용을 감싸고 화면 한가운데.
// 빼기는 고른 카드에 − 표식, 강화 · 복제는 고른 카드 오른쪽에 화살표 + 바뀐 카드를 끼워 전→후를 보여요. 아홉 장을 넘는 줄은 덱 보기처럼 접어 내려요.
// 취소 · 확인(또는 돌아가기)은 마지막 줄 아래 정해진 자리예요. 말풍선은 첫 줄만 카드 위, 둘째 줄부터는 윗줄을 가리지 않게 카드 옆.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { createHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { DECK_VIEW } from "../deck/layout";
import { faceTexture } from "../spiritArt";
import { P, plateStyle, text } from "../spirits/views/parts";
import { box, circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { adjustColor } from "../style/opacity";
import { shadowTexture } from "../style/shadow";
import { cardWithFace, drawCardTip, drawCardTipBeside } from "./cards";
import { COPY } from "./copy";
import { CARD_FOCUS, DECK_PICK, FRAME, LEAVE, PANEL } from "./layout";
import type { DeckCardVM, LaneVM } from "./viewmodel";

const T = tokens.provisional.text.result;
const C = DECK_PICK.confirm;

export const DECK_PICK_ICONS = [
  ["g-close", C.icon], ["fx-discard", C.icon], ["g-up", C.icon], ["g-cardnew", C.icon], ["i-coin", C.coin], ["g-back", LEAVE.icon], ["g-close", LEAVE.icon],
  ["i-deck", DECK_VIEW.head.icon],
] as const;

/** 고른 뒤 확인 버튼. danger = 되돌릴 수 없는 빼기(위험색 채움), 아니면 주 버튼 판(plateStyle) */
export interface PickConfirm {
  label: string;
  icon: string;
  danger?: boolean;
  price?: number;
}

export interface DeckPickOptions {
  lanes: LaneVM[];
  /** 정령 줄(LaneVM.id)마다 그 정령의 카드 */
  rows: Record<string, DeckCardVM[]>;
  /** 올린 카드 */
  hover?: number;
  /** 고른 카드 (확인 전) */
  pick?: number;
  /** remove: − 표식, upgrade: 바뀐 카드(after)를 옆에 */
  mode: "remove" | "upgrade";
  /** 고르면 그 정령의 덱 장수가 바뀌어요 (빼기 -1 · 복제 +1): 머리에 a→b */
  deckDelta?: number;
  /** 고를 수 없는 카드 (못 내는 카드처럼 회색, 0043) */
  off?: (uid: number) => boolean;
  confirm: PickConfirm;
  /** 고르기 전에 돌아가는 버튼 (없으면 안 그려요) */
  cancelLabel?: string;
  on: {
    hover: (uid?: number) => void;
    /** 카드를 누름 (고르기 / 다시 누르면 내려놓기) */
    toggle: (uid: number) => void;
    /** 빈 곳 · 취소 */
    clear: () => void;
    ok: (uid: number) => void;
    /** 고르기 전 돌아가기 */
    back?: () => void;
  };
}

interface Slot { c: DeckCardVM; after?: boolean; x: number; y: number }

export function drawDeckPick(scene: Phaser.Scene, o: DeckPickOptions) {
  const V = DECK_VIEW, H = V.head;
  const focus = o.pick ?? o.hover;
  const step = HAND_CARD.w + V.cardGap;
  const arrow = DECK_PICK.upgrade.arrow;
  const upgrade = o.mode === "upgrade";
  // 창 폭: 가장 긴 줄(접기 전 per장까지) + 강화 미리보기 한 칸(늘 비워 둬서 고를 때 창이 출렁이지 않아요)
  const extra = upgrade ? 1 : 0;
  const cols = Math.max(V.minCols, Math.min(V.per, Math.max(...o.lanes.map((l) => (o.rows[l.id] ?? []).length + extra))));
  const innerW = Math.max(cols * HAND_CARD.w + (cols - 1) * V.cardGap + (upgrade ? arrow : 0), C.cancelW + C.gap + C.okW);

  // 줄마다 칸 자리 (고른 카드 뒤에 바뀐 카드가 끼면 뒤 카드가 밀리고, per칸을 넘으면 접어 내려요)
  const layout = o.lanes.map((l) => {
    const row = o.rows[l.id] ?? [];
    const slots: Slot[] = [];
    let col = 0, line = 0, x = 0;
    const put = (c: DeckCardVM, after = false) => {
      if (col >= V.per) { col = 0; line += 1; x = 0; }
      slots.push({ c, after, x, y: line * (HAND_CARD.h + V.cardGap) });
      col += 1;
      x += step;
    };
    for (const c of row) {
      put(c);
      if (upgrade && focus === c.uid && c.after) {
        x += arrow;
        put(c, true);
      }
    }
    const lines = line + 1;
    return { l, row, slots, h: H.h + H.below + lines * HAND_CARD.h + (lines - 1) * V.cardGap };
  });
  const innerH = layout.reduce((a, r) => a + r.h, 0) + layout.length * V.rowGap + C.h;
  const win = { w: innerW + V.pad * 2, h: innerH + V.pad * 2, x: 0, y: 0 };
  win.x = Math.round((FRAME.w - win.w) / 2);
  win.y = Math.round((FRAME.h - win.h) / 2);

  // 빈 곳을 누르면 고른 카드를 내려놓아요 (맨 아래에 깔아서 다른 입력이 먼저 받아요)
  scene.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => {
    if (o.pick !== undefined) o.on.clear();
  });
  const K = PANEL;
  const sh = shadowTexture(scene, win.w, win.h, K.radius, { y: K.shadow.y, blur: K.shadow.blur, color: P.tipShadow });
  scene.add.image(win.x - sh.margin, win.y - sh.margin, sh.key).setOrigin(0, 0);
  box(scene.add.graphics(), win.x, win.y, win.w, win.h, K.radius, { fill: P.floor, ring: { width: K.ring, color: P.glassLine } });

  const x0 = win.x + V.pad;
  let y = win.y + V.pad;
  const late: (() => void)[] = [];
  layout.forEach(({ l, row, slots, h }, ri) => {
    const mine = focus !== undefined && row.some((c) => c.uid === focus);
    const n = row.length;
    const count: Node[] = mine && o.deckDelta
      ? [text(`${n}${COPY.arrow}`, T.was, P.ink3Spirit), text(String(n + o.deckDelta), T.was, P.accHi)]
      : [text(String(n), T.was, P.ink2)];
    const head: Node = {
      t: "row", align: "center", gap: H.gap, h: H.h,
      children: [
        ...(l.face && scene.textures.exists(l.face.key) ? [{ t: "image", key: faceTexture(scene, l.face, H.face), w: H.face, h: H.face } as Node] : []),
        text(l.name, T.name, focus === undefined || mine ? P.ink : P.ink3Spirit),
        { t: "row", align: "center", gap: H.iconGap, children: [{ t: "icon", id: "i-deck", w: H.icon, h: H.icon, tint: P.ink3Spirit }, { t: "row", gap: 0, align: "baseline", children: count }] },
      ],
    };
    render(scene, head, x0, y);
    const top = y + H.h + H.below;
    slots.forEach((s, si) => {
      const cx = x0 + s.x, cy = top + s.y;
      const on = focus === s.c.uid;
      const card = cardWithFace(scene, s.after ? s.c.after! : s.c.card, l);
      // 첫 줄의 첫 카드 줄만 위로, 나머지는 옆으로 (윗줄 머리를 가리지 않게)
      const tip = () => (ri === 0 && s.y === 0 ? drawCardTip : drawCardTipBeside)(scene, card, cx, cy, HAND_CARD.w);
      if (s.after) {
        late.push(() => {
          const prev = slots[si - 1];
          if (prev.y === s.y) {
            const ax = x0 + prev.x + HAND_CARD.w;
            const a = text(COPY.arrow, T.was, P.accHi, { lh: 1 });
            const as = size(a);
            render(scene, a, ax + (cx - ax - as.w) / 2, cy + (HAND_CARD.h - as.h) / 2);
          }
          createHandCard(scene, card, cx, cy, { showRarity: true });
          tip();
        });
        return;
      }
      const off = !!o.off?.(s.c.uid);
      const draw = () => {
        const view = createHandCard(scene, card, cx, cy, { showRarity: true });
        view.setHeld(on);
        if (off) adjustColor(view.root, { grayscale: 1, opacity: CARD_FOCUS.dim });
        else if (focus !== undefined && !on) view.opacity = CARD_FOCUS.dim;
        if (!off) {
          scene.add.zone(cx, cy, HAND_CARD.w, HAND_CARD.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
            .on("pointerover", () => o.on.hover(s.c.uid))
            .on("pointerout", () => o.on.hover(undefined))
            .on("pointerup", (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
              e.stopPropagation();
              o.on.toggle(s.c.uid);
            });
        }
        if (!on) return;
        if (o.mode === "remove") drawRemoveMark(scene, cx, cy);
        // 바뀐 카드가 옆에 끼면 말풍선은 그 카드가 맡아요
        if (!(upgrade && s.c.after)) tip();
      };
      if (on) late.push(draw);
      else draw();
    });
    y += h + V.rowGap;
  });
  for (const f of late) f();
  const pick = o.pick;
  if (pick !== undefined) drawPickConfirm(scene, y, o.confirm, { cancel: o.on.clear, ok: () => o.on.ok(pick) }, x0 + innerW);
  else if (o.on.back && o.cancelLabel) drawQuietButton(scene, "g-close", o.cancelLabel, o.on.back, y + (C.h - LEAVE.h) / 2, x0);
}

/** 카드(왼쪽 위 x, y) 오른쪽 위 모서리에 걸친 − 표식 */
function drawRemoveMark(scene: Phaser.Scene, x: number, y: number) {
  const M = DECK_PICK.mark;
  const cx = x + HAND_CARD.w - M.d / 2 + M.dx, cy = y - M.d / 2 + M.dy - M.d / 2;
  const g = scene.add.graphics();
  circle(g, cx, cy, M.d + M.ring * 2, { fill: P.stageLo });
  circle(g, cx, cy, M.d, { fill: P.danger });
  box(g, cx - M.bar.w / 2, cy - M.bar.h / 2, M.bar.w, M.bar.h, M.bar.h / 2, { fill: P.onDanger });
}

/** y = 버튼 줄 윗선. 확인 줄(취소 · 확인)은 right(창 안쪽 오른쪽 끝)에 맞춰요 */
function drawPickConfirm(scene: Phaser.Scene, y: number, c: PickConfirm, on: { cancel: () => void; ok: () => void }, right: number) {
  const ink = c.danger ? P.onDanger : P.ink;
  const node: Node = {
    t: "row", gap: C.gap, align: "center",
    children: [
      {
        t: "row", w: C.cancelW, h: C.h, radius: C.radius, gap: C.inner, justify: "center", align: "center",
        style: { fill: P.veil["04"], ring: { width: 1, color: P.glassLine } }, onClick: on.cancel,
        children: [{ t: "icon", id: "g-close", w: C.icon, h: C.icon, tint: P.ink }, text(COPY.cancel, T.was, P.ink)],
      },
      {
        t: "row", w: C.okW, h: C.h, radius: C.radius, gap: C.inner, justify: "center", align: "center",
        style: c.danger ? { fill: P.danger } : plateStyle(true), onClick: on.ok,
        children: [
          { t: "icon", id: c.icon, w: C.icon, h: C.icon, tint: ink },
          text(c.label, T.was, ink),
          ...(c.price === undefined ? [] : [{
            t: "row", gap: C.coinGap, align: "center",
            children: [{ t: "icon", id: "i-coin", w: C.coin, h: C.coin, tint: ink }, text(String(c.price), T.price, ink)],
          } as Node]),
        ],
      },
    ],
  };
  render(scene, node, right - C.cancelW - C.gap - C.okW, y);
}

/** 조용한 버튼 (떠나기 · 돌아가기). 기본은 왼쪽 아래 */
export function drawQuietButton(scene: Phaser.Scene, icon: string, label: string, onClick: () => void, y: number = LEAVE.y, x: number = LEAVE.x) {
  const B = LEAVE;
  const node: Node = {
    t: "row", w: B.w, h: B.h, radius: B.radius, gap: B.gap, justify: "center", align: "center",
    style: { ring: { width: 1, color: P.glassLine } }, onClick,
    children: [{ t: "icon", id: icon, w: B.icon, h: B.icon, tint: P.ink3Spirit }, text(label, T.button, P.ink2)],
  };
  render(scene, node, x, y);
}
