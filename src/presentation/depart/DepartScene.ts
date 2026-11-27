// 출전 준비 (0076 14 · 0078 J1): 정령이 둘 이상이면 판마다 떠나기 전에 떠요. 메인 화면 위 가운데 유리 틀 하나.
// 가진 정령이 같은 크기 자리 칸으로 나란하고, 앞열은 자두빛 테 + 깃발 기호 하나예요. 칸을 누르면 앞열이 바뀌어요 (기본은 지난 판의 앞열).
// 위에는 오늘 센 기운 칩(기호만, 이름은 호버). 칸마다 이름 · Lv, 속성 · 역할 기호, 성격 칩, 능력치, 작은 장비 칸.
// 열린 성격이 있는 칩은 누르면 칩 아래로 펼쳐지고, 하나를 고르면 그 성격으로 떠나요 (0157 · 0171 · 라운드 H1). 떠나기 전까지는 되돌릴 수 있어요.
// `취소`(Esc)는 메인 화면으로, `떠나기`(첫 포커스, Enter)는 고른 앞열로 판을 시작해요.
import { crossPaint, fadeInScene } from "../style/motion";
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { CARET_ICON, chip, personalityTip } from "../join/views/chip";
import type { PersonalityVM } from "../join/viewmodel";
import { SIL_ICON as SIL, drawSpiritArt } from "../join/views/art";
import { CHIP } from "../join/layout";
import { COPY as RUN_COPY, STAT_ICON } from "../run/copy";
import { miniSlotNode, preloadEquipArt, type Rect } from "../run/equip";
import { EQUIP_MINI, FRAME, INFO } from "../run/layout";
import { STAT_IDS } from "../run/viewmodel";
import { preloadSpiritArt } from "../spiritArt";
import { P, plateStyle, text } from "../spirits/views/parts";
import { withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { render, size, type BoxNode, type Node } from "../style/flex";
import { canvasTexture, ellipse } from "../style/gradient";
import { loadIcon } from "../style/icons";
import { shadowTexture } from "../style/shadow";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { COPY } from "./copy";
import { DEFAULT_DEPART, DEPARTS } from "./fixtures";
import { BTN, SEAT, STRONG, WIN } from "./layout";
import type { DepartVM, SeatVM } from "./viewmodel";
import { strokePlaceholder } from "../style/placeholder";

export const DEPART_SCENE = "depart";

const T = tokens.provisional.text.depart;
const TR = tokens.provisional.text.result;

export interface DepartSceneData {
  /** 고정 장면 이름 (fixtures DEPARTS). vm을 주면 무시해요 */
  scene?: string;
  vm?: DepartVM;
  /** 시각 검증용: 이 정령을 앞열로 바꾼 상태 */
  select?: string;
  /** 시각 검증용: 이 정령 칸, 또는 "strong"(센 기운 칩) · "chip:<정령 id>"(성격 칩)에 올린 상태.
   *  "open:<정령 id>" = 열린 성격을 펼친 상태, "opt:<정령 id>:<성격 id>" = 펼치고 그 성격에 올린 상태 */
  hover?: string;
  /** 떠나기: 고른 앞열, 바꿔 고른 성격 (정령 id → 성격 id, 바꾼 정령만) */
  onDepart?: (front: string, personalities: Record<string, string>) => void;
  /** 취소 */
  onCancel?: () => void;
}

type Hover = { kind: "seat"; id: string } | { kind: "strong" } | { kind: "chip"; id: string } | { kind: "option"; id: string; p: string };
const hoverKey = (h?: Hover) => (h ? [h.kind, "id" in h ? h.id : "", "p" in h ? h.p : ""].join(":") : "");

/** 자리 칸의 성격 칩이 그릴 것. at = 그린 칩의 자리를 받아 입력을 붙여요 */
interface SeatPick {
  now: PersonalityVM;
  rest: PersonalityVM[];
  open: boolean;
  chipHot: boolean;
  optionHot?: string;
  at: (r: Rect, what: "chip" | PersonalityVM) => void;
}

export class DepartScene extends Phaser.Scene {
  private vm!: DepartVM;
  private front!: string;
  private hover?: Hover;
  /** 바꿔 고른 성격 (정령 id → 성격 id). 떠날 때 정원에 적용돼요 */
  private chosen: Record<string, string> = {};
  /** 열린 성격을 펼친 자리 */
  private open?: string;
  private onDepart?: (front: string, personalities: Record<string, string>) => void;
  private onCancel?: () => void;
  private dirty = false;

  constructor() {
    super(DEPART_SCENE);
  }

  init(data: DepartSceneData) {
    this.vm = data.vm ?? DEPARTS[data.scene ?? DEFAULT_DEPART] ?? DEPARTS[DEFAULT_DEPART];
    const has = (id?: string) => this.vm.seats.some((s) => s.id === id);
    this.front = has(data.select) ? data.select! : this.vm.front;
    const [what, who, pid] = (data.hover ?? "").split(":");
    this.open = (what === "open" || what === "opt") && has(who) ? who : undefined;
    this.hover = data.hover === "strong" ? { kind: "strong" }
      : what === "chip" && has(who) ? { kind: "chip", id: who }
      : what === "opt" && has(who) && pid ? { kind: "option", id: who, p: pid }
      : has(data.hover) ? { kind: "seat", id: data.hover! } : undefined;
    this.chosen = {};
    this.onDepart = data.onDepart;
    this.onCancel = data.onCancel;
    this.dirty = false;
  }

  preload() {
    const icons: [string, number, number?][] = [
      ["g-flag", SEAT.flag.icon], ["g-close", BTN.icon], [CARET_ICON, CHIP.caret.size], [this.vm.strong.icon, STRONG.icon],
      [SIL, SEAT.art.sil.w, SEAT.art.sil.h],
      ...STAT_IDS.map((k): [string, number] => [STAT_ICON[k], INFO.stats.icon]),
      ...this.vm.seats.flatMap((s): [string, number][] => [[s.element, SEAT.meta.icon], [s.role, SEAT.meta.icon]]),
    ];
    for (const [id, w, h] of icons) loadIcon(this, id, w, h);
    preloadSpiritArt(this, this.vm.seats.map((s) => s.id));
    preloadEquipArt(this, this.vm.seats.flatMap((s) => s.slots.flatMap((e) => (e ? [e.id] : []))));
  }

  create() {
    this.input.setPollAlways();
    const keys = this.input.keyboard;
    // Esc는 펼친 성격을 먼저 접고, 접혀 있으면 취소예요
    keys?.on("keydown-ESC", () => (this.open ? this.toggle(this.open) : this.onCancel?.()));
    keys?.on("keydown-ENTER", () => this.depart());
    this.paint();
    fadeInScene(this);
    Object.assign(window, { __screenReady: DEPART_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    // 호버 · 누름으로 다시 그릴 때 앞 모습이 흐려지며 바뀌어요 (0092)
    crossPaint(this, () => this.paint());
  }

  private setHover(h?: Hover) {
    if (hoverKey(h) === hoverKey(this.hover)) return;
    this.hover = h;
    this.dirty = true;
  }

  private leave(h: Hover) {
    if (hoverKey(h) === hoverKey(this.hover)) this.setHover(undefined);
  }

  private depart() {
    this.onDepart?.(this.front, this.chosen);
  }

  /** 이 자리의 이번 판 성격과, 바꿔 고를 수 있는 나머지 */
  private personalityOf(s: SeatVM) {
    const all = [s.personality, ...s.opened];
    const now = all.find((p) => p.id === this.chosen[s.id]) ?? s.personality;
    return { now, rest: all.filter((p) => p !== now) };
  }

  /** 열린 성격을 펼치거나 접어요 */
  private toggle(id?: string) {
    this.open = this.open === id ? undefined : id;
    this.dirty = true;
  }

  private choose(s: SeatVM, p: PersonalityVM) {
    const { [s.id]: _, ...rest } = this.chosen;
    this.chosen = p === s.personality ? rest : { ...rest, [s.id]: p.id };
    this.open = undefined;
    this.hover = undefined;
    this.dirty = true;
  }

  private setFront(id: string) {
    if (this.front === id && !this.open) return;
    this.front = id;
    this.open = undefined;
    this.dirty = true;
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const { vm } = this;
    const n = vm.seats.length;
    const seatsW = n * SEAT.w + (n - 1) * SEAT.gap;
    const [pt, pr, pb, pl] = WIN.pad;
    const w = pl + seatsW + pr;
    const h = pt + WIN.top + WIN.topGap + SEAT.h + WIN.bottomGap + BTN.h + pb;
    const x = Math.round((FRAME.w - w) / 2), y = Math.round((FRAME.h - h) / 2);

    // 메인 화면을 덮는 막 + 틀
    box(this.add.graphics(), 0, 0, FRAME.w, FRAME.h, 0, { fill: P.scrim });
    // 막 아무 데나 눌러도 아래 메인 화면이 받지 않아요. 펼친 성격은 접혀요
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => this.open && this.toggle(this.open));
    const sh = shadowTexture(this, w, h, WIN.radius, { y: WIN.shadow.y, blur: WIN.shadow.blur, color: P.tipShadow });
    this.add.image(x - sh.margin, y - sh.margin, sh.key).setOrigin(0, 0);
    box(this.add.graphics(), x, y, w, h, WIN.radius, { fill: P.glassD, ring: { width: WIN.ring, color: P.glassLine } });

    // 오늘 센 기운
    const strongAt = { x: x + pl, y: y + pt };
    const strong = strongNode(vm, this.hover?.kind === "strong");
    const ss = render(this, strong, strongAt.x, strongAt.y);
    this.add.zone(strongAt.x, strongAt.y, ss.w, ss.h).setOrigin(0, 0).setInteractive()
      .on("pointerover", () => this.setHover({ kind: "strong" }))
      .on("pointerout", () => this.leave({ kind: "strong" }));

    // 자리 칸
    const seatY = y + pt + WIN.top + WIN.topGap;
    let tip: (() => void) | undefined;
    vm.seats.forEach((s, i) => {
      const sx = x + pl + i * (SEAT.w + SEAT.gap);
      const h = this.hover;
      const mine = h && "id" in h && h.id === s.id ? h : undefined;
      const { now, rest } = this.personalityOf(s);
      const open = this.open === s.id;
      const spots: { r: Rect; what: "chip" | PersonalityVM }[] = [];
      // 깃발이 비치는 것은 칸에 올렸을 때만이에요 (칩은 앞열을 바꾸지 않아요)
      drawSeat(this, s, sx, seatY, this.front === s.id, mine?.kind === "seat", {
        now, rest, open, chipHot: mine?.kind === "chip", optionHot: mine?.kind === "option" ? mine.p : undefined,
        at: (r, what) => spots.push({ r, what }),
      });
      this.add.zone(sx, seatY, SEAT.w, SEAT.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.setHover({ kind: "seat", id: s.id }))
        .on("pointerout", () => this.leave({ kind: "seat", id: s.id }))
        .on("pointerup", () => this.setFront(s.id));
      // 칩 입력은 칸 입력 위에 놓여요
      for (const { r, what } of spots) {
        const hover: Hover = what === "chip" ? { kind: "chip", id: s.id } : { kind: "option", id: s.id, p: what.id };
        const can = what !== "chip" || rest.length > 0;
        this.add.zone(r.x, r.y, r.w, r.h).setOrigin(0, 0).setInteractive({ useHandCursor: can })
          .on("pointerover", () => this.setHover(hover))
          .on("pointerout", () => this.leave(hover))
          .on("pointerup", () => (what === "chip" ? can && this.toggle(s.id) : this.choose(s, what)));
      }
      // 풀이: 접힌 칩에 올리면 이번 판 성격, 펼친 줄에서는 올린 성격 (펼친 줄 아래)
      const shown = mine?.kind === "option" ? rest.find((p) => p.id === mine.p) : mine?.kind === "chip" && !open ? now : undefined;
      if (shown && spots.length) {
        const bottom = Math.max(...spots.map((x) => x.r.y + x.r.h));
        tip = () => drawTooltip(this, { skin: GLASS, content: personalityTip(shown), at: { left: spots[0].r.x, top: bottom + SEAT.pick.tipGap } });
      }
    });

    // 취소 · 떠나기 (오른쪽 맞춤)
    const by = seatY + SEAT.h + WIN.bottomGap;
    const go = button(COPY.go, true);
    const cancel = button(COPY.cancel, false);
    const gw = Math.max(BTN.goW, size(go).w), cw = size(cancel).w;
    const gx = x + w - pr - gw, cx = gx - WIN.btnGap - cw;
    render(this, cancel, cx, by);
    render(this, { ...go, w: gw }, gx, by);
    const o = BTN.focus.offset;
    box(this.add.graphics(), gx - o, by - o, gw + o * 2, BTN.h + o * 2, BTN.radius + o, { ring: { width: BTN.focus.width, color: P.ink2 } });
    this.add.zone(cx, by, cw, BTN.h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", () => this.onCancel?.());
    this.add.zone(gx, by, gw, BTN.h).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", () => this.depart());

    tip?.();
    if (this.hover?.kind === "strong") {
      drawTooltip(this, {
        skin: GLASS,
        content: [{ kind: "title", text: COPY.strong, tag: vm.strong.name }, { kind: "text", role: "body", text: [{ text: COPY.strongDesc(vm.strong.name) }] }],
        at: { left: strongAt.x, top: strongAt.y + ss.h + STRONG.tipGap },
      });
    }
  }
}


/** 오늘 센 기운 칩: TODO_ICON 자리(X 상자, 0137) + 속성 기호. 이름은 호버 (0078 고칠 점 1) */
function strongNode(vm: DepartVM, hot: boolean): BoxNode {
  const S = STRONG;
  return {
    t: "row", h: S.h, pad: S.pad, radius: S.radius, gap: S.gap, align: "center",
    style: { fill: hot ? P.veil["14"] : P.veil["06"], ring: { width: 1, color: hot ? P.ink2 : P.glassLine } },
    children: [
      { t: "block", w: S.todo, h: S.todo, draw: (g, bx, by, bw, bh) => strokePlaceholder(g, bx, by, bw, bh, P.warn) },
      { t: "icon", id: vm.strong.icon, w: S.icon, h: S.icon, tint: P.ink },
    ],
  };
}

function button(label: string, go: boolean): BoxNode {
  return {
    t: "row", h: BTN.h, radius: BTN.radius, pad: [0, BTN.padX, 0, BTN.padX], gap: BTN.gap, align: "center", justify: "center",
    // 정본 버튼 판 (0054 밝은 유리 판): 떠나기 = 강조, 취소 = 테만
    style: plateStyle(go),
    children: go ? [text(label, T.button, P.ink)] : [
      { t: "icon", id: "g-close", w: BTN.icon, h: BTN.icon, tint: P.ink },
      text(label, T.button, P.ink),
      { t: "row", pad: BTN.kbd.pad, radius: BTN.kbd.radius, style: { ring: { width: 1, color: P.glassLine } }, children: [text(COPY.esc, T.kbd, P.ink3)] },
    ],
  };
}

/** 자리 칸 하나 (.seat) */
function drawSeat(scene: Phaser.Scene, s: SeatVM, x: number, y: number, front: boolean, hot: boolean, pick: SeatPick) {
  const K = SEAT;
  box(scene.add.graphics(), x, y, K.w, K.h, K.radius, { fill: P.floor });
  const G = K.glow;
  const key = canvasTexture(scene, "depart:glow", K.w, G.h, (ctx) =>
    ellipse(ctx, K.w, G.h, { rx: G.rx, ry: G.ry, cx: 0.5, cy: G.cy }, [[withAlpha(P.ink, G.alpha), 0], [withAlpha(P.ink, 0), 1]]));
  scene.add.image(x, y, key).setOrigin(0, 0);
  drawSpiritArt(scene, s.art, x + K.w / 2, y + K.art.bottom, K.art.sil, K.art.k);
  box(scene.add.graphics(), x, y, K.w, K.h, K.radius, {
    ring: front ? { width: K.frontRing, color: P.accHi } : { width: K.ring, color: hot ? P.veil["50"] : P.glassLine },
  });
  // 앞열 깃발. 다른 칸에 올리면 그 칸에 점선 깃발이 비쳐요
  if (front || hot) {
    const F = K.flag;
    const g = scene.add.graphics();
    const cx = x + F.x + F.d / 2, cy = y + F.y + F.d / 2;
    if (front) circle(g, cx, cy, F.d, { fill: P.pvFill, ring: { width: F.ring, color: P.accHi } });
    else circle(g, cx, cy, F.d, { ring: { width: F.ring, color: withAlpha(P.accHi, F.ghost), dash: F.dash } });
    render(scene, { t: "icon", id: "g-flag", w: F.icon, h: F.icon, tint: front ? P.ink : withAlpha(P.ink, F.ghost) }, cx - F.icon / 2, cy - F.icon / 2);
  }
  // 작은 장비 칸 (0064)
  const E = K.equip, mini = EQUIP_MINI.s32;
  const slots: Node = { t: "row", gap: E.gap, children: s.slots.map((e) => miniSlotNode(scene, e, mini, { pips: true })) };
  render(scene, slots, x + K.w - E.right - size(slots).w, y + E.top);
  // 이름 · Lv, 기호, 성격 칩, 능력치. 열린 성격을 펼치면 능력치 자리에 칩들이 놓여요 (넘치면 아래로 줄을 더해요)
  const M = K.meta, S = INFO.stats;
  const spot = (node: BoxNode, what: "chip" | PersonalityVM): Node => {
    const ns = size(node);
    return { t: "block", w: ns.w, h: ns.h, draw: (_g, cx, cy) => {
      render(scene, node, cx, cy);
      pick.at({ x: cx, y: cy, w: ns.w, h: ns.h }, what);
    } };
  };
  const rows: Node[][] = [[]];
  let used = 0;
  for (const p of pick.rest) {
    const node = chip(p.name, { hot: pick.optionHot === p.id });
    const w = size(node).w;
    if (rows.at(-1)!.length && used + K.pick.gap + w > K.w - M.x * 2) {
      rows.push([]);
      used = 0;
    }
    used += (rows.at(-1)!.length ? K.pick.gap : 0) + w;
    rows.at(-1)!.push(spot(node, p));
  }
  render(scene, {
    t: "col", gap: M.gap, align: "start",
    children: [
      { t: "row", gap: M.nameGap, align: "baseline", children: [text(s.name, TR.name, P.ink), text(RUN_COPY.lv(s.level), TR.level, P.ink3Spirit)] },
      { t: "row", gap: M.iconGap, align: "center", children: [
        { t: "icon", id: s.element, w: M.icon, h: M.icon, tint: P.ink2 },
        { t: "icon", id: s.role, w: M.icon, h: M.icon, tint: P.ink2 },
      ] },
      spot(chip(pick.now.name, { hot: pick.chipHot, caret: pick.rest.length > 0, open: pick.open }), "chip"),
      pick.open ? { t: "col", gap: K.pick.rowGap, children: rows.map((r): Node => ({ t: "row", gap: K.pick.gap, children: r })) } : { t: "row", gap: S.gap, align: "center", children: STAT_IDS.map((k): Node => ({
        t: "row", gap: S.iconGap, align: "center",
        children: [{ t: "icon", id: STAT_ICON[k], w: S.icon, h: S.icon, tint: P.stat[k] }, text(String(s.stats[k]), TR.stat, P.ink2)],
      })) },
    ],
  }, x + M.x, y + M.y);
}
