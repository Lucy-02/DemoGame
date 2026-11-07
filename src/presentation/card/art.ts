// 카드 일러스트 (public/assets/cards/<id>.webp). 목록과 생성 기록은 design/card/art/picks.json, 만드는 도구는 tools/art/import_card_art.py.
// 그림은 정사각 원본을 그림 창에 덮어(cover) 가운데 맞춤으로 그려요. 물체·상징 그림은 import 단계에서 크기를 맞춰 둬요(0042).
import type * as Phaser from "phaser";

export const CARD_ART_IDS = [
  "starlight", "constellation", "glass_wall", "tail_sweep", "glass_shatter", "ram", "obsidian_horn", "landslide",
] as const;

export type CardArtId = (typeof CARD_ART_IDS)[number];

export const isCardArtId = (s: string): s is CardArtId => (CARD_ART_IDS as readonly string[]).includes(s);

export const cardArtKey = (id: CardArtId) => `card-art:${id}`;

export function preloadCardArt(scene: Phaser.Scene, id: CardArtId) {
  const key = cardArtKey(id);
  if (!scene.textures.exists(key)) scene.load.image(key, `assets/cards/${id}.webp`);
}
