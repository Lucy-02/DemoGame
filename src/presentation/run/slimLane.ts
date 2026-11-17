// 정령 줄의 접힌 상태 (0046: 지도 위 슬림 파티 패널). 얼굴 · 이름 · Lv · HP만 보이고, 누르면 같은 자리에서 정령 줄로 펼쳐요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { faceTexture } from "../spiritArt";
import { P, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { hitArea, render, size, type Node } from "../style/flex";
import { placeholderArt } from "../style/placeholder";
import { ringTexture } from "../style/ring";
import { hpBarNode } from "./lanes";
import { FRAME, SLIM_LANE } from "./layout";
import { COPY, STAT_ICON } from "./copy";
import type { LaneVM, StatId } from "./viewmodel";

const T = tokens.provisional.text.result;

export interface SlimLook {
  x: number; w: number; h: number; radius: number;
  ring: { x: number; d: number; r: number; stroke: number; faceInset: number };
  name: { x: number; gap: number };
  hp: { x: number; w: number; h: number; numX: number; numGap: number };
  /** 능력치 칩 자리 (상점) */
  statX?: number;
}

/** 미리보기 (이벤트 · 휴식 · 상점): 올린 선택지가 바꾸는 HP · 최대 HP와 밝은 테.
 *  open = 집은 카드를 배울 수 있는 줄(점선 테), stat = 그 카드가 쓰는 능력치 하나 (상점) */
export interface SlimState {
  hpTo?: number;
  maxTo?: number;
  hot?: boolean;
  open?: boolean;
  stat?: StatId;
}

export function drawSlimLane(scene: Phaser.Scene, l: LaneVM, y: number, S: SlimLook, onClick?: () => void, st: SlimState = {}) {
  const g = scene.add.graphics();
  const H = SLIM_LANE.hot;
  if (st.hot) box(g, S.x - H.outer, y - H.outer, S.w + H.outer * 2, S.h + H.outer * 2, S.radius + H.outer, { fill: withAlpha(P.accHi, H.alpha) });
  box(g, S.x, y, S.w, S.h, S.radius, {
    fill: P.glass,
    ring: st.open && !st.hot ? { width: 1, color: P.accHi, dash: SLIM_LANE.open.dash } : { width: 1, color: st.hot ? P.accHi : P.glassLine },
  });
  const R = S.ring;
  const rx = S.x + R.x, ry = y + (S.h - R.d) / 2;
  const d = R.d - R.faceInset * 2;
  circle(g, rx + R.d / 2, ry + R.d / 2, d, { fill: P.wall });
  if (l.face && scene.textures.exists(l.face.key)) scene.add.image(rx + R.faceInset, ry + R.faceInset, faceTexture(scene, l.face, d)).setOrigin(0, 0);
  else placeholderArt(scene, rx + R.d / 4, ry + R.d / 4, R.d / 2, R.d / 2, P.glassLine);
  scene.add.image(rx, ry, ringTexture(scene, `slim:ring:${R.d}`, { d: R.d, r: R.r, stroke: R.stroke, track: { color: P.wallLo }, arcs: [] })).setOrigin(0, 0);

  const mid = (n: Node, x: number) => render(scene, n, x, y + (S.h - size(n).h) / 2);
  mid({ t: "row", gap: S.name.gap, align: "baseline", children: [text(l.name, T.name, P.ink), text(COPY.lv(l.level), T.level, P.ink3Spirit)] }, S.x + S.name.x);
  if (st.stat && S.statX !== undefined) {
    const C = SLIM_LANE.stat, k = st.stat;
    mid({ t: "row", gap: C.gap, align: "center", children: [{ t: "icon", id: STAT_ICON[k], w: C.icon, h: C.icon, tint: P.stat[k] }, text(String(l.stats[k]), T.was, P.stat[k])] }, S.x + S.statX);
  }
  const low = !!l.down;
  const to = st.hpTo ?? l.hp, max = st.maxTo ?? l.maxHp;
  const hpMoves = to !== l.hp, maxMoves = max !== l.maxHp;
  mid({ t: "row", children: [hpBarNode(l, to, max, S.hp)] }, S.x + S.hp.x);
  const num: Node = {
    t: "row", gap: S.hp.numGap, align: "baseline",
    children: [
      ...(hpMoves
        ? [text(`${l.hp}${COPY.arrow}`, T.level, P.ink3Spirit), text(String(to), T.was, to > l.hp ? P.ok : P.danger)]
        : [text(String(l.hp), T.was, low ? P.danger : P.ink)]),
      ...(maxMoves
        ? [text(`/${l.maxHp}${COPY.arrow}`, T.level, P.ink3Spirit), text(String(max), T.level, P.accHi)]
        : [text(`/${l.maxHp}`, T.level, P.ink3Spirit)]),
    ],
  };
  // a→b로 길어지면 오른쪽 끝(얼굴 고리와 같은 여백)에 맞춰요
  mid(num, hpMoves || maxMoves ? S.x + S.w - R.x - size(num).w : S.x + S.hp.numX);
  return onClick ? hitArea(scene, S.x, y, S.w, S.h, onClick) : undefined;
}

/** 얇은 줄 묶음을 화면 가운데 높이에 (이벤트 · 휴식, Lucy 2026-11-17 A) */
export function drawSlimParty(scene: Phaser.Scene, lanes: LaneVM[], st: (l: LaneVM) => SlimState) {
  const S = SLIM_LANE;
  let y = Math.round((FRAME.h - (lanes.length * (S.h + S.gap) - S.gap)) / 2);
  for (const l of lanes) {
    drawSlimLane(scene, l, y, S, undefined, st(l));
    y += S.h + S.gap;
  }
}
