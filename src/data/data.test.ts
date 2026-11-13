// 데이터 무결성: JSON끼리 가리키는 ID가 모두 있는지 확인해요.
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ASSETS, CARDS, ENCOUNTERS, ENEMIES, EQUIPMENT, GROWTH, PERSONALITIES, SPIRITS, equipName } from "../core/data";
import { DEFAULT_LOCALE, LOCALE_IDS, cardTextIds, equipTextIds } from "../core/l10n";
import { cardProblems, equipProblems } from "../core/validate";
import { CARD_FILES } from "./cards";
import { EQUIP_FILES } from "./equipment";
import { LOCALES } from "./locales";

const ids = <T extends { id: string }>(xs: T[]) => new Set(xs.map((x) => x.id));

describe("데이터 무결성", () => {
  it("ID가 겹치지 않는다", () => {
    for (const list of [SPIRITS, CARDS, ENEMIES, PERSONALITIES, ENCOUNTERS, EQUIPMENT] as { id: string }[][]) {
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

  it("카드 데이터가 형식에 맞아요", () => {
    const spiritIds = ids(SPIRITS);
    expect(Object.values(CARD_FILES).flat().flatMap((c) => cardProblems(c, spiritIds))).toEqual([]);
  });

  it("장비 데이터가 형식에 맞고, 묶음 파일이 모두 목록에 있어요", () => {
    const spiritIds = ids(SPIRITS);
    expect(Object.values(EQUIP_FILES).flat().flatMap((e) => equipProblems(e, spiritIds, ids(CARDS)))).toEqual([]);
    const files = readdirSync(new URL("./equipment", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
    expect(files.sort()).toEqual(Object.keys(EQUIP_FILES).sort());
    expect(GROWTH.equip_slots).toHaveLength(3);
    expect(GROWTH.equip_resonance_cap).toHaveLength(3);
  });

  it("카드 묶음 파일이 모두 목록에 있어요", () => {
    const files = readdirSync(new URL("./cards", import.meta.url)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
    expect(files.sort()).toEqual(Object.keys(CARD_FILES).sort());
  });

  it("언어 폴더가 모두 목록에 있어요", () => {
    const dirs = readdirSync(new URL("./locales", import.meta.url), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    expect(dirs.sort()).toEqual(Object.keys(LOCALES).sort());
  });

  it("기본 언어는 모든 카드 이름이 있고, 어느 언어든 없는 카드를 적지 않아요", () => {
    const cardIds = ids(CARDS);
    expect(CARDS.filter((c) => !cardTextIds(DEFAULT_LOCALE).includes(c.id)).map((c) => c.id)).toEqual([]);
    for (const locale of LOCALE_IDS) {
      expect(cardTextIds(locale).filter((id) => !cardIds.has(id)).map((id) => `${locale}:${id}`)).toEqual([]);
    }
  });

  it("기본 언어는 모든 장비 이름이 있고, 어느 언어든 없는 장비를 적지 않아요", () => {
    const equipIds = ids(EQUIPMENT);
    expect(EQUIPMENT.filter((e) => !equipTextIds(DEFAULT_LOCALE).includes(e.id)).map((e) => e.id)).toEqual([]);
    for (const locale of LOCALE_IDS) {
      expect(equipTextIds(locale).filter((id) => !equipIds.has(id)).map((id) => `${locale}:${id}`)).toEqual([]);
    }
    const names = EQUIPMENT.map((e) => equipName(e.id));
    expect(new Set(names).size).toBe(names.length);
  });
});
