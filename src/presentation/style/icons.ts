// 정본에서 꺼낸 기호 SVG(public/assets/ui/icons)를 필요한 픽셀 크기로 올려요.
// 한 색 기호는 흰색으로 저장돼 있어서 틴트로 색을 입혀요.
import type * as Phaser from "phaser";
import { rgba } from "./color";

export const iconKey = (id: string, w: number, h = w) => `icon:${id}@${w}x${h}`;

/** preload 단계에서 부르세요. 같은 키는 한 번만 올려요. */
export function loadIcon(scene: Phaser.Scene, id: string, w: number, h = w): string {
  const key = iconKey(id, w, h);
  if (!scene.textures.exists(key)) scene.load.svg(key, `assets/ui/icons/${id}.svg`, { width: w, height: h });
  return key;
}

/** 왼쪽 위 기준으로 기호를 놓아요. tint를 주면 그 색으로 칠해요. */
export function icon(
  scene: Phaser.Scene, x: number, y: number, id: string, w: number, h = w, tint?: string,
): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, iconKey(id, w, h)).setOrigin(0, 0);
  if (tint) {
    const c = rgba(tint);
    img.setTint(c.color).setAlpha(c.alpha);
  }
  return img;
}
