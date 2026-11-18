// 그리는 해상도 배수. 화면 좌표는 늘 1280×800이고, 큰 모니터에서는 같은 화면을 배수만큼 촘촘히 그려요.
// 배수는 게임을 켤 때 모니터 크기로 한 번 정해요(창 크기를 바꿔도 그대로). 창에 맞추는 일은 Scale.FIT이 맡아요 (0084 4번).
// 화면 코드는 배수를 몰라도 돼요: 카메라가 배수만큼 키워 그리고, 글자 · 기호 · 구운 텍스처만 여기 값을 읽어 촘촘히 만들어요.
import type * as Phaser from "phaser";

/** 가장 큰 배수. 4K(2.7배)까지 덮어요 */
const MAX = 3;
/** 이만큼까지 모자란 것은 늘여 그려요 (1536×960 같은 조금 큰 화면에서 네 배로 그리지 않게) */
const SLACK = 0.25;

let res = 1;

/** 지금 배수 (1 · 2 · 3) */
export const RES = () => res;

/** 모니터에 꽉 채웠을 때 1280×800 한 픽셀이 차지하는 기기 픽셀 수로 배수를 골라요 */
export function pickResolution(base: { w: number; h: number }, screen: { w: number; h: number }, dpr: number, override?: number): number {
  if (override && override >= 1) return Math.min(MAX, Math.round(override));
  const need = Math.min(screen.w / base.w, screen.h / base.h) * dpr;
  return Math.min(MAX, Math.max(1, Math.ceil(need - SLACK)));
}

let installed = false;

/**
 * 게임을 만들기 전에 한 번 불러요. 이 뒤로 만드는 카메라는 모두 화면 좌표(1280×800 기준)로 받고 배수만큼 키워 그려요.
 * 카메라 자리 · 크기는 화면 좌표로 넘기고, 스크롤도 화면 좌표 그대로예요.
 */
export function installResolution(k: number, cameras: typeof Phaser.Cameras.Scene2D.CameraManager) {
  res = k;
  if (installed) return;
  installed = true;
  // Phaser는 넘겨받아요: 이 파일을 읽는 글자 · 기호 코드가 브라우저 없는 테스트에서도 돌게
  const proto = cameras.prototype;
  const add = proto.add;
  proto.add = function (this: Phaser.Cameras.Scene2D.CameraManager, x?: number, y?: number, width?: number, height?: number, makeMain?: boolean, name?: string) {
    const s = (v: number | undefined) => (v === undefined ? v : v * res);
    const cam = add.call(this, s(x), s(y), s(width), s(height), makeMain, name);
    // 왼쪽 위를 기준으로 키워야 스크롤 값이 화면 좌표 그대로 맞아요
    return cam.setOrigin(0, 0).setZoom(res);
  };
}

/** 포인터 자리를 화면 좌표(1280×800 기준)로. 스크롤하지 않는 화면에서 써요 */
export const pointerAt = (p: Phaser.Input.Pointer) => ({ x: p.x / res, y: p.y / res });

/**
 * 구워 두는 캔버스 텍스처: 배수만큼 촘촘한 캔버스를 만들고, 그리는 좌표와 놓는 크기는 w×h 그대로 쓰게 해요.
 * 다 그린 뒤 `refresh()`는 부르는 쪽이 해요.
 */
export function createCanvas(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture {
  const tex = scene.textures.createCanvas(key, Math.ceil(w * res), Math.ceil(h * res))!;
  tex.getContext().scale(res, res);
  return logicalSize(tex, w, h);
}

/** 촘촘하게 올린 텍스처를 화면에서는 w×h로 놓이게 해요 (텍스처 전체가 한 프레임일 때) */
export function logicalSize<T extends Phaser.Textures.Texture>(tex: T, w: number, h: number): T {
  const frame = tex.get();
  const { cutWidth, cutHeight } = frame;
  frame.setSize(w, h);
  frame.setCutSize(cutWidth, cutHeight);
  // 그릴 때 프레임 크기를 이 값으로 나눠요 (Phaser Text가 쓰는 것과 같은 길)
  frame.source.resolution = cutWidth / w;
  return tex;
}
