// 이름 카드: 단계 칩, 이름, 속성·역할, 성격, 능력치 한 줄. 정본 .q-id (장부 §3-2 G)
import type * as Phaser from "phaser";
import { render, type Node } from "../../style/flex";
import { COPY } from "../copy";
import { ID } from "../layout";
import type { SpiritDetailVM } from "../viewmodel";
import { P, T, glass, rule, text } from "./parts";

export const ID_ICONS = [
  ["g-fin", ID.stage.icon], ["e-fire", ID.tags.icon], ["e-water", ID.tags.icon], ["e-wind", ID.tags.icon], ["e-none", ID.tags.icon],
  ["i-sword", ID.tags.icon], ["i-shield", ID.tags.icon], ["i-sprout", ID.tags.icon],
] as const;

const UP_MARK = "▲";

/** 이름 카드 단계 칩 (.q-sc.lg). 최종 단계면 별 기호 */
export function stageChip(d: Pick<SpiritDetailVM, "stage" | "level" | "final">): Node {
  const S = ID.stage;
  return {
    t: "row", h: S.h, pad: [0, S.padX, 0, S.padX], radius: S.radius, gap: S.gap, align: "center", style: { fill: P.veil["10"] },
    children: [
      ...(d.final ? [{ t: "icon", id: "g-fin", w: S.icon, h: S.icon, tint: P.ink } as Node] : []),
      text(d.level === undefined ? d.stage : `${d.stage} ${COPY.lv(d.level)}`, T.stage, P.ink),
    ],
  };
}

/** 성격 알약 (.q .per). 유체는 점선 ??? (.per.q) */
export function personalityPill(name?: string): Node {
  return {
    t: "row", pad: ID.per.pad, radius: ID.per.radius, align: "center",
    style: name ? { fill: P.veil["10"] } : { ring: { width: 1, color: P.ink3Spirit, dash: 3 } },
    children: [text(name ?? COPY.hidden, T.per, name ? P.ink : P.ink2)],
  };
}

export function drawIdCard(scene: Phaser.Scene, d: SpiritDetailVM) {
  const S = ID.stats;
  render(scene, {
    t: "col", w: ID.w, pad: ID.pad, gap: ID.gap, radius: ID.radius, style: glass(),
    children: [
      { t: "row", children: [stageChip(d)] },
      text(d.name, T.name, P.ink, { lh: ID.nameLh }),
      {
        t: "row", gap: ID.tags.gap, align: "center",
        children: d.tags.map((tag): Node => ({
          t: "row", gap: ID.tags.iconGap, align: "center",
          children: [
            ...(tag.icon ? [{ t: "icon", id: tag.icon, w: ID.tags.icon, h: ID.tags.icon, tint: P.ink2 } as Node] : []),
            text(tag.text, T.tags, P.ink2),
          ],
        })),
      },
      {
        t: "row", gap: ID.per.gap, align: "center",
        children: [text(COPY.personality, T.tags, P.ink2), personalityPill(d.personality)],
      },
      {
        t: "col", mt: S.mt,
        children: [
          rule(S.line),
          {
            t: "row", justify: "between", mt: S.pt,
            children: d.stats.map((st): Node => ({
              t: "col", gap: S.gap,
              children: [
                text(st.label, T.statLabel, P.ink2),
                {
                  t: "row", align: "start",
                  children: [
                    text(st.value === undefined ? COPY.unknown : String(st.value), T.stat, st.value === undefined ? P.ink3Spirit : P.ink, { lh: S.valueLh }),
                    ...(st.up ? [text(UP_MARK, T.statLabel, P.ok, { lh: 1 })] : []),
                  ],
                },
              ],
            })),
          },
        ],
      },
    ],
  }, ID.x, ID.y);
}
