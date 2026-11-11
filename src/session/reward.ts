// 보상 세션: 카드 한 장을 받거나 넘기는 명령을 받아 런 상태를 바꿔요.
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
  | { kind: "skip" };

export class RewardSession {
  readonly offers: RewardOffer[];
  private finished: boolean;

  constructor(readonly run: Run, readonly source: RewardSource) {
    this.offers = source.kind === "battle"
      ? source.reward.cards.map((c) => ({ cardId: c.cardId, learners: [c.owner] }))
      : source.cardIds.map((cardId) => ({ cardId, learners: run.learnersOf(cardId).map((s) => s.id) }));
    this.finished = source.kind === "battle" ? source.reward.cardsDone : false;
  }

  /** 이번에 받은 골드 (이미 런에 들어가 있어요) */
  get gained(): number {
    return this.source.kind === "battle" ? this.source.reward.gold : 0;
  }

  /** 넘기면 받는 골드. 없으면 그냥 넘겨요 */
  get skipGold(): number | undefined {
    return this.source.kind === "battle" ? this.source.reward.skipGold : undefined;
  }

  /** 카드를 받았거나 넘겼어요 */
  get done(): boolean {
    return this.finished;
  }

  /** 명령을 적용했으면 true */
  dispatch(cmd: RewardCommand): boolean {
    if (this.finished) return false;
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
}
