// 첫 판 안내의 짚는 테 (0088, 시안 A "숨 쉬는 테"): 짚을 곳 둘레에 밝은 테 하나가 천천히 흐려졌다 돌아와요.
// 새 값은 없어요: 테 굵기는 가리킨 의도 알약의 테, 박자는 깎일 구간 깜빡임(lossPulse)을 그대로 써요.
import * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box } from "../../style/draw";
import { cubicBezier, ms } from "../../style/ease";
import { reducedMotion } from "../../style/motion";
import { GUIDE } from "../layout";

const P = tokens.provisional.palette;
const PULSE = tokens.provisional.motion.lossPulse;

export interface GuideBox {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}

/** 짚을 곳마다 테 하나. 움직임 줄이기가 켜져 있으면 깜빡이지 않고 켜 둬요 */
export function drawGuide(scene: Phaser.Scene, boxes: GuideBox[]): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const k = GUIDE.gap;
  for (const b of boxes) {
    box(g, b.x - k, b.y - k, b.w + k * 2, b.h + k * 2, b.radius + k, { ring: { width: GUIDE.ring, color: P.ink } });
  }
  if (!reducedMotion()) {
    const d = ms(PULSE.duration), ease = cubicBezier(PULSE.easing);
    scene.tweens.chain({
      targets: g, loop: -1,
      tweens: [
        { alpha: PULSE.low, duration: d * PULSE.peak, ease },
        { alpha: 1, duration: d * (1 - PULSE.peak), ease },
      ],
    });
  }
  return g;
}
