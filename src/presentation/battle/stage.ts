// 막마다 까는 배경 그림 (0103). 만들기: tools/art/stage-bg.py
// 레이어 둘: far(먼 풍경) 위에 ground(땅, 위쪽이 투명하게 풀림). 그림이 없는 막은 undefined라서 그라데이션 벽을 그대로 그려요.
import type * as Phaser from "phaser";

export interface StageArt { far: string; ground: string }

const FILES: Record<number, string> = { 1: "assets/stages/act1", 2: "assets/stages/act2" };
const key = (act: number, layer: keyof StageArt) => `stage:${act}:${layer}`;

export function preloadStage(scene: Phaser.Scene, act?: number) {
  const dir = act === undefined ? undefined : FILES[act];
  if (!dir || act === undefined) return;
  for (const layer of ["far", "ground"] as const) {
    if (!scene.textures.exists(key(act, layer))) scene.load.image(key(act, layer), `${dir}/${layer}.webp`);
  }
}

/** 불러온 그림이 있을 때만 돌려줘요 (못 불렀으면 그라데이션 벽으로) */
export function stageArt(scene: Phaser.Scene, act?: number): StageArt | undefined {
  if (act === undefined || !FILES[act]) return undefined;
  const art = { far: key(act, "far"), ground: key(act, "ground") };
  return scene.textures.exists(art.far) && scene.textures.exists(art.ground) ? art : undefined;
}
