import { describe, expect, it } from "vitest";
import { mix, rgba } from "./color";

describe("rgba", () => {
  it("hex와 rgba()를 읽는다", () => {
    expect(rgba("#232120")).toEqual({ color: 0x232120, alpha: 1 });
    expect(rgba("rgba(246,241,233,.14)")).toEqual({ color: 0xf6f1e9, alpha: 0.14 });
  });
  it("모르는 형식은 거부한다", () => {
    expect(() => rgba("TODO_TOKEN")).toThrow();
  });
});

describe("mix", () => {
  it("color-mix(in srgb)처럼 섞는다", () => {
    expect(mix("#ffffff", "#000000", 0.5)).toBe("rgb(128,128,128)");
    expect(rgba(mix("#c99a88", "#e9e6df", 1))).toEqual({ color: 0xc99a88, alpha: 1 });
  });
});
