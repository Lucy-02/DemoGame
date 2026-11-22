// 위 띠: 정원 / 정령. 정본 .tb. 판 안에서 열면 돌아갈 곳이 지도예요 (0157)
import type * as Phaser from "phaser";
import { box } from "../../style/draw";
import { render } from "../../style/flex";
import { COPY } from "../copy";
import { FRAME, TOP } from "../layout";
import { P, T, text } from "./parts";

export const TOP_ICONS = [["g-back", TOP.backIcon]] as const;

export function drawTopbar(scene: Phaser.Scene, onBack?: () => void, back: string = COPY.garden) {
  render(scene, {
    t: "row", w: FRAME.w, h: TOP.h, pad: [0, TOP.padX, 0, TOP.padX], gap: TOP.gap, align: "center", style: { fill: P.glass },
    children: [
      {
        t: "row", gap: TOP.backGap, align: "center", onClick: onBack,
        children: [{ t: "icon", id: "g-back", w: TOP.backIcon, h: TOP.backIcon, tint: P.ink2 }, text(back, T.back, P.ink2)],
      },
      text(COPY.sep, T.back, P.ink3Spirit),
      text(COPY.here, T.here, P.ink),
    ],
  }, 0, 0);
  box(scene.add.graphics(), 0, TOP.h - TOP.line, FRAME.w, TOP.line, 0, { fill: P.glassLine });
}
