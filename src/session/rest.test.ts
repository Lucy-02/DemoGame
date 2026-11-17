import { describe, expect, it } from "vitest";
import { C } from "../core/data";
import { Run } from "../core/run";
import { maxHpOf } from "../core/stats";
import { RestSession } from "./rest";

const rest = (hurt: boolean) => {
  const run = new Run({ seed: 3, frontId: "fire_fox", adult: false, unlockAll: true });
  if (hurt) for (const s of run.spirits) s.hp = 5;
  return new RestSession(run);
};

describe("휴식 세션 (0046 Lucy 답: 꼭 하나)", () => {
  it("쉬기는 모든 정령을 최대 HP의 rest_heal_pct만큼 회복하고 끝나요", () => {
    const s = rest(true);
    const gain = s.healPreview();
    expect(s.run.spirits.every((sp) => sp.hp === 5)).toBe(true);
    expect(s.dispatch({ kind: "rest" })).toBe(true);
    for (const sp of s.run.spirits) expect(sp.hp).toBe(Math.min(maxHpOf(sp), 5 + Math.round(maxHpOf(sp) * C.rest_heal_pct)));
    for (const sp of s.run.spirits) expect(gain[sp.id]).toBe(sp.hp - 5);
    expect(s.done).toBe(true);
    // 하나만
    expect(s.dispatch({ kind: "upgrade", uid: s.run.deck[0].uid })).toBe(false);
  });

  it("강화는 카드 한 장, 그 뒤엔 아무것도 못 해요", () => {
    const s = rest(true);
    const uid = s.upgradable()[0];
    expect(s.dispatch({ kind: "upgrade", uid })).toBe(true);
    expect(s.run.deck.find((c) => c.uid === uid)?.upgraded).toBe(true);
    expect(s.dispatch({ kind: "rest" })).toBe(false);
  });

  it("HP가 가득하면 쉬기를 못 하고, 할 것이 없을 때만 그냥 떠나요", () => {
    const s = rest(false);
    expect(s.canRest()).toBe(false);
    expect(s.canUpgrade()).toBe(true);
    expect(s.canLeaveEmpty()).toBe(false);
    for (const c of s.run.deck) if (s.run.canUpgrade(c.uid)) s.run.upgradeCard(c.uid);
    expect(s.canLeaveEmpty()).toBe(true);
  });
});
