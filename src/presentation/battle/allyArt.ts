// 전투의 아군 정령 그림 (0109): 정령 일러스트(spiritArt)를 성장 단계에 맞춰 아군 그림 자리 안에 세워요.
// 자리(ALLY.body) 높이에 비율을 지켜 맞추고(폭은 ALLY.art만큼 넘칠 수 있어요), 아래 끝을 발 선에 붙여요. 그림이 없는 정령은 undefined라서 빈 상자 그대로예요.
import type * as Phaser from "phaser";
import type { Stage } from "../../core/types";
import { spiritArt } from "../spiritArt";
import { canvasTexture } from "../style/gradient";

/** fit.over · fit.shift = ALLY.art (칸은 그대로 두고 몸통 기준으로 맞추는 값) */
export function drawAllyArt(
  scene: Phaser.Scene, id: string, stage: Stage, cx: number, feet: number,
  box: { w: number; h: number }, fit: { over: number; shift: number; baby: number },
) {
  const art = spiritArt(id, stage);
  if (!art || !scene.textures.exists(art.body)) return undefined;
  const src = scene.textures.get(art.body).getSourceImage() as HTMLImageElement;
  // 높이는 칸 안. 성체 · 각성체는 폭이 칸의 over배까지: 이펙트가 옆으로 넓은 그림도 몸이 작아지지 않아요. 유체는 몸이 곧 그림이라 칸 안
  const face = art.frame?.k === "face";
  // 유체는 칸의 baby배 안에 (0158: 작은 적보다 커 보이지 않게)
  const k = face ? Math.min((box.w * fit.over) / src.width, box.h / src.height) : Math.min(box.w / src.width, box.h / src.height) * fit.baby;
  const w = Math.round(src.width * k), h = Math.round(src.height * k);
  const baked = canvasTexture(scene, `${art.body}@battle${box.w}x${box.h}x${fit.over}x${fit.baby}`, w, h, (ctx) => {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
  });
  // 성체 · 각성체는 얼굴(몸통) 가운데를 칸 가운데로. 유체는 그림 가운데
  const off = face ? (0.5 - art.frame!.x) * w : 0;
  const max = box.w * fit.shift;
  const dx = Math.max(-max, Math.min(max, off));
  return scene.add.image(Math.round(cx + dx - w / 2), feet - h, baked).setOrigin(0, 0);
}
