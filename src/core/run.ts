import { C, CARDS, ENCOUNTERS, EQUIPMENT, EVENTS, PERSONALITIES, SPIRITS, cardDef, equipDef, partyScale } from "./data";
import { isCardUnlocked, toRunSpirit, type Garden } from "./garden";
import { Rng } from "./rng";
import { maxHpOf } from "./stats";
import type { CardDef, DeckCard, EncounterDef, EnemyScale, EquipDef, EventDef, Obtain, Rarity, RunSpirit } from "./types";

export type NodeType = "battle" | "elite" | "event" | "shop" | "rest" | "boss";

export interface MapNode {
  id: string;
  floor: number;
  col: number;
  type: NodeType;
  next: string[];
}

export interface RunOptions {
  seed: number;
  frontId: string;
  /** 파티 정령 id. 없으면 정원의 정령(최대 party_size), 정원도 없으면 constants.default_party */
  party?: string[];
  /** 정원 상태. 있으면 단계·레벨·성격·해금을 여기서 읽어요 (결정 0021) */
  garden?: Garden;
  /** 정원 없이 시작할 때(테스트·자동 플레이): 성체 Lv4로 시작 */
  adult: boolean;
  unlockAll: boolean;
}

/** 정원 없이 "성체로 시작"할 때의 레벨 (성체 문 = Lv4, growth.json evolutions) */
const ADULT_LEVEL = 4;

const missing = (id: string): never => {
  throw new Error(`정원에 정령이 없어요: ${id}`);
};

/** 전투 보상의 카드 한 장: 어느 카드를 누가 배우는지 (0049 1절) */
export interface RewardCard {
  cardId: string;
  owner: string;
}

/** 이긴 전투 하나의 보상 묶음 (0049 1 · 2절, 화면 0051) */
export interface BattleReward {
  kind: "battle" | "elite";
  /** 받은 골드. 만들 때 바로 들어가요 */
  gold: number;
  /** 파티 순서대로 정령마다 1장. 배울 카드가 없는 정령은 빠져요 */
  cards: RewardCard[];
  /** 카드를 넘기면 받는 골드 */
  skipGold: number;
  /** 정예일 때 장비 하나. 거절 없이 누군가에게 줘요 (0051) */
  equipment?: { equipId: string };
  /** 카드를 받았거나 넘겼는지 */
  cardsDone: boolean;
  /** 장비를 줬는지 (장비가 없으면 true) */
  equipDone: boolean;
}

export const FLOORS = 7; // 보스 전 층 수. 보스는 FLOORS + 1층
const COLS = 4;

export class Run {
  rng: Rng;
  spirits: RunSpirit[];
  deck: DeckCard[] = [];
  gold = C.start_gold;
  frontId: string;
  map: Map<string, MapNode> = new Map();
  current: MapNode | null = null;
  visited: string[] = [];
  lastEncounter = "";
  /** 이번 런에서 상점 카드 빼기를 쓴 횟수 (0049 4절: 쓸 때마다 값이 올라요) */
  removals = 0;
  bossDefeated = false;
  private nextUid = 1;

  constructor(public opts: RunOptions) {
    this.rng = new Rng(opts.seed);
    this.frontId = opts.frontId;
    const garden = opts.garden;
    // 정원이 있으면 가진 정령으로 떠나요 (최대 party_size, 0053)
    const owned = garden?.spirits.slice(0, C.party_size).map((g) => g.id);
    const party = (opts.party ?? owned ?? (C.default_party as string[])).map((id) => SPIRITS.find((s) => s.id === id) ?? missing(id));
    this.spirits = party.map((s) => {
      const rs: RunSpirit = garden
        ? toRunSpirit(garden.spirits.find((g) => g.id === s.id) ?? missing(s.id))
        : {
          id: s.id, hp: 0, maxHpBonus: 0, stage: opts.adult ? "adult" : "baby", level: opts.adult ? ADULT_LEVEL : 1,
          personality: this.rng.pick(PERSONALITIES).id, equipment: [],
        };
      rs.hp = maxHpOf(rs);
      return rs;
    });
    // 시작 덱 (0040): 모든 정령이 배우는 카드(startEach)는 정령마다, 정령 카드는 start 수만큼 그 주인에게
    for (const card of CARDS) {
      if (card.startEach) for (const s of party) for (let i = 0; i < card.startEach; i++) this.addCard(card.id, s.id);
      if (!card.start) continue;
      const owner = party.find((s) => s.id === card.startOwner) ?? party.find((s) => s.element === card.element);
      if (!owner) continue;
      for (let i = 0; i < card.start; i++) this.addCard(card.id, owner.id);
    }
    this.generateMap();
  }

  addCard(cardId: string, owner: string) {
    this.deck.push({ uid: this.nextUid++, cardId, owner });
  }

  removeCard(uid: number) {
    this.deck = this.deck.filter((c) => c.uid !== uid);
  }

  spirit(id: string) {
    return this.spirits.find((s) => s.id === id)!;
  }

  // ───────────────────────── 지도 ─────────────────────────

  private generateMap() {
    const rng = this.rng;
    const key = (f: number, c: number) => `${f}:${c}`;
    const ensure = (f: number, c: number) => {
      const k = key(f, c);
      if (!this.map.has(k)) this.map.set(k, { id: k, floor: f, col: c, type: "battle", next: [] });
      return this.map.get(k)!;
    };
    const starts = rng.shuffle([0, 1, 2, 3]).slice(0, 3);
    starts.push(rng.int(0, COLS - 1));
    for (const start of starts) {
      let col = start;
      for (let f = 1; f <= FLOORS; f++) {
        const node = ensure(f, col);
        if (f < FLOORS) {
          const nc = Math.max(0, Math.min(COLS - 1, col + rng.int(-1, 1)));
          const nk = key(f + 1, nc);
          if (!node.next.includes(nk)) node.next.push(nk);
          col = nc;
        }
      }
    }
    const boss = { id: "boss", floor: FLOORS + 1, col: 1.5, type: "boss" as NodeType, next: [] };
    this.map.set("boss", boss);
    for (const n of this.map.values()) {
      if (n.floor === FLOORS) n.next = ["boss"];
    }
    // 칸 종류
    for (const n of this.map.values()) {
      if (n.type === "boss") continue;
      if (n.floor === 1) n.type = "battle";
      else if (n.floor === FLOORS) n.type = "rest";
      else {
        const w: Record<string, number> = { battle: 45, event: 22, shop: 11 };
        if (n.floor >= 3) w.rest = 10;
        if (n.floor >= 4) w.elite = 14;
        n.type = rng.weighted(w) as NodeType;
      }
    }
    const mids = [...this.map.values()].filter((n) => n.floor >= 3 && n.floor <= 5);
    if (!mids.some((n) => n.type === "shop")) rng.pick(mids).type = "shop";
    const elites = [...this.map.values()].filter((n) => n.floor >= 4 && n.floor <= 6);
    if (!elites.some((n) => n.type === "elite")) rng.pick(elites).type = "elite";
  }

  /** 지금 갈 수 있는 칸들 */
  reachable(): MapNode[] {
    if (!this.current) return [...this.map.values()].filter((n) => n.floor === 1);
    return this.current.next.map((k) => this.map.get(k)!);
  }

  enter(node: MapNode) {
    this.current = node;
    this.visited.push(node.id);
  }

  pickEncounter(type: "battle" | "elite" | "boss"): EncounterDef {
    const tier = type === "battle" ? "normal" : type;
    const floor = this.current?.floor ?? 1;
    let pool = ENCOUNTERS.filter((e) => e.tier === tier && floor >= e.floors[0] && floor <= e.floors[1]);
    if (pool.length > 1) pool = pool.filter((e) => e.id !== this.lastEncounter);
    const enc = this.rng.pick(pool);
    this.lastEncounter = enc.id;
    return enc;
  }

  /** 지금 인원에 맞춘 적 세기 (0053). 셋이면 undefined */
  enemyScale(): EnemyScale | undefined {
    return partyScale(this.spirits.length);
  }

  pickEvent(): EventDef {
    return this.rng.pick(EVENTS);
  }

  // ───────────────────────── 보상 ─────────────────────────

  isUnlocked(card: CardDef): boolean {
    if (this.opts.unlockAll || card.unlock === "start") return true;
    if (this.opts.garden) return isCardUnlocked(this.opts.garden, card);
    if (this.opts.adult && card.unlock.endsWith("_adult")) return true;
    return false;
  }

  /** 이 자리에서 나올 수 있는 카드: 해금됐고, 파티가 배울 수 있고, 얻는 곳이 맞는 카드 (0040) */
  rewardPool(rarity: Rarity, where: "reward" | "shop" = "reward"): CardDef[] {
    const places: Obtain[] = where === "shop" ? ["reward", "shop"] : ["reward"];
    return CARDS.filter((c) => c.rarity === rarity && places.includes(c.obtain ?? "reward") && this.isUnlocked(c) && this.learnersOf(c.id).length > 0);
  }

  rollCards(n: number, weights: Record<string, number>, forced?: Rarity, where: "reward" | "shop" = "reward"): CardDef[] {
    const out: CardDef[] = [];
    for (let guard = 0; out.length < n && guard < 100; guard++) {
      let r = forced ?? (this.rng.weighted(weights) as Rarity);
      let pool = this.rewardPool(r, where).filter((c) => !out.includes(c));
      if (!pool.length) pool = this.rewardPool("common", where).filter((c) => !out.includes(c));
      if (!pool.length) break;
      out.push(this.rng.pick(pool));
    }
    return out;
  }

  /** 이 카드를 배울 수 있는 정령. 전용 카드는 그 정령만, 속성 카드는 같은 속성만, 바람·무속성은 누구나. */
  learnersOf(cardId: string): RunSpirit[] {
    const def = cardDef(cardId);
    if (def.spirit) return this.spirits.filter((s) => s.id === def.spirit);
    const same = this.spirits.filter((s) => SPIRITS.find((d) => d.id === s.id)!.element === def.element);
    return same.length ? same : this.spirits;
  }

  goldReward(type: "battle" | "elite"): number {
    const r = (type === "battle" ? C.reward.gold_normal : C.reward.gold_elite) as number[];
    return this.rng.int(r[0], r[1]);
  }

  /**
   * 이 정령이 전투 보상으로 배우는 카드 (0040 · 0049): 그 정령의 전용 카드(`spirit`).
   * 전용 카드가 하나도 없는 정령(불여우 · 안개 고양이)은 같은 속성의 주인 없는 카드예요.
   * 해금되고 전투 보상에서 나오는 카드만.
   */
  ownRewardPool(spiritId: string, rarity: Rarity): CardDef[] {
    const element = SPIRITS.find((d) => d.id === spiritId)!.element;
    const hasOwn = CARDS.some((c) => c.spirit === spiritId);
    return CARDS.filter((c) =>
      c.rarity === rarity && (c.obtain ?? "reward") === "reward" && this.isUnlocked(c)
      && (hasOwn ? c.spirit === spiritId : !c.spirit && c.element === element));
  }

  /** 정령마다 1장씩 (0049 1절). 희귀도는 장마다 따로 굴리고, 그 희귀도가 비면 한 단계씩 내려요. */
  rollSpiritCards(weights: Record<string, number>): RewardCard[] {
    const order: Rarity[] = ["rare", "advanced", "common"];
    const out: RewardCard[] = [];
    for (const s of this.spirits) {
      const rolled = this.rng.weighted(weights) as Rarity;
      for (const r of order.slice(Math.max(0, order.indexOf(rolled)))) {
        const pool = this.ownRewardPool(s.id, r).filter((c) => !out.some((o) => o.cardId === c.id));
        if (!pool.length) continue;
        out.push({ cardId: this.rng.pick(pool).id, owner: s.id });
        break;
      }
    }
    return out;
  }

  /** 이 장비를 받을 수 있는 정령: 전용 장비는 그 정령만, 아니면 누구나 */
  equipTakers(equipId: string): RunSpirit[] {
    const def = equipDef(equipId);
    return def.owner ? this.spirits.filter((s) => s.id === def.owner) : this.spirits;
  }

  /** 이 등급에서 파티가 받을 수 있는 장비 */
  equipPool(grade: EquipDef["grade"]): EquipDef[] {
    return EQUIPMENT.filter((e) => e.grade === grade && this.equipTakers(e.id).length > 0);
  }

  /** 이긴 전투의 보상을 만들고 골드를 넣어요. 보스는 전투 보상 없이 런 결과로 가요 (0049 3절). */
  rollBattleReward(kind: "battle" | "elite"): BattleReward {
    const gold = this.goldReward(kind);
    this.gold += gold;
    const cards = this.rollSpiritCards(kind === "elite" ? C.reward.rarity_elite : C.reward.rarity_normal);
    const pool = kind === "elite" ? this.equipPool("elite") : [];
    const equipment = pool.length ? { equipId: this.rng.pick(pool).id } : undefined;
    return { kind, gold, cards, skipGold: C.reward.skip_gold, equipment, cardsDone: cards.length === 0, equipDone: !equipment };
  }

  /** 보상 카드 한 장을 그 주인이 배워요. 한 번 누르면 끝 (0051) */
  takeRewardCard(reward: BattleReward, cardId: string) {
    if (reward.cardsDone) throw new Error("이미 카드를 받았거나 넘겼어요");
    const card = reward.cards.find((c) => c.cardId === cardId);
    if (!card) throw new Error(`보상에 없는 카드: ${cardId}`);
    this.addCard(card.cardId, card.owner);
    reward.cardsDone = true;
  }

  /** 카드를 넘기고 골드를 조금 받아요. 경험은 없어요 (0049 1절) */
  skipRewardCards(reward: BattleReward) {
    if (reward.cardsDone) throw new Error("이미 카드를 받았거나 넘겼어요");
    this.gold += reward.skipGold;
    reward.cardsDone = true;
  }

  /** 정예 장비를 정령에게 줘요. 이번 런 동안 써요 (0048 1절) */
  giveRewardEquipment(reward: BattleReward, spiritId: string) {
    if (!reward.equipment || reward.equipDone) throw new Error("줄 장비가 없어요");
    this.giveEquipment(reward.equipment.equipId, spiritId);
    reward.equipDone = true;
  }

  giveEquipment(equipId: string, spiritId: string) {
    if (!this.equipTakers(equipId).some((s) => s.id === spiritId)) throw new Error(`${spiritId}는 ${equipId}를 받을 수 없어요`);
    this.spirit(spiritId).equipment.push({ id: equipId, resonance: 1, from: "run" });
  }

  /** 보스를 이기면 런 결과에서 고를 보스 장비 3개 (0049 3절). 데이터가 모자라면 있는 만큼 */
  rollBossEquipment(n = 3): string[] {
    return this.rng.shuffle([...this.equipPool("boss")]).slice(0, n).map((e) => e.id);
  }

  // ───────────────────────── 상점 ─────────────────────────

  /** 카드 빼기 값: 시작 값에서 쓸 때마다 오르는 폭만큼 올라요 (0049 4절) */
  removePrice(): number {
    return C.shop.remove_price + C.shop.remove_price_step * this.removals;
  }

  /** 상점에서 카드 1장 빼기. 상점마다 1회는 상점 화면이 지켜요 */
  buyRemoval(uid: number) {
    const price = this.removePrice();
    if (this.gold < price) throw new Error("골드가 모자라요");
    this.gold -= price;
    this.removals++;
    this.removeCard(uid);
  }

  healAllPct(pct: number) {
    for (const s of this.spirits) {
      const max = maxHpOf(s);
      s.hp = Math.min(max, s.hp + Math.round(max * pct));
    }
  }
}

let current: Run | null = null;
export const getRun = () => {
  if (!current) throw new Error("no run");
  return current;
};
export const setRun = (r: Run) => (current = r);
