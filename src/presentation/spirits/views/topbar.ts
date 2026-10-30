// 위 띠: 정원 / 정령, 오른쪽에 정원 재료. 정본 .tb, .q .res
import type * as Phaser from "phaser";
import { box } from "../../style/draw";
import { render } from "../../style/flex";
import { COPY } from "../copy";
import { FRAME, TOP } from "../layout";
import { P, T, text } from "./parts";

export const TOP_ICONS = [["g-back", TOP.backIcon], ["g-seed", TOP.resIcon]] as const;

export function drawTopbar(scene: Phaser.Scene, material: number, onBack?: () => void) {
  render(scene, {
    t: "row", w: FRAME.w, h: TOP.h, pad: [0, TOP.padX, 0, TOP.padX], gap: TOP.gap, align: "center", style: { fill: P.glass },
    children: [
      {
        t: "row", gap: TOP.backGap, align: "center", onClick: onBack,
        children: [{ t: "icon", id: "g-back", w: TOP.backIcon, h: TOP.backIcon, tint: P.ink2 }, text(COPY.garden, T.back, P.ink2)],
      },
      text(COPY.sep, T.back, P.ink3Spirit),
      text(COPY.here, T.here, P.ink),
      {
        t: "row", gap: TOP.resGap, align: "center", ml: "auto",
        children: [{ t: "icon", id: "g-seed", w: TOP.resIcon, h: TOP.resIcon, tint: P.ink2 }, text(String(material), T.res, P.ink)],
      },
    ],
  }, 0, 0);
  box(scene.add.graphics(), 0, TOP.h - TOP.line, FRAME.w, TOP.line, 0, { fill: P.glassLine });
}
