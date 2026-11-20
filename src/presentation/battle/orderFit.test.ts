import { describe, expect, it } from "vitest";
import { fitOrder } from "./orderFit";

// 칸 n개: 자리 하나에 30, 선 하나에 line, 고정 100
const widthOf = (n: number) => (f: { even: boolean; reserve: number; line: number }) => 100 + (f.even ? 50 : 0) + (n + 1) * f.reserve * 30 + n * 2 * f.line;

describe("순서표 판 폭 맞추기 (0160)", () => {
  it("들어가면 그대로 둬요", () => {
    expect(fitOrder(1000, widthOf(3), { even: true, reserve: 2, line: 18 }, 4)).toEqual({ even: true, reserve: 2, line: 18 });
  });
  it("넘치면 먼저 칸 폭 맞춤을 풀어요", () => {
    expect(fitOrder(680, widthOf(5), { even: true, reserve: 2, line: 18 }, 4)).toEqual({ even: false, reserve: 2, line: 18 });
  });
  it("그다음 빈 자리를 줄여요", () => {
    expect(fitOrder(500, widthOf(5), { even: true, reserve: 2, line: 18 }, 4)).toEqual({ even: false, reserve: 1, line: 18 });
  });
  it("자리를 다 줄여도 넘치면 선을 줄여요", () => {
    const fit = fitOrder(300, widthOf(7), { even: true, reserve: 2, line: 18 }, 4);
    expect(fit.reserve).toBe(0);
    expect(fit.line).toBeLessThan(18);
    expect(widthOf(7)(fit)).toBeLessThanOrEqual(300);
  });
  it("선은 바닥 아래로 줄이지 않아요", () => {
    expect(fitOrder(10, widthOf(7), { even: true, reserve: 2, line: 18 }, 4)).toEqual({ even: false, reserve: 0, line: 4 });
  });
});
