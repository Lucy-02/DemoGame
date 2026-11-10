import { describe, expect, it } from "vitest";
import { cardProblems } from "./validate";

const ok = { id: "x", element: "fire", role: "attack", rarity: "common", cost: 1, ms: 1000, target: "enemy", effects: [{ op: "damage", value: 6 }], unlock: "start" };
const spirits = new Set(["fire_fox"]);

describe("카드 데이터 검사", () => {
  it("맞는 카드는 문제가 없어요", () => {
    expect(cardProblems(ok, spirits)).toEqual([]);
    expect(cardProblems({ ...ok, effects: [{ op: "combo", n: 2, then: [{ op: "draw", value: 1 }] }] }, spirits)).toEqual([]);
  });

  it("틀린 값을 하나씩 짚어요", () => {
    expect(cardProblems({ ...ok, element: "void" }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, cost: -1 }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, name: "이름" }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, startOwner: "nobody" }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, effects: [{ op: "explode" }] }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, spirit: "nobody" }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, obtain: "sky" }, spirits)).toHaveLength(1);
    expect(cardProblems({ ...ok, effects: [{ op: "combo", n: 2, then: [] }] }, spirits)).toHaveLength(1);
  });
});
