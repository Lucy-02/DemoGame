// 런 화면에서 카드를 놓을 때 함께 쓰는 것: 초상 홈 얼굴 굽기, 카드 위 말풍선.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { cardTipContent } from "../card/cardTip";
import { HAND_CARD } from "../card/layout";
import type { CardVM } from "../card/viewmodel";
import { noFace } from "../card/HandCard";
import { faceTexture } from "../spiritArt";
import { PAPER } from "../tooltip/skins";
import { clampLeft, drawTooltip } from "../tooltip/Tooltip";
import { CARD_FOCUS, FRAME, GRID } from "./layout";
import type { LaneVM } from "./viewmodel";

const NOTCH = HAND_CARD.notch.d - HAND_CARD.notch.inset * 2;

/** 카드 초상 홈 얼굴을 채워요: 주인 줄의 얼굴 그림. 그림이 없는 정령은 빈 홈 + 역할 기호, 주인이 없으면 빈 홈 (HandCard가 그려요).
 *  scale = 카드를 키워 놓는 배율 (그 크기로 구워서 또렷해요) */
export function cardWithFace(scene: Phaser.Scene, card: CardVM, owner: Pick<LaneVM, "face"> | undefined, scale = 1): CardVM {
  if (owner?.face && scene.textures.exists(owner.face.key)) return { ...card, face: faceTexture(scene, owner.face, Math.round(NOTCH * scale)) };
  return { ...card, face: noFace(scene), ...(owner ? {} : { role: undefined }) };
}

/** 카드(왼쪽 위 x, y · 폭 w) 위에 효과 말풍선 */
export function drawCardTip(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  const cx = x + w / 2;
  const left = clampLeft(cx - PAPER.w / 2, PAPER.w, FRAME.w, GRID.gutter);
  return drawTooltip(scene, { skin: PAPER, content: cardTipContent(card.detail), at: { left, bottom: y - CARD_FOCUS.tipGap, tailX: cx - left } });
}

/** 카드 옆(오른쪽, 넘치면 왼쪽)에 꼬리 없는 효과 말풍선. 윗줄 머리 · 카드를 가리면 안 되는 자리(덱 고르기 둘째 줄부터)에 */
export function drawCardTipBeside(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  const gap = CARD_FOCUS.tipGap;
  const right = x + w + gap;
  const left = right + PAPER.w <= FRAME.w - GRID.gutter ? right : x - gap - PAPER.w;
  return drawTooltip(scene, { skin: PAPER, content: cardTipContent(card.detail), at: { left, top: y } });
}
