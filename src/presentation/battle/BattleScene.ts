// 전투 화면 (정본: 전투 R5 "판단 동선"). 뷰모델을 받아 그리기만 해요.
// 필드는 쉬는 필드(.fld-rest)와 대상 고르기 미리보기 필드(.fld-pv) 여러 장이에요. 미리보기는 "카드 + 포인터가 있는 곳"마다
// 처음 필요할 때 한 번 그려 두고 다시 써요. 대상 고르기는 결정 0013: 카드를 대상에 끌어 대거나, 클릭으로 집고 대상을 클릭해요.
import * as Phaser from "phaser";
import { gather } from "../style/gather";
import { loadIcon } from "../style/icons";
import { darken } from "../style/opacity";
import type { BattleSession } from "../../session/battle";
import { bakeSpiritFace, preloadSpiritArt } from "../spiritArt";
import { canonRest } from "./fixtures/canonRest";
import { battleVM, cardKey, cardUid, refOf, releaseId } from "./fromBattle";
import { tokens } from "../../design/tokens";
import { ms } from "../style/ease";
import { guideStep, type GuideSeen } from "./guide";
import { reducedMotion } from "../style/motion";
import { playbackFrames } from "./playback";
import { audioOf, type SfxId } from "../audio";
import { cuesOf, playbackCues } from "../audio/battleCues";
import { dimmed, focusFor, type Focus, type Over } from "./targeting";
import { drawBackdrop } from "./views/backdrop";
import { drawGuide, type GuideBox } from "./views/guide";
import { createHand, drawBand, drawEnd, drawMana, handBoxes, preloadHand, type HandSnapshot, type HandView } from "./views/hand";
import { createPick, preloadPick, type PickView } from "./views/pick";
import { drawOrder, drawOrderRing, preloadOrder, preloadOrderIcon, type OrderHit } from "./views/order";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { ALLY, BAND, DRAG, END, ENEMY, FRAME, INTENT, LIFT_STYLES, SYS, TARGETING } from "./layout";
import { playOrderMotion, snapshotOrder, type OrderSnapshot } from "./views/orderMotion";
import { SYS_ICONS, drawSys } from "./views/topbar";
import { playUnitMotion, type UnitActor } from "./views/unitMotion";
import { aimsAt, drawAlly, drawAllyPulse, drawEnemy, drawIntent, drawMarkTip, drawUnitTip, losesHp, preloadUnits, type UnitBounds, type UnitView } from "./views/units";
import type { BattleVM, UnitRef } from "./viewmodel";

export const BATTLE_SCENE = "battle";

export interface BattleSceneData {
  /** 고정 장면 (fixtures). session을 주면 무시해요 */
  vm?: BattleVM;
  /** 실제 전투. 주면 명령을 보내고 바뀐 상태로 다시 그려요 */
  session?: BattleSession;
  /** 전투가 끝났어요 (session이 있을 때) */
  onOver?: (scene: Phaser.Scene) => void;
  /** 덱 보기 열기 (오른쪽 위 덱 버튼) */
  onDeck?: (scene: Phaser.Scene) => void;
  /** 순서표 머리의 장소 글 (session이 있을 때) */
  place?: string;
  hover?: string;
  lift?: string;
  /** 첫 판 안내 (0088): 주면 이 전투에서 개념을 한 번씩 짚어요. 이미 짚은 것을 여기에 적어 장면을 다시 그려도 남겨요 */
  guide?: GuideSeen;
  /** 턴 재생: 남은 장면들. 첫 장면을 그리고, 한 행동 시간 뒤 다음 장면으로 넘어가요 */
  playback?: BattleVM[];
  /** 턴 재생: 남은 장면마다 날 소리 (playback과 같은 순서) */
  cues?: SfxId[][];
}

export class BattleScene extends Phaser.Scene {
  private vm: BattleVM = canonRest;

  constructor() {
    super(BATTLE_SCENE);
  }

  /** 시각 검증용: 처음부터 이 카드에 호버한 상태로 */
  private hover?: string;

  /** 들기 크기 바꿔 보기 (?lift=h1 정본) */
  private lift?: string;

  private session?: BattleSession;
  private playback?: BattleVM[];
  private cues?: SfxId[][];
  private place?: string;
  private guide?: GuideSeen;
  private guideFx: Phaser.GameObjects.Graphics | null = null;
  private guideBoxes: GuideBox[] = [];
  /** 차징 테가 켜진 채로 포인터가 적 밖에 있었는지. 카드를 적에게 놓은 자리에 그대로 있는 포인터는 "가리켜 봤다"로 치지 않아요 */
  private guideArmed = false;
  /** 지금 차징을 짚는 중인지 */
  private guideCharge = false;
  private onOver?: (scene: Phaser.Scene) => void;
  private onDeck?: (scene: Phaser.Scene) => void;

  init(data: BattleSceneData) {
    this.session = data.session;
    this.onOver = data.onOver;
    this.onDeck = data.onDeck;
    this.place = data.place;
    this.guide = data.guide;
    this.guideFx = null;
    this.guideBoxes = [];
    this.guideArmed = false;
    this.guideCharge = false;
    this.playback = data.playback;
    this.cues = data.cues;
    this.vm = data.playback?.[0] ?? (data.session ? battleVM(data.session.battle, data.place) : data.vm ?? canonRest);
    this.previews.clear();
    this.bounds = [];
    this.units = [];
    this.press = null;
    this.dragging = null;
    this.held = null;
    this.onOtherCard = false;
    this.hoverRef = null;
    this.hoverMark = undefined;
    this.hoverFx = null;
    this.hoverTip = null;
    this.orderHits = [];
    this.orderHover = null;
    this.orderFx = null;
    this.pick = null;
    this.hover = data.hover;
    this.lift = data.lift;
  }

  preload() {
    for (const id of SYS_ICONS) loadIcon(this, id, SYS.icon);
    preloadOrder(this, this.vm.order);
    for (const p of Object.values(this.vm.plays)) if (p.slot) preloadOrderIcon(this, p.slot.token.icon);
    preloadUnits(this, this.vm);
    preloadHand(this, this.vm);
    if (this.vm.pick) preloadPick(this, this.vm.pick);
    if (this.session) preloadSpiritArt(this, this.session.battle.spirits.map((s) => s.id));
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
  /** 열린 가운데 고르기 창 (0075). 보이는 동안 아래 화면의 조작은 쉬어요 */
  private pick: PickView | null = null;
  /** 앞 장면의 순서표 (장면을 다시 그려도 남아요) */
  private orderPrev?: { session?: BattleSession; snap: OrderSnapshot };
  /** 앞 장면의 턴 종료 버튼 모양 (0086) */
  private endPrev?: { session: BattleSession; go: boolean };
  /** 앞 장면의 손패 (0086). turn = 그 장면의 턴 */
  private handPrev?: { session: BattleSession; snap: HandSnapshot; turn?: number };

  create() {
    // 정령 얼굴을 정본 얼굴과 같은 키로 구워요 (정보판 · 의도 · 손패 묶음 · 카드 초상 홈)
    for (const s of this.session?.battle.spirits ?? []) bakeSpiritFace(this, s.id, s.run.stage);
    drawBackdrop(this);
    drawSys(this, { "i-deck": this.onDeck && (() => this.onDeck?.(this)) });
    this.fieldLayer = this.add.container(0, 0);
    this.rest = this.drawField(null);
    this.shown = this.rest;
    drawBand(this);
    drawMana(this, this.vm.mana);
    // 턴 종료 버튼: 낼 카드가 없으면 밝아져요. 앞 장면과 모양이 달라졌으면 흐려지며 바뀌어요 (0086)
    const endWas = this.session && this.endPrev?.session === this.session ? this.endPrev.go : undefined;
    const endGo = drawEnd(this, this.vm, this.session && !this.playback ? () => this.endTurn() : undefined, endWas);
    if (this.session) this.endPrev = { session: this.session, go: endGo };
    // 재생 중 소리는 맞는 때(유닛이 밀리는 때)에 맞춰 나요 (0086 4번). 그 밖에는 바로
    const cues = this.cues?.[0] ?? [];
    const sound = () => { for (const id of cues) audioOf(this)?.play(id); };
    if (this.playback && cues.length && !reducedMotion()) this.time.delayedCall(ms(tokens.provisional.motion.hit.recoil.delay), sound);
    else sound();
    if (this.playback) this.time.delayedCall(ms(tokens.provisional.motion.playback.step), () => this.step());
    // 가리킨 유닛의 풀이는 마우스가 손패로 가거나 카드를 고르는 동안 숨겨요. 마우스는 한 곳에만 있으니까요.
    const hov = this.vm.enemies.findIndex((e) => e.hovered);
    this.showHover(hov < 0 ? null : { side: "enemy", i: hov });
    // 손패는 앞 장면에서 이어 움직여요. 전투를 막 열었거나 턴이 바뀌었으면 새 손패예요 (0086)
    const handPrev = this.session && this.handPrev?.session === this.session ? this.handPrev : undefined;
    const turn = this.vm.order.head?.turn;
    this.hand = createHand(this, this.vm.hand, {
      prev: handPrev?.snap, deal: !!this.session && (!handPrev || handPrev.turn !== turn),
      lift: this.lift ? LIFT_STYLES[this.lift] : undefined,
      onPress: (key, p) => {
        if (p.rightButtonDown() || !this.vm.plays[key] || this.pick) return;
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
    if (this.session) this.handPrev = { session: this.session, snap: this.hand.snap, turn };
    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.move(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.release(p));
    this.input.keyboard?.on("keydown-ESC", () => this.cancel());
    this.begin();
    this.showGuide();
    if (this.vm.pick && !this.playback) this.pick = createPick(this, this.vm.pick, (keys) => this.picked(keys));
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
      if (this.held !== this.dragging) audioOf(this)?.play("card.pick");
      this.held = null;
      this.hand.startDrag(this.dragging);
      this.showHover(null);
    }
    this.refresh(p);
    this.hoverUnit(p.x, p.y);
    this.quietGuide(p.x, p.y);
  }

  // ── 첫 판 안내 (0088): 짚을 곳 둘레에 테 하나. 그 자리를 가리키거나 카드를 집은 동안, 재생 · 고르기 창 중에는 쉬어요 ──

  private showGuide() {
    this.guideFx?.destroy();
    this.guideFx = null;
    this.guideBoxes = [];
    this.guideArmed = false;
    this.guideCharge = false;
    const b = this.session?.battle;
    if (!b || !this.guide || this.playback || this.pick) return;
    const charging = b.enemies.filter((e) => !e.dead && e.charging);
    const step = guideStep({ turn: b.turn, placed: b.playedThisTurn.length > 0, charging: charging.length > 0, spent: !Object.keys(this.vm.plays).length }, this.guide);
    if (!step) return;
    this.guideCharge = step === "charge";
    const hand = handBoxes(this.vm.hand);
    if (step === "place") this.guideBoxes = hand.groups;
    else if (step === "end") this.guideBoxes = [{ x: END.x, y: END.y, w: END.w, h: END.button.h, radius: END.button.radius }];
    else {
      // 차징 중인 적의 의도 알약, 손에 브레이크 카드가 있으면 그 카드도 같은 테로
      const alive = b.enemies.filter((e) => !e.dead);
      for (const u of this.units) {
        const box = u.ref.side === "enemy" && alive[u.ref.i]?.charging ? u.view.intentBox : undefined;
        if (box) this.guideBoxes.push({ ...box, radius: INTENT.radius });
      }
      for (const c of b.hand) {
        const box = b.cardDefOf(c).effects.some((o) => o.op === "ram" || o.op === "breakCharging") ? hand.cards.get(cardKey(c)) : undefined;
        if (box) this.guideBoxes.push(box);
      }
    }
    this.guideFx = drawGuide(this, this.guideBoxes);
    this.quietGuide(this.input.activePointer.x, this.input.activePointer.y);
  }

  private quietGuide(x: number, y: number) {
    if (!this.guideFx) return;
    const busy = !!(this.dragging || this.held || this.press);
    if (!busy && this.guideCharge && this.unitAt(x, y)?.side !== "enemy") this.guideArmed = true;
    this.guideFx.setVisible(!busy && !this.guideBoxes.some((b) => inside(b, x, y)));
  }

  /** 고르기 창에서 고름: 낙하는 받고, 품기는 품고 턴 끝 처리를 이어 가요 */
  private picked(keys: string[]) {
    const s = this.session;
    const kind = this.vm.pick?.kind;
    if (!s || !kind) return console.info("[battle] 고르기", keys);
    s.dispatch(kind === "fall" ? { kind: "fall", cards: keys } : { kind: "hold", uids: keys.map(cardUid) });
    this.settle();
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

  // ── 순서표 토큰 가리킴 (0038): 얼굴 원에 흰 테 + 토큰 아래 유리 말풍선. 적 토큰이면 그 적을 가리킨 것과 같은 강조 ──
  private orderHits: OrderHit[] = [];
  private orderHover: OrderHit | null = null;
  private orderFx: Phaser.GameObjects.Container | null = null;

  private hoverOrder(x: number, y: number): boolean {
    const hit = this.orderHits.find((h) => inside(h, x, y)) ?? null;
    if (hit === this.orderHover) return !!hit;
    this.orderFx?.destroy();
    this.orderFx = null;
    this.orderHover = hit;
    if (!hit) return false;
    const slot = hit.kind === "enemy" ? this.vm.order.slots[hit.slot] : undefined;
    const token = hit.kind === "ally" ? this.vm.order.bundles?.[hit.bundle]?.[hit.i] : undefined;
    const band = hit.kind === "band" ? hit.band : undefined;
    const owner = slot?.enemy ?? band?.enemy;
    this.showHover(owner === undefined || owner < 0 ? null : { side: "enemy", i: owner });
    // 풀이는 토큰 아래 말풍선 하나만: 유닛 아래 풀이는 지우고 강조만 남겨요
    this.hoverTip?.destroy();
    this.hoverTip = null;
    const tip = token?.tip ?? slot?.tip ?? band?.tip;
    this.orderFx = gather(this, 0, 0, () => {
      const ring = drawOrderRing(this, hit);
      // 같은 적의 다른 토큰도 함께 밝혀요 (0074)
      if (slot?.enemy !== undefined) {
        for (const h of this.orderHits) {
          if (h !== hit && h.kind === "enemy" && this.vm.order.slots[h.slot]?.enemy === slot.enemy) drawOrderRing(this, h, true);
        }
      }
      if (!tip) return;
      // 화면 밖으로 나가면 말풍선만 안쪽으로 밀어요
      const left = Math.max(SYS.right, Math.min(FRAME.w - SYS.right - GLASS.w, ring.cx - GLASS.w / 2));
      drawTooltip(this, {
        skin: GLASS, at: { left, top: ring.bottom + SYS.gap },
        // 결과 먼저 (0074 9번): 이름 + 종류 칩 → 결과 → 효과문 → 순서 · 상태 칩
        content: [
          { kind: "title", text: tip.title, tag: tip.kind },
          ...(tip.result ? [{ kind: "result" as const, ...tip.result }] : []),
          { kind: "text", role: "body", text: tip.text },
          ...(tip.chips?.length ? [{ kind: "chips" as const, items: tip.chips }] : []),
        ],
      });
    });
    this.fieldLayer.add(this.orderFx);
    return true;
  }

  private hoverUnit(x: number, y: number) {
    if (this.dragging || this.held || this.press || this.pick?.shown) return;
    if (this.hoverOrder(x, y)) return;
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
    // 차징 중인 적을 가리켜 풀이를 봤으면 다음 차례로 넘어가요 (0088)
    if (this.guide && !this.guide.charge && ref?.side === "enemy" && this.guideArmed && this.session?.battle.enemies.filter((e) => !e.dead)[ref.i]?.charging) {
      this.guide.charge = true;
      this.showGuide();
    }
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
    if (this.pick) {
      // "필드 보기"를 누르다 떼면 창이 돌아와요
      if (!this.pick.shown) {
        this.showHover(null);
        this.pick.show();
      }
      return;
    }
    if (p.rightButtonReleased()) return this.cancel();
    const over = this.overAt(p.x, p.y);
    if (this.dragging) {
      const card = this.dragging;
      const f = this.focus(card, over);
      this.dragging = null;
      this.press = null;
      this.hand.endDrag();
      if (f.ready) this.play(card, f.ready.target);
      else audioOf(this)?.play("card.place");
      this.showField(null);
      return;
    }
    if (this.press) {
      // 끌지 않고 뗐으면 클릭: 집기 / 같은 카드면 내려놓기 / 다른 카드면 바꿔 집기
      const key = this.press.key;
      this.press = null;
      this.held = this.held === key ? null : key;
      audioOf(this)?.play(this.held ? "card.pick" : "card.place");
      this.hand.setHeld(this.held);
      return;
    }
    if (this.held && over !== "hand") {
      // 집은 상태에서 필드 클릭: 낼 수 있으면 내고, 어느 쪽이든 내려놓아요
      const card = this.held;
      const f = this.focus(card, over);
      if (f.ready) this.play(card, f.ready.target);
      else audioOf(this)?.play("card.place");
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

  /** 카드 내기: 세션에 명령을 보내고 바뀐 상태로 다시 그려요. 고정 장면이면 기록만 해요 */
  private play(card: string, target?: UnitRef) {
    const s = this.session;
    if (!s) return console.info("[battle] 카드 사용", card, target ?? "(대상 고르기 없음)");
    const release = releaseId(card);
    audioOf(this)?.play("card.play");
    const events = s.dispatch(release ? { kind: "release", id: release } : { kind: "play", uid: cardUid(card), target: refOf(s.battle, target) });
    for (const id of cuesOf(events)) audioOf(this)?.play(id);
    if (events.length || !s.over) this.settle();
  }

  private endTurn() {
    const s = this.session;
    if (!s || this.dragging || this.playback || this.pick) return;
    const cast = { allies: s.battle.spirits.map((x) => x.id), enemies: s.battle.enemies.filter((e) => !e.dead).map((e) => e.uid) };
    const events = s.dispatch({ kind: "endTurn" });
    const frames = playbackFrames(this.vm, cast, events);
    this.scene.restart({ session: s, onOver: this.onOver, onDeck: this.onDeck, place: this.place, guide: this.guide, playback: frames, cues: playbackCues(events) } satisfies BattleSceneData);
  }

  /** 재생: 다음 장면으로. 남은 장면이 없으면 확정된 상태로 */
  private step() {
    const rest = this.playback?.slice(1) ?? [];
    if (!rest.length) return this.settle();
    this.scene.restart({ session: this.session, onOver: this.onOver, onDeck: this.onDeck, place: this.place, guide: this.guide, playback: rest, cues: this.cues?.slice(1) } satisfies BattleSceneData);
  }

  /**
   * 명령 뒤: 확정된 상태로 다시 그려요. 턴 종료는 재생(playback.ts)을 거쳐 여기로 와요.
   * 전투가 끝났으면 바로 나가요.
   */
  private settle() {
    if (this.session?.over) return this.onOver?.(this);
    this.scene.restart({ session: this.session, onOver: this.onOver, onDeck: this.onDeck, place: this.place, guide: this.guide } satisfies BattleSceneData);
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
    const actors: UnitActor[] = [];
    const unit = (ref: UnitRef, draw: () => UnitView) => {
      let view!: UnitView;
      const c = gather(this, 0, 0, () => { view = draw(); });
      if (f && dimmed(f, ref)) darken(c, TARGETING.dim);
      if (!f) actors.push({ ref, view, root: c });
    };
    const cutOrders = new Set(this.vm.enemies.filter((_, i) => o?.enemies[i]?.cut).flatMap((e) => (e.intent?.order !== undefined ? [e.intent.order] : [])));
    const root = gather(this, 0, 0, () => {
      // 든 카드: 들어갈 자리에 흰 점선 토큰, 끊을 적은 배지가 브레이크 기호로 (0074)
      const held = card ? this.vm.plays[card]?.slot : undefined;
      const bundles = held && this.vm.order.bundles
        ? this.vm.order.bundles.map((l, k) => (k === held.bundle ? [...l.slice(0, held.i), held.token, ...l.slice(held.i)] : l))
        : this.vm.order.bundles;
      const order = drawOrder(this, {
        ...this.vm.order, bundles, bands: held?.bands ?? this.vm.order.bands,
        slots: this.vm.order.slots.map((s) => (cutOrders.has(s.n) ? { ...s, cut: "plan" as const } : s)),
      });
      if (!f) {
        this.orderHits = order.hits;
        // 앞 장면의 토큰 자리에서 이어 움직여요 (0077). 다른 전투의 표와는 잇지 않아요
        const prev = this.orderPrev;
        if (prev && prev.session === this.session) playOrderMotion(this, prev.snap, order.marks, order.cursor);
        this.orderPrev = { session: this.session, snap: snapshotOrder(order.marks, order.cursor) };
      }
      this.vm.allies.forEach((a, i) => {
        const ref = { side: "ally", i } as const;
        unit(ref, () => {
          const v = drawAlly(this, a, i, { outcome: o?.incoming[i], lit: lit(ref) });
          if (!f) this.rested(ref, v);
          return v;
        });
      });
      this.vm.enemies.forEach((e, i) => {
        const ref = { side: "enemy", i } as const;
        unit(ref, () => {
          const v = drawEnemy(this, e, i, { outcome: o?.enemies[i], lit: lit(ref), weakOn: !!element && element === e.weakTo });
          if (!f) this.rested(ref, v);
          return v;
        });
      });
    });
    this.fieldLayer.add(root);
    root.setVisible(!f);
    // 재생 중 유닛 반응: 알약 · 잔상은 필드 맨 위에 (0086)
    if (!f && this.playback) {
      const fx = this.add.container(0, 0);
      this.fieldLayer.add(fx);
      playUnitMotion(this, this.vm, actors, fx);
    }
    return root;
  }
}

const same = (a: UnitRef | null, b: UnitRef | null) => a === b || (!!a && !!b && a.side === b.side && a.i === b.i);
const inside = (b: UnitBounds, x: number, y: number) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
