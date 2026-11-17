import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TERMS, TEXT_TERMS, termBody, termOfIcon } from "./terms";

const ICONS = new Set(JSON.parse(readFileSync("public/assets/ui/icons/index.json", "utf8")) as string[]);

describe("용어 사전", () => {
  it("id와 이름이 겹치지 않아요", () => {
    expect(new Set(TERMS.map((t) => t.id)).size).toBe(TERMS.length);
    expect(new Set(TERMS.map((t) => t.name)).size).toBe(TERMS.length);
  });

  it("기호는 정본 세트에 있고, 기호로 용어를 찾아요", () => {
    for (const t of TERMS) if (t.icon) expect(ICONS.has(t.icon), t.icon).toBe(true);
    expect(termOfIcon("kw-strength")?.name).toBe("강화");
    expect(termOfIcon("el-fire")).toBeUndefined();
  });

  it("풀이는 합니다체 완결문 한두 문장이에요 (TEXT_RULES 2절)", () => {
    for (const t of TERMS) {
      for (const s of [t.what, ...(t.when ? [t.when] : [])]) expect(s, t.name).toMatch(/니다\.$/);
      expect(termBody(t)).not.toMatch(/[이가을를은는]\(|당신|여러분/);
    }
  });

  it("효과문에서 밑줄을 긋는 용어는 그대로예요", () => {
    expect([...TEXT_TERMS].sort()).toEqual(["화상", "냉기", "취약", "약화", "도발", "반격", "소멸", "빙결", "브레이크"].sort());
  });
});
