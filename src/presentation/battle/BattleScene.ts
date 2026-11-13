// 전투 화면 (정본: 전투 R5 "판단 동선"). 뷰모델을 받아 그리기만 해요.
// 필드는 쉬는 필드(.fld-rest)와 대상 고르기 미리보기 필드(.fld-pv) 여러 장이에요. 미리보기는 "카드 + 포인터가 있는 곳"마다
// 처음 필요할 때 한 번 그려 두고 다시 써요. 대상 고르기는 결정 0013: 카드를 대상에 끌어 대거나, 클릭으로 집고 대상을 클릭해요.
import * as Phaser from "phaser";
import { gather } from "../style/gather";
import { loadIcon } from "../style/icons";
import { darken } from "../style/opacity";
import { canonRest } from "./fixtures/canonRest";
import { dimmed, focusFor, type Focus, type Over } from "./targeting";
import { drawBackdrop } from "./views/backdrop";
import { enemyTipContent } from "./views/enemyTip";
import { GLASS } from "../tooltip/skins";
import { drawTooltip } from "../tooltip/Tooltip";
import { createHand, drawBand, drawEnd, drawMana, preloadHand, type HandView } from "./views/hand";
import { drawOrder, preloadOrder } from "./views/order";
import { ALLY, BAND, DRAG, ENEMY, FRAME, INFO, LIFT_STYLES, OPEN_PLATE_DEPTH, SYS, TARGETING } from "./layout";
import { preloadHandCard } from "../card/HandCard";
import { drawMiniSlotHot, type Rect } from "../run/equip";
import { EQUIP_TIP_ICONS, drawEquipTip } from "../run/equipTip";
import { EQUIP_MINI, EQUIP_TIP } from "../run/layout";
import { SYS_ICONS, drawSys } from "./views/topbar";
import { drawAlly, drawEnemy, drawOpenAlly, drawOpenEnemy, preloadUnits, type UnitBounds, type UnitView } from "./views/units";
import type { BattleVM, UnitRef } from "./viewmodel";

export const BATTLE_SCENE = "battle";

export class BattleScene extends Phaser.Scene {
  private vm: BattleVM = canonRest;

  constructor() {
    super(BATTLE_SCENE);
  }

  /** 시각 검증용: 처음부터 이 카드에 호버한 상태로 */
  private hover?: string;

  /** 들기 크기 바꿔 보기 (?lift=h1 정본) */
  private lift?: string;

  init(data: { vm?: BattleVM; hover?: string; lift?: string }) {
    if (data.vm) this.vm = data.vm;
    this.hover = data.hover;
    this.lift = data.lift;
  }

  preload() {
    for (const id of SYS_ICONS) loadIcon(this, id, SYS.icon);
    preloadOrder(this, this.vm.order);
    preloadUnits(this, this.vm);
    preloadHand(this, this.vm);
    for (const [id, w] of EQUIP_TIP_ICONS) loadIcon(this, id, w);
    for (const e of this.vm.allies.flatMap((a) => a.equip ?? [])) {
      if (e.tip.sheet.card) preloadHandCard(this, e.tip.sheet.card.vm, { showRarity: true });
    }
  }

  // 필드: 모든 필드 장은 이 층 안에 있어서, 나중에 그린 미리보기도 손패 띠 아래에 놓여요
  private fieldLayer!: Phaser.GameObjects.Container;
  private rest!: Phaser.GameObjects.Container;
  private previews = new Map<string, Phaser.GameObjects.Container>();
  private shown: Phaser.GameObjects.Container | null = null;
  private bounds: { ref: UnitRef; box: UnitBounds }[] = [];
  /** 쉬는 필드의 접힌 정보판 (펼친 판이 덮는 동안 숨겨요) */
  private plates: { ref: UnitRef; plate: Phaser.GameObjects.Container }[] = [];
  private hand!: HandView;

  // 대상 고르기 상태: 누른 카드(끌기 전), 끄는 카드, 클릭으로 집은 카드, 포인터가 집은 카드 아닌 손패 카드 위인지
  private press: { key: string; x: number; y: number } | null = null;
  private dragging: string | null = null;
  private held: string | null = null;
  private onOtherCard = false;

  create() {
    drawBackdrop(this);
    drawSys(this);
    this.fieldLayer = this.add.container(0, 0);
    this.rest = this.drawField(null);
    this.shown = this.rest;
    drawBand(this);
    drawMana(this, this.vm.mana);
    drawEnd(this, this.vm);
    // 가리킨 유닛의 펼친 정보판(적은 설명판까지)은 마우스가 손패로 가거나 카드를 고르는 동안 접어요. 마우스는 한 곳에만 있으니까요.
    const hov = this.vm.enemies.findIndex((e) => e.hovered);
    this.openUnit(hov < 0 ? null : { side: "enemy", i: hov });
    this.hand = createHand(this, this.vm.hand, {
      lift: this.lift ? LIFT_STYLES[this.lift] : undefined,
      onPress: (key, p) => {
        if (p.rightButtonDown() || !this.vm.plays[key]) return;
        this.press = { key, x: p.x, y: p.y };
      },
      onChange: (key, held) => {
        this.onOtherCard = key !== null && !held;
        // 다른 카드를 보는 동안 필드는 쉬는 상태 (판정 2 나). 집은 카드로 돌아오면 포인터 자리로 다시 미리보기
        if (this.onOtherCard) this.showField(null);
        else this.refresh(this.input.activePointer);
        if (key !== null || this.dragging || this.held) this.openUnit(null);
        else this.hoverUnit(this.input.activePointer.x, this.input.activePointer.y);
      },
    });
    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.move(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.release(p));
    this.input.keyboard?.on("keydown-ESC", () => this.cancel());
    this.begin();
    Object.assign(window, { __screenReady: BATTLE_SCENE });
  }

  /** 시작 상태 (시각 검증용 ?scene=, ?hover=) */
  private begin() {
    const start = this.vm.start;
    if (start) {
      const over = start.over;
      const box = over && this.bounds.find((b) => b.ref.side === over.side && b.ref.i === over.i)?.box;
      // 대상이 없으면 아군과 적 사이 필드 빈 곳
      const at = box
        ? { x: box.x + box.w / 2, y: box.y + box.h / 2 }
        : { x: (ALLY.xs[ALLY.xs.length - 1] + ENEMY.xs[0]) / 2, y: BAND.top / 2 };
      const where = this.overAt(at.x, at.y);
      if (start.mode === "held") {
        this.held = start.card;
        this.hand.setHeld(start.card, true);
      } else {
        this.dragging = start.card;
        this.hand.startDrag(start.card);
        this.hand.moveDrag(at.x, at.y, this.dragAt(start.card, where), true);
      }
      this.showFocus(start.card, where);
      this.openUnit(null);
    }
    // ?hover=equip:<아군 번호>:<칸 번호> = 그 장비 칸에 올린 모습
    const eq = this.hover?.match(/^equip:(\d+):(\d+)$/);
    if (eq) this.openUnit({ side: "ally", i: Number(eq[1]) });
    const at = eq && this.equipRects.find((r) => r.ally === Number(eq[1]) && r.k === Number(eq[2]))?.rect;
    if (at) this.hoverEquip(at.x + at.w / 2, at.y + at.h / 2);
    else if (this.hover) this.hand.setHover(this.hover, true);
  }

  // ── 입력 ──────────────────────────────────────────────

  private move(p: Phaser.Input.Pointer) {
    if (this.press && !this.dragging && Math.hypot(p.x - this.press.x, p.y - this.press.y) >= DRAG.threshold) {
      this.dragging = this.press.key;
      this.held = null;
      this.hand.startDrag(this.dragging);
      this.openUnit(null);
    }
    this.refresh(p);
    this.hoverUnit(p.x, p.y);
    this.hoverEquip(p.x, p.y);
  }

  // ── 가리킨 유닛: 정보판을 펼치고, 적이면 설명판을 펼친 판 바로 아래에. 카드를 집거나 끄는 동안에는 펼치지 않아요 ──

  private openRef: UnitRef | null = null;
  /** 펼친 판 자리 (가리킴을 이어 가는 판정에도 써요) */
  private openRect: Rect | null = null;
  private openObjs: Phaser.GameObjects.GameObject[] = [];

  private hoverUnit(x: number, y: number) {
    if (this.dragging || this.held || this.press) return;
    const inside = (b: Rect) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
    // 펼친 판은 옆 유닛 위로 넓어져요. 그 판 위에 있는 동안은 같은 유닛을 가리키는 것으로 봐요
    if (this.openRef && this.openRect && inside(this.openRect)) return;
    const hit = y < BAND.top ? this.bounds.find(({ box: b }) => inside(b)) : undefined;
    this.openUnit(hit?.ref ?? null);
  }

  private openUnit(ref: UnitRef | null) {
    const same = (a: UnitRef | null, b: UnitRef | null) => a === b || (!!a && !!b && a.side === b.side && a.i === b.i);
    if (same(ref, this.openRef)) return;
    this.closeEquip();
    for (const o of this.openObjs) o.destroy();
    this.openObjs = [];
    for (const p of this.plates) p.plate.setVisible(!same(p.ref, ref));
    this.openRef = ref;
    this.openRect = null;
    this.equipRects = [];
    if (!ref) return;
    const plate = gather(this, 0, 0, () => {
      this.openRect = ref.side === "ally"
        ? drawOpenAlly(this, this.vm.allies[ref.i], ref.i, (k, rect) => this.equipRects.push({ ally: ref.i, k, rect }))
        : drawOpenEnemy(this, this.vm.enemies[ref.i], ref.i);
    }).setDepth(OPEN_PLATE_DEPTH);
    this.openObjs.push(plate);
    const tip = ref.side === "enemy" ? this.vm.enemies[ref.i].tip : undefined;
    const r = this.openRect as Rect | null;
    if (!tip || !r) return;
    // 펼친 판 가운데 아래, 화면 양쪽 여백(시스템 버튼과 같은 값) 안으로
    const left = Math.max(SYS.right, Math.min(r.x + r.w / 2 - GLASS.w / 2, FRAME.w - SYS.right - GLASS.w));
    const c = drawTooltip(this, { skin: GLASS, content: enemyTipContent(tip), at: { left, top: r.y + r.h + INFO.tipGap } });
    c.setDepth(DRAG.depth);
    this.openObjs.push(c);
  }

  // ── 장비 칸 (0066): 올리면 밝은 테와 말풍선. 카드를 집거나 끄는 동안에는 뜨지 않아요 ──

  private equipRects: { ally: number; k: number; rect: Rect }[] = [];
  private equipOn?: string;
  private equipTip: Phaser.GameObjects.GameObject[] = [];

  private hoverEquip(x: number, y: number) {
    const busy = this.dragging || this.held || this.press;
    const hit = busy ? undefined : this.equipRects.find(({ rect: r }) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
    const key = hit && `${hit.ally}:${hit.k}`;
    if (key === this.equipOn) return;
    this.closeEquip();
    this.equipOn = key;
    const slot = hit && this.vm.allies[hit.ally].equip?.[hit.k];
    const plate = this.openRect;
    if (!hit || !slot || !plate) return;
    const before = new Set(this.children.list);
    drawMiniSlotHot(this, hit.rect, EQUIP_MINI.s24);
    drawEquipTip(this, slot.tip, { kind: "under", left: plate.x, top: plate.y + plate.h + EQUIP_TIP.gapToLane });
    this.equipTip = this.children.list.filter((o) => !before.has(o));
    for (const o of this.equipTip) (o as Phaser.GameObjects.Image).setDepth?.(DRAG.depth);
  }

  private closeEquip() {
    this.equipOn = undefined;
    for (const o of this.equipTip) o.destroy();
    this.equipTip = [];
  }

  /** 포인터 자리에 맞춰 끄는 카드와 필드를 다시 맞춰요 */
  private refresh(p: Phaser.Input.Pointer) {
    const card = this.dragging ?? this.held;
    if (!card) return;
    const over = this.overAt(p.x, p.y);
    if (this.dragging) this.hand.moveDrag(p.x, p.y, this.dragAt(this.dragging, over));
    else if (this.onOtherCard) return;
    this.showFocus(card, over);
  }

  private release(p: Phaser.Input.Pointer) {
    if (p.rightButtonReleased()) return this.cancel();
    const over = this.overAt(p.x, p.y);
    if (this.dragging) {
      const card = this.dragging;
      const f = this.focus(card, over);
      this.dragging = null;
      this.press = null;
      this.hand.endDrag();
      if (f.ready) this.play(card, f.ready.target);
      this.showField(null);
      return;
    }
    if (this.press) {
      // 끌지 않고 뗐으면 클릭: 집기 / 같은 카드면 내려놓기 / 다른 카드면 바꿔 집기
      const key = this.press.key;
      this.press = null;
      this.held = this.held === key ? null : key;
      this.hand.setHeld(this.held);
      return;
    }
    if (this.held && over !== "hand") {
      // 집은 상태에서 필드 클릭: 낼 수 있으면 내고, 어느 쪽이든 내려놓아요
      const card = this.held;
      const f = this.focus(card, over);
      if (f.ready) this.play(card, f.ready.target);
      this.cancel();
    }
  }

  private cancel() {
    if (this.dragging) this.hand.endDrag();
    this.dragging = null;
    this.press = null;
    this.held = null;
    this.hand.setHeld(null);
    this.showField(null);
  }

  /** 카드 내기. 전투 규칙(session 층)이 아직 없어서 지금은 기록만 하고 쉬는 상태로 돌아가요 (TODO: session 층에 넘기기) */
  private play(card: string, target?: UnitRef) {
    console.info("[battle] 카드 사용", card, target ?? "(대상 고르기 없음)");
  }

  // ── 대상 강조 ──────────────────────────────────────────

  private overAt(x: number, y: number): Over {
    if (y >= BAND.top) return "hand";
    const hit = this.bounds.find(({ box: b }) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
    return hit?.ref ?? "field";
  }

  private focus(card: string, over: Over): Focus {
    return focusFor(card, this.vm.plays[card], over, { enemy: this.vm.enemies.length, ally: this.vm.allies.length });
  }

  private dragAt(card: string, over: Over) {
    return { field: over !== "hand", target: !!this.focus(card, over).ready?.target };
  }

  private showFocus(card: string, over: Over) {
    const f = this.focus(card, over);
    let field = this.previews.get(f.key);
    if (!field) {
      field = this.drawField(f);
      this.previews.set(f.key, field);
    }
    this.showField(field);
  }

  private showField(field: Phaser.GameObjects.Container | null) {
    const next = field ?? this.rest;
    if (next === this.shown) return;
    this.shown?.setVisible(false);
    next.setVisible(true);
    this.shown = next;
  }

  /** 쉬는 필드의 유닛: 판정 영역과 접힌 정보판을 기억해요 */
  private rested(ref: UnitRef, v: UnitView) {
    this.bounds.push({ ref, box: v.bounds });
    this.plates.push({ ref, plate: v.plate });
  }

  /** 필드 한 장: 순서표·아군·적. focus가 있으면 그 강조·결과로, 없으면 쉬는 필드 */
  private drawField(f: Focus | null): Phaser.GameObjects.Container {
    const o = f?.outcome;
    const lit = (ref: UnitRef) => !!f?.lit.some((r) => r.side === ref.side && r.i === ref.i);
    // 캐릭터마다 한 덩어리로 모아서 한 번에 어둡게 해요
    const unit = (ref: UnitRef, draw: () => void) => {
      const c = gather(this, 0, 0, draw);
      if (f && dimmed(f, ref)) darken(c, TARGETING.dim);
    };
    const cutOrders = new Set(this.vm.enemies.filter((_, i) => o?.enemies[i]?.cut).map((e) => e.intent.order));
    const root = gather(this, 0, 0, () => {
      drawOrder(this, { ...this.vm.order, slots: this.vm.order.slots.map((s) => (cutOrders.has(s.n) ? { ...s, cut: true } : s)) });
      this.vm.allies.forEach((a, i) => {
        const ref = { side: "ally", i } as const;
        unit(ref, () => {
          const v = drawAlly(this, a, i, { outcome: o?.incoming[i], lit: lit(ref) });
          if (!f) this.rested(ref, v);
        });
      });
      this.vm.enemies.forEach((e, i) => {
        const ref = { side: "enemy", i } as const;
        unit(ref, () => {
          const v = drawEnemy(this, e, i, { outcome: o?.enemies[i], lit: lit(ref) });
          if (!f) this.rested(ref, v);
        });
      });
    });
    this.fieldLayer.add(root);
    root.setVisible(!f);
    return root;
  }
}
