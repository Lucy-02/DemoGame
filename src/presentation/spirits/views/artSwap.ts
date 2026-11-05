// 다른 정령을 고를 때 그림 전환 (0035). 이전 그림은 제자리에서 옅어지고, 새 그림은 띠 방향에서 살짝 밀려 들어와요.
// 숫자와 패널은 바로 바뀌어요. 빠르게 연달아 눌러도 이어지도록, 지금 보이는 투명도와 자리에서 다음 전환을 시작해요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { cubicBezier, ms } from "../../style/ease";
import { ART } from "../layout";
import type { ArtPiece } from "./backdrop";

const M = tokens.provisional.motion.spiritSwap;
export const swapDuration = ms(M.duration);
export const swapEase = cubicBezier(M.easing);

/** 지금 그림의 상태. 다음 전환이 여기서 이어져요 */
export interface ArtMotion {
  alpha: number;
  dx: number;
}

/** 전환을 시작하고, 들어오는 그림의 상태를 돌려줘요. dir: 띠에서 오른쪽 정령이면 1, 왼쪽이면 -1 */
export function playArtSwap(scene: Phaser.Scene, out: ArtPiece[], into: ArtPiece[], dir: number, from: ArtMotion): ArtMotion {
  const S = ART.swap;
  const outBase = out.map((o) => o.x);
  const fading = { alpha: from.alpha };
  out.forEach((o, i) => {
    o.x = outBase[i] + from.dx;
    o.alpha = fading.alpha;
  });
  scene.tweens.add({
    targets: fading, alpha: 0, duration: swapDuration * S.out, ease: "Quad.In",
    onUpdate: () => out.forEach((o) => { o.alpha = fading.alpha; }),
    onComplete: () => out.forEach((o) => o.destroy()),
  });

  const intoBase = into.map((o) => o.x);
  const now: ArtMotion = { alpha: 0, dx: dir * S.shift };
  const apply = () => into.forEach((o, i) => {
    o.alpha = now.alpha;
    o.x = intoBase[i] + now.dx;
  });
  apply();
  scene.tweens.add({ targets: now, dx: 0, duration: swapDuration, ease: swapEase, onUpdate: apply, onComplete: apply });
  scene.tweens.add({
    targets: now, alpha: 1, delay: swapDuration * S.wait, duration: swapDuration * (1 - S.wait), ease: "Quad.Out",
    onUpdate: apply, onComplete: apply,
  });
  return now;
}
