// CSS 바깥 box-shadow(0 y blur color)를 canvas로 구워요. canvas shadowBlur = CSS blur 반경.
import type * as Phaser from "phaser";

export interface Shadow {
  y: number;
  blur: number;
  color: string;
}

/** w×h 둥근 상자의 그림자 텍스처. 돌려주는 margin만큼 상자 왼쪽 위에서 빼서 놓아요. */
export function shadowTexture(
  scene: Phaser.Scene, w: number, h: number, radius: number, s: Shadow,
): { key: string; margin: number } {
  const margin = s.blur + Math.abs(s.y);
  const key = `shadow:${w}x${h}r${radius}:${s.y},${s.blur},${s.color}`;
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, w + margin * 2, h + margin * 2)!;
    const ctx = tex.getContext();
    // 상자는 캔버스 밖으로 밀고 그림자만 제자리에 떨어지게 해요
    const shift = (w + margin * 2) * 2;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur;
    ctx.shadowOffsetX = shift;
    ctx.shadowOffsetY = s.y;
    ctx.beginPath();
    ctx.roundRect(margin - shift, margin, w, h, radius);
    ctx.fill();
    tex.refresh();
  }
  return { key, margin };
}
