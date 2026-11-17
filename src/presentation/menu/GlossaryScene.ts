// 용어 모음 창 (0102): 지금 화면 위에 창으로 떠요. 메인 화면과 판 안 메뉴에서 같은 창을 열어요.
// 칸은 기호 + 이름뿐이고, 풀이는 칸에 올리면 창 오른쪽 말풍선으로 떠요 (0050). 풀이 문구는 용어 사전(glossary/terms)을 그대로 써요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { COPY as BATTLE } from "../battle/copy";
import { weakTexture } from "../battle/views/units";
import { GROUPS, TERMS, termBody, type Term } from "../glossary/terms";
import { drawWindow } from "../result/views/window";
import { rgba } from "../style/color";
import { box, circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { loadIcon } from "../style/icons";
import { P, rule, text } from "../spirits/views/parts";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { COPY } from "./copy";
import { FRAME, GLOSSARY as G } from "./layout";

const T = tokens.provisional.text.result;
const TI = tokens.provisional.text.home;

export const GLOSSARY_SCENE = "glossary";

const HEAD_ICON = "g-book";
const RULE_H = 1;

export interface GlossarySceneData {
  onClose?: () => void;
  /** 시각 검증용: 이 용어에 올린 상태 */
  hover?: string;
}

export class GlossaryScene extends Phaser.Scene {
  private onClose?: () => void;
  private hover?: string;
  private dirty = false;

  constructor() {
    super(GLOSSARY_SCENE);
  }

  init(data: GlossarySceneData) {
    this.onClose = data.onClose;
    this.hover = TERMS.some((t) => t.id === data.hover) ? data.hover : undefined;
  }

  preload() {
    loadIcon(this, HEAD_ICON, G.head.icon);
    loadIcon(this, "g-close", G.close.icon);
    for (const t of TERMS) if (t.icon) loadIcon(this, t.icon, G.cell.icon);
  }

  create() {
    this.input.setPollAlways();
    this.paint();
    this.input.keyboard?.on("keydown-ESC", () => this.onClose?.());
    Object.assign(window, { __screenReady: GLOSSARY_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private setHover(id?: string) {
    if (this.hover === id) return;
    this.hover = id;
    this.dirty = true;
  }

  /** 기호가 없는 용어: 전투에서 쓰는 표지를 그대로, 그것도 없으면 점선 칸 (TODO_ICON) */
  private mark(t: Term): Node {
    const d = G.cell.icon;
    if (t.mark === "release") return text(BATTLE.order.release, TI.item, P.accHi, { w: d });
    return {
      t: "block", w: d, h: d,
      draw: (g, x, y, w, h) => {
        if (t.mark === "weak") this.add.image(x + w / 2, y + h / 2, weakTexture(this, false).key).setDisplaySize(w, h);
        else if (t.mark === "opening") circle(g, x + w / 2, y + h / 2, w - G.ring, { ring: { width: G.ring, color: P.warn } });
        else if (t.mark === "downed") {
          // 점선 테: 호 여섯 조각 (허점의 이은 테와 모양으로도 갈려요)
          const c = rgba(P.danger), n = G.downArcs, step = (Math.PI * 2) / n;
          g.lineStyle(G.ring, c.color, c.alpha);
          for (let i = 0; i < n; i++) g.beginPath().arc(x + w / 2, y + h / 2, (w - G.ring) / 2, i * step, (i + 0.5) * step).strokePath();
        }
        else box(g, x, y, w, h, G.todo.radius, { ring: { width: G.todo.ring, color: P.ink2, dash: G.todo.dash } });
      },
    };
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const inner = G.w - 2 * G.pad;
    const cw = inner / G.cols;
    const cell = (t: Term): Node => {
      const C = G.cell;
      return {
        t: "row", w: cw, h: C.h, radius: C.radius, pad: [0, C.padX, 0, C.padX], gap: C.gap, align: "center",
        style: this.hover === t.id ? { fill: P.veil["09"], ring: { width: 1, color: P.veil["50"] } } : undefined,
        children: [
          t.icon ? { t: "icon", id: t.icon, w: C.icon, h: C.icon, tint: P.ink } : this.mark(t),
          text(t.name, TI.item, P.ink),
        ],
      };
    };
    const group = (terms: Term[]): Node => ({
      t: "col",
      children: Array.from({ length: Math.ceil(terms.length / G.cols) }, (_, r): Node => ({ t: "row", children: terms.slice(r * G.cols, (r + 1) * G.cols).map(cell) })),
    });
    const head: Node = {
      t: "row", w: inner, h: G.head.h, align: "center", gap: G.head.gap,
      children: [
        { t: "icon", id: HEAD_ICON, w: G.head.icon, h: G.head.icon, tint: P.ink3Spirit },
        text(COPY.glossary, T.name, P.ink),
        {
          t: "row", align: "center", gap: G.close.gap, h: G.head.h, ml: "auto", onClick: () => this.onClose?.(),
          children: [{ t: "icon", id: "g-close", w: G.close.icon, h: G.close.icon, tint: P.ink3Spirit }, text(COPY.close, T.button, P.ink2)],
        },
      ],
    };
    const lists = GROUPS.map((id) => TERMS.filter((t) => t.group === id));
    const groups = lists.map(group);
    const body: Node = {
      t: "col", gap: G.head.below,
      children: [head, { t: "col", gap: G.rule.gap, children: groups.flatMap((g, i) => (i ? [{ ...rule(RULE_H), w: inner }, g] : [g])) }],
    };
    const h = size(body).h + 2 * G.pad;
    const win = { x: Math.round((FRAME.w - G.w) / 2), y: Math.round((FRAME.h - h) / 2), w: G.w, h };

    // 창 밖을 누르면 닫혀요
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => this.onClose?.());
    drawWindow(this, win);
    this.add.zone(win.x, win.y, win.w, win.h).setOrigin(0, 0).setInteractive();
    render(this, body, win.x + G.pad, win.y + G.pad);

    // 칸 자리: 묶음마다 줄 수 × 칸 높이, 묶음 사이는 간격 + 선 + 간격
    const cells = new Map<string, { x: number; y: number }>();
    let top = win.y + G.pad + G.head.h + G.head.below;
    for (const list of lists) {
      list.forEach((t, i) => cells.set(t.id, { x: win.x + G.pad + (i % G.cols) * cw, y: top + Math.floor(i / G.cols) * G.cell.h }));
      top += Math.ceil(list.length / G.cols) * G.cell.h + 2 * G.rule.gap + RULE_H;
    }
    for (const [id, at] of cells) {
      this.add.zone(at.x, at.y, cw, G.cell.h).setOrigin(0, 0).setInteractive()
        .on("pointerover", () => this.setHover(id))
        .on("pointerout", () => { if (this.hover === id) this.setHover(undefined); });
    }
    const term = TERMS.find((t) => t.id === this.hover);
    const at = term && cells.get(term.id);
    if (term && at) {
      drawTooltip(this, {
        skin: GLASS,
        content: [{ kind: "title", text: term.name }, { kind: "text", role: "body", text: [{ text: termBody(term) }] }],
        at: { left: win.x + win.w + G.tip.dx, top: at.y + G.tip.dy },
      });
    }
  }
}
