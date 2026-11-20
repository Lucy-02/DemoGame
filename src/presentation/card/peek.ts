// 카드 들여다보기 (0159): 작은 얼굴을 가리키면 큰 얼굴이 뜨고, 머물면 그 옆에 곁쪽지가 떠요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { ms } from "../style/ease";
import { NOTE } from "../tooltip/skins";
import { drawTooltip, measureTooltip } from "../tooltip/Tooltip";
import { createBigCard, type BigCardOptions } from "./BigCard";
import { cardNoteContent } from "./cardTip";
import { BIG_CARD as B } from "./layout";
import type { CardVM } from "./viewmodel";

const DELAY = ms(tokens.provisional.motion.cardNote.delay);

/** 화면 폭과 가장자리 여백 (쪽지가 화면 밖으로 나가지 않게) */
export interface PeekFrame { w: number; h: number; edge: number }

/** 카드(왼쪽 위 x, y · 폭 w) 옆에 머물면 뜨는 곁쪽지를 걸어요. 돌려주는 Container를 지우면 기다림도 함께 끝나요.
 *  오른쪽에 자리가 없으면 왼쪽에 떠요 */
export function cardNote(scene: Phaser.Scene, c: CardVM, x: number, y: number, w: number, frame: PeekFrame, instant = false): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const show = () => {
    const content = cardNoteContent(c.detail);
    const gap = B.peek.noteGap;
    const right = x + w + gap;
    const left = right + NOTE.w <= frame.w - frame.edge ? right : x - gap - NOTE.w;
    const top = Math.max(frame.edge, Math.min(y, frame.h - frame.edge - measureTooltip(NOTE, content).h));
    root.add(drawTooltip(scene, { skin: NOTE, content, at: { left, top } }));
    // 나중에 그린 옆 카드에 가리지 않게 맨 위로
    if (root.parentContainer) root.parentContainer.bringToTop(root);
    else scene.children.bringToTop(root);
  };
  if (instant) show();
  else {
    const timer = scene.time.delayedCall(DELAY, show);
    root.once("destroy", () => timer.remove());
  }
  return root;
}

/** 큰 얼굴(왼쪽 위 x, y)을 띄우고 곁쪽지를 걸어요. 돌려주는 Container 하나에 둘 다 들어 있어요 */
export function cardPeek(scene: Phaser.Scene, c: CardVM, x: number, y: number, frame: PeekFrame, opts: BigCardOptions & { instantNote?: boolean } = {}): Phaser.GameObjects.Container {
  const k = opts.scale ?? 1;
  const w = B.w * k, h = B.h * k;
  // createBigCard의 자리는 키우기 전 크기 기준 (아래 가운데가 원점)이라, 키운 크기의 왼쪽 위에서 거꾸로 잡아요
  const big = createBigCard(scene, c, x + w / 2 - B.w / 2, y + h - B.h, { shadow: true, ...opts });
  const root = scene.add.container(0, 0, [big.root]);
  root.add(cardNote(scene, c, x, y, w, frame, opts.instantNote));
  return root;
}
