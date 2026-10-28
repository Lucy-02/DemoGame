import constantsJson from "../data/constants.json";
import spiritsJson from "../data/spirits.json";
import personalitiesJson from "../data/personalities.json";
import cardsJson from "../data/cards.json";
import enemiesJson from "../data/enemies.json";
import encountersJson from "../data/encounters.json";
import eventsJson from "../data/events.json";
import assetsJson from "../data/assets.json";
import type {
  CardDef, EncounterDef, EnemyDef, EventDef, PersonalityDef, SpiritDef, Element,
} from "./types";

export const C = constantsJson;
export const SPIRITS = spiritsJson as SpiritDef[];
export const PERSONALITIES = personalitiesJson as PersonalityDef[];
export const CARDS = cardsJson as CardDef[];
export const ENEMIES = enemiesJson as EnemyDef[];
export const ENCOUNTERS = encountersJson as EncounterDef[];
export const EVENTS = eventsJson as EventDef[];
export const ASSETS = assetsJson as unknown as AssetsConfig;

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
export const personalityDef = (id: string) => must(persMap, id, "personality");

export const ELEMENT_NAME: Record<Element, string> = {
  fire: "불", water: "물", forest: "숲", wind: "바람", none: "무",
};
export const ELEMENT_COLOR: Record<Element, number> = {
  fire: 0xe8643a, water: 0x3d8fe0, forest: 0x4fae5c, wind: 0x8fb8c8, none: 0x9a93a8,
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
