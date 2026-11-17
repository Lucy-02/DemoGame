// 판 안 메뉴 (0084 3번 · 0085): Esc와 톱니로 지금 화면 위에 떠요. 계속 · 설정 · 메인으로 · 탐험 포기.
// 탐험 포기는 같은 자리에서 확인 창으로 바뀌어요 (제목 `~할까요?`, 버튼은 행동 이름). 줄은 메인 화면 메뉴 줄을 그대로 써요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { primaryNode, itemNode, MENU_ICONS } from "../home/views/menu";
import { drawWindow } from "../result/views/window";
import { render, size, type Node } from "../style/flex";
import { loadIcon } from "../style/icons";
import { P, text } from "../spirits/views/parts";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { COPY } from "./copy";
import { CONFIRM as C, FRAME, RUN_MENU as M } from "./layout";

const T = tokens.provisional.text.result;

export const MENU_SCENE = "runMenu";

type RowId = "settings" | "toHome" | "giveUp";

export interface MenuSceneData {
  onResume?: () => void;
  onSettings?: () => void;
  /** 없으면 줄을 빼요 (정원 없는 시험 판) */
  onHome?: () => void;
  onGiveUp?: () => void;
  /** 시각 검증용: 이 줄에 올린 상태, 확인 창을 연 채로 */
  hover?: string;
  confirm?: boolean;
}

const ROW_ICON = MENU_ICONS[2][1];

export class MenuScene extends Phaser.Scene {
  private data_!: MenuSceneData;
  private hover?: RowId;
  private confirm = false;
  private dirty = false;

  constructor() {
    super(MENU_SCENE);
  }

  init(data: MenuSceneData) {
    this.data_ = data;
    this.hover = data.hover === "settings" || data.hover === "toHome" || data.hover === "giveUp" ? data.hover : undefined;
    this.confirm = !!data.confirm;
  }

  preload() {
    for (const [id, w] of MENU_ICONS) loadIcon(this, id, w);
    loadIcon(this, "g-back", ROW_ICON);
  }

  create() {
    this.scene.bringToTop();
    this.input.setPollAlways();
    this.paint();
    this.input.keyboard?.on("keydown-ESC", () => this.back());
    Object.assign(window, { __screenReady: MENU_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  /** Esc · 창 밖: 확인 창이면 메뉴로, 메뉴면 닫고 하던 화면으로 */
  private back() {
    if (!this.confirm) return this.data_.onResume?.();
    this.confirm = false;
    this.dirty = true;
  }

  private setHover(id?: RowId) {
    if (this.hover === id) return;
    this.hover = id;
    this.dirty = true;
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => this.back());
    if (this.confirm) this.paintConfirm();
    else this.paintMenu();
  }

  private paintMenu() {
    const d = this.data_;
    const rows: { id: RowId; label: string; icon?: string; tip?: string; click?: () => void; mt?: number }[] = [
      { id: "settings", label: COPY.settings, icon: "i-gear", click: d.onSettings },
      ...(d.onHome ? [{ id: "toHome" as const, label: COPY.toHome, icon: "g-back", tip: COPY.tip.toHome, click: d.onHome }] : []),
      // 되돌릴 수 없는 줄은 한 칸 띄워 맨 아래에
      { id: "giveUp", label: COPY.giveUp, tip: COPY.tip.giveUp, mt: M.below - M.gap, click: () => { this.confirm = true; this.hover = undefined; this.dirty = true; } },
    ];
    const h = M.primaryH + M.below + rows.reduce((a, r) => a + M.rowH + (r.mt ?? 0), 0) + (rows.length - 1) * M.gap + 2 * M.pad;
    const win = { x: Math.round((FRAME.w - M.w) / 2) - M.pad, y: Math.round((FRAME.h - h) / 2), w: M.w + 2 * M.pad, h };
    drawWindow(this, win);
    this.add.zone(win.x, win.y, win.w, win.h).setOrigin(0, 0).setInteractive();
    const x = win.x + M.pad;
    let y = win.y + M.pad;
    render(this, primaryNode(this, { kind: "depart", label: COPY.resume }), x, y);
    this.add.zone(x, y, M.w, M.primaryH).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on("pointerup", () => d.onResume?.());
    y += M.primaryH + M.below;
    for (const r of rows) {
      y += r.mt ?? 0;
      const top = y;
      render(this, itemNode(r, this.hover === r.id), x, top);
      this.add.zone(x, top, M.w, M.rowH).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerover", () => this.setHover(r.id))
        .on("pointerout", () => { if (this.hover === r.id) this.setHover(undefined); })
        .on("pointerup", () => r.click?.());
      if (r.tip && this.hover === r.id) {
        drawTooltip(this, {
          skin: GLASS,
          content: [{ kind: "text", role: "body", text: [{ text: r.tip }] }],
          at: { left: win.x + win.w + M.tip.dx, top: top + M.tip.dy },
        });
      }
      y += M.rowH + M.gap;
    }
  }

  /** 확인 창: 되돌리는 쪽(계속)은 조용한 판, 포기는 위험색 채움 (덱 고르기의 빼기 확인과 같은 짝) */
  private paintConfirm() {
    const bw = (C.w - C.btnGap) / 2;
    const btn = (label: string, danger: boolean, onClick: () => void): Node => ({
      t: "row", w: bw, h: C.btnH, radius: C.radius, justify: "center", align: "center",
      style: danger ? { fill: P.danger } : { fill: P.veil["04"], ring: { width: 1, color: P.glassLine } }, onClick,
      children: [text(label, T.button, danger ? P.onDanger : P.ink)],
    });
    const body: Node = {
      t: "col", w: C.w, gap: C.gap, align: "center",
      children: [
        text(COPY.giveUpTitle, T.name, P.ink),
        { t: "row", gap: C.btnGap, children: [btn(COPY.resume, false, () => this.back()), btn(COPY.giveUp, true, () => this.data_.onGiveUp?.())] },
      ],
    };
    const h = size(body).h + 2 * C.pad;
    const win = { x: Math.round((FRAME.w - C.w) / 2) - C.pad, y: Math.round((FRAME.h - h) / 2), w: C.w + 2 * C.pad, h };
    drawWindow(this, win);
    this.add.zone(win.x, win.y, win.w, win.h).setOrigin(0, 0).setInteractive();
    render(this, body, win.x + C.pad, win.y + C.pad);
  }
}
