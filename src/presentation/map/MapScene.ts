// 지도 화면 (Lucy 2026-11-17, 0076 18번 대체): 왼쪽에 한 막 전체 지도(출발 ~ 보스), 오른쪽 열 맨 위에 슬림 파티 줄. 미니맵은 없어요.
// 칸 종류는 기호로만 보여요(0050). 이름은 칸에 올렸을 때 말풍선에 나와요. 갈 수 있는 칸을 누르면 그 칸으로 들어가요.
// 파티 줄을 누르면 그 줄만 같은 자리에서 정령 줄로 펼쳐져요(0046). 덱 보기는 오른쪽 위 덱 버튼으로 열어요(0076 15번).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { Run } from "../../core/run";
import { SYS_ICONS, drawSys } from "../battle/views/topbar";
import { SYS } from "../battle/layout";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { HAND_CARD } from "../card/layout";
import { drawBackdrop } from "../run/backdrop";
import { cardWithFace, drawCardTip } from "../run/cards";
import { EQUIP_STAT_ICON } from "../run/equipTip";
import type { LaneVM } from "../run/viewmodel";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane } from "../run/lanes";
import { LANE } from "../run/layout";
import { drawSlimLane } from "../run/slimLane";
import { preloadSpiritArt } from "../spiritArt";
import { personalityPill } from "../spirits/views/idCard";
import { rgba, withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { render, size, type Node } from "../style/flex";
import { gather } from "../style/gather";
import { icon, loadIcon } from "../style/icons";
import { GLASS } from "../tooltip/skins";
import { clampLeft, drawTooltip } from "../tooltip/Tooltip";
import { COPY, KIND_ICON } from "./copy";
import { SFX_DATA, type SfxId } from "../audio";
import { DEFAULT_MAP, mapRun } from "./fixtures";
import { mapVM, sheetVM } from "./fromRun";
import { FRAME, GOLD_AT, PATH, SHEET, SLIM } from "./layout";
import type { MapNodeVM, MapVM, SheetVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.result;
const CHARGE_ICON = "kw-charge";

export const MAP_SCENE = "map";

export interface MapSceneData {
  /** 이번 판. 없으면 고정 장면 (scene) */
  run?: Run;
  scene?: string;
  /** 갈 수 있는 칸을 눌렀어요 */
  onEnter?: (nodeId: string) => void;
  /** 덱 보기 열기 */
  onDeck?: (scene: Phaser.Scene) => void;
  /** 시각 검증용: 처음부터 펼쳐 둘 정령 줄 */
  select?: string;
}

interface Pt { x: number; y: number }

function line(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt, width: number, color: string, dash = 0) {
  const c = rgba(color);
  g.lineStyle(width, c.color, c.alpha);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (!dash) {
    g.lineBetween(a.x, a.y, b.x, b.y);
    return;
  }
  const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
  for (let t = 0; t < len; t += dash * 2) {
    const e = Math.min(len, t + dash);
    g.lineBetween(a.x + ux * t, a.y + uy * t, a.x + ux * e, a.y + uy * e);
  }
}

export class MapScene extends Phaser.Scene {
  private run!: Run;
  private vm!: MapVM;
  private onEnter?: (nodeId: string) => void;
  private onDeck?: (scene: Phaser.Scene) => void;
  /** 펼친 정령 줄 */
  private open?: string;
  private hover: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(MAP_SCENE);
  }

  init(data: MapSceneData) {
    this.run = data.run ?? mapRun(data.scene ?? DEFAULT_MAP);
    this.vm = mapVM(this.run);
    this.onEnter = data.onEnter;
    this.onDeck = data.onDeck;
    this.open = data.select;
    this.hover = null;
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ...GOLD_ICONS]) loadIcon(this, id, w);
    for (const id of SYS_ICONS) loadIcon(this, id, SYS.icon);
    for (const id of Object.values(KIND_ICON)) loadIcon(this, id, PATH.node.icon);
    loadIcon(this, CHARGE_ICON, PATH.badge.icon);
    for (const id of Object.values(EQUIP_STAT_ICON)) loadIcon(this, id, SHEET.stat.icon);
    loadIcon(this, "g-close", SLIM.close.icon);
    for (const l of this.vm.party) for (const c of sheetVM(this.run, l.id)?.cards ?? []) preloadHandCard(this, c, { showRarity: true });
    preloadSpiritArt(this, this.vm.party.map((l) => l.id));
  }

  create() {
    this.paint();
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.paint());
    Object.assign(window, { __screenReady: MAP_SCENE });
  }

  private paint() {
    this.children.removeAll(true);
    this.hover = null;
    this.vm = mapVM(this.run);
    drawBackdrop(this);
    drawGold(this, this.vm.gold, {}, GOLD_AT);
    drawSys(this, { "i-deck": this.onDeck && (() => this.onDeck?.(this)) });
    this.drawPath();
    this.drawParty();
  }

  private at(n: MapNodeVM): Pt {
    return { x: PATH.cx + (n.col - (this.vm.cols - 1) / 2) * PATH.colStep, y: PATH.bottom - n.floor * PATH.rowStep };
  }

  private drawPath() {
    const { nodes, links } = this.vm;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const L = PATH.link;
    const g = this.add.graphics();
    for (const l of links) {
      const a = byId.get(l.from)!, b = byId.get(l.to)!;
      if (l.walked) line(g, this.at(a), this.at(b), L.walked, withAlpha(P.ink2, L.walkedAlpha));
      else line(g, this.at(a), this.at(b), L.ahead, withAlpha(P.ink2, L.aheadAlpha), L.dash);
    }
    for (const n of nodes) this.drawNode(n);
  }

  private drawNode(n: MapNodeVM) {
    const N = PATH.node;
    const { x, y } = this.at(n);
    const node = gather(this, 0, 0, () => {
      const g = this.add.graphics();
      // 길이 원판 뒤로 비치지 않게 바닥을 먼저 깔아요
      circle(g, x, y, N.d, { fill: P.floor });
      circle(g, x, y, N.d, { fill: n.state === "far" ? P.glass : P.wallHi, ring: { width: N.ring, color: P.glassLine } });
      icon(this, x - N.icon / 2, y - N.icon / 2, KIND_ICON[n.kind], N.icon, N.icon, P.ink);
    });
    if (n.state === "far") node.setAlpha(PATH.dim.far);
    if (n.state === "past") node.setAlpha(PATH.dim.past);
    if (n.state === "here") {
      const d = N.d + (N.here.gap + N.here.width) * 2;
      circle(this.add.graphics(), x, y, d, { ring: { width: N.here.width, color: P.accHi } });
    }
    if (n.peek) {
      // 순서표의 차징 배지와 같은 말: 보라 테 + 보라 차징 기호
      const B = PATH.badge;
      const off = (N.d / 2) * Math.SQRT1_2;
      const bg = this.add.graphics();
      circle(bg, x + off, y + off, B.d + B.outline * 2, { fill: P.floor });
      circle(bg, x + off, y + off, B.d, { fill: P.face, ring: { width: B.ring, color: P.accHi } });
      icon(this, x + off - B.icon / 2, y + off - B.icon / 2, CHARGE_ICON, B.icon, B.icon, P.accHi);
    }
    if (n.kind === "start") return;
    const zone = this.add.zone(x - N.d / 2, y - N.d / 2, N.d, N.d).setOrigin(0, 0);
    const can = n.state === "open" && !!this.onEnter;
    zone.setInteractive({ useHandCursor: can });
    if (can) zone.setData(SFX_DATA, "map.move" satisfies SfxId);
    zone.on("pointerover", () => {
      this.hover?.destroy();
      this.hover = gather(this, 0, 0, () => {
        if (n.state === "open") {
          const d = N.d + (N.hover.gap + N.hover.width) * 2;
          circle(this.add.graphics(), x, y, d, { ring: { width: N.hover.width, color: P.ink } });
        }
        const left = clampLeft(x - GLASS.w / 2, GLASS.w, FRAME.w, SYS.right);
        drawTooltip(this, { skin: GLASS, at: { left, top: y + N.d / 2 + PATH.tipGap }, content: [
            { kind: "title", text: COPY.kind[n.kind as keyof typeof COPY.kind], tag: n.trait },
            ...(n.peek ? [{ kind: "chips" as const, items: [{ text: n.peek.name, tone: "acc" as const }, { text: COPY.turn(n.peek.turn) }] }] : []),
          ],
        });
      });
    });
    zone.on("pointerout", () => {
      this.hover?.destroy();
      this.hover = null;
    });
    if (can) zone.on("pointerup", () => this.onEnter?.(n.id));
  }

  private drawParty() {
    let y = SLIM.y;
    this.vm.party.forEach((l, i) => {
      if (l.id !== this.open) {
        drawSlimLane(this, l, y, SLIM, () => this.toggle(l.id));
        y += SLIM.h + SLIM.gap;
        return;
      }
      // 머리(얼굴 · 이름 · HP) → 출처별 막대 넷 → 받은 카드가 한 상자예요. 같은 능력치를 두 번 보이지 않아요
      const sheet = sheetVM(this.run, l.id);
      const h = LANE.h + (sheet ? this.sheetH(sheet) : 0);
      drawLane(this, l, i, { y, h, noStats: true, noSocket: true, on: { click: () => this.toggle(l.id) } });
      if (sheet) this.drawSheet(l, sheet, y + LANE.h);
      const C = SLIM.close;
      const close: Node = {
        t: "row", align: "center", gap: C.gap, h: C.h, onClick: () => this.toggle(l.id),
        children: [{ t: "icon", id: "g-close", w: C.icon, h: C.icon, tint: P.ink3Spirit }, { t: "text", text: COPY.close, size: T.button, color: P.ink2 }],
      };
      render(this, close, SLIM.x + SLIM.w - C.right - size(close).w, y + C.top);
      y += h + SLIM.gap;
    });
  }

  /** 펼친 줄의 아래쪽: 능력치 출처 막대(기본 · 단계 · 그 밖), 성격, 이번 판에 받은 카드. 풀이는 올렸을 때만 나와요 (0050) */
  private sheetH(sheet: SheetVM): number {
    const S = SHEET, R = S.stat;
    const leftH = sheet.stats.length * R.rowH + (sheet.personality ? S.per.gap + R.rowH : 0);
    return Math.max(leftH, sheet.cards.length ? HAND_CARD.h : 0) + S.pad;
  }

  private drawSheet(l: LaneVM, sheet: SheetVM, y: number) {
    const S = SHEET, R = S.stat;
    const cards = sheet.cards.slice(0, S.cards.max);
    const x = SLIM.x;
    const tip = (zx: number, zy: number, zw: number, zh: number, title: string, text: string) => {
      this.add.zone(zx, zy, zw, zh).setOrigin(0, 0).setInteractive()
        .on("pointerover", () => {
          this.hover?.destroy();
          const left = clampLeft(zx, GLASS.w, FRAME.w, SYS.right);
          this.hover = drawTooltip(this, { skin: GLASS, at: { left, bottom: zy - S.tipGap }, content: [{ kind: "title", text: title }, { kind: "text", role: "body", text: [{ text }] }] });
        })
        .on("pointerout", () => {
          this.hover?.destroy();
          this.hover = null;
        });
    };
    const lx = x + S.padX;
    let ry = y;
    for (const st of sheet.stats) {
      const row: Node = {
        t: "row", h: R.rowH, gap: R.gap, align: "center",
        children: [
          { t: "icon", id: EQUIP_STAT_ICON[st.id], w: R.icon, h: R.icon, tint: st.id === "hp" ? P.ink3 : P.stat[st.id] },
          { t: "text", text: String(st.total), size: T.was, color: P.ink, w: R.valueW },
          {
            t: "block", w: R.bar.w, h: R.bar.h,
            draw: (g, bx, by, bw, bh) => {
              const parts: [number, string][] = [[st.base, withAlpha(P.ink2, R.baseAlpha)], [st.stage, P.ink], [st.rest, P.accHi]];
              const live = parts.filter(([v]) => v > 0);
              const sum = live.reduce((a, [v]) => a + v, 0);
              const room = bw - (live.length - 1) * R.bar.gap;
              let px = bx;
              for (const [v, color] of live) {
                const w = (room * v) / sum;
                box(g, px, by, w, bh, bh / 2, { fill: color });
                px += w + R.bar.gap;
              }
            },
          },
        ],
      };
      render(this, row, lx, ry);
      tip(lx, ry, size(row).w, R.rowH, st.name, st.detail);
      ry += R.rowH;
    }
    if (sheet.personality) {
      ry += S.per.gap;
      const pill = personalityPill(sheet.personality.name);
      render(this, pill, lx, ry + (R.rowH - size(pill).h) / 2);
      tip(lx, ry, size(pill).w, R.rowH, sheet.personality.name, sheet.personality.desc);
    }
    // 이번 판에 받은 카드: 오른쪽 끝부터, 넘치면 +n
    const more = sheet.cards.length - cards.length;
    let cx = x + SLIM.w - S.padX - cards.length * HAND_CARD.w - (cards.length - 1) * S.cards.gap;
    const cy = y;
    if (more > 0) {
      const n: Node = { t: "text", text: COPY.more(more), size: T.was, color: P.ink2 };
      render(this, n, cx - S.cards.gap - size(n).w, cy + (HAND_CARD.h - size(n).h) / 2);
    }
    for (const c of cards) {
      const card = cardWithFace(this, c, l);
      const at = cx;
      createHandCard(this, card, at, cy, { showRarity: true });
      this.add.zone(at, cy, HAND_CARD.w, HAND_CARD.h).setOrigin(0, 0).setInteractive()
        .on("pointerover", () => {
          this.hover?.destroy();
          this.hover = drawCardTip(this, card, at, cy, HAND_CARD.w);
        })
        .on("pointerout", () => {
          this.hover?.destroy();
          this.hover = null;
        });
      cx += HAND_CARD.w + S.cards.gap;
    }
  }

  private toggle(id: string) {
    this.open = this.open === id ? undefined : id;
    this.paint();
  }
}
