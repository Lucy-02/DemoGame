// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { C } from "../../../core/data";
import { getRun } from "../../../core/run";
import { runHud } from "../ui/hud";
import { COLORS, W, bgFill, button, txt } from "../ui/widgets";

export class RestScene extends Phaser.Scene {
  constructor() {
    super("RestScene");
  }
  create() {
    const run = getRun();
    bgFill(this, 0x24382c, 0x14121c);
    runHud(this);
    txt(this, W / 2, 140, "휴식", 36).setOrigin(0.5);
    txt(this, W / 2, 190, "모닥불 곁에서 정령들이 몸을 말려요.", 17, COLORS.dim).setOrigin(0.5);
    button(this, W / 2 - 170, 330, 300, 90, `쉬기\n모든 정령 HP ${Math.round(C.rest_heal_pct * 100)}% 회복`, () => {
      run.healAllPct(C.rest_heal_pct);
      this.scene.start("MapScene");
    }, { size: 18, color: 0x3f7a55 });
    button(this, W / 2 + 170, 330, 300, 90, "명상\n덱에서 카드 1장 제거", () => {
      let picked = false;
      this.events.once("resume", () => (picked ? this.scene.start("MapScene") : undefined));
      this.scene.launch("DeckScene", {
        mode: "remove", from: this.scene.key, onPick: (uid: number) => {
          run.removeCard(uid);
          picked = true;
        },
      });
      this.scene.pause();
    }, { size: 18, color: 0x4a6f8c });
  }
}
