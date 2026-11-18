// 화면 전환 막 (0086). 늘 맨 위에 떠 있는 장면이에요: 지난 화면을 바닥색으로 덮고, 새 화면이 뜨면 걷어요.
// 덮는 동안에는 아래 화면의 조작을 막아요. 모션 줄이기에서는 바로 바꿔요.
import * as Phaser from "phaser";
import { tokens } from "../design/tokens";
import { FRAME } from "./battle/layout";
import { rgba } from "./style/color";
import { ms } from "./style/ease";
import { MOVE, reducedMotion } from "./style/motion";

export const VEIL_SCENE = "veil";

const S = tokens.provisional.motion.screen;

export class VeilScene extends Phaser.Scene {
  private rect?: Phaser.GameObjects.Rectangle;
  /** 덮은 뒤에 할 화면 바꾸기. 덮는 중에 또 오면 마지막 것만 해요 */
  private swap?: () => void;
  /** 새 화면이 다 떴는지 */
  private ready?: () => boolean;
  private covering = false;

  constructor() {
    super(VEIL_SCENE);
  }

  create() {
    this.rect = this.add.rectangle(0, 0, FRAME.w, FRAME.h, rgba(tokens.provisional.palette.floor).color).setOrigin(0, 0).setAlpha(0);
  }

  /** bare = 덮을 화면이 없음 (게임을 막 켰을 때): 흐려지는 걸음 없이 바로 바꾸고 떠오르기만 해요 */
  cross(swap: () => void, ready: () => boolean, bare = false) {
    const rect = this.rect;
    if (!rect || reducedMotion()) return swap();
    this.ready = ready;
    if (!this.covering && !bare && !this.swap) {
      this.swap = swap;
      this.covering = true;
      rect.setInteractive();
      this.tweens.killTweensOf(rect);
      this.tweens.add({ targets: rect, alpha: 1, duration: ms(S.out.duration), onComplete: () => this.covered() });
      return;
    }
    if (this.covering) {
      this.swap = swap;
      return;
    }
    // 이미 덮여 있거나 덮을 화면이 없어요
    this.tweens.killTweensOf(rect);
    rect.setAlpha(1).setInteractive();
    this.swap = swap;
    this.covered();
  }

  private covered() {
    this.covering = false;
    const swap = this.swap;
    this.swap = undefined;
    swap?.();
    this.scene.bringToTop();
  }

  update() {
    const rect = this.rect;
    if (!rect || this.covering || !this.ready?.()) return;
    this.ready = undefined;
    rect.disableInteractive();
    this.tweens.add({ targets: rect, alpha: 0, duration: ms(S.in.duration), ease: MOVE.ease });
  }
}
