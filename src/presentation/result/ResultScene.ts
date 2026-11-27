// 전투 결과 (0044 배치 + 0050 표현 + 0051 보상 구조). 전투 무대 위에 뜨는 창 하나예요 (라운드 X1): 왼쪽에 골드·보상 카드·넘기기, 오른쪽에 정령 줄.
// 줄 자리는 런 화면 격자 그대로 쓰고, 창이 화면 가운데에 오도록 카메라만 옮겨요.
// 카드에 올리면 주인 줄이 밝아지고 칸에 카드가 비쳐 보여요. 누르면 그 줄로 들어가요(전투 보상은 주인 고정, 0040).
// 배울 정령이 여럿인 카드(이벤트)는 카드를 집은 뒤 줄을 눌러 정해요.
// 정예 보상은 카드 아래 장비 줄이 처음부터 보이고, 카드를 받거나 넘긴 뒤에 장비를 누구에게 줄지 골라요 (0051 · 0064 Q2-A).
// 받을 수 있는 칸이 점선으로 밝아지고, 줄이나 칸에 올리면 장비가 비쳐 보이며 달라지는 것은 줄 왼쪽 말풍선에 나와요.
// 세션을 주면 런에 연결돼요: 고르는 즉시 규칙에 적용하고 onDone으로 나가요. 세션이 없으면 고정 장면이에요.
import { bindMenuKey } from "../menu/hooks";
import { MOVE, crossPaint, fadeAway, fadeInScene, reducedMotion } from "../style/motion";
import * as Phaser from "phaser";
import type { RewardSession } from "../../session/reward";
import { createBigCard, preloadBigCard } from "../card/BigCard";
import { preloadHandCard } from "../card/HandCard";
import { drawBackdrop as drawStage } from "../battle/views/backdrop";
import { cardWithFace, drawCardNote } from "../run/cards";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { preloadEquipArt } from "../run/equip";
import { LANE_ICONS, drawLane, slotAt, type LaneState } from "../run/lanes";
import { EQUIP_SLOT, FRAME, LANE } from "../run/layout";
import { STAT_IDS } from "../run/viewmodel";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { audioOf } from "../audio";
import { DEFAULT_RESULT, RESULTS } from "./fixtures";
import { resultVM } from "./fromReward";
import { EQUIP_TIP, REROLL, REWARD, SKIP, STRIP, placeResult } from "./layout";
import type { EquipOptionVM, ResultVM } from "./viewmodel";
import { EQUIP_ICONS, drawEquipStrip, drawEquipTip } from "./views/equip";
import { REWARD_ICONS, drawReroll, drawSkip } from "./views/reward";
import { drawWindow } from "./views/window";

export const RESULT_SCENE = "result";

/** 받은 것: 카드 번호와 배운 정령, 또는 넘기기 */
export type ResultChoice = { card: number; spirit: string } | "skip";

export interface ResultSceneData {
  /** 런에 연결된 보상. 주면 고정 장면 대신 이걸 그려요 */
  session?: RewardSession;
  /** 고정 장면 이름 (fixtures RESULTS) */
  scene?: string;
  /** 시각 검증용: 이 카드(key)에 올린 상태, 또는 "skip" · "reroll"(다시 뽑기) · "strip"(장비 줄) · "equip:<정령 id>:<칸>"(장비를 줄 칸) */
  hover?: string;
  /** 시각 검증용: 이 카드(key)를 받은 상태, 또는 "skip" */
  taken?: string;
  /** 싸우던 장면 위에 띄웠어요 (그 장면이 아래에 멈춰 있음). 아니면 빈 전투 무대를 깔아요 */
  over?: boolean;
  /** 다 고른 뒤에 불려요. 이 장면을 넘겨받아 다음 장면으로 넘어가요 */
  onDone?: (scene: Phaser.Scene) => void;
}

type Hover =
  | { kind: "card"; i: number } | { kind: "lane"; id: string } | { kind: "skip" } | { kind: "reroll" }
  /** 장비 줄 / 정령 id의 i번째 칸 */
  | { kind: "strip" } | { kind: "equip"; id: string; i: number };
const sameHover = (a?: Hover, b?: Hover) =>
  a?.kind === b?.kind && (a as { i?: number })?.i === (b as { i?: number })?.i && (a as { id?: string })?.id === (b as { id?: string })?.id;

export class ResultScene extends Phaser.Scene {
  private session?: RewardSession;
  private vm!: ResultVM;
  private hover?: Hover;
  /** 방금 받은 카드 (다음에 그릴 때 진열에서 흐려져 빠져요) */
  private leaving?: number;
  /** 집은 카드 (배울 정령을 고르는 중) */
  private held?: number;
  private taken?: ResultChoice;
  /** 장비를 받은 정령, 또는 넘김 */
  private equipDone?: { spirit: string } | "skip";
  private onDone?: (scene: Phaser.Scene) => void;
  private over = false;
  /** 입력 처리 중에 지우면 안 돼서, 다시 그리기는 다음 update에서 해요 */
  private dirty = false;

  constructor() {
    super(RESULT_SCENE);
  }

  init(data: ResultSceneData) {
    this.session = data.session;
    this.vm = data.session ? resultVM(data.session) : RESULTS[data.scene ?? DEFAULT_RESULT] ?? RESULTS[DEFAULT_RESULT];
    const card = (key?: string) => {
      const i = this.vm.cards.findIndex((c) => c.card.key === key);
      return i < 0 ? undefined : i;
    };
    const hovered = card(data.hover);
    const [what, spirit, slot] = (data.hover ?? "").split(":");
    this.hover = data.hover === "skip" ? { kind: "skip" }
      : data.hover === "reroll" ? { kind: "reroll" }
      : data.hover === "strip" ? { kind: "strip" }
      : what === "equip" && spirit ? { kind: "equip", id: spirit, i: Number(slot ?? 0) }
      : hovered === undefined ? undefined : { kind: "card", i: hovered };
    const took = card(data.taken);
    this.taken = data.taken === "skip" ? "skip" : took === undefined ? undefined : { card: took, spirit: this.vm.cards[took].owners[0] };
    this.held = undefined;
    this.equipDone = undefined;
    this.onDone = data.onDone;
    this.input.enabled = true;
    this.over = !!data.over;
    this.dirty = false;
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ...GOLD_ICONS, ...REWARD_ICONS, ...EQUIP_ICONS]) loadIcon(this, id, w);
    for (const c of this.vm.cards) preloadBigCard(this, c.card);
    const options = [...Object.values(this.vm.equip?.takers ?? {}).flat(), ...(this.vm.equip ? [{ tip: this.vm.equip.tip }] : [])];
    for (const o of options) {
      if (o.tip.sheet.card) preloadHandCard(this, o.tip.sheet.card.vm);
    }
    preloadEquipArt(this, [
      ...(this.vm.equip ? [this.vm.equip.item.id] : []),
      ...this.vm.lanes.flatMap((l) => l.slots.flatMap((e) => (e ? [e.id] : []))),
    ]);
    preloadSpiritArt(this, this.vm.lanes.map((l) => l.id));
  }

  create() {
    // 다시 그리면 입력 대상이 새로 생겨요. 마우스를 움직이지 않아도 그 위의 상태를 유지해요
    this.input.setPollAlways();
    this.paint();
    bindMenuKey(this);
    // 전투 위에 뜨는 창은 흐리게 나타나요 (0086)
    if (this.over) fadeInScene(this);
    Object.assign(window, { __screenReady: RESULT_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    // 호버 · 누름으로 다시 그릴 때 앞 모습이 흐려지며 바뀌어요 (0092)
    crossPaint(this, () => this.paint());
  }

  /** 지금 고를 차례인 것 (0051: 카드 먼저, 장비 다음, 한 번에 하나만) */
  private get phase(): "cards" | "equip" | "done" {
    if (this.taken === undefined) return "cards";
    return this.vm.equip && this.equipDone === undefined ? "equip" : "done";
  }

  private setHover(h?: Hover) {
    if (this.phase === "done" || sameHover(this.hover, h)) return;
    this.hover = h;
    this.dirty = true;
  }

  private leaveHover(h: Hover) {
    if (sameHover(this.hover, h)) this.setHover(undefined);
  }

  private take(choice: ResultChoice) {
    if (this.taken !== undefined) return;
    if (this.session) {
      const ok = this.session.dispatch(choice === "skip"
        ? { kind: "skip" }
        : { kind: "take", cardId: this.vm.cards[choice.card].card.key, spirit: choice.spirit });
      if (!ok) return;
    }
    this.taken = choice;
    this.hover = undefined;
    this.held = undefined;
    this.dirty = true;
    // 받은 카드는 진열에서 흐려져 빠지고 정령 줄 칸에 놓여요. 그 한 박자를 보고 넘어가요 (0089)
    this.leaving = choice === "skip" ? undefined : choice.card;
    if (this.phase !== "done") return;
    if (this.leaving === undefined || reducedMotion()) return this.onDone?.(this);
    // 머무는 동안에는 입력을 받지 않아요
    this.input.enabled = false;
    this.time.delayedCall(MOVE.duration, () => this.onDone?.(this));
  }

  /** 보상 카드를 통째로 새로 받아요 (0157 · 0171). 새 카드 그림을 읽는 동안에는 입력을 받지 않아요. 고정 장면은 그대로예요 */
  private reroll() {
    if (this.phase !== "cards" || !this.vm.reroll?.left || !this.session?.dispatch({ kind: "reroll" })) return;
    this.vm = resultVM(this.session);
    this.held = undefined;
    // 새로 뽑을 카드가 없으면 넘긴 것과 같아요
    if (this.session.phase !== "cards") this.taken = "skip";
    for (const c of this.vm.cards) preloadBigCard(this, c.card);
    const go = () => {
      this.input.enabled = true;
      this.dirty = true;
      if (this.phase === "done") this.onDone?.(this);
    };
    if (!this.load.list.size) return go();
    this.input.enabled = false;
    // 못 읽은 그림이 있어도 넘어가요 (그 그림만 빠져요)
    this.load.once(Phaser.Loader.Events.COMPLETE, go);
    this.load.start();
  }

  /** 장비를 이 정령에게 줘요. option = 들어갈 칸 (꽉 찼으면 그 칸의 장비를 내려놓아요) */
  private giveEquip(spirit: string, option: EquipOptionVM) {
    if (this.phase !== "equip") return;
    if (this.session && !this.session.dispatch({ kind: "equip", spirit, replace: option.replace })) return;
    audioOf(this)?.play("equip");
    this.vm = { ...this.vm, lanes: this.vm.lanes.map((l) => (l.id === spirit ? option.after : l)) };
    this.finishEquip({ spirit });
  }

  private skipEquip() {
    if (this.phase !== "equip" || !this.vm.equip?.canSkip) return;
    if (this.session && !this.session.dispatch({ kind: "skipEquip" })) return;
    this.finishEquip("skip");
  }

  private finishEquip(done: { spirit: string } | "skip") {
    this.equipDone = done;
    this.hover = undefined;
    this.dirty = true;
    this.onDone?.(this);
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const { vm, hover, taken, held, phase } = this;
    const done = taken !== undefined;
    const equip = phase === "equip" ? vm.equip : undefined;
    /** 말풍선은 다 그린 뒤 맨 위에 올려요 */
    let tip: (() => void) | undefined;
    const lane = (id?: string) => vm.lanes.find((l) => l.id === id);
    const at = placeResult(vm.lanes.length, !!vm.equip);
    /** 정령 줄 말풍선이 가리면 안 되는 장비 줄 (주는 수치가 여기 보여요) */
    const strip = { top: at.stripY, bottom: at.stripY + STRIP.h };
    this.cameras.main.setScroll(at.scroll.x, at.scroll.y);
    if (!this.over) drawStage(this).setScrollFactor(0);
    drawWindow(this, at.win);
    // 빈 곳을 누르면 집은 카드를 내려놓아요 (맨 아래에 깔아서 다른 입력이 먼저 받아요)
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setScrollFactor(0).setInteractive().on("pointerup", () => {
      if (this.held === undefined) return;
      this.held = undefined;
      this.dirty = true;
    });

    // 세션에 연결되면 받은 골드는 이미 런 값에 들어 있어요. 고정 장면은 넘긴 뒤 값을 여기서 더해요
    const skipped = taken === "skip";
    const skipHover = hover?.kind === "skip" && phase === "cards";
    const total = vm.gold.total + (skipped && !this.session ? vm.skipGold ?? 0 : 0);
    const plus = skipHover && vm.skipGold !== undefined ? `+${vm.skipGold}` : !done && vm.gold.gained ? `+${vm.gold.gained}` : undefined;
    drawGold(this, total, { plus }, { x: at.col.x, y: at.goldY });

    const focusI = done ? undefined : held ?? (hover?.kind === "card" ? hover.i : undefined);
    const focus = focusI === undefined ? undefined : vm.cards[focusI];
    const got = taken !== undefined && taken !== "skip" ? taken : undefined;

    vm.lanes.forEach((l, i) => {
      // 빈 카드 칸은 카드를 고르는 동안에만 보여요
      const st: LaneState = { noSocket: done };
      if (got?.spirit === l.id) {
        st.card = { vm: cardWithFace(this, vm.cards[got.card].card, l), hot: false };
      } else if (focus && focusI !== undefined && focus.owners.includes(l.id)) {
        const only = focus.owners.length === 1;
        const pointed = only || (hover?.kind === "lane" && hover.id === l.id);
        st.stat = focus.stat;
        st.open = !only;
        if (pointed) {
          st.hot = true;
          st.card = { vm: cardWithFace(this, focus.card, l), hot: true };
        }
        if (held !== undefined) {
          st.on = {
            click: () => this.take({ card: focusI, spirit: l.id }),
            over: () => this.setHover({ kind: "lane", id: l.id }),
            out: () => this.leaveHover({ kind: "lane", id: l.id }),
          };
        }
      }
      if (equip) {
        const options = equip.takers[l.id];
        if (!options) st.dim = true;
        else {
          const over = hover?.kind === "equip" && hover.id === l.id ? options.find((o) => o.slot === hover.i)
            : hover?.kind === "lane" && hover.id === l.id ? options[0] : undefined;
          st.equip = {
            slots: Object.fromEntries(options.map((o) => [o.slot, {
              click: () => this.giveEquip(l.id, o),
              over: () => this.setHover({ kind: "equip", id: l.id, i: o.slot }),
              out: () => this.leaveHover({ kind: "equip", id: l.id, i: o.slot }),
            }])),
          };
          // 줄 어디를 눌러도 받아요. 꽉 차서 내려놓을 칸이 여럿이면 칸을 눌러 정해요
          st.on = {
            click: options.length === 1 ? () => this.giveEquip(l.id, options[0]) : undefined,
            over: () => this.setHover({ kind: "lane", id: l.id }),
            out: () => this.leaveHover({ kind: "lane", id: l.id }),
          };
          if (over) {
            st.hot = true;
            st.equip.ghost = { slot: over.slot, item: over.tip.sheet.item, drop: over.tip.drop?.item, hot: true };
            st.equip.delta = Object.fromEntries(STAT_IDS.map((k) => [k, over.after.stats[k] - l.stats[k]]).filter(([, d]) => d !== 0));
            if (over.after.maxHp !== l.maxHp) st.equip.maxHpTo = over.after.maxHp;
            const at = slotAt(i, l.slots.length, over.slot);
            tip = () => drawEquipTip(this, over.tip, { kind: "lane", right: LANE.x - EQUIP_TIP.gapToLane, pointY: at.y + EQUIP_SLOT.size / 2, avoid: strip }, l);
          }
        }
      }
      drawLane(this, l, i, st);
    });

    if (vm.equip && phase !== "done") {
      const offer = vm.equip;
      drawEquipStrip(this, offer, phase === "equip", { x: at.col.x, y: at.stripY, w: at.col.w }, {
        over: () => this.setHover({ kind: "strip" }),
        out: () => this.leaveHover({ kind: "strip" }),
      });
      if (hover?.kind === "strip") tip = () => drawEquipTip(this, offer.tip, { kind: "below", right: at.col.x + at.col.w, top: at.stripY + STRIP.h + EQUIP_TIP.belowStrip });
    }

    // 보상 카드: 왼→오 = 줄 위→아래
    const leaving = this.leaving;
    this.leaving = undefined;
    vm.cards.forEach((c, i) => {
      if (got?.card === i && leaving !== i) return;
      const x = at.col.x + i * (REWARD.w + REWARD.gap), y = at.cardsY;
      const card = cardWithFace(this, c.card, c.owners.length === 1 ? lane(c.owners[0]) : undefined);
      const view = createBigCard(this, card, x, y);
      if (got?.card === i) return fadeAway(this, view);
      const on = focusI === i;
      view.setHeld(on);
      if (done) view.opacity = REWARD.sunk;
      else if (focusI !== undefined && !on) view.opacity = REWARD.dim;
      if (done) return;
      this.add.zone(x, y, REWARD.w, REWARD.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.setHover({ kind: "card", i }))
        .on("pointerout", () => this.leaveHover({ kind: "card", i }))
        .on("pointerup", (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
          e.stopPropagation();
          if (c.owners.length === 1) return this.take({ card: i, spirit: c.owners[0] });
          this.held = this.held === i ? undefined : i;
          this.dirty = true;
        });
      // 큰 얼굴이 효과문을 보여 주니, 머물면 곁쪽지만 떠요 (0161)
      if (on) drawCardNote(this, card, x, y, REWARD.w);
    });

    if (!done) {
      drawSkip(this, vm.skipGold, skipHover, { x: at.col.x, y: at.skipY }, {
        over: () => this.setHover({ kind: "skip" }),
        out: () => this.leaveHover({ kind: "skip" }),
        click: () => this.take("skip"),
      });
      if (vm.reroll) {
        tip = drawReroll(this, vm.reroll.left, hover?.kind === "reroll", { x: at.col.x + SKIP.w + REROLL.gap, y: at.skipY }, {
          over: () => this.setHover({ kind: "reroll" }),
          out: () => this.leaveHover({ kind: "reroll" }),
          click: () => this.reroll(),
        }) ?? tip;
      }
    } else if (equip?.canSkip) {
      // 받을 정령이 모두 꽉 찼을 때만 장비를 넘길 수 있어요 (0056). 받는 것은 없어요
      drawSkip(this, undefined, hover?.kind === "skip", { x: at.col.x, y: at.skipY }, {
        over: () => this.setHover({ kind: "skip" }),
        out: () => this.leaveHover({ kind: "skip" }),
        click: () => this.skipEquip(),
      });
    }
    tip?.();
  }
}
