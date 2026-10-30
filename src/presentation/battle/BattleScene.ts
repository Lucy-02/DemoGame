// 전투 화면 (정본: 전투 R5 "판단 동선"). 뷰모델을 받아 그리기만 해요.
import * as Phaser from "phaser";
import { loadIcon } from "../style/icons";
import { canonRest } from "./fixtures/canonRest";
import { drawBackdrop } from "./views/backdrop";
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

  init(data: { vm?: BattleVM }) {
    if (data.vm) this.vm = data.vm;
  }

  preload() {
    for (const id of SYS_ICONS) loadIcon(this, id, SYS.icon);
    preloadOrder(this, this.vm.order);
    preloadUnits(this, this.vm);
  }

  create() {
    drawBackdrop(this);
    drawWhere(this, this.vm.where);
    drawSys(this);
    drawOrder(this, this.vm.order);
    this.vm.allies.forEach((a, i) => drawAlly(this, a, i));
    this.vm.enemies.forEach((e, i) => drawEnemy(this, e, i));
    Object.assign(window, { __screenReady: BATTLE_SCENE });
  }
}
