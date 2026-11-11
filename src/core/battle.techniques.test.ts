// 전용 무기의 기술 카드 (결정 0055·0056). 숫자는 시험 값이라 크기 비교로 확인해요.
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BCard, type BattleEvent } from "./battle";
import { C } from "./data";
import { Rng } from "./rng";
import { Run } from "./run";

const E1 = { side: "e", uid: 1 } as const;
const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];

function battleWith(hand: [cardId: string, owner: string][], enemies = ["grimbark"]): Battle {
  const run = new Run({ seed: 1, frontId: PARTY[0], adult: false, unlockAll: true, party: PARTY });
  const b = new Battle(run.spirits, [], enemies, run.frontId, new Rng(1));
  b.hand = hand.map(([cardId, owner], i): BCard =>
    ({ uid: 100 + i, cardId, owner, tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false }));
  b.mana = 99;
  for (const s of b.spirits) s.critPity = -10;
  b.drain();
  return b;
}

const hitsOn = (ev: BattleEvent[], uid: number) =>
  ev.filter((e): e is Extract<BattleEvent, { k: "damage" }> => e.k === "damage" && e.ref.side === "e" && e.ref.uid === uid);
const logged = (ev: BattleEvent[], word: string) => ev.some((e) => e.k === "log" && e.text.includes(word));
const guardScale = (b: Battle, id: string) => b.stat(b.spirit(id), "guard") / (C.stat_base as number);

/** 카드 한 장을 화상이 burn인 적에게 썼을 때의 첫 타격 피해 */
function firstHit(cardId: string, burn: number): number {
  const b = battleWith([[cardId, "fire_fox"]]);
  if (burn) b.addStatus(b.enemy(1), "burn", burn);
  b.drain();
  b.play(100, E1);
  b.endTurn();
  return hitsOn(b.drain(), 1)[0].amount;
}

describe("불여우: 터뜨리기", () => {
  it("공명 1: 대상에 화상이 있으면 피해가 더 커요", () => {
    expect(firstHit("ember_scatter_burst_1", 4)).toBeGreaterThan(firstHit("ember_scatter_burst_1", 0));
    expect(firstHit("ember_scatter_burst_1", 0)).toBe(firstHit("ember_scatter", 0));
  });

  it("공명 2: 화상 수에 비례하고 상한이 있어요", () => {
    const [none, some, lots, more] = [0, 4, 10, 40].map((n) => firstHit("ember_scatter_burst_2", n));
    expect(some).toBeGreaterThan(none);
    expect(lots).toBeGreaterThan(some);
    expect(more).toBe(lots);
  });

  it("공명 3: 화상이 많이 쌓인 적은 이번 턴 끝에 화상이 줄지 않아요", () => {
    const burnAfterTurn = (cardId: string) => {
      const b = battleWith([[cardId, "fire_fox"]]);
      b.addStatus(b.enemy(1), "burn", 10);
      b.play(100, E1);
      b.endTurn();
      return statusN(b.enemy(1), "burn");
    };
    const held = burnAfterTurn("ember_scatter_burst_3");
    expect(held).toBeGreaterThan(10);
    expect(burnAfterTurn("ember_scatter_burst_2")).toBe(Math.floor(held / 2));
  });

  it("공명 3: 화상이 적으면 평소처럼 줄어요", () => {
    const b = battleWith([["ember_scatter_burst_3", "fire_fox"]]);
    b.play(100, E1);
    b.endTurn();
    expect(statusN(b.enemy(1), "burnHold")).toBe(0);
    expect(statusN(b.enemy(1), "burn")).toBeLessThan(3);
  });
});

describe("불여우: 번짐", () => {
  it("다른 적이 있으면 그 적에게도 화상을 걸어요", () => {
    const b = battleWith([["ember_scatter_spread_1", "fire_fox"]], ["grimbark", "rubble_shell"]);
    b.play(100, E1);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "status" && e.ref.side === "e" && e.ref.uid === 2 && e.text.startsWith("화상"))).toBe(true);
  });

  it("적이 하나면 대상에게 겹치고, 겹칠 때마다 줄어요", () => {
    const b = battleWith([["ember_scatter_spread_2", "fire_fox"], ["ember_scatter_spread_2", "fire_fox"], ["ember_scatter_spread_2", "fire_fox"]]);
    for (const uid of [100, 101, 102]) b.play(uid, E1);
    b.endTurn();
    const gains = b.drain()
      .filter((e): e is Extract<BattleEvent, { k: "status" }> => e.k === "status" && e.ref.side === "e" && /^화상 \d/.test(e.text))
      .map((e) => Number(e.text.split(" ")[1]));
    // 카드마다 [기본 화상, 겹친 번짐] 순서
    const spread = [gains[1], gains[3], gains[5]];
    expect(spread[0]).toBeGreaterThan(spread[1]);
    expect(spread[1]).toBeGreaterThanOrEqual(spread[2] ?? 0);
    expect(statusN(b.enemy(1), "spreadStack")).toBe(3);
  });

  it("공명 3: 화상 걸린 적이 쓰러지면 남은 화상이 다음 적에게 옮겨 가요", () => {
    const b = battleWith([["ember_scatter_spread_3", "fire_fox"]], ["wisp", "grimbark"]);
    b.addStatus(b.enemy(1), "burn", 9);
    b.play(100, E1);
    b.endTurn();
    const ev = b.drain();
    expect(b.enemy(1).dead).toBe(true);
    expect(logged(ev, "옮겨붙음")).toBe(true);
    expect(statusN(b.enemy(2), "burn")).toBeGreaterThan(0);
  });
});

describe("유리 도롱뇽: 받아내기", () => {
  it("유리 벽이 다음 턴까지 일부 남아요", () => {
    const left = (cards: string[]) => {
      const b = battleWith(cards.map((c) => [c, "glass_salamander"]));
      cards.forEach((_c, i) => b.play(100 + i));
      b.endTurn();
      return [b.spirit("glass_salamander").block, guardScale(b, "glass_salamander")];
    };
    const [kept, g] = left(["glass_wall_hold_1", "glass_wall", "glass_wall"]);
    expect(kept).toBe(Math.round(2 * g));
    expect(left(["glass_wall", "glass_wall", "glass_wall"])[0]).toBe(0);
    expect(left(["glass_wall_hold_2", "glass_wall", "glass_wall"])[0]).toBe(Math.round(3 * g));
  });

  it("공명 3: 벽이 동료를 대신 막으면 다음 턴 시작에 벽을 얻어요", () => {
    const b = battleWith([["glass_wall_hold_3", "glass_salamander"]]);
    b.play(100);
    b.endTurn();
    expect(logged(b.drain(), "메아리 벽")).toBe(true);
    expect(b.spirit("glass_salamander").block).toBeGreaterThanOrEqual(Math.round(2 * guardScale(b, "glass_salamander")));
  });

  it("공명 3: 벽이 아무것도 막지 않았으면 얻지 않아요", () => {
    const b = battleWith([["glass_wall_hold_3", "glass_salamander"]], ["rubble_shell"]);
    b.play(100);
    b.endTurn();
    expect(logged(b.drain(), "메아리 벽")).toBe(false);
    expect(b.spirit("glass_salamander").status.wallEcho).toBeUndefined();
  });
});

describe("유리 도롱뇽: 되돌리기", () => {
  it("벽이 깨지면 깬 적에게 피해를 줘요", () => {
    const b = battleWith([["glass_wall_return_1", "glass_salamander"]]);
    const hp = b.enemy(1).hp;
    b.play(100);
    b.endTurn();
    const ev = b.drain();
    expect(logged(ev, "깨지는 유리")).toBe(true);
    expect(b.enemy(1).hp).toBe(hp - Math.round(3 * guardScale(b, "glass_salamander")));
    expect(b.spirit("glass_salamander").status.wallBurst).toBeUndefined();
  });

  it("벽이 버티면 켜지지 않아요", () => {
    const b = battleWith([["glass_wall_return_2", "glass_salamander"], ["glass_wall", "glass_salamander"], ["glass_wall", "glass_salamander"]]);
    const hp = b.enemy(1).hp;
    for (const uid of [100, 101, 102]) b.play(uid);
    b.endTurn();
    expect(b.enemy(1).hp).toBe(hp);
  });

  it("공명 3만 직접 맞아 방어도가 다 떨어져도 켜져요", () => {
    const burst = (direct: boolean) => {
      const b = battleWith([]);
      const sal = b.spirit("glass_salamander");
      const hp = b.enemy(1).hp;
      b.gainWall(sal, 3);
      b.addStatus(sal, "wallBurst", 4, { strength: direct ? 1 : 0 });
      b.hurtSpirit(sal, 10, false, { attacker: b.enemy(1) });
      return hp - b.enemy(1).hp;
    };
    expect(burst(true)).toBe(4);
    expect(burst(false)).toBe(0);
  });
});

describe("안개 고양이: 얼리기", () => {
  /** 냉기가 문턱 바로 아래인 잡몹에게 써요 */
  const freezeWith = (cardId: string) => {
    const b = battleWith([[cardId, "mist_cat"]], ["rubble_shell"]);
    b.addStatus(b.enemy(1), "chill", 4);
    b.drain();
    b.play(100, E1);
    b.endTurn();
    return { b, ev: b.drain() };
  };
  const delayOf = (ev: BattleEvent[]) => ev.find((e): e is Extract<BattleEvent, { k: "delay" }> => e.k === "delay")?.ms;

  it("이 카드로 빙결시키면 넘친 냉기가 남아요", () => {
    expect(freezeWith("mist_breath").ev.some((e) => e.k === "freeze")).toBe(true);
    const base = freezeWith("mist_breath").ev.filter((e) => e.k === "status" && e.text.startsWith("냉기")).length;
    const { ev } = freezeWith("mist_breath_freeze_1");
    expect(ev.some((e) => e.k === "freeze")).toBe(true);
    const left = ev.filter((e): e is Extract<BattleEvent, { k: "status" }> => e.k === "status" && e.text.startsWith("냉기")).at(-1)!;
    expect(Number(left.text.split(" ")[1])).toBeGreaterThan(0);
    expect(base).toBeGreaterThan(0);
  });

  it("공명 2: 빙결이 더 오래 늦춰요", () => {
    const plain = delayOf(freezeWith("mist_breath_freeze_1").ev)!;
    expect(delayOf(freezeWith("mist_breath_freeze_2").ev)).toBe(plain + 200);
  });

  it("공명 3: 빙결된 적이 약화도 받아요", () => {
    expect(freezeWith("mist_breath_freeze_3").ev.some((e) => e.k === "status" && e.text.startsWith("약화"))).toBe(true);
    expect(freezeWith("mist_breath_freeze_2").ev.some((e) => e.k === "status" && e.text.startsWith("약화"))).toBe(false);
  });

  it("빙결시키지 못하면 평소 냉기와 같아요", () => {
    const b = battleWith([["mist_breath_freeze_3", "mist_cat"]]);
    b.play(100, E1);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "freeze")).toBe(false);
    expect(statusN(b.enemy(1), "chill")).toBeGreaterThan(0);
  });
});

describe("안개 고양이: 지키기", () => {
  it("HP가 가장 낮은 동료에게 방어도를 줘요", () => {
    const b = battleWith([["mist_breath_guard_1", "mist_cat"]], ["rubble_shell"]);
    b.spirit("glass_salamander").hp = 5;
    b.play(100, E1);
    b.endTurn();
    const block = b.drain().find((e) => e.k === "block" && e.ref.side === "s");
    expect(block).toMatchObject({ ref: { id: "glass_salamander" } });
  });

  it("공명 3: 그 동료를 때린 적에게 냉기를 한 번 걸어요", () => {
    const chillAfter = (cardId: string) => {
      const b = battleWith([[cardId, "mist_cat"]]);
      b.spirit("fire_fox").hp = 20;
      b.play(100, E1);
      b.endTurn();
      return { chill: statusN(b.enemy(1), "chill"), guard: b.spirit("fire_fox").status.frostGuard };
    };
    const withFrost = chillAfter("mist_breath_guard_3");
    expect(withFrost.chill).toBe(chillAfter("mist_breath_guard_2").chill + 1);
    expect(withFrost.guard).toBeUndefined();
  });
});
