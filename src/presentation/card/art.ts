// 카드 일러스트 (public/assets/cards/<카드 id>.webp). 그림이 있는 카드 id 목록은 artIds.json이고, tools/art/import_card_art.py가 만들어요.
// 그림은 정사각 원본을 그림 창에 덮어(cover) 가운데 맞춤으로 그려요. 물체·상징 그림은 import 단계에서 크기를 맞춰 둬요(0042).
import type * as Phaser from "phaser";
import artIds from "./artIds.json";

/** 그림이 있는 카드 id */
export type CardArtId = string & { readonly __cardArt: unique symbol };

const ART_IDS: ReadonlySet<string> = new Set(artIds);

export const isCardArtId = (id: string): id is CardArtId => ART_IDS.has(id);

/** 그림이 있으면 그 id, 없으면 undefined */
export const cardArtOf = (cardId: string): CardArtId | undefined => (isCardArtId(cardId) ? cardId : undefined);

export const cardArtKey = (id: CardArtId) => `card-art:${id}`;

export function preloadCardArt(scene: Phaser.Scene, id: CardArtId) {
  const key = cardArtKey(id);
  if (!scene.textures.exists(key)) scene.load.image(key, `assets/cards/${id}.webp`);
}
