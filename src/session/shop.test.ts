import { describe, expect, it } from "vitest";
import { Run } from "../core/run";
import { ShopSession } from "./shop";

const shop = (gold: number) => {
  const run = new Run({ seed: 3, frontId: "fire_fox", adult: false, unlockAll: true });
  run.gold = gold;
  return new ShopSession(run);
};

describe("상점 세션", () => {
  it("카드를 사면 골드가 줄고 그 정령 덱에 들어가요", () => {
    const s = shop(500);
    const spirit = s.learners(0)[0];
    const before = s.run.deck.length;
    s.dispatch({ kind: "buy", slot: 0, spirit });
    expect(s.run.gold).toBe(500 - s.offers[0].price);
    expect(s.run.deck.length).toBe(before + 1);
    expect(s.run.deck.at(-1)).toMatchObject({ cardId: s.offers[0].card.id, owner: spirit });
    expect(s.offers[0].sold).toBe(true);
    // 팔린 카드는 다시 못 사요
    s.dispatch({ kind: "buy", slot: 0, spirit });
    expect(s.run.deck.length).toBe(before + 1);
  });

  it("골드가 모자라거나 배울 수 없는 정령이면 사지 못해요", () => {
    const poor = shop(0);
    poor.dispatch({ kind: "buy", slot: 0, spirit: poor.learners(0)[0] });
    expect(poor.offers[0].sold).toBe(false);
    const s = shop(500);
    s.dispatch({ kind: "buy", slot: 0, spirit: "nobody" });
    expect(s.offers[0].sold).toBe(false);
  });

  it("치료 미리보기는 상태를 바꾸지 않고, 치료는 한 번만 돼요", () => {
    const s = shop(500);
    s.run.spirits[0].hp = 1;
    const gain = s.healPreview();
    expect(s.run.spirits[0].hp).toBe(1);
    expect(gain[s.run.spirits[0].id]).toBeGreaterThan(0);
    s.dispatch({ kind: "heal" });
    expect(s.run.spirits[0].hp).toBe(1 + gain[s.run.spirits[0].id]);
    expect(s.run.gold).toBe(500 - s.healPrice);
    expect(s.canHeal()).toBe(false);
  });

  it("카드를 빼면 값만큼 골드가 줄고, 상점마다 한 번이며, 다음 상점은 값이 올라요", () => {
    const s = shop(500);
    const price = s.removePrice;
    const [a, b] = s.run.deck;
    s.dispatch({ kind: "remove", uid: a.uid });
    expect(s.run.gold).toBe(500 - price);
    expect(s.run.deck.some((c) => c.uid === a.uid)).toBe(false);
    expect(s.canRemove()).toBe(false);
    s.dispatch({ kind: "remove", uid: b.uid });
    expect(s.run.deck.some((c) => c.uid === b.uid)).toBe(true);
    expect(new ShopSession(s.run).removePrice).toBeGreaterThan(price);
  });

  it("골드가 모자라면 빼지 못해요", () => {
    const s = shop(0);
    s.dispatch({ kind: "remove", uid: s.run.deck[0].uid });
    expect(s.run.deck.length).toBe(shop(0).run.deck.length);
  });
});
