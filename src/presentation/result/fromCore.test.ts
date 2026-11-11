import { describe, expect, it } from "vitest";
import { cardDef } from "../../core/data";
import { richText, statOf } from "./fromCore";
import { RESULTS } from "./fixtures";

describe("전투 결과 화면 값", () => {
  it("카드가 쓰는 능력치를 효과문에서 찾아요", () => {
    expect(statOf(cardDef("ember_flick"))).toBe("focus");
    expect(statOf(cardDef("ignite"))).toBe("power");
    expect(statOf(cardDef("molten_stance"))).toBe("guard");
    // 방어도만큼 피해: 능력치로 달라지는 숫자가 없어요
    expect(statOf(cardDef("glass_shatter"))).toBeUndefined();
  });

  it("효과문의 숫자는 강조, 상태 이름은 용어로 나눠요", () => {
    expect(richText("화상을 2 부여합니다.")).toEqual([
      { text: "화상", term: true }, { text: "을 " }, { text: "2", strong: true }, { text: " 부여합니다." },
    ]);
  });

  it("보상 카드는 주인 줄이 있고, 왼→오 순서가 줄 위→아래 순서와 같아요 (0051)", () => {
    for (const vm of Object.values(RESULTS)) {
      expect(vm.cards.map((c) => c.owner)).toEqual(vm.lanes.map((l) => l.id));
    }
  });
});
