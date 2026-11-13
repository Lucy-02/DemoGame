// 고정 장면 고르기 (?scene=…). session 층이 생기면 실제 전투 상태가 이 자리를 대신해요.
import type { BattleVM } from "../viewmodel";
import { canonAim, exampleDrag, exampleDragAlly, exampleDragField, exampleDragRandom } from "./canonAim";
import { exampleCardArt } from "./cardArt";
import { canonRest } from "./canonRest";
import { exampleCrowded } from "./crowded";
import { exampleEquip } from "./equip";

export const FIXTURES: Record<string, BattleVM> = {
  /** 정본 쉬는 상태 (#rest) */
  rest: canonRest,
  /** 정본 H1: 물방울 휘갈기기를 집어 거북에 포인터 (#h1, 조준선 대신 강조) */
  aim: canonAim,
  /** 예시: 물방울 휘갈기기를 끌어 거북에 댐 */
  drag: exampleDrag,
  /** 예시: 끄는 중, 대상 위 아님 */
  "drag-field": exampleDragField,
  /** 예시: 산들 바람을 아군에 댐 */
  "drag-ally": exampleDragAlly,
  /** 예시: 무작위 카드를 필드로 끌어올림 */
  "drag-random": exampleDragRandom,
  /** 예시: 손패에 카드 일러스트 (물방울 휘갈기기·물결 장막은 그림 없음) */
  art: exampleCardArt,
  /** 예시: 장비를 지닌 아군 (0066). ?hover=equip:1:0 으로 말풍선 */
  equip: exampleEquip,
  /** 예시: 꽉 찬 정보판 (상태 다섯, 치명 받을 피해) */
  crowded: exampleCrowded,
};
