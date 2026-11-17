// 상점 화면 (0050 격자: 카드 3×2, 오른쪽에 빼기·치료 칸 + 0082: 오른쪽에 지도와 같은 얇은 정령 줄, 위 띠는 지도와 같은 자리).
// 카드에 올리면 배울 수 있는 줄이 점선 테로 밝아지고 그 카드가 쓰는 능력치 하나가 줄에 나와요. 배울 정령이 하나면 누르는 즉시 사고,
// 여럿이면 카드를 집은 다음 줄을 눌러 정해요(집은 카드를 다시 누르거나 빈 곳을 누르면 내려놓아요). 치료에 올리면 줄마다 HP a→b.
// 빼기 칸을 누르면 덱 고르기 창(0082)이 열려요: 카드를 고른 뒤 확인해야 빠져요(두 단계, 0046).
// 세션을 받으면 런에 연결되고(레거시 지도에서 열어요), 없으면 씨앗을 정한 런 위의 고정 장면이에요.
import type { CardVM } from "../card/viewmodel";
import { fadeAway } from "../style/motion";
import * as Phaser from "phaser";
import { ShopSession } from "../../session/shop";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { drawBackdrop } from "../run/backdrop";
import { cardWithFace, drawCardTip, drawCardTipBeside } from "../run/cards";
import { DECK_PICK_ICONS, drawDeckPick, drawQuietButton } from "../run/deckPick";
import { RUN_TOP_ICONS, drawRunTop } from "../run/topbar";
import { CARD_FOCUS, FRAME } from "../run/layout";
import { STAT_ICON } from "../run/copy";
import { drawSlimLane, type SlimState } from "../run/slimLane";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { adjustColor } from "../style/opacity";
import { shopSession } from "./fixtures";
import { shopVM } from "./fromShop";
import { SHOP_LANE, STOCK } from "./layout";
import { COPY } from "./copy";
import { SERVICE_ICONS, drawPrice, drawService } from "./views/services";
import type { ShopVM } from "./viewmodel";

export const SHOP_SCENE = "shop";

export interface ShopSceneData {
  /** 고정 장면 이름 (fixtures SHOPS). 세션을 주면 무시해요 */
  scene?: string;
  session?: ShopSession;
  /** 시각 검증용: 이 카드(key)를 집은 상태, "heal"에 올린 상태, "remove"(덱 펼침) 또는 "remove:<카드 key>"(그 카드를 고름) */
  hover?: string;
  /** 떠나기를 누르면 불려요 (지도 연결용) */
  onLeave?: (scene: Phaser.Scene) => void;
  /** 위 띠의 덱 버튼 */
  onDeck?: (scene: Phaser.Scene) => void;
}

type Hover = { kind: "card"; slot: number } | { kind: "lane"; id: string } | { kind: "heal" } | { kind: "remove" } | { kind: "deck"; uid: number };

export class ShopScene extends Phaser.Scene {
  private session!: ShopSession;
  private hover?: Hover;
  /** 방금 산 카드 (다음에 그릴 때 진열에서 흐려져 빠져요) */
  private leaving?: { slot: number; card: CardVM };
  /** 집은 카드 칸 (배울 정령을 고르는 중) */
  private held?: number;
  /** 빼기: 덱을 펼쳐 고르는 중 */
  private removing = false;
  /** 빼려고 고른 카드 (확인 전) */
  private pick?: number;
  private onLeave?: (scene: Phaser.Scene) => void;
  private onDeck?: (scene: Phaser.Scene) => void;
  private dirty = false;

  constructor() {
    super(SHOP_SCENE);
  }

  init(data: ShopSceneData) {
    this.session = data.session ?? shopSession(data.scene);
    this.onLeave = data.onLeave;
    this.onDeck = data.onDeck;
    this.hover = data.hover === "heal" ? { kind: "heal" } : undefined;
    const slot = this.session.offers.findIndex((o) => o.card.id === data.hover);
    this.held = slot < 0 ? undefined : slot;
    const [mode, key] = (data.hover ?? "").split(":");
    this.removing = mode === "remove" && this.session.canRemove();
    this.pick = this.removing && key ? this.session.run.deck.find((c) => c.cardId === key)?.uid : undefined;
  }

  preload() {
    for (const [id, w] of [...RUN_TOP_ICONS, ...SERVICE_ICONS, ...DECK_PICK_ICONS]) loadIcon(this, id, w);
    for (const id of Object.values(STAT_ICON)) loadIcon(this, id, SHOP_LANE.stat.icon);
    const vm = shopVM(this.session);
    for (const c of vm.cards) if (c) preloadHandCard(this, c.card, { showRarity: true, scale: STOCK.scale });
    for (const row of Object.values(vm.deck)) for (const c of row) preloadHandCard(this, c.card, { showRarity: true });
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
      && (a as { id?: string })?.id === (b as { id?: string })?.id && (a as { uid?: number })?.uid === (b as { uid?: number })?.uid;
    if (same(this.hover, h)) return;
    this.hover = h;
    this.redraw();
  }

  private leaveHover(h: Hover) {
    if (this.hover?.kind !== h.kind) return;
    if (h.kind === "card" && (this.hover as { slot: number }).slot !== h.slot) return;
    if (h.kind === "lane" && (this.hover as { id: string }).id !== h.id) return;
    if (h.kind === "deck" && (this.hover as { uid: number }).uid !== h.uid) return;
    this.setHover(undefined);
  }

  private buy(slot: number, spirit: string) {
    if (!this.session.canBuy(slot)) return;
    this.held = undefined;
    this.hover = undefined;
    // 산 카드는 진열에서 흐려져 빠져요 (0089)
    const sold = shopVM(this.session).cards[slot];
    this.leaving = sold ? { slot, card: sold.card } : undefined;
    this.session.dispatch({ kind: "buy", slot, spirit });
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const vm = shopVM(this.session);
    if (this.removing) return this.paintRemove(vm);
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
    drawRunTop(this, vm.gold - (spend ?? 0), spend === undefined ? {} : { was: vm.gold }, this.onDeck);

    // 얇은 정령 줄: 진열 가운데 높이
    const L = SHOP_LANE;
    let ly = Math.round(L.mid - (vm.lanes.length * (L.h + L.gap) - L.gap) / 2);
    for (const l of vm.lanes) {
      const st: SlimState = {};
      let click: (() => void) | undefined;
      let id: string | undefined;
      if (focus && focusSlot !== undefined && focus.learners.includes(l.id)) {
        const pointed = focus.learners.length === 1 || (hover?.kind === "lane" && hover.id === l.id);
        st.stat = focus.stat;
        st.open = true;
        st.hot = pointed && focus.affordable;
        if (held !== undefined) {
          click = () => this.buy(focusSlot, l.id);
          id = l.id;
        }
      } else if (healing) {
        st.hpTo = Math.min(l.maxHp, l.hp + (vm.heal.gain[l.id] ?? 0));
        st.hot = st.hpTo !== l.hp;
      }
      const zone = drawSlimLane(this, l, ly, L, click, st);
      if (zone && id) {
        const lane = id;
        zone.on("pointerover", () => this.setHover({ kind: "lane", id: lane })).on("pointerout", () => this.leaveHover({ kind: "lane", id: lane }));
      }
      ly += L.h + L.gap;
    }

    // 진열 카드 3×2 (말풍선은 다른 카드 위에 오도록 마지막에)
    let tip: (() => void) | undefined;
    const leaving = this.leaving;
    this.leaving = undefined;
    vm.cards.forEach((c, slot) => {
      const x = STOCK.x + (slot % STOCK.cols) * (STOCK.w + STOCK.gap);
      const y = STOCK.rows[Math.floor(slot / STOCK.cols)];
      if (!c) {
        if (leaving?.slot === slot) {
          fadeAway(this, createHandCard(this, cardWithFace(this, leaving.card, undefined, STOCK.scale), x + (STOCK.w - HAND_CARD.w) / 2, y + STOCK.h - HAND_CARD.h, { showRarity: true, scale: STOCK.scale }));
        }
        return;
      }
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
            this.buy(slot, c.learners[0]);
            return;
          }
          this.held = this.held === slot ? undefined : slot;
          this.redraw();
        });
      // 윗줄은 위 띠(골드)를 가리지 않게 옆에, 아랫줄은 위에
      if (on) tip = () => (slot < STOCK.cols ? drawCardTipBeside : drawCardTip)(this, card, x, y, STOCK.w);
    });

    drawService(this, "remove", vm.remove, hover?.kind === "remove", {
      over: () => this.setHover({ kind: "remove" }),
      out: () => this.leaveHover({ kind: "remove" }),
      click: () => {
        this.removing = true;
        this.held = undefined;
        this.hover = undefined;
        this.redraw();
      },
    });
    drawService(this, "heal", vm.heal, healing, {
      over: () => this.setHover({ kind: "heal" }),
      out: () => this.leaveHover({ kind: "heal" }),
      click: () => {
        this.hover = undefined;
        this.session.dispatch({ kind: "heal" });
      },
    });
    drawQuietButton(this, "g-back", COPY.leave, () => this.onLeave?.(this));
    tip?.();
  }

  private stopRemoving() {
    this.removing = false;
    this.pick = undefined;
    this.hover = undefined;
    this.redraw();
  }

  /** 빼기: 왼쪽에 덱. 올리면 주인 줄에 덱 장수 a→b, 고르면 그 줄 아래에 취소 · 빼기 */
  private paintRemove(vm: ShopVM) {
    const { hover, pick } = this;
    drawBackdrop(this);
    drawRunTop(this, vm.gold - (pick === undefined ? 0 : vm.remove.price), pick === undefined ? {} : { was: vm.gold });
    drawDeckPick(this, {
      lanes: vm.lanes, rows: vm.deck, mode: "remove", pick,
      hover: hover?.kind === "deck" ? hover.uid : undefined,
      deckDelta: -1,
      confirm: { label: COPY.remove, icon: "fx-discard", danger: true, price: vm.remove.price },
      cancelLabel: COPY.cancel,
      on: {
        hover: (uid) => (uid === undefined ? this.leaveHover(this.hover ?? { kind: "remove" }) : this.setHover({ kind: "deck", uid })),
        toggle: (uid) => { this.pick = this.pick === uid ? undefined : uid; this.redraw(); },
        clear: () => { this.pick = undefined; this.redraw(); },
        ok: (uid) => {
          this.removing = false;
          this.pick = undefined;
          this.hover = undefined;
          this.session.dispatch({ kind: "remove", uid });
        },
        back: () => this.stopRemoving(),
      },
    });
  }
}
