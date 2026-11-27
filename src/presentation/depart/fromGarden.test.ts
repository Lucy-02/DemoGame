import { describe, expect, it } from "vitest";
import { DEPARTS } from "./fixtures";

describe("출전 준비 값", () => {
  it("열린 성격 (0157 · 0171): 완주로 연 성격 가운데 지금 성격이 아닌 것만 고를 수 있어요", () => {
    const [salamander, ibex, chameleon] = DEPARTS.three.seats;
    expect(salamander.personality.name).toBe("신중");
    expect(salamander.opened.map((p) => p.name)).toEqual(["듬직", "고집", "명랑"]);
    // 지금 성격은 열려 있어도 고를 것에 다시 나오지 않아요
    expect(ibex.opened.map((p) => p.name)).toEqual(["총명"]);
    expect(chameleon.opened).toEqual([]);
  });
});
