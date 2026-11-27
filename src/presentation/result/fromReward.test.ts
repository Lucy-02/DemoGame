import { describe, expect, it } from "vitest";
import { RESULTS } from "./fixtures";

describe("정예 보상 화면 값", () => {
  it("공명 올리기 (0170): 올릴 수 있는 지닌 장비만, 올린 뒤의 줄과 함께 나와요", () => {
    const full = RESULTS.eliteFull.equip!;
    const sal = full.raise.glass_salamander;
    expect(sal.map((o) => o.equipId)).toContain("bronze_helmet");
    for (const o of sal) {
      const before = RESULTS.eliteFull.lanes.find((l) => l.id === "glass_salamander")!.slots[o.slot]!;
      expect(o.after.slots[o.slot]).toMatchObject({ id: o.equipId, resonance: before.resonance + 1, fresh: true });
      expect(o.tip.sheet.item.resonance).toBe(before.resonance + 1);
    }
    // 지닌 장비가 없는 정령은 없어요
    expect(RESULTS.elite.equip!.raise.fire_fox).toBeUndefined();
    expect(RESULTS.elite.equip!.raise.mist_cat).toBeUndefined();
  });
});
