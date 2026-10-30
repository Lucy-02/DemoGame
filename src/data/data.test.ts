// 데이터 무결성: JSON끼리 가리키는 ID가 모두 있는지 확인해요.
import { describe, expect, it } from "vitest";
import { ASSETS, CARDS, ENCOUNTERS, ENEMIES, GROWTH, PERSONALITIES, SPIRITS } from "../core/data";

const ids = <T extends { id: string }>(xs: T[]) => new Set(xs.map((x) => x.id));

describe("데이터 무결성", () => {
  it("ID가 겹치지 않는다", () => {
    for (const list of [SPIRITS, CARDS, ENEMIES, PERSONALITIES, ENCOUNTERS] as { id: string }[][]) {
      expect(ids(list).size).toBe(list.length);
    }
  });

  it("인카운터의 적이 모두 있다", () => {
    const enemyIds = ids(ENEMIES);
    const missing = ENCOUNTERS.flatMap((e) => e.enemies.filter((id) => !enemyIds.has(id)).map((id) => `${e.id}→${id}`));
    expect(missing).toEqual([]);
  });

  it("정령과 적마다 비주얼 지정이 있다", () => {
    expect(SPIRITS.filter((s) => !ASSETS.spirits[s.id]).map((s) => s.id)).toEqual([]);
    expect(ENEMIES.filter((e) => !ASSETS.enemies[e.id]).map((e) => e.id)).toEqual([]);
  });

  it("성장: 정령마다 유체에서 시작하는 진화가 있고, 진화는 있는 정령만 가리켜요", () => {
    const spiritIds = ids(SPIRITS);
    expect(GROWTH.evolutions.filter((e) => !spiritIds.has(e.spirit)).map((e) => e.spirit)).toEqual([]);
    expect(SPIRITS.filter((s) => !GROWTH.evolutions.some((e) => e.spirit === s.id && e.from === "baby")).map((s) => s.id)).toEqual([]);
    expect([...GROWTH.levels].sort((a, b) => a - b)).toEqual(GROWTH.levels);
  });
});
