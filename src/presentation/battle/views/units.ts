// 아군·적: 필드 그림, 발밑 그림자, 정보판(HP·방어도·받을 피해·상태), 적 머리 위 의도. 정본 .ally, .enemy, .info, .intent
// 조준 미리보기(.fld-pv)도 여기서 그려요: 조준한 대상의 결과, 대상 후보 고리, 아군 받을 피해 a→b.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { transparentOf } from "../../style/color";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { linear } from "../../style/gradient";
import { loadIcon } from "../../style/icons";
import { placeholderArt } from "../../style/placeholder";
import { faceKey, preloadFaces } from "../../faces";
import { COPY } from "../copy";
import { ALLY, ENEMY, GROUND, HOVER_RING, INFO as I, INTENT, PREVIEW as PV } from "../layout";
import type { AimTargetVM, AllyVM, BattleVM, Change, EnemyVM, IntentVM, StatusVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

export function preloadUnits(scene: Phaser.Scene, vm: BattleVM) {
  preloadFaces(scene);
  for (const a of vm.allies) {
    a.statuses.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  }
  loadIcon(scene, "i-sync", I.status.icon);
  loadIcon(scene, "i-shield", I.block.icon);
  for (const e of vm.enemies) {
    loadIcon(scene, e.element, I.status.icon);
    loadIcon(scene, e.weakTo, I.status.icon);
    loadIcon(scene, e.intent.icon, INTENT.icon);
    e.statuses.forEach((s) => loadIcon(scene, s.icon, I.status.icon));
  }
  if (vm.aim) {
    loadIcon(scene, "i-crack", I.block.icon);
    loadIcon(scene, "i-hit", PV.hits.icon);
  }
}

/** 호버 고리: WebGL 선은 안티앨리어싱이 없어 1.5px 타원이 두꺼워 보여서 canvas로 구워요. */
function hoverRingTexture(scene: Phaser.Scene): string {
  const key = "enemy:hover-ring";
  if (scene.textures.exists(key)) return key;
  const { w, h, width } = HOVER_RING;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  ctx.strokeStyle = P.hoverRing;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, (w - width) / 2, (h - width) / 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  tex.refresh();
  return key;
}

/** 조준 고리(.ring.aim: 2px 테 + 바깥 빛)와 후보 고리(.ring.cand: 1.5px 점선). 빛만큼 여백을 둔 텍스처예요. */
function previewRingTexture(scene: Phaser.Scene, kind: "aim" | "cand"): { key: string; margin: number } {
  const { w, h } = PV.ring;
  const margin = kind === "aim" ? PV.ring.glow : 0;
  const key = `enemy:ring-${kind}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w + margin * 2, h + margin * 2)!;
    const ctx = tex.getContext();
    const cx = margin + w / 2, cy = margin + h / 2;
    const ellipse = (inset: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2 - inset, h / 2 - inset, 0, 0, Math.PI * 2);
    };
    if (kind === "aim") {
      // box-shadow는 상자 바깥에만: 타원을 캔버스 밖으로 밀어 그림자만 떨구고, 안쪽은 지워요
      const shift = (w + margin * 2) * 2;
      ctx.save();
      ctx.shadowColor = P.aimGlow;
      ctx.shadowBlur = PV.ring.glow;
      ctx.shadowOffsetX = shift;
      ctx.translate(-shift, 0);
      ellipse(0);
      ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = "destination-out";
      ellipse(0);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = P.accHi;
      ctx.lineWidth = PV.ring.aim;
      ellipse(PV.ring.aim / 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = P.candRing;
      ctx.lineWidth = PV.ring.cand;
      ctx.setLineDash(PV.ring.dash);
      ellipse(PV.ring.cand / 2);
      ctx.stroke();
    }
    tex.refresh();
  }
  return { key, margin };
}

/** CSS repeating-linear-gradient 무늬를 w×h 텍스처로 */
function stripeTexture(scene: Phaser.Scene, name: string, w: number, h: number, deg: number, stops: [string, number][]): string {
  const key = `stripe:${name}@${w}x${h}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, Math.max(1, Math.ceil(w)), h)!;
    linear(tex.getContext(), Math.max(1, Math.ceil(w)), h, deg, stops.map(([c, px]) => [c, { px }]), true);
    tex.refresh();
  }
  return key;
}

// ── 조각 ──────────────────────────────────────────────

const text = (t: string, size: string, color: string, extra: Partial<Node> = {}): Node =>
  ({ t: "text", text: t, size, color, ...extra }) as Node;

const arrow = (): Node => text(COPY.to, T.pvArrow, P.accHi, { ml: PV.arrowMargin, mr: PV.arrowMargin });

/** a → b (앞 숫자는 취소선) */
const change = (c: Change, fromSize: string, toSize: string, toColor = P.ink): Node[] => [
  text(String(c.from), fromSize, P.ink3, { strike: {} }),
  arrow(),
  text(String(c.to), toSize, toColor),
];

/** HP 막대. lose = 미리보기에서 잃을 만큼(지금 HP 오른쪽 빗금, .bar .ghost) */
function hpBar(scene: Phaser.Scene, hp: number, max: number, lose = 0): Node {
  return {
    t: "block", w: 0, h: I.bar.h, grow: true,
    draw: (g, x, y, w, h) => {
      box(g, x, y, w, h, I.bar.radius, { fill: P.barTrack });
      if (hp > 0) box(g, x, y, (w * hp) / max, h, I.bar.radius, { fill: P.hp });
      if (lose > 0) {
        const gw = (w * lose) / max;
        const s = PV.ghost.stripe;
        const key = stripeTexture(scene, "ghost", gw, h, PV.ghost.deg, [[P.danger, 0], [P.danger, s], [P.ghostStripe, s], [P.ghostStripe, s * 2]]);
        scene.add.image(x + (w * hp) / max, y, key).setOrigin(0, 0).setDisplaySize(gw, h);
      }
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

/** 미리보기 방어도 (.shd.pv): 금 간 방패 + a→b */
function blockChipPreview(c: Change): Node {
  return {
    t: "row", h: I.block.h, pad: PV.block.pad, radius: I.block.radius, gap: I.block.gap, align: "center",
    style: { fill: P.pvBlockFill, ring: { width: PV.block.ring, color: P.accHi } },
    children: [{ t: "icon", id: "i-crack", w: I.block.icon, h: I.block.icon, tint: P.accHi }, ...change(c, T.pvFrom, T.block)],
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

function incomingChip(n: number, pv?: Change): Node {
  return {
    t: "row", h: I.incoming.h, pad: I.incoming.pad, radius: I.incoming.radius, gap: I.incoming.gap, align: "baseline",
    style: pv ? { fill: P.pvFill, ring: { width: PV.incomingRing, color: P.accHi } } : { fill: P.chipSofter },
    children: [
      text(COPY.incoming, T.incomingLabel, P.ink2),
      ...(pv ? change(pv, T.pvIncomingFrom, T.incoming) : [text(String(n), T.incoming, P.ink)]),
    ],
  };
}

function allyInfo(scene: Phaser.Scene, a: AllyVM, pv?: Change): Node {
  const rowA: Node = {
    t: "row", h: I.rowA.h, gap: I.rowA.gap, align: "center",
    children: [...(a.block ? [blockChip(a.block)] : []), hpBar(scene, a.hp, a.maxHp)],
  };
  const rowB: Node = {
    t: "row", minH: I.rowB.minH, gap: I.rowB.gap, align: "baseline", justify: "between",
    children: [hpNumber(a.hp, a.maxHp), ...(a.incoming === undefined ? [] : [incomingChip(a.incoming, pv)])],
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

function shieldSlot(scene: Phaser.Scene, state: "broken" | "breaking" | "left"): Node {
  const S = I.slots;
  return {
    t: "block", w: S.size, h: S.size,
    draw: (g, x, y, w, h) => {
      if (state === "broken") box(g, x, y, w, h, S.radius, { fill: P.warn });
      else if (state === "left") box(g, x, y, w, h, S.radius, { ring: { width: S.ring, color: P.warn } });
      else {
        // 이번에 깰 칸: 빗금 + 테 (.sl.pvon). 둥근 모서리 2px는 무늬 위에 테로 덮어요
        const s = PV.slotHatch.stripe;
        const key = stripeTexture(scene, "slot", w, h, PV.slotHatch.deg, [[P.accHi, 0], [P.accHi, s], [transparentOf(P.accHi), s], [transparentOf(P.accHi), s * 2]]);
        scene.add.image(x, y, key).setOrigin(0, 0);
        box(scene.add.graphics(), x, y, w, h, S.radius, { ring: { width: PV.slotHatch.ring, color: P.accHi } });
      }
    },
  };
}

function enemyInfo(scene: Phaser.Scene, e: EnemyVM, pv?: AimTargetVM): Node {
  const hp = pv ? pv.hp.to : e.hp;
  const block = pv?.block ? [blockChipPreview(pv.block)] : e.block ? [blockChip(e.block)] : [];
  const rowA: Node = {
    t: "row", h: I.rowA.h, gap: I.rowA.gap, align: "center",
    children: [...block, hpBar(scene, hp, e.maxHp, pv ? pv.hp.from - pv.hp.to : 0)],
  };
  const rowB: Node = {
    t: "row", minH: I.rowB.minH, gap: I.rowB.gap, align: "baseline",
    children: [pv ? { t: "row", align: "baseline", gap: I.hpGap, children: change(pv.hp, T.pvFrom, T.pvHp) } : hpNumber(e.hp, e.maxHp)],
  };
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
    const breaking = Math.min(pv?.shieldBreak ?? 0, total - broken);
    const left = total - broken - breaking;
    const label: Node = pv?.cut
      ? {
        t: "row", pad: PV.cutTag.pad, radius: PV.cutTag.radius, align: "center", style: { fill: P.accHi },
        children: [text(COPY.cut, T.cutTag, P.onAccHi)],
      }
      : {
        t: "row", align: "baseline",
        children: [
          text(COPY.shieldLeft, T.shieldLabel, P.ink2),
          text(String(left), T.shieldNum, P.ink),
          text(COPY.shieldUnit, T.shieldLabel, P.ink2),
        ],
      };
    rows.push({
      t: "row", gap: I.row3.gap, align: "center",
      children: [
        {
          t: "row", gap: I.slots.gap, align: "center",
          children: Array.from({ length: total }, (_, i) =>
            shieldSlot(scene, i < broken ? "broken" : i < broken + breaking ? "breaking" : "left")),
        },
        label,
      ],
    });
  }
  return infoPlate(I.enemyW, rows);
}

function intentNode(it: IntentVM, cut = false): Node {
  const charge = it.kind === "charge", debuff = it.kind === "debuff";
  const ring = cut
    ? { width: PV.intentCut.ring, color: P.accHi }
    : debuff
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
  // 끊김: 수치만 흐린 글자 + 취소선 (.intent.cut .amt)
  const strike = cut ? { strike: { color: P.accHi, width: PV.intentCut.strike } } : {};
  const amount = debuff
    ? [text(it.label, T.intentLabel, P.ink2), text(it.amount, T.intentAmountDebuff, cut ? P.ink2 : P.ink, strike)]
    : [text(it.amount, T.intentAmount, cut ? P.ink2 : charge ? P.warn : P.ink, strike)];
  return {
    t: "row", h: INTENT.h, pad: INTENT.pad, radius: debuff ? INTENT.debuffRadius : INTENT.radius, gap: INTENT.gap, align: "center",
    style: { fill: P.glassD, ring },
    children: [order, { t: "icon", id: it.icon, w: INTENT.icon, h: INTENT.icon, tint: iconTint }, ...amount, text(COPY.to, T.intentTo, P.ink3), target],
  };
}

/** 대상 머리 위 타격 알약 (.hits): 왼쪽 위에서 아래로, 한 알마다 오른쪽으로 비켜요 */
function drawHits(scene: Phaser.Scene, hits: number[], bodyX: number, bodyY: number) {
  const H = PV.hits;
  let y = bodyY + H.top;
  hits.forEach((n, d) => {
    const pill: Node = {
      t: "row", h: H.h, pad: H.pad, radius: H.radius, gap: H.inGap, align: "center", style: { fill: P.danger },
      children: [{ t: "icon", id: "i-hit", w: H.icon, h: H.icon, tint: P.onDanger }, text(String(n), T.hit, P.onDanger)],
    };
    render(scene, pill, bodyX + H.left + d * H.step, y);
    y += H.h + H.gap;
  });
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

/** pv: 미리보기에서 이 아군의 받을 피해 a→b */
export function drawAlly(scene: Phaser.Scene, a: AllyVM, i: number, pv?: Change) {
  const cx = ALLY.xs[i];
  const bodyX = cx - ALLY.body.w / 2;
  const bodyBottom = ALLY.top + ALLY.body.h;
  placeholderArt(scene, bodyX, ALLY.top, ALLY.body.w, ALLY.body.h, P.ink3);
  ground(scene, cx, bodyBottom);
  render(scene, allyInfo(scene, a, pv), cx - I.allyW / 2, bodyBottom + I.mt);
}

export interface EnemyPreview {
  /** 조준한 대상이면 그 결과 */
  target?: AimTargetVM;
  /** 조준하지 않은 대상 후보 */
  candidate?: boolean;
}

/** 호버 고리와 몸 상자(발밑 가운데)를 돌려줘요. 고리는 카드에 마우스가 가면 숨겨요. */
export function drawEnemy(scene: Phaser.Scene, e: EnemyVM, i: number, pv: EnemyPreview = {}) {
  const cx = ENEMY.xs[i];
  const intentN = intentNode(e.intent, !!pv.target?.cut);
  const intent = size(intentN);
  render(scene, intentN, cx - intent.w / 2, ENEMY.top);
  const bodyTop = ENEMY.top + intent.h + ENEMY.body.mt;
  const bodyBottom = bodyTop + ENEMY.body.h;
  placeholderArt(scene, cx - ENEMY.art.w / 2, bodyBottom - ENEMY.art.h, ENEMY.art.w, ENEMY.art.h, P.ink3);
  ground(scene, cx, bodyBottom);
  let ring: Phaser.GameObjects.Image | undefined;
  if (e.hovered && !pv.target && !pv.candidate) {
    ring = scene.add.image(cx, bodyBottom - HOVER_RING.bottom - HOVER_RING.h / 2, hoverRingTexture(scene));
  }
  if (pv.target || pv.candidate) {
    const r = previewRingTexture(scene, pv.target ? "aim" : "cand");
    scene.add.image(cx, bodyBottom - PV.ring.bottom - PV.ring.h / 2, r.key);
  }
  if (pv.target) drawHits(scene, pv.target.hits, cx - ENEMY.body.w / 2, bodyTop);
  render(scene, enemyInfo(scene, e, pv.target), cx - I.enemyW / 2, bodyBottom + I.mt);
  return { ring, foot: { x: cx, y: bodyBottom } };
}
