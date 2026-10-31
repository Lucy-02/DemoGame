import { describe, expect, it } from "vitest";
import { GardenSession } from "../../session/garden";
import { GARDENS } from "./fixtures";
import { spiritsVM } from "./fromGarden";

describe("정령 관리 화면 데이터", () => {
  it("띠 링: 키우기 가능 / 진행 중 / 최종 단계, 할 일 개수", () => {
    const vm = spiritsVM(GARDENS.mixed, "fire_fox");
    expect(vm.roster.map((t) => [t.chip, t.ring.kind, t.todo])).toEqual([
      ["유체 Lv 4", "ready", 2],
      ["성체 Lv 5", "progress", 1],
      ["각성체 Lv 6", "final", 0],
    ]);
  });

  it("탭 3개, 할 일은 성장 길·유대 탭 배지와 요약 카드로 이어져요", () => {
    const d = spiritsVM(GARDENS.mixed, "fire_fox").detail;
    expect(d.tabs.map((t) => [t.label, t.count, t.badge])).toEqual([["개요", undefined, undefined], ["성장 길", "Lv 4", "g-up"], ["유대", "0/3", undefined]]);
    expect(d.facts.map((f) => f.kind)).toEqual(["next", "cells", "bond", "todo"]);
    expect(d.personality).toBeUndefined();
    expect(d.growth.gate).toMatchObject({ to: "성체", ready: true });
  });

  it("세션 명령: 키우면 성체가 되고 성격이 드러나요. 성장 길을 보면 새 카드 배지가 사라져요", () => {
    const s = new GardenSession(GARDENS.mixed);
    s.dispatch({ kind: "seeUnlocks", id: "fire_fox" });
    s.dispatch({ kind: "evolve", id: "fire_fox" });
    const d = spiritsVM(s.state, "fire_fox").detail;
    expect(d.stage).toBe("성체");
    expect(d.personality).toBeDefined();
    expect(d.stats.filter((x) => x.up).map((x) => x.label)).toEqual(["파워", "포커스"]);
    // 성체 카드가 새로 열렸어요
    expect(d.tabs[1].badge).toBe("g-cardnew");
    expect(GardenSession.restore(s.snapshot()).state).toEqual(s.state);
  });
});
