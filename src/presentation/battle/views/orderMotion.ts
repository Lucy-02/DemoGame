// 순서표 토큰 모션 (0077). 장면을 다시 그릴 때마다 앞 장면의 토큰 자리 · 상태를 넘겨받아, 같은 이름의 토큰을 이어서 움직여요.
// 토큰은 순서가 바뀔 때만 자리를 옮기고, 상태(지나감 · 끊김)는 제자리에서 바뀌어요. 쉬는 동안 움직이는 것은 없어요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { rgba } from "../../style/color";
import { cubicBezier, ms } from "../../style/ease";
import type { OrderCursor, OrderMark } from "./order";

const P = tokens.provisional.palette;
const M = tokens.provisional.motion;
const FAST = { duration: ms(M.hover.duration), ease: cubicBezier(M.hover.easing) };
const MOVE = { duration: ms(M.spiritSwap.duration), ease: cubicBezier(M.spiritSwap.easing) };
const T = M.orderToken;

/** 앞 장면의 순서표: 토큰 이름마다 자리와 상태 */
export interface OrderSnapshot {
  tokens: Record<string, { x: number; past: boolean; cut: boolean }>;
  cursorX?: number;
}

export function snapshotOrder(marks: OrderMark[], cursor?: OrderCursor): OrderSnapshot {
  const out: OrderSnapshot = { tokens: {}, cursorX: cursor?.x };
  for (const m of marks) if (m.key && !m.held) out.tokens[m.key] = { x: m.x, past: m.past, cut: !!m.cut };
  return out;
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 덩어리를 얼굴 가운데 기준으로 키워요 (덩어리 안 좌표가 화면 좌표라서 자리를 함께 옮겨요). dx = 가로로 밀린 만큼 */
function pose(m: OrderMark, scale: number, dx = 0) {
  m.node.setScale(scale).setPosition(m.x * (1 - scale) + dx, m.y * (1 - scale));
}

/**
 * 앞 장면(prev)에서 지금 장면으로 이어 움직여요.
 * - 새 턴(이어지는 토큰이 없음): 적 토큰이 ①부터 차례로 나타나요 (7번)
 * - 새로 놓인 카드: 제자리에서 흐리게 나타나요 (1번)
 * - 자리가 바뀐 토큰: 곧게 미끄러져요. 빠진 토큰이 있으면 그 자리가 빈 뒤에 닫혀요 (5 · 6번)
 * - 방금 행동한 토큰: 한 번 짚고 흐려져요 (3번)
 * - 방금 끊긴 적: 얼굴 위 보라 덮개가 채워졌다 빠져요 (4번)
 * - 재생 위치 선: 다음 자리로 미끄러지고, 재생 시작에는 제자리에서 세로로 자라요 (2번)
 */
export function playOrderMotion(scene: Phaser.Scene, prev: OrderSnapshot | undefined, marks: OrderMark[], cursor?: OrderCursor) {
  if (!prev) return;
  const still = reduced();
  const keyed = marks.filter((m) => m.key);
  const shared = keyed.filter((m) => prev.tokens[m.key!]);
  const gone = Object.keys(prev.tokens).some((k) => !keyed.some((m) => m.key === k));
  const wait = gone && shared.length ? ms(T.leave.duration) : 0;

  if (!shared.length) {
    // 새 턴
    const E = T.enter;
    keyed.filter((m) => m.kind === "enemy").forEach((m, i) => {
      const a = m.alpha();
      a.value = 0;
      const delay = ms(E.delay) + i * ms(E.stagger);
      scene.tweens.addCounter({ from: 0, to: 1, duration: ms(E.duration), delay, ease: FAST.ease, onUpdate: (t) => { a.value = m.fade * (t.getValue() ?? 1); } });
      if (still) return;
      pose(m, E.from);
      scene.tweens.addCounter({ from: E.from, to: 1, duration: ms(E.duration), delay, ease: cubicBezier(E.easing), onUpdate: (t) => pose(m, t.getValue() ?? 1) });
    });
  }

  for (const m of shared.length ? keyed : []) {
    const was = prev.tokens[m.key!];
    if (!was) {
      // 새로 놓인 카드
      const a = m.alpha();
      a.value = 0;
      scene.tweens.addCounter({ from: 0, to: 1, duration: FAST.duration, ease: FAST.ease, onUpdate: (t) => { a.value = m.fade * (t.getValue() ?? 1); } });
      continue;
    }
    const dx = was.x - m.x;
    if (dx && !still) {
      pose(m, 1, dx);
      scene.tweens.addCounter({ from: dx, to: 0, duration: MOVE.duration, delay: wait, ease: MOVE.ease, onUpdate: (t) => pose(m, 1, t.getValue() ?? 0) });
    }
    if (m.past && !was.past) {
      // 행동: 밝은 채로 한 번 짚고, 끝나며 흐려져요
      const a = m.alpha();
      a.value = 1;
      const d = ms(T.act.duration);
      scene.tweens.addCounter({ from: 1, to: m.fade, duration: d, delay: d, ease: FAST.ease, onUpdate: (t) => { a.value = t.getValue() ?? m.fade; } });
      if (!still) scene.tweens.addCounter({ from: 0, to: 1, duration: d, ease: "Sine.easeInOut", onUpdate: (t) => pose(m, 1 + (T.act.scale - 1) * Math.sin(Math.PI * (t.getValue() ?? 1))) });
    }
    if (m.cut && !was.cut) {
      const c = rgba(P.accHi);
      const veil = scene.add.circle(m.x, m.y, m.d / 2, c.color).setAlpha(0);
      scene.tweens.add({ targets: veil, alpha: T.cut.peak, duration: ms(T.cut.duration) / 2, yoyo: true, ease: "Sine.easeInOut", onComplete: () => veil.destroy() });
    }
  }

  if (cursor) {
    if (prev.cursorX === undefined) {
      if (!still) {
        cursor.bar.setScale(1, 0);
        scene.tweens.add({ targets: cursor.bar, scaleY: 1, duration: ms(T.cursor.grow), ease: FAST.ease });
      }
    } else if (prev.cursorX !== cursor.x && !still) {
      cursor.bar.x = prev.cursorX;
      scene.tweens.add({ targets: cursor.bar, x: cursor.x, duration: MOVE.duration, ease: MOVE.ease });
    }
  }
}
