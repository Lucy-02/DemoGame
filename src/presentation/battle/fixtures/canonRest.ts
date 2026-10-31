// 전투 R5 정본 "쉬는 상태" 프레임(design/canon/battle-r5, #rest)과 같은 장면.
// 시각 검증(pnpm visual)은 이 장면을 정본 스크린샷과 겹쳐 봐요.
import type { CardVM } from "../../card/viewmodel";
import type { BattleVM } from "../viewmodel";
import { examplePlays } from "./plays";

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
        star({ key: "meteor", name: "유성우", cost: 3, costShort: true, material: "none", art: "i-meteor", element: "e-none", values: [{ icon: "i-hit", n: 4, mult: 4 }], off: true, mark: "i-dice",
          detail: { text: [{ text: "무작위 적에게 피해를 " }, { text: "4", strong: true }, { text: "씩 " }, { text: "4", strong: true }, { text: "번 입힙니다. 맞을 때마다 " }, { text: "실드 칸", term: true }, { text: "을 하나씩 깹니다." }], why: "마력이 모자라요 · 3 필요, 지금 2", owner: "별 정령 · 무속성 · 무지" } }),
        star({ key: "pierce", name: "별빛 찌르기", cost: 1, material: "none", art: "i-spark", element: "e-none", values: [{ icon: "i-hit", n: 7, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "7", strong: true }, { text: " 입힙니다." }], calc: [{ text: "기본 6 + 파워 1 = " }, { text: "7", strong: true }], owner: "별 정령 · 무속성 · 무지" } }),
        star({ key: "breeze", name: "산들 바람", cost: 1, material: "wind", art: "e-wind", element: "e-wind", values: [{ icon: "i-shield", n: 5 }],
          detail: { text: [{ text: "아군 하나에게 방어도를 " }, { text: "5", strong: true }, { text: " 줍니다." }], owner: "별 정령 · 바람 · 비단" } }),
      ],
    },
    {
      owner: "fire",
      cards: [
        fire({ key: "claw", name: "불꽃 할퀴기", cost: 1, material: "fire", art: "i-claw", element: "e-fire", values: [{ icon: "i-hit", n: 9, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "9", strong: true }, { text: " 입힙니다." }], calc: [{ text: "기본 7 + 파워 2 = " }, { text: "9", strong: true }], owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "blast", name: "불씨 폭발", cost: 2, material: "fire", art: "i-burst", element: "e-fire", values: [{ icon: "i-hit", n: 15 }], off: true, why: "싱크 50 필요",
          detail: { text: [{ text: "피해를 " }, { text: "15", strong: true }, { text: " 입힙니다. 불 정령의 싱크가 50 이상일 때만 사용할 수 있습니다." }], why: "불 정령 싱크 40 · 50 필요", owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "heat", name: "달구기", cost: 1, material: "fire", art: "e-fire", element: "e-fire", values: [{ icon: "i-burn", n: 4 }],
          detail: { text: [{ text: "화상", term: true }, { text: "을 " }, { text: "4", strong: true }, { text: " 부여합니다." }], owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "counter", name: "맞불", cost: 1, material: "fire", art: "i-twin", element: "e-fire", values: [{ icon: "i-hit", n: 6 }, { icon: "i-shield", n: 3 }],
          detail: { text: [{ text: "피해를 " }, { text: "6", strong: true }, { text: " 입힙니다. 불 정령이 방어도를 " }, { text: "3", strong: true }, { text: " 얻습니다." }], owner: "불 정령 · 불 · 용암석" } }),
      ],
    },
    {
      owner: "jelly",
      cards: [
        jelly({ key: "zap", name: "찌릿 촉수", cost: 1, material: "water", art: "i-bolt", element: "e-water", values: [{ icon: "i-hit", n: 5 }, { icon: "i-snow", n: 1 }],
          detail: { text: [{ text: "피해를 " }, { text: "5", strong: true }, { text: " 입힙니다. " }, { text: "냉기", term: true }, { text: "를 " }, { text: "1", strong: true }, { text: " 부여합니다." }], owner: "해파리 정령 · 물 · 유약" } }),
        jelly({ key: "drops", name: "물방울 휘갈기기", cost: 1, material: "water", art: "i-drops", element: "e-water", values: [{ icon: "i-hit", n: 3, mult: 2, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "3", strong: true }, { text: "씩 " }, { text: "2", strong: true }, { text: "번 입힙니다. 맞을 때마다 " }, { text: "실드 칸", term: true }, { text: "을 하나씩 깹니다." }], calc: [{ text: "기본 2 + 파워 1 = " }, { text: "3", strong: true }], owner: "해파리 정령 · 물 · 유약" } }),
        jelly({ key: "veil", name: "물결 장막", cost: 2, material: "water", art: "i-veil", element: "e-water", values: [{ icon: "i-shield", n: 8 }],
          detail: { text: [{ text: "아군 하나에게 방어도를 " }, { text: "8", strong: true }, { text: " 줍니다." }], owner: "해파리 정령 · 물 · 유약" } }),
      ],
    },
  ],
  playable: 8,
  piles: { draw: 9, discard: 2, exhaust: 1 },
  plays: examplePlays,
};
