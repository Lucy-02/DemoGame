// 전투 화면 (정본: 전투 R5 "판단 동선"). 뷰모델을 받아 그리기만 해요.
// 필드는 두 장: 쉬는 필드(.fld-rest)와 조준 미리보기 필드(.fld-pv). 집은 카드가 앞에 있으면 미리보기, 아니면 쉬는 필드예요.
import * as Phaser from "phaser";
import type { CurveRuleName } from "../aim/curve";
import { createAimLines } from "../aim/lines";
import { gather } from "../style/gather";
import { loadIcon } from "../style/icons";
import { canonRest } from "./fixtures/canonRest";
import { drawBackdrop } from "./views/backdrop";
import { drawEnemyTip } from "./views/enemyTip";
import { createHand, drawBand, drawEnd, drawMana, preloadHand } from "./views/hand";
import { drawOrder, preloadOrder } from "./views/order";
import { AIM_ANCHOR, FRAME, SYS } from "./layout";
import { SYS_ICONS, drawSys, drawWhere } from "./views/topbar";
import { drawAlly, drawEnemy, preloadUnits } from "./views/units";
import type { AimVM, BattleVM } from "./viewmodel";

export const BATTLE_SCENE = "battle";

export class BattleScene extends Phaser.Scene {
  private vm: BattleVM = canonRest;

  constructor() {
    super(BATTLE_SCENE);
  }

  /** 시각 검증용: 처음부터 이 카드에 호버한 상태로 */
  private hover?: string;

  /** 조준선 곡선 규칙 비교용 (?curve=mirror|trunk) */
  private curve?: CurveRuleName;

  init(data: { vm?: BattleVM; hover?: string; curve?: CurveRuleName }) {
    if (data.vm) this.vm = data.vm;
    this.hover = data.hover;
    this.curve = data.curve;
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
    // 적 호버 표시(고리·설명판)는 마우스가 손패로 가면 숨겨요. 마우스는 한 곳에만 있으니까요.
    const enemyHover: (Phaser.GameObjects.Image | Phaser.GameObjects.Container)[] = [];
    const rest = gather(this, 0, 0, () => {
      drawOrder(this, this.vm.order);
      this.vm.allies.forEach((a, i) => drawAlly(this, a, i));
      this.vm.enemies.forEach((e, i) => {
        const { ring } = drawEnemy(this, e, i);
        if (ring) enemyHover.push(ring);
      });
    });
    const aim = this.vm.aim;
    const preview = aim ? this.drawPreview(aim) : null;
    drawBand(this);
    drawMana(this, this.vm.mana);
    drawEnd(this, this.vm);
    const tip = this.vm.enemies.find((e) => e.hovered)?.tip;
    if (tip) enemyHover.push(drawEnemyTip(this, tip));
    const hand = createHand(this, this.vm.hand, {
      held: aim?.card,
      onChange: (key, held) => {
        rest.setVisible(!held);
        preview?.root.setVisible(held);
        enemyHover.forEach((o) => o.setVisible(key === null));
      },
    });
    // 조준선 시작점은 집은 카드가 들린 자리에서 하나로 모아요 (대상이 여럿이어도)
    const corner = hand.heldCorner();
    if (preview && corner) {
      preview.lines.set({ x: corner.x + AIM_ANCHOR.origin.dx, y: corner.y + AIM_ANCHOR.origin.dy }, preview.ends);
    }
    hand.setHover(this.hover ?? null, true);
    Object.assign(window, { __screenReady: BATTLE_SCENE });
  }

  /** 미리보기 필드 (.fld-pv): 순서표·아군·적을 미리보기 값으로 다시 그리고, 맨 위에 조준선 */
  private drawPreview(aim: AimVM) {
    const targets = new Map(aim.targets.map((t) => [t.enemy, t]));
    const cutOrders = new Set(aim.targets.filter((t) => t.cut).map((t) => this.vm.enemies[t.enemy].intent.order));
    const ends: { x: number; y: number }[] = [];
    let lines!: ReturnType<typeof createAimLines>;
    const root = gather(this, 0, 0, () => {
      drawOrder(this, { ...this.vm.order, slots: this.vm.order.slots.map((s) => (cutOrders.has(s.n) ? { ...s, cut: true } : s)) });
      this.vm.allies.forEach((a, i) => drawAlly(this, a, i, aim.incoming[i]));
      this.vm.enemies.forEach((e, i) => {
        const target = targets.get(i);
        const { foot } = drawEnemy(this, e, i, { target, candidate: aim.candidates.includes(i) });
        if (target) ends.push({ x: foot.x + AIM_ANCHOR.target.dx, y: foot.y + AIM_ANCHOR.target.dy });
      });
      lines = createAimLines(this, FRAME.w, FRAME.h, this.curve);
    });
    root.setVisible(false);
    return { root, lines, ends };
  }
}
