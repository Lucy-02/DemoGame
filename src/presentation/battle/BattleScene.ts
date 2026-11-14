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
import { createHand, drawBand, drawEnd, drawMana, preloadHand, type HandView } from "./views/hand";
import { drawOrder, preloadOrder } from "./views/order";
import { ALLY, BAND, DRAG, ENEMY, LIFT_STYLES, SYS, TARGETING } from "./layout";
import { SYS_ICONS, drawSys } from "./views/topbar";
import { aimsAt, drawAlly, drawAllyPulse, drawEnemy, drawIntent, drawMarkTip, drawUnitTip, losesHp, preloadUnits, type UnitBounds, type UnitView } from "./views/units";
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
  }

  // 필드: 모든 필드 장은 이 층 안에 있어서, 나중에 그린 미리보기도 손패 띠 아래에 놓여요
  private fieldLayer!: Phaser.GameObjects.Container;
  private rest!: Phaser.GameObjects.Container;
  private previews = new Map<string, Phaser.GameObjects.Container>();
  private shown: Phaser.GameObjects.Container | null = null;
  private bounds: { ref: UnitRef; box: UnitBounds }[] = [];
  /** 쉬는 필드의 유닛들 (가리킴 효과가 덮어 그리는 동안 정보 묶음·의도 알약을 숨겨요) */
  private units: { ref: UnitRef; view: UnitView }[] = [];
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
    // 가리킨 유닛의 풀이는 마우스가 손패로 가거나 카드를 고르는 동안 숨겨요. 마우스는 한 곳에만 있으니까요.
    const hov = this.vm.enemies.findIndex((e) => e.hovered);
    this.showHover(hov < 0 ? null : { side: "enemy", i: hov });
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
        if (key !== null || this.dragging || this.held) this.showHover(null);
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
      this.showHover(null);
    }
    // ?hover=unit:<ally|enemy>:<번호> = 그 유닛을 가리킨 모습, 뒤에 :<기호 번호>를 붙이면 그 기호(깃발·칩 순서)를 가리킨 모습.
    // ?hover=equip:<아군 번호>(:<칸>) 는 그 아군을 가리킨 모습 (풀이에 장비 칸)
    const unit = this.hover?.match(/^unit:(ally|enemy):(\d+)(?::(\d+))?$/);
    const eq = this.hover?.match(/^equip:(\d+)(?::\d+)?$/);
    if (unit) {
      this.showHover({ side: unit[1] as UnitRef["side"], i: Number(unit[2]) }, unit[3] === undefined ? undefined : Number(unit[3]));
    } else if (eq) {
      this.showHover({ side: "ally", i: Number(eq[1]) });
    } else if (this.hover) this.hand.setHover(this.hover, true);
  }

  // ── 입력 ──────────────────────────────────────────────

  private move(p: Phaser.Input.Pointer) {
    if (this.press && !this.dragging && Math.hypot(p.x - this.press.x, p.y - this.press.y) >= DRAG.threshold) {
      this.dragging = this.press.key;
      this.held = null;
      this.hand.startDrag(this.dragging);
      this.showHover(null);
    }
    this.refresh(p);
    this.hoverUnit(p.x, p.y);
  }

  // ── 가리킴 (캡슐 막대 V1): 유닛을 가리키면 묶음 아래에 풀이 한두 줄, 기호를 가리키면 그 기호의 한 줄 풀이.
  //    적을 가리키면 그 적이 노리는 아군의 깎일 구간이 깜빡이고, 아군을 가리키면 그 아군을 노리는 의도가 밝아져요.
  //    묶음은 커지지 않아요. 카드를 집거나 끄는 동안에는 뜨지 않아요 ──

  private hoverRef: UnitRef | null = null;
  /** 가리킨 기호 (그 유닛 marks의 순서). 없으면 유닛 풀이 */
  private hoverMark: number | undefined;
  /** 가리킴 효과(의도 알약·깜빡이는 묶음)와 풀이. 같은 유닛 안에서 기호만 바뀌면 풀이만 다시 그려요 */
  private hoverFx: Phaser.GameObjects.Container | null = null;
  private hoverTip: Phaser.GameObjects.Container | null = null;

  /** 포인터 아래 유닛 (쉬는 필드 판정 영역) */
  private unitAt(x: number, y: number): UnitRef | null {
    if (y >= BAND.top) return null;
    return this.bounds.find(({ box: b }) => inside(b, x, y))?.ref ?? null;
  }

  private hoverUnit(x: number, y: number) {
    if (this.dragging || this.held || this.press) return;
    // 기호가 먼저: 깃발처럼 판정 영역 밖으로 나온 기호도 있어요
    for (const u of this.units) {
      const k = u.view.marks.findIndex((m) => inside(m, x, y));
      if (k >= 0) return this.showHover(u.ref, k);
    }
    this.showHover(this.unitAt(x, y));
  }

  private showHover(ref: UnitRef | null, mark?: number) {
    const sameUnit = same(ref, this.hoverRef);
    if (sameUnit && mark === this.hoverMark) return;
    this.hoverTip?.destroy();
    this.hoverTip = null;
    if (!sameUnit) this.clearHoverFx();
    this.hoverRef = ref;
    this.hoverMark = mark;
    const unit = ref && this.units.find((u) => same(u.ref, ref))?.view;
    if (!ref || !unit) return;
    const { allies, enemies } = this.vm;
    if (!sameUnit) this.drawHoverFx(ref);
    const cx = (ref.side === "ally" ? ALLY : ENEMY).xs[ref.i];
    const tip = mark === undefined ? undefined : unit.marks[mark]?.tip;
    // 필드 층 맨 위(손패 띠 아래)에 그려요
    this.hoverTip = gather(this, 0, 0, () => {
      if (tip) drawMarkTip(this, tip, cx, unit.bottom);
      else if (ref.side === "ally") drawUnitTip(this, { side: "ally", vm: allies[ref.i] }, cx, unit.bottom);
      else drawUnitTip(this, { side: "enemy", vm: enemies[ref.i] }, cx, unit.bottom);
    });
    this.fieldLayer.add(this.hoverTip);
  }

  /** 가리킨 유닛과 이어진 의도 알약은 밝은 테, 나머지는 어둡게. 적이면 그 적이 노리는 아군의 깎일 구간이 깜빡여요 */
  private drawHoverFx(ref: UnitRef) {
    const { allies, enemies } = this.vm;
    const rest = (side: UnitRef["side"], i: number) => this.units.find((u) => u.ref.side === side && u.ref.i === i)?.view;
    const layer = this.add.container(0, 0);
    this.fieldLayer.add(layer);
    this.hoverFx = layer;
    const draw = (f: () => void) => {
      const c = gather(this, 0, 0, f);
      layer.add(c);
      return c;
    };
    enemies.forEach((e, i) => {
      const on = ref.side === "enemy" ? i === ref.i : aimsAt(e, allies[ref.i]);
      rest("enemy", i)?.intent?.setVisible(false);
      const c = draw(() => drawIntent(this, e, i, { on }));
      if (!on) darken(c, TARGETING.dim);
    });
    if (ref.side !== "enemy") return;
    allies.forEach((a, i) => {
      if (!aimsAt(enemies[ref.i], a) || !losesHp(a)) return;
      rest("ally", i)?.info.setVisible(false);
      draw(() => drawAllyPulse(this, a, i));
    });
  }

  private clearHoverFx() {
    if (this.hoverFx) {
      // 깜빡임 트윈도 같이 멈춰요
      const stop = (o: Phaser.GameObjects.GameObject) => {
        this.tweens.killTweensOf(o);
        if (o instanceof Phaser.GameObjects.Container) o.list.forEach(stop);
      };
      stop(this.hoverFx);
      this.hoverFx.destroy();
      this.hoverFx = null;
    }
    for (const u of this.units) {
      u.view.info.setVisible(true);
      u.view.intent?.setVisible(true);
    }
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
      field = this.drawField(f, card);
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


  /** 쉬는 필드의 유닛: 판정 영역과 가리킬 조각을 기억해요 */
  private rested(ref: UnitRef, v: UnitView) {
    this.bounds.push({ ref, box: v.bounds });
    this.units.push({ ref, view: v });
  }

  /** 필드 한 장: 순서표·아군·적. focus가 있으면 그 강조·결과로, 없으면 쉬는 필드. card = 든 카드 (속성이 약점인 적의 약점 배지를 켜요) */
  private drawField(f: Focus | null, card?: string): Phaser.GameObjects.Container {
    const o = f?.outcome;
    const element = card && this.vm.hand.flatMap((g) => g.cards).find((c) => c.key === card)?.element;
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
          const v = drawEnemy(this, e, i, { outcome: o?.enemies[i], lit: lit(ref), weakOn: !!element && element === e.weakTo });
          if (!f) this.rested(ref, v);
        });
      });
    });
    this.fieldLayer.add(root);
    root.setVisible(!f);
    return root;
  }
}

const same = (a: UnitRef | null, b: UnitRef | null) => a === b || (!!a && !!b && a.side === b.side && a.i === b.i);
const inside = (b: UnitBounds, x: number, y: number) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
