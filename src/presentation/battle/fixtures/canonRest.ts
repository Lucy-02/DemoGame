// 전투 R5 정본 "쉬는 상태" 프레임(design/canon/battle-r5, #rest)과 같은 장면.
// 시각 검증(pnpm visual)은 이 장면을 정본 스크린샷과 겹쳐 봐요.
import type { BattleVM } from "../viewmodel";

export const canonRest: BattleVM = {
  where: { area: "이슬 숲", floor: 5, turn: 3 },
  order: {
    slots: [
      { n: 1, art: "en-1", action: "i-claw" },
      { n: 2, art: "en-2", action: "i-weak" },
      { n: 3, art: "en-3", action: "i-hour", state: "now" },
    ],
    nextTurn: 4,
  },
};
