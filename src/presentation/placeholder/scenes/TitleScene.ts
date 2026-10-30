// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { ELEMENT_COLOR, ELEMENT_NAME, ROLE_NAME, SPIRITS } from "../../../core/data";
import { Run, setRun } from "../../../core/run";
import { makeVisual } from "../ui/visual";
import { COLORS, H, W, bgFill, button, txt } from "../ui/widgets";

export class TitleScene extends Phaser.Scene {
  private frontId = "testu";
  private adult = false;
  private unlockAll = false;
  private seed = Math.floor(Math.random() * 1e6);

  constructor() {
    super("TitleScene");
  }

  create() {
    this.tweens.killAll();
    this.children.removeAll(true);
    bgFill(this, 0x2b2140, 0x14121c);
    txt(this, W / 2, 70, "정령 덱빌더", 44, "#ffffff", { fontStyle: "bold" }).setOrigin(0.5);
    txt(this, W / 2, 118, "전투 프로토타입 · 1막", 18, COLORS.dim).setOrigin(0.5);
    txt(this, W / 2, 160, "앞열에 세울 정령을 고르세요. 적의 기본 공격은 앞열을 노려요.", 16, COLORS.dim).setOrigin(0.5);

    SPIRITS.forEach((d, i) => {
      const x = W / 2 + (i - 1) * 300;
      const y = 350;
      const sel = d.id === this.frontId;
      const panel = this.add.rectangle(x, y, 260, 300, 0x2a2538).setStrokeStyle(sel ? 4 : 2, sel ? 0xffd166 : ELEMENT_COLOR[d.element], 1);
      panel.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
        this.frontId = d.id;
        this.create();
      });
      const v = makeVisual(this, "spirits", d.id, false);
      v.root.setPosition(x, y - 60);
      txt(this, x, y + 30, `${d.name}  ·  ${ELEMENT_NAME[d.element]} ${ROLE_NAME[d.role]}`, 20).setOrigin(0.5);
      txt(this, x, y + 56, d.motif, 13, COLORS.dim).setOrigin(0.5);
      const st = d.stats;
      txt(this, x, y + 90, `HP ${st.hp}  파워 ${st.power}  가드 ${st.guard}\n포커스 ${st.focus}  싱크 ${st.sync}`, 14, COLORS.text, { align: "center" }).setOrigin(0.5);
      txt(this, x, y + 128, `각성: ${d.awaken.name}`, 13, "#d6b8ff").setOrigin(0.5);
      if (sel) txt(this, x, y - 165, "▼ 앞열", 16, COLORS.gold).setOrigin(0.5);
    });

    const toggle = (x: number, label: string, on: boolean, flip: () => void) =>
      button(this, x, 560, 250, 40, `${on ? "☑" : "☐"} ${label}`, () => {
        flip();
        this.create();
      }, { size: 15, color: on ? 0x3f7a55 : 0x3f3758 });
    toggle(W / 2 - 270, "성체로 시작 (성격 공개)", this.adult, () => (this.adult = !this.adult));
    toggle(W / 2, "모든 카드 해금 (테스트)", this.unlockAll, () => (this.unlockAll = !this.unlockAll));
    toggle(W / 2 + 270, `시드 ${this.seed} (새로 뽑기)`, false, () => (this.seed = Math.floor(Math.random() * 1e6)));

    button(this, W / 2, 640, 240, 56, "탐험 시작", () => {
      setRun(new Run({ seed: this.seed, frontId: this.frontId, adult: this.adult, unlockAll: this.unlockAll }));
      this.scene.start("MapScene");
    }, { size: 22 });
    txt(this, W - 12, H - 10, "v0.1 prototype", 12, COLORS.dim).setOrigin(1, 1);
  }
}
