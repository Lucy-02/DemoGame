// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { preloadVisuals } from "../ui/visual";
import { H, W, txt } from "../ui/widgets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }
  preload() {
    const t = txt(this, W / 2, H / 2, "불러오는 중…", 20).setOrigin(0.5);
    this.load.on("progress", (p: number) => t.setText(`불러오는 중… ${Math.round(p * 100)}%`));
    this.load.on("loaderror", (f: { key: string }) => console.warn("asset load failed:", f.key));
    preloadVisuals(this);
  }
  create() {
    this.scene.start("TitleScene");
  }
}
