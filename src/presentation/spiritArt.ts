// 정령 일러스트 (Lucy 확정본, Drive jjal-handoff confirmed 2026-11-02). 만들기: tools/art/import-spirits.py
// 파일: assets/spirits/<정령>/<단계>.webp. 폴더 이름은 정령 id의 _ 대신 -. 구도는 spirits/artFit.ts (0023)
// 그림이 없는 정령은 undefined라서 화면이 자리표시(X 상자)를 그대로 그려요.
import type * as Phaser from "phaser";
import { STAGES, type Stage } from "../core/types";
import framesJson from "./spiritFrames.json";
import fitJson from "./spiritFit.json";
import { paintTileFace, tileCrop, type Crop, type Fit, type Fits, type Frame, type Frames } from "./spirits/artFit";
import { canvasTexture } from "./style/gradient";
import { faceKey } from "./faces";

const FRAMES = framesJson as unknown as Frames;
const FITS = fitJson as unknown as Fits;

export interface SpiritArt {
  /** 본그림 텍스처 키 */
  body: string;
  /** 처음 자리 */
  frame?: Frame;
  /** 사람이 맞춘 값 (피팅 페이지) */
  fit: Fit;
  /** 띠 타일 얼굴 자르기 */
  crop?: Crop;
}

const key = (id: string, stage: Stage) => `spirit:${id}:${stage}:body`;
export const spiritArtFile = (id: string, stage: Stage) => `assets/spirits/${id.replaceAll("_", "-")}/${stage}.webp`;

export function spiritArt(id: string, stage: Stage): SpiritArt | undefined {
  const frame = FRAMES[id]?.[stage];
  if (!frame) return undefined;
  const fit = FITS[id]?.[stage] ?? {};
  return { body: key(id, stage), frame, fit, crop: tileCrop(frame, fit) };
}

/** 정령들의 세 단계 그림을 모두 불러요 (화면 안에서 단계가 올라도 바로 그릴 수 있게) */
export function preloadSpiritArt(scene: Phaser.Scene, ids: readonly string[]) {
  for (const id of ids) {
    for (const stage of STAGES) {
      if (!FRAMES[id]?.[stage]) continue;
      const k = key(id, stage);
      if (!scene.textures.exists(k)) scene.load.image(k, spiritArtFile(id, stage));
    }
  }
}

/** 본그림에서 얼굴을 지름 d 원으로 잘라 구운 텍스처 (띠 타일, 전투 결과 줄, 카드 초상 홈) */
export function faceTexture(scene: Phaser.Scene, face: { key: string; crop: Crop }, d: number): string {
  const src = scene.textures.get(face.key).getSourceImage() as HTMLImageElement;
  return canvasTexture(scene, `${face.key}@tile${d}:${face.crop.join(",")}`, d, d, (ctx) => paintTileFace(ctx, src, face.crop, d));
}

/**
 * 정령 얼굴을 faceKey(id) 키로 원 그림 텍스처로 구워요 (전투 정보판·의도·손패 묶음이 정본 얼굴과 같은 길로 그려요).
 * 해상도는 본그림에서 자른 얼굴 그대로예요. 그림이 없거나 아직 안 불렀으면 빈 텍스처를 두고 false.
 */
export function bakeSpiritFace(scene: Phaser.Scene, id: string, stage: Stage): boolean {
  const a = spiritArt(id, stage);
  const key = faceKey(id);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  if (!a?.crop || !scene.textures.exists(a.body)) {
    // 그림이 없는 정령은 얼굴 자리를 비워요 (빠진 텍스처 무늬가 나오지 않게)
    canvasTexture(scene, key, 1, 1, () => {});
    return false;
  }
  const src = scene.textures.get(a.body).getSourceImage() as HTMLImageElement;
  const d = Math.round(a.crop[2] * src.height);
  canvasTexture(scene, key, d, d, (ctx) => paintTileFace(ctx, src, a.crop!, d));
  return true;
}
