import { describe, expect, it } from "vitest";
import { Run } from "../core/run";
import { RewardSession } from "./reward";

const newRun = () => new Run({ seed: 5, frontId: "fire_fox", adult: false, unlockAll: true });

describe("보상 세션", () => {
  it("전투 보상: 카드는 주인에게 들어가고 한 번만 받아요", () => {
    const run = newRun();
    const s = new RewardSession(run, { kind: "battle", reward: run.rollBattleReward("battle") });
    const offer = s.offers[0];
    expect(offer.learners).toHaveLength(1);
    const before = run.deck.length;
    expect(s.dispatch({ kind: "take", cardId: offer.cardId, spirit: "nobody" })).toBe(false);
    expect(s.dispatch({ kind: "take", cardId: offer.cardId, spirit: offer.learners[0] })).toBe(true);
    expect(run.deck.at(-1)).toMatchObject({ cardId: offer.cardId, owner: offer.learners[0] });
    expect(s.done).toBe(true);
    expect(s.dispatch({ kind: "skip" })).toBe(false);
    expect(run.deck.length).toBe(before + 1);
  });

  it("전투 보상: 넘기면 골드를 받아요", () => {
    const run = newRun();
    const s = new RewardSession(run, { kind: "battle", reward: run.rollBattleReward("battle") });
    const gold = run.gold;
    expect(s.skipGold).toBeGreaterThan(0);
    s.dispatch({ kind: "skip" });
    expect(run.gold).toBe(gold + s.skipGold!);
  });

  it("카드 묶음: 배울 수 있는 정령 중에 골라요, 넘겨도 골드는 없어요", () => {
    const run = newRun();
    const cardId = run.rollCards(1, { common: 1 })[0].id;
    const s = new RewardSession(run, { kind: "cards", cardIds: [cardId] });
    expect(s.skipGold).toBeUndefined();
    const spirit = s.offers[0].learners.at(-1)!;
    s.dispatch({ kind: "take", cardId, spirit });
    expect(run.deck.at(-1)).toMatchObject({ cardId, owner: spirit });
  });
});
