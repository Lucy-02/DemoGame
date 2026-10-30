// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { C, spiritDef } from "../../../core/data";
import { getRun } from "../../../core/run";
import type { CardDef } from "../../../core/types";
import { runHud } from "../ui/hud";
import { runStats } from "../ui/preview";
import { CARD_H, COLORS, W, bgFill, button, cardView, toast, txt } from "../ui/widgets";

export class ShopScene extends Phaser.Scene {
  private stock: { card: CardDef; sold: boolean }[] = [];
  private removed = false;
  private healed = false;

  constructor() {
    super("ShopScene");
  }

  init() {
    const run = getRun();
    this.stock = run.rollCards(C.shop.card_count, C.reward.rarity_normal).map((card) => ({ card, sold: false }));
    this.removed = false;
    this.healed = false;
  }

  create() {
    this.children.removeAll(true);
    const run = getRun();
    bgFill(this, 0x3a3020, 0x14121c);
    runHud(this);
    txt(this, W / 2, 80, "떠돌이 상점", 30).setOrigin(0.5);
    const price = C.shop.price as Record<string, number>;

    this.stock.forEach((s, i) => {
      const x = W / 2 + (i - (this.stock.length - 1) / 2) * 220;
      const y = 250;
      const learners = run.learnersOf(s.card.id);
      let view = cardView(this, s.card.id, learners[0].id, runStats(learners[0].id)).setPosition(x, y);
      if (s.sold) {
        view.setAlpha(0.25);
        txt(this, x, y, "판매됨", 22, "#ffffff").setOrigin(0.5);
        return;
      }
      const p = price[s.card.rarity] ?? 60;
      txt(this, x, y + CARD_H / 2 + 16, `${p} 골드`, 16, COLORS.gold).setOrigin(0.5);
      learners.forEach((rs, j) => {
        const b = button(this, x, y + CARD_H / 2 + 50 + j * 38, 170, 32, `${spiritDef(rs.id).name}에게`, () => {
          if (run.gold < p) return toast(this, "골드가 부족해요", "#ff8a8a");
          run.gold -= p;
          run.addCard(s.card.id, rs.id);
          s.sold = true;
          this.create();
        }, { size: 14, disabled: run.gold < p });
        b.list[0].on("pointerover", () => {
          view.destroy();
          view = cardView(this, s.card.id, rs.id, runStats(rs.id)).setPosition(x, y);
        });
      });
    });

    button(this, W / 2 - 230, 640, 300, 50, `카드 제거 (${C.shop.remove_price}골드)`, () => {
      this.events.once("resume", () => this.create());
      this.scene.launch("DeckScene", {
        mode: "remove", from: this.scene.key, onPick: (uid: number) => {
          run.gold -= C.shop.remove_price;
          run.removeCard(uid);
          this.removed = true;
        },
      });
      this.scene.pause();
    }, { size: 16, disabled: this.removed || run.gold < C.shop.remove_price });
    button(this, W / 2 + 100, 640, 300, 50, `치료 HP ${C.shop.heal_pct * 100}% (${C.shop.heal_price}골드)`, () => {
      run.gold -= C.shop.heal_price;
      run.healAllPct(C.shop.heal_pct);
      this.healed = true;
      this.create();
    }, { size: 16, disabled: this.healed || run.gold < C.shop.heal_price });
    button(this, W - 110, 640, 160, 50, "떠나기", () => this.scene.start("MapScene"), { color: 0x5a4f72 });
  }
}
