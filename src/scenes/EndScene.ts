// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { getRun } from "../core/run";
import { COLORS, H, W, bgFill, button, txt } from "../ui/widgets";

export class EndScene extends Phaser.Scene {
  constructor() {
    super("EndScene");
  }
  create(data: { victory: boolean }) {
    const run = getRun();
    bgFill(this, data.victory ? 0x2d3b25 : 0x3b2525, 0x14121c);
    txt(this, W / 2, 200, data.victory ? "1막 클리어!" : "탐험 실패", 48, "#ffffff", { fontStyle: "bold" }).setOrigin(0.5);
    txt(this, W / 2, 270, data.victory ? "그림바크가 쓰러지고 시든 정원에 바람이 불어요." : "세 정령이 모두 쓰러졌어요. 정원으로 돌아가요.", 18, COLORS.dim).setOrigin(0.5);
    txt(this, W / 2, 340, `지나온 칸 ${run.visited.length}개 · 덱 ${run.deck.length}장 · 골드 ${run.gold}`, 18).setOrigin(0.5);
    button(this, W / 2, H - 160, 240, 56, "처음으로", () => this.scene.start("TitleScene"), { size: 20 });
  }
}
