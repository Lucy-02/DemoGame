// 덱 보기 (0012 A "정령별 세 줄"을 0069 전투 위 창에): 지금 화면 위에 창으로 떠서 이번 판 덱을 보여요. 보기만 하고, 빼기는 상점에 있어요.
// 창은 내용을 감싸고 화면 한가운데에 놓여요. 넘치는 줄만 접어 내리고, 창이 화면보다 길면 창 안에서 세로로 스크롤해요 (가로 스크롤 없음).
import { fadeInScene } from "../style/motion";
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { Run } from "../../core/run";
import { createHandCard, preloadHandCard } from "../card/HandCard";
import { drawWindow } from "../result/views/window";
import { cardWithFace, drawCardTip } from "../run/cards";
import { faceTexture, preloadSpiritArt } from "../spiritArt";
import { render, size, type Node } from "../style/flex";
import { loadIcon } from "../style/icons";
import { COPY } from "./copy";
import { DEFAULT_DECK, deckRun } from "./fixtures";
import { deckVM } from "./fromRun";
import { DECK_VIEW as D } from "./layout";
import type { DeckVM } from "./viewmodel";

const P = tokens.provisional.palette;
const T = tokens.provisional.text.result;

export const DECK_SCENE = "deck";

export interface DeckSceneData {
  /** 이번 판. 없으면 고정 장면 (scene) */
  run?: Run;
  scene?: string;
  onClose?: () => void;
  /** 시각 검증용: 처음 스크롤 위치 */
  scroll?: number;
}

const text = (t: string, sz: string, color: string): Node => ({ t: "text", text: t, size: sz, color }) as Node;

export class DeckScene extends Phaser.Scene {
  private vm!: DeckVM;
  private ids: string[] = [];
  private onClose?: () => void;
  private startScroll = 0;

  constructor() {
    super(DECK_SCENE);
  }

  init(data: DeckSceneData) {
    const run = data.run ?? deckRun(data.scene ?? DEFAULT_DECK);
    this.vm = deckVM(run);
    this.ids = run.spirits.map((s) => s.id);
    this.onClose = data.onClose;
    this.startScroll = data.scroll ?? 0;
  }

  preload() {
    for (const r of this.vm.rows) r.cards.forEach((c) => preloadHandCard(this, c));
    loadIcon(this, "i-deck", D.head.icon);
    loadIcon(this, "g-close", D.close.icon);
    preloadSpiritArt(this, this.ids);
  }

  create() {
    const { rows } = this.vm;
    const step = D.card.w + D.cardGap;
    const cols = Math.max(D.minCols, Math.min(D.per, Math.max(...rows.map((r) => r.cards.length))));
    const innerW = cols * D.card.w + (cols - 1) * D.cardGap;
    const lines = (n: number) => Math.max(1, Math.ceil(n / D.per));
    const rowH = (n: number) => D.head.h + D.head.below + lines(n) * D.card.h + (lines(n) - 1) * D.cardGap;
    const contentH = rows.reduce((a, r) => a + rowH(r.cards.length), 0) + (rows.length - 1) * D.rowGap;
    const viewH = Math.min(contentH, D.frame.h - 2 * D.screenGap - 2 * D.pad);
    const win = { w: innerW + 2 * D.pad, h: viewH + 2 * D.pad, x: 0, y: 0 };
    win.x = Math.round((D.frame.w - win.w) / 2);
    win.y = Math.round((D.frame.h - win.h) / 2);
    const x0 = win.x + D.pad, y0 = win.y + D.pad;

    // 창 밖을 누르면 닫혀요
    this.add.zone(0, 0, D.frame.w, D.frame.h).setOrigin(0, 0).setInteractive().on("pointerup", () => this.close());
    drawWindow(this, win);
    this.add.zone(win.x, win.y, win.w, win.h).setOrigin(0, 0).setInteractive();
    const chrome = [...this.children.list];

    // 내용: 창 안쪽 영역만 비추는 카메라로 그려서 넘치면 잘리고, 스크롤은 그 카메라가 움직여요
    const max = contentH - viewH;
    let scroll = Math.max(0, Math.min(max, this.startScroll));
    const cam = this.cameras.add(x0, y0, innerW, viewH).setScroll(x0, y0 + scroll);
    let tip: Phaser.GameObjects.Container | undefined;
    const hideTip = () => {
      tip?.destroy();
      tip = undefined;
    };
    let y = y0;
    rows.forEach((r, i) => {
      const H = D.head;
      const head: Node = {
        t: "row", align: "center", gap: H.gap, h: H.h,
        children: [
          ...(r.face && this.textures.exists(r.face.key) ? [{ t: "image", key: faceTexture(this, r.face, H.face), w: H.face, h: H.face } as Node] : []),
          text(r.name, T.name, P.ink),
          { t: "row", align: "center", gap: H.iconGap, children: [{ t: "icon", id: "i-deck", w: H.icon, h: H.icon, tint: P.ink3Spirit }, text(String(r.cards.length), T.was, P.ink2)] },
          ...(r.gained > 0 ? [text(COPY.gained(r.gained), T.was, P.accHi)] : []),
        ],
      };
      render(this, head, x0, y);
      // 닫기는 첫 줄 머리 오른쪽 끝 (창 여백을 따로 쓰지 않아요)
      if (i === 0) {
        const close: Node = {
          t: "row", align: "center", gap: D.close.gap, h: H.h, onClick: () => this.close(),
          children: [{ t: "icon", id: "g-close", w: D.close.icon, h: D.close.icon, tint: P.ink3Spirit }, text(COPY.close, T.button, P.ink2)],
        };
        render(this, close, x0 + innerW - size(close).w, y);
      }
      const top = y + H.h + H.below;
      r.cards.forEach((c, j) => {
        const cx = x0 + (j % D.per) * step, cy = top + Math.floor(j / D.per) * (D.card.h + D.cardGap);
        const card = cardWithFace(this, c, r);
        const view = createHandCard(this, card, cx, cy, { showUpgraded: true });
        this.add.zone(cx, cy, D.card.w, D.card.h).setOrigin(0, 0).setInteractive()
          .on("pointerover", () => {
            hideTip();
            view.setLifted(true);
            // 큰 얼굴은 창에 잘리거나 카드에 가려지지 않게 맨 위 카메라에만 그려요
            const before = new Set(this.children.list);
            tip = drawCardTip(this, card, cx, cy - scroll, D.card.w);
            const made = this.children.list.filter((o) => !before.has(o));
            cam.ignore(made);
            this.cameras.main.ignore(made);
          })
          .on("pointerout", () => {
            view.setLifted(false);
            hideTip();
          });
      });
      y += rowH(r.cards.length) + D.rowGap;
    });
    const content = this.children.list.filter((o) => !chrome.includes(o));
    this.cameras.main.ignore(content);
    cam.ignore(chrome);
    this.cameras.add(0, 0, D.frame.w, D.frame.h).ignore([...chrome, ...content]);

    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      scroll = Math.max(0, Math.min(max, scroll + dy * D.wheel));
      cam.setScroll(x0, y0 + scroll);
      hideTip();
    });
    this.input.keyboard?.on("keydown-ESC", () => this.close());
    fadeInScene(this);
    Object.assign(window, { __screenReady: DECK_SCENE });
  }

  private close() {
    this.onClose?.();
  }
}
