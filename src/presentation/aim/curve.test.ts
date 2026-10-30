import { describe, expect, it } from "vitest";
import { lastCrossing, lengthOf, pointAt, routeCurves, splitAt, trunkRule, type Cubic } from "./curve";

// 정본 .aimline path "M 1026 650 C 1250 630, 1256 340, 1170 322"
const canon: Cubic = { p0: { x: 1026, y: 650 }, c1: { x: 1250, y: 630 }, c2: { x: 1256, y: 340 }, p3: { x: 1170, y: 322 } };
const rule = trunkRule(canon);

const close = (a: { x: number; y: number }, b: { x: number; y: number }, digits = 6) => {
  expect(a.x).toBeCloseTo(b.x, digits);
  expect(a.y).toBeCloseTo(b.y, digits);
};

describe("조준선 모양", () => {
  it("줄기 규칙은 정본 예시를 그대로 재현해요", () => {
    const c = rule(canon.p0, canon.p3);
    close(c.c1, canon.c1);
    close(c.c2, canon.c2);
  });

  it("나눈 두 곡선은 원래 곡선과 같은 점을 지나요", () => {
    const [a, b] = splitAt(canon, 0.3);
    close(pointAt(a, 1), pointAt(canon, 0.3));
    close(pointAt(a, 0.5), pointAt(canon, 0.15));
    close(pointAt(b, 0.5), pointAt(canon, 0.65));
    close(pointAt(b, 1), canon.p3);
  });

  it("끝에서 거슬러 처음 지나는 y 줄을 찾아요", () => {
    const t = lastCrossing(canon, 356)!;
    expect(pointAt(canon, t).y).toBeCloseTo(356, 3);
    expect(lastCrossing(canon, 300)).toBeUndefined();
  });
});

describe("조준선 길", () => {
  const route = { via: canon.p3, branchY: 356 };

  it("via 대상 하나면 줄기와 갈래를 이으면 정본 한 줄이에요", () => {
    const [stem, branch] = routeCurves(rule, canon.p0, [canon.p3], route);
    close(pointAt(stem.curve, 0), canon.p0);
    close(branch.curve.p0, stem.curve.p3);
    close(pointAt(branch.curve, 1), canon.p3);
    expect(stem.curve.p3.y).toBeCloseTo(356, 3);
    // 점선 무늬는 줄기 길이만큼 밀려서 이어져요
    expect(branch.dashOffset).toBeCloseTo(lengthOf(stem.curve), 6);
    expect(lengthOf(stem.curve) + lengthOf(branch.curve)).toBeCloseTo(lengthOf(canon), 1);
  });

  it("여럿을 고르면 줄기 하나에서 대상마다 갈라져요", () => {
    const left = { x: 792, y: 322 };
    const strokes = routeCurves(rule, canon.p0, [left, canon.p3], route);
    expect(strokes).toHaveLength(3);
    const [stem, ...branches] = strokes;
    for (const b of branches) close(b.curve.p0, stem.curve.p3);
    close(branches[0].curve.p3, left);
    // 갈래는 갈림점보다 아래(정보판 쪽)로 내려가지 않아요
    for (let i = 0; i <= 32; i++) expect(pointAt(branches[0].curve, i / 32).y).toBeLessThanOrEqual(356 + 1e-6);
  });

  it("길이 없으면 대상마다 곧장 그어요", () => {
    const strokes = routeCurves(rule, canon.p0, [canon.p3]);
    expect(strokes).toHaveLength(1);
    close(strokes[0].curve.c1, canon.c1);
  });
});
