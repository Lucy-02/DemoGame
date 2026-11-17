import { describe, expect, it } from "vitest";
import { guideStep } from "./guide";

describe("첫 판 안내: 짚는 차례 (0085)", () => {
  it("첫 턴에 아무것도 안 놓았으면 손패를 짚어요", () => {
    expect(guideStep({ turn: 1, placed: false, charging: true, spent: false }, {})).toBe("place");
  });
  it("카드를 놓은 뒤에는 차징을, 풀이를 본 뒤에는 턴 종료를 짚어요", () => {
    expect(guideStep({ turn: 1, placed: true, charging: true, spent: false }, {})).toBe("charge");
    expect(guideStep({ turn: 1, placed: true, charging: true, spent: false }, { charge: true })).toBe("end");
  });
  it("낼 카드가 없으면 차징보다 턴 종료가 먼저예요", () => {
    expect(guideStep({ turn: 1, placed: true, charging: true, spent: true }, {})).toBe("end");
  });
  it("둘째 턴부터는 아직 안 본 차징만 짚어요", () => {
    expect(guideStep({ turn: 2, placed: false, charging: true, spent: false }, {})).toBe("charge");
    expect(guideStep({ turn: 2, placed: false, charging: true, spent: false }, { charge: true })).toBeNull();
    expect(guideStep({ turn: 2, placed: true, charging: false, spent: false }, {})).toBeNull();
  });
});
