// 전투 화면 (정본: 전투 R5 "판단 동선"). 뷰모델을 받아 그리기만 해요.
import * as Phaser from "phaser";
import { loadIcon } from "../style/icons";
import { canonRest } from "./fixtures/canonRest";
import { drawBackdrop } from "./views/backdrop";
import { drawEnemyTip } from "./views/enemyTip";
import { createHand, drawBand, drawEnd, drawMana, preloadHand } from "./views/hand";
import { drawOrder, preloadOrder } from "./views/order";
import { SYS } from "./layout";
import { SYS_ICONS, drawSys, drawWhere } from "./views/topbar";
import { drawAlly, drawEnemy, preloadUnits } from "./views/units";
import type { BattleVM } from "./viewmodel";

export const BATTLE_SCENE = "battle";

export class BattleScene extends Phaser.Scene {
  private vm: BattleVM = canonRest;

  constructor() {
    super(BATTLE_SCENE);
  }

  /** 시각 검증용: 처음부터 이 카드에 호버한 상태로 */
  private hover?: string;

  init(data: { vm?: BattleVM; hover?: string }) {
    if (data.vm) this.vm = data.vm;
    this.hover = data.hover;
  }

  preload() {
    for (const id of SYS_ICONS) loadIcon(this, id, SYS.icon);
    preloadOrder(this, this.vm.order);
    preloadUnits(this, this.vm);
    preloadHand(this, this.vm);
  }

  create() {
    drawBackdrop(this);
    drawWhere(this, this.vm.where);
    drawSys(this);
    drawOrder(this, this.vm.order);
    this.vm.allies.forEach((a, i) => drawAlly(this, a, i));
    // 적 호버 표시(고리·설명판)는 마우스가 손패로 가면 숨겨요. 마우스는 한 곳에만 있으니까요.
    const enemyHover: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = [];
    this.vm.enemies.forEach((e, i) => {
      const { ring } = drawEnemy(this, e, i);
      if (ring) enemyHover.push(ring);
    });
    drawBand(this);
    drawMana(this, this.vm.mana);
    drawEnd(this, this.vm);
    const tip = this.vm.enemies.find((e) => e.hovered)?.tip;
    if (tip) enemyHover.push(drawEnemyTip(this, tip));
    const hand = createHand(this, this.vm.hand, (key) => {
      enemyHover.forEach((o) => o.setVisible(key === null));
    });
    if (this.hover) hand.setHover(this.hover, true);
    Object.assign(window, { __screenReady: BATTLE_SCENE });
  }
}
