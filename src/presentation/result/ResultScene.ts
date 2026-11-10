// 전투 결과 화면 (0044 배치 + 0050 표현 + 0051 보상 구조). 왼쪽에 골드·보상 카드·넘기기, 오른쪽에 정령 세 줄.
// 카드에 올리면 주인 줄이 밝아지고 칸에 카드가 비쳐 보여요. 누르면 그 줄로 들어가요(주인 고정, 0040).
// 지금은 고정 장면으로만 떠요. 규칙(런)에 연결하면 onDone으로 고른 결과를 넘겨요.
import * as Phaser from "phaser";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { drawBackdrop } from "../run/backdrop";
import { cardWithFace, drawCardTip } from "../run/cards";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane, type LaneState } from "../run/lanes";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { DEFAULT_RESULT, RESULTS } from "./fixtures";
import { REWARD } from "./layout";
import type { ResultVM } from "./viewmodel";
import { REWARD_ICONS, drawSkip } from "./views/reward";

export const RESULT_SCENE = "result";

/** 고른 것: 카드 번호 또는 넘기기 */
export type ResultChoice = number | "skip";

export interface ResultSceneData {
  /** 고정 장면 이름 (fixtures RESULTS). vm을 주면 무시해요 */
  scene?: string;
  vm?: ResultVM;
  /** 시각 검증용: 이 카드(key)에 올린 상태, 또는 "skip" */
  hover?: string;
  /** 시각 검증용: 이 카드(key)를 받은 상태, 또는 "skip" */
  taken?: string;
  /** 다 고른 뒤에 불려요 (런 연결용) */
  onDone?: (choice: ResultChoice) => void;
}

export class ResultScene extends Phaser.Scene {
  private vm!: ResultVM;
  private hover?: ResultChoice;
  private taken?: ResultChoice;
  private onDone?: (choice: ResultChoice) => void;
  /** 입력 처리 중에 지우면 안 돼서, 다시 그리기는 다음 update에서 해요 */
  private dirty = false;

  constructor() {
    super(RESULT_SCENE);
  }

  init(data: ResultSceneData) {
    this.vm = data.vm ?? RESULTS[data.scene ?? DEFAULT_RESULT] ?? RESULTS[DEFAULT_RESULT];
    const pick = (key?: string): ResultChoice | undefined => {
      if (key === "skip") return "skip";
      const i = this.vm.cards.findIndex((c) => c.card.key === key);
      return i < 0 ? undefined : i;
    };
    this.hover = pick(data.hover);
    this.taken = pick(data.taken);
    this.onDone = data.onDone;
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

  private setHover(h?: ResultChoice) {
    if (this.taken !== undefined || this.hover === h) return;
    this.hover = h;
    this.dirty = true;
  }

  private take(choice: ResultChoice) {
    if (this.taken !== undefined) return;
    this.taken = choice;
    this.hover = undefined;
    this.dirty = true;
    this.onDone?.(choice);
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const { vm, hover, taken } = this;
    const done = taken !== undefined;
    drawBackdrop(this);

    const skipped = taken === "skip";
    const skipHover = hover === "skip";
    const total = vm.gold.total + (skipped ? vm.skipGold ?? 0 : 0);
    const plus = skipHover ? `+${vm.skipGold ?? "?"}` : !done && vm.gold.gained ? `+${vm.gold.gained}` : undefined;
    drawGold(this, total, { plus });

    // 줄: 올리거나 받은 카드의 주인 줄에 카드가 놓여요
    const shown = typeof taken === "number" ? taken : typeof hover === "number" ? hover : undefined;
    const cards = vm.cards.map((c) => ({ ...c, card: cardWithFace(this, c.card, vm.lanes.find((l) => l.id === c.owner), REWARD.scale) }));
    vm.lanes.forEach((l, i) => {
      const c = shown === undefined ? undefined : cards[shown];
      const mine = c?.owner === l.id;
      const st: LaneState = mine && c
        ? { hot: !done, stat: done ? undefined : c.stat, card: { vm: c.card, hot: !done } }
        : {};
      drawLane(this, l, i, st);
    });

    // 보상 카드: 왼→오 = 줄 위→아래
    cards.forEach((c, i) => {
      if (taken === i) return;
      const x = REWARD.x + i * (REWARD.w + REWARD.gap), y = REWARD.y;
      const view = createHandCard(this, c.card, x + (REWARD.w - HAND_CARD.w) / 2, y + REWARD.h - HAND_CARD.h, { showRarity: true, scale: REWARD.scale });
      const held = hover === i;
      view.setHeld(held);
      view.setLifted(held);
      if (done) view.opacity = REWARD.sunk;
      else if (hover !== undefined && !held) view.opacity = REWARD.dim;
      if (done) return;
      this.add.zone(x, y, REWARD.w, REWARD.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.setHover(i))
        .on("pointerout", () => { if (this.hover === i) this.setHover(undefined); })
        .on("pointerup", () => this.take(i));
      if (held) drawCardTip(this, c.card, x, y, REWARD.w);
    });

    if (!done) {
      drawSkip(this, vm.skipGold, skipHover, {
        over: () => this.setHover("skip"),
        out: () => { if (this.hover === "skip") this.setHover(undefined); },
        click: () => this.take("skip"),
      });
    }
  }
}
