// 지도 화면 배치 (LEDGER §2 R2 지도 C: 가까운 길 + 전체 미니맵 + 슬림 파티 패널). 값은 묶음 A 정리안 f9(0046)에서 잰 임시 값이에요 (TODO_TOKEN).
import { SYS } from "../battle/layout";
import { FRAME, GOLD_AT, GRID, LANE, SLIM_LANE } from "../run/layout";

export { FRAME, GOLD_AT };

/** 가까운 길: 지금 층 둘레의 여섯 층만 크게. 아래가 지나온 길, 위가 갈 길 */
export const PATH = {
  rows: 6, back: 2,
  /** 왼쪽 열(48~612) 가로 가운데에 네 줄 */
  cx: GRID.gutter + (GRID.lanesX - GRID.gutter * 2 - 4) / 2, colStep: 100, bottom: 690, rowStep: 104,
  /** 칸: 원판 40, 기호 18 · 지금 있는 칸은 바깥 테 4 띄워 2 */
  node: { d: 40, icon: 18, ring: 1, here: { gap: 4, width: 2 }, hover: { gap: 3, width: 2 } },
  /** 지나온 길은 실선, 갈 길은 점선 */
  link: { walked: 3, ahead: 2, dash: 6, walkedAlpha: 0.5, aheadAlpha: 0.3 },
  /** 갈 수 없는 칸 · 지나온 칸의 흐림 */
  dim: { far: 0.45, past: 0.7 },
  tipGap: 8,
};


/** 전체 미니맵: 오른쪽 열 맨 위, 정령 줄과 같은 왼쪽 끝 · 폭으로 눕힌 판 (왼쪽이 출발, 오른쪽이 보스). 보이는 여섯 층 구간에 옅은 띠 */
export const MINI = {
  x: GRID.lanesX, y: LANE.y, w: GRID.lanesW, h: 72, radius: LANE.radius, pad: 16,
  dot: 5, here: 8, line: 1, lineAlpha: 0.3, dotAlpha: 0.55, band: { pad: 6, radius: 6, alpha: 0.06 },
};

/** 슬림 파티 줄: 정령 줄(0046)의 접힌 상태. 고른 줄만 같은 자리에서 정령 줄 높이로 펼쳐요 */
export const SLIM = {
  ...SLIM_LANE, y: LANE.y + MINI.h + LANE.gap,
  /** 펼친 줄의 닫기: 오른쪽 위, 덱 보기와 같은 기호 버튼 */
  close: { right: 18, top: 14, h: 26, icon: 18, gap: 6 },
};

/** 펼친 줄의 아래쪽 (0046 f9): 머리 아래에 출처별 능력치 막대, 성격, 이번 판에 받은 카드가 같은 상자 안에 이어져요 */
export const SHEET = {
  /** 왼쪽 끝은 얼굴 고리와 같은 줄, 아래 여백 */
  padX: 29, pad: 24,
  /** 능력치 줄: 기호 · 값 · 막대 (기본 · 단계 · 그 밖) */
  stat: { rowH: 26, icon: 15, valueW: 30, gap: 8, bar: { w: 150, h: 6, gap: 2 }, baseAlpha: 0.45 },
  per: { gap: 10 },
  cards: { max: 3, gap: 8 },
  tipGap: 8,
};
