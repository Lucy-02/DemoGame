// 조준선 그리기: 시작점 하나에서 대상마다 점선 곡선 + 끝 점. 여러 대상이어도 시작점은 하나예요.
// WebGL 선은 안티앨리어싱이 없어 점선 곡선이 거칠어서, 화면 크기 canvas에 굽고 바뀔 때마다 다시 그려요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { CURVE_RULES, type CurveRuleName, type Pt } from "./curve";
import { AIM_CURVE_RULE, AIM_EXAMPLE, AIM_LINE } from "./layout";

const P = tokens.provisional.palette;

export interface AimLines {
  image: Phaser.GameObjects.Image;
  /** 시작점 하나와 대상 끝점들. 대상이 없으면 지워요. */
  set(origin: Pt, targets: Pt[]): void;
}

let serial = 0;

export function createAimLines(scene: Phaser.Scene, w: number, h: number, rule: CurveRuleName = AIM_CURVE_RULE): AimLines {
  const curve = CURVE_RULES[rule](AIM_EXAMPLE);
  const key = `aim:lines:${serial++}`;
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  const image = scene.add.image(0, 0, key).setOrigin(0, 0);
  const set = (origin: Pt, targets: Pt[]) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = P.accHi;
    ctx.fillStyle = P.accHi;
    ctx.lineWidth = AIM_LINE.width;
    ctx.lineCap = "round";
    for (const t of targets) {
      const c = curve(origin, t);
      ctx.setLineDash(AIM_LINE.dash);
      ctx.beginPath();
      ctx.moveTo(c.p0.x, c.p0.y);
      ctx.bezierCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, c.p3.x, c.p3.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, AIM_LINE.dot, 0, Math.PI * 2);
      ctx.fill();
    }
    tex.refresh();
  };
  return { image, set };
}
