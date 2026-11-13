import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CARDS } from "../../core/data";
import artIds from "./artIds.json";
import { cardArtOf } from "./art";

describe("카드 일러스트 목록", () => {
  it("목록의 카드마다 그림 파일이 있어요", () => {
    expect(artIds.filter((id) => !existsSync(`public/assets/cards/${id}.webp`))).toEqual([]);
  });

  it("그림은 모두 게임에 있는 카드를 가리켜요", () => {
    const ids = new Set(CARDS.map((c) => c.id));
    expect(artIds.filter((id) => !ids.has(id))).toEqual([]);
  });

  it("목록에 없는 카드는 그림이 없어요", () => {
    expect(cardArtOf(artIds[0])).toBe(artIds[0]);
    expect(cardArtOf("no_such_card")).toBeUndefined();
  });
});
