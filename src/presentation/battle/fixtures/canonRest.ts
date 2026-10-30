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
  allies: [
    { face: "star", art: "sil-star", hp: 19, maxHp: 34, incoming: 18, statuses: [{ icon: "i-burn", n: 2 }], sync: 20 },
    { face: "fire", art: "sil-fire", hp: 28, maxHp: 38, incoming: 18, statuses: [{ icon: "i-weak", n: 1 }], sync: 40 },
    { face: "jelly", art: "sil-jelly", hp: 44, maxHp: 52, block: 6, incoming: 30, statuses: [{ icon: "i-snow", n: 1 }], sync: 65, front: true },
  ],
  enemies: [
    {
      art: "en-1", hp: 18, maxHp: 30, block: 4, element: "e-none", weakTo: "e-fire", statuses: [{ icon: "i-burn", n: 3 }],
      intent: { kind: "attack", order: 1, icon: "i-claw", amount: "6×2", target: "jelly" },
    },
    {
      art: "en-2", hp: 12, maxHp: 22, element: "e-wind", weakTo: "e-fire",
      statuses: [{ icon: "i-snow", n: 1 }, { icon: "i-vuln", n: 1 }],
      intent: { kind: "debuff", order: 2, icon: "i-weak", label: "약화", amount: "2", target: "fire" },
    },
    {
      art: "en-3", hp: 41, maxHp: 48, block: 4, element: "e-water", weakTo: "e-wind", statuses: [],
      intent: { kind: "charge", order: 3, icon: "i-hour", amount: "18", target: "all" },
      shield: { broken: 1, total: 3 }, hovered: true,
    },
  ],
};
