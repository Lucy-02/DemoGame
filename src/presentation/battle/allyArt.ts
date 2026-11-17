// 전투의 아군 정령 그림 (0109): 정령 일러스트(spiritArt)를 성장 단계에 맞춰 아군 그림 자리 안에 세워요.
// 자리(ALLY.body) 안에 비율을 지켜 맞추고, 아래 끝을 발 선에 붙여요. 그림이 없는 정령은 undefined라서 빈 상자 그대로예요.
import type * as Phaser from "phaser";
import type { Stage } from "../../core/types";
import { spiritArt } from "../spiritArt";
import { canvasTexture } from "../style/gradient";

export function drawAllyArt(scene: Phaser.Scene, id: string, stage: Stage, cx: number, feet: number, box: { w: number; h: number }) {
  const art = spiritArt(id, stage);
  if (!art || !scene.textures.exists(art.body)) return undefined;
  const src = scene.textures.get(art.body).getSourceImage() as HTMLImageElement;
  const k = Math.min(box.w / src.width, box.h / src.height);
  const w = Math.round(src.width * k), h = Math.round(src.height * k);
  const baked = canvasTexture(scene, `${art.body}@battle${box.w}x${box.h}`, w, h, (ctx) => {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
  });
  return scene.add.image(cx - w / 2, feet - h, baked).setOrigin(0, 0);
}
