// 정령 일러스트 (Lucy 확정본, Drive jjal-handoff confirmed 2026-11-02). 만들기: tools/art/import-spirits.py
// 파일: assets/spirits/<정령>/<단계>.webp (본그림), <단계>-face.webp (띠 타일 원형 얼굴). 폴더 이름은 정령 id의 _ 대신 -
// 그림이 없는 정령은 undefined라서 화면이 자리표시(X 상자)를 그대로 그려요.
import type * as Phaser from "phaser";
import { STAGES, type Stage } from "../core/types";

const WITH_ART = new Set([
  "flash", "glass_salamander", "kelp_seahorse", "magma_ibex", "mirage", "mirror_peacock", "mist_cat",
  "night_owl", "pearl_oyster", "prism_chameleon", "rain_frog", "river_otter", "rune", "shadow_moth",
]);

export interface SpiritArt {
  /** 본그림 텍스처 키 */
  body: string;
  /** 원형 얼굴 텍스처 키 */
  face: string;
}

const key = (id: string, stage: Stage, part: keyof SpiritArt) => `spirit:${id}:${stage}:${part}`;
const file = (id: string, stage: Stage, part: keyof SpiritArt) =>
  `assets/spirits/${id.replaceAll("_", "-")}/${stage}${part === "face" ? "-face" : ""}.webp`;

export function spiritArt(id: string, stage: Stage): SpiritArt | undefined {
  if (!WITH_ART.has(id)) return undefined;
  return { body: key(id, stage, "body"), face: key(id, stage, "face") };
}

/** 정령들의 세 단계 그림을 모두 불러요 (화면 안에서 단계가 올라도 바로 그릴 수 있게) */
export function preloadSpiritArt(scene: Phaser.Scene, ids: readonly string[]) {
  for (const id of ids) {
    if (!WITH_ART.has(id)) continue;
    for (const stage of STAGES) {
      for (const part of ["body", "face"] as const) {
        const k = key(id, stage, part);
        if (!scene.textures.exists(k)) scene.load.image(k, file(id, stage, part));
      }
    }
  }
}
