// 막마다 까는 배경 그림 (0103). 만들기: tools/art/stage-bg.py
// 장소 그림(상점, 0122)은 한 장이에요. 만들기: tools/art/place-bg.py
// 그림 파일은 화면의 2배 크기예요(0149). 그릴 때는 stageImage로 화면 너비에 맞춰요.
// 레이어 둘: far(먼 풍경) 위에 ground(땅, 위쪽이 투명하게 풀림). 그림이 없는 막은 undefined라서 그라데이션 벽을 그대로 그려요.
import type * as Phaser from "phaser";
import { FRAME } from "./run/layout";

export interface StageArt { far: string; ground: string }

const FILES: Record<number, string> = { 1: "assets/stages/act1", 2: "assets/stages/act2", 3: "assets/stages/act3", 4: "assets/stages/act4", 5: "assets/stages/act5" };
const key = (act: number, layer: keyof StageArt) => `stage:${act}:${layer}`;

export function preloadStage(scene: Phaser.Scene, act?: number) {
  const dir = act === undefined ? undefined : FILES[act];
  if (!dir || act === undefined) return;
  for (const layer of ["far", "ground"] as const) {
    if (!scene.textures.exists(key(act, layer))) scene.load.image(key(act, layer), `${dir}/${layer}.webp`);
  }
}

/** 불러온 그림이 있을 때만 돌려줘요 (못 불렀으면 그라데이션 벽으로) */
export function stageArt(scene: Phaser.Scene, act?: number): StageArt | undefined {
  if (act === undefined || !FILES[act]) return undefined;
  const art = { far: key(act, "far"), ground: key(act, "ground") };
  return scene.textures.exists(art.far) && scene.textures.exists(art.ground) ? art : undefined;
}

/** 배경 그림 한 겹을 화면 왼쪽 위에, 화면 너비에 맞춰 놓아요 (파일이 몇 배 크기든) */
export function stageImage(scene: Phaser.Scene, key: string) {
  const img = scene.add.image(0, 0, key).setOrigin(0, 0);
  return img.setScale(FRAME.w / img.width);
}

const PLACES = { shop: "assets/stages/shop.webp" } as const;
export type Place = keyof typeof PLACES;
const placeKey = (place: Place) => `stage:${place}`;

export function preloadPlace(scene: Phaser.Scene, place: Place) {
  if (!scene.textures.exists(placeKey(place))) scene.load.image(placeKey(place), PLACES[place]);
}

/** 불러온 그림이 있을 때만 돌려줘요 */
export function placeArt(scene: Phaser.Scene, place: Place): string | undefined {
  return scene.textures.exists(placeKey(place)) ? placeKey(place) : undefined;
}
