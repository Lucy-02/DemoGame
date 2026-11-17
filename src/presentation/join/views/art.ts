// 정령 본그림을 화면 크기에 맞춰 구워 놓아요. 크기는 정령 관리 화면과 같은 계산(spirits/artFit placeArt)이에요.
// 깃들기 무대는 1:1, 출전 준비 자리 칸은 k배로 줄여요. 그림이 없는 정령은 실루엣 기호를 세워요.
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import type { SpiritArt } from "../../spiritArt";
import { placeArt, type Placed } from "../../spirits/artFit";
import { canvasTexture } from "../../style/gradient";
import { icon } from "../../style/icons";

const P = tokens.provisional.palette;

/** 실루엣 기호 (그림이 없는 정령, 0044 자리표시) */
export const SIL_ICON = "sil-fire";

/** 그림 자리: 가운데 cx, 아래 끝 bottom, k배 */
export function artPlace(art: SpiritArt, src: { width: number; height: number }, cx: number, bottom: number, k = 1): Placed {
  const at = placeArt(src.width, src.height, cx, art.frame, { ...art.fit, dy: 0, dx: 0 });
  const w = at.w * k, h = at.h * k;
  const left = cx + (at.x - cx) * k + (art.fit.dx ?? 0) * k;
  return { x: left, y: bottom - h + (art.fit.dy ?? 0) * k, w, h };
}

/** 그림을 놓고 돌려줘요. 그림이 없으면 sil 크기의 실루엣 */
export function drawSpiritArt(
  scene: Phaser.Scene, art: SpiritArt | undefined, cx: number, bottom: number, sil: { w: number; h: number }, k = 1,
): Phaser.GameObjects.Image {
  if (!art || !scene.textures.exists(art.body)) {
    return icon(scene, cx - sil.w / 2, bottom - sil.h, SIL_ICON, sil.w, sil.h, P.face);
  }
  const src = scene.textures.get(art.body).getSourceImage() as HTMLImageElement;
  const at = artPlace(art, src, cx, bottom, k);
  const w = Math.round(at.w), h = Math.round(at.h);
  const key = canvasTexture(scene, `join:art:${art.body}@${w}x${h}`, w, h, (ctx) => {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
  });
  return scene.add.image(at.x, at.y, key).setOrigin(0, 0);
}
