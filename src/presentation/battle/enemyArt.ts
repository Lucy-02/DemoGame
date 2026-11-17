// 적 그림 (0100, 임시 선택: Lucy가 후보 시트에서 고르기 전의 연결). 만들기: tools/art/import-enemies.py
// 파일: assets/enemies/<적 id>.webp (왼쪽을 보는 누끼). 크기와 발 위치는 enemyFit.json (사람이 맞춘 값):
//   h = 화면에서의 그림 높이, sink = 그림 아래 끝에서 발 선까지 (바닥에 퍼진 부분만큼), dx = 가운데에서 옆으로, of = 같은 그림을 쓰는 적
// 그림이 없는 적은 undefined라서 화면이 자리표시(X 상자)를 그대로 그려요.
import type * as Phaser from "phaser";
import fitJson from "./enemyFit.json";
import { canvasTexture } from "../style/gradient";

interface Fit { h?: number; sink?: number; dx?: number; of?: string }
const FITS = fitJson as Record<string, Fit>;

const artId = (id: string) => FITS[id]?.of ?? id;
const key = (id: string) => `enemy:${artId(id)}`;
export const enemyArtFile = (id: string) => `assets/enemies/${artId(id).replaceAll("_", "-")}.webp`;
const fitOf = (id: string) => FITS[artId(id)];

export function preloadEnemyArt(scene: Phaser.Scene, ids: readonly string[]) {
  for (const id of ids) if (fitOf(id)?.h && !scene.textures.exists(key(id))) scene.load.image(key(id), enemyArtFile(id));
}

/**
 * 발 선(cx, feet) 위에 세운 적 그림. 쓰는 크기로 구워서 작은 자리에서도 또렷해요.
 * show = 위에서부터 보일 몫 (땅속 0096: 윗부분만 발 선 위로 남아요). 그림이 없으면 undefined.
 */
export function drawEnemyArt(scene: Phaser.Scene, id: string, cx: number, feet: number, show = 1) {
  const fit = fitOf(id);
  if (!fit?.h || !scene.textures.exists(key(id))) return undefined;
  const src = scene.textures.get(key(id)).getSourceImage() as HTMLImageElement;
  const k = fit.h / src.height;
  const w = Math.round(src.width * k), h = Math.round(fit.h * show);
  const baked = canvasTexture(scene, `${key(id)}@${fit.h}:${show}`, w, h, (ctx) => {
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, fit.h!);
  });
  const sink = show < 1 ? 0 : fit.sink ?? 0;
  return scene.add.image(cx + (fit.dx ?? 0) - w / 2, feet + sink - h, baked).setOrigin(0, 0);
}
