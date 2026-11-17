// 정령 줄의 접힌 상태 (0046: 지도 위 슬림 파티 패널). 얼굴 · 이름 · Lv · HP만 보이고, 누르면 같은 자리에서 정령 줄로 펼쳐요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { faceTexture } from "../spiritArt";
import { P, bar, text } from "../spirits/views/parts";
import { rgba, withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { hitArea, render, size, type Node } from "../style/flex";
import { placeholderArt } from "../style/placeholder";
import { ringTexture } from "../style/ring";
import { COPY } from "./copy";
import type { LaneVM } from "./viewmodel";

const T = tokens.provisional.text.result;

export interface SlimLook {
  x: number; w: number; h: number; radius: number;
  ring: { x: number; d: number; r: number; stroke: number; faceInset: number };
  name: { x: number; gap: number };
  hp: { x: number; w: number; h: number; numX: number; numGap: number; numRight?: number };
}

export interface SlimState { hpTo?: number; maxTo?: number; hot?: boolean }

export function drawSlimLane(scene: Phaser.Scene, l: LaneVM, y: number, S: SlimLook, onClick?: () => void, st: SlimState = {}) {
  const g = scene.add.graphics();
  if (st.hot) box(g, S.x - 4, y - 4, S.w + 8, S.h + 8, S.radius + 4, { fill: withAlpha(P.accHi, 0.14) });
  box(g, S.x, y, S.w, S.h, S.radius, { fill: P.glass, ring: { width: 1, color: st.hot ? P.accHi : P.glassLine } });
  const R = S.ring;
  const rx = S.x + R.x, ry = y + (S.h - R.d) / 2;
  const d = R.d - R.faceInset * 2;
  circle(g, rx + R.d / 2, ry + R.d / 2, d, { fill: P.wall });
  if (l.face && scene.textures.exists(l.face.key)) scene.add.image(rx + R.faceInset, ry + R.faceInset, faceTexture(scene, l.face, d)).setOrigin(0, 0);
  else placeholderArt(scene, rx + R.d / 4, ry + R.d / 4, R.d / 2, R.d / 2, P.glassLine);
  scene.add.image(rx, ry, ringTexture(scene, `slim:ring:${R.d}`, { d: R.d, r: R.r, stroke: R.stroke, track: { color: P.wallLo }, arcs: [] })).setOrigin(0, 0);

  const mid = (n: Node, x: number) => render(scene, n, x, y + (S.h - size(n).h) / 2);
  mid({ t: "row", gap: S.name.gap, align: "baseline", children: [text(l.name, T.name, P.ink), text(COPY.lv(l.level), T.level, P.ink3Spirit)] }, S.x + S.name.x);
  const low = !!l.down;
  const max = st.maxTo ?? l.maxHp, to = st.hpTo ?? l.hp;
  const changed = to !== l.hp || max !== l.maxHp;
  const base = bar(S.hp.h, l.hp / l.maxHp, P.wallLo, low ? P.danger : P.ink2, { w: S.hp.w, grow: false });
  const hp: Node = !changed ? base : {
    ...base,
    draw: (gg, x, by, w, h) => {
      box(gg, x, by, w, h, h / 2, { fill: P.wallLo });
      const now = Math.min(1, l.hp / max), after = Math.min(1, to / max);
      const [far, near, color] = after >= now ? [after, now, P.ok] : [now, after, P.danger];
      box(gg, x, by, Math.max(h, w * far), h, h / 2, { fill: color });
      const nw = Math.max(h / 2, w * near), r = h / 2;
      const c = rgba(P.ink2);
      gg.fillStyle(c.color, c.alpha).fillRoundedRect(x, by, nw, h, nw >= w ? r : { tl: r, bl: r, tr: 0, br: 0 });
    },
  };
  mid({ t: "row", children: [hp] }, S.x + S.hp.x);
  const num: Node = {
    t: "row", gap: S.hp.numGap, align: "baseline",
    children: [
      ...(to !== l.hp ? [text(`${l.hp}${COPY.arrow}`, T.level, P.ink3Spirit), text(String(to), T.was, to > l.hp ? P.ok : P.danger)] : [text(String(l.hp), T.was, low ? P.danger : P.ink)]),
      ...(max !== l.maxHp ? [text(`/${l.maxHp}${COPY.arrow}`, T.level, P.ink3Spirit), text(String(max), T.level, P.accHi)] : [text(`/${l.maxHp}`, T.level, P.ink3Spirit)]),
    ],
  };
  // 숫자는 오른쪽 끝에 맞춰요 (a→b로 길어져도 줄 밖으로 안 나가게)
  if (S.hp.numRight) mid(num, S.x + S.w - S.hp.numRight - size(num).w);
  else mid(num, S.x + S.hp.numX);
  if (onClick) hitArea(scene, S.x, y, S.w, S.h, onClick);
}
