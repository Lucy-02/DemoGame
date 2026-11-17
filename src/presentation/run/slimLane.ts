// 정령 줄의 접힌 상태 (0046: 지도 위 슬림 파티 패널). 얼굴 · 이름 · Lv · HP만 보이고, 누르면 같은 자리에서 정령 줄로 펼쳐요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { faceTexture } from "../spiritArt";
import { P, bar, text } from "../spirits/views/parts";
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
  hp: { x: number; w: number; h: number; numX: number; numGap: number };
}

export function drawSlimLane(scene: Phaser.Scene, l: LaneVM, y: number, S: SlimLook, onClick?: () => void) {
  const g = scene.add.graphics();
  box(g, S.x, y, S.w, S.h, S.radius, { fill: P.glass, ring: { width: 1, color: P.glassLine } });
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
  mid({ t: "row", children: [bar(S.hp.h, l.hp / l.maxHp, P.wallLo, low ? P.danger : P.ink2, { w: S.hp.w, grow: false })] }, S.x + S.hp.x);
  mid({
    t: "row", gap: S.hp.numGap, align: "baseline",
    children: [text(String(l.hp), T.was, low ? P.danger : P.ink), text(`/${l.maxHp}`, T.level, P.ink3Spirit)],
  }, S.x + S.hp.numX);
  if (onClick) hitArea(scene, S.x, y, S.w, S.h, onClick);
}
