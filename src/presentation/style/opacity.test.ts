import { describe, expect, it } from "vitest";
import { colorMatrix } from "./opacity";

/** 행렬을 0~1 색에 적용 (덧셈 열은 0~255) */
function apply(m: number[], [r, g, b, a]: [number, number, number, number]) {
  const row = (i: number) => m[i] * r + m[i + 1] * g + m[i + 2] * b + m[i + 3] * a + m[i + 4] / 255;
  return [row(0), row(5), row(10), row(15)];
}

describe("colorMatrix", () => {
  it("기본값은 그대로", () => {
    expect(apply(colorMatrix({}), [0.2, 0.5, 0.8, 1])).toEqual([0.2, 0.5, 0.8, 1]);
  });

  it("grayscale(1)은 휘도로 모아요", () => {
    const [r, g, b] = apply(colorMatrix({ grayscale: 1 }), [1, 0, 0, 1]);
    expect(r).toBeCloseTo(0.2126);
    expect(g).toBeCloseTo(0.2126);
    expect(b).toBeCloseTo(0.2126);
  });

  it("contrast는 0.5를 중심으로, brightness는 그 뒤에 곱해요", () => {
    const [r] = apply(colorMatrix({ contrast: 0.5, brightness: 2 }), [1, 1, 1, 1]);
    expect(r).toBeCloseTo((0.5 * 1 + 0.25) * 2);
  });

  it("opacity는 알파만 곱해요", () => {
    expect(apply(colorMatrix({ opacity: 0.62 }), [0.3, 0.3, 0.3, 1])).toEqual([0.3, 0.3, 0.3, 0.62]);
  });
});
