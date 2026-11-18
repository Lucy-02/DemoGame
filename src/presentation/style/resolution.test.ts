import { describe, expect, it } from "vitest";
import { pickResolution } from "./resolution";

const BASE = { w: 1280, h: 800 };

describe("그리는 배수 고르기", () => {
  it("모니터에 꽉 채웠을 때 필요한 만큼 골라요", () => {
    expect(pickResolution(BASE, { w: 1280, h: 800 }, 1)).toBe(1);
    expect(pickResolution(BASE, { w: 1920, h: 1080 }, 1)).toBe(2);
    expect(pickResolution(BASE, { w: 2560, h: 1440 }, 1)).toBe(2);
    expect(pickResolution(BASE, { w: 3840, h: 2160 }, 1)).toBe(3);
  });

  it("기기 배율을 곱해요 (레티나)", () => {
    expect(pickResolution(BASE, { w: 1440, h: 900 }, 2)).toBe(2);
  });

  it("조금 큰 화면은 늘여 그려요", () => {
    expect(pickResolution(BASE, { w: 1536, h: 960 }, 1)).toBe(1);
    expect(pickResolution(BASE, { w: 1400, h: 950 }, 1)).toBe(1);
  });

  it("고정 값이 있으면 그 값, 가장 크게 3", () => {
    expect(pickResolution(BASE, { w: 1280, h: 800 }, 1, 2)).toBe(2);
    expect(pickResolution(BASE, { w: 1280, h: 800 }, 1, 8)).toBe(3);
  });
});
