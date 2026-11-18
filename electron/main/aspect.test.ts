import { describe, expect, it } from "vitest";
import { fitResize, type Bounds } from "./aspect";

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

  it("모서리는 더 많이 바뀐 쪽을 따라가요", () => {
    const b = fitResize(cur, { ...cur, width: cur.width + 10, height: cur.height + 200 }, "bottom-right", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([1600, 1000]);
  });

  it("가장 작은 크기 아래로는 줄지 않아요", () => {
    const b = fitResize(cur, { ...cur, width: 200 }, "right", FRAME, RATIO, MIN);
    expect(inner(b)).toEqual([640, 400]);
  });
});
