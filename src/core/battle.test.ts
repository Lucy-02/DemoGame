// 카드 동작이 효과 문구와 같은지 (결정 0022: 문구 의도대로 규칙을 고친 카드들)
import { describe, expect, it } from "vitest";
import { Battle, type BCard } from "./battle";
import { Rng } from "./rng";
import { Run } from "./run";

const OWNER = "mist_cat";

/** 손을 원하는 카드로 바꿔 둔 전투 */
function battleWith(...cardIds: string[]): Battle {
  const run = new Run({ seed: 1, frontId: "glass_salamander", adult: false, unlockAll: true });
  const b = new Battle(run.spirits, [], ["moss_slime"], run.frontId, new Rng(1));
  b.hand = cardIds.map((cardId, i) => card(cardId, i));
  b.drain();
  return b;
}

const card = (cardId: string, i: number): BCard =>
  ({ uid: 100 + i, cardId, owner: OWNER, tempCostDelta: 0, locked: false, isCopy: false, grow: 0 });

describe("문구대로 동작하는 카드 (0022)", () => {
  it("함께 외치기: 모든 아군의 싱크로율이 10%p 오릅니다", () => {
    const b = battleWith("rally");
    const before = new Map(b.spirits.map((s) => [s.id, s.sync]));
    b.play(100);
    // 카드 주인은 카드를 쓸 때 받는 싱크로율이 더 붙어요
    for (const s of b.spirits) expect(s.sync - before.get(s.id)!, s.id).toBeGreaterThanOrEqual(10);
    expect(b.spirits.filter((s) => s.id !== OWNER).map((s) => s.sync - before.get(s.id)!)).toEqual([10, 10]);
  });

  it("담금질 유리: 모든 아군이 방어도와 반격을 얻습니다", () => {
    const b = battleWith("tempered_glass");
    b.play(100);
    expect(b.spirits.every((s) => s.block > 0 && s.thorns > 0)).toBe(true);
  });

  it("뿌리내리기: 비율이 아니라 HP가 가장 낮은 아군을 회복합니다", () => {
    const b = battleWith();
    const [a, c] = [b.spirits[0], b.spirits[1]];
    // a는 HP 비율이 더 낮고(10/20), c는 HP 값이 더 낮아요(8 < 10)
    a.maxHp = 20; a.hp = 10;
    c.maxHp = 10; c.hp = 8;
    b.spirits[2].hp = b.spirits[2].maxHp;
    b.spirits[2].auras.set("root_down", 1);
    b.endTurn();
    const heals = b.drain().filter((e) => e.k === "heal" && e.amount > 0);
    expect(heals[0]).toMatchObject({ ref: { id: c.id } });
  });

  it("바람길: 이번 턴에만 다음 카드를 한 번 더 발동합니다", () => {
    const b = battleWith("ride_the_wind");
    b.play(100);
    b.endTurn();
    b.hand.push(card("fire_claw", 1));
    b.drain();
    b.play(101, { side: "e", uid: 1 });
    expect(b.drain().some((e) => e.k === "log" && e.text.includes("한 번 더"))).toBe(false);
  });
});
