// 정령 일러스트 (Lucy 확정본, Drive jjal-handoff confirmed 2026-11-02). 만들기: tools/art/import-spirits.py
// 파일: assets/spirits/<정령>/<단계>.webp. 폴더 이름은 정령 id의 _ 대신 -. 구도는 spirits/artFit.ts (0023)
// 그림이 없는 정령은 undefined라서 화면이 자리표시(X 상자)를 그대로 그려요.
import type * as Phaser from "phaser";
import { STAGES, type Stage } from "../core/types";
import framesJson from "./spiritFrames.json";
import fitJson from "./spiritFit.json";
import { tileCrop, type Crop, type Fit, type Fits, type Frame, type Frames } from "./spirits/artFit";

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
