// 공통 모션 값 (0077 · 0086). 내가 일으킨 변화는 FAST, 자리 옮김은 MOVE를 써요. 값은 임시 토큰이에요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { cubicBezier, ms } from "./ease";
import { colorMatrix, opacityOf } from "./opacity";

const M = tokens.provisional.motion;

/** 빠름: 호버 · 흐려짐 · 창이 뜸 */
export const FAST = { duration: ms(M.hover.duration), ease: cubicBezier(M.hover.easing) };
/** 보통: 자리 옮김 */
export const MOVE = { duration: ms(M.spiritSwap.duration), ease: cubicBezier(M.spiritSwap.easing) };

/** 모션 줄이기: 자리 옮김은 하지 않고 색 · 투명도 변화만 남겨요 (0077) */
export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 창이 뜰 때: 장면 전체가 한 장으로 흐리게 나타나요 (0086). 다른 화면 위에 뜨는 창 장면의 create 끝에서 불러요.
 * 카메라마다 색 행렬 필터로 불투명도를 올리고, 끝나면 필터를 꺼서 글자가 선명해요.
 */
export function fadeInScene(scene: Phaser.Scene) {
  if (reducedMotion()) return;
  const fxs = scene.cameras.cameras.map((cam) => cam.filters.internal.addColorMatrix());
  const set = (opacity: number) => { for (const fx of fxs) fx.colorMatrix.set(colorMatrix({ opacity })); };
  set(0);
  scene.tweens.addCounter({
    from: 0, to: 1, ...FAST,
    onUpdate: (t) => set(t.getValue() ?? 1),
    onComplete: () => { for (const fx of fxs) fx.active = false; },
  });
}

/**
 * 화면이 뜬 뒤 덩어리가 차례로 흐리게 나타나요 (0086). 자리 · 크기는 움직이지 않아요.
 * delay = 첫 덩어리 앞 기다림 (화면 전환이 걷히는 동안).
 */
export function revealInOrder(scene: Phaser.Scene, parts: Phaser.GameObjects.Container[], delay = 0) {
  if (reducedMotion()) return;
  const stagger = ms(M.reveal.stagger);
  parts.forEach((part, i) => {
    const fade = opacityOf(part);
    fade.value = 0;
    scene.tweens.addCounter({ from: 0, to: 1, delay: delay + i * stagger, ...FAST, onUpdate: (t) => { fade.value = t.getValue() ?? 1; } });
  });
}

/** 빠지는 것: 제자리에서 흐려져 사라져요 (0086 8번 · 0089). target.opacity는 CSS opacity처럼 한 장으로 흐려지는 값 */
export function fadeAway(scene: Phaser.Scene, target: { opacity: number; root: Phaser.GameObjects.Container }) {
  if (reducedMotion()) return target.root.destroy();
  scene.tweens.add({ targets: target, opacity: 0, duration: ms(M.hand.leave), ease: FAST.ease, onComplete: () => target.root.destroy() });
}
