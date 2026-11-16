// 가운데 고르기 창 (0075): 필드를 어둡게 덮고 카드를 화면 가운데 축에 대칭으로 띄워요. 낙하(턴 시작)와 품기(재생 뒤)가 같이 써요.
// 낙하는 고를 장 수만큼 클릭하면 바로 닫히고, "필드 보기"를 누르는 동안 창이 숨어요. 품기는 미리 골라진 카드를 바꾸고 버튼으로 닫아요.
import * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import { box } from "../../style/draw";
import { render, size, type Node } from "../../style/flex";
import { gather } from "../../style/gather";
import { cardTipContent } from "../../card/cardTip";
import { createHandCard, preloadHandCard, type HandCardView } from "../../card/HandCard";
import { HAND_CARD } from "../../card/layout";
import { PAPER } from "../../tooltip/skins";
import { TooltipHost, clampLeft } from "../../tooltip/Tooltip";
import { COPY } from "../copy";
import { FRAME, HOVER, PICK } from "../layout";
import type { PickVM } from "../viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.battle;

export function preloadPick(scene: Phaser.Scene, vm: PickVM) {
  for (const c of vm.cards) preloadHandCard(scene, c, { scale: PICK.scale });
}

export interface PickView {
  /** 창이 보이는지 ("필드 보기"를 누르는 동안은 숨어요) */
  readonly shown: boolean;
  /** 숨은 창을 다시 보여요 (포인터를 떼면) */
  show(): void;
}

/** onDone: 고른 카드 key들 (고른 순서) */
export function createPick(scene: Phaser.Scene, vm: PickVM, onDone: (keys: string[]) => void): PickView {
  const W = HAND_CARD.w * PICK.scale, H = HAND_CARD.h * PICK.scale;
  const B = PICK.button;
  const title: Node = { t: "text", text: COPY.pick[vm.kind](vm.n), size: T.endTurn, color: P.ink } as Node;
  const ts = size(title);
  const rowW = vm.cards.length * W + (vm.cards.length - 1) * PICK.gap;
  const top = Math.round(PICK.cy - (ts.h + PICK.pad + H + PICK.pad + B.h) / 2);
  const cardsTop = top + ts.h + PICK.pad;
  const left = Math.round(PICK.cx - rowW / 2);
  const picked = [...vm.picked];
  const views: { key: string; view: HandCardView }[] = [];
  const tips = new TooltipHost(scene);
  let shown = true;
  let done = false;

  const mark = () => views.forEach((v) => v.view.setHeld(picked.includes(v.key)));
  const finish = () => {
    if (done) return;
    done = true;
    tips.hide();
    onDone(picked);
  };
  const choose = (key: string) => {
    if (picked.includes(key)) return;
    picked.push(key);
    // 다 찼는데 더 고르면 먼저 고른 카드와 바꿔요
    if (picked.length > vm.n) picked.shift();
    mark();
    if (vm.kind === "fall" && picked.length === vm.n) finish();
  };

  const root = gather(scene, 0, 0, () => {
    // 막: 아래 화면의 조작을 모두 막아요
    box(scene.add.graphics(), 0, 0, FRAME.w, FRAME.h, 0, { fill: P.scrim });
    scene.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive();
    render(scene, title, Math.round(PICK.cx - ts.w / 2), top);
    vm.cards.forEach((c, i) => {
      const x = left + i * (W + PICK.gap);
      const view = createHandCard(scene, c, x + W / 2 - HAND_CARD.w / 2, cardsTop + H - HAND_CARD.h, { scale: PICK.scale });
      views.push({ key: c.key, view });
      view.root.setInteractive(new Phaser.Geom.Rectangle(-HAND_CARD.w / 2, -HAND_CARD.h, HAND_CARD.w, HAND_CARD.h), Phaser.Geom.Rectangle.Contains);
      if (view.root.input) view.root.input.cursor = "pointer";
      view.root.on("pointerover", () => {
        view.setLifted(true);
        const cx = x + W / 2;
        const tipLeft = clampLeft(cx - PAPER.w / 2, PAPER.w, FRAME.w, HOVER.edge);
        tips.show({ skin: PAPER, content: cardTipContent(c.detail), at: { left: tipLeft, bottom: cardsTop - PICK.tipGap, tailX: cx - tipLeft } }, { owner: c.key })
          .setDepth(PICK.depth + 1);
      });
      view.root.on("pointerout", () => {
        view.setLifted(false);
        tips.hide(c.key);
      });
      view.root.on("pointerup", () => choose(c.key));
    });
    // 버튼: 낙하 = 누르는 동안 필드 보기, 품기 = 고른 카드로 닫기
    const by = cardsTop + H + PICK.pad;
    const bx = Math.round(PICK.cx - B.w / 2);
    render(scene, {
      t: "row", w: B.w, h: B.h, radius: B.radius, align: "center", justify: "center",
      style: { fill: P.endCalm, ring: { width: B.ring, color: P.endCalmLine } },
      children: [{ t: "text", text: vm.kind === "fall" ? COPY.pick.showField : COPY.pick.confirmHold, size: T.endTurn, color: P.ink2 } as Node],
    }, bx, by);
    const hit = scene.add.zone(bx, by, B.w, B.h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    if (vm.kind === "hold") hit.on("pointerup", finish);
    else {
      hit.on("pointerdown", () => {
        shown = false;
        tips.hide();
        root.setVisible(false);
      });
    }
  });
  root.setDepth(PICK.depth);
  mark();
  return {
    get shown() { return shown; },
    show() {
      shown = true;
      root.setVisible(true);
    },
  };
}
