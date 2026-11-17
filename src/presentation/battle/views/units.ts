// 아군·적: 필드 그림, 발밑 그림자, 발밑 정보 묶음, 적 머리 위 의도. 정보 묶음은 "캡슐 막대 V1(두 줄)" 시안 (R3-1 rev 6):
// 판 없이 발 가운데에 대칭으로, 첫 줄 = HP 막대(그림자 폭) + 가운데 HP 수, 둘째 줄 = 기호 칩(속성 · 방어도 · 받을 피해|약점 · 상태).
// 가리키면 묶음 아래에 풀이가 떠요: 유닛은 한두 줄(drawUnitTip), 기호는 한 줄(drawMarkTip). 묶음은 커지지 않아요.
// 대상 고르기 미리보기(.fld-pv, 결정 0013)도 여기서 그려요: 대상의 결과(강조색 수·빗금 구간)와 빛. 발밑 고리(타원)는 없어요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { mix, transparentOf } from "../../style/color";
import { cubicBezier, ms } from "../../style/ease";
import { render, size, type Node } from "../../style/flex";
import { gather } from "../../style/gather";
import { canvasTexture, linear } from "../../style/gradient";
import { iconFit, loadIcon, paintIcon } from "../../style/icons";
import { placeholderArt } from "../../style/placeholder";
import { shadowTexture } from "../../style/shadow";
import { inlineLine, lineBox, measure, type Span } from "../../style/text";
import type { RichText } from "../../tooltip/content";
import { faceKey, preloadFaces } from "../../faces";
import { miniSlotNode, preloadEquipArt } from "../../run/equip";
import { drawAllyArt } from "../allyArt";
import { drawEnemyArt, preloadEnemyArt } from "../enemyArt";
import { preloadSpiritArt } from "../../spiritArt";
import { EQUIP_MINI } from "../../run/layout";
import { TERMS, termOfIcon } from "../../glossary/terms";
import { COPY, elementName, statusName } from "../copy";
import { ALLY, ENEMY, FRAME, GROUND, INFO as I, INTENT, PREVIEW as PV, TIP } from "../layout";
import type { AllyVM, BattleVM, Change, EnemyOutcomeVM, EnemyVM, IntentVM, StatusVM, TraitVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;
const LETHAL = tokens.provisional.motion.lethal;
const PULSE = tokens.provisional.motion.lossPulse;

/** 속성색 (땅·전기·얼음·그림자는 0070 후보 1, 임시). 기호가 아직 없는 속성은 무속성 색으로 그려요 */
const ELEMENT_TINT: Record<string, string> = {
  "el-fire": P.el.fire, "el-water": P.el.water, "el-forest": P.el.wood, "el-wind": P.el.wind, "el-light": P.el.light, "el-none": P.el.none,
  "el-earth": P.el.earth, "el-electric": P.el.electric, "el-ice": P.el.ice, "el-shadow": P.el.shadow,
};
const elementTint = (el: string) => ELEMENT_TINT[el] ?? P.el.none;

/** 켜진 약점 배지의 기호 크기 (.weak.on scale 1.25) */
const WEAK_ON_ICON = Math.round(I.weak.icon * I.weak.on.scale);

export function preloadUnits(scene: Phaser.Scene, vm: BattleVM) {
  preloadFaces(scene);
  const statuses = (list: StatusVM[]) => list.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  preloadSpiritArt(scene, vm.allies.filter((a) => a.stage).map((a) => a.face));
  for (const a of vm.allies) {
    statuses(a.statuses);
    a.statuses.forEach((s) => loadIcon(scene, s.icon, TIP.unit.stat.icon));
    if (a.element) loadIcon(scene, a.element, I.element.icon);
  }
  preloadEquipArt(scene, vm.allies.flatMap((a) => (a.equip ?? []).map((e) => e.id)));
  loadIcon(scene, "fx-block", I.block.icon);
  loadIcon(scene, "fx-damage", I.incoming.icon);
  loadIcon(scene, "fx-damage", I.incoming.lethalIcon);
  loadIcon(scene, "g-flag", I.flag.icon);
  loadIcon(scene, "g-flag", TIP.unit.stat.icon);
  preloadEnemyArt(scene, vm.enemies.map((e) => e.art));
  for (const e of vm.enemies) {
    loadIcon(scene, e.element, I.element.icon);
    if (e.weakTo) {
      loadIcon(scene, e.weakTo, I.weak.icon);
      loadIcon(scene, e.weakTo, WEAK_ON_ICON);
    }
    if (e.intent) loadIcon(scene, e.intent.icon, INTENT.icon);
    if (e.intent?.target === "random") loadIcon(scene, RANDOM_ICON, INTENT.face);
    statuses(e.statuses);
    for (const t of e.traits ?? []) loadIcon(scene, t.icon, I.status.icon);
  }
  if (Object.keys(vm.plays).length > 0) loadIcon(scene, "fx-damage", PV.hits.icon);
  if (vm.acted) for (const id of POP_ICONS) loadIcon(scene, id, PV.hits.icon);
}

// ── 구워 두는 그림: 얇은 테·작은 원·빗금은 WebGL 도형 대신 canvas에 그려요 ──────────────

const disc = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) => {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
};

/** HP 막대에 그릴 양 (HP 단위). keep = 남는 HP, loss = 받을 피해로 깎일 구간, gone = 조준 결과로 깎일 구간 */
interface Bar {
  max: number;
  keep: number;
  loss?: number;
  lethal?: boolean;
  gone?: number;
}

/** 막대 텍스처 (.bar): 어두운 외곽 캡슐 안에 구간을 틈 없이 이어 채워요. 구간 경계는 픽셀에 붙여요.
 *  part: all = 전부, base = 깎일 구간만 빼고(깜빡임 바닥), loss = 깎일 구간만(깜빡임 덮개). pulse = 밝은 테 + 바깥 어두운 테 */
function barTexture(scene: Phaser.Scene, b: Bar, part: "all" | "base" | "loss", pulse: boolean): string {
  const B = I.bar, m = B.margin, w = I.w;
  const inner = w - B.line * 2, ih = B.h - B.line * 2;
  const seg = b.loss ?? b.gone ?? 0;
  const end = seg > 0 ? Math.min(inner, Math.max(1, Math.round((inner * (b.keep + seg)) / b.max))) : 0;
  const k = seg > 0 ? Math.min(end - 1, Math.round((inner * b.keep) / b.max)) : Math.round((inner * b.keep) / b.max);
  const kind = seg <= 0 ? "none" : b.gone ? "gone" : b.lethal ? "lethal" : "loss";
  return canvasTexture(scene, `battle:bar:${k}:${end}:${kind}:${part}:${pulse}`, w + m * 2, B.h + m * 2, (ctx) => {
    const capsule = (x: number, y: number, cw: number, ch: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, r);
    };
    if (part !== "loss") {
      if (pulse) {
        const o = B.pulseOutline;
        capsule(m - o, m - o, w + o * 2, B.h + o * 2, B.radius + o);
        ctx.fillStyle = P.floor;
        ctx.fill();
      }
      capsule(m, m, w, B.h, B.radius);
      ctx.fillStyle = pulse ? P.ink : P.floor;
      ctx.fill();
    }
    const ix = m + B.line, iy = m + B.line;
    capsule(ix, iy, inner, ih, B.radius - B.line);
    ctx.clip();
    if (part !== "loss") {
      ctx.fillStyle = P.wallLo;
      ctx.fillRect(ix, iy, inner, ih);
      ctx.fillStyle = P.hp;
      ctx.fillRect(ix, iy, k, ih);
    }
    if (kind === "none" || part === "base") return;
    ctx.translate(ix + k, iy);
    if (kind === "loss") {
      ctx.fillStyle = P.danger;
      ctx.fillRect(0, 0, end - k, ih);
      return;
    }
    const [c1, c2, [a, gap]] = kind === "lethal" ? [P.danger, P.floor, B.lethalStripe] as const : [P.accHi, P.pvFill, B.pvStripe] as const;
    linear(ctx, end - k, ih, B.stripeDeg, [[c1, { px: 0 }], [c1, { px: a }], [c2, { px: a }], [c2, { px: a + gap }]], true);
  });
}

/** 막대를 (x, y)에. pulse면 깎일 구간이 깜빡여요 (적을 가리킬 때 그 적이 노리는 아군) */
function drawBar(scene: Phaser.Scene, x: number, y: number, b: Bar, pulse: boolean) {
  const m = I.bar.margin;
  if (!pulse) {
    scene.add.image(x - m, y - m, barTexture(scene, b, "all", false)).setOrigin(0, 0);
    return;
  }
  scene.add.image(x - m, y - m, barTexture(scene, b, "base", true)).setOrigin(0, 0);
  const loss = scene.add.image(x - m, y - m, barTexture(scene, b, "loss", false)).setOrigin(0, 0);
  const d = ms(PULSE.duration), ease = cubicBezier(PULSE.easing);
  scene.tweens.chain({
    targets: loss, loop: -1,
    tweens: [
      { alpha: PULSE.low, duration: d * PULSE.peak, ease },
      { alpha: 1, duration: d * (1 - PULSE.peak), ease },
    ],
  });
}

/** 속성 배지 바탕 (.el): 어두운 테 두른 종이색 원, 속성색을 옅게 섞어요 */
function elementTexture(scene: Phaser.Scene, el: string): string {
  const E = I.element, color = mix(elementTint(el), P.paper, E.mix);
  return canvasTexture(scene, `battle:el:${color}`, E.d, E.d, (ctx) => {
    disc(ctx, E.d / 2, E.d / 2, E.d / 2, P.floor);
    disc(ctx, E.d / 2, E.d / 2, E.d / 2 - E.line, color);
  });
}

/** 약점 배지 바탕 (.weak): 어두운 원 + 십자 틈이 난 조준 테. on = 맞는 속성 카드를 든 동안 (warn 원, 바깥 warn 테, 1.25배) */
export function weakTexture(scene: Phaser.Scene, on: boolean): { key: string; d: number } {
  const W = I.weak, k = on ? W.on.scale : 1;
  const inner = W.d / 2 - W.line;
  const d = Math.ceil((on ? (inner + W.on.ringOut) * 2 : W.d) * k);
  const key = canvasTexture(scene, `battle:weak:${on}`, d, d, (ctx) => {
    ctx.translate(d / 2, d / 2);
    ctx.scale(k, k);
    disc(ctx, 0, 0, W.d / 2, P.floor);
    const ring = (r: number, color: string) => {
      ctx.beginPath();
      ctx.arc(0, 0, r - W.ring / 2, 0, Math.PI * 2);
      ctx.lineWidth = W.ring;
      ctx.strokeStyle = color;
      ctx.stroke();
    };
    if (on) {
      disc(ctx, 0, 0, inner, P.warn);
      ring(inner + W.on.ringOut, P.warn);
      return;
    }
    ring(inner, P.ink);
    ctx.fillStyle = P.floor;
    ctx.fillRect(-W.gap / 2, -W.d / 2, W.gap, W.d);
    ctx.fillRect(-W.d / 2, -W.gap / 2, W.d, W.gap);
  });
  return { key, d };
}

/** 충격 기호 (.imp): 어두운 외곽 받침 위에 정본 fx-damage. 치명이면 뒤에 돌린 별을 겹쳐 16갈래 */
function impactTexture(scene: Phaser.Scene, lethal: boolean): { key: string; s: number; margin: number } {
  const N = I.incoming, s = lethal ? N.lethalIcon : N.icon, m = N.margin;
  const key = canvasTexture(scene, `battle:impact:${lethal}`, s + m * 2, s + m * 2, (ctx) => {
    const burst = new Path2D(N.burst);
    const star = (turned: boolean, color: string, stroke?: number) => {
      ctx.save();
      ctx.translate(m, m);
      ctx.scale(s / N.grid, s / N.grid);
      if (turned) {
        ctx.translate(N.grid / 2, N.grid / 2);
        ctx.rotate((N.spikeDeg * Math.PI) / 180);
        ctx.translate(-N.grid / 2, -N.grid / 2);
      }
      ctx.fillStyle = color;
      ctx.fill(burst);
      if (stroke) {
        ctx.strokeStyle = color;
        ctx.lineWidth = stroke;
        ctx.lineJoin = "round";
        ctx.stroke(burst);
      }
      ctx.restore();
    };
    if (lethal) star(true, P.floor, N.back);
    star(false, P.floor, N.back);
    if (lethal) {
      star(true, P.danger, N.spike);
      star(false, P.floor);
    }
    paintIcon(ctx, scene, "fx-damage", s, m, m, P.danger);
  });
  return { key, s, margin: m };
}

/** 앞열 깃발 (.flag): 종이색 기호에 어두운 외곽선 */
function flagTexture(scene: Phaser.Scene): { key: string; margin: number } {
  const F = I.flag, m = Math.ceil(F.outline);
  const key = canvasTexture(scene, "battle:flag", F.icon + m * 2, F.icon + m * 2, (ctx) => {
    for (const [dx, dy] of [[F.outline, 0], [-F.outline, 0], [0, F.outline], [0, -F.outline]]) {
      paintIcon(ctx, scene, "g-flag", F.icon, m + dx, m + dy, P.floor);
    }
    paintIcon(ctx, scene, "g-flag", F.icon, m, m, P.paper);
  });
  return { key, margin: m };
}

/** 모든 아군 (.all): 겹친 점 셋, 점마다 바깥 테. 작은 원이라 canvas에 구워요 */
function allDotsTexture(scene: Phaser.Scene): { key: string; w: number; h: number; margin: number } {
  const A = INTENT.all;
  const step = A.dot - A.overlap;
  const w = step * 2 + A.dot + A.ring * 2, h = A.dot + A.ring * 2;
  const key = "battle:intent-all";
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h))!;
    const ctx = tex.getContext();
    for (let k = 0; k < 3; k++) {
      const cx = A.ring + A.dot / 2 + k * step, cy = h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, A.dot / 2 + A.ring, 0, Math.PI * 2);
      ctx.fillStyle = P.glassD;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, A.dot / 2, 0, Math.PI * 2);
      ctx.fillStyle = P.ink2;
      ctx.fill();
    }
    tex.refresh();
  }
  return { key, w, h, margin: A.ring };
}

/** 칩 바탕 (.blk, .st): 둥근 상자. line을 주면 어두운 테를 둘러요 */
function pillTexture(scene: Phaser.Scene, w: number, h: number, bg: ChipBg): string {
  const line = bg.line ?? 0;
  return canvasTexture(scene, `battle:pill:${w}x${h}r${bg.radius}:${bg.fill}:${line}`, w, h, (ctx) => {
    if (line) {
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, bg.radius);
      ctx.fillStyle = P.floor;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(line, line, w - line * 2, h - line * 2, bg.radius - line);
    ctx.fillStyle = bg.fill;
    ctx.fill();
  });
}

/** 풀이 꼬리 (.tail, .mt::before): 45° 돌린 네모의 위쪽 절반. 윗변 둘에 얇은 선 */
function tailTexture(scene: Phaser.Scene, d: number): { key: string; w: number; h: number } {
  const w = Math.ceil(d * Math.SQRT2), h = Math.ceil(d / Math.SQRT2);
  const key = canvasTexture(scene, `battle:tip-tail@${d}`, w, h, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = P.floor;
    ctx.fill();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.lineWidth = TIP.ring * 2;
    ctx.strokeStyle = P.glassLine;
    ctx.stroke();
  });
  return { key, w, h };
}

// ── 조각 ──────────────────────────────────────────────

const text = (t: string, sz: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size: sz, color, ...extra }) as Node;

/** 기호 옆 숫자: 잉크 가운데를 줄 가운데에 (기호도 같은 규칙, IconNode.fit) */
const num = (n: number, sz: string, color: string, extra: Partial<Node> = {}): Node => text(String(n), sz, color, { ink: true, ...extra });

/** 기호 풀이의 설명: 용어 사전의 첫 문장 (0102) */
const SUB = Object.fromEntries(TERMS.map((t) => [t.id, t.what]));

/** 기호 한 줄 풀이 (.mt): 제목(이름 + 수) · 설명 */
export interface MarkTip {
  title: string;
  sub?: string;
}

/** 가리킬 수 있는 기호의 자리와 풀이 */
export interface Mark {
  x: number;
  y: number;
  w: number;
  h: number;
  tip: MarkTip;
}

interface ChipBg {
  fill: string;
  radius: number;
  /** 어두운 테 두께 (border) */
  line?: number;
}

/** 둘째 줄 칩 하나. tip이 없으면 가리켜도 풀이가 없어요. bg = 구워서 까는 바탕 */
interface Chip {
  node: Node;
  tip?: MarkTip;
  bg?: ChipBg;
}

/** 바탕이 있는 칩: 폭을 픽셀에 맞춰요 (구운 바탕과 내용이 어긋나지 않게) */
const pill = (node: Node & { t: "row" }, bg: ChipBg, tip?: MarkTip): Chip => ({ node: { ...node, w: Math.ceil(size(node).w) }, bg, tip });

const named = (label: string, name: string | undefined) => (name ? `${label} ${name}` : label);

/** 속성 배지 (.el) */
function elementChip(scene: Phaser.Scene, el: string): Chip {
  const E = I.element;
  return {
    node: {
      t: "block", w: E.d, h: E.d,
      draw: (_g, x, y) => {
        scene.add.image(x, y, elementTexture(scene, el)).setOrigin(0, 0);
        iconFit(scene, x + (E.d - E.icon) / 2, y + (E.d - E.icon) / 2, el, E.icon, P.paperInk, "xy");
      },
    },
    tip: { title: named(COPY.element, elementName(el)) },
  };
}

/** 방어도 꼬리표 (.blk): 벽돌 기호 + 수. pv = 조준 결과로 바뀐 값 (강조색 바탕) */
function blockChip(n: number, pv = false): Chip {
  const B = I.block;
  return pill({
    t: "row", h: B.h, pad: B.pad, align: "center",
    children: [{ t: "icon", id: "fx-block", w: B.icon, h: B.icon, tint: P.floor, fit: "y" }, num(n, T.block, P.floor)],
  }, { fill: pv ? P.accHi : P.stat.guard, radius: B.radius, line: B.line }, { title: `${COPY.block} ${n}`, sub: SUB.block });
}

/** 아군 받을 피해 (.inc.ia): 충격 기호 + 수, 배지 없음. 치명이면 기호가 뾰족해지고 맥박쳐요. pv = 조준 결과로 바뀐 값 */
function incomingChip(scene: Phaser.Scene, n: number, lethal: boolean, pv: boolean): Chip {
  const N = I.incoming;
  const tex = impactTexture(scene, lethal);
  const impact: Node = {
    t: "block", w: tex.s, h: tex.s,
    draw: (_g, x, y) => {
      const img = scene.add.image(Math.round(x) + tex.s / 2, Math.round(y) + tex.s / 2, tex.key);
      if (!lethal) return;
      const d = ms(LETHAL.duration), ease = cubicBezier(LETHAL.easing);
      scene.tweens.chain({
        targets: img, loop: -1,
        tweens: [
          { scale: LETHAL.scale, duration: d * LETHAL.peak, ease },
          { scale: 1, duration: d * (1 - LETHAL.peak), ease },
        ],
      });
    },
  };
  const color = pv ? P.accHi : lethal ? P.danger : P.ink;
  return {
    node: {
      t: "row", h: N.h, gap: N.gap, align: "center",
      children: [impact, num(n, T.incoming, color, { ml: N.numMl, outline: { color: P.floor, width: N.outline } })],
    },
    tip: { title: `${COPY.incoming} ${n}`, sub: COPY.incomingSub },
  };
}

/** 켜진 배지의 바깥 테가 옆 칩을 덮지 않게 늘 양옆에 두는 자리: 켜진 반지름 - 꺼진 반지름 - 칩 간격. 켜져도 옆 칩이 밀리지 않아요 */
const WEAK_PAD = Math.max(0, Math.ceil((I.weak.d / 2 - I.weak.line + I.weak.on.ringOut) * I.weak.on.scale - I.weak.d / 2 - I.chips.gap));

/** 약점 배지 (.weak): 조준 테 두른 속성 기호. on이면 켜져요 */
function weakChip(scene: Phaser.Scene, el: string, on: boolean): Chip {
  const W = I.weak;
  return {
    node: {
      t: "block", w: W.d + 2 * WEAK_PAD, h: W.d,
      draw: (_g, x, y) => {
        const cx = Math.round(x) + WEAK_PAD + W.d / 2, cy = Math.round(y) + W.d / 2;
        scene.add.image(cx, cy, weakTexture(scene, on).key);
        const s = on ? WEAK_ON_ICON : W.icon;
        iconFit(scene, cx - s / 2, cy - s / 2, el, s, on ? P.onWarn : mix(elementTint(el), P.ink, W.mix), "xy");
      },
    },
    tip: { title: named(COPY.weak, elementName(el)), sub: SUB.weakness },
  };
}

/** 상태 칩 (.st): 어두운 알약에 기호 + 수 */
function statusChip(s: StatusVM): Chip {
  const S = I.status, name = statusName(s.icon);
  return pill({
    t: "row", h: S.h, pad: S.pad, gap: S.gap, align: "center",
    children: [{ t: "icon", id: s.icon, w: S.icon, h: S.icon, tint: P.ink, fit: "y" }, num(s.n, T.chip, P.ink)],
  }, { fill: P.floor, radius: S.radius }, name ? { title: `${name} ${s.n}`, sub: termOfIcon(s.icon)?.what } : undefined);
}

/** 특성 칩 (0072 7번): 둥근 네모에 기호만. off = 이번 턴에 이미 쓰여 흐려요 (0096) */
function traitChip(t: TraitVM): Chip {
  const S = I.status, R = I.trait;
  return pill({
    t: "row", h: S.h, pad: R.pad, align: "center",
    children: [{ t: "icon", id: t.icon, w: S.icon, h: S.icon, tint: t.off ? P.veil["50"] : P.ink, fit: "y" }],
  }, { fill: P.floor, radius: R.radius }, t.tip);
}

interface InfoView {
  marks: Mark[];
  /** 묶음 아래 끝 y */
  bottom: number;
}

/** 정보 묶음 (.info.nv): 발 가운데 cx에 대칭. 칩은 한 줄에 가운데로, 폭을 넘으면 다음 줄 가운데로 넘겨요 (.chips flex-wrap) */
function drawInfo(scene: Phaser.Scene, cx: number, feet: number, bar: Bar, hp: { n: number; pv?: boolean }, chips: Chip[], pulse = false): InfoView {
  const x = Math.round(cx - I.w / 2), y = feet + I.mt;
  drawBar(scene, x, y + I.bar.top, bar, pulse);
  render(scene, {
    t: "row", w: I.w, h: I.row.h, justify: "center", align: "center",
    children: [num(hp.n, T.hp, hp.pv ? P.accHi : P.ink, { bold: true, outline: { color: P.floor, width: I.hp.outline } })],
  }, x, y);

  const C = I.chips, maxW = I.w + C.over * 2;
  // 칩 폭은 픽셀에 맞춰요 (다음 칩이 반 픽셀에 걸치지 않게)
  const sized = chips.map((c) => {
    const s = size(c.node);
    return { ...c, s: { w: Math.ceil(s.w), h: s.h } };
  });
  const rows: (typeof sized)[] = [[]];
  let used = 0;
  for (const c of sized) {
    const row = rows[rows.length - 1];
    if (row.length && used + C.gap + c.s.w > maxW) {
      rows.push([c]);
      used = c.s.w;
    } else {
      used += (row.length ? C.gap : 0) + c.s.w;
      row.push(c);
    }
  }
  const marks: Mark[] = [];
  let top = y + I.row.h + C.mt;
  const chipsTop = top;
  for (const row of rows) {
    const h = Math.max(rows.length === 1 ? C.minH : 0, ...row.map((c) => c.s.h));
    const w = row.reduce((a, c) => a + c.s.w, 0) + C.gap * Math.max(0, row.length - 1);
    let left = Math.round(cx - w / 2);
    for (const c of row) {
      const cy = Math.round(top + (h - c.s.h) / 2);
      if (c.bg) scene.add.image(left, cy, pillTexture(scene, c.s.w, c.s.h, c.bg)).setOrigin(0, 0);
      render(scene, c.node, left, cy);
      if (c.tip) marks.push({ x: left, y: cy, w: c.s.w, h: c.s.h, tip: c.tip });
      left += c.s.w + C.gap;
    }
    top += h + C.rowGap;
  }
  return { marks, bottom: Math.max(chipsTop + C.minH, top - C.rowGap) };
}

/** 받을 피해로 깎일 HP (방어도를 뺀 만큼, 남은 HP까지) */
const lossOf = (a: AllyVM, incoming: number) => Math.min(a.hp, Math.max(0, incoming - (a.block ?? 0)));
/** 지금 놓은 카드대로면 깎일 HP */
const lossNow = (a: AllyVM) => a.loss ?? lossOf(a, a.incoming ?? 0);

/** pv = 이 아군의 받을 피해 a→b (조준 결과). 바뀐 값만 강조색으로 보여요 */
function allyInfo(scene: Phaser.Scene, a: AllyVM, i: number, pv?: Change, pulse = false): InfoView {
  const incoming = pv ? pv.to : (a.incoming ?? 0);
  const loss = pv ? lossOf(a, incoming) : lossNow(a);
  const lethal = loss > 0 && loss >= a.hp;
  const showInc = a.incoming !== undefined && (a.incoming > 0 || !!pv);
  const chips: Chip[] = [
    ...(a.element ? [elementChip(scene, a.element)] : []),
    ...(a.block ? [blockChip(a.block)] : []),
    ...(showInc ? [incomingChip(scene, incoming, lethal, !!pv)] : []),
    ...a.statuses.map(statusChip),
  ];
  return drawInfo(scene, ALLY.xs[i], ALLY.feet, { max: a.maxHp, keep: a.hp - loss, loss, lethal }, { n: a.hp }, chips, pulse && loss > 0);
}

function enemyInfo(scene: Phaser.Scene, e: EnemyVM, i: number, pv: EnemyOutcomeVM | undefined, weakOn: boolean): InfoView {
  const hp = pv ? pv.hp.to : e.hp;
  const chips: Chip[] = [
    ...(e.traits ?? []).map(traitChip),
    elementChip(scene, e.element),
    ...(pv?.block ? [blockChip(pv.block.to, true)] : e.block ? [blockChip(e.block)] : []),
    // 약점 배지는 약점이 있으면 늘 (Lucy 2026-11-13). 없는 적은 배지 없음
    ...(e.weakTo ? [weakChip(scene, e.weakTo, weakOn)] : []),
    ...e.statuses.map(statusChip),
  ];
  return drawInfo(scene, ENEMY.xs[i], ENEMY.feet, { max: e.maxHp, keep: hp, gone: pv ? pv.hp.from - pv.hp.to : 0 }, { n: hp, pv: !!pv }, chips);
}

/** 무작위 대상 기호 (카드의 무작위 표식과 같음) */
const RANDOM_ICON = "i-dice";

/** 의도 알약. cut = 미리보기에서 끊김, on = 가리킨 유닛과 이어진 의도 (.intent.on) */
function intentNode(scene: Phaser.Scene, it: IntentVM, cut = false, on = false): Node {
  const charge = it.kind === "charge", debuff = it.kind === "debuff";
  const ring = cut
    ? { width: PV.intentCut.ring, color: P.accHi }
    : on ? { width: INTENT.onRing, color: P.ink }
    : debuff
      ? { width: INTENT.debuffRing, color: P.debuffLine }
      : { width: charge ? INTENT.chargeRing : INTENT.ring, color: charge ? P.warn : P.glassLine };
  const order: Node | undefined = it.order === undefined ? undefined : {
    t: "row", w: INTENT.order, h: INTENT.order, round: !debuff, radius: INTENT.orderDebuffRadius,
    justify: "center", align: "center", style: { fill: P.chip },
    children: [text(String(it.order), T.intentOrder, P.ink2)],
  };
  let target: Node | undefined;
  if (it.target === "none") {
    target = undefined;
  } else if (it.target === "random") {
    // 무작위 대상: 카드의 무작위 표식과 같은 기호 (작업 가정, Lucy 확인 전)
    target = { t: "icon", id: RANDOM_ICON, w: INTENT.face, h: INTENT.face, tint: P.ink2 };
  } else if (it.target === "all") {
    const dots = allDotsTexture(scene);
    const w = dots.w - dots.margin * 2, h = dots.h - dots.margin * 2;
    target = { t: "block", w, h, draw: (_g, x, y) => { scene.add.image(x - dots.margin, y - dots.margin, dots.key).setOrigin(0, 0); } };
  } else {
    target = { t: "image", key: faceKey(it.target), w: INTENT.face, h: INTENT.face, round: true, outline: { width: INTENT.faceRing, color: P.glassD } };
  }
  const iconTint = charge ? P.warn : debuff ? P.ink2 : P.ink;
  // 끊김: 수치만 흐린 글자 + 취소선 (.intent.cut .amt)
  const strike = cut ? { strike: { color: P.accHi, width: PV.intentCut.strike } } : {};
  // 연타 ×N은 작고 흐리게 (.intent .x)
  const [amount, ...mult] = it.amount.split("×");
  const amountNode = debuff
    ? text(amount, T.intentAmountDebuff, cut ? P.ink2 : P.ink, strike)
    : text(amount, T.intentAmount, cut ? P.ink2 : charge ? P.warn : P.ink, strike);
  return {
    t: "row", h: INTENT.h, pad: INTENT.pad, radius: debuff ? INTENT.debuffRadius : INTENT.radius, gap: INTENT.gap, align: "center",
    style: { fill: P.glassD, ring },
    children: [
      ...(order ? [order] : []), { t: "icon", id: it.icon, w: INTENT.icon, h: INTENT.icon, tint: iconTint }, amountNode,
      ...(mult.length ? [text(`×${mult.join("×")}`, T.intentMult, P.ink3)] : []),
      ...(target ? [target] : []),
    ],
  };
}

/** 머리 위 알약 하나의 모양: 타격은 위험색, 회복은 HP색, 방어도는 가드색 (회복 · 방어도는 재생 중에만 떠요, 0086) */
const POP = {
  damage: { icon: "fx-damage", fill: P.danger, ink: P.onDanger },
  heal: { icon: "fx-heal", fill: P.hp, ink: P.floor },
  block: { icon: "fx-block", fill: P.stat.guard, ink: P.floor },
} as const;
export const POP_ICONS = Object.values(POP).map((p) => p.icon);

export type PopKind = keyof typeof POP;

/** 대상 머리 위 알약 (.hits): 왼쪽 위에서 아래로, 한 알마다 오른쪽으로 비켜요. 알약마다 한 덩어리로 돌려줘요 */
export function drawPops(scene: Phaser.Scene, pops: { kind: PopKind; n: number }[], bodyX: number, bodyY: number): Phaser.GameObjects.Container[] {
  const H = PV.hits;
  let y = bodyY + H.top;
  return pops.map(({ kind, n }, d) => {
    const look = POP[kind];
    const pill: Node = {
      t: "row", h: H.h, pad: H.pad, radius: H.radius, gap: H.inGap, align: "center", style: { fill: look.fill },
      children: [{ t: "icon", id: look.icon, w: H.icon, h: H.icon, tint: look.ink }, text(String(n), T.hit, look.ink)],
    };
    const at = y;
    y += H.h + H.gap;
    return gather(scene, 0, 0, () => { render(scene, pill, bodyX + H.left + d * H.step, at); });
  });
}

const drawHits = (scene: Phaser.Scene, hits: number[], bodyX: number, bodyY: number) =>
  drawPops(scene, hits.map((n) => ({ kind: "damage", n })), bodyX, bodyY);

/** 알약이 뜨는 자리: 그 유닛 몸 상자의 왼쪽 위 */
export const popAt = (side: "ally" | "enemy", i: number) => (side === "ally"
  ? { x: ALLY.xs[i] - ALLY.body.w / 2, y: ALLY.feet - ALLY.body.h }
  : { x: ENEMY.xs[i] - ENEMY.body.w / 2, y: ENEMY.feet - ENEMY.art.h });

/** HP 막대의 깎인 구간 (from → to)만 위험색으로. 재생 중에 잠깐 남았다가 줄어들어요 (0086). 왼쪽 끝이 지금 HP 자리예요 */
export function drawTrail(scene: Phaser.Scene, side: "ally" | "enemy", i: number, max: number, from: number, to: number): Phaser.GameObjects.Image | undefined {
  const B = I.bar, inner = I.w - B.line * 2, ih = B.h - B.line * 2;
  const k = Math.round((inner * to) / max), end = Math.round((inner * from) / max);
  if (end <= k) return undefined;
  const key = canvasTexture(scene, `battle:trail:${k}:${end}`, end - k, ih, (ctx) => {
    // 막대 안쪽 캡슐로 잘라 끝이 둥글게 맞아요
    ctx.beginPath();
    ctx.roundRect(-k, 0, inner, ih, B.radius - B.line);
    ctx.clip();
    ctx.fillStyle = P.danger;
    ctx.fillRect(0, 0, end - k, ih);
  });
  const [cx, feet] = side === "ally" ? [ALLY.xs[i], ALLY.feet] : [ENEMY.xs[i], ENEMY.feet];
  return scene.add.image(Math.round(cx - I.w / 2) + B.line + k, feet + I.mt + B.top + B.line, key).setOrigin(0, 0);
}

// ── 풀이 ──────────────────────────────────────────────

/** 가운뎃점 (.sep 3px 원) */
const sep = (scene: Phaser.Scene): Node => ({
  t: "block", w: TIP.sep, h: TIP.sep,
  draw: (_g, x, y) => {
    const key = canvasTexture(scene, "battle:tip-sep", TIP.sep, TIP.sep, (ctx) => disc(ctx, TIP.sep / 2, TIP.sep / 2, TIP.sep / 2, P.pMute));
    scene.add.image(Math.round(x), Math.round(y), key).setOrigin(0, 0);
  },
});

/** 글 한 줄 (줄바꿈 없음): 보통 글과 강조 숫자를 기준선에 맞춰요 */
function richLine(scene: Phaser.Scene, r: RichText): Node {
  const spans: Span[] = r.map((p) => ({ text: p.text, size: p.strong ? T.tipStrong : T.tipBody, color: p.strong ? P.ink : P.ink2 }));
  const b = lineBox(T.tipBody, spans);
  return {
    t: "block", w: spans.reduce((a, s) => a + measure(s.text, s.size), 0), h: b.above + b.below,
    draw: (_g, x, y) => {
      // 줄 전체를 같은 양만큼 옮겨 픽셀에 붙여요 (조각마다 따로 반올림하면 기준선이 어긋나요)
      const line = inlineLine(scene, Math.round(x), y, T.tipBody, spans);
      const dy = Math.round(line.objects[0]?.y ?? 0) - (line.objects[0]?.y ?? 0);
      for (const o of line.objects) o.setPosition(Math.round(o.x), o.y + dy);
    },
  };
}

/** 어두운 풀이 상자를 묶음 아래(top)에, cx 가운데로 (화면 밖으로 나가면 안으로 당겨요). 꼬리는 cx를 가리켜요 */
function drawTip(scene: Phaser.Scene, node: Node, cx: number, top: number, tail: number) {
  const s = size(node);
  const x = Math.min(FRAME.w - TIP.edge - s.w, Math.max(TIP.edge, Math.round(cx - s.w / 2)));
  render(scene, node, x, top);
  const t = tailTexture(scene, tail);
  scene.add.image(Math.round(cx - t.w / 2), top - t.h + TIP.ring, t.key).setOrigin(0, 0);
}

const tipText = (t: string, sz: string, color: string): Node => text(t, sz, color, { snap: true });

const tipStyle = { fill: P.floor, ring: { width: TIP.ring, color: P.glassLine } };

/** 기호 한 줄 풀이 (.mt): 유닛 가운데 cx, 묶음 아래 끝 bottom 기준 */
export function drawMarkTip(scene: Phaser.Scene, tip: MarkTip, cx: number, bottom: number) {
  const M = TIP.mark;
  drawTip(scene, {
    t: "row", h: M.h, pad: [0, M.padX, 0, M.padX], radius: M.radius, gap: M.gap, align: "center", style: tipStyle,
    children: [tipText(tip.title, T.tipStrong, P.ink), ...(tip.sub ? [sep(scene), tipText(tip.sub, T.tipBody, P.ink2)] : [])],
  }, cx, bottom + TIP.mt, M.tail);
}

/** 유닛 풀이 (.tip) 한두 줄. 적: 이름 + 등급 (· 덧붙임) / 행동 문장. 아군: 이름 · 앞열 · 상태 / 장비 칸. 보여 줄 것이 없으면 그리지 않아요 */
export function drawUnitTip(scene: Phaser.Scene, u: { side: "ally"; vm: AllyVM } | { side: "enemy"; vm: EnemyVM }, cx: number, bottom: number) {
  const U = TIP.unit;
  const line = (children: Node[]): Node => ({ t: "row", minH: U.line.h, gap: U.line.gap, align: "center", children });
  const join = (parts: Node[]) => parts.flatMap((p, k) => (k ? [sep(scene), p] : [p]));
  const stat = (id: string, label: string): Node => ({
    t: "row", gap: U.stat.gap, align: "center",
    children: [{ t: "icon", id, w: U.stat.icon, h: U.stat.icon, tint: P.ink2, fit: "y" }, tipText(label, T.tipBody, P.ink2)],
  });
  const lines: Node[] = [];
  if (u.side === "enemy") {
    const tip = u.vm.tip;
    if (!tip) return;
    const [action, ...notes] = tip.lines;
    const name: Node = {
      t: "row", gap: U.line.gap, align: "center",
      children: [
        tipText(tip.name, T.tipStrong, P.ink),
        ...(tip.rank ? [{
          t: "row", pad: U.tag.pad, radius: U.tag.radius, align: "center",
          style: { ring: { width: U.tag.ring, color: P.veil["20"] } },
          children: [tipText(tip.rank, T.tipTag, P.ink2)],
        } as Node] : []),
      ],
    };
    lines.push(line(join([name, ...notes.map((n) => richLine(scene, n))])));
    if (action) lines.push(line([richLine(scene, action)]));
  } else {
    const a = u.vm;
    const parts: Node[] = [
      ...(a.name ? [tipText(a.name, T.tipStrong, P.ink)] : []),
      ...(a.front ? [stat("g-flag", COPY.front)] : []),
      ...a.statuses.map((s) => stat(s.icon, named(statusName(s.icon) ?? "", String(s.n)).trim())),
    ];
    if (parts.length) lines.push(line(join(parts)));
    if (a.equip?.length) lines.push({ t: "row", gap: U.equipGap, align: "center", children: a.equip.map((e) => miniSlotNode(scene, e, EQUIP_MINI.s24)) });
  }
  if (!lines.length) return;
  drawTip(scene, { t: "col", pad: U.pad, radius: U.radius, gap: U.gap, align: "start", style: tipStyle, children: lines }, cx, bottom + TIP.mt, U.tail);
}

// ── 그리기 ──────────────────────────────────────────────

const GROUND_KEY = "battle:ground";

/** 발밑 그림자: 발 y에 가운데 */
function ground(scene: Phaser.Scene, cx: number, feet: number) {
  if (!scene.textures.exists(GROUND_KEY)) {
    const tex = scene.textures.createCanvas(GROUND_KEY, GROUND.w, GROUND.h)!;
    const ctx = tex.getContext();
    // closest-side 타원 그라데이션: 원을 세로로 눌러서 그려요
    const rx = GROUND.w / 2, ry = GROUND.h / 2;
    ctx.translate(rx, ry);
    ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, P.groundShade);
    grad.addColorStop(1, transparentOf(P.groundShade));
    ctx.fillStyle = grad;
    ctx.fillRect(-rx, -rx, GROUND.w, GROUND.w);
    tex.refresh();
  }
  scene.add.image(cx - GROUND.w / 2, feet - GROUND.h / 2, GROUND_KEY).setOrigin(0, 0);
}

/** 대상 강조: 정본 .ring.aim의 바깥 빛(box-shadow 0 0 14 aimGlow)을 그림 상자 뒤에 깔아요.
 *  그림이 실루엣·모델로 바뀌면 그림 모양을 따라 빛나게 바꿔요 (지금은 자리 채움 상자). */
function glow(scene: Phaser.Scene, x: number, y: number, w: number, h: number, radius: number, hollow = false) {
  const s = shadowTexture(scene, w, h, radius, { y: 0, blur: PV.lit.glow, color: P.aimGlow }, hollow);
  scene.add.image(x - s.margin, y - s.margin, s.key).setOrigin(0, 0);
}

/** 그림 상자부터 정보 묶음까지 (끌어 대기·클릭·가리킴 판정 영역) */
export interface UnitBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UnitPreview<R> {
  /** 결과 미리보기 */
  outcome?: R;
  /** 대상이면 그림 뒤에 빛 */
  lit?: boolean;
}

export interface UnitView {
  bounds: UnitBounds;
  /** 정보 묶음 (가리킴 효과가 덮어 그리는 동안 숨겨요) */
  info: Phaser.GameObjects.Container;
  /** 가리킬 수 있는 기호들 */
  marks: Mark[];
  /** 묶음 아래 끝 y (풀이가 뜨는 기준) */
  bottom: number;
  /** 적 머리 위 의도 알약 */
  intent?: Phaser.GameObjects.Container;
  /** 의도 알약의 자리 (첫 판 안내가 짚을 곳, 0088) */
  intentBox?: UnitBounds;
  /** 유닛 그림 (재생 중 나섬 · 밀림은 그림만 움직여요, 0086) */
  art: Phaser.GameObjects.Container;
}

/** 판정 영역 반 폭: 칩 줄이 넘칠 수 있는 폭까지 */
const HALF = I.w / 2 + I.chips.over;

/** pv.outcome: 이 아군의 받을 피해 a→b */
export function drawAlly(scene: Phaser.Scene, a: AllyVM, i: number, pv: UnitPreview<Change> = {}): UnitView {
  const cx = ALLY.xs[i];
  const bodyX = cx - ALLY.body.w / 2, bodyTop = ALLY.feet - ALLY.body.h;
  if (pv.lit) glow(scene, bodyX, bodyTop, ALLY.body.w, ALLY.body.h, 0, true);
  const art = gather(scene, 0, 0, () => {
    if (!(a.stage && drawAllyArt(scene, a.face, a.stage, cx, ALLY.feet, ALLY.body, ALLY.art))) placeholderArt(scene, bodyX, bodyTop, ALLY.body.w, ALLY.body.h, P.ink3);
  });
  // 쓰러진 아군은 그림이 흐려요 (0086)
  if (a.hp <= 0) art.setAlpha(tokens.provisional.motion.hit.down.alpha);
  ground(scene, cx, ALLY.feet);
  const marks: Mark[] = [];
  if (a.front) {
    // 앞열 깃발: 유닛 앞 땅에 꽂아요
    const F = I.flag, tex = flagTexture(scene);
    const fx = cx + F.x, fy = ALLY.feet + F.y;
    scene.add.image(fx - tex.margin, fy - tex.margin, tex.key).setOrigin(0, 0);
    marks.push({ x: fx, y: fy, w: F.icon, h: F.icon, tip: { title: COPY.front, sub: SUB.front } });
  }
  let v!: InfoView;
  const info = gather(scene, 0, 0, () => { v = allyInfo(scene, a, i, pv.outcome); });
  return { bounds: { x: cx - HALF, y: bodyTop, w: HALF * 2, h: v.bottom - bodyTop }, info, marks: [...marks, ...v.marks], bottom: v.bottom, art };
}

/** 가리킨 적이 노리는 아군의 묶음: 깎일 구간이 깜빡여요 (쉬는 묶음 자리에 덮어 그려요) */
export function drawAllyPulse(scene: Phaser.Scene, a: AllyVM, i: number) {
  allyInfo(scene, a, i, undefined, true);
}

/** 이 아군이 받을 피해로 HP가 깎이는지 */
export const losesHp = (a: AllyVM) => lossNow(a) > 0;

/** 이 적의 의도가 이 아군을 노리는지 */
/** 무작위는 누구든 맞을 수 있어서 모두를 노리는 것으로 봐요 */
export const aimsAt = (e: EnemyVM, a: AllyVM) => !!e.intent && (e.intent.target === "all" || e.intent.target === "random" || e.intent.target === a.face);

/** 적 머리 위 의도 알약. on = 가리킨 유닛과 이어진 의도 */
export function drawIntent(scene: Phaser.Scene, e: EnemyVM, i: number, st: { cut?: boolean; on?: boolean } = {}) {
  if (!e.intent) return { w: 0, h: 0 };
  const node = intentNode(scene, e.intent, st.cut, st.on);
  const s = size(node);
  render(scene, node, ENEMY.xs[i] - s.w / 2, ENEMY.top);
  return s;
}

/** weakOn: 든 카드의 속성이 이 적의 약점이면 약점 배지를 켜요 */
export function drawEnemy(scene: Phaser.Scene, e: EnemyVM, i: number, pv: UnitPreview<EnemyOutcomeVM> & { weakOn?: boolean } = {}): UnitView {
  const cx = ENEMY.xs[i];
  let intentH = 0, intentW = 0;
  const intent = gather(scene, 0, 0, () => { ({ w: intentW, h: intentH } = drawIntent(scene, e, i, { cut: !!pv.outcome?.cut })); });
  const bodyTop = ENEMY.top + intentH + ENEMY.body.mt;
  const artX = cx - ENEMY.art.w / 2, artY = ENEMY.feet - ENEMY.art.h;
  if (pv.lit) glow(scene, artX, artY, ENEMY.art.w, ENEMY.art.h, 0, true);
  // 땅속: 몸 윗부분만 남아요 (0096). 그림은 발 선에서 잘라요
  const show = e.buried ? ENEMY.buried : 1;
  const artH = ENEMY.art.h * show;
  const art = gather(scene, 0, 0, () => {
    if (!drawEnemyArt(scene, e.art, cx, ENEMY.feet, show)) placeholderArt(scene, artX, ENEMY.feet - artH, ENEMY.art.w, artH, P.ink3);
  });
  ground(scene, cx, ENEMY.feet);
  if (pv.outcome) drawHits(scene, pv.outcome.hits, cx - ENEMY.body.w / 2, bodyTop);
  let v!: InfoView;
  const info = gather(scene, 0, 0, () => { v = enemyInfo(scene, e, i, pv.outcome, !!pv.weakOn); });
  return { bounds: { x: cx - HALF, y: ENEMY.top, w: HALF * 2, h: v.bottom - ENEMY.top }, info, marks: v.marks, bottom: v.bottom, intent, art, intentBox: { x: cx - intentW / 2, y: ENEMY.top, w: intentW, h: intentH } };
}
