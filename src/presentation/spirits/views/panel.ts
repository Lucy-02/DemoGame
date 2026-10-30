// 오른쪽 패널: 탭 줄(개요 · 성장 길 · 유대) + 닫기, 탭 내용. 정본 .q-panel, .q-tabs, .q-body (탭 구성은 결정 0021 5절)
import type * as Phaser from "phaser";
import { box, circle } from "../../style/draw";
import { render, size, type BoxNode, type Node } from "../../style/flex";
import { COPY } from "../copy";
import { BIG_BUTTON, FRAME, PANEL } from "../layout";
import type { EpisodeVM, GrowthRowVM, SpiritDetailVM, TabId, TabVM } from "../viewmodel";
import { personalityPill } from "./idCard";
import { P, T, badge, bar, button, glass, rule, text } from "./parts";

export interface PanelActions {
  tab(id: TabId): void;
  close(): void;
  evolve(): void;
  feed(): void;
  reroll(): void;
  seeEpisode(): void;
}

export const PANEL_ICONS = [
  ["g-close", PANEL.close.icon], ["g-up", PANEL.tabs.badgeIcon], ["g-cardnew", PANEL.tabs.badgeIcon], ["g-book", PANEL.tabs.badgeIcon],
  ["g-lock", PANEL.episode.num / 2],
] as const;

const X = FRAME.w - PANEL.right - PANEL.w;
const B = PANEL.body;
const BODY = { x: X + B.pad[3], y: PANEL.y + PANEL.tabs.h + B.pad[0], w: PANEL.w - B.pad[1] - B.pad[3] };
const BODY_BOTTOM = PANEL.y + PANEL.h - B.pad[2];

/** 탭 이름 + 숫자 + 배지 (.q-tab, .q-tc, .q-badge.inl) */
function tabNode(t: TabVM, on: boolean, onClick: () => void): Node {
  const tb = PANEL.tabs;
  return {
    t: "row", h: tb.h, pad: [0, tb.tabPadX, 0, tb.tabPadX], align: "center", onClick,
    children: [
      text(t.label, T.tab, on ? P.ink : P.ink2),
      ...(t.count ? [text(t.count, T.tabCount, on ? P.ink2 : P.ink3Spirit, { ml: tb.countMl })] : []),
      ...(t.badge ? [badge(t.badge, tb.badge, tb.badgeIcon, false, { ml: tb.badgeMl })] : []),
    ],
  };
}

function drawTabs(scene: Phaser.Scene, d: SpiritDetailVM, current: TabId, act: PanelActions) {
  const tb = PANEL.tabs;
  const nodes = d.tabs.map((t) => tabNode(t, t.id === current, () => act.tab(t.id)));
  const close: Node = {
    t: "row", h: tb.h, pad: PANEL.close.pad, gap: PANEL.close.gap, align: "center", ml: "auto", onClick: act.close,
    children: [{ t: "icon", id: "g-close", w: PANEL.close.icon, h: PANEL.close.icon, tint: P.ink2 }, text(COPY.close, T.close, P.ink2)],
  };
  render(scene, { t: "row", w: PANEL.w, h: tb.h, pad: [0, tb.padX, 0, tb.padX], children: [...nodes, close] }, X, PANEL.y);
  const g = scene.add.graphics();
  box(g, X, PANEL.y + tb.h - 1, PANEL.w, 1, 0, { fill: P.glassLine });
  // 고른 탭 밑줄 (border-bottom 2, margin-bottom -1)
  let x = X + tb.padX;
  for (let i = 0; i < nodes.length; i++) {
    const w = size(nodes[i]).w;
    if (d.tabs[i].id === current) box(g, x, PANEL.y + tb.h - tb.underline, w, tb.underline, 0, { fill: P.accHi });
    x += w;
  }
}

/** 섹션 머리 (.q-sec h4): 이름 + 오른쪽 숫자·덧붙임 */
function head(label: string, right?: Node): Node {
  return { t: "row", gap: B.headGap, align: "baseline", children: [text(label, T.secHead, P.ink2), ...(right ? [{ ...right, ml: "auto" } as Node] : [])] };
}

const numPair = (have: number, need: number): Node => ({
  t: "row", align: "baseline", children: [text(String(have), T.secNum, P.ink), text(`/${need}`, T.secHead, P.ink2)],
});

// ───────────────────────── 개요 ─────────────────────────

function overview(d: SpiritDetailVM, act: PanelActions): Node[] {
  const G = PANEL.statGrid;
  const legend: Node = {
    t: "row", gap: G.legend.gap, align: "center",
    children: [
      { t: "block", w: G.legend.w, h: G.legend.h, draw: (g, x, y, w, h) => box(g, x, y, w, h, h / 2, { fill: P.ink2 }) },
      text(COPY.legendBase, T.legend, P.ink2),
      { t: "block", w: G.legend.w, h: G.legend.h, ml: G.legend.ml, draw: (g, x, y, w, h) => box(g, x, y, w, h, h / 2, { fill: P.ok }) },
      text(COPY.legendStage, T.legend, P.ink2),
    ],
  };
  const rows: Node[] = d.overview.rows.map((r) => ({
    t: "row", gap: G.colGap, align: "center",
    children: [
      { t: "row", w: G.labelW, children: [text(r.label, T.sbLabel, P.ink2)] },
      {
        t: "block", w: 0, h: G.bar, grow: true,
        draw: (g, x, y, w, h) => {
          const k = w / PANEL.statMax;
          const base = Math.min(w, (r.total - r.stage) * k);
          box(g, x, y, w, h, h / 2, { fill: P.veil["12"] });
          box(g, x, y, base, h, h / 2, { fill: P.ink2 });
          if (r.stage > 0) box(g, x + base, y, Math.min(w - base, r.stage * k), h, h / 2, { fill: P.ok });
        },
      },
      { t: "row", w: G.valueW, children: r.stage > 0 ? [text(`+${r.stage}`, T.sbValue, P.ok, { ml: "auto" })] : [] },
    ],
  }));
  const per = d.overview.personality;
  const reroll = d.overview.reroll;
  return [
    { t: "col", gap: B.secGap, children: [head(COPY.stats, legend), { t: "col", gap: G.rowGap, children: rows }] },
    {
      t: "col", gap: B.secGap,
      children: [
        head(COPY.personality),
        {
          t: "row", gap: B.headGap, align: "center",
          children: [
            personalityPill(per?.name),
            ...(reroll.shown ? [{
              ...button(`${COPY.reroll} · ${COPY.cost(reroll.cost)}`, {
                size: T.tool, h: PANEL.small.h, radius: PANEL.small.radius, padX: PANEL.small.padX, enabled: reroll.can, onClick: act.reroll,
              }), ml: "auto",
            } as Node] : []),
          ],
        },
        text(per?.desc ?? COPY.hiddenNote, T.tags, P.ink2, { wrap: BODY.w }),
      ],
    },
  ];
}

// ───────────────────────── 성장 길 ─────────────────────────

function growthRow(r: GrowthRowVM): Node {
  const Gr = PANEL.growth;
  const width = BODY.w - Gr.pad[1] - Gr.pad[3] - Gr.dot - Gr.colW - Gr.colGap * 2;
  const lines: Node[] = r.chips.map((c) => ({
    t: "col", gap: Gr.listGap,
    children: [
      {
        t: "row", gap: B.headGap, align: "baseline",
        children: [
          text(c.at, T.small, P.ink3Spirit),
          text(c.name, T.chipName, c.open ? P.ink : P.ink2),
          ...(c.fresh ? [text(COPY.fresh, T.small, P.accHi)] : []),
        ],
      },
      text(c.detail, T.small, c.open ? P.ink2 : P.ink3Spirit, { wrap: width }),
    ],
  }));
  const notes = r.notes.map((n) => text(n, T.small, r.state === "next" ? P.ink3Spirit : P.ink2));
  return {
    t: "row", pad: Gr.pad, gap: Gr.colGap, radius: Gr.radius, align: "start",
    style: r.state === "now" ? { fill: P.veil["06"] } : undefined,
    children: [
      {
        t: "block", w: Gr.dot, h: Gr.dot, mt: Gr.dotMt,
        draw: (g, x, y, w) => {
          const c = { x: x + w / 2, y: y + w / 2 };
          if (r.state === "now") {
            circle(g, c.x, c.y, w + Gr.nowRing * 2, { fill: P.veil["12"] });
            circle(g, c.x, c.y, w, { fill: P.ink });
          } else if (r.state === "done") circle(g, c.x, c.y, w, { fill: P.ink3Spirit });
          else circle(g, c.x, c.y, w, { fill: P.floor, ring: { width: 2, color: P.ink3Spirit } });
        },
      },
      {
        t: "col", w: Gr.colW, gap: Gr.headGap,
        children: [
          text(r.stage, T.stageHead, r.state === "next" ? P.ink2 : P.ink, { lh: Gr.headLh }),
          ...(r.state === "now" ? [text(COPY.now, T.small, P.ink2)] : []),
        ],
      },
      { t: "col", grow: true, gap: B.secGap, children: [...lines, ...notes] },
    ],
  };
}

function growth(d: SpiritDetailVM): Node[] {
  const gr = d.growth;
  const exp: Node = gr.exp
    ? { t: "col", gap: B.secGap, children: [head(`${COPY.exp} ${COPY.level}${gr.level}`, numPair(gr.exp.have, gr.exp.need)), bar(PANEL.growth.exp, gr.exp.have / gr.exp.need, P.veil["16"], P.ink2)] }
    : head(`${COPY.exp} ${COPY.level}${gr.level}`, text(COPY.maxLevel, T.secHead, P.ink2));
  return [exp, { t: "col", gap: PANEL.growth.gap, children: gr.rows.map(growthRow) }];
}

/** 성장 길 아래: 다음 단계 문 (조건 진척 + 키우기) */
function gateFoot(d: SpiritDetailVM, act: PanelActions): Node | undefined {
  const gate = d.growth.gate;
  if (!gate) return undefined;
  const cond = [
    `${COPY.levelNeed(gate.level.need)}${gate.level.ok ? " ✓" : ""}`,
    ...(gate.deed ? [`${gate.deed.label} ${gate.deed.have}/${gate.deed.need}${gate.deed.ok ? " ✓" : ""}`] : []),
  ].join(` ${COPY.sep} `);
  return {
    t: "row", gap: PANEL.foot.gap, align: "center",
    children: [
      { t: "col", grow: true, gap: PANEL.growth.listGap, children: [text(COPY.gate(gate.to), T.ep, P.ink), text(cond, T.small, P.ink2)] },
      button(COPY.grow, { size: T.factButton, h: BIG_BUTTON.h, radius: BIG_BUTTON.radius, padX: BIG_BUTTON.padX, go: true, enabled: gate.ready, onClick: act.evolve }),
    ],
  };
}

// ───────────────────────── 유대 ─────────────────────────

function episodeRow(e: EpisodeVM, act: PanelActions): Node {
  const E = PANEL.episode;
  const locked = e.state === "locked";
  const right: Node = e.state === "seen" ? text(COPY.seen, T.epSide, P.ink3Spirit)
    : e.state === "open" ? button(COPY.watch, { size: T.tool, h: PANEL.small.h, radius: PANEL.small.radius, padX: PANEL.small.padX, go: true, onClick: act.seeEpisode })
    : {
      t: "row", gap: B.headGap, align: "center",
      children: [{ t: "icon", id: "g-lock", w: E.num / 2, h: E.num / 2, tint: P.ink3Spirit }, text(e.need ?? "", T.epSide, P.ink3Spirit)],
    };
  return {
    t: "col",
    children: [
      rule(),
      {
        t: "row", h: E.h, gap: E.gap, align: "center",
        children: [
          {
            t: "row", round: true, w: E.num, h: E.num, justify: "center", align: "center", style: { fill: P.veil["08"] },
            children: [text(String(e.n), T.epNum, locked ? P.ink3Spirit : P.ink)],
          },
          text(COPY.episode(e.n), T.ep, locked ? P.ink3Spirit : P.ink),
          { ...right, ml: "auto" } as Node,
        ],
      },
    ],
  };
}

function bond(d: SpiritDetailVM, act: PanelActions): Node[] {
  const b = d.bond;
  const feed = button(`${COPY.feed} · ${COPY.cost(b.feed.cost)}`, {
    size: T.tool, h: PANEL.small.h, radius: PANEL.small.radius, padX: PANEL.small.padX, enabled: b.feed.can, onClick: act.feed,
  });
  return [
    {
      t: "col", gap: B.secGap,
      children: [
        head(COPY.affinity, b.next ? numPair(b.affinity, b.next) : text(String(b.affinity), T.secNum, P.ink)),
        bar(PANEL.growth.exp, b.next ? b.affinity / b.next : 1, P.veil["16"], P.ink2),
        { t: "row", gap: B.headGap, align: "center", children: [feed, text(`+${b.feed.gain}`, T.sbValue, P.ok)] },
      ],
    },
    { t: "col", children: [...b.episodes.map((e) => episodeRow(e, act)), rule()] },
  ];
}

// ───────────────────────── 패널 ─────────────────────────

export function drawPanel(scene: Phaser.Scene, d: SpiritDetailVM, tab: TabId, act: PanelActions) {
  box(scene.add.graphics(), X, PANEL.y, PANEL.w, PANEL.h, PANEL.radius, glass(true));
  drawTabs(scene, d, tab, act);
  const body = tab === "overview" ? overview(d, act) : tab === "growth" ? growth(d) : bond(d, act);
  if (tab === "growth") drawSpine(scene, body);
  render(scene, { t: "col", w: BODY.w, gap: B.gap, children: body }, BODY.x, BODY.y);
  // 아래에 붙는 줄 (.q-awk margin-top auto, 위 1px 선)
  const foot = tab === "overview" ? awakenFoot(d) : tab === "growth" ? gateFoot(d, act) : undefined;
  if (foot) {
    const node: BoxNode = { t: "col", w: BODY.w, children: [rule(PANEL.foot.line), { ...foot, mt: PANEL.foot.pt } as Node] };
    render(scene, node, BODY.x, BODY_BOTTOM - size(node).h);
  }
}

/** 성장 길 점들을 잇는 세로선 (.cs-gw::before left 7 w 2): 첫 점 가운데부터 마지막 점 가운데까지 */
function drawSpine(scene: Phaser.Scene, body: Node[]) {
  const Gr = PANEL.growth;
  const [exp, path] = body;
  const rows = (path as BoxNode).children;
  const top = BODY.y + size(exp).h + B.gap;
  const dotY = Gr.pad[0] + Gr.dotMt + Gr.dot / 2;
  const last = rows.slice(0, -1).reduce((a, r) => a + size(r).h + Gr.gap, 0);
  box(scene.add.graphics(), BODY.x + Gr.spine.x, top + dotY, Gr.spine.w, last, 0, { fill: P.veil["16"] });
}

function awakenFoot(d: SpiritDetailVM): Node {
  return {
    t: "col", gap: B.secGap,
    children: [head(COPY.awaken), text(d.overview.awaken.desc, T.tags, P.ink, { wrap: BODY.w })],
  };
}
