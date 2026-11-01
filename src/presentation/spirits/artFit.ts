// 정령 일러스트 구도: 어디에 얼마나 크게 그릴지와 그리는 법. 게임 화면(backdrop·strip)과 피팅 페이지(spirit-fit.html)가
// 같은 계산을 써서, 페이지에서 맞춘 모습이 게임과 똑같아요. Phaser 없이 숫자와 canvas 2D만 써요. (0023)
// 기준값: spiritFrames.json (tools/art/import-spirits.py가 얼굴 상자·보이는 면적에서 만든 처음 자리)
// 조정값: spiritFit.json (Lucy가 피팅 페이지에서 정령·단계마다 맞춘 값. 저장하면 이 파일이 바뀌어요)
// 두 파일은 spiritArt.ts가 읽어요. 이 파일은 계산만 해서, 피팅 페이지가 저장 때 다시 불러오지 않아요.
import type { Stage } from "../../core/types";
import { tokens } from "../../design/tokens";
import { withAlpha } from "../style/color";
import { ART, FRAME, STRIP, TOP } from "./layout";

const P = tokens.provisional.palette;

/** [가운데 x (그림 폭 비율), 가운데 y (그림 높이 비율), 지름 (그림 높이 비율)] */
export type Crop = readonly [number, number, number];

/** 처음 자리. x·y는 그림 폭·높이 비율, c는 띠 타일 얼굴 자르기
 *  face: 성체·각성체. 얼굴 가운데 높이 y, 가로 기준 x, 얼굴 상자 높이 u(그림 높이 비율)
 *  mass: 유체. 무게중심 x, 보이는 면적의 제곱근 u(그림 폭 비율) */
export type Frame =
  | { readonly k: "face"; readonly x: number; readonly y: number; readonly u: number; readonly c: Crop }
  | { readonly k: "mass"; readonly x: number; readonly u: number; readonly c: Crop };

/** 사람이 맞춘 값. s: 크기 배율, dx·dy: 화면 px 이동, c: 띠 타일 얼굴 자르기 */
export interface Fit {
  s?: number;
  dx?: number;
  dy?: number;
  c?: Crop;
}
export type Fits = Record<string, Partial<Record<Stage, Fit>>>;
export type Frames = Record<string, Partial<Record<Stage, Frame>>>;

export interface Placed { x: number; y: number; w: number; h: number }

/** 그림(w×h)을 화면 어디에 얼마나 크게 둘지. cx는 가로 기준선(패널 접힘이면 오른쪽으로 밀려요) */
export function placeArt(w: number, h: number, cx: number, frame?: Frame, fit: Fit = {}): Placed {
  const { upper, whole } = ART;
  const k = fit.s ?? 1, dx = fit.dx ?? 0, dy = fit.dy ?? 0;
  if (frame?.k === "face") {
    // 얼굴 상자 높이를 faceH로, 얼굴 가운데를 faceY에. 배율은 얼굴 자리를 중심으로 키워요
    const s = (upper.faceH / (frame.u * h)) * k;
    return { x: cx - frame.x * w * s + dx, y: upper.faceY - frame.y * h * s + dy, w: w * s, h: h * s };
  }
  // 유체: 보이는 면적의 제곱근을 mass로(maxW·maxH 안으로), 아래를 bottom에. 배율은 발밑을 중심으로 키워요
  const fit0 = Math.min(whole.maxW / w, whole.maxH / h);
  const s = (frame ? Math.min(whole.mass / (frame.u * w), fit0) : fit0) * k;
  const fx = frame ? frame.x : 0.5;
  return { x: cx - fx * w * s + dx, y: whole.bottom - h * s + dy, w: w * s, h: h * s };
}

export const tileCrop = (frame?: Frame, fit: Fit = {}): Crop | undefined => fit.c ?? frame?.c;

/** 화면 크기 캔버스에 그림 색 번짐 → 그림(아래 띠에 걸리면 서서히 사라짐)을 그려요. 위 막대 아래·아래 띠 위로만 */
export function paintArt(ctx: CanvasRenderingContext2D, src: CanvasImageSource, at: Placed) {
  const top = TOP.h, bottom = FRAME.h - STRIP.h;
  const A = ART.ambient;
  const glow = document.createElement("canvas");
  glow.width = FRAME.w * A.scale;
  glow.height = FRAME.h * A.scale;
  const gc = glow.getContext("2d")!;
  gc.filter = `blur(${A.blur}px) brightness(${A.brightness})`;
  gc.drawImage(src, at.x * A.scale, at.y * A.scale, at.w * A.scale, at.h * A.scale);

  const body = document.createElement("canvas");
  body.width = FRAME.w;
  body.height = FRAME.h;
  const bc = body.getContext("2d")!;
  bc.drawImage(src, at.x, at.y, at.w, at.h);
  // 아래 띠에 걸리는 그림만 서서히 사라지게 (몸 전체가 보이는 유체는 그대로)
  if (at.y + at.h > bottom) fadeOut(bc, bottom);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, FRAME.w, bottom - top);
  ctx.clip();
  ctx.globalAlpha = A.alpha;
  ctx.drawImage(glow, 0, 0, FRAME.w, FRAME.h);
  ctx.globalAlpha = 1;
  ctx.drawImage(body, 0, 0);
  ctx.restore();
}

function fadeOut(c: CanvasRenderingContext2D, bottom: number) {
  c.globalCompositeOperation = "destination-in";
  const fade = c.createLinearGradient(0, bottom - ART.fade, 0, bottom);
  // destination-in은 알파만 봐요 (색은 아무거나, 알파는 1 → 0)
  fade.addColorStop(0, withAlpha(P.scrim, 1));
  fade.addColorStop(1, withAlpha(P.scrim, 0));
  c.fillStyle = fade;
  // 칠하지 않은 곳은 지워지니 전체를 칠해요 (기울기 위쪽은 불투명으로 이어져요)
  c.fillRect(0, 0, FRAME.w, FRAME.h);
  c.globalCompositeOperation = "source-over";
}

/** 지름 d 캔버스에 그림의 crop 자리를 원으로 잘라 그려요 (띠 타일 얼굴) */
export function paintTileFace(ctx: CanvasRenderingContext2D, src: CanvasImageSource & { width: number; height: number }, crop: Crop, d: number) {
  const [cx, cy, cd] = crop;
  const s = d / (cd * src.height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(d / 2, d / 2, d / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(src, d / 2 - cx * src.width * s, d / 2 - cy * src.height * s, src.width * s, src.height * s);
  ctx.restore();
}
