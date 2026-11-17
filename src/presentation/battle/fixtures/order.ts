// 예시: 순서표 토큰 상태 모음 (0074). plan = 계획 중(허점 · 차징 · 든 카드 자리 · 끊김 예정 · +n), play = 재생 중(지나감 · 지금 차례 · 끊김).
import type { AllyTokenVM, BattleVM } from "../viewmodel";
import { canonRest } from "./canonRest";

const card = (face: string, more: Partial<AllyTokenVM> = {}): AllyTokenVM => ({ face, icon: "fx-damage", ...more });

export const exampleOrderPlan: BattleVM = {
  ...canonRest,
  order: {
    head: { place: "3층", turn: 3 },
    slots: [
      { n: 1, art: "en-1", action: "fx-damage", enemy: 0 },
      { n: 2, art: "en-2", action: "fx-damage", charge: true, cut: "plan", enemy: 1 },
      { n: 3, art: "en-3", action: "fx-damage", charge: true, enemy: 2 },
      { n: 4, art: "en-1", action: "fx-block", enemy: 0 },
    ],
    bundles: [
      [card("fire"), card("jelly", { icon: "fx-block" }), card("star", { mark: "release" })],
      [card("fire", { mark: "gap" }), card("star", { mark: "held" })],
      [card("fire"), card("jelly"), card("star"), card("fire"), card("jelly"), card("star")],
      [],
      [],
    ],
  },
};

export const exampleOrderPlay: BattleVM = {
  ...canonRest,
  order: {
    head: { place: "3층", turn: 3 },
    slots: [
      { n: 1, art: "en-1", action: "fx-damage", state: "past", enemy: 0 },
      { n: 2, art: "en-2", action: "fx-damage", cut: "done", enemy: 1 },
      { n: 3, art: "en-3", action: "fx-damage", state: "now", enemy: 2 },
      { n: 4, art: "en-1", action: "fx-block", enemy: 0 },
    ],
    bundles: [
      [card("fire", { past: true }), card("jelly", { past: true, icon: "fx-block" })],
      [card("fire", { past: true })],
      [card("star")],
      [],
      [card("jelly")],
    ],
  },
};
