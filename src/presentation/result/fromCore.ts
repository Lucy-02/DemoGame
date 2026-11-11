// 규칙 데이터(정령·카드) → 전투 결과 화면 값. 고정 장면과, 나중에 런에 연결할 때 함께 써요.
import { C, ELEMENT_NAME, cardDef, spiritDef } from "../../core/data";
import { baseStat, maxHpOf, round } from "../../core/stats";
import { describeCard } from "../../core/text";
import type { CardDef, RunSpirit } from "../../core/types";
import { isCardArtId } from "../card/art";
import type { CardRarity, CardVM, CardValueVM, Material, RichText } from "../card/viewmodel";
import type { FaceId } from "../faces";
import { spiritArt } from "../spiritArt";
import { ELEMENT_ICON } from "../spirits/fromGarden";
import { COPY, MATERIAL_NAME } from "./copy";
import { STAT_IDS, type LaneVM, type RewardCardVM, type StatId } from "./viewmodel";

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

export interface RewardLook {
  /** 카드 수치판 (기호 + 숫자). 효과 → 기호 표가 생기기 전까지 장면에서 적어 줘요 */
  values: CardValueVM[];
}

/** 이 카드가 쓰는 능력치: 그 능력치만 두 배로 했을 때 효과문 숫자가 달라지는 첫 번째 */
export function statOf(def: CardDef): StatId | undefined {
  const base = { power: C.stat_base, guard: C.stat_base, focus: C.stat_base };
  const plain = describeCard(def, base);
  return STAT_IDS.find((k) => describeCard(def, { ...base, [k]: base[k] * 2 }) !== plain);
}

/** 보상 카드 한 장. 숫자는 원래 값이에요 (0044: describeCard(def, null)) */
export function rewardCard(cardId: string, ownerId: string, look: RewardLook): RewardCardVM {
  const def = cardDef(cardId);
  const owner = spiritDef(ownerId);
  const material = materialOf(def.element);
  const card: CardVM = {
    key: cardId, name: def.name, cost: def.cost, owner: windowOf(ownerId), material,
    element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, art: "i-spark",
    illustration: isCardArtId(cardId) ? cardId : undefined,
    rarity: def.rarity === "basic" ? undefined : (def.rarity as CardRarity),
    values: look.values,
    detail: { text: richText(describeCard(def, null)), owner: [owner.name, ELEMENT_NAME[def.element], MATERIAL_NAME[material]].join(COPY.sep) },
  };
  return { card, owner: ownerId, stat: statOf(def) };
}

export interface LaneExtras {
  exp: LaneVM["exp"];
  levelUp?: boolean;
  down?: boolean;
  badges?: LaneVM["badges"];
  unlocked?: string[];
}

/** 정령 줄. 능력치는 단계·성격 보정을 넣은 값이에요 (0044) */
export function lane(rs: RunSpirit, extras: LaneExtras): LaneVM {
  const art = spiritArt(rs.id, rs.stage);
  const stats = Object.fromEntries(STAT_IDS.map((k) => [k, round(baseStat(rs, k))])) as Record<StatId, number>;
  return {
    id: rs.id, name: spiritDef(rs.id).name, level: rs.level, levelUp: extras.levelUp,
    hp: rs.hp, maxHp: maxHpOf(rs), down: extras.down, exp: extras.exp,
    face: art?.crop && { key: art.body, crop: art.crop },
    stats, badges: extras.badges ?? [], unlocked: extras.unlocked ?? [],
  };
}
