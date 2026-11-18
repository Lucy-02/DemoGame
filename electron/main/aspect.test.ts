import { describe, expect, it } from "vitest";
import { fitResize, fitSnapped, fitStart, type Bounds } from "./aspect";

const FRAME = { width: 16, height: 39 };
const MIN = { width: 640, height: 400 };
const RATIO = 1.6;
const cur: Bounds = { x: 100, y: 100, width: 1280 + FRAME.width, height: 800 + FRAME.height };
const inner = (b: Bounds) => [b.width - FRAME.width, b.height - FRAME.height];

describe("창 끌기 비율 맞춤", () => {
  it("오른쪽 변을 끌면 너비를 따라 높이가 맞고 왼쪽 위는 제자리예요", () => {
    const b = fitResize(cur, { ...cur, width: cur.width + 320 }, "right", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([1600, 1000]);
    expect([b.x, b.y]).toEqual([cur.x, cur.y]);
  });

  it("아래 변을 끌면 높이를 따라 너비가 맞아요", () => {
    const b = fitResize(cur, { ...cur, height: cur.height - 200 }, "bottom", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([960, 600]);
  });

  it("왼쪽 위 모서리를 끌면 오른쪽 아래가 제자리예요", () => {
    const next = { x: cur.x - 320, y: cur.y - 10, width: cur.width + 320, height: cur.height + 10 };
    const b = fitResize(cur, next, "top-left", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([1600, 1000]);
    expect(b.x + b.width).toBe(cur.x + cur.width);
    expect(b.y + b.height).toBe(cur.y + cur.height);
  });

  it("모서리는 커서를 덮는 쪽을 따라가요", () => {
    const b = fitResize(cur, { ...cur, width: cur.width + 10, height: cur.height + 200 }, "bottom-right", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([1600, 1000]);
  });

  it("가장 작은 크기 아래로는 줄지 않아요", () => {
    const b = fitResize(cur, { ...cur, width: 200 }, "right", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([640, 400]);
  });
});

describe("fitStart", () => {
  const BASE = { width: 1280, height: 800 };
  const FRAME = { width: 16, height: 39 };

  it("화면에 들어가면 기준 크기 그대로 열어요", () => {
    expect(fitStart(BASE, { width: 1920, height: 1040 }, FRAME)).toEqual(BASE);
  });

  it("작은 화면에서는 창틀까지 들어가게 비율대로 줄여요", () => {
    for (const work of [{ width: 1366, height: 728 }, { width: 1024, height: 728 }, { width: 1280, height: 760 }]) {
      const s = fitStart(BASE, work, FRAME);
      expect(s.width + FRAME.width).toBeLessThanOrEqual(work.width);
      expect(s.height + FRAME.height).toBeLessThanOrEqual(work.height + 1);
      expect(s.width / s.height).toBeCloseTo(1.6, 2);
    }
  });
});

describe("fitSnapped", () => {
  const FRAME = { width: 16, height: 39 };
  const WORK = { x: 0, y: 0, width: 2560, height: 1400 };

  it("세로로 꽉 찬 창을 비율대로 넓히고 화면 안으로 당겨요", () => {
    const b = fitSnapped({ x: 1100, y: 0, width: 1736, height: 1400 }, FRAME, 1.6, WORK);
    expect((b.width - FRAME.width) / (b.height - FRAME.height)).toBeCloseTo(1.6, 2);
    expect(b.height).toBe(1400);
    expect(b.x + b.width).toBeLessThanOrEqual(WORK.width);
  });

  it("화면보다 넓어지면 줄여요", () => {
    const b = fitSnapped({ x: 0, y: 0, width: 900, height: 1400 }, FRAME, 1.6, { ...WORK, width: 1800 });
    expect(b.width).toBeLessThanOrEqual(1800);
    expect((b.width - FRAME.width) / (b.height - FRAME.height)).toBeCloseTo(1.6, 2);
  });
});
