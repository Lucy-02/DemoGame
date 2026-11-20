// 규칙 데이터(정령·카드) → 런 화면 값 (카드, 정령 줄). 고정 장면과, 런에 연결할 때 함께 써요.
import { C, ELEMENT_NAME, EQUIP_RARITY_NAME, baseCardId, cardDef, equipDef, equipName, isUpgradedId, spiritDef, upgradedId } from "../../core/data";
import { levelProgress } from "../../core/growth";
import { baseStat, equipSlots, maxHpOf, resonanceCap, resonanceOf, round, scale } from "../../core/stats";
import { signatureSwapOf } from "../../core/run";
import { castAmount, castDamage, describeCard, describeEquipTier, describeSignatureSwap, type CastMult } from "../../core/text";
import type { CardDef, CardOp, DeckCard, EquipTier, RunEquip, RunSpirit, Stage } from "../../core/types";
import { cardArtOf } from "../card/art";
import type { CardRarity, CardVM, CardValueVM, Material, RichText } from "../card/viewmodel";
import { ELEMENT_ICON, ROLE_ICON, type FaceId } from "../faces";
import { TEXT_TERMS } from "../glossary/terms";
import { spiritArt } from "../spiritArt";
import { COPY, MATERIAL_NAME } from "./copy";
import { STAT_IDS, type EquipChipVM, type EquipSheetVM, type EquipStatId, type EquipVM, type LaneVM, type StatId } from "./viewmodel";

/** 카드 그림 창 윗선은 정본 세 정령 모양뿐이에요. 다른 정령은 속성이 같은 모양을 임시로 빌려요 (0044 열린 질문) */
const WINDOW_OF: Record<string, FaceId> = { fire: "fire", water: "jelly" };
const windowOf = (spiritId: string): FaceId => WINDOW_OF[spiritDef(spiritId).element] ?? "star";

const MATERIALS: readonly string[] = ["fire", "water", "wind"];
const materialOf = (element: string): Material => (MATERIALS.includes(element) ? (element as Material) : "none");

/** 효과문에서 숫자는 강조, 용어는 밑줄로 (TEXT_RULES). 용어 목록은 용어 사전에서 읽어요 (0102) */
const TERMS = TEXT_TERMS;
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

/** 수치판 숫자가 따르는 능력치 (효과문과 같은 능력치: core/battle/effects.ts). 없는 효과는 능력치를 따르지 않아요 */
const OP_STAT: Partial<Record<CardOp["op"], StatId>> = {
  damage: "power", block: "guard", wall: "guard", thorns: "guard", heal: "focus", burn: "focus", chill: "focus",
};

/** 카드 숫자를 계산할 정령의 값: 능력치와, 있으면 그 정령에게 붙은 배율(해방 등) */
export type CardStats = Record<StatId, number> & { mult?: CastMult };

/** 능력치와 배율을 넣은 수치판 숫자. 효과문과 같은 계산이에요 (core/text.ts) */
function cast(op: CardOp, base: number, k: StatId, st: CardStats): number {
  if (op.op === "damage") return castDamage(base, st);
  if (op.op === "burn" || op.op === "chill" || op.op === "heal") return castAmount(base, st, op.op);
  return scale(base, st[k]);
}

const opBase = (op: CardOp): number | undefined => ("value" in op && typeof op.value === "number" ? op.value
  : "turns" in op && typeof op.turns === "number" ? op.turns : undefined);

/** 수치판: 앞에서부터 기호가 있는 효과 두 개까지. st가 없으면 원래 숫자, 있으면 그 정령의 능력치로 계산한 숫자.
 *  카드에 찍힌 숫자(강화 전 카드)보다 오르면 ▲: 능력치로 오른 값과 강화로 오른 값이 같은 표식이에요 (0080) */
export function valuesOf(def: CardDef, st?: CardStats): CardValueVM[] {
  const printed = isUpgradedId(def.id) ? cardDef(baseCardId(def.id)).effects : def.effects;
  return def.effects.flatMap((op, i): CardValueVM[] => {
    const icon = OP_ICON[op.op];
    const base = opBase(op);
    if (!icon || base === undefined) return [];
    const k = "value" in op && typeof op.value === "number" ? OP_STAT[op.op] : undefined;
    const n = st && k ? cast(op, base, k, st) : base;
    const was = opBase(printed[i]) ?? base;
    return [{ icon, n, mult: "hits" in op ? op.hits : undefined, ...(n > was ? { up: true } : {}) }];
  }).slice(0, PLATE_MAX);
}

/** 이 카드가 쓰는 능력치: 그 능력치만 두 배로 했을 때 효과문 숫자가 달라지는 첫 번째 */
export function statOf(def: CardDef): StatId | undefined {
  const base = { power: C.stat_base, guard: C.stat_base, focus: C.stat_base };
  const plain = describeCard(def, base);
  return STAT_IDS.find((k) => describeCard(def, { ...base, [k]: base[k] * 2 }) !== plain);
}

/** 카드 한 장. 숫자는 원래 값이에요 (0044: describeCard(def, null)). st를 주면 그 정령의 능력치로 계산한 값이에요.
 *  ownerId가 없으면 주인이 정해지지 않은 카드 */
export function cardVM(cardId: string, ownerId?: string, st?: CardStats): CardVM {
  const def = cardDef(cardId);
  const material = materialOf(def.element);
  const who = ownerId ? spiritDef(ownerId).name : COPY.shared;
  return {
    key: cardId, name: def.name, cost: def.cost, owner: ownerId ? windowOf(ownerId) : "star", material,
    ...(ownerId ? { role: ROLE_ICON[spiritDef(ownerId).role] } : {}),
    element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, art: "i-spark",
    illustration: cardArtOf(baseCardId(cardId)),
    rarity: def.rarity === "basic" ? undefined : (def.rarity as CardRarity),
    values: valuesOf(def, st),
    detail: { text: richText(describeCard(def, st ?? null)), owner: [who, ELEMENT_NAME[def.element], MATERIAL_NAME[material], isUpgradedId(cardId) ? COPY.upgraded : undefined].filter(Boolean).join(COPY.sep) },
  };
}

/** 덱 카드 한 장. 강화한 카드는 강화한 숫자로(▲) 보여요 (0080) */
export const deckCardVM = (c: DeckCard): CardVM => cardVM(c.upgraded ? upgradedId(c.cardId) : c.cardId, c.owner);

/** 해방 카드 (0075 · 0076 3번): 각성체 손패 묶음 끝에 붙는 한 장. 비용 동전 = 쓰는 칸. 이름 띠는 "해방" (정령별 해방 이름은 아직 TODO_NAME) */
export function releaseVM(spiritId: string, slots: number): CardVM {
  const def = spiritDef(spiritId);
  return {
    key: spiritId, name: COPY.release, cost: slots, owner: windowOf(spiritId), material: materialOf(def.element), role: ROLE_ICON[def.role],
    element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, art: "i-spark", values: [],
    detail: { text: richText(def.release.desc), owner: [def.name, COPY.release].join(COPY.sep) },
  };
}

/** 장비 하나. 공명 점 수는 이 단계의 상한과 장비의 단계 수 중 작은 쪽이에요 */
export function equipVM(e: RunEquip, stage: Stage): EquipVM {
  const def = equipDef(e.id);
  return {
    id: e.id, name: equipName(e.id), rarity: def.rarity, rarityName: EQUIP_RARITY_NAME[def.rarity],
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

/** 지금 레벨 안에서 채운 몫 (0~1, 정령 줄의 링). 최대 레벨이면 가득 */
export function levelFill(exp: number): number {
  const p = levelProgress(exp);
  return p.next === undefined ? 1 : (exp - p.from) / (p.next - p.from);
}

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

const EQUIP_STATS: readonly string[] = ["hp", "power", "guard", "focus"] satisfies EquipStatId[];
const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;

/** 이 층이 조건 없이 주는 수치 (조건부 · 치명 · 스피드는 효과문으로 나와요) */
const chips = (tier: EquipTier): EquipChipVM[] => (tier.stats ?? [])
  .filter((m) => !m.when && EQUIP_STATS.includes(m.stat))
  .map((m) => ({ stat: m.stat as EquipStatId, neg: m.value < 0, label: `${m.value < 0 ? "-" : "+"}${m.op === "pct" ? pct(m.value) : Math.abs(m.value)}` }));

/**
 * 장비 하나의 말풍선 값. hasCard = 그 정령의 덱에 대표 카드가 있나 (없으면 바뀔 카드가 없어요). holder를 주면 그 정령이 지녔을 때의 모습이에요: 공명 점 상한, 갈래의 기술 카드, 그 정령 능력치로 계산한 카드 숫자.
 */
export function equipSheet(e: RunEquip, holder?: RunSpirit, hasCard: (cardId: string) => boolean = () => true): EquipSheetVM {
  const def = equipDef(e.id);
  const item = equipVM(e, holder?.stage ?? "awakened");
  const tiers: EquipTier[] = [def.tiers[item.resonance - 1], ...(def.downside ? [def.downside] : [])];
  const out: EquipSheetVM = { item, chips: tiers.flatMap(chips), lines: tiers.flatMap(describeEquipTier) };
  if (def.signature && holder) {
    const swap = signatureSwapOf(holder, e);
    const inDeck = hasCard(def.signature.card);
    if (swap && inDeck) {
      out.lines.push(describeSignatureSwap(swap.from, swap.to));
      const st = { power: baseStat(holder, "power"), guard: baseStat(holder, "guard"), focus: baseStat(holder, "focus") };
      out.card = { vm: cardVM(swap.to, holder.id, st), text: describeCard(cardDef(swap.to), st) };
    } else if (!swap) {
      out.note = COPY.noBranch;
    }
  }
  return out;
}

