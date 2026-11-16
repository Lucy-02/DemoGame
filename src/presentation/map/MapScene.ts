// 지도 화면 (LEDGER §2 R2 지도 C, 0076 18번): 왼쪽에 가까운 길을 크게, 위 가운데에 전체 미니맵, 오른쪽에 슬림 파티 줄.
// 칸 종류는 기호로만 보여요(0050). 이름은 칸에 올렸을 때 말풍선에 나와요. 갈 수 있는 칸을 누르면 그 칸으로 들어가요.
// 파티 줄을 누르면 그 줄만 같은 자리에서 정령 줄로 펼쳐져요(0046). 덱 보기는 오른쪽 위 덱 버튼으로 열어요(0076 15번).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { Run } from "../../core/run";
import { SYS_ICONS, drawSys } from "../battle/views/topbar";
import { SYS } from "../battle/layout";
import { drawBackdrop } from "../run/backdrop";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane } from "../run/lanes";
import { LANE } from "../run/layout";
import { drawSlimLane } from "../run/slimLane";
import { preloadSpiritArt } from "../spiritArt";
import { button } from "../spirits/views/parts";
import { rgba, withAlpha } from "../style/color";
import { box, circle } from "../style/draw";
import { render, size } from "../style/flex";
import { gather } from "../style/gather";
import { icon, loadIcon } from "../style/icons";
import { GLASS } from "../tooltip/skins";
import { clampLeft, drawTooltip } from "../tooltip/Tooltip";
import { COPY, KIND_ICON } from "./copy";
import { DEFAULT_MAP, mapRun } from "./fixtures";
import { mapVM } from "./fromRun";
import { FRAME, MINI, PATH, SLIM } from "./layout";
import type { MapNodeVM, MapVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.result;

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
    drawGold(this, this.vm.gold);
    drawSys(this, { "i-deck": this.onDeck && (() => this.onDeck?.(this)) });
    this.drawPath();
    this.drawMini();
    this.drawParty();
  }

  /** 보이는 층 구간의 맨 아래 층 */
  private get low(): number {
    return Math.max(0, Math.min(this.vm.top + 1 - PATH.rows, this.vm.floor - PATH.back));
  }

  private at(n: MapNodeVM): Pt {
    return { x: PATH.x + n.col * PATH.colStep, y: PATH.bottom - (n.floor - this.low) * PATH.rowStep };
  }

  private drawPath() {
    const { nodes, links } = this.vm;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const seen = (n: MapNodeVM) => n.floor >= this.low && n.floor < this.low + PATH.rows;
    const L = PATH.link;
    const g = this.add.graphics();
    for (const l of links) {
      const a = byId.get(l.from)!, b = byId.get(l.to)!;
      // 구간 밖으로 이어지는 길도 끝까지 그려서 위아래로 더 있음을 보여요
      if (!seen(a) && !seen(b)) continue;
      if (l.walked) line(g, this.at(a), this.at(b), L.walked, withAlpha(P.ink2, L.walkedAlpha));
      else line(g, this.at(a), this.at(b), L.ahead, withAlpha(P.ink2, L.aheadAlpha), L.dash);
    }
    for (const n of nodes) if (seen(n)) this.drawNode(n);
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
    if (n.kind === "start") return;
    const zone = this.add.zone(x - N.d / 2, y - N.d / 2, N.d, N.d).setOrigin(0, 0);
    const can = n.state === "open" && !!this.onEnter;
    zone.setInteractive({ useHandCursor: can });
    zone.on("pointerover", () => {
      this.hover?.destroy();
      this.hover = gather(this, 0, 0, () => {
        if (n.state === "open") {
          const d = N.d + (N.hover.gap + N.hover.width) * 2;
          circle(this.add.graphics(), x, y, d, { ring: { width: N.hover.width, color: P.ink } });
        }
        const left = clampLeft(x - GLASS.w / 2, GLASS.w, FRAME.w, SYS.right);
        drawTooltip(this, { skin: GLASS, at: { left, top: y + N.d / 2 + PATH.tipGap }, content: [{ kind: "title", text: COPY.kind[n.kind as keyof typeof COPY.kind], tag: n.trait }] });
      });
    });
    zone.on("pointerout", () => {
      this.hover?.destroy();
      this.hover = null;
    });
    if (can) zone.on("pointerup", () => this.onEnter?.(n.id));
  }

  private drawMini() {
    const M = MINI;
    const { nodes, links, top, cols } = this.vm;
    const g = this.add.graphics();
    box(g, M.x, M.y, M.w, M.h, M.radius, { fill: P.glass, ring: { width: 1, color: P.glassLine } });
    const iw = M.w - M.pad * 2, ih = M.h - M.pad * 2;
    const at = (n: MapNodeVM): Pt => ({
      x: M.x + M.pad + (cols > 1 ? n.col / (cols - 1) : 0.5) * iw,
      y: M.y + M.pad + (1 - n.floor / top) * ih,
    });
    // 왼쪽에 크게 보이는 구간
    const step = ih / top;
    const bandTop = M.y + M.pad + (1 - (this.low + PATH.rows - 1) / top) * ih - M.band.pad;
    box(g, M.x + M.pad - M.band.pad, bandTop, iw + M.band.pad * 2, step * (PATH.rows - 1) + M.band.pad * 2, M.band.radius, { fill: withAlpha(P.ink, M.band.alpha) });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const l of links) {
      const a = at(byId.get(l.from)!), b = at(byId.get(l.to)!);
      line(g, a, b, M.line, withAlpha(P.ink2, l.walked ? 1 : M.lineAlpha));
    }
    for (const n of nodes) {
      const p = at(n);
      if (n.state === "here") circle(g, p.x, p.y, M.here, { fill: P.accHi });
      else circle(g, p.x, p.y, M.dot, { fill: n.state === "far" ? withAlpha(P.ink2, M.dotAlpha) : P.ink });
    }
  }

  private drawParty() {
    let y = SLIM.y;
    this.vm.party.forEach((l, i) => {
      if (l.id === this.open) {
        drawLane(this, l, i, { y, noSocket: true, on: { click: () => this.toggle(l.id) } });
        const C = SLIM.close;
        const close = button(COPY.close, { size: T.button, h: C.h, radius: C.radius, padX: C.padX, onClick: () => this.toggle(l.id) });
        render(this, close, SLIM.x + SLIM.w - C.right - size(close).w, y + C.top);
        y += LANE.h + SLIM.gap;
      } else {
        drawSlimLane(this, l, y, SLIM, () => this.toggle(l.id));
        y += SLIM.h + SLIM.gap;
      }
    });
  }

  private toggle(id: string) {
    this.open = this.open === id ? undefined : id;
    this.paint();
  }
}
