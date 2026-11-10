// 전투 결과 화면 (0044 배치 + 0050 표현 + 0051 보상 구조). 왼쪽에 골드·보상 카드·넘기기, 오른쪽에 정령 세 줄.
// 카드에 올리면 주인 줄이 밝아지고 칸에 카드가 비쳐 보여요. 누르면 그 줄로 들어가요(전투 보상은 주인 고정, 0040).
// 배울 정령이 여럿인 카드(이벤트)는 카드를 집은 뒤 줄을 눌러 정해요.
// 세션을 주면 런에 연결돼요: 고르는 즉시 규칙에 적용하고 onDone으로 나가요. 세션이 없으면 고정 장면이에요.
import * as Phaser from "phaser";
import type { RewardSession } from "../../session/reward";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { drawBackdrop } from "../run/backdrop";
import { cardWithFace, drawCardTip } from "../run/cards";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane, type LaneState } from "../run/lanes";
import { FRAME } from "../run/layout";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { DEFAULT_RESULT, RESULTS } from "./fixtures";
import { resultVM } from "./fromReward";
import { REWARD } from "./layout";
import type { ResultVM } from "./viewmodel";
import { REWARD_ICONS, drawSkip } from "./views/reward";

export const RESULT_SCENE = "result";

/** 받은 것: 카드 번호와 배운 정령, 또는 넘기기 */
export type ResultChoice = { card: number; spirit: string } | "skip";

export interface ResultSceneData {
  /** 런에 연결된 보상. 주면 고정 장면 대신 이걸 그려요 */
  session?: RewardSession;
  /** 고정 장면 이름 (fixtures RESULTS) */
  scene?: string;
  /** 시각 검증용: 이 카드(key)에 올린 상태, 또는 "skip" */
  hover?: string;
  /** 시각 검증용: 이 카드(key)를 받은 상태, 또는 "skip" */
  taken?: string;
  /** 다 고른 뒤에 불려요. 이 장면을 넘겨받아 다음 장면으로 넘어가요 */
  onDone?: (scene: Phaser.Scene) => void;
}

type Hover = { kind: "card"; i: number } | { kind: "lane"; id: string } | { kind: "skip" };
const sameHover = (a?: Hover, b?: Hover) =>
  a?.kind === b?.kind && (a as { i?: number })?.i === (b as { i?: number })?.i && (a as { id?: string })?.id === (b as { id?: string })?.id;

export class ResultScene extends Phaser.Scene {
  private session?: RewardSession;
  private vm!: ResultVM;
  private hover?: Hover;
  /** 집은 카드 (배울 정령을 고르는 중) */
  private held?: number;
  private taken?: ResultChoice;
  private onDone?: (scene: Phaser.Scene) => void;
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
    this.hover = data.hover === "skip" ? { kind: "skip" } : hovered === undefined ? undefined : { kind: "card", i: hovered };
    const took = card(data.taken);
    this.taken = data.taken === "skip" ? "skip" : took === undefined ? undefined : { card: took, spirit: this.vm.cards[took].owners[0] };
    this.held = undefined;
    this.onDone = data.onDone;
    this.dirty = false;
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ...GOLD_ICONS, ...REWARD_ICONS]) loadIcon(this, id, w);
    for (const c of this.vm.cards) preloadHandCard(this, c.card, { showRarity: true, scale: REWARD.scale });
    preloadSpiritArt(this, this.vm.lanes.map((l) => l.id));
  }

  create() {
    // 다시 그리면 입력 대상이 새로 생겨요. 마우스를 움직이지 않아도 그 위의 상태를 유지해요
    this.input.setPollAlways();
    this.paint();
    Object.assign(window, { __screenReady: RESULT_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private setHover(h?: Hover) {
    if (this.taken !== undefined || sameHover(this.hover, h)) return;
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
    this.onDone?.(this);
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const { vm, hover, taken, held } = this;
    const done = taken !== undefined;
    const lane = (id?: string) => vm.lanes.find((l) => l.id === id);
    drawBackdrop(this);
    // 빈 곳을 누르면 집은 카드를 내려놓아요 (맨 아래에 깔아서 다른 입력이 먼저 받아요)
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => {
      if (this.held === undefined) return;
      this.held = undefined;
      this.dirty = true;
    });

    // 세션에 연결되면 받은 골드는 이미 런 값에 들어 있어요. 고정 장면은 넘긴 뒤 값을 여기서 더해요
    const skipped = taken === "skip";
    const skipHover = hover?.kind === "skip";
    const total = vm.gold.total + (skipped && !this.session ? vm.skipGold ?? 0 : 0);
    const plus = skipHover && vm.skipGold !== undefined ? `+${vm.skipGold}` : !done && vm.gold.gained ? `+${vm.gold.gained}` : undefined;
    drawGold(this, total, { plus });

    const focusI = done ? undefined : held ?? (hover?.kind === "card" ? hover.i : undefined);
    const focus = focusI === undefined ? undefined : vm.cards[focusI];
    const got = taken !== undefined && taken !== "skip" ? taken : undefined;

    vm.lanes.forEach((l, i) => {
      const st: LaneState = {};
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
      drawLane(this, l, i, st);
    });

    // 보상 카드: 왼→오 = 줄 위→아래
    vm.cards.forEach((c, i) => {
      if (got?.card === i) return;
      const x = REWARD.x + i * (REWARD.w + REWARD.gap), y = REWARD.y;
      const card = cardWithFace(this, c.card, c.owners.length === 1 ? lane(c.owners[0]) : undefined, REWARD.scale);
      const view = createHandCard(this, card, x + (REWARD.w - HAND_CARD.w) / 2, y + REWARD.h - HAND_CARD.h, { showRarity: true, scale: REWARD.scale });
      const on = focusI === i;
      view.setHeld(on);
      view.setLifted(on);
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
      if (on) drawCardTip(this, card, x, y, REWARD.w);
    });

    if (!done) {
      drawSkip(this, vm.skipGold, skipHover, {
        over: () => this.setHover({ kind: "skip" }),
        out: () => this.leaveHover({ kind: "skip" }),
        click: () => this.take("skip"),
      });
    }
  }
}
