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
      { n: 2, art: "en-2", action: "kw-weak" },
      { n: 3, art: "en-3", action: "kw-charge", state: "now" },
    ],
    nextTurn: 4,
  },
  allies: [
    { face: "star", art: "sil-star", hp: 19, maxHp: 34, incoming: 18, statuses: [{ icon: "kw-burn", n: 2 }] },
    { face: "fire", art: "sil-fire", hp: 28, maxHp: 38, incoming: 18, statuses: [{ icon: "kw-weak", n: 1 }] },
    { face: "jelly", art: "sil-jelly", hp: 44, maxHp: 52, block: 6, incoming: 30, statuses: [{ icon: "kw-chill", n: 1 }], front: true },
  ],
  enemies: [
    {
      art: "en-1", hp: 18, maxHp: 30, block: 4, element: "el-none", statuses: [{ icon: "kw-burn", n: 3 }],
      intent: { kind: "attack", order: 1, icon: "i-claw", amount: "6×2", target: "jelly" },
    },
    {
      art: "en-2", hp: 12, maxHp: 22, element: "el-wind",
      statuses: [{ icon: "kw-chill", n: 1 }, { icon: "kw-vuln", n: 1 }],
      intent: { kind: "debuff", order: 2, icon: "kw-weak", amount: "2", target: "fire" },
    },
    {
      art: "en-3", hp: 41, maxHp: 48, block: 4, element: "el-water", weakTo: "el-ice", statuses: [],
      intent: { kind: "charge", order: 3, icon: "kw-charge", amount: "18", target: "all" },
      hovered: true,
      tip: {
        name: "껍질 거북", rank: "정예",
        lines: [
          [{ text: "해일 · 이번 적 차례에 모든 아군에게 피해를 " }, { text: "18", strong: true }, { text: " 입힙니다." }],
          [{ text: "브레이크", term: true }, { text: " 가능" }],
        ],
      },
    },
  ],
  mana: { n: 2, max: 4 },
  hand: [
    {
      owner: "star",
      cards: [
        star({ key: "meteor", name: "유성우", cost: 3, costShort: true, material: "none", art: "i-meteor", element: "el-none", values: [{ icon: "fx-damage", n: 4, mult: 4 }], off: true, mark: "i-dice",
          detail: { text: [{ text: "무작위 적에게 피해를 " }, { text: "4", strong: true }, { text: "씩 " }, { text: "4", strong: true }, { text: "번 입힙니다." }], why: "마력이 모자라요 · 3 필요, 지금 2", owner: "별 정령 · 무속성 · 무지" } }),
        star({ key: "pierce", name: "별빛 찌르기", cost: 1, material: "none", art: "i-spark", element: "el-none", values: [{ icon: "fx-damage", n: 7, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "7", strong: true }, { text: " 입힙니다." }], calc: [{ text: "기본 6 + 파워 1 = " }, { text: "7", strong: true }], owner: "별 정령 · 무속성 · 무지" } }),
        star({ key: "breeze", name: "산들 바람", cost: 1, material: "wind", art: "el-wind", element: "el-wind", values: [{ icon: "fx-block", n: 5 }],
          detail: { text: [{ text: "아군 하나에게 방어도를 " }, { text: "5", strong: true }, { text: " 줍니다." }], owner: "별 정령 · 바람 · 비단" } }),
      ],
    },
    {
      owner: "fire",
      cards: [
        fire({ key: "claw", name: "불꽃 할퀴기", cost: 1, material: "fire", art: "i-claw", element: "el-fire", values: [{ icon: "fx-damage", n: 9, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "9", strong: true }, { text: " 입힙니다." }], calc: [{ text: "기본 7 + 파워 2 = " }, { text: "9", strong: true }], owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "blast", name: "불씨 폭발", cost: 2, material: "fire", art: "i-burst", element: "el-fire", values: [{ icon: "fx-damage", n: 15 }], off: true, why: "화상 필요",
          detail: { text: [{ text: "피해를 " }, { text: "15", strong: true }, { text: " 입힙니다. 화상이 있는 적에게만 사용할 수 있습니다." }], why: "화상이 있는 적 없음", owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "heat", name: "달구기", cost: 1, material: "fire", art: "el-fire", element: "el-fire", values: [{ icon: "kw-burn", n: 4 }],
          detail: { text: [{ text: "화상", term: true }, { text: "을 " }, { text: "4", strong: true }, { text: " 부여합니다." }], owner: "불 정령 · 불 · 용암석" } }),
        fire({ key: "counter", name: "맞불", cost: 1, material: "fire", art: "i-twin", element: "el-fire", values: [{ icon: "fx-damage", n: 6 }, { icon: "fx-block", n: 3 }],
          detail: { text: [{ text: "피해를 " }, { text: "6", strong: true }, { text: " 입힙니다. 불 정령이 방어도를 " }, { text: "3", strong: true }, { text: " 얻습니다." }], owner: "불 정령 · 불 · 용암석" } }),
      ],
    },
    {
      owner: "jelly",
      cards: [
        jelly({ key: "zap", name: "찌릿 촉수", cost: 1, material: "water", art: "i-bolt", element: "el-water", values: [{ icon: "fx-damage", n: 5 }, { icon: "kw-chill", n: 1 }],
          detail: { text: [{ text: "피해를 " }, { text: "5", strong: true }, { text: " 입힙니다. " }, { text: "냉기", term: true }, { text: "를 " }, { text: "1", strong: true }, { text: " 부여합니다." }], owner: "해파리 정령 · 물 · 유약" } }),
        jelly({ key: "drops", name: "물방울 휘갈기기", cost: 1, material: "water", art: "i-drops", element: "el-water", values: [{ icon: "fx-damage", n: 3, mult: 2, up: true }],
          detail: { text: [{ text: "피해를 " }, { text: "3", strong: true }, { text: "씩 " }, { text: "2", strong: true }, { text: "번 입힙니다. " }, { text: "브레이크", term: true }, { text: "." }], calc: [{ text: "기본 2 + 파워 1 = " }, { text: "3", strong: true }], owner: "해파리 정령 · 물 · 유약" } }),
        jelly({ key: "veil", name: "물결 장막", cost: 2, material: "water", art: "i-veil", element: "el-water", values: [{ icon: "fx-block", n: 8 }],
          detail: { text: [{ text: "아군 하나에게 방어도를 " }, { text: "8", strong: true }, { text: " 줍니다." }], owner: "해파리 정령 · 물 · 유약" } }),
      ],
    },
  ],
  playable: 8,
  piles: { draw: 9, discard: 2, exhaust: 1 },
  plays: examplePlays,
};
