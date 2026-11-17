import { describe, expect, it } from "vitest";
import { Run } from "../core/run";
import type { EventDef } from "../core/types";
import { EventSession } from "./event";

const TEST: EventDef = {
  id: "test_event", title: "시험", text: "시험 이벤트예요.",
  options: [
    { label: "줍는다", desc: "", outcome: [{ type: "gold", value: 30 }, { type: "damageFront", value: 4 }] },
    { label: "태운다", desc: "", outcome: [{ type: "gold", value: 10 }, { type: "removeCard" }] },
    { label: "다듬는다", desc: "", outcome: [{ type: "upgradeCard" }] },
    { label: "베낀다", desc: "", outcome: [{ type: "duplicateCard" }] },
    { label: "읽는다", desc: "", outcome: [{ type: "cardReward" }] },
  ],
};

const session = () => {
  const run = new Run({ seed: 5, frontId: "fire_fox", adult: false, unlockAll: true });
  run.gold = 50;
  return new EventSession(run, TEST);
};

describe("이벤트 세션", () => {
  it("미리보기는 판을 바꾸지 않고 골드 · HP a→b를 알려줘요", () => {
    const s = session();
    const front = s.run.spirit(s.run.frontId);
    const hp = front.hp;
    const pv = s.preview(0);
    expect(pv.gold).toEqual({ from: 50, to: 80 });
    expect(pv.hp[front.id]).toEqual({ from: hp, to: hp - 4 });
    expect(Object.keys(pv.hp)).toEqual([front.id]);
    expect(s.run.gold).toBe(50);
    expect(front.hp).toBe(hp);
    expect(s.preview(4).cards).toBe(true);
    expect(s.preview(1).pick).toBe("removeCard");
  });

  it("바로 적용되는 선택지는 고르면 끝나요", () => {
    const s = session();
    expect(s.choose(0)).toBe(true);
    expect(s.run.gold).toBe(80);
    expect(s.step.kind).toBe("done");
  });

  it("덱 고르기 선택지는 확인해야 전체가 적용되고, 그 전엔 물러날 수 있어요", () => {
    const s = session();
    const n = s.run.deck.length;
    s.choose(1);
    expect(s.step).toEqual({ kind: "pick", option: 1, mode: "removeCard" });
    expect(s.run.gold).toBe(50);
    s.cancelPick();
    expect(s.step.kind).toBe("choose");
    s.choose(1);
    expect(s.pick(s.run.deck[0].uid)).toBe(true);
    expect(s.run.deck.length).toBe(n - 1);
    expect(s.run.gold).toBe(60);
    expect(s.step.kind).toBe("done");
  });

  it("강화 · 복제", () => {
    const up = session();
    up.choose(2);
    const uid = up.candidates("upgradeCard")[0];
    up.pick(uid);
    expect(up.run.deck.find((c) => c.uid === uid)?.upgraded).toBe(true);
    const dup = session();
    const n = dup.run.deck.length;
    dup.choose(3);
    dup.pick(dup.run.deck[0].uid);
    expect(dup.run.deck.length).toBe(n + 1);
  });

  it("카드 보상은 세 장을 뽑아 넘겨요", () => {
    const s = session();
    s.choose(4);
    expect(s.step.kind).toBe("cards");
    if (s.step.kind === "cards") expect(s.step.cardIds).toHaveLength(3);
  });

  it("강화할 카드가 없으면 강화 선택지를 못 골라요", () => {
    const s = session();
    for (const c of s.run.deck) if (s.run.canUpgrade(c.uid)) s.run.upgradeCard(c.uid);
    expect(s.canChoose(2)).toBe(false);
  });
});
