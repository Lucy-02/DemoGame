// 전투 R5 정본 "쉬는 상태" 프레임(design/canon/battle-r5, #rest)과 같은 장면.
// 시각 검증(pnpm visual)은 이 장면을 정본 스크린샷과 겹쳐 봐요.
import type { CardVM } from "../../card/viewmodel";
import type { BattleVM } from "../viewmodel";

const star = (c: Omit<CardVM, "owner">): CardVM => ({ ...c, owner: "star" });
const fire = (c: Omit<CardVM, "owner">): CardVM => ({ ...c, owner: "fire" });
const jelly = (c: Omit<CardVM, "owner">): CardVM => ({ ...c, owner: "jelly" });

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
      tip: {
        name: "껍질 거북", rank: "정예",
        lines: [
          [{ text: "해일 · 이번 적 차례에 아군 전체에게 " }, { text: "18", strong: true }],
          [{ text: "실드 칸 " }, { text: "1", strong: true }, { text: "/3 깨짐 · 다 깨면 차징이 끊겨요" }],
          [{ text: "속성 물 · 약점 바람" }],
        ],
      },
    },
  ],
  mana: { n: 2, max: 4 },
  hand: [
    {
      owner: "star",
      cards: [
        star({ name: "유성우", cost: 3, costShort: true, material: "none", art: "i-meteor", element: "e-none", values: [{ icon: "i-hit", n: 4, mult: 4 }], off: true, mark: "i-dice" }),
        star({ name: "별빛 찌르기", cost: 1, material: "none", art: "i-spark", element: "e-none", values: [{ icon: "i-hit", n: 7, up: true }] }),
        star({ name: "산들 바람", cost: 1, material: "wind", art: "e-wind", element: "e-wind", values: [{ icon: "i-shield", n: 5 }] }),
      ],
    },
    {
      owner: "fire",
      cards: [
        fire({ name: "불꽃 할퀴기", cost: 1, material: "fire", art: "i-claw", element: "e-fire", values: [{ icon: "i-hit", n: 9, up: true }] }),
        fire({ name: "불씨 폭발", cost: 2, material: "fire", art: "i-burst", element: "e-fire", values: [{ icon: "i-hit", n: 15 }], off: true, why: "싱크 50 필요" }),
        fire({ name: "달구기", cost: 1, material: "fire", art: "e-fire", element: "e-fire", values: [{ icon: "i-burn", n: 4 }] }),
        fire({ name: "맞불", cost: 1, material: "fire", art: "i-twin", element: "e-fire", values: [{ icon: "i-hit", n: 6 }, { icon: "i-shield", n: 3 }] }),
      ],
    },
    {
      owner: "jelly",
      cards: [
        jelly({ name: "찌릿 촉수", cost: 1, material: "water", art: "i-bolt", element: "e-water", values: [{ icon: "i-hit", n: 5 }, { icon: "i-snow", n: 1 }] }),
        jelly({ name: "물방울 휘갈기기", cost: 1, material: "water", art: "i-drops", element: "e-water", values: [{ icon: "i-hit", n: 3, mult: 2, up: true }] }),
        jelly({ name: "물결 장막", cost: 2, material: "water", art: "i-veil", element: "e-water", values: [{ icon: "i-shield", n: 8 }] }),
      ],
    },
  ],
  playable: 8,
  piles: { draw: 9, discard: 2, exhaust: 1 },
};
