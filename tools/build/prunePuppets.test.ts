import { describe, expect, it } from "vitest";
import { unusedPuppets } from "./prunePuppets";

describe("패키지에서 빼는 퍼핏", () => {
  it("정령 데이터에 있는 정령의 퍼핏만 남겨요", () => {
    expect(unusedPuppets(["mist-cat", "night-owl", "glass-salamander"], ["mist_cat", "glass_salamander", "fire_fox"])).toEqual(["night-owl"]);
  });
});
