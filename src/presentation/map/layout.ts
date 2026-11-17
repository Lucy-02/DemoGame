// 지도 화면 배치 (한 막 전체 지도 + 오른쪽 열 맨 위 슬림 파티 줄, Lucy 2026-11-17. 0076 18번의 R2 지도 C를 대체해요). 값은 묶음 A 정리안 f9(0046)에서 잰 임시 값이에요 (TODO_TOKEN).
import { SYS } from "../battle/layout";
import { FRAME, GOLD, GRID, LANE } from "../run/layout";

export { FRAME };

/** 큰 지도: 한 막 전체(출발 + 층들 + 보스)를 줄 간격을 줄여 한 번에 보여요 (Lucy 2026-11-17, 미니맵 없음). 아래가 출발, 위가 보스 */
export const PATH = {
  /** 왼쪽 열(48~612) 가로 가운데에 네 줄 */
  cx: GRID.gutter + (GRID.lanesX - GRID.gutter * 2 - 4) / 2, colStep: 100, bottom: 716, rowStep: 78,
  /** 칸: 원판 40, 기호 18 · 지금 있는 칸은 바깥 테 4 띄워 2 */
  node: { d: 40, icon: 18, ring: 1, here: { gap: 4, width: 2 }, hover: { gap: 3, width: 2 } },
  /** 지나온 길은 실선, 갈 길은 점선 */
  link: { walked: 3, ahead: 2, dash: 6, walkedAlpha: 0.5, aheadAlpha: 0.3 },
  /** 갈 수 없는 칸 · 지나온 칸의 흐림 */
  dim: { far: 0.45, past: 0.7 },
  tipGap: 8,
};

/** 골드: 오른쪽 위 버튼 줄과 같은 높이 */
export const GOLD_AT = { x: GRID.gutter, y: SYS.top + (SYS.button - GOLD.h) / 2 };

/** 슬림 파티 줄: 정령 줄(0046)의 접힌 상태. 고른 줄만 같은 자리에서 정령 줄 높이로 펼쳐요 */
export const SLIM = {
  x: GRID.lanesX, y: LANE.y, w: GRID.lanesW, h: 52, gap: LANE.gap, radius: LANE.radius,
  ring: { x: 16, d: 40, r: 18, stroke: 3, faceInset: 5 },
  name: { x: 73, gap: 10 },
  hp: { x: 301, w: 132, h: 8, numX: 443, numGap: 2 },
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
