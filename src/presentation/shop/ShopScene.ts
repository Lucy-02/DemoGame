// 상점 화면 (0046 뼈대 + 0050 격자: 카드 3×2, 오른쪽에 빼기·치료 칸). 왼쪽에서 고르고 오른쪽 정령 줄에서 받아요.
// 카드에 올리면 배울 수 있는 줄의 칸이 밝아지고 그 카드가 쓰는 능력치가 켜져요. 배울 정령이 하나면 누르는 즉시 사고,
// 여럿이면 카드를 집은 다음 줄을 눌러 정해요(집은 카드를 다시 누르거나 빈 곳을 누르면 내려놓아요).
// 지금은 씨앗을 정한 런 위의 고정 장면이에요. 지도에 연결하면 onLeave로 나가요.
import * as Phaser from "phaser";
import { ShopSession } from "../../session/shop";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import type { CardVM } from "../card/viewmodel";
import { drawBackdrop } from "../run/backdrop";
import { cardWithFace, drawCardTip } from "../run/cards";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane, type LaneState } from "../run/lanes";
import { CARD_FOCUS, FRAME } from "../run/layout";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { adjustColor } from "../style/opacity";
import { shopSession } from "./fixtures";
import { shopVM } from "./fromShop";
import { STOCK } from "./layout";
import { SERVICE_ICONS, drawLeave, drawPrice, drawService } from "./views/services";

export const SHOP_SCENE = "shop";

export interface ShopSceneData {
  /** 고정 장면 이름 (fixtures SHOPS). 세션을 주면 무시해요 */
  scene?: string;
  session?: ShopSession;
  /** 시각 검증용: 이 카드(key)를 집은 상태, 또는 "heal"에 올린 상태 */
  hover?: string;
  /** 떠나기를 누르면 불려요 (지도 연결용) */
  onLeave?: () => void;
}

type Hover = { kind: "card"; slot: number } | { kind: "lane"; id: string } | { kind: "heal" };

export class ShopScene extends Phaser.Scene {
  private session!: ShopSession;
  private hover?: Hover;
  /** 집은 카드 칸 (배울 정령을 고르는 중) */
  private held?: number;
  /** 이번 상점에서 줄마다 마지막으로 산 카드 (칸에 남겨 보여요) */
  private got = new Map<string, CardVM>();
  private onLeave?: () => void;
  private dirty = false;

  constructor() {
    super(SHOP_SCENE);
  }

  init(data: ShopSceneData) {
    this.session = data.session ?? shopSession(data.scene);
    this.onLeave = data.onLeave;
    this.got.clear();
    this.hover = data.hover === "heal" ? { kind: "heal" } : undefined;
    const slot = this.session.offers.findIndex((o) => o.card.id === data.hover);
    this.held = slot < 0 ? undefined : slot;
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ...GOLD_ICONS, ...SERVICE_ICONS]) loadIcon(this, id, w);
    const vm = shopVM(this.session);
    for (const c of vm.cards) if (c) preloadHandCard(this, c.card, { showRarity: true, scale: STOCK.scale });
    preloadSpiritArt(this, vm.lanes.map((l) => l.id));
  }

  create() {
    const off = this.session.onChange(() => this.redraw());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.input.setPollAlways();
    this.paint();
    Object.assign(window, { __screenReady: SHOP_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private redraw() {
    this.dirty = true;
  }

  private setHover(h?: Hover) {
    const same = (a?: Hover, b?: Hover) => a?.kind === b?.kind && (a as { slot?: number })?.slot === (b as { slot?: number })?.slot
      && (a as { id?: string })?.id === (b as { id?: string })?.id;
    if (same(this.hover, h)) return;
    this.hover = h;
    this.redraw();
  }

  private leaveHover(h: Hover) {
    if (this.hover?.kind !== h.kind) return;
    if (h.kind === "card" && (this.hover as { slot: number }).slot !== h.slot) return;
    if (h.kind === "lane" && (this.hover as { id: string }).id !== h.id) return;
    this.setHover(undefined);
  }

  private buy(slot: number, spirit: string, card: CardVM) {
    if (!this.session.canBuy(slot)) return;
    this.got.set(spirit, card);
    this.held = undefined;
    this.hover = undefined;
    this.session.dispatch({ kind: "buy", slot, spirit });
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const vm = shopVM(this.session);
    const { hover } = this;
    if (this.held !== undefined && !vm.cards[this.held]?.affordable) this.held = undefined;
    const held = this.held;
    const focusSlot = held ?? (hover?.kind === "card" ? hover.slot : undefined);
    const focus = focusSlot === undefined ? undefined : vm.cards[focusSlot];
    const healing = hover?.kind === "heal" && vm.heal.enabled;

    drawBackdrop(this);
    // 빈 곳을 누르면 집은 카드를 내려놓아요 (맨 아래에 깔아서 다른 입력이 먼저 받아요)
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => {
      if (this.held === undefined) return;
      this.held = undefined;
      this.redraw();
    });

    const spend = focus?.affordable ? focus.price : healing ? vm.heal.price : undefined;
    drawGold(this, vm.gold - (spend ?? 0), spend === undefined ? {} : { was: vm.gold });

    // 정령 줄
    vm.lanes.forEach((l, i) => {
      const st: LaneState = {};
      const learner = !!focus && focus.learners.includes(l.id);
      if (focus && focusSlot !== undefined && learner) {
        const only = focus.learners.length === 1;
        const pointed = only || (hover?.kind === "lane" && hover.id === l.id);
        st.stat = focus.stat;
        st.open = true;
        if (pointed && focus.affordable) {
          const mini = cardWithFace(this, focus.card, l);
          st.hot = true;
          st.card = { vm: mini, hot: true };
          st.deckTo = (l.deck ?? 0) + 1;
        }
        if (held !== undefined) {
          const mini = cardWithFace(this, focus.card, l);
          st.on = {
            click: () => this.buy(focusSlot, l.id, mini),
            over: () => this.setHover({ kind: "lane", id: l.id }),
            out: () => this.leaveHover({ kind: "lane", id: l.id }),
          };
        }
      } else if (!focus) {
        const last = this.got.get(l.id);
        if (last) st.card = { vm: last, hot: false };
        if (healing) st.heal = vm.heal.gain[l.id];
      }
      drawLane(this, l, i, st);
    });

    // 진열 카드 3×2
    vm.cards.forEach((c, slot) => {
      if (!c) return;
      const x = STOCK.x + (slot % STOCK.cols) * (STOCK.w + STOCK.gap);
      const y = STOCK.rows[Math.floor(slot / STOCK.cols)];
      const owner = c.learners.length === 1 ? vm.lanes.find((l) => l.id === c.learners[0]) : undefined;
      const card = cardWithFace(this, c.card, owner, STOCK.scale);
      const view = createHandCard(this, card, x + (STOCK.w - HAND_CARD.w) / 2, y + STOCK.h - HAND_CARD.h, { showRarity: true, scale: STOCK.scale });
      const on = focusSlot === slot;
      const dim = focusSlot !== undefined && !on;
      view.setHeld(on);
      view.setLifted(on);
      if (!c.affordable) adjustColor(view.root, { grayscale: STOCK.poor.grayscale });
      if (dim) view.opacity = CARD_FOCUS.dim;
      drawPrice(this, c.price, c.affordable, x, y, dim && c.affordable ? CARD_FOCUS.dim : 1);
      this.add.zone(x, y, STOCK.w, STOCK.h).setOrigin(0, 0).setInteractive({ useHandCursor: c.affordable })
        .on("pointerover", () => this.setHover({ kind: "card", slot }))
        .on("pointerout", () => this.leaveHover({ kind: "card", slot }))
        .on("pointerup", (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
          e.stopPropagation();
          if (!c.affordable) return;
          if (c.learners.length === 1) {
            const lane = vm.lanes.find((l) => l.id === c.learners[0]);
            this.buy(slot, c.learners[0], cardWithFace(this, c.card, lane));
            return;
          }
          this.held = this.held === slot ? undefined : slot;
          this.redraw();
        });
      if (on) drawCardTip(this, card, x, y, STOCK.w);
    });

    drawService(this, "remove", vm.remove, false);
    drawService(this, "heal", vm.heal, healing, {
      over: () => this.setHover({ kind: "heal" }),
      out: () => this.leaveHover({ kind: "heal" }),
      click: () => {
        this.hover = undefined;
        this.session.dispatch({ kind: "heal" });
      },
    });
    drawLeave(this, () => this.onLeave?.());
  }
}
