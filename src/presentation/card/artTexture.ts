// 카드 그림을 카드 모양으로 구워요 (0161): 둥근 모서리로 자른 그림 + 아래 띠 + 1px 테.
// 키운 카드는 키운 만큼 촘촘하게 구워서 흐려지지 않아요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { transparentOf, withAlpha } from "../style/color";
import { createCanvas } from "../style/resolution";
import { cardArtKey, type CardArtId } from "./art";

const P = tokens.provisional.palette;

export interface CardFaceShape {
  w: number;
  h: number;
  radius: number;
  border: number;
  /** 정사각 그림 크기와 위 자리 (가로는 가운데) */
  art: { size: number; top: number };
  /** 아래 띠: 높이 h, 위쪽 fade 만큼 투명에서 짙어져요. 없으면 띠 없이 그림만.
   *  stops를 주면 [자리 0~1, 불투명도]대로 어두워져요 (큰 얼굴: 끝은 꽉 찬 어둠) */
  band?: { h: number; fade: number; stops?: readonly (readonly [number, number])[] };
}

/** 그림이 없으면 바닥색 카드. scale = 카드를 키워 놓는 배율 */
export function cardFaceTexture(scene: Phaser.Scene, s: CardFaceShape, id: CardArtId | undefined, scale = 1): string {
  // 아직 올리지 않은 그림은 없는 그림으로 그려요
  const art = id && scene.textures.exists(cardArtKey(id)) ? id : undefined;
  const key = `card:face:${s.w}x${s.h}:${s.band ? s.band.h : 0}:${s.band?.stops ? "deep" : "band"}:${art ?? "none"}@${scale}`;
  if (scene.textures.exists(key)) return key;
  const tex = createCanvas(scene, key, s.w * scale, s.h * scale);
  const ctx = tex.getContext();
  ctx.scale(scale, scale);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, s.w, s.h, s.radius);
  ctx.clip();
  ctx.fillStyle = P.floor;
  ctx.fillRect(0, 0, s.w, s.h);
  if (art) {
    const img = scene.textures.get(cardArtKey(art)).getSourceImage() as CanvasImageSource & { width: number; height: number };
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (s.w - s.art.size) / 2, s.art.top, s.art.size, s.art.size);
  }
  if (s.band) {
    const top = s.h - s.band.h;
    const grad = ctx.createLinearGradient(0, top, 0, s.h);
    if (s.band.stops) for (const [at, a] of s.band.stops) grad.addColorStop(at, withAlpha(P.scrimDeep, a));
    else {
      grad.addColorStop(0, transparentOf(P.scrimDeep));
      grad.addColorStop(s.band.fade / s.band.h, P.scrimDeep);
      grad.addColorStop(1, P.scrimDeep);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, top, s.w, s.band.h);
  }
  ctx.restore();
  ctx.strokeStyle = P.veil["20"];
  ctx.lineWidth = s.border;
  ctx.beginPath();
  ctx.roundRect(s.border / 2, s.border / 2, s.w - s.border, s.h - s.border, s.radius - s.border / 2);
  ctx.stroke();
  tex.refresh();
  return key;
}
