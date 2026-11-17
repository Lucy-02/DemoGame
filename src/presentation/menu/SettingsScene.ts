// 설정 창 (0084 3번 · 0089): 지금 화면 위에 창으로 떠요. 메인 화면의 설정과 판 안 메뉴의 설정이 같은 창이에요.
// 바꾸면 바로 반영하고 저장해요 (적용 버튼 없음). 닫기 · Esc · 창 밖을 누르면 닫혀요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { SettingsSession, type VolumeId } from "../../session/settings";
import { audioOf } from "../audio";
import { drawWindow } from "../result/views/window";
import { render, size, type Node } from "../style/flex";
import { loadIcon } from "../style/icons";
import { P, text } from "../spirits/views/parts";
import { drawTooltip } from "../tooltip/Tooltip";
import { GLASS } from "../tooltip/skins";
import { COPY } from "./copy";
import { FRAME, SETTINGS as S } from "./layout";
import { settingsRows, sliderValue, type SettingsMarks, type TipId } from "./views/settings";

const T = tokens.provisional.text.result;

export const SETTINGS_SCENE = "settings";

export interface SettingsSceneData {
  /** 없으면 저장하지 않는 기본 설정 (고정 장면) */
  settings?: SettingsSession;
  onClose?: () => void;
  /** 시각 검증용: 이 줄에 올린 상태 */
  hover?: string;
}

export class SettingsScene extends Phaser.Scene {
  private settings!: SettingsSession;
  private onClose?: () => void;
  private hover?: TipId;
  private drag?: VolumeId;
  private marks: SettingsMarks = { sliders: new Map(), tips: new Map() };
  private dirty = false;
  private off?: () => void;

  constructor() {
    super(SETTINGS_SCENE);
  }

  init(data: SettingsSceneData) {
    this.settings = data.settings ?? new SettingsSession();
    this.onClose = data.onClose;
    this.hover = data.hover === "speed" || data.hover === "shake" ? data.hover : undefined;
    this.drag = undefined;
  }

  preload() {
    loadIcon(this, "i-gear", S.head.icon);
    loadIcon(this, "g-close", S.close.icon);
  }

  create() {
    this.input.setPollAlways();
    this.paint();
    // 창 밖에서 바뀐 값(전체화면 단축키 등)도 따라 그려요
    this.off = this.settings.onChange(() => { this.dirty = true; });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.off?.());
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.slide(p));
    this.input.on("pointerup", () => {
      // 효과음 막대를 놓으면 그 크기로 한 번 들려줘요
      if (this.drag === "sfx") audioOf(this)?.play("ui.click");
      this.drag = undefined;
    });
    this.input.keyboard?.on("keydown-ESC", () => this.onClose?.());
    Object.assign(window, { __screenReady: SETTINGS_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private slide(p: Phaser.Input.Pointer) {
    const r = this.drag && this.marks.sliders.get(this.drag);
    if (!this.drag || !r || !p.isDown) return;
    this.settings.set({ volume: { [this.drag]: sliderValue(r, p.x) } });
  }

  private setHover(id?: TipId) {
    if (this.hover === id) return;
    this.hover = id;
    this.dirty = true;
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    const s = this.settings.state;
    this.marks = { sliders: new Map(), tips: new Map() };
    const inner = S.w - 2 * S.pad;
    const head: Node = {
      t: "row", w: inner, h: S.head.h, align: "center", gap: S.head.gap,
      children: [
        { t: "icon", id: "i-gear", w: S.head.icon, h: S.head.icon, tint: P.ink3Spirit },
        text(COPY.settings, T.name, P.ink),
        {
          t: "row", align: "center", gap: S.close.gap, h: S.head.h, ml: "auto", onClick: () => this.onClose?.(),
          children: [{ t: "icon", id: "g-close", w: S.close.icon, h: S.close.icon, tint: P.ink3Spirit }, text(COPY.close, T.button, P.ink2)],
        },
      ],
    };
    const rows = settingsRows(s, inner, {
      toggleFullscreen: () => this.settings.set({ fullscreen: !this.settings.state.fullscreen }),
      toggleShake: () => this.settings.set({ shake: !this.settings.state.shake }),
      speed: (speed) => this.settings.set({ speed }),
    }, this.marks);
    const body: Node = { t: "col", gap: S.head.below, children: [head, rows] };
    const h = size(body).h + 2 * S.pad;
    const win = { x: Math.round((FRAME.w - S.w) / 2), y: Math.round((FRAME.h - h) / 2), w: S.w, h };

    // 창 밖을 누르면 닫혀요
    this.add.zone(0, 0, FRAME.w, FRAME.h).setOrigin(0, 0).setInteractive().on("pointerup", () => { if (!this.drag) this.onClose?.(); });
    drawWindow(this, win);
    this.add.zone(win.x, win.y, win.w, win.h).setOrigin(0, 0).setInteractive();
    render(this, body, win.x + S.pad, win.y + S.pad);

    for (const [id, r] of this.marks.sliders) {
      this.add.zone(r.x, r.y - (S.row.h - r.h) / 2, r.w, S.row.h).setOrigin(0, 0).setInteractive({ useHandCursor: true })
        .on("pointerdown", (p: Phaser.Input.Pointer) => {
          this.drag = id;
          this.slide(p);
        });
    }
    for (const [id, at] of this.marks.tips) {
      this.add.zone(at.x, at.y, inner / 2, S.row.h).setOrigin(0, 0).setInteractive()
        .on("pointerover", () => this.setHover(id))
        .on("pointerout", () => { if (this.hover === id) this.setHover(undefined); });
    }
    const at = this.hover && this.marks.tips.get(this.hover);
    if (this.hover && at) {
      drawTooltip(this, {
        skin: GLASS,
        content: [{ kind: "text", role: "body", text: [{ text: COPY.tip[this.hover] }] }],
        at: { left: win.x + win.w + S.tip.dx, top: at.y + S.tip.dy },
      });
    }
  }
}
