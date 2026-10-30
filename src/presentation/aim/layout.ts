// 조준선 수치. 정본 design/canon/battle-r5/page.html .aimline (H1 프레임, 물방울 휘갈기기 → 거북).
// 색은 토큰(tokens.provisional.palette.accHi). 곡선은 정본 한 줄 예시의 방향을 그대로 써요(curve.ts trunkRule).
import type { Cubic } from "./curve";

/** .aimline path stroke-width 2.5, stroke-dasharray 7 6, stroke-linecap round · circle r 5 */
export const AIM_LINE = { width: 2.5, dash: [7, 6], dot: 5 };

/** .aimline path "M 1026 650 C 1250 630, 1256 340, 1170 322" (정본 시안 좌표, 방향 뽑기용 예시) */
export const AIM_EXAMPLE: Cubic = {
  p0: { x: 1026, y: 650 }, c1: { x: 1250, y: 630 }, c2: { x: 1256, y: 340 }, p3: { x: 1170, y: 322 },
};

/** 여러 대상 조준선 정리 후보 (Lucy 비교용, 확정 전 임시 · ?lines=). trunk = 지금 main.
 *  side = 가: 가까운 쪽 길로 (왼쪽 대상은 아군·적 판 사이 빈틈으로 올라가 왼쪽에서 들어감)
 *  focus = 나: 줄은 지금 가리키는 대상 하나만, 이미 고른 대상은 고리·결과만 */
export interface AimLineStyle {
  side: boolean;
  focus: boolean;
}
export const AIM_LINE_STYLES: Record<string, AimLineStyle> = {
  trunk: { side: false, focus: false },
  side: { side: true, focus: false },
  focus: { side: false, focus: true },
  "side-focus": { side: true, focus: true },
};
