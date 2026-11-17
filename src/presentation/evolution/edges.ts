// 누끼 가장자리 정리 (0037): 흰 매트 제거 → 깎기 → 번짐. Photoshop의 Remove White Matte + Choke + Feather와 같은 순서예요.
import type * as Phaser from "phaser";

export function cleanEdges(scene: Phaser.Scene, src: string, dst: string, opts: { choke: number; feather: number; matteGray: number }) {
  if (scene.textures.exists(dst)) return;
  const img = scene.textures.get(src).getSourceImage() as HTMLImageElement;
  const w = img.width, h = img.height;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d", { willReadFrequently: true })!;
  cx.drawImage(img, 0, 0);
  const data = cx.getImageData(0, 0, w, h), d = data.data;
  const a0 = new Uint8ClampedArray(w * h);
  for (let p = 0; p < w * h; p++) a0[p] = d[p * 4 + 3];
  // 1) 매트 제거: 색 = (보이는 색 − (1−a)·바탕) / a
  for (let p = 0; p < w * h; p++) {
    const a = a0[p] / 255;
    if (a <= 0.03 || a >= 1) continue;
    for (let c = 0; c < 3; c++) d[p * 4 + c] = (d[p * 4 + c] - (1 - a) * opts.matteGray) / a;
  }
  // 2) 깎기: 3×3 최솟값
  let a1 = a0;
  for (let k = 0; k < opts.choke; k++) {
    const nx = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let m = 255;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const yy = Math.min(h - 1, Math.max(0, y + dy)), xx = Math.min(w - 1, Math.max(0, x + dx));
            m = Math.min(m, a1[yy * w + xx]);
          }
        }
        nx[y * w + x] = m;
      }
    }
    a1 = nx;
  }
  // 3) 번짐: 깎은 알파를 흐린 뒤 원래 알파를 넘지 않게
  let a2 = a1;
  if (opts.feather > 0) {
    const mask = document.createElement("canvas");
    mask.width = w;
    mask.height = h;
    const mx = mask.getContext("2d")!;
    const md = mx.createImageData(w, h);
    for (let p = 0; p < w * h; p++) md.data[p * 4 + 3] = a1[p];
    mx.putImageData(md, 0, 0);
    const bl = document.createElement("canvas");
    bl.width = w;
    bl.height = h;
    const bx = bl.getContext("2d", { willReadFrequently: true })!;
    bx.filter = `blur(${opts.feather}px)`;
    bx.drawImage(mask, 0, 0);
    const bd = bx.getImageData(0, 0, w, h).data;
    a2 = new Uint8ClampedArray(w * h);
    for (let p = 0; p < w * h; p++) a2[p] = bd[p * 4 + 3];
  }
  for (let p = 0; p < w * h; p++) d[p * 4 + 3] = Math.min(a0[p], a2[p]);
  cx.putImageData(data, 0, 0);
  scene.textures.addCanvas(dst, cv);
}
