import constantsJson from "../data/constants.json";
import spiritsJson from "../data/spirits.json";
import personalitiesJson from "../data/personalities.json";
import { CARD_FILES } from "../data/cards";
import { EQUIP_FILES } from "../data/equipment";
import enemiesJson from "../data/enemies.json";
import encountersJson from "../data/encounters.json";
import eventsJson from "../data/events.json";
import assetsJson from "../data/assets.json";
import growthJson from "../data/growth.json";
import { DEFAULT_LOCALE, cardText, type Locale } from "./l10n";
import type {
  CardData, CardDef, EncounterDef, EnemyDef, EnemyMove, EnemyScale, EquipDef, EventDef, GrowthDef, PersonalityDef, SpiritDef, Element,
} from "./types";

export const C = constantsJson;
export const SPIRITS = spiritsJson as SpiritDef[];
export const PERSONALITIES = personalitiesJson as PersonalityDef[];
/** 모든 카드. 묶음 파일 순서대로 이어 붙여요 (시작 덱 순서가 이 순서를 따라요). */
export const CARDS: CardDef[] = (Object.values(CARD_FILES).flat() as CardData[]).map((d) => ({ ...d, name: "" }));
export const ENEMIES = enemiesJson as EnemyDef[];
/** 장비 정의. 시험에서 항목을 더했다 빼요 */
export const EQUIPMENT: EquipDef[] = Object.values(EQUIP_FILES).flat() as EquipDef[];
export const ENCOUNTERS = encountersJson as EncounterDef[];
export const EVENTS = eventsJson as EventDef[];
export const ASSETS = assetsJson as unknown as AssetsConfig;
export const GROWTH = growthJson as unknown as GrowthDef;

let locale: Locale = DEFAULT_LOCALE;
export const currentLocale = () => locale;

/** 게임 언어를 바꿔요. 카드 정의의 문구 필드를 그 언어로 다시 채워요. */
export function setLocale(next: Locale) {
  locale = next;
  for (const c of CARDS) c.name = cardText(c.id, next).name;
}
setLocale(DEFAULT_LOCALE);

export interface ShapeAsset { type: "shape"; shape: string; color: string; size: number }
export interface ImageAsset { type: "image"; path: string; scale?: number; offsetY?: number }
export interface SpineAsset {
  type: "spine"; skeleton: string; atlas: string; scale?: number; offsetY?: number; size?: number;
  anims?: Record<string, string>; fallback?: ShapeAsset;
}
export type VisualAsset = ShapeAsset | ImageAsset | SpineAsset;
export interface AssetsConfig {
  spirits: Record<string, VisualAsset>;
  enemies: Record<string, VisualAsset>;
}

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
const spiritMap = byId(SPIRITS);
const cardMap = byId(CARDS);
const enemyMap = byId(ENEMIES);
const persMap = byId(PERSONALITIES);

function must<T>(m: Map<string, T>, id: string, what: string): T {
  const v = m.get(id);
  if (!v) throw new Error(`unknown ${what}: ${id}`);
  return v;
}
export const spiritDef = (id: string) => must(spiritMap, id, "spirit");
export const cardDef = (id: string) => must(cardMap, id, "card");
export const enemyDef = (id: string) => must(enemyMap, id, "enemy");

/** 출전 인원에 맞춘 적 세기 (0053). 셋이면 그대로(undefined) */
export function partyScale(size: number): EnemyScale | undefined {
  return (C.party_scale as Record<string, EnemyScale>)[String(size)];
}

/** 세기를 곱한 적 데이터. HP · 방어도 · 회복은 hp, 피해 · 화상 · 새끼 피해는 dmg */
export function scaleEnemy(def: EnemyDef, k: EnemyScale): EnemyDef {
  const up = (v: number, m: number) => Math.max(1, Math.round(v * m));
  const move = (m: EnemyMove): EnemyMove => ({
    ...m,
    actions: m.actions.map((a) =>
      a.type === "attack" ? { ...a, dmg: up(a.dmg, k.dmg) }
      : a.type === "burn" || a.type === "buffMinions" ? { ...a, value: up(a.value, k.dmg) }
      : a.type === "block" || a.type === "sapHeal" ? { ...a, value: up(a.value, k.hp) }
      : a),
  });
  return {
    ...def,
    hp: up(def.hp, k.hp),
    pattern: def.pattern.map(move),
    phase2: def.phase2 && { ...def.phase2, turnStartBlock: up(def.phase2.turnStartBlock, k.hp), pattern: def.phase2.pattern.map(move) },
  };
}
export function equipDef(id: string): EquipDef {
  const d = EQUIPMENT.find((e) => e.id === id);
  if (!d) throw new Error(`unknown equipment: ${id}`);
  return d;
}
export const personalityDef = (id: string) => must(persMap, id, "personality");

export const ELEMENT_NAME: Record<Element, string> = {
  fire: "불", water: "물", forest: "숲", wind: "바람", light: "빛", earth: "땅", none: "무",
};
/** 빛 · 땅은 임시값(TODO_TOKEN) */
export const ELEMENT_COLOR: Record<Element, number> = {
  fire: 0xe8643a, water: 0x3d8fe0, forest: 0x4fae5c, wind: 0x8fb8c8, light: 0xe8d58a, earth: 0xb08a5a, none: 0x9a93a8,
};
export const ROLE_NAME: Record<string, string> = {
  attack: "공격", guard: "수호", support: "보조", disrupt: "교란",
};
export const RARITY_NAME: Record<string, string> = {
  basic: "기본", common: "일반", advanced: "고급", rare: "희귀",
};

/** 공격 속성 → 대상 속성 배율. */
export function affinity(atk: Element, def: Element): number {
  const beats = C.affinity_beats as Record<string, string>;
  if (beats[atk] === def) return C.affinity_weak;
  if (beats[def] === atk) return C.affinity_resist;
  return 1;
}
