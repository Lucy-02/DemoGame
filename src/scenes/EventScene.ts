// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { C } from "../core/data";
import { getRun } from "../core/run";
import { maxHpOf } from "../core/stats";
import type { EventDef, EventOutcome } from "../core/types";
import { runHud } from "../ui/hud";
import { COLORS, H, W, bgFill, button, txt } from "../ui/widgets";

export class EventScene extends Phaser.Scene {
  private ev!: EventDef;
  constructor() {
    super("EventScene");
  }
  init() {
    this.ev = getRun().pickEvent();
  }
  create() {
    const ev = this.ev;
    bgFill(this, 0x22303d, 0x14121c);
    runHud(this);
    this.add.rectangle(W / 2, 330, 760, 400, 0x2a2538, 0.95).setStrokeStyle(2, 0x6b6480);
    txt(this, W / 2, 180, ev.title, 32).setOrigin(0.5);
    txt(this, W / 2, 250, ev.text, 18, COLORS.text, { wordWrap: { width: 640 }, align: "center" }).setOrigin(0.5);
    ev.options.forEach((o, i) => {
      button(this, W / 2, 360 + i * 80, 560, 64, `${o.label}\n${o.desc}`, () => this.apply(o.outcome), { size: 16, color: 0x4a3f6b });
    });
    txt(this, W / 2, H - 40, "이벤트는 src/data/events.json에서 추가할 수 있어요.", 12, COLORS.dim).setOrigin(0.5);
  }

  private apply(outs: EventOutcome[]) {
    const run = getRun();
    let next: (() => void) | null = () => this.scene.start("MapScene");
    for (const o of outs) {
      switch (o.type) {
        case "healPct": run.healAllPct(o.value); break;
        case "gold": run.gold += o.value; break;
        case "damageAll": for (const s of run.spirits) s.hp = Math.max(1, s.hp - o.value); break;
        case "damageFront": { const s = run.spirit(run.frontId); s.hp = Math.max(1, s.hp - o.value); break; }
        case "maxHpAll": for (const s of run.spirits) { s.maxHpBonus += o.value; s.hp = Math.min(maxHpOf(s), s.hp + o.value); } break;
        case "cardReward": {
          const cards = run.rollCards(3, C.reward.rarity_normal, o.rarity);
          next = () => this.scene.start("RewardScene", { title: "두루마리에서 배운 마법", cardIds: cards.map((c) => c.id) });
          break;
        }
        case "removeCard":
          next = null;
          this.events.once("resume", () => this.scene.start("MapScene"));
          this.scene.launch("DeckScene", { mode: "remove", from: this.scene.key, onPick: (uid: number) => run.removeCard(uid) });
          this.scene.pause();
          break;
      }
    }
    next?.();
  }
}
