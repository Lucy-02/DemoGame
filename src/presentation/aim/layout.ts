// 조준선 수치. 정본 design/canon/battle-r5/page.html .aimline (H1 프레임, 물방울 휘갈기기 → 거북).
// 색은 토큰(tokens.provisional.palette.accHi). 곡선은 정본 한 줄 예시의 방향을 그대로 써요(curve.ts trunkRule).
import type { Cubic } from "./curve";

/** .aimline path stroke-width 2.5, stroke-dasharray 7 6, stroke-linecap round · circle r 5 */
export const AIM_LINE = { width: 2.5, dash: [7, 6], dot: 5 };

/** .aimline path "M 1026 650 C 1250 630, 1256 340, 1170 322" (정본 시안 좌표, 방향 뽑기용 예시) */
export const AIM_EXAMPLE: Cubic = {
  p0: { x: 1026, y: 650 }, c1: { x: 1250, y: 630 }, c2: { x: 1256, y: 340 }, p3: { x: 1170, y: 322 },
};
