// 전투 R5 정본 H1 프레임(design/canon/battle-r5, #h1)과 같은 장면: 물방울 휘갈기기를 집어 거북에 포인터를 올린 순간.
// 정본은 조준선을 그었지만, 0013부터는 줄 없이 대상 강조·나머지 흐림으로 보여요.
import type { BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

export const canonAim: BattleVM = {
  ...canonRest,
  // H1 프레임의 쉬는 필드에는 적 호버가 없어요
  enemies: canonRest.enemies.map((e) => ({ ...e, hovered: false, tip: undefined })),
  start: { card: "drops", mode: "held", over: { side: "enemy", i: 2 } },
};

/** 예시: 물방울 휘갈기기를 끌어 거북에 대는 중 */
export const exampleDrag: BattleVM = {
  ...canonAim,
  start: { card: "drops", mode: "drag", over: { side: "enemy", i: 2 } },
};

/** 예시: 끌기 시작했지만 아직 대상 위가 아님 (고를 수 있는 대상에 점선 고리) */
export const exampleDragField: BattleVM = {
  ...canonAim,
  start: { card: "drops", mode: "drag" },
};

/** 예시: 산들 바람을 아군(불 정령)에 대는 중. 결과 값이 없어 강조만 해요 */
export const exampleDragAlly: BattleVM = {
  ...canonAim,
  start: { card: "breeze", mode: "drag", over: { side: "ally", i: 1 } },
};

/** 예시(정본에 없음): 무작위 카드. 유성우를 낼 수 있게(마력 3) 바꾸고 필드로 끌어올린 상태 */
export const exampleDragRandom: BattleVM = {
  ...canonAim,
  mana: { n: 3, max: 4 },
  hand: canonAim.hand.map((g) => ({ ...g, cards: g.cards.map((c) => (c.key === "meteor" ? { ...c, off: false, detail: { ...c.detail, why: undefined } } : c)) })),
  plays: { ...canonAim.plays, meteor: { target: { kind: "random", side: "enemy" } } },
  start: { card: "meteor", mode: "drag" },
};
