// 고정 장면 고르기 (?scene=…). session 층이 생기면 실제 전투 상태가 이 자리를 대신해요.
import type { BattleVM } from "../viewmodel";
import { canonAim, exampleDrag, exampleDragAlly, exampleDragField, exampleDragRandom, exampleWeak } from "./canonAim";
import { exampleCardArt } from "./cardArt";
import { canonRest } from "./canonRest";
import { exampleCrowded } from "./crowded";
import { exampleEquip } from "./equip";
import { exampleAct2Band, exampleAct2Buried, exampleAct2Plan } from "./act2";
import { exampleOrderPlan, exampleOrderPlay } from "./order";

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
  /** 예시: 장비를 지닌 아군 (0066). ?hover=unit:ally:1 로 설명판의 장비 칸 */
  equip: exampleEquip,
  /** 예시: 든 카드의 속성이 약점인 적 (약점 배지 켜짐) */
  weak: exampleWeak,
  /** 예시: 순서표 토큰 상태 (0074). 계획 중 · 재생 중 */
  "order-plan": exampleOrderPlan,
  "order-play": exampleOrderPlay,
  /** 예시: 2막 새 규칙 (0096). 방전 띠 · 띠 위 카드 · 땅속 적. 실제 규칙으로 만들어서 getter로 늦게 만들어요 */
  get "act2-band"() { return exampleAct2Band(); },
  get "act2-plan"() { return exampleAct2Plan(); },
  get "act2-buried"() { return exampleAct2Buried(); },
  /** 예시: 꽉 찬 정보 묶음 (상태 다섯, 치명 받을 피해) */
  crowded: exampleCrowded,
};
