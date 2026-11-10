// 2단계 기믹: 별·낙하, 벽, 품기, 휘청·브레이크·취소, 숨음·받아칠 기회 (CARD_ENGINE_HANDOFF 2-2)
import { describe, expect, it } from "vitest";
import { Battle, statusN, type BCard, type BattleEvent } from "./battle";
import { C, cardDef } from "./data";
import { Rng } from "./rng";
import { Run } from "./run";

const E1 = { side: "e", uid: 1 } as const;

/** 파티와 손을 정해 둔 전투. 마력은 넉넉하고 치명타는 나지 않아요. 카드는 턴 종료 때 시간축에서 풀려요 (0036). */
function battleWith(party: string[], hand: [cardId: string, owner: string][], enemies = ["moss_slime"], frontId = party[0]): Battle {
  const run = new Run({ seed: 1, frontId, adult: false, unlockAll: true, party });
  const b = new Battle(run.spirits, [], enemies, run.frontId, new Rng(1));
  b.hand = hand.map(([cardId, owner], i) => card(cardId, owner, i));
  b.mana = 99;
  for (const s of b.spirits) s.critPity = -10;
  b.drain();
  return b;
}

const card = (cardId: string, owner: string, i: number): BCard =>
  ({ uid: 100 + i, cardId, owner, tempCostDelta: 0, locked: false, isCopy: false, grow: 0, held: false, heldFast: false });

const damages = (ev: BattleEvent[]) => ev.filter((e): e is Extract<BattleEvent, { k: "damage" }> => e.k === "damage");
const guardScale = (b: Battle, id: string) => b.stat(b.spirit(id), "guard") / (C.stat_base as number);
const enemyDamages = (ev: BattleEvent[]) => damages(ev).filter((d) => d.ref.side === "e");

describe("별과 낙하 (별의 정령)", () => {
  const PARTY = ["star_spirit", "fire_fox", "mist_cat"];

  it("별이 문턱에 차면 다음 턴 시작에 낙하를 고르고, 고른 카드가 손에 들어와요", () => {
    const b = battleWith(PARTY, [["stardust", "star_spirit"], ["stardust", "star_spirit"], ["stardust", "star_spirit"]]);
    for (const uid of [100, 101, 102]) b.play(uid, E1);
    b.endTurn();
    const ev = b.drain();
    expect(statusN(b.enemy(1), "star")).toBe(3);
    expect(b.stars.count).toBe(0);
    expect(ev.find((e) => e.k === "fallOffer")).toMatchObject({ owner: "star_spirit", picks: 1 });
    expect(b.stars.choice?.options).toEqual(C.star_falls);
    expect(b.chooseFall(["meteor", "comet"])).toBe(true);
    expect(b.hand.filter((c) => c.cardId === "meteor" && c.owner === "star_spirit")).toHaveLength(1);
    expect(b.hand.some((c) => c.cardId === "comet")).toBe(false);
    expect(b.stars.choice).toBeNull();
  });

  it("유성은 대상의 별마다 세지고 별을 지워요", () => {
    const b = battleWith(PARTY, [["meteor", "star_spirit"]]);
    const star = b.spirit("star_spirit");
    b.markStar(star, b.enemy(1), 2);
    b.play(100, E1);
    b.endTurn();
    const [d] = enemyDamages(b.drain());
    const expected = Math.round((6 + 3 * 2) * (b.stat(star, "power") / (C.stat_base as number)));
    expect(d.amount).toBe(expected);
    expect(statusN(b.enemy(1), "star")).toBe(0);
  });

  it("별빛: 다음 타격이 맞힌 적에게 별을 새겨요", () => {
    const b = battleWith(PARTY, [["basic_claw", "fire_fox"]]);
    b.addStatus(b.spirit("fire_fox"), "starlight", 2);
    b.play(100, E1);
    b.endTurn();
    expect(statusN(b.enemy(1), "star")).toBe(1);
    expect(statusN(b.spirit("fire_fox"), "starlight")).toBe(1);
  });
});

describe("벽 (유리 도롱뇽)", () => {
  const PARTY = ["fire_fox", "glass_salamander", "mist_cat"];

  it("다른 아군이 맞으면 벽의 방어도가 먼저 받아요", () => {
    const b = battleWith(PARTY, [["glass_wall", "glass_salamander"]]);
    b.play(100);
    b.endTurn();
    const ev = b.drain();
    const wall = ev.find((e) => e.k === "block" && e.ref.side === "s" && e.ref.id === "glass_salamander");
    expect(wall).toMatchObject({ amount: Math.round(5 * guardScale(b, "glass_salamander")) });
    const hit = damages(ev).find((d) => d.ref.side === "s" && d.ref.id === "fire_fox");
    expect(hit).toMatchObject({ amount: 0, blocked: 0, wall: 6 });
    expect(b.spirit("fire_fox").hp).toBe(b.spirit("fire_fox").maxHp);
  });

  it("달군 유리: 이번 턴 다음에 얻는 벽이 늘어나요", () => {
    const b = battleWith(PARTY, [["heated_glass", "glass_salamander"], ["glass_scale", "glass_salamander"]]);
    b.play(100);
    b.play(101);
    b.endTurn();
    const blocks = b.drain().filter((e) => e.k === "block" && e.ref.side === "s" && e.ref.id === "glass_salamander");
    const g = guardScale(b, "glass_salamander");
    expect(blocks.map((e) => e.k === "block" && e.amount)).toEqual([Math.round(4 * g), Math.round(2 * g) + 3]);
  });

  it("관통 공격은 벽을 지나쳐요", () => {
    const b = battleWith(PARTY, [], ["moss_slime"]);
    const sal = b.spirit("glass_salamander");
    b.gainWall(sal, 5);
    b.hurtSpirit(b.spirit("fire_fox"), 4, true, { attacker: b.enemy(1) });
    expect(sal.block).toBe(5);
  });
});

describe("품기 (진주조개)", () => {
  const PARTY = ["pearl_oyster", "fire_fox", "mist_cat"];

  it("턴 끝에 고른 카드를 품고, 다음 턴에 더 빠르고 세게 돌아와요", () => {
    const b = battleWith(PARTY, [["embrace", "pearl_oyster"], ["current", "pearl_oyster"], ["glare", "pearl_oyster"]]);
    b.play(100);
    expect(b.toggleHold(101)).toBe(true);
    const plainTime = b.cardTime(b.hand[0]);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "hold" && e.card === cardDef("current").name)).toBe(true);
    const held = b.hand.find((c) => c.uid === 101)!;
    expect(held.held).toBe(true);
    expect(b.hand.filter((c) => c.held)).toEqual([held]);
    expect(b.cardTime(held)).toBe(plainTime - (C.hold_time_cut_ms as number));
    b.play(101, E1);
    b.endTurn();
    const [d] = enemyDamages(b.drain());
    const power = b.stat(b.spirit("pearl_oyster"), "power") / (C.stat_base as number);
    expect(d.amount).toBe(Math.round(6 * (C.hold_mult as number) * power));
  });

  it("복사본과 쓰러진 정령의 카드는 못 품어요", () => {
    const b = battleWith(PARTY, [["current", "pearl_oyster"], ["basic_claw", "fire_fox"]]);
    b.hand[0].isCopy = true;
    expect(b.toggleHold(100)).toBe(false);
    b.spirit("fire_fox").downed = true;
    expect(b.toggleHold(101)).toBe(false);
  });
});

describe("휘청 · 브레이크 · 취소 (마그마 산양)", () => {
  const PARTY = ["magma_ibex", "fire_fox", "mist_cat"];

  it("휘청인 적을 치면 허점타가 되고 휘청이 하나 줄어요", () => {
    const b = battleWith(PARTY, []);
    b.addStatus(b.enemy(1), "stagger", 2);
    b.hit(b.spirit("magma_ibex"), b.enemy(1), 7, "earth", false);
    const [d] = enemyDamages(b.drain());
    expect(d.opening).toBe(true);
    expect(statusN(b.enemy(1), "stagger")).toBe(1);
  });

  it("산사태는 차징 중인 적을 브레이크해요", () => {
    const b = battleWith(PARTY, [["landslide", "magma_ibex"]], ["rust_golem"]);
    expect(b.enemy(1).charging).toBe(true);
    b.play(100);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "cancel" && e.reason === "break")).toBe(true);
    expect(b.enemy(1).charging).toBe(false);
  });

  it("칼데라는 적의 다음 행동을 없애요", () => {
    const b = battleWith(PARTY, [["caldera", "magma_ibex"]]);
    b.play(100, E1);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "cancel" && e.reason === "cancel")).toBe(true);
    const hpBefore = b.spirits.map((s) => s.hp);
    b.endTurn();
    expect(b.drain().some((e) => e.k === "enemyAct")).toBe(false);
    expect(b.spirits.map((s) => s.hp)).toEqual(hpBefore);
  });
});

describe("숨음과 받아칠 기회 (프리즘 카멜레온)", () => {
  const PARTY = ["fire_fox", "prism_chameleon", "mist_cat"];

  it("숨은 정령이 적의 공격을 끌어와 절반만 받고 받아칠 기회를 얻어요", () => {
    const b = battleWith(PARTY, [["camouflage", "prism_chameleon"]]);
    b.play(100);
    b.endTurn();
    const hit = damages(b.drain()).find((d) => d.ref.side === "s");
    expect(hit).toMatchObject({ ref: { id: "prism_chameleon" }, amount: 3 });
    expect(statusN(b.spirit("prism_chameleon"), "hidden")).toBe(0);
    expect(statusN(b.spirit("prism_chameleon"), "ready")).toBe(1);
  });

  it("받아칠 기회가 있으면 다음 카드 효과가 두 배가 되고 기회를 써요", () => {
    const b = battleWith(PARTY, [["snap", "prism_chameleon"]]);
    const cham = b.spirit("prism_chameleon");
    b.gainReady(cham);
    b.play(100, E1);
    b.endTurn();
    const [d] = enemyDamages(b.drain());
    const power = b.stat(cham, "power") / (C.stat_base as number);
    expect(d.amount).toBe(Math.round(6 * (C.ready_mult as number) * power));
    expect(statusN(cham, "ready")).toBe(0);
  });

  it("덩굴 꼬리는 기회를 쓰지 않고, 프리즘은 기회를 아군에게 넘겨요", () => {
    const b = battleWith(PARTY, [["vine_tail", "prism_chameleon"], ["prism", "prism_chameleon"]]);
    const cham = b.spirit("prism_chameleon");
    b.gainReady(cham);
    b.play(100, E1);
    b.play(101, { side: "s", id: "fire_fox" });
    b.endTurn();
    expect(statusN(cham, "ready")).toBe(0);
    expect(statusN(b.spirit("fire_fox"), "ready")).toBe(1);
  });
});
