// 오른쪽 정령 세 줄 (0044 D2 + 0050): 얼굴 링, 이름 · Lv, HP, 능력치 셋, 카드가 들어갈 칸.
// 문턱을 넘었을 때만 표식이 붙고, 쓰러졌다 돌아온 정령은 회색 얼굴과 끊긴 붉은 점선 링으로 보여요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { createHandCard } from "../card/HandCard";
import type { CardVM } from "../card/viewmodel";
import { faceTexture } from "../spiritArt";
import { P, badge, bar, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { hitArea, render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { canvasTexture, linear } from "../style/gradient";
import { adjustColor } from "../style/opacity";
import { placeholderArt } from "../style/placeholder";
import { ringTexture } from "../style/ring";
import { shadowTexture } from "../style/shadow";
import { COPY, STAT_ICON } from "./copy";
import { drawEquipSlot, type SlotDraw } from "./equip";
import { EQUIP_SLOT, INFO, LANE, LANE_PREVIEW, RING, SOCKET } from "./layout";
import { STAT_IDS, type EquipVM, type LaneVM, type StatId } from "./viewmodel";

const T = tokens.provisional.text.result;
const STAT_COLOR = P.stat;

export const LANE_ICONS = [
  ...STAT_IDS.flatMap((k) => [[STAT_ICON[k], INFO.stats.icon], [STAT_ICON[k], INFO.stats.iconOn]] as const),
  ["g-up", INFO.levelUp.icon], ["g-up", RING.badge.icon], ["g-cardnew", RING.badge.icon], ["g-seed", RING.badge.icon], ["g-cardnew", INFO.chip.icon],
  ["i-deck", SOCKET.deck.icon],
] as const;

export interface LaneState {
  /** 집은 카드의 주인 줄: 자두빛 테 */
  hot?: boolean;
  /** 밝힐 능력치 (나머지는 흐려져요) */
  stat?: StatId;
  /** 칸에 놓인 카드. hot = 아직 집고만 있음(밝은 테), 아니면 받음 */
  card?: { vm: CardVM; hot: boolean };
  /** 빈 칸이 "받을 수 있음"으로 밝아져요 (상점: 집은 카드를 배울 수 있는 줄) */
  open?: boolean;
  /** 덱 장수가 a→b로 바뀔 예정 (칸 아래) */
  deckTo?: number;
  /** HP가 이만큼 찰 예정 (치료 미리보기): 막대에 연두 구간 */
  heal?: number;
  /** 장비를 받는 미리보기 (0064) */
  equip?: LaneEquipState;
  /** 지금 고를 수 없는 줄: 내용이 흐려져요 (전용 무기의 주인이 아닌 정령) */
  dim?: boolean;
  /** 줄을 누르면 / 올리면 / 벗어나면 */
  on?: { click?: () => void; over?: () => void; out?: () => void };
}

type Handlers = { click?: () => void; over?: () => void; out?: () => void };

export interface LaneEquipState {
  /** 받을 수 있는 칸들 (점선). 칸마다 누르면 / 올리면 / 벗어나면 */
  slots: Record<number, Handlers>;
  /** 비쳐 보이는 장비: 이 칸에 들어가요. drop이 있으면 그 장비를 내려놓아요 */
  ghost?: { slot: number; item: EquipVM; drop?: EquipVM; hot?: boolean };
  /** 받으면 바뀌는 능력치 (숫자 옆 증감) */
  delta?: Partial<Record<StatId, number>>;
  /** 받으면 바뀌는 최대 HP */
  maxHpTo?: number;
}

/** 줄 i의 장비 칸 n개 중 k번째 칸의 왼쪽 위 (세로 가운데로 쌓아요) */
export function slotAt(i: number, n: number, k: number) {
  const K = EQUIP_SLOT;
  const total = n * K.size + (n - 1) * K.gap;
  return { x: LANE.x + K.x, y: laneY(i) + (LANE.h - total) / 2 + k * (K.size + K.gap) };
}

export const laneY = (i: number) => LANE.y + i * (LANE.h + LANE.gap);

/** 줄 바탕 위에 얹는 빛: 보통은 위→아래 상아빛, 쓰러졌던 줄은 왼→오 붉은 물 */
function washTexture(scene: Phaser.Scene, down: boolean): string {
  const { w, h, radius } = LANE;
  return canvasTexture(scene, `result:lane-wash:${down ? "down" : "calm"}`, w, h, (ctx) => {
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.clip();
    if (down) linear(ctx, w, h, 90, [[withAlpha(P.danger, LANE.down.wash), 0], [withAlpha(P.danger, 0), LANE.down.at]]);
    else linear(ctx, w, h, 180, [[withAlpha(P.ink, LANE.sheen.from), 0], [withAlpha(P.ink, LANE.sheen.to), LANE.sheen.at]]);
  });
}

function ring(scene: Phaser.Scene, l: LaneVM): string {
  const pct = (v: number) => Math.round(v * 1000);
  const key = `result:ring:${l.down ? "down" : "up"}:${pct(l.exp.before)}:${pct(l.exp.after)}`;
  return ringTexture(scene, key, {
    d: RING.d, r: RING.r, stroke: RING.stroke,
    track: l.down ? { color: P.danger, width: RING.down.stroke, dash: RING.down.dash } : { color: P.wallLo },
    arcs: [
      { from: 0, to: l.exp.before, color: withAlpha(P.ink2, RING.oldAlpha) },
      { from: l.exp.before, to: l.exp.after, color: P.accHi },
    ],
  });
}

function drawFace(scene: Phaser.Scene, l: LaneVM, x: number, y: number) {
  const d = RING.d - RING.faceInset * 2;
  const fx = x + RING.faceInset, fy = y + RING.faceInset;
  const face = gather(scene, 0, 0, () => {
    circle(scene.add.graphics(), fx + d / 2, fy + d / 2, d, { fill: P.wall });
    if (l.face && scene.textures.exists(l.face.key)) scene.add.image(fx, fy, faceTexture(scene, l.face, d)).setOrigin(0, 0);
    else placeholderArt(scene, fx + d / 4, fy + d / 4, d / 2, d / 2, P.glassLine);
  });
  if (l.down) adjustColor(face, { grayscale: RING.down.grayscale, brightness: RING.down.brightness });
  scene.add.image(x, y, ring(scene, l)).setOrigin(0, 0);
  l.badges.slice(0, RING.badge.at.length).forEach((id, i) => {
    const B = RING.badge;
    const [bx, by] = B.at[i];
    render(scene, badge(id, B.d, B.icon, true, {}, { fill: P.acc, ink: P.onAcc, outer: P.floor }), x + bx - B.outer, y + by - B.outer);
  });
}

function info(l: LaneVM, lit?: StatId, heal = 0, equip?: LaneEquipState): Node {
  const U = INFO.levelUp, S = INFO.stats, C = INFO.chip;
  const level: Node = l.levelUp
    ? {
      t: "row", h: U.h, pad: U.pad, radius: U.radius, gap: U.gap, align: "center", style: { fill: withAlpha(P.acc, U.alpha) },
      children: [{ t: "icon", id: "g-up", w: U.icon, h: U.icon, tint: P.accHi }, text(COPY.lv(l.level), T.level, P.accHi)],
    }
    : text(COPY.lv(l.level), T.level, P.ink3Spirit);
  const low = !!l.down;
  const stat = (k: StatId): Node => {
    const delta = equip?.delta?.[k];
    const on = lit === k || !!delta;
    const fade = (c: string) => (lit && !on ? withAlpha(c, S.dim) : c);
    const iconSize = on ? S.iconOn : S.icon;
    return {
      t: "row", pad: S.pad, ml: S.ml, gap: S.iconGap, align: "center",
      children: [
        { t: "icon", id: STAT_ICON[k], w: iconSize, h: iconSize, tint: fade(STAT_COLOR[k]) },
        text(String(l.stats[k]), on && !delta ? T.statOn : T.stat, on ? STAT_COLOR[k] : fade(P.ink2)),
        ...(delta ? [text(COPY.delta(delta), T.statDelta, delta < 0 ? P.danger : P.accHi)] : []),
      ],
    };
  };
  return {
    t: "col", w: INFO.w, gap: INFO.gap,
    children: [
      { t: "row", gap: INFO.name.gap, align: "center", children: [text(l.name, T.name, P.ink, { lh: INFO.name.lh }), level] },
      {
        t: "col", gap: INFO.hp.gap,
        children: [
          {
            t: "row", gap: INFO.hp.numGap, align: "baseline",
            children: [
              text(String(l.hp), T.hp, low ? P.danger : P.ink, { lh: 1 }),
              // 바뀌기 전 값은 작고 흐리게, 바뀐 값이 주인공이에요
              ...(equip?.maxHpTo === undefined
                ? [text(`/${l.maxHp}`, T.hpMax, P.ink3Spirit)]
                : [
                  text(`/${l.maxHp}${COPY.arrow}`, T.level, P.ink3Spirit),
                  text(String(equip.maxHpTo), T.hpMax, equip.maxHpTo < l.maxHp ? P.danger : P.accHi),
                ]),
            ],
          },
          { t: "row", children: [hpBar(l, heal)] },
        ],
      },
      { t: "row", gap: S.gap, align: "center", children: STAT_IDS.map(stat) },
      ...(l.unlocked.length ? [{
        t: "row", gap: C.rowGap,
        children: l.unlocked.map((name): Node => ({
          t: "row", h: C.h, pad: [0, C.padX, 0, C.padX], radius: C.radius, gap: C.gap, align: "center", style: { fill: withAlpha(P.acc, C.alpha) },
          children: [{ t: "icon", id: "g-cardnew", w: C.icon, h: C.icon, tint: P.accHi }, text(name, T.level, P.accHi)],
        })),
      } as Node] : []),
    ],
  };
}

/** HP 막대. heal이 있으면 지금 HP 뒤에 찰 만큼을 연두로 깔아요 (.hpbar3 i.gain) */
function hpBar(l: LaneVM, heal: number): Node {
  const B = INFO.hp.bar;
  const now = Math.max(INFO.hp.minFill, l.hp / l.maxHp);
  const base = bar(B.h, now, P.wallLo, l.down ? P.danger : P.ink2, { w: B.w, grow: false });
  if (heal <= 0) return base;
  const after = Math.min(1, (l.hp + heal) / l.maxHp);
  return {
    ...base,
    draw: (g, x, y, w, h) => {
      box(g, x, y, w, h, h / 2, { fill: P.wallLo });
      box(g, x, y, Math.max(h, w * after), h, h / 2, { fill: P.ok });
      box(g, x, y, Math.max(h, w * now), h, h / 2, { fill: P.ink2 });
    },
  };
}

function drawSocket(scene: Phaser.Scene, x: number, y: number, card?: LaneState["card"], open = false) {
  const K = SOCKET;
  const g = scene.add.graphics();
  if (!card) {
    box(g, x, y, K.w, K.h, K.radius, open
      ? { fill: withAlpha(P.accHi, K.okFill), ring: { width: K.ring, color: P.accHi, dash: K.dash } }
      : { ring: { width: K.ring, color: withAlpha(P.ink, K.lineAlpha), dash: K.dash } });
    return;
  }
  if (card.hot) {
    const o = K.hot.ring;
    const sh = shadowTexture(scene, K.w, K.h, K.radius, { y: 0, blur: K.hot.glow, color: withAlpha(P.accHi, K.hot.glowAlpha) });
    scene.add.image(x - sh.margin, y - sh.margin, sh.key).setOrigin(0, 0);
    box(scene.add.graphics(), x - o, y - o, K.w + o * 2, K.h + o * 2, K.radius + o, { ring: { width: o, color: P.accHi } });
  }
  createHandCard(scene, card.vm, x + K.card.x, y + K.card.y, { showRarity: true });
}

export function drawLane(scene: Phaser.Scene, l: LaneVM, i: number, st: LaneState = {}) {
  const { x, w, h, radius } = LANE;
  const y = laneY(i);
  const sh = shadowTexture(scene, w, h, radius, { y: LANE.shadow.y, blur: LANE.shadow.blur, color: withAlpha(P.tipShadow, LANE.shadow.alpha) });
  scene.add.image(x - sh.margin, y - sh.margin, sh.key).setOrigin(0, 0);
  const g = scene.add.graphics();
  if (st.hot) {
    const o = LANE.hot.outer;
    box(g, x - o, y - o, w + o * 2, h + o * 2, radius + o, { ring: { width: o, color: withAlpha(P.accHi, LANE.hot.alpha) } });
  }
  box(g, x, y, w, h, radius, { fill: P.glass });
  scene.add.image(x, y, washTexture(scene, !!l.down)).setOrigin(0, 0);
  const line = st.hot ? P.accHi : l.down ? withAlpha(P.danger, LANE.down.ring) : P.glassLine;
  box(scene.add.graphics(), x, y, w, h, radius, { ring: { width: LANE.ring, color: line } });

  const body = gather(scene, 0, 0, () => {
    drawFace(scene, l, x + RING.x, y + RING.y);
    const node = info(l, st.stat, st.heal, st.equip);
    render(scene, node, x + INFO.x, y + (h - size(node).h) / 2);
    l.slots.forEach((item, k) => {
      const at = slotAt(i, l.slots.length, k);
      const ghost = st.equip?.ghost?.slot === k ? st.equip.ghost : undefined;
      const slot: SlotDraw = ghost
        ? { item: ghost.item, state: "ghost", drop: ghost.drop, hot: ghost.hot }
        : { item, state: st.equip?.slots[k] ? "cand" : undefined };
      drawEquipSlot(scene, at.x, at.y, slot);
    });
    drawSocket(scene, x + SOCKET.x, y + SOCKET.y, st.card, st.open);
  });
  if (st.dim) body.setAlpha(LANE_PREVIEW.dim);
  if (st.deckTo !== undefined && l.deck !== undefined) {
    const D = SOCKET.deck;
    const deck: Node = {
      t: "row", h: D.h, gap: D.gap, align: "center",
      children: [
        { t: "icon", id: "i-deck", w: D.icon, h: D.icon, tint: P.ink3Spirit },
        text(`${l.deck}${COPY.arrow}`, T.was, P.ink3Spirit),
        text(String(st.deckTo), T.deck, P.accHi),
      ],
    };
    render(scene, deck, x + SOCKET.x + (SOCKET.w - size(deck).w) / 2, y + D.y);
  }
  if (st.on) {
    const zone = hitArea(scene, x, y, w, h, st.on.click ?? (() => {}));
    if (st.on.over) zone.on("pointerover", st.on.over);
    if (st.on.out) zone.on("pointerout", st.on.out);
  }
  // 칸 입력은 줄 입력 위에 놓여요
  for (const [k, on] of Object.entries(st.equip?.slots ?? {})) {
    const at = slotAt(i, l.slots.length, Number(k));
    const zone = hitArea(scene, at.x, at.y, EQUIP_SLOT.size, EQUIP_SLOT.size, on.click ?? (() => {}));
    if (on.over) zone.on("pointerover", on.over);
    if (on.out) zone.on("pointerout", on.out);
  }
}
