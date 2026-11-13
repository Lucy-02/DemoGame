// 규칙 데이터(정령·카드) → 런 화면 값 (카드, 정령 줄). 고정 장면과, 런에 연결할 때 함께 써요.
import { C, ELEMENT_NAME, EQUIP_RARITY_NAME, cardDef, equipDef, spiritDef } from "../../core/data";
import { baseStat, equipSlots, maxHpOf, resonanceCap, resonanceOf, round } from "../../core/stats";
import { describeCard } from "../../core/text";
import type { CardDef, CardOp, RunEquip, RunSpirit, Stage } from "../../core/types";
import { isCardArtId } from "../card/art";
import type { CardRarity, CardVM, CardValueVM, Material, RichText } from "../card/viewmodel";
import type { FaceId } from "../faces";
import { spiritArt } from "../spiritArt";
import { ELEMENT_ICON } from "../spirits/fromGarden";
import { COPY, MATERIAL_NAME } from "./copy";
import { STAT_IDS, type EquipVM, type LaneVM, type StatId } from "./viewmodel";

/** 카드 그림 창 윗선은 정본 세 정령 모양뿐이에요. 다른 정령은 속성이 같은 모양을 임시로 빌려요 (0044 열린 질문) */
const WINDOW_OF: Record<string, FaceId> = { fire: "fire", water: "jelly" };
const windowOf = (spiritId: string): FaceId => WINDOW_OF[spiritDef(spiritId).element] ?? "star";

const MATERIALS: readonly string[] = ["fire", "water", "wind"];
const materialOf = (element: string): Material => (MATERIALS.includes(element) ? (element as Material) : "none");

/** 효과문에서 숫자는 강조, 상태 이름은 용어 밑줄로 (TEXT_RULES). 용어 목록은 임시예요: 키워드 사전이 생기면 거기서 읽어요 */
const TERMS = ["화상", "냉기", "취약", "약화", "도발", "반격", "소멸", "빙결", "브레이크"];
const SPLIT = new RegExp(`(\\d+|${TERMS.join("|")})`);
export function richText(text: string): RichText {
  return text.split(SPLIT).filter(Boolean).map((t) => (/^\d+$/.test(t) ? { text: t, strong: true } : TERMS.includes(t) ? { text: t, term: true } : { text: t }));
}

/** 카드 수치판 기호 (임시: 효과 → 기호 표가 정본으로 정해지면 거기서 읽어요). 숫자가 있는 효과만 실어요 */
const OP_ICON: Partial<Record<CardOp["op"], string>> = {
  damage: "fx-damage", block: "fx-block", wall: "fx-block", heal: "fx-heal", draw: "fx-draw",
  burn: "kw-burn", chill: "kw-chill", weak: "kw-weak", vulnerable: "kw-vuln", thorns: "kw-thorns",
};
const PLATE_MAX = 2;

/** 수치판: 앞에서부터 기호가 있는 효과 두 개까지, 원래 숫자로 */
export function valuesOf(def: CardDef): CardValueVM[] {
  return def.effects.flatMap((op): CardValueVM[] => {
    const icon = OP_ICON[op.op];
    const n = "value" in op && typeof op.value === "number" ? op.value : "turns" in op && typeof op.turns === "number" ? op.turns : undefined;
    if (!icon || n === undefined) return [];
    return [{ icon, n, mult: "hits" in op ? op.hits : undefined }];
  }).slice(0, PLATE_MAX);
}

/** 이 카드가 쓰는 능력치: 그 능력치만 두 배로 했을 때 효과문 숫자가 달라지는 첫 번째 */
export function statOf(def: CardDef): StatId | undefined {
  const base = { power: C.stat_base, guard: C.stat_base, focus: C.stat_base };
  const plain = describeCard(def, base);
  return STAT_IDS.find((k) => describeCard(def, { ...base, [k]: base[k] * 2 }) !== plain);
}

/** 카드 한 장. 숫자는 원래 값이에요 (0044: describeCard(def, null)). ownerId가 없으면 주인이 정해지지 않은 카드 */
export function cardVM(cardId: string, ownerId?: string): CardVM {
  const def = cardDef(cardId);
  const material = materialOf(def.element);
  const who = ownerId ? spiritDef(ownerId).name : COPY.shared;
  return {
    key: cardId, name: def.name, cost: def.cost, owner: ownerId ? windowOf(ownerId) : "star", material,
    element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, art: "i-spark",
    illustration: isCardArtId(cardId) ? cardId : undefined,
    rarity: def.rarity === "basic" ? undefined : (def.rarity as CardRarity),
    values: valuesOf(def),
    detail: { text: richText(describeCard(def, null)), owner: [who, ELEMENT_NAME[def.element], MATERIAL_NAME[material]].filter(Boolean).join(COPY.sep) },
  };
}

/** 장비 하나. 공명 점 수는 이 단계의 상한과 장비의 단계 수 중 작은 쪽이에요 */
export function equipVM(e: RunEquip, stage: Stage): EquipVM {
  const def = equipDef(e.id);
  return {
    id: e.id, rarity: def.rarity, rarityName: EQUIP_RARITY_NAME[def.rarity],
    resonance: resonanceOf(e), cap: Math.min(resonanceCap(stage), def.tiers.length),
  };
}

/** 정령 줄에서 장비에 따라 바뀌는 값: HP · 능력치 · 칸 */
function equipPart(rs: RunSpirit): Pick<LaneVM, "hp" | "maxHp" | "stats" | "slots"> {
  const stats = Object.fromEntries(STAT_IDS.map((k) => [k, round(baseStat(rs, k))])) as Record<StatId, number>;
  const slots = Array.from({ length: equipSlots(rs.stage) }, (_, i) => (rs.equipment[i] ? equipVM(rs.equipment[i], rs.stage) : null));
  return { hp: rs.hp, maxHp: maxHpOf(rs), stats, slots };
}

/** 같은 줄을 정령의 새 상태(장비를 받은 뒤)로 다시 그릴 값 */
export const laneWith = (l: LaneVM, rs: RunSpirit): LaneVM => ({ ...l, ...equipPart(rs) });

export interface LaneExtras {
  exp: LaneVM["exp"];
  levelUp?: boolean;
  down?: boolean;
  badges?: LaneVM["badges"];
  unlocked?: string[];
  deck?: number;
}

/** 정령 줄. 능력치는 단계·성격 보정을 넣은 값이에요 (0044) */
export function lane(rs: RunSpirit, extras: LaneExtras = { exp: { before: 0, after: 0 } }): LaneVM {
  const art = spiritArt(rs.id, rs.stage);
  return {
    id: rs.id, name: spiritDef(rs.id).name, level: rs.level, levelUp: extras.levelUp,
    ...equipPart(rs), down: extras.down, exp: extras.exp,
    face: art?.crop && { key: art.body, crop: art.crop },
    badges: extras.badges ?? [], unlocked: extras.unlocked ?? [], deck: extras.deck,
  };
}
