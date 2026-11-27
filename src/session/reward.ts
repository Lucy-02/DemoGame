// 보상 세션: 카드 한 장을 받거나 넘기고, 정예 장비를 누구에게 줄지 정하는 명령을 받아 런 상태를 바꿔요.
// 순서는 카드 먼저, 장비 다음이에요 (0051). 장비는 꼭 받고, 받을 정령이 모두 꽉 찼을 때만 넘겨요 (0056).
// 전투 보상(0049: 정령마다 1장, 주인 고정, 넘기면 골드)과, 주인이 정해지지 않은 카드 묶음(이벤트)이 같은 화면을 써요.
import type { BattleReward, Run } from "../core/run";

export type RewardSource =
  | { kind: "battle"; reward: BattleReward }
  /** 이 카드들 중 하나를 골라 배울 정령을 정해요. 넘겨도 받는 것은 없어요 */
  | { kind: "cards"; cardIds: string[] };

export interface RewardOffer {
  cardId: string;
  /** 배울 수 있는 정령 id. 전투 보상은 주인 하나 */
  learners: string[];
}

export type RewardCommand =
  | { kind: "take"; cardId: string; spirit: string }
  | { kind: "skip" }
  /** 전투 보상 카드를 통째로 다시 뽑아요 (0157). 판의 다시 뽑기를 하나 써요 */
  | { kind: "reroll" }
  /** 장비를 이 정령에게. 칸이 꽉 찼으면 replace(지닌 장비 id)를 내려놓아요 */
  | { kind: "equip"; spirit: string; replace?: string }
  /** 새 장비 대신 지닌 장비의 공명을 1 올려요 (0159) */
  | { kind: "raise"; spirit: string; equipId: string }
  | { kind: "skipEquip" };

/** 지금 고를 차례인 것 */
export type RewardPhase = "cards" | "equip" | "done";

export class RewardSession {
  offers: RewardOffer[];
  private finished: boolean;

  constructor(readonly run: Run, readonly source: RewardSource) {
    this.offers = this.readOffers();
    this.finished = source.kind === "battle" ? source.reward.cardsDone : false;
  }

  private readOffers(): RewardOffer[] {
    const { run, source } = this;
    return source.kind === "battle"
      ? source.reward.cards.map((c) => ({ cardId: c.cardId, learners: [c.owner] }))
      : source.cardIds.map((cardId) => ({ cardId, learners: run.learnersOf(cardId).map((s) => s.id) }));
  }

  /** 남은 다시 뽑기 (0157). 전투 보상의 카드를 고르기 전에만 써요 */
  get rerolls(): number {
    return this.source.kind === "battle" && !this.finished && this.run.canRerollReward(this.source.reward) ? this.run.rerolls : 0;
  }

  /** 이번에 받은 골드 (이미 런에 들어가 있어요) */
  get gained(): number {
    return this.source.kind === "battle" ? this.source.reward.gold : 0;
  }

  /** 넘기면 받는 골드. 없으면 그냥 넘겨요 */
  get skipGold(): number | undefined {
    return this.source.kind === "battle" ? this.source.reward.skipGold : undefined;
  }

  /** 정예 장비 (없거나 이미 받았으면 undefined) */
  get equipId(): string | undefined {
    const r = this.source.kind === "battle" ? this.source.reward : undefined;
    return r?.equipment && !r.equipDone ? r.equipment.equipId : undefined;
  }

  get phase(): RewardPhase {
    return !this.finished ? "cards" : this.equipId ? "equip" : "done";
  }

  /** 받을 것을 다 정했어요 */
  get done(): boolean {
    return this.phase === "done";
  }

  /** 장비를 넘길 수 있는지: 받을 정령이 모두 지닌 것을 내려놓아야 할 때만 */
  get canSkipEquip(): boolean {
    return this.source.kind === "battle" && this.phase === "equip" && this.run.canSkipRewardEquipment(this.source.reward);
  }

  /** 새 장비 대신 공명을 올릴 수 있는 지닌 장비 (0159). 장비를 고를 때만 있어요 */
  get raisable(): { spirit: string; equipId: string }[] {
    return this.source.kind === "battle" && this.phase === "equip" && this.run.canRaiseRewardResonance(this.source.reward) ? this.run.raisable() : [];
  }

  /** 명령을 적용했으면 true */
  dispatch(cmd: RewardCommand): boolean {
    if (cmd.kind === "equip" || cmd.kind === "skipEquip" || cmd.kind === "raise") return this.dispatchEquip(cmd);
    if (this.finished) return false;
    if (cmd.kind === "reroll") {
      if (this.source.kind !== "battle" || !this.run.canRerollReward(this.source.reward)) return false;
      this.run.rerollRewardCards(this.source.reward);
      this.offers = this.readOffers();
      this.finished = this.source.reward.cardsDone;
      return true;
    }
    if (cmd.kind === "take") {
      const offer = this.offers.find((o) => o.cardId === cmd.cardId);
      if (!offer || !offer.learners.includes(cmd.spirit)) return false;
      if (this.source.kind === "battle") this.run.takeRewardCard(this.source.reward, cmd.cardId);
      else this.run.addCard(cmd.cardId, cmd.spirit);
    } else if (this.source.kind === "battle") {
      this.run.skipRewardCards(this.source.reward);
    }
    this.finished = true;
    return true;
  }

  private dispatchEquip(cmd: Extract<RewardCommand, { kind: "equip" | "skipEquip" | "raise" }>): boolean {
    const id = this.equipId;
    if (this.source.kind !== "battle" || this.phase !== "equip" || !id) return false;
    const { run, source: { reward } } = this;
    if (cmd.kind === "skipEquip") {
      if (!run.canSkipRewardEquipment(reward)) return false;
      run.skipRewardEquipment(reward);
      return true;
    }
    if (cmd.kind === "raise") {
      if (!this.raisable.some((r) => r.spirit === cmd.spirit && r.equipId === cmd.equipId)) return false;
      run.raiseRewardResonance(reward, cmd.spirit, cmd.equipId);
      return true;
    }
    if (!run.equipTakers(id).some((s) => s.id === cmd.spirit)) return false;
    if (run.needsReplace(id, cmd.spirit) && !run.spirit(cmd.spirit).equipment.some((e) => e.id === cmd.replace)) return false;
    run.giveRewardEquipment(reward, cmd.spirit, cmd.replace);
    return true;
  }
}
