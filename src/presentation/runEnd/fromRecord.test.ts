import { describe, expect, it } from "vitest";
import { runEndRecord } from "./fixtures";
import { runEndVM } from "./fromRecord";

describe("판 결과 값", () => {
  it("완주한 판 (0157 · 0171): 정령마다 열린 성격 칩, 늘어난 다시 뽑기 수", () => {
    const vm = runEndVM(runEndRecord("victory"));
    expect(vm.lanes.map((l) => l.opened)).toEqual(vm.lanes.map(() => expect.stringMatching(/ 열림$/)));
    expect(vm.reroll).toEqual({ from: 0, to: 3 });
  });

  it("진 판에는 열림 칩도 다시 뽑기 수도 없어요", () => {
    const vm = runEndVM(runEndRecord("defeat"));
    expect(vm.lanes.every((l) => l.opened === undefined)).toBe(true);
    expect(vm.reroll).toBeUndefined();
  });
});
