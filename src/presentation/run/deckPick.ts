// 덱에서 카드 한 장 고르기 (P1 f4 · 정리안 f7, 0046): 왼쪽 열에 정령 줄마다 그 정령의 덱 한 줄. 고르기 → 확인 두 단계.
// 상점 빼기 · 휴식 강화 · 이벤트(빼기 · 강화 · 복제)가 같이 써요. 무엇을 하는지(표식 · 확인 버튼 · 주인 줄 상태)만 화면이 줘요.
// 빼기는 고른 카드에 − 표식, 강화는 고른 카드 오른쪽에 화살표 + 강화한 카드를 끼워 전→후를 보여요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { createHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { P, text } from "../spirits/views/parts";
import { box, circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { adjustColor } from "../style/opacity";
import { cardWithFace, drawCardTip } from "./cards";
import { COPY } from "./copy";
import { drawLane, laneY, type LaneState } from "./lanes";
import { CARD_FOCUS, DECK_PICK, FRAME, LEAVE } from "./layout";
import type { DeckCardVM, LaneVM } from "./viewmodel";

const T = tokens.provisional.text.result;
const C = DECK_PICK.confirm;

export const DECK_PICK_ICONS = [
  ["g-close", C.icon], ["fx-discard", C.icon], ["g-up", C.icon], ["g-cardnew", C.icon], ["i-coin", C.coin], ["g-back", LEAVE.icon], ["g-close", LEAVE.icon],
] as const;

/** 고른 뒤 확인 버튼. danger = 되돌릴 수 없는 빼기(위험색 채움), 아니면 강조 채움 */
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
  /** remove: − 표식, upgrade: 강화한 카드를 옆에 */
  mode: "remove" | "upgrade";
  /** 고를 수 없는 카드 (못 내는 카드처럼 회색, 0043) */
  off?: (uid: number) => boolean;
  /** 주인 줄 상태. mine = 올리거나 고른 카드의 주인 줄 */
  lane?: (l: LaneVM, mine: boolean, card?: DeckCardVM) => LaneState;
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

export function drawDeckPick(scene: Phaser.Scene, o: DeckPickOptions) {
  const D = DECK_PICK;
  const focus = o.pick ?? o.hover;
  // 빈 곳을 누르면 고른 카드를 내려놓아요 (맨 아래에 깔아서 다른 입력이 먼저 받아요)
  scene.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => {
    if (o.pick !== undefined) o.on.clear();
  });

  const late: (() => void)[] = [];
  o.lanes.forEach((l, i) => {
    const row = o.rows[l.id] ?? [];
    const mineCard = focus === undefined ? undefined : row.find((c) => c.uid === focus);
    drawLane(scene, l, i, o.lane?.(l, !!mineCard, mineCard) ?? (mineCard ? { hot: true } : {}));
    const y = laneY(i) + D.dy;
    // 강화 미리보기는 고른 카드 뒤에 한 칸(화살표 + 카드)이 더 들어가요
    const extra = o.mode === "upgrade" && mineCard ? 1 : 0;
    const n = row.length + extra;
    const arrow = extra ? D.upgrade.arrow : 0;
    const step = n > 1 ? Math.min(D.step, (D.w - HAND_CARD.w - arrow) / (n - 1)) : D.step;
    let x = D.x;
    row.forEach((c) => {
      const cx = x;
      const on = focus === c.uid;
      const off = !!o.off?.(c.uid);
      x += step;
      if (on && extra) x += step + arrow;
      const draw = () => {
        const top = on ? y - D.lift : y;
        const card = cardWithFace(scene, c.card, l);
        const view = createHandCard(scene, card, cx, top, { showRarity: true });
        view.setHeld(on);
        view.setLifted(on);
        if (off) adjustColor(view.root, { grayscale: 1, opacity: CARD_FOCUS.dim });
        else if (focus !== undefined && !on) view.opacity = CARD_FOCUS.dim;
        // 겹친 줄에서는 다음 카드에 가려지지 않은 폭만 받아요 (올린 카드는 통째로)
        const last = c === row[row.length - 1];
        const hitW = on || last ? HAND_CARD.w : Math.min(HAND_CARD.w, step);
        if (!off) {
          scene.add.zone(cx, y, hitW, HAND_CARD.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
            .on("pointerover", () => o.on.hover(c.uid))
            .on("pointerout", () => o.on.hover(undefined))
            .on("pointerup", (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
              e.stopPropagation();
              o.on.toggle(c.uid);
            });
        }
        if (!on) return;
        if (o.mode === "remove") {
          drawRemoveMark(scene, cx, top);
          drawCardTip(scene, card, cx, top, HAND_CARD.w);
        } else if (c.after) {
          const ax = cx + step + arrow;
          const arrowNode = text(COPY.arrow, T.was, P.accHi, { lh: 1 });
          const a = size(arrowNode);
          render(scene, arrowNode, cx + HAND_CARD.w + (ax - cx - HAND_CARD.w - a.w) / 2, top + (HAND_CARD.h - a.h) / 2);
          const up = cardWithFace(scene, c.after, l);
          const upView = createHandCard(scene, up, ax, top, { showRarity: true });
          upView.setLifted(true);
          drawCardTip(scene, up, ax, top, HAND_CARD.w);
        }
        if (o.pick === c.uid) drawPickConfirm(scene, y, o.confirm, { cancel: o.on.clear, ok: () => o.on.ok(c.uid) });
      };
      if (on) late.push(draw);
      else draw();
    });
  });
  for (const f of late) f();
  // 돌아가기는 덱 줄에 가려지지 않게 마지막 줄의 확인 줄 자리에 둬요
  if (o.pick === undefined && o.on.back && o.cancelLabel) {
    drawQuietButton(scene, "g-close", o.cancelLabel, o.on.back, laneY(o.lanes.length - 1) + D.dy + C.dy);
  }
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

/** rowY = 덱 줄의 카드 윗선. 확인 줄(취소 · 확인)은 왼쪽 열 오른쪽 끝에 맞춰요 */
function drawPickConfirm(scene: Phaser.Scene, rowY: number, c: PickConfirm, on: { cancel: () => void; ok: () => void }) {
  const fill = c.danger ? P.danger : P.acc;
  const ink = c.danger ? P.onDanger : P.onAcc;
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
        style: { fill }, onClick: on.ok,
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
  render(scene, node, DECK_PICK.x + DECK_PICK.w - C.cancelW - C.gap - C.okW, rowY + C.dy);
}

/** 왼쪽 아래 조용한 버튼 (떠나기 · 돌아가기) */
export function drawQuietButton(scene: Phaser.Scene, icon: string, label: string, onClick: () => void, y: number = LEAVE.y) {
  const B = LEAVE;
  const node: Node = {
    t: "row", w: B.w, h: B.h, radius: B.radius, gap: B.gap, justify: "center", align: "center",
    style: { ring: { width: 1, color: P.glassLine } }, onClick,
    children: [{ t: "icon", id: icon, w: B.icon, h: B.icon, tint: P.ink3Spirit }, text(label, T.button, P.ink2)],
  };
  render(scene, node, B.x, y);
}
