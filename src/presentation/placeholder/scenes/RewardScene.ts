// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { spiritDef } from "../../../core/data";
import { getRun, type BattleReward } from "../../../core/run";
import { runHud } from "../ui/hud";
import { runStats } from "../ui/preview";
import { CARD_H, COLORS, W, bgFill, button, cardView, txt } from "../ui/widgets";

export interface RewardData {
  title: string;
  gold?: number;
  cardIds: string[];
  next?: string;
  /** 전투 보상 (0049): 카드마다 주인이 정해져 있고 넘기면 골드. 골드는 이미 들어가 있어요 */
  reward?: BattleReward;
}

/** 카드 3장 중 하나를 골라, 그 카드를 배울 정령을 정해요. */
export class RewardScene extends Phaser.Scene {
  private data0!: RewardData;
  private goldGiven = false;

  constructor() {
    super("RewardScene");
  }

  init(data: RewardData) {
    this.data0 = data;
    this.goldGiven = false;
  }

  create() {
    const run = getRun();
    const d = this.data0;
    const reward = d.reward;
    if (d.gold && !this.goldGiven) {
      run.gold += d.gold;
      this.goldGiven = true;
    }
    bgFill(this, 0x262036, 0x14121c);
    runHud(this);
    txt(this, W / 2, 90, d.title, 30).setOrigin(0.5);
    const gold = reward?.gold ?? d.gold;
    if (gold) txt(this, W / 2, 128, `골드 +${gold}`, 18, COLORS.gold).setOrigin(0.5);
    txt(this, W / 2, 160, "카드 1장을 골라 배울 정령을 정하세요. 같은 카드도 누가 배우느냐에 따라 수치가 달라요.", 15, COLORS.dim).setOrigin(0.5);

    const finish = () => this.scene.start(d.next ?? "MapScene");
    d.cardIds.forEach((id, i) => {
      const x = W / 2 + (i - (d.cardIds.length - 1) / 2) * 300;
      const y = 330;
      const owner = reward?.cards.find((c) => c.cardId === id)?.owner;
      const learners = owner ? [run.spirit(owner)] : run.learnersOf(id);
      let view = cardView(this, id, learners[0].id, runStats(learners[0].id)).setPosition(x, y).setScale(1.2);
      const show = (owner: string) => {
        view.destroy();
        view = cardView(this, id, owner, runStats(owner)).setPosition(x, y).setScale(1.2);
      };
      learners.forEach((rs, j) => {
        const by = y + CARD_H * 0.6 + 34 + j * 44;
        const b = button(this, x, by, 200, 38, `${spiritDef(rs.id).name}에게 배우기`, () => {
          if (reward) run.takeRewardCard(reward, id);
          else run.addCard(id, rs.id);
          finish();
        }, { size: 15 });
        b.list[0].on("pointerover", () => show(rs.id));
      });
    });
    const skip = () => {
      if (reward) run.skipRewardCards(reward);
      finish();
    };
    button(this, W / 2, 680, 180, 44, reward ? `건너뛰기 (+${reward.skipGold}골드)` : "건너뛰기", skip, { color: 0x5a4f72 });
  }
}
