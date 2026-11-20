import { describe, expect, it } from "vitest";
import { GROWTH } from "../../core/data";
import { newGarden } from "../../core/garden";
import { freshSpirit } from "../../core/growth";
import { Run } from "../../core/run";
import { ROSTERS } from "./fixtures";
import { branchPickVM, spiritsVM } from "./fromGarden";
import { MOCKUPS } from "./mockups";
import { fixedSource, gardenRoster, runRoster } from "./roster";

describe("정령 관리 화면 데이터", () => {
  it("띠 링: 키우기 가능 / 진행 중 / 최종 단계, 할 일 개수", () => {
    const vm = spiritsVM(ROSTERS.mixed, "fire_fox");
    expect(vm.roster.map((t) => [t.chip, t.ring.kind, t.todo])).toEqual([
      ["유체 Lv 4", "ready", 1],
      ["성체 Lv 5", "progress", 0],
      ["각성체 Lv 6", "final", 0],
    ]);
  });

  it("목업: 파일럿 뒤에 붙고, 정하지 않은 값은 비워요", () => {
    const mocks = { list: MOCKUPS, stage: (id: string) => (id === "night_owl" ? "baby" as const : "awakened" as const) };
    const vm = spiritsVM(ROSTERS.mixed, "night_owl", mocks);
    expect(vm.roster).toHaveLength(3 + MOCKUPS.length);
    expect(vm.roster.slice(3).every((t) => t.face && !t.deployed && t.todo === 0)).toBe(true);
    const d = vm.detail;
    expect([d.name, d.stage, d.level, d.mock, d.art?.key]).toEqual(["부엉이", "유체", undefined, true, "spirit:night_owl:baby:body"]);
    expect(d.stats.every((s) => s.value === undefined)).toBe(true);
    expect(d.growth.rows.map((r) => [r.state, r.pick])).toEqual([["now", "baby"], ["next", "adult"], ["next", "awakened"]]);
    expect(spiritsVM(ROSTERS.mixed, "night_owl").selected).toBe("fire_fox");
  });

  it("가진 정령은 목업 목록에 있어도 실제 값으로 보여요 (산양 · 카멜레온)", () => {
    const mocks = { list: MOCKUPS, stage: () => "awakened" as const };
    const g = ROSTERS.mixed;
    const own = { ...g, spirits: [...g.spirits, freshSpirit("magma_ibex", "brave")] };
    const vm = spiritsVM(own, "magma_ibex", mocks);
    expect(vm.detail.mock).toBeUndefined();
    expect(vm.detail.stage).toBe("유체");
    expect(vm.detail.growth.level).toBeDefined();
    expect(vm.roster.filter((t) => t.id === "magma_ibex")).toHaveLength(1);
    expect(vm.roster).toHaveLength(4 + MOCKUPS.length - 1);
  });

  it("일러스트: 지금 단계 그림 (불여우 포함)", () => {
    const vm = spiritsVM(ROSTERS.mixed, "mist_cat");
    expect(vm.roster.map((t) => t.face?.key)).toEqual(["spirit:fire_fox:baby:body", "spirit:glass_salamander:adult:body", "spirit:mist_cat:awakened:body"]);
    expect(vm.detail.art).toMatchObject({ key: "spirit:mist_cat:awakened:body", frame: { k: "face" } });
    // 조정값(spiritFit.json)은 Lucy가 피팅 페이지에서 바꾸는 값이라, 있는지만 봐요
    expect(vm.detail.art?.fit).toBeTypeOf("object");
    expect(spiritsVM(ROSTERS.fresh, "mist_cat").detail.art).toMatchObject({ key: "spirit:mist_cat:baby:body", frame: { k: "mass" } });
    expect(spiritsVM(ROSTERS.mixed, "fire_fox").detail.art).toMatchObject({ key: "spirit:fire_fox:baby:body", frame: { k: "mass" } });
  });

  it("탭 2개(유대는 MVP 밖, 0052), 할 일은 성장 길 탭 배지와 요약 카드로 이어져요", () => {
    const d = spiritsVM(ROSTERS.mixed, "fire_fox").detail;
    expect(d.tabs.map((t) => [t.label, t.count, t.badge])).toEqual([["개요", undefined, undefined], ["성장 길", "Lv 4", "g-up"]]);
    expect(d.facts.map((f) => f.kind)).toEqual(["next", "cells", "todo"]);
    // 전용 카드 칸: 유체 Lv 4면 레벨로 여는 카드가 열려 있어요
    expect(d.facts[1]).toMatchObject({ kind: "cells", have: 3, total: 5 });
    // 성격은 유체부터 보여요. 효과는 성체부터라 안내를 덧붙여요 (0033)
    expect(d.personality).toBeDefined();
    expect(d.overview.personality?.note).toBe("성체가 되면 효과가 나요");
    expect(d.growth.gate).toMatchObject({ to: "성체", ready: true });
  });

  it("키우면 성체가 되고 성격 효과가 시작돼요", () => {
    const source = fixedSource(ROSTERS.mixed);
    let changed = 0;
    source.onChange(() => changed++);
    source.evolve!("fire_fox", "burst");
    expect(changed).toBe(1);
    const d = spiritsVM(source.roster(), "fire_fox").detail;
    expect(d.stage).toBe("성체");
    expect(d.overview.personality?.note).toBeUndefined();
    expect(d.stats.filter((x) => x.up).map((x) => x.label)).toEqual(["파워", "포커스"]);
    expect(d.tabs[1].badge).toBeUndefined();
  });

  it("판 밖(정원)은 떠날 때의 모습이에요: 늘 유체 Lv 1, 키울 것 없음, 빈 장비 칸 (0157 · 0159)", () => {
    const vm = spiritsVM(gardenRoster(newGarden(7)), "fire_fox");
    expect(vm.roster.map((t) => [t.chip, t.ring.kind, t.ring.value, t.todo])).toEqual([["유체 Lv 1", "progress", 0, 0], ["유체 Lv 1", "progress", 0, 0], ["유체 Lv 1", "progress", 0, 0]]);
    expect(vm.detail.equip).toEqual([null]);
    expect(vm.detail.growth.gate).toMatchObject({ to: "성체", ready: false });
    expect(vm.detail.facts.map((f) => f.kind)).toEqual(["next", "cells"]);
  });

  it("판 안은 그 판에서 자란 모습이에요: 받은 카드로 갈래 조건을 세요", () => {
    const run = new Run({ seed: 1, frontId: "fire_fox", party: ["fire_fox", "mist_cat"], adult: false, unlockAll: false });
    while (run.spirit("fire_fox").level < 4) run.grantBattle("boss");
    expect(spiritsVM(runRoster(run), "fire_fox").roster[0]).toMatchObject({ chip: "유체 Lv 4", ring: { kind: "progress" }, todo: 0 });
    run.addCard("kindling", "fire_fox");
    const vm = spiritsVM(runRoster(run), "fire_fox");
    expect(vm.roster[0]).toMatchObject({ ring: { kind: "ready" }, todo: 1 });
    expect(branchPickVM(runRoster(run), "fire_fox", "run")!.branches.map((b) => b.open)).toEqual([true, false]);
  });
});

describe("갈래 고르기 창 (0047 S15)", () => {
  it("열린 갈래만 고를 수 있고, 잠긴 갈래는 조건과 이번 판의 진척을 보여요", () => {
    // 갈래 1의 카드만 받은 도롱뇽
    const g = { ...ROSTERS.branch, received: { glass_salamander: ["heated_glass", "afterglow"] } };
    const vm = branchPickVM(g, "glass_salamander", "run")!;
    expect(vm.branches.map((b) => [b.id, b.open])).toEqual([["hold", true], ["return", false]]);
    expect(vm.selected).toBe(0);
    expect(vm.condRow).toBe(true);
    const need = GROWTH.evolutions.find((e) => e.spirit === "glass_salamander" && e.branch === "return")!.opens!.cards;
    expect(vm.branches[1].cond).toEqual({ level: { need: 4, ok: true }, cards: { have: 0, need } });
    // 갈래 2는 가드·파워가 주 성장 (작업 가정)
    expect(vm.branches[1].stats.map((s) => s.gain > 0)).toEqual([true, true, true, false]);
    expect(vm.branches[0].cards.map((c) => c.key)).toEqual(["glass_citadel"]);
    expect(branchPickVM(g, "glass_salamander", "garden", "return")!.selected).toBe(0);
    expect(branchPickVM(ROSTERS.mixed, "glass_salamander", "garden")).toBeUndefined();
  });

  it("둘 다 잠기면 고른 갈래가 없어요", () => {
    expect(branchPickVM(ROSTERS.branchLocked, "glass_salamander", "garden")!.selected).toBeUndefined();
  });
});
