// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { cardDef } from "../../../core/data";
import { getRun } from "../../../core/run";
import type { DeckCard } from "../../../core/types";
import { runStats } from "../ui/preview";
import { CARD_H, CARD_W, COLORS, H, W, button, cardView, txt } from "../ui/widgets";

export interface DeckSceneData {
  mode: "view" | "remove";
  from: string;
  title?: string;
  cards?: DeckCard[];
  onPick?: (uid: number) => void;
}

export class DeckScene extends Phaser.Scene {
  constructor() {
    super("DeckScene");
  }

  create(data: DeckSceneData) {
    const run = getRun();
    const cards = (data.cards ?? run.deck).slice().sort((a, b) =>
      a.owner === b.owner ? cardDef(a.cardId).cost - cardDef(b.cardId).cost : a.owner.localeCompare(b.owner));
    this.add.rectangle(0, 0, W, H, 0x000000, 0.85).setOrigin(0, 0).setInteractive();
    const title = data.title ?? (data.mode === "remove" ? "제거할 카드를 고르세요" : `덱 (${cards.length}장)`);
    txt(this, W / 2, 34, title, 24).setOrigin(0.5);

    const close = () => {
      this.scene.stop();
      this.scene.resume(data.from);
    };
    button(this, W - 90, 34, 140, 40, data.mode === "remove" ? "취소" : "닫기", close, { color: 0x5a4f72 });

    const content = this.add.container(0, 0);
    const scale = 0.78;
    const cols = 9;
    const cw = CARD_W * scale + 12;
    const ch = CARD_H * scale + 14;
    const x0 = W / 2 - ((cols - 1) * cw) / 2;
    cards.forEach((c, i) => {
      const v = cardView(this, c.cardId, c.owner, runStats(c.owner));
      v.setScale(scale).setPosition(x0 + (i % cols) * cw, 150 + Math.floor(i / cols) * ch);
      content.add(v);
      if (data.mode === "remove") {
        const hit = this.add.rectangle(v.x, v.y, CARD_W * scale, CARD_H * scale, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on("pointerover", () => v.setScale(scale * 1.08));
        hit.on("pointerout", () => v.setScale(scale));
        hit.on("pointerdown", () => {
          data.onPick?.(c.uid);
          close();
        });
        content.add(hit);
      }
    });
    if (!cards.length) txt(this, W / 2, H / 2, "카드가 없어요", 18, COLORS.dim).setOrigin(0.5);
    const rows = Math.ceil(cards.length / cols);
    const maxScroll = Math.max(0, 150 + rows * ch - (H - 40));
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      content.y = Phaser.Math.Clamp(content.y - dy * 0.6, -maxScroll, 0);
    });
  }
}
