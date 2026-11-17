import { describe, expect, it } from "vitest";
import { admit, BANK, MUSIC_IDS, nextVariant, SFX_IDS } from "./sounds";

describe("소리 은행", () => {
  it("은행의 사건 이름은 목록에 있는 것만", () => {
    for (const id of Object.keys(BANK.sfx)) expect(SFX_IDS).toContain(id);
    for (const id of Object.keys(BANK.music)) expect(MUSIC_IDS).toContain(id);
    expect(BANK.voices).toBeGreaterThan(0);
  });

  it("바로 앞에 난 파일은 피해요", () => {
    expect(nextVariant(1, 0, () => 0.9)).toBe(0);
    for (const r of [0, 0.4, 0.99]) expect(nextVariant(3, 1, () => r)).not.toBe(1);
  });

  it("자리가 남으면 그냥 나요", () => {
    expect(admit(["ui.hover"], "ui.click", 2)).toBe("play");
  });

  it("꽉 차면 가장 작은 사건이 빠져요", () => {
    expect(admit(["hit.heavy", "ui.hover"], "release", 2)).toBe(1);
    expect(admit(["ui.hover", "hit.heavy", "ui.hover"], "block", 3)).toBe(0);
  });

  it("새 소리가 가장 작은 사건이면 나지 않아요", () => {
    expect(admit(["release", "hit.heavy"], "ui.hover", 2)).toBe("skip");
  });
});
