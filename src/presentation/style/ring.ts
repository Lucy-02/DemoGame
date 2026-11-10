// 얼굴 둘레 진행 링 (정본 .q-ring svg): 바탕 원 + 12시에서 시계 방향으로 도는 호들. canvas에 한 번 구워요.
// 정령 관리 띠 타일과 전투 결과 정령 줄이 함께 써요.
import type * as Phaser from "phaser";
import { canvasTexture } from "./gradient";

export interface RingArc {
  /** 0~1 (한 바퀴 = 1), 12시 기준 */
  from: number;
  to: number;
  color: string;
  /** 없으면 링 굵기 */
  width?: number;
}

export interface RingSpec {
  /** 텍스처 한 변 */
  d: number;
  /** 선 가운데까지의 반지름 */
  r: number;
  stroke: number;
  /** 바탕 원. dash = [선, 틈]이면 점선 */
  track?: { color: string; width?: number; dash?: [number, number] };
  arcs: RingArc[];
  cap?: CanvasLineCap;
}

const TOP = -Math.PI / 2;
const TURN = Math.PI * 2;

/** key가 같으면 다시 그리지 않아요. 모양이 달라지면 key도 달라야 해요 */
export function ringTexture(scene: Phaser.Scene, key: string, spec: RingSpec): string {
  return canvasTexture(scene, key, spec.d, spec.d, (ctx) => {
    const c = spec.d / 2;
    ctx.lineCap = spec.cap ?? "butt";
    if (spec.track) {
      ctx.strokeStyle = spec.track.color;
      ctx.lineWidth = spec.track.width ?? spec.stroke;
      ctx.setLineDash(spec.track.dash ?? []);
      ctx.beginPath();
      ctx.arc(c, c, spec.r, TOP, TOP + TURN);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const a of spec.arcs) {
      if (a.to <= a.from) continue;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.width ?? spec.stroke;
      ctx.beginPath();
      ctx.arc(c, c, spec.r, TOP + TURN * a.from, TOP + TURN * a.to);
      ctx.stroke();
    }
  });
}
