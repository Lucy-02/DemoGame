// 판 안 메뉴 · 포기 확인 · 설정 창 배치 (0084 · 0085). 줄 · 강조 줄 · 창 틀은 메인 화면과 전투 위 창의 값을 그대로 쓰고,
// 여기 값은 실제 화면에서 견준 임시 값이에요 (Lucy 확인 전, 토큰 아님).
import { MENU, PRIMARY, TIP } from "../home/layout";
import { WINDOW } from "../result/layout";
import { FRAME } from "../run/layout";

export { FRAME };

/** 판 안 메뉴: 메인 화면 메뉴와 같은 줄(폭 400 · 높이 50 · 사이 10), 맨 위 강조 줄 `계속`. 탐험 포기는 한 칸 띄워 맨 아래 */
export const RUN_MENU = {
  w: MENU.w, pad: WINDOW.pad, gap: MENU.gap, rowH: MENU.row.h, primaryH: PRIMARY.h, below: PRIMARY.below,
  /** 말풍선: 창 오른쪽 22, 줄 위쪽보다 7 위 (메인 화면 .c1-tip) */
  tip: TIP,
};

/** 포기 확인 창: 제목 + 버튼 둘 (덱 고르기 확인 줄과 같은 높이 48 · 사이 12) */
export const CONFIRM = { w: 360, pad: WINDOW.pad, gap: 24, btnH: 48, btnGap: 12, radius: 12 };

/** 설정 창: 머리(톱니 + 이름, 오른쪽 끝 닫기) + 줄(이름 왼쪽, 조작 오른쪽). 묶음 사이는 가는 선 */
export const SETTINGS = {
  w: 480, pad: WINDOW.pad,
  /** 머리: 덱 보기 창 머리와 같은 높이 26 · 기호 18 */
  head: { h: 26, icon: 18, gap: 10, below: 16 },
  close: { icon: 18, gap: 6 },
  row: { h: 46 }, rule: { gap: 8 },
  /** 볼륨 막대: 길 200×6, 손잡이 18, 숫자 칸 40. 5 단위로 움직여요 */
  slider: { w: 200, track: 6, knob: 18, num: 40, gap: 12, step: 0.05 },
  /** 켜고 끄는 알약: 44×24, 손잡이 16 */
  toggle: { w: 44, h: 24, knob: 16 },
  /** 둘 중 하나: 칸 84×34 사이 6 */
  seg: { w: 84, h: 34, gap: 6, radius: 10 },
  tip: TIP,
};
