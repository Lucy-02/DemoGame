// 타이틀 겸 메인 화면 (0054). 게임을 켜면 여기서 시작하고, 판이 끝나도 여기로 돌아와요.
// 왼쪽 세로 메뉴(정령 관리 진입점 · 도감 · 설정 · 종료)와 오른쪽 아래 강조 버튼(탐험 떠나기 / 이어하기)뿐이에요. 배경은 미정이에요.
// 지금은 고정 장면이에요. 저장·정원·런에 연결하면 on*으로 나가요.
import * as Phaser from "phaser";
import { drawBackdrop } from "../run/backdrop";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { DEFAULT_HOME, HOMES } from "./fixtures";
import { MENU, TIP } from "./layout";
import type { HomeItemId, HomeVM } from "./viewmodel";
import { MENU_ICONS, drawItem, drawLogo, drawPrimary, rowY } from "./views/menu";

export const HOME_SCENE = "home";

export interface HomeSceneData {
  /** 고정 장면 이름 (fixtures HOMES). vm을 주면 무시해요 */
  scene?: string;
  vm?: HomeVM;
  /** 시각 검증용: 이 줄에 올린 상태 */
  hover?: string;
  /** 강조 버튼 (탐험 떠나기 / 이어하기) */
  onPrimary?: () => void;
  /** 메뉴 줄 */
  onItem?: (id: HomeItemId) => void;
}

export class HomeScene extends Phaser.Scene {
  private vm!: HomeVM;
  private hover?: HomeItemId;
  private onPrimary?: () => void;
  private onItem?: (id: HomeItemId) => void;
  private dirty = false;

  constructor() {
    super(HOME_SCENE);
  }

  init(data: HomeSceneData) {
    this.vm = data.vm ?? HOMES[data.scene ?? DEFAULT_HOME] ?? HOMES[DEFAULT_HOME];
    this.hover = this.vm.items.find((i) => i.id === data.hover)?.id;
    this.onPrimary = data.onPrimary;
    this.onItem = data.onItem;
  }

  preload() {
    for (const [id, w] of MENU_ICONS) loadIcon(this, id, w);
    if (this.vm.primary.kind === "continue") preloadSpiritArt(this, this.vm.primary.ids);
  }

  create() {
    this.input.setPollAlways();
    this.paint();
    Object.assign(window, { __screenReady: HOME_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private setHover(id?: HomeItemId) {
    if (this.hover === id) return;
    this.hover = id;
    this.dirty = true;
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    drawBackdrop(this);
    drawLogo(this, this.vm.title);
    this.vm.items.forEach((item, i) => drawItem(this, item, i, this.hover === item.id, {
      click: () => this.onItem?.(item.id),
      over: () => this.setHover(item.id),
      out: () => { if (this.hover === item.id) this.setHover(undefined); },
    }));
    drawPrimary(this, this.vm.primary, this.onPrimary);
    const i = this.vm.items.findIndex((it) => it.id === this.hover);
    const tip = this.vm.items[i]?.tip;
    if (tip) {
      drawTooltip(this, {
        skin: GLASS,
        content: [{ kind: "title", text: tip.title }, ...tip.lines.map((l) => ({ kind: "text" as const, role: "body" as const, text: [{ text: l }] }))],
        at: { left: MENU.x + MENU.w + TIP.dx, top: rowY(i) + TIP.dy },
      });
    }
  }
}
