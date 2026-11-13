// 상점 세션: 화면이 보내는 명령(카드 사기, 치료)을 받아 런 상태를 바꾸고 알려요.
// 값·진열 수·치료량은 규칙 데이터(constants.json shop)에서 읽어요. 빼기 값은 쓸 때마다 올라요(0049 4절).
import { C } from "../core/data";
import type { Run } from "../core/run";
import type { CardDef } from "../core/types";

export interface ShopOffer {
  card: CardDef;
  price: number;
  sold: boolean;
}

export type ShopCommand =
  /** slot 번째 카드를 사서 spirit에게 가르쳐요 */
  | { kind: "buy"; slot: number; spirit: string }
  /** 모두 치료 (상점마다 한 번) */
  | { kind: "heal" }
  /** 덱에서 카드 한 장 빼기 (상점마다 한 번) */
  | { kind: "remove"; uid: number };

const PRICE = C.shop.price as Record<string, number>;

export class ShopSession {
  readonly offers: ShopOffer[];
  private healed = false;
  private removed = false;
  private listeners = new Set<() => void>();

  constructor(readonly run: Run) {
    this.offers = run.rollCards(C.shop.card_count, C.reward.rarity_normal, undefined, "shop")
      .map((card) => ({ card, price: PRICE[card.rarity] ?? PRICE.common, sold: false }));
  }

  onChange(f: () => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  /** 이 카드를 배울 수 있는 정령 id */
  learners(slot: number): string[] {
    return this.run.learnersOf(this.offers[slot].card.id).map((s) => s.id);
  }

  canBuy(slot: number): boolean {
    const o = this.offers[slot];
    return !!o && !o.sold && this.run.gold >= o.price;
  }

  get removePrice(): number {
    return this.run.removePrice();
  }

  canRemove(): boolean {
    return !this.removed && this.run.gold >= this.removePrice && this.run.deck.length > 0;
  }

  get healPrice(): number {
    return C.shop.heal_price;
  }

  canHeal(): boolean {
    return !this.healed && this.run.gold >= this.healPrice && Object.values(this.healPreview()).some((n) => n > 0);
  }

  /** 치료하면 정령마다 HP가 얼마나 차는지 (규칙을 한 번 돌려 보고 되돌려요) */
  healPreview(): Record<string, number> {
    const before = this.run.spirits.map((s) => s.hp);
    this.run.healAllPct(C.shop.heal_pct);
    const gain = Object.fromEntries(this.run.spirits.map((s, i) => [s.id, s.hp - before[i]]));
    this.run.spirits.forEach((s, i) => { s.hp = before[i]; });
    return gain;
  }

  dispatch(cmd: ShopCommand) {
    if (!this.apply(cmd)) return;
    for (const f of this.listeners) f();
  }

  private apply(cmd: ShopCommand): boolean {
    switch (cmd.kind) {
      case "buy": {
        if (!this.canBuy(cmd.slot) || !this.learners(cmd.slot).includes(cmd.spirit)) return false;
        const o = this.offers[cmd.slot];
        this.run.gold -= o.price;
        this.run.addCard(o.card.id, cmd.spirit);
        o.sold = true;
        return true;
      }
      case "heal": {
        if (!this.canHeal()) return false;
        this.run.gold -= this.healPrice;
        this.run.healAllPct(C.shop.heal_pct);
        this.healed = true;
        return true;
      }
      case "remove": {
        if (!this.canRemove() || !this.run.deck.some((c) => c.uid === cmd.uid)) return false;
        this.run.buyRemoval(cmd.uid);
        this.removed = true;
        return true;
      }
    }
  }
}
