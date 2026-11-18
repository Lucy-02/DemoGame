// CSS opacity·filter를 컨테이너에 걸어요. 컨테이너 alpha는 겹친 조각마다 따로 먹어서 겹친 곳이 진해지므로,
// 한 장으로 그린 뒤 색 행렬 필터를 곱해요. 값이 기본값이면 필터를 꺼서 글자가 선명해요.
import type * as Phaser from "phaser";

/** CSS filter 값 (grayscale → contrast → brightness 순서) + opacity */
export interface ColorAdjust {
  grayscale?: number;
  contrast?: number;
  brightness?: number;
  opacity?: number;
}

/** CSS filter grayscale()의 휘도 계수 (Filter Effects 1, feColorMatrix saturate) */
const LUMA = [0.2126, 0.7152, 0.0722] as const;

/** Phaser ColorMatrix 배열(4×5, 덧셈 열은 0~255)로 바꿔요. */
export function colorMatrix({ grayscale = 0, contrast = 1, brightness = 1, opacity = 1 }: ColorAdjust): number[] {
  const keep = 1 - grayscale;
  const gain = contrast * brightness;
  const offset = (0.5 - 0.5 * contrast) * brightness * 255;
  const rows = [0, 1, 2].map((r) =>
    [0, 1, 2].map((c) => (LUMA[c] + (r === c ? 1 - LUMA[c] : -LUMA[c]) * keep) * gain));
  return [
    ...rows[0], 0, offset,
    ...rows[1], 0, offset,
    ...rows[2], 0, offset,
    0, 0, 0, opacity, 0,
  ];
}

const isIdentity = (a: ColorAdjust) =>
  (a.grayscale ?? 0) === 0 && (a.contrast ?? 1) === 1 && (a.brightness ?? 1) === 1 && (a.opacity ?? 1) === 1;

/** 컨테이너에 색 조정 필터를 하나 붙여요. 돌려준 함수로 값을 바꿔요. */
export function adjustColor(root: Phaser.GameObjects.Container, initial: ColorAdjust = {}): (a: ColorAdjust) => void {
  const fx = root.enableFilters().filters!.internal.addColorMatrix();
  // 필터는 장면 카메라를 본뜬 카메라로 한 번 떠서 입혀요. 장면 카메라처럼 왼쪽 위 기준으로 키워야 제자리에 떠요 (style/resolution.ts)
  root.filterCamera?.setOrigin(0, 0);
  const apply = (a: ColorAdjust) => {
    // 컨테이너가 지워지면 Phaser가 필터의 행렬을 비워요. 그 뒤에 도는 트윈(흐려지는 중에 화면을 다시 그릴 때)은 아무 일도 하지 않아요
    if (!fx.colorMatrix) return;
    fx.colorMatrix.set(colorMatrix(a));
    fx.active = !isIdentity(a);
  };
  apply(initial);
  return apply;
}

export interface Opacity {
  value: number;
}

export function opacityOf(root: Phaser.GameObjects.Container): Opacity {
  const set = adjustColor(root);
  let value = 1;
  return {
    get value() { return value; },
    set value(v: number) { value = v; set({ opacity: v }); },
  };
}

/** 어둡게: 색만 k배로 (알파는 그대로). 어두운 바탕 위 반투명은 어두워 보이지 않고 비쳐 보여서, 흐림 대신 써요 */
export function darken(root: Phaser.GameObjects.Container, k: number) {
  adjustColor(root, { brightness: k });
}
