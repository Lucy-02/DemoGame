// 지도 화면 배치 (LEDGER §2 R2 지도 C: 가까운 길 + 전체 미니맵 + 슬림 파티 패널). 값은 묶음 A 정리안 f9(0046)에서 잰 임시 값이에요 (TODO_TOKEN).
import { FRAME, GRID, LANE } from "../run/layout";

export { FRAME };

/** 가까운 길: 지금 층 둘레의 여섯 층만 크게. 아래가 지나온 길, 위가 갈 길 */
export const PATH = {
  rows: 6, back: 2,
  x: 170, colStep: 100, bottom: 690, rowStep: 104,
  /** 칸: 원판 40, 기호 18 · 지금 있는 칸은 바깥 테 4 띄워 2 */
  node: { d: 40, icon: 18, ring: 1, here: { gap: 4, width: 2 }, hover: { gap: 3, width: 2 } },
  /** 지나온 길은 실선, 갈 길은 점선 */
  link: { walked: 3, ahead: 2, dash: 6, walkedAlpha: 0.5, aheadAlpha: 0.3 },
  /** 갈 수 없는 칸 · 지나온 칸의 흐림 */
  dim: { far: 0.45, past: 0.7 },
  tipGap: 8,
};

/** 전체 미니맵: 위 가운데 작은 판. 보이는 여섯 층 구간에 옅은 띠 */
export const MINI = {
  x: 500, y: 24, w: 120, h: 170, radius: 10, pad: 14,
  dot: 5, here: 8, line: 1, lineAlpha: 0.3, dotAlpha: 0.55, band: { pad: 6, radius: 6, alpha: 0.06 },
};

/** 슬림 파티 줄: 정령 줄(0046)의 접힌 상태. 고른 줄만 같은 자리에서 정령 줄 높이로 펼쳐요 */
export const SLIM = {
  x: GRID.lanesX, y: LANE.y, w: GRID.lanesW, h: 52, gap: LANE.gap, radius: LANE.radius,
  ring: { x: 16, d: 40, r: 18, stroke: 3, faceInset: 5 },
  name: { x: 73, gap: 10 },
  hp: { x: 301, w: 132, h: 8, numX: 443, numGap: 2 },
  /** 펼친 줄의 닫기: 오른쪽 위 */
  close: { right: 18, top: 18, h: 36, padX: 18, radius: 10 },
};
