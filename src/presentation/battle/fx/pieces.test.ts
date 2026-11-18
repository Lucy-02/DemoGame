// 카드 연출 조각: 128장이 모두 조각으로 풀리는지
import { describe, expect, it } from "vitest";
import { CARD_FILES } from "../../../data/cards";
import type { CardData } from "../../../core/types";
import { PIECE_OF, PIECES, cardFx } from "./pieces";

const cards = Object.values(CARD_FILES).flat() as CardData[];

describe("카드 연출 조각", () => {
  it("모든 카드의 모든 op가 조각을 가져요", () => {
    for (const card of cards) for (const op of card.effects) expect(PIECE_OF[op.op], `${card.id}: ${op.op}`).toBeDefined();
  });
  it("카드마다 조각이 하나 이상이고, 아는 조각뿐이에요", () => {
    for (const card of cards) {
      const fx = cardFx(card);
      expect(fx.pieces.length, card.id).toBeGreaterThan(0);
      for (const p of fx.pieces) expect(PIECES, card.id).toContain(p);
    }
  });
  it("치기는 대상과 횟수로 갈려요", () => {
    const of = (id: string) => cardFx(cards.find((c) => c.id === id)!);
    expect(of("fire_claw").pieces).toEqual(["strike"]);
    expect(of("double_strike").pieces).toEqual(["multi"]);
    expect(of("fire_storm").pieces).toEqual(["sweep", "burn"]);
    expect(of("landslide")).toMatchObject({ pieces: ["sweep", "break"], weight: "heavy", tier: "payoff" });
    expect(of("glass_scale")).toMatchObject({ pieces: ["wall"], weight: "light", tier: "plain" });
  });
});
