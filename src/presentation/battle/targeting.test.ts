import { describe, expect, it } from "vitest";
import { canonDropsOnTurtle } from "./fixtures/plays";
import { aimsAtEnemy, dimmed, focusFor, type Counts } from "./targeting";
import type { PlayVM } from "./viewmodel";

const counts: Counts = { enemy: 3, ally: 3 };
const drops: PlayVM = { target: { kind: "pick", side: "enemy" }, outcomes: { 2: canonDropsOnTurtle } };
const turtle = { side: "enemy", i: 2 } as const;

describe("대상 고르기", () => {
  it("고르는 카드를 대상에 대면 그 대상만 강조하고 결과를 보여요", () => {
    const f = focusFor("drops", drops, turtle, counts);
    expect(f.lit).toEqual([turtle]);
    expect(f.outcome).toBe(canonDropsOnTurtle);
    expect(f.ready).toEqual({ target: turtle });
  });

  it("대상이 아닌 곳이면 고를 수 있는 대상만 밝고, 낼 수 없어요", () => {
    for (const over of ["field", "hand", { side: "ally", i: 0 }] as const) {
      const f = focusFor("drops", drops, over, counts);
      expect(f.lit).toEqual([]);
      expect(f.cand).toHaveLength(3);
      expect(dimmed(f, { side: "enemy", i: 1 })).toBe(false);
      expect(dimmed(f, { side: "ally", i: 1 })).toBe(true);
      expect(f.ready).toBeUndefined();
    }
  });

  it("전체 카드는 필드로 올리면 그 편 모두 강조", () => {
    const f = focusFor("wave", { target: { kind: "all", side: "enemy" } }, "field", counts);
    expect(f.lit).toHaveLength(3);
    expect(f.ready).toEqual({});
    expect(focusFor("wave", { target: { kind: "all", side: "enemy" } }, "hand", counts).ready).toBeUndefined();
  });

  it("무작위 카드는 필드로 올려도 강조 없이 그 편만 밝게 (누가 맞을지 모름)", () => {
    const f = focusFor("meteor", { target: { kind: "random", side: "enemy" } }, "field", counts);
    expect(f.lit).toEqual([]);
    expect(f.cand).toHaveLength(3);
    expect(f.ready).toEqual({});
  });

  it("흐림: 강조·결과가 없는 캐릭터만. 받을 피해가 바뀌는 아군은 밝게", () => {
    const f = focusFor("drops", drops, turtle, counts);
    expect(dimmed(f, turtle)).toBe(false);
    expect(dimmed(f, { side: "enemy", i: 0 })).toBe(true);
    expect(dimmed(f, { side: "ally", i: 2 })).toBe(false);
    const noOutcome = focusFor("drops", drops, { side: "enemy", i: 0 }, counts);
    expect(dimmed(noOutcome, { side: "ally", i: 2 })).toBe(true);
  });

  it("only가 있으면 그 캐릭터만 고를 수 있어요 (해방 카드)", () => {
    const release: PlayVM = { target: { kind: "pick", side: "ally", only: 2 } };
    expect(focusFor("r", release, { side: "ally", i: 2 }, counts).ready).toEqual({ target: { side: "ally", i: 2 } });
    const other = focusFor("r", release, { side: "ally", i: 0 }, counts);
    expect(other.ready).toBeUndefined();
    expect(other.cand).toEqual([{ side: "ally", i: 2 }]);
  });

  it("약점 배지는 그 적을 대상으로 삼는 카드일 때만 켜요 (P2-13)", () => {
    expect(aimsAtEnemy(drops, 1)).toBe(true);
    expect(aimsAtEnemy({ target: { kind: "all", side: "enemy" } }, 0)).toBe(true);
    // 방어 · 자기 대상 카드, 땅속이라 고를 수 없는 적, 낼 수 없는 카드
    expect(aimsAtEnemy({ target: { kind: "all", side: "ally" } }, 0)).toBe(false);
    expect(aimsAtEnemy({ target: { kind: "pick", side: "enemy", not: [1] } }, 1)).toBe(false);
    expect(aimsAtEnemy(undefined, 0)).toBe(false);
  });
});
