// 전투 R5 정본 H1 프레임(design/canon/battle-r5, #h1)과 같은 장면: 물방울 휘갈기기를 집어 거북을 조준한 순간.
// 미리보기 숫자는 정본에 적힌 예시 값 그대로예요. 카드 효과·밸런스가 정해지면 session 층이 계산해서 채우고, 이 파일은 지워요.
import type { BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

export const canonAim: BattleVM = {
  ...canonRest,
  // H1 프레임의 쉬는 필드에는 적 호버가 없어요
  enemies: canonRest.enemies.map((e) => ({ ...e, hovered: false, tip: undefined })),
  aim: {
    card: "drops",
    targets: [
      { enemy: 2, hits: [3, 3], block: { from: 4, to: 0 }, hp: { from: 41, to: 39 }, shieldBreak: 2, cut: true },
    ],
    candidates: [0, 1],
    incoming: [{ from: 18, to: 0 }, { from: 18, to: 0 }, { from: 30, to: 12 }],
  },
};

/** 예시(정본에 없음): 전체 대상 카드. 시작점 하나에서 조준선이 여러 대상으로 퍼지는 모양을 보려고 둔 자리 채움이에요. */
export const exampleAimAll: BattleVM = {
  ...canonAim,
  aim: {
    card: "drops",
    targets: [
      { enemy: 0, hits: [3], block: { from: 4, to: 1 }, hp: { from: 18, to: 18 } },
      { enemy: 1, hits: [3], hp: { from: 12, to: 9 } },
      { enemy: 2, hits: [3], block: { from: 4, to: 1 }, hp: { from: 41, to: 41 }, shieldBreak: 1 },
    ],
    candidates: [],
    incoming: [undefined, undefined, undefined],
  },
};
