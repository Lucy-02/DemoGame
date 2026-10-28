// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import * as Phaser from "phaser";
import { ASSETS, type ShapeAsset, type VisualAsset } from "../core/data";
import { drawShape } from "./widgets";

const keyOf = (kind: string, id: string) => `${kind}:${id}`;

/** assets.json에 적힌 이미지와 Spine 파일을 불러와요. */
export function preloadVisuals(scene: Phaser.Scene) {
  const load = scene.load as Phaser.Loader.LoaderPlugin & {
    spineJson: (k: string, url: string) => void;
    spineAtlas: (k: string, url: string, pma?: boolean) => void;
  };
  for (const kind of ["spirits", "enemies"] as const) {
    for (const [id, a] of Object.entries(ASSETS[kind])) {
      const key = keyOf(kind, id);
      if (a.type === "image") load.image(key, a.path);
      if (a.type === "spine") {
        load.spineJson(`${key}:data`, a.skeleton);
        load.spineAtlas(`${key}:atlas`, a.atlas, false);
      }
    }
  }
}

export interface Visual {
  root: Phaser.GameObjects.Container;
  play(anim: "idle" | "attack" | "hit" | "death"): void;
}

const DEFAULT_SHAPE: ShapeAsset = { type: "shape", shape: "blob", color: "#888888", size: 80 };

/** 정령/적 비주얼. Spine이면 애니메이션, 도형이면 트윈으로 흉내 내요. */
export function makeVisual(scene: Phaser.Scene, kind: "spirits" | "enemies", id: string, flip: boolean): Visual {
  const a: VisualAsset = ASSETS[kind][id] ?? DEFAULT_SHAPE;
  const root = scene.add.container(0, 0);
  const key = keyOf(kind, id);

  if (a.type === "spine" && scene.cache.json.exists(`${key}:data`)) {
    try {
      const sp = (scene.add as unknown as { spine: (...args: unknown[]) => any }).spine(0, a.offsetY ?? 0, `${key}:data`, `${key}:atlas`);
      sp.setScale((a.scale ?? 1) * (flip ? -1 : 1), a.scale ?? 1);
      const anims = a.anims ?? {};
      const idle = anims.idle ?? "idle";
      sp.animationState.setAnimation(0, idle, true);
      root.add(sp);
      return {
        root,
        play(name) {
          const n = anims[name] ?? name;
          if (!sp.skeleton.data.findAnimation(n)) return;
          if (name === "death") {
            sp.animationState.setAnimation(0, n, false);
            return;
          }
          sp.animationState.setAnimation(0, n, false);
          sp.animationState.addAnimation(0, idle, true, 0);
        },
      };
    } catch (err) {
      console.warn("spine load failed, fallback to shape", id, err);
    }
  }
  if (a.type === "image" && scene.textures.exists(key)) {
    const img = scene.add.image(0, a.offsetY ?? 0, key).setScale(a.scale ?? 1).setFlipX(flip);
    root.add(img);
    return { root, play: (n) => tweenAnim(scene, root, n, flip) };
  }
  const shape = a.type === "shape" ? a : a.type === "spine" && a.fallback ? a.fallback : DEFAULT_SHAPE;
  const body = drawShape(scene, shape, flip);
  root.add(body);
  scene.tweens.add({ targets: body, scaleY: 1.04, y: -3, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: "Sine.InOut" });
  return { root, play: (n) => tweenAnim(scene, root, n, flip) };
}

function tweenAnim(scene: Phaser.Scene, t: Phaser.GameObjects.Container, name: string, flip: boolean) {
  const dir = flip ? -1 : 1;
  if (name === "attack") scene.tweens.add({ targets: t, x: t.x + 30 * dir, duration: 110, yoyo: true, ease: "Quad.Out" });
  if (name === "hit") scene.tweens.add({ targets: t, x: t.x - 10 * dir, duration: 60, yoyo: true, repeat: 1 });
  if (name === "death") scene.tweens.add({ targets: t, alpha: 0.25, angle: 12 * dir, duration: 400 });
}
