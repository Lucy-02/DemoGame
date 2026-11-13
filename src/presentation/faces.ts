// 정령 얼굴 그림 (assets/ui/faces/<face>-face.webp). 전투 정보판·의도·카드 초상 홈이 함께 써요.
import type * as Phaser from "phaser";

/** 그림 기호 이름 (public/assets/ui/icons/<id>.svg) */
export type IconId = string;

export type FaceId = "star" | "fire" | "jelly";
export const FACES: readonly FaceId[] = ["star", "fire", "jelly"];

export const faceKey = (f: FaceId) => `face:${f}`;

export function preloadFaces(scene: Phaser.Scene) {
  for (const f of FACES) {
    if (!scene.textures.exists(faceKey(f))) scene.load.image(faceKey(f), `assets/ui/faces/${f}-face.webp`);
  }
}

/** 속성 id → 속성 기호 */
export const ELEMENT_ICON: Record<string, string> = {
  fire: "el-fire", water: "el-water", forest: "el-forest", wind: "el-wind", light: "el-light", earth: "el-earth", none: "el-none",
};
