// 아군·적: 필드 그림, 발밑 그림자, 정보판(HP·방어도·받을 피해·상태), 적 머리 위 의도. 정본 .ally, .enemy, .info, .intent
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { rgba, transparentOf } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { icon, loadIcon } from "../../style/icons";
import { COPY } from "../copy";
import { ALLY, ENEMY, GROUND, HOVER_RING, INFO as I, INTENT } from "../layout";
import type { AllyVM, BattleVM, EnemyVM, FaceId, IntentVM, StatusVM } from "../viewmodel";

const P = tokens.palette;
const T = tokens.text.battle;
const SIL_TINT: Record<string, string> = { "sil-star": P.sil.star, "sil-fire": P.sil.fire, "sil-jelly": P.sil.jelly };

export const faceKey = (f: FaceId) => `face:${f}`;

export function preloadUnits(scene: Phaser.Scene, vm: BattleVM) {
  for (const f of ["star", "fire", "jelly"] as FaceId[]) {
    if (!scene.textures.exists(faceKey(f))) scene.load.image(faceKey(f), `assets/ui/faces/${f}-face.webp`);
  }
  for (const a of vm.allies) {
    loadIcon(scene, a.art, ALLY.body.w, ALLY.body.h);
    a.statuses.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  }
  loadIcon(scene, "i-sync", I.status.icon);
  loadIcon(scene, "i-shield", I.block.icon);
  for (const e of vm.enemies) {
    loadIcon(scene, e.art, ENEMY.art.w, ENEMY.art.h);
    loadIcon(scene, e.element, I.status.icon);
    loadIcon(scene, e.weakTo, I.status.icon);
    loadIcon(scene, e.intent.icon, INTENT.icon);
    e.statuses.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  }
}

// ── 조각 ──────────────────────────────────────────────

const text = (t: string, size: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size, color, ...extra }) as Node;

function hpBar(hp: number, max: number): Node {
  return {
    t: "block", w: 0, h: I.bar.h, grow: true,
    draw: (g, x, y, w, h) => {
      box(g, x, y, w, h, I.bar.radius, { fill: P.barTrack });
      if (hp > 0) box(g, x, y, (w * hp) / max, h, I.bar.radius, { fill: P.hp });
    },
  };
}

function blockChip(n: number): Node {
  return {
    t: "row", h: I.block.h, pad: I.block.pad, radius: I.block.radius, gap: I.block.gap, align: "center",
    style: { fill: P.chip },
    children: [
      { t: "icon", id: "i-shield", w: I.block.icon, h: I.block.icon, tint: P.ink2 },
      text(String(n), T.block, P.ink),
    ],
  };
}

function statusChip(s: StatusVM): Node {
  return {
    t: "row", h: I.status.h, pad: I.status.pad, radius: I.status.radius, gap: I.status.gap, align: "center",
    style: { fill: P.chipSoft },
    children: [
      { t: "icon", id: s.icon, w: I.status.icon, h: I.status.icon, tint: P.ink2 },
      text(String(s.n), T.chip, P.ink2),
    ],
  };
}

function hpNumber(hp: number, max: number): Node {
  return {
    t: "row", align: "baseline", gap: I.hpGap,
    children: [text(String(hp), T.hp, P.ink), text(`${COPY.maxPrefix}${max}`, T.hpMax, P.ink3)],
  };
}

function infoPlate(width: number, rows: Node[]): Node {
  return {
    t: "col", w: width, gap: I.gap, pad: I.pad, radius: I.radius, mt: I.mt, align: "stretch",
    style: { fill: P.plate, ring: { width: 1, color: P.plateLine } },
    children: rows,
  };
}

function allyInfo(a: AllyVM): Node {
  const rowA: Node = {
    t: "row", h: I.rowA.h, gap: I.rowA.gap, align: "center",
    children: [...(a.block ? [blockChip(a.block)] : []), hpBar(a.hp, a.maxHp)],
  };
  const rowB: Node = {
    t: "row", minH: I.rowB.minH, gap: I.rowB.gap, align: "baseline", justify: "between",
    children: [
      hpNumber(a.hp, a.maxHp),
      ...(a.incoming === undefined ? [] : [{
        t: "row", h: I.incoming.h, pad: I.incoming.pad, radius: I.incoming.radius, gap: I.incoming.gap, align: "baseline",
        style: { fill: P.chipSofter },
        children: [text(COPY.incoming, T.incomingLabel, P.ink2), text(String(a.incoming), T.incoming, P.ink)],
      } as Node]),
    ],
  };
  const row2: Node = {
    t: "row", minH: I.row2.minH, gap: I.row2.gap, align: "center",
    children: [
      ...a.statuses.map(statusChip),
      {
        t: "row", gap: I.syncGap, align: "center",
        children: [
          { t: "icon", id: "i-sync", w: I.status.icon, h: I.status.icon, tint: P.ink3 },
          text(String(a.sync), T.chip, P.ink3),
        ],
      },
      ...(a.front ? [{
        t: "row", pad: I.front.pad, radius: I.front.radius, align: "center", ml: "auto",
        style: { ring: { width: 1, color: P.glassLine } },
        children: [text(COPY.front, T.tag, P.ink2)],
      } as Node] : []),
    ],
  };
  return infoPlate(I.allyW, [rowA, rowB, row2]);
}

function enemyInfo(e: EnemyVM): Node {
  const rowA: Node = {
    t: "row", h: I.rowA.h, gap: I.rowA.gap, align: "center",
    children: [...(e.block ? [blockChip(e.block)] : []), hpBar(e.hp, e.maxHp)],
  };
  const rowB: Node = { t: "row", minH: I.rowB.minH, gap: I.rowB.gap, align: "baseline", children: [hpNumber(e.hp, e.maxHp)] };
  const row2: Node = {
    t: "row", minH: I.row2.minH, gap: I.row2.gap, align: "center",
    children: [
      {
        t: "row", w: I.element, h: I.element, round: true, justify: "center", align: "center",
        style: { fill: P.chipSoft },
        children: [{ t: "icon", id: e.element, w: I.status.icon, h: I.status.icon, tint: P.ink2 }],
      },
      {
        t: "row", h: I.weak.h, pad: I.weak.pad, radius: I.weak.radius, gap: I.weak.gap, align: "center",
        style: { ring: { width: 1, color: P.glassLine } },
        children: [text(COPY.weak, T.tag, P.ink2), { t: "icon", id: e.weakTo, w: I.status.icon, h: I.status.icon, tint: P.ink2 }],
      },
      ...e.statuses.map(statusChip),
    ],
  };
  const rows = [rowA, rowB, row2];
  if (e.shield) {
    const { broken, total } = e.shield;
    rows.push({
      t: "row", gap: I.row3.gap, align: "center",
      children: [
        {
          t: "row", gap: I.slots.gap, align: "center",
          children: Array.from({ length: total }, (_, i): Node => ({
            t: "block", w: I.slots.size, h: I.slots.size,
            draw: (g, x, y, w, h) => box(g, x, y, w, h, I.slots.radius,
              i < broken ? { fill: P.warn } : { ring: { width: I.slots.ring, color: P.warn } }),
          })),
        },
        {
          t: "row", align: "baseline",
          children: [
            text(COPY.shieldLeft, T.shieldLabel, P.ink2),
            text(String(total - broken), T.shieldNum, P.ink),
            text(COPY.shieldUnit, T.shieldLabel, P.ink2),
          ],
        },
      ],
    });
  }
  return infoPlate(I.enemyW, rows);
}

function intentNode(it: IntentVM): Node {
  const charge = it.kind === "charge", debuff = it.kind === "debuff";
  const ring = debuff
    ? { width: INTENT.debuffRing, color: P.debuffLine }
    : { width: charge ? INTENT.chargeRing : INTENT.ring, color: charge ? P.warn : P.glassLine };
  const order: Node = {
    t: "row", w: INTENT.order, h: INTENT.order, round: !debuff, radius: INTENT.orderDebuffRadius,
    justify: "center", align: "center", style: { fill: P.chip },
    children: [text(String(it.order), T.intentOrder, P.ink2)],
  };
  const target: Node = it.target === "all"
    ? text(COPY.all, T.intentAll, P.ink2)
    : { t: "image", key: faceKey(it.target), w: INTENT.face, h: INTENT.face, round: true, outline: { width: INTENT.faceRing, color: P.glassLine } };
  const iconTint = charge ? P.warn : debuff ? P.ink2 : P.ink;
  const amount = debuff
    ? [text(it.label, T.intentLabel, P.ink2), text(it.amount, T.intentAmountDebuff, P.ink)]
    : [text(it.amount, T.intentAmount, charge ? P.warn : P.ink)];
  return {
    t: "row", h: INTENT.h, pad: INTENT.pad, radius: debuff ? INTENT.debuffRadius : INTENT.radius, gap: INTENT.gap, align: "center",
    style: { fill: P.glassD, ring },
    children: [order, { t: "icon", id: it.icon, w: INTENT.icon, h: INTENT.icon, tint: iconTint }, ...amount, text(COPY.to, T.intentTo, P.ink3), target],
  };
}

// ── 그리기 ──────────────────────────────────────────────

const GROUND_KEY = "battle:ground";

function ground(scene: Phaser.Scene, cx: number, bodyBottom: number) {
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
  scene.add.image(cx - GROUND.w / 2, bodyBottom - GROUND.h - GROUND.bottom, GROUND_KEY).setOrigin(0, 0);
}

export function drawAlly(scene: Phaser.Scene, a: AllyVM, i: number) {
  const cx = ALLY.xs[i];
  const bodyX = cx - ALLY.body.w / 2;
  const bodyBottom = ALLY.top + ALLY.body.h;
  icon(scene, bodyX, ALLY.top, a.art, ALLY.body.w, ALLY.body.h, SIL_TINT[a.art]);
  ground(scene, cx, bodyBottom);
  render(scene, allyInfo(a), cx - I.allyW / 2, bodyBottom + I.mt);
}

export function drawEnemy(scene: Phaser.Scene, e: EnemyVM, i: number) {
  const cx = ENEMY.xs[i];
  const intentN = intentNode(e.intent);
  const intent = size(intentN);
  render(scene, intentN, cx - intent.w / 2, ENEMY.top);
  const bodyTop = ENEMY.top + intent.h + ENEMY.body.mt;
  const bodyBottom = bodyTop + ENEMY.body.h;
  icon(scene, cx - ENEMY.art.w / 2, bodyBottom - ENEMY.art.h, e.art, ENEMY.art.w, ENEMY.art.h);
  ground(scene, cx, bodyBottom);
  if (e.hovered) {
    const g = scene.add.graphics();
    const c = rgba(P.hoverRing);
    g.lineStyle(HOVER_RING.width, c.color, c.alpha).strokeEllipse(
      cx, bodyBottom - HOVER_RING.bottom - HOVER_RING.h / 2, HOVER_RING.w - HOVER_RING.width, HOVER_RING.h - HOVER_RING.width,
    );
  }
  render(scene, enemyInfo(e), cx - I.enemyW / 2, bodyBottom + I.mt);
}
