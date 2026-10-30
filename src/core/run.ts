import { C, CARDS, ENCOUNTERS, EVENTS, PERSONALITIES, SPIRITS, cardDef } from "./data";
import { isCardUnlocked, toRunSpirit, type Garden } from "./garden";
import { Rng } from "./rng";
import { maxHpOf } from "./stats";
import type { CardDef, DeckCard, EncounterDef, EventDef, Rarity, RunSpirit } from "./types";

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
  bossDefeated = false;
  private nextUid = 1;

  constructor(public opts: RunOptions) {
    this.rng = new Rng(opts.seed);
    this.frontId = opts.frontId;
    const garden = opts.garden;
    this.spirits = SPIRITS.map((s) => {
      const rs: RunSpirit = garden
        ? toRunSpirit(garden.spirits.find((g) => g.id === s.id) ?? missing(s.id))
        : {
          id: s.id, hp: 0, maxHpBonus: 0, stage: opts.adult ? "adult" : "baby", level: opts.adult ? ADULT_LEVEL : 1,
          personality: this.rng.pick(PERSONALITIES).id, startSync: 0,
        };
      rs.hp = maxHpOf(rs);
      return rs;
    });
    // 시작 덱: 정령 카드의 start 수만큼
    for (const card of CARDS) {
      if (!card.start) continue;
      const owner = SPIRITS.find((s) => s.id === card.startOwner) ?? SPIRITS.find((s) => s.element === card.element);
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

  rewardPool(rarity: Rarity): CardDef[] {
    return CARDS.filter((c) => c.rarity === rarity && this.isUnlocked(c));
  }

  rollCards(n: number, weights: Record<string, number>, forced?: Rarity): CardDef[] {
    const out: CardDef[] = [];
    for (let guard = 0; out.length < n && guard < 100; guard++) {
      let r = forced ?? (this.rng.weighted(weights) as Rarity);
      let pool = this.rewardPool(r).filter((c) => !out.includes(c));
      if (!pool.length) pool = this.rewardPool("common").filter((c) => !out.includes(c));
      if (!pool.length) break;
      out.push(this.rng.pick(pool));
    }
    return out;
  }

  /** 이 카드를 배울 수 있는 정령. 속성 카드는 같은 속성만, 바람·무속성은 누구나. */
  learnersOf(cardId: string): RunSpirit[] {
    const el = cardDef(cardId).element;
    const same = this.spirits.filter((s) => SPIRITS.find((d) => d.id === s.id)!.element === el);
    return same.length ? same : this.spirits;
  }

  goldReward(type: "battle" | "elite" | "boss"): number {
    const r = (type === "battle" ? C.reward.gold_normal : type === "elite" ? C.reward.gold_elite : C.reward.gold_boss) as number[];
    return this.rng.int(r[0], r[1]);
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
