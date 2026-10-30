import { describe, expect, it } from "vitest";
import { CURVE_RULES, curveTo, pointAt, shapeOf, type Cubic } from "./curve";

// 정본 .aimline path "M 1026 650 C 1250 630, 1256 340, 1170 322"
const canon: Cubic = { p0: { x: 1026, y: 650 }, c1: { x: 1250, y: 630 }, c2: { x: 1256, y: 340 }, p3: { x: 1170, y: 322 } };

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe("조준선 모양", () => {
  it("뽑은 모양을 같은 시작·끝에 쓰면 정본 곡선이 그대로 나와요", () => {
    const c = curveTo(canon.p0, canon.p3, shapeOf(canon));
    close(c.c1, canon.c1);
    close(c.c2, canon.c2);
  });

  it("반대쪽 대상은 거울로 뒤집혀 대상 쪽으로 부풀어요", () => {
    const shape = shapeOf(canon);
    const left = curveTo(canon.p0, { x: canon.p0.x - 144, y: 322 }, shape);
    close(left.c1, { x: 2 * canon.p0.x - canon.c1.x, y: canon.c1.y });
    close(left.c2, { x: 2 * canon.p0.x - canon.c2.x, y: canon.c2.y });
  });

  it("모든 규칙이 정본 예시를 그대로 재현해요", () => {
    for (const make of Object.values(CURVE_RULES)) {
      const c = make(canon)(canon.p0, canon.p3);
      close(c.c1, canon.c1);
      close(c.c2, canon.c2);
    }
  });

  it("양 끝점은 시작점과 대상이에요", () => {
    const c = curveTo({ x: 10, y: 20 }, { x: 300, y: -40 }, shapeOf(canon));
    close(pointAt(c, 0), { x: 10, y: 20 });
    close(pointAt(c, 1), { x: 300, y: -40 });
  });
});
