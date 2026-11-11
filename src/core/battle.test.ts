// 카드 동작이 효과 문구와 같은지 (결정 0022: 문구 의도대로 규칙을 고친 카드들)
import { describe, expect, it } from "vitest";
import { Battle, type BCard } from "./battle";
import { stackOf } from "./battle/state";
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
  ({ uid: 100 + i, cardId, owner: OWNER, tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false });

describe("문구대로 동작하는 카드 (0022)", () => {
  it("잉걸 비늘: 벽 방어도와 반격을 얻습니다", () => {
    const b = battleWith("glass_skin");
    b.play(100);
    b.endTurn();
    const ev = b.drain();
    expect(ev.some((e) => e.k === "block" && e.ref.side === "s" && e.ref.id === OWNER && e.amount > 0)).toBe(true);
    expect(ev.some((e) => e.k === "status" && e.ref.side === "s" && e.ref.id === OWNER && e.text.startsWith("반격"))).toBe(true);
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
    b.endTurn();
    expect(b.drain().some((e) => e.k === "log" && e.text.includes("한 번 더"))).toBe(false);
  });
});

describe("해방 (0036)", () => {
  it("각성체만, 전투마다 한 번 해방해요", () => {
    const b = battleWith();
    const cat = b.spirit(OWNER);
    expect(b.canRelease(OWNER)).toBe(false);
    cat.run = { ...cat.run, stage: "awakened" };
    expect(b.release(OWNER)).toBe(true);
    expect(cat.release).toBeGreaterThan(0);
    expect(b.drain().some((e) => e.k === "release")).toBe(true);
    expect(b.canRelease(OWNER)).toBe(false);
  });
});

describe("턴 안의 시간축 (0036)", () => {
  const slime = (b: Battle) => b.enemy(1);

  it("카드는 놓을 때가 아니라 턴 종료 때 끝나는 시각에 들어가요", () => {
    const b = battleWith("fire_claw");
    const hp = slime(b).hp;
    b.play(100, { side: "e", uid: 1 });
    expect(slime(b).hp).toBe(hp);
    expect(b.planned).toHaveLength(1);
    b.endTurn();
    expect(slime(b).hp).toBeLessThan(hp);
  });

  it("같은 줄의 카드는 이어서, 시간은 기본 시간 × 10 ÷ 스피드", () => {
    const b = battleWith("fire_claw", "fire_claw");
    const t = b.cardTime(b.hand[0]);
    b.play(100, { side: "e", uid: 1 });
    b.play(101, { side: "e", uid: 1 });
    expect(b.planned.map((p) => [p.start, p.end])).toEqual([[0, t], [t, 2 * t]]);
  });

  it("적 행동은 박힌 시각에, 그보다 먼저 끝난 방어도가 막아요", () => {
    const b = battleWith("basic_block");
    const at = b.intent(slime(b)).at!;
    b.hand[0].owner = "glass_salamander";
    b.play(100);
    expect(b.planned[0].end).toBeLessThan(at);
    b.endTurn();
    const ev = b.drain();
    const iBlock = ev.findIndex((e) => e.k === "block" && e.ref.side === "s");
    const iAct = ev.findIndex((e) => e.k === "enemyAct");
    expect(iBlock).toBeGreaterThan(-1);
    expect(iBlock).toBeLessThan(iAct);
  });

  it("허점타: 적 행동 직전 창 안에 끝나는 공격은 세져요", () => {
    const b = battleWith("fire_claw");
    expect(b.inOpening(slime(b), b.intent(slime(b)).at! - 100)).toBe(true);
    expect(b.inOpening(slime(b), 0)).toBe(false);
  });

  it("허점타: 적 행동과 같은 시각에 끝나는 공격은 허점타가 아니에요 (0058)", () => {
    const b = battleWith("fire_claw");
    const at = b.intent(slime(b)).at!;
    expect(b.inOpening(slime(b), at)).toBe(false);
    expect(b.inOpening(slime(b), at - 1)).toBe(true);
  });

  it("뽑기는 놓는 즉시 처리해요", () => {
    const b = battleWith("breeze");
    b.draw = [card("fire_claw", 5)];
    b.play(100);
    expect(b.hand.map((c) => c.cardId)).toEqual(["fire_claw"]);
  });

  it("화상은 턴 끝에 타고 나서 절반으로 줄어요 (0040)", () => {
    const b = battleWith();
    slime(b).hp = 99;
    stackOf(slime(b), "burn").n = 5;
    b.endTurn();
    expect(stackOf(slime(b), "burn").n).toBe(2);
  });

  it("빙결은 적 행동을 없애지 않고 늦춰요 (0039)", () => {
    const b = battleWith("eternal_ice");
    const at = b.intent(slime(b)).at!;
    b.play(100, { side: "e", uid: 1 });
    b.endTurn();
    const ev = b.drain();
    expect(ev.some((e) => e.k === "delay" && e.uid === 1)).toBe(true);
    expect(ev.some((e) => e.k === "cancel")).toBe(false);
    // 2,000 + 800 < 3,000이라 같은 턴에 늦게 행동해요
    expect(at + 800).toBeLessThan(3000);
    expect(ev.some((e) => e.k === "enemyAct" && e.uid === 1)).toBe(true);
  });
});
