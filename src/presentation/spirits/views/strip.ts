// 아래 띠: 보유 정령 수·정렬·필터·출전, 원형 얼굴 타일. 정본 .q-strip, .q-tile, .q-ring (장부 §3-2 B)
import type * as Phaser from "phaser";
import { rgba, transparentOf } from "../../style/color";
import { box, circle } from "../../style/draw";
import { render, size, hitArea, type Node } from "../../style/flex";
import { canvasTexture } from "../../style/gradient";
import { placeholderArt } from "../../style/placeholder";
import { COPY } from "../copy";
import { FRAME, STRIP } from "../layout";
import type { RingVM, SpiritsVM, TileVM } from "../viewmodel";
import { P, T, button, glass, rule, text } from "./parts";

const S = STRIP;
export const STRIP_ICONS = [
  ["g-down", S.sort.icon], ["e-fire", S.filter.icon], ["i-sword", S.filter.icon], ["g-ring", S.filter.icon],
  ["g-fin", S.chip.icon], ["g-flag", S.flag.icon], ["e-fire", S.name.icon], ["e-water", S.name.icon], ["e-wind", S.name.icon], ["e-none", S.name.icon],
] as const;

/** 링 텍스처 (.q-ring svg): 바탕 원 + 진행 호. 최종 단계는 얇은 상아 원 */
function ringTexture(scene: Phaser.Scene, ring: RingVM): string {
  const R = S.ring;
  const pct = Math.round(ring.value * 100);
  return canvasTexture(scene, `spirits:ring:${ring.kind}:${pct}`, R.d, R.d, (ctx) => {
    const c = R.d / 2;
    ctx.lineCap = "round";
    if (ring.kind !== "final") {
      ctx.strokeStyle = P.veil["14"];
      ctx.lineWidth = R.stroke;
      ctx.beginPath();
      ctx.arc(c, c, R.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = ring.kind === "final" ? P.ink : ring.kind === "ready" ? P.ok : P.ink2;
    ctx.lineWidth = ring.kind === "final" ? R.finalStroke : R.stroke;
    if (pct <= 0) return;
    ctx.beginPath();
    ctx.arc(c, c, R.r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * pct) / 100);
    ctx.stroke();
  });
}

/** 타일 사이 세로선: 위아래로 흐려지는 1px (.q-tile+.q-tile::after) */
function dividerTexture(scene: Phaser.Scene, h: number): string {
  return canvasTexture(scene, `spirits:divider:${h}`, 1, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, transparentOf(P.glassLine));
    g.addColorStop(0.22, P.glassLine);
    g.addColorStop(0.78, P.glassLine);
    g.addColorStop(1, transparentOf(P.glassLine));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, h);
  });
}

function head(vm: SpiritsVM): Node {
  return {
    t: "col", w: S.head.w, gap: S.head.gap,
    children: [
      { t: "row", gap: S.head.titleGap, align: "baseline", children: [text(COPY.owned, T.stripHead, P.ink2), text(String(vm.roster.length), T.stripCount, P.ink)] },
      {
        t: "row", gap: S.head.toolsGap, align: "center",
        children: [
          {
            t: "row", h: S.sort.h, pad: [0, S.sort.padX, 0, S.sort.padX], radius: S.sort.radius, gap: S.sort.gap, align: "center",
            style: { fill: P.veil["08"] },
            children: [text(COPY.sort, T.tool, P.ink), { t: "icon", id: "g-down", w: S.sort.icon, h: S.sort.icon, tint: P.ink2 }],
          },
          {
            t: "row", gap: S.filter.gap,
            children: ["e-fire", "i-sword", "g-ring"].map((id): Node => {
              const inX = (S.filter.w - S.filter.icon) / 2, inY = (S.filter.h - S.filter.icon) / 2;
              return {
                t: "col", w: S.filter.w, h: S.filter.h, radius: S.filter.radius, pad: [inY, inX, inY, inX], style: { fill: P.veil["06"] },
                children: [{ t: "icon", id, w: S.filter.icon, h: S.filter.icon, tint: P.ink2 }],
              };
            }),
          },
        ],
      },
      {
        t: "col",
        children: [
          rule(S.party.line),
          {
            t: "row", mt: S.party.pt, justify: "between", align: "center", gap: S.party.gap,
            children: [
              {
                t: "row", align: "baseline",
                children: [
                  text(COPY.deployed, T.tool, P.ink2),
                  text(String(vm.deployed), T.partyNum, P.ink, { ml: S.party.numMl }),
                  text(`/${vm.partySize}`, T.tool, P.ink2),
                ],
              },
              // 편성은 출전 준비 화면(장부 §7 Q4)이 생기면 연결해요
              button(COPY.partyEdit, { size: T.tool, h: S.party.button.h, radius: S.party.button.radius, padX: S.party.button.padX }),
            ],
          },
        ],
      },
    ],
  };
}

/** 타일 하나를 (x, y)에 그려요. 높이를 돌려줘요 */
function drawTile(scene: Phaser.Scene, t: TileVM, selected: boolean, x: number, y: number, onSelect: (id: string) => void) {
  const R = S.ring, tile = S.tile;
  const name: Node = {
    t: "row", gap: S.name.gap, align: "center",
    children: [{ t: "icon", id: t.element, w: S.name.icon, h: S.name.icon, tint: P.ink3Spirit }, text(t.name, T.tileName, P.ink)],
  };
  const nameSize = size(name);
  const h = tile.pad[0] + R.d + S.name.mt + nameSize.h + tile.pad[2];
  const g = scene.add.graphics();
  if (selected) {
    box(g, x, y, tile.w, h, tile.radius, { fill: P.glassSel, ring: { width: tile.selRing, color: P.accHi } });
    const cx = x + tile.w / 2, top = y + tile.caretTop;
    const c = rgba(P.accHi);
    g.fillStyle(c.color, c.alpha).fillTriangle(cx - tile.caret, top + tile.caret, cx + tile.caret, top + tile.caret, cx, top);
  }
  // 링 + 얼굴 자리
  const rx = x + (tile.w - R.d) / 2, ry = y + tile.pad[0];
  const faceD = R.d - R.faceInset * 2;
  circle(g, rx + R.d / 2, ry + R.d / 2, faceD, { fill: P.wall });
  if (t.face && scene.textures.exists(t.face)) {
    render(scene, { t: "image", key: t.face, w: faceD, h: faceD, round: true }, rx + R.faceInset, ry + R.faceInset);
  } else {
    const ph = faceD / 2;
    placeholderArt(scene, rx + (R.d - ph) / 2, ry + (R.d - ph) / 2, ph, ph, P.glassLine);
  }
  scene.add.image(rx, ry, ringTexture(scene, t.ring)).setOrigin(0, 0);
  // 단계 칩: 링 아래 가운데에 걸쳐요
  const chip: Node = {
    t: "row", h: S.chip.h, pad: [0, S.chip.padX, 0, S.chip.padX], radius: S.chip.radius, gap: S.chip.gap, align: "center",
    style: { fill: P.floor, ring: { width: S.chip.ring, color: P.glassLine } },
    children: [
      ...(t.ring.kind === "final" ? [{ t: "icon", id: "g-fin", w: S.chip.icon, h: S.chip.icon, tint: P.ink } as Node] : []),
      text(t.chip, T.chip, P.ink),
    ],
  };
  const cs = size(chip);
  render(scene, chip, rx + (R.d - cs.w) / 2, ry + R.d - S.chip.bottom - cs.h);
  // 출전 깃발 (왼쪽 위), 할 일 배지 (오른쪽 위, 개수)
  if (t.deployed) {
    const f = S.flag;
    const fg = scene.add.graphics();
    circle(fg, rx + f.at + f.d / 2, ry + f.at + f.d / 2, f.d, { fill: P.floor, ring: { width: 1, color: P.glassLine } });
    render(scene, { t: "icon", id: "g-flag", w: f.icon, h: f.icon, tint: P.ink2 }, rx + f.at + (f.d - f.icon) / 2, ry + f.at + (f.d - f.icon) / 2);
  }
  if (t.todo > 0) {
    const b = S.badge;
    render(scene, countBadge(t.todo), rx + R.d - b.at - b.d - b.outer, ry + b.at - b.outer);
  }
  render(scene, name, x + (tile.w - nameSize.w) / 2, ry + R.d + S.name.mt);
  hitArea(scene, x, y, tile.w, h, () => onSelect(t.id));
  return h;
}

/** 할 일 개수 배지 (0021: 타일 배지는 개수) */
function countBadge(n: number): Node {
  const b = S.badge;
  const core: Node = {
    t: "row", round: true, w: b.d, h: b.d, justify: "center", align: "center", style: { fill: P.ink },
    children: [text(String(n), T.tabCount, P.floor, { lh: 1 })],
  };
  return { t: "col", round: true, w: b.d + b.outer * 2, h: b.d + b.outer * 2, pad: [b.outer, b.outer, b.outer, b.outer], style: { fill: P.ringOuter }, children: [core] };
}

/** 띠에 한 번에 들어가는 타일 수 (넘치면 휠로 넘겨요) */
export function stripFit(): number {
  const room = FRAME.w - S.padX - (S.padX + S.head.w + S.gap);
  return Math.max(1, Math.floor((room + S.tiles.gap) / (S.tile.w + S.tiles.gap)));
}

/** 맨 앞 타일 번호를 0 ~ (전체 - 들어가는 수) 안으로 */
export const clampFrom = (from: number, total: number) => Math.max(0, Math.min(from, total - stripFit()));

export function drawStrip(scene: Phaser.Scene, vm: SpiritsVM, from: number, onSelect: (id: string) => void) {
  const top = FRAME.h - S.h;
  const g = scene.add.graphics();
  box(g, 0, top, FRAME.w, S.h, 0, glass());
  box(g, 0, top, FRAME.w, S.line, 0, { fill: P.glassLine });
  const h = head(vm);
  const hs = size(h);
  render(scene, h, S.padX, top + (S.h - hs.h) / 2);

  const tileTop = top + (S.h - tileHeight(vm.roster[0])) / 2;
  const x0 = S.padX + S.head.w + S.gap;
  const shown = vm.roster.slice(from, from + stripFit());
  const selIndex = shown.findIndex((t) => t.id === vm.selected);
  shown.forEach((t, i) => {
    const x = x0 + i * (S.tile.w + S.tiles.gap);
    const th = drawTile(scene, t, i === selIndex, x, tileTop, onSelect);
    // 고른 타일 양옆 선은 숨겨요
    if (i > 0 && i !== selIndex && i - 1 !== selIndex) {
      const d = S.tile.divider;
      scene.add.image(x + d.x, tileTop + d.inset, dividerTexture(scene, th - d.inset * 2)).setOrigin(0, 0);
    }
  });
}

function tileHeight(t: TileVM | undefined): number {
  const nameH = t ? size(text(t.name, T.tileName, P.ink)).h : 0;
  return S.tile.pad[0] + S.ring.d + S.name.mt + nameH + S.tile.pad[2];
}
