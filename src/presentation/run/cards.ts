// 런 화면에서 카드를 놓을 때 함께 쓰는 것: 초상 홈 얼굴 굽기, 카드 위 말풍선.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { cardTipContent } from "../card/cardTip";
import { HAND_CARD } from "../card/layout";
import type { CardVM } from "../card/viewmodel";
import { faceTexture } from "../spiritArt";
import { canvasTexture } from "../style/gradient";
import { PAPER } from "../tooltip/skins";
import { clampLeft, drawTooltip } from "../tooltip/Tooltip";
import { CARD_FOCUS, FRAME, GRID } from "./layout";
import type { LaneVM } from "./viewmodel";

const P = tokens.provisional.palette;
const NOTCH = HAND_CARD.notch.d - HAND_CARD.notch.inset * 2;

/** 카드 초상 홈 얼굴을 채워요: 주인 줄의 얼굴 그림, 그림이 없는 정령은 빈 자리, 주인이 없으면 종이 빛 빈 홈.
 *  scale = 카드를 키워 놓는 배율 (그 크기로 구워서 또렷해요) */
export function cardWithFace(scene: Phaser.Scene, card: CardVM, owner: Pick<LaneVM, "face"> | undefined, scale = 1): CardVM {
  const d = Math.round(NOTCH * scale);
  const blank = (name: string, color: string) => canvasTexture(scene, `run:no-face:${name}:${d}`, d, d, (ctx) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  const face = !owner ? blank("shared", P.paper2)
    : owner.face && scene.textures.exists(owner.face.key) ? faceTexture(scene, owner.face, d)
    : blank("spirit", P.wall);
  return { ...card, face };
}

/** 카드(왼쪽 위 x, y · 폭 w) 위에 효과 말풍선 */
export function drawCardTip(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  const cx = x + w / 2;
  const left = clampLeft(cx - PAPER.w / 2, PAPER.w, FRAME.w, GRID.gutter);
  return drawTooltip(scene, { skin: PAPER, content: cardTipContent(card.detail), at: { left, bottom: y - CARD_FOCUS.tipGap, tailX: cx - left } });
}
