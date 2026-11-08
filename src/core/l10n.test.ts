import { afterEach, describe, expect, it } from "vitest";
import { CARDS, cardDef, setLocale } from "./data";
import { DEFAULT_LOCALE, cardText } from "./l10n";

describe("언어별 문구", () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it("언어를 바꾸면 카드 이름이 그 언어로 바뀌어요", () => {
    expect(cardDef("fire_claw").name).toBe("불꽃 발톱");
    setLocale("en");
    expect(cardDef("fire_claw").name).toBe("Flame Claw");
    expect(CARDS.every((c) => c.name.length > 0)).toBe(true);
  });

  it("없는 id는 오류예요", () => {
    expect(() => cardText("no_such_card")).toThrow();
  });
});
