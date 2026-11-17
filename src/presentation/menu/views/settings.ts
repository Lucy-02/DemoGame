// 설정 줄들: 이름 왼쪽, 조작 오른쪽. 상태는 모양으로 보여요(막대 길이 · 알약 손잡이 자리 · 밝은 칸, 0019). 글자는 이름과 숫자뿐이에요 (0050).
import type * as Phaser from "phaser";
import { tokens } from "../../../design/tokens";
import type { Settings, Speed, VolumeId } from "../../../session/settings";
import { box, circle } from "../../style/draw";
import type { BoxNode, Node } from "../../style/flex";
import { P, button, rule, text } from "../../spirits/views/parts";
import { COPY } from "../copy";
import { SETTINGS as S } from "../layout";

const T = tokens.provisional.text.home;
const TB = tokens.provisional.text.result;

export type TipId = "speed" | "shake";

/** 그리면서 잰 자리 (장면이 끌기 · 말풍선 영역을 올려요) */
export interface SettingsMarks {
  /** 볼륨 막대 길 */
  sliders: Map<VolumeId, { x: number; y: number; w: number; h: number }>;
  /** 말풍선이 있는 줄의 왼쪽 위 */
  tips: Map<TipId, { x: number; y: number }>;
}

export interface SettingsActions {
  toggleFullscreen: () => void;
  toggleShake: () => void;
  speed: (s: Speed) => void;
}

function slider(id: VolumeId, v: number, marks: SettingsMarks): Node {
  const L = S.slider;
  return {
    t: "row", align: "center", gap: L.gap, ml: "auto",
    children: [
      {
        t: "block", w: L.w, h: L.knob,
        draw: (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) => {
          marks.sliders.set(id, { x, y, w, h });
          const ty = y + (h - L.track) / 2;
          const kx = x + L.knob / 2 + (w - L.knob) * v;
          box(g, x, ty, w, L.track, L.track / 2, { fill: P.veil["12"] });
          if (v > 0) box(g, x, ty, kx - x, L.track, L.track / 2, { fill: P.ink2 });
          circle(g, kx, y + h / 2, L.knob, { fill: P.ink });
        },
      },
      text(COPY.percent(v), T.item, P.ink, { w: L.num }),
    ],
  };
}

/** 켜짐 = 밝은 알약 + 오른쪽 손잡이, 꺼짐 = 테만 + 왼쪽 손잡이 */
function toggle(on: boolean, onClick: () => void): Node {
  const G = S.toggle;
  return {
    t: "block", w: G.w, h: G.h, ml: "auto", onClick,
    draw: (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) => {
      box(g, x, y, w, h, h / 2, on ? { fill: P.ink } : { fill: P.veil["05"], ring: { width: 1, color: P.glassLine } });
      const inset = (h - G.knob) / 2;
      circle(g, on ? x + w - inset - G.knob / 2 : x + inset + G.knob / 2, y + h / 2, G.knob, { fill: on ? P.floor : P.ink3Spirit });
    },
  };
}

function segment(value: Speed, pick: (s: Speed) => void): Node {
  const G = S.seg;
  return {
    t: "row", gap: G.gap, ml: "auto",
    children: (["normal", "fast"] as const).map((k) => button(COPY.speeds[k], { size: TB.button, h: G.h, w: G.w, radius: G.radius, plate: value === k, onClick: () => pick(k) })),
  };
}

const row = (w: number, label: string, control: Node, mark?: (x: number, y: number) => void): BoxNode => ({
  t: "row", w, h: S.row.h, align: "center",
  children: [
    ...(mark ? [{ t: "block", w: 0, h: S.row.h, draw: (_g: Phaser.GameObjects.Graphics, x: number, y: number) => mark(x, y) } as Node] : []),
    text(label, T.item, P.ink),
    control,
  ],
});

const gap = (): Node => ({ t: "col", pad: [S.rule.gap, 0, S.rule.gap, 0], children: [rule()] });

/** 설정 줄 묶음 (폭 w). 소리 → 화면 → 재생 순서 */
export function settingsRows(s: Settings, w: number, on: SettingsActions, marks: SettingsMarks): BoxNode {
  return {
    t: "col", w, align: "stretch",
    children: [
      ...(["master", "music", "sfx"] as const).map((id) => row(w, COPY.volume[id], slider(id, s.volume[id], marks))),
      gap(),
      row(w, COPY.fullscreen, toggle(s.fullscreen, on.toggleFullscreen)),
      row(w, COPY.shake, toggle(s.shake, on.toggleShake), (x, y) => marks.tips.set("shake", { x, y })),
      gap(),
      row(w, COPY.speed, segment(s.speed, on.speed), (x, y) => marks.tips.set("speed", { x, y })),
    ],
  };
}

/** 볼륨 막대 위의 x → 0~1 (5 단위) */
export function sliderValue(r: { x: number; w: number }, px: number): number {
  const L = S.slider;
  const v = (px - r.x - L.knob / 2) / (r.w - L.knob);
  return Math.min(1, Math.max(0, Math.round(v / L.step) * L.step));
}
