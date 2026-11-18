import { afterEach, describe, expect, it } from "vitest";
import { CARDS, cardDef, setLocale } from "./data";
import { DEFAULT_LOCALE, cardText } from "./l10n";
import { describeCard, setCardTextWriter } from "./text";

describe("언어별 문구", () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it("언어를 바꾸면 카드 이름이 그 언어로 바뀌어요", () => {
    expect(cardDef("fire_claw").name).toBe("불꽃 발톱");
    setLocale("en");
    expect(cardDef("fire_claw").name).toBe("Flame Claw");
    expect(CARDS.every((c) => c.name.length > 0)).toBe(true);
  });

  it("다른 언어는 효과 종류와 보정된 수치를 받아 자기 틀로 효과문을 써요", () => {
    const def = cardDef("fire_claw");
    const ko = describeCard(def, null);
    setCardTextWriter("en", (d, n) => d.effects.map((op) => `${op.op}:${"value" in op && typeof op.value === "number" ? n.main(op.value) : ""}`).join(" "));
    setLocale("en");
    expect(describeCard(def, null)).toMatch(/^damage:\d+/);
    setLocale(DEFAULT_LOCALE);
    expect(describeCard(def, null)).toBe(ko);
    setCardTextWriter("en", undefined);
    setLocale("en");
    expect(describeCard(def, null)).toBe(ko);
  });

  it("없는 id는 오류예요", () => {
    expect(() => cardText("no_such_card")).toThrow();
  });
});
