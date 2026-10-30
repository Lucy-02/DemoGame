// 고정 장면 고르기 (?scene=…). session 층이 생기면 실제 전투 상태가 이 자리를 대신해요.
import type { BattleVM } from "../viewmodel";
import { canonAim, exampleAimAll, exampleAimLeft, exampleAimPick } from "./canonAim";
import { canonRest } from "./canonRest";

export const FIXTURES: Record<string, BattleVM> = {
  /** 정본 쉬는 상태 (#rest) */
  rest: canonRest,
  /** 정본 H1: 물방울 휘갈기기를 집어 거북 조준 (#h1) */
  aim: canonAim,
  /** 예시(정본에 없음): 전체 대상, 조준선 없음 */
  "aim-all": exampleAimAll,
  /** 예시(정본에 없음): 둘 고르기, 줄기에서 갈라짐 */
  "aim-pick": exampleAimPick,
  /** 예시(정본에 없음): 왼쪽 적 하나 */
  "aim-left": exampleAimLeft,
};
