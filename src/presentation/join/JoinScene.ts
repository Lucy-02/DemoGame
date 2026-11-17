// 깃들기 (0076 · 0078 J1): 판이 끝나면 꼭 골라요. 무대에 후보 둘이 대칭으로 서고, 후보마다 이름 · 속성 · 역할 기호 · 성격 칩 · 대표 카드.
// 후보를 누르면 고른 상태(자두빛 테, 다른 후보 흐림)가 되고 아래 버튼이 `<이름> 고르기`로 켜져요. 확인 창은 없어요 (0076 11).
// 버튼을 누르면 깃듦 박자: 다른 후보가 사라지고 고른 정령이 가운데로 옮겨 서서 한 번 뛰고, 이름 · 기호 · 성격 칩과 함께 떠날 얼굴 줄이 떠요.
// 박자 중에 누르거나 동작 줄이기를 켜면 바로 끝 상태예요. 연달아 둘째 깃들기면 위에 진행 점이 떠요 (0078 고칠 점 3).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { cardWithFace } from "../run/cards";
import { drawBackdrop } from "../run/backdrop";
import { FRAME, GRID } from "../run/layout";
import { faceTexture, preloadSpiritArt } from "../spiritArt";
import { P, plateStyle, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { cubicBezier, ms } from "../style/ease";
import { render, size, type BoxNode } from "../style/flex";
import { gather } from "../style/gather";
import { canvasTexture, ellipse } from "../style/gradient";
import { loadIcon } from "../style/icons";
import { clampLeft, drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { COPY } from "./copy";
import { DEFAULT_JOIN, JOINS } from "./fixtures";
import { BEAT, CAND, CHIP, CTA, PIPS, TIP } from "./layout";
import type { FaceVM, JoinCandVM, JoinVM } from "./viewmodel";
import { SIL_ICON, drawSpiritArt } from "./views/art";
import { chip } from "./views/chip";

export const JOIN_SCENE = "join";

const T = tokens.provisional.text.join;
const M = tokens.provisional.motion.join;

export interface JoinSceneData {
  /** 고정 장면 이름 (fixtures JOINS). vm을 주면 무시해요 */
  scene?: string;
  vm?: JoinVM;
  /** 시각 검증용: 이 후보를 고른 상태 */
  select?: string;
  /** 시각 검증용: "chip" = 고른 후보의 성격 칩에 올린 상태 */
  hover?: string;
  /** 시각 검증용: 이 후보로 깃든 끝 상태 */
  taken?: string;
  /** 고르기를 누르면 (규칙에 적용) */
  onPick?: (id: string) => void;
  /** 박자 뒤 계속을 누르면. 이 장면을 넘겨받아 다음 장면으로 넘어가요 */
  onDone?: (scene: Phaser.Scene) => void;
}

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export class JoinScene extends Phaser.Scene {
  private vm!: JoinVM;
  private selected?: number;
  private chipHot?: number;
  private picked?: number;
  private onPick?: (id: string) => void;
  private onDone?: (scene: Phaser.Scene) => void;
  private dirty = false;

  constructor() {
    super(JOIN_SCENE);
  }

  init(data: JoinSceneData) {
    this.vm = data.vm ?? JOINS[data.scene ?? DEFAULT_JOIN] ?? JOINS[DEFAULT_JOIN];
    const at = (id?: string) => {
      const i = this.vm.cands.findIndex((c) => c.id === id);
      return i < 0 ? undefined : i;
    };
    this.selected = at(data.select);
    this.chipHot = data.hover === "chip" ? this.selected : undefined;
    this.picked = at(data.taken);
    this.onPick = data.onPick;
    this.onDone = data.onDone;
    this.dirty = false;
  }

  preload() {
    const sizes: [string, number, number?][] = [
      [SIL_ICON, CAND.sil.w, CAND.sil.h], ["g-cardnew", CHIP.icon],
      ...this.vm.cands.flatMap((c): [string, number][] => [[c.element, CAND.info.icon], [c.role, CAND.info.icon], [c.element, BEAT.hero.icon], [c.role, BEAT.hero.icon]]),
    ];
    for (const [id, w, h] of sizes) loadIcon(this, id, w, h);
    for (const c of this.vm.cands) preloadHandCard(this, c.card, { scale: CARD_SCALE });
    const faces = [...this.vm.party, this.vm.prev].flatMap((f) => (f ? [f.id] : []));
    preloadSpiritArt(this, [...this.vm.cands.map((c) => c.id), ...faces]);
  }

  create() {
    this.input.setPollAlways();
    const keys = this.input.keyboard;
    keys?.on("keydown-LEFT", () => this.select(0));
    keys?.on("keydown-RIGHT", () => this.select(this.vm.cands.length - 1));
    keys?.on("keydown-ENTER", () => (this.picked === undefined ? this.confirm() : this.onDone?.(this)));
    keys?.on("keydown-SPACE", () => (this.picked === undefined ? this.confirm() : this.onDone?.(this)));
    if (this.picked !== undefined) this.beat(true);
    else this.paint();
    Object.assign(window, { __screenReady: JOIN_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private select(i: number) {
    if (this.picked !== undefined || this.selected === i) return;
    this.selected = i;
    this.dirty = true;
  }

  private setChip(i?: number) {
    if (this.picked !== undefined || this.chipHot === i) return;
    this.chipHot = i;
    this.dirty = true;
  }

  private confirm() {
    if (this.picked !== undefined || this.selected === undefined) return;
    this.picked = this.selected;
    this.onPick?.(this.vm.cands[this.picked].id);
    this.beat(reduced());
  }

  private clear() {
    this.tweens.killAll();
    for (const o of [...this.children.list]) o.destroy();
  }

  private paint() {
    this.clear();
    drawBackdrop(this);
    if (this.vm.prev !== undefined) drawPips(this, this.vm.prev);
    let tip: (() => void) | undefined;
    this.vm.cands.forEach((c, i) => {
      const x = CAND.xs[i];
      const on = this.selected === i;
      const view = gather(this, 0, 0, () => {
        drawSpot(this, x, on);
        drawSpiritArt(this, c.art, x + CAND.w / 2, CAND.y + CAND.art.bottom, CAND.sil);
      });
      this.add.zone(x, CAND.y, CAND.w, CAND.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerup", () => this.select(i));
      const info = drawInfo(this, c, x, this.chipHot === i, (r) => {
        this.add.zone(r.x, r.y, r.w, r.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
          .on("pointerover", () => this.setChip(i))
          .on("pointerout", () => { if (this.chipHot === i) this.setChip(undefined); })
          .on("pointerup", () => this.select(i));
        if (this.chipHot === i) tip = () => drawPersonalityTip(this, c, r);
      });
      // 두 후보 모두 같은 틀. 고르면 테만 밝아져요
      box(this.add.graphics(), x, CAND.y, CAND.w, CAND.h, CAND.radius, { ring: { width: CAND.ring, color: on ? P.accHi : P.glassLine } });
      if (this.selected !== undefined && !on) {
        view.setAlpha(CAND.dim);
        info.setAlpha(CAND.dim);
      }
    });
    const pick = this.selected === undefined ? undefined : this.vm.cands[this.selected];
    drawCta(this, pick ? COPY.pickName(pick.name) : COPY.pick, !!pick, () => this.confirm());
    tip?.();
  }

  /** 깃듦 박자. still이면 끝 상태만 그려요 */
  private beat(still: boolean) {
    this.clear();
    const i = this.picked!;
    const c = this.vm.cands[i];
    drawBackdrop(this);
    if (this.vm.prev !== undefined) drawPips(this, this.vm.prev);
    const ease = cubicBezier(M.easing);
    const tween = (targets: unknown, props: Record<string, unknown>, beat: { delay: string; duration: string }, e: unknown = ease) =>
      this.tweens.add({ targets, ...props, delay: ms(beat.delay), duration: ms(beat.duration), ease: e });

    // 사라지는 것: 다른 후보 전부, 고른 후보의 조명 · 테 · 정보
    const x = CAND.xs[i];
    const gone = gather(this, 0, 0, () => {
      this.vm.cands.forEach((o, j) => {
        if (j === i) return;
        const ox = CAND.xs[j];
        const other = gather(this, 0, 0, () => {
          drawSpot(this, ox, false);
          box(this.add.graphics(), ox, CAND.y, CAND.w, CAND.h, CAND.radius, { ring: { width: CAND.ring, color: P.glassLine } });
          drawSpiritArt(this, o.art, ox + CAND.w / 2, CAND.y + CAND.art.bottom, CAND.sil);
          drawInfo(this, o, ox, false);
        });
        other.setAlpha(CAND.dim);
      });
      drawSpot(this, x, true);
      drawInfo(this, c, x, false);
      box(this.add.graphics(), x, CAND.y, CAND.w, CAND.h, CAND.radius, { ring: { width: CAND.ring, color: P.accHi } });
    });
    const halo = drawHalo(this);
    // 고른 정령: 후보 자리 → 가운데
    const art = drawSpiritArt(this, c.art, BEAT.x, BEAT.bottom, CAND.sil);
    const end = { x: art.x, y: art.y };
    const start = { x: art.x + (x + CAND.w / 2 - BEAT.x), y: art.y + (CAND.y + CAND.art.bottom - BEAT.bottom) };
    const hero = drawHero(this, c);
    const party = drawParty(this, this.vm, c.face ?? null);
    const cta = drawCta(this, COPY.next, true, () => this.onDone?.(this));

    if (still) {
      gone.destroy();
      return;
    }
    gone.setAlpha(1);
    tween(gone, { alpha: 0 }, M.fade);
    art.setPosition(start.x, start.y);
    tween(art, { x: end.x, y: end.y }, M.move);
    halo.setAlpha(0).setScale(BEAT.halo.from);
    tween(halo, { alpha: 1, scale: 1 }, M.halo, "Quad.easeOut");
    this.tweens.add({ targets: art, y: end.y - BEAT.hop, delay: ms(M.hop.delay), duration: ms(M.hop.duration) / 2, yoyo: true, ease: "Sine.easeInOut" });
    hero.setAlpha(0).setY(BEAT.hero.rise);
    tween(hero, { alpha: 1, y: 0 }, M.info);
    party.row.setAlpha(0);
    tween(party.row, { alpha: 1 }, M.party);
    party.face.setAlpha(0).setY(-BEAT.party.drop);
    tween(party.face, { alpha: 1, y: 0 }, M.face, "Back.easeOut");
    cta.setAlpha(0);
    tween(cta, { alpha: 1 }, M.cta);
    // 박자 중에 누르면 끝 상태로
    const skip = this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive()
      .on("pointerup", () => this.beat(true));
    this.time.delayedCall(ms(M.cta.delay) + ms(M.cta.duration), () => skip.destroy());
  }
}

const CARD_SCALE = CAND.card.w / HAND_CARD.w;

interface Rect { x: number; y: number; w: number; h: number }

/** 후보 뒤 조명 (.spot). 고르면 밝아져요 */
function drawSpot(scene: Phaser.Scene, x: number, on: boolean) {
  const S = CAND.spot;
  const a = on ? S.alphaOn : S.alpha;
  const key = canvasTexture(scene, `join:spot:${a}`, S.w, S.h, (ctx) =>
    ellipse(ctx, S.w, S.h, { rx: S.rx, ry: S.ry, cx: 0.5, cy: S.cy }, [[withAlpha(P.ink, a), 0], [withAlpha(P.ink, 0), 1]]));
  scene.add.image(x + (CAND.w - S.w) / 2, CAND.y + S.dy, key).setOrigin(0, 0);
}

/** 이름 · 기호 · 성격 칩 + 대표 카드 (.info). chipAt = 칩 자리를 받아 입력을 붙여요 */
function drawInfo(scene: Phaser.Scene, c: JoinCandVM, x: number, chipHot: boolean, chipAt?: (r: Rect) => void): Phaser.GameObjects.Container {
  const I = CAND.info;
  const cardH = HAND_CARD.h * CARD_SCALE;
  const per = chip(c.personality.name, { hot: chipHot });
  const ps = size(per);
  const node: BoxNode = {
    t: "row", gap: I.gap, align: "start",
    children: [
      {
        t: "col", gap: I.whoGap, pad: [I.whoTop, 0, 0, 0], w: I.whoW,
        children: [
          text(c.name, T.name, P.ink, { lh: 1 }),
          { t: "row", gap: I.iconGap, align: "center", children: [
            { t: "icon", id: c.element, w: I.icon, h: I.icon, tint: P.ink2 },
            { t: "icon", id: c.role, w: I.icon, h: I.icon, tint: P.ink2 },
          ] },
          { t: "block", w: ps.w, h: ps.h, draw: (_g, cx, cy) => {
            render(scene, per, cx, cy);
            chipAt?.({ x: cx, y: cy, w: ps.w, h: ps.h });
          } },
        ],
      },
      { t: "block", w: CAND.card.w, h: cardH, draw: (_g, cx, cy) => {
        // 키운 카드는 아래 가운데를 축으로 커져요: 원래 크기 자리를 넘겨요
        createHandCard(scene, cardWithFace(scene, c.card, { face: c.face }, CARD_SCALE), cx + (CAND.card.w - HAND_CARD.w) / 2, cy + cardH - HAND_CARD.h, { scale: CARD_SCALE });
      } },
    ],
  };
  const w = size(node).w;
  return gather(scene, 0, 0, () => render(scene, node, x + (CAND.w - w) / 2, CAND.y + I.top));
}

function drawPersonalityTip(scene: Phaser.Scene, c: JoinCandVM, r: Rect) {
  const p = c.personality;
  drawTooltip(scene, {
    skin: GLASS,
    content: [
      { kind: "title", text: p.name },
      { kind: "text", role: "body", text: [{ text: p.desc }] },
      ...(p.note ? [{ kind: "text" as const, role: "body" as const, text: [{ text: p.note }] }] : []),
    ],
    // 칩 오른쪽 끝에 맞춰 왼쪽 아래로 (오른쪽 대표 카드를 덮지 않게)
    at: { left: clampLeft(r.x + r.w - GLASS.w, GLASS.w, FRAME.w, GRID.gutter), top: r.y + r.h + TIP.gap },
  });
}

/** 아래 가운데 버튼 (.cta): 켜지면 밝은 유리 판 + 포커스 테, 꺼지면 흐림 */
function drawCta(scene: Phaser.Scene, label: string, on: boolean, click: () => void): Phaser.GameObjects.Container {
  const node: BoxNode = {
    t: "row", h: CTA.h, radius: CTA.radius, pad: [0, CTA.padX, 0, CTA.padX], justify: "center", align: "center",
    // 정본 버튼 판 (0054 밝은 유리 판). 꺼지면 테만 + 흐린 글자
    style: plateStyle(on),
    children: [text(label, T.cta, on ? P.ink : P.ink3Spirit)],
  };
  const s = size(node);
  const w = Math.max(CTA.minW, s.w);
  const x = (FRAME.w - w) / 2, y = FRAME.h - CTA.bottom - CTA.h;
  return gather(scene, 0, 0, () => {
    render(scene, { ...node, w }, x, y);
    if (!on) return;
    const o = CTA.focus.offset;
    box(scene.add.graphics(), x - o, y - o, w + o * 2, CTA.h + o * 2, CTA.radius + o, { ring: { width: CTA.focus.width, color: P.ink2 } });
    scene.add.zone(x, y, w, CTA.h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", click);
  });
}

/** 연달아 둘째 깃들기: 앞서 고른 정령 얼굴 — 선 — 지금 칸 */
function drawPips(scene: Phaser.Scene, prev: FaceVM | null) {
  const K = PIPS;
  const w = K.d * 2 + K.line + K.gap * 2;
  const x = (FRAME.w - w) / 2, cy = K.top + K.d / 2;
  const g = scene.add.graphics();
  circle(g, x + K.d / 2, cy, K.d, { fill: P.face });
  if (prev && scene.textures.exists(prev.key)) scene.add.image(x, K.top, faceTexture(scene, prev, K.d)).setOrigin(0, 0).setAlpha(K.faceAlpha);
  box(g, x + K.d + K.gap, cy, K.line, 1, 0, { fill: P.glassLine });
  const nx = x + K.d + K.gap * 2 + K.line + K.d / 2;
  circle(g, nx, cy, K.d + K.glow * 2, { fill: withAlpha(P.accHi, K.glowAlpha) });
  circle(g, nx, cy, K.d, { fill: P.floor, ring: { width: K.ring, color: P.accHi } });
}

/** 깃듦 박자 뒤 빛 (.halo) */
function drawHalo(scene: Phaser.Scene): Phaser.GameObjects.Image {
  const H = BEAT.halo;
  const key = canvasTexture(scene, "join:halo", H.d, H.d, (ctx) =>
    ellipse(ctx, H.d, H.d, { rx: 0.5, ry: 0.5, cx: 0.5, cy: 0.5 }, [[withAlpha(P.accHi, H.a0), 0], [withAlpha(P.accHi, H.a1), H.at1], [withAlpha(P.accHi, 0), H.at2]]));
  return scene.add.image(BEAT.x, H.y, key);
}

/** 깃든 정령의 이름 · 기호 · 성격 칩 (.who3) */
function drawHero(scene: Phaser.Scene, c: JoinCandVM): Phaser.GameObjects.Container {
  const H = BEAT.hero;
  const node: BoxNode = {
    t: "col", gap: H.gap, align: "center",
    children: [
      text(c.name, T.hero, P.ink, { lh: 1 }),
      { t: "row", gap: CAND.info.iconGap, align: "center", children: [
        { t: "icon", id: c.element, w: H.icon, h: H.icon, tint: P.ink2 },
        { t: "icon", id: c.role, w: H.icon, h: H.icon, tint: P.ink2 },
      ] },
      chip(c.personality.name),
    ],
  };
  const w = size(node).w;
  return gather(scene, 0, 0, () => render(scene, node, (FRAME.w - w) / 2, H.top));
}

/** 떠날 얼굴 줄 (.party): 가진 정령 + 새 얼굴(자두빛 테) + 빈 자리 */
function drawParty(scene: Phaser.Scene, vm: JoinVM, fresh: FaceVM | null): { row: Phaser.GameObjects.Container; face: Phaser.GameObjects.Container } {
  const K = BEAT.party;
  const n = Math.max(vm.seats, vm.party.length + 1);
  const x0 = (FRAME.w - (n * K.d + (n - 1) * K.gap)) / 2;
  const faceAt = (f: FaceVM | null, x: number) => {
    circle(scene.add.graphics(), x + K.d / 2, K.top + K.d / 2, K.d, { fill: P.face });
    if (f && scene.textures.exists(f.key)) scene.add.image(x, K.top, faceTexture(scene, f, K.d)).setOrigin(0, 0);
  };
  const at = (i: number) => x0 + i * (K.d + K.gap);
  const row = gather(scene, 0, 0, () => {
    vm.party.forEach((f, i) => faceAt(f, at(i)));
    for (let i = vm.party.length + 1; i < n; i++) {
      circle(scene.add.graphics(), at(i) + K.d / 2, K.top + K.d / 2, K.d, { ring: { width: 1, color: withAlpha(P.ink, K.empty), dash: K.dash } });
    }
  });
  const face = gather(scene, 0, 0, () => {
    const x = at(vm.party.length);
    faceAt(fresh, x);
    circle(scene.add.graphics(), x + K.d / 2, K.top + K.d / 2, K.d + K.ring * 2, { ring: { width: K.ring, color: P.accHi } });
  });
  return { row, face };
}

