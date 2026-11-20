// 런 화면에서 카드를 놓을 때 함께 쓰는 것: 큰 얼굴 기호 줄의 얼굴 굽기, 카드를 가리키면 뜨는 큰 얼굴.
import type * as Phaser from "phaser";
import { BIG_CARD } from "../card/layout";
import { noFace } from "../card/parts";
import { cardNote, cardPeek } from "../card/peek";
import type { CardVM } from "../card/viewmodel";
import { faceTexture } from "../spiritArt";
import { CARD_FOCUS, FRAME, GRID } from "./layout";
import type { LaneVM } from "./viewmodel";

const PEEK_FRAME = { w: FRAME.w, h: FRAME.h, edge: GRID.gutter };

/** 큰 얼굴 기호 줄의 주인 얼굴을 채워요: 주인 줄의 얼굴 그림. 그림이 없는 정령은 역할 기호, 주인이 없으면 얼굴 칸 없음 (BigCard가 그려요).
 *  scale = 큰 얼굴을 키워 놓는 배율 (그 크기로 구워서 또렷해요) */
export function cardWithFace(scene: Phaser.Scene, card: CardVM, owner: Pick<LaneVM, "face"> | undefined, scale = 1): CardVM {
  if (owner?.face && scene.textures.exists(owner.face.key)) return { ...card, face: faceTexture(scene, owner.face, Math.round(BIG_CARD.foot.size * scale)) };
  return { ...card, face: noFace(scene), ...(owner ? {} : { role: undefined }) };
}

const clamp = (v: number, size: number, max: number) => Math.max(GRID.gutter, Math.min(max - GRID.gutter - size, v));

/** 카드(왼쪽 위 x, y · 폭 w) 위에 큰 얼굴. 위에 자리가 없으면 옆에 떠요. 머물면 곁쪽지가 이어 떠요 (0159) */
export function drawCardTip(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  const top = y - CARD_FOCUS.tipGap - BIG_CARD.h;
  if (top < GRID.gutter) return drawCardTipBeside(scene, card, x, y, w);
  return cardPeek(scene, card, clamp(x + w / 2 - BIG_CARD.w / 2, BIG_CARD.w, FRAME.w), top, PEEK_FRAME);
}

/** 카드 옆(오른쪽, 넘치면 왼쪽)에 큰 얼굴. 카드를 가리면 안 되는 자리(덱 고르기 둘째 줄부터)에 */
export function drawCardTipBeside(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  const gap = CARD_FOCUS.tipGap;
  const right = x + w + gap;
  const left = right + BIG_CARD.w <= FRAME.w - GRID.gutter ? right : x - gap - BIG_CARD.w;
  return cardPeek(scene, card, left, clamp(y, BIG_CARD.h, FRAME.h), PEEK_FRAME);
}

/** 큰 얼굴로 놓인 카드(왼쪽 위 x, y · 폭 w) 옆에 머물면 뜨는 곁쪽지 (보상 · 상점) */
export function drawCardNote(scene: Phaser.Scene, card: CardVM, x: number, y: number, w: number) {
  return cardNote(scene, card, x, y, w, PEEK_FRAME);
}
