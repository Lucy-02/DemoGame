// 휴식 화면 (Lucy 2026-11-17, 공용 UI 기획 r5): 배경 위 왼쪽 판(쉬기 · 카드 강화) + 오른쪽 얇은 정령 줄, 둘 다 가운데 높이. 꼭 하나를 골라요 (0046 Lucy 2026-11-10 답).
// 쉬기 판에는 회복하는 정령 얼굴 + HP a→b, 올리면 얇은 줄에 찰 만큼과 밝은 테. 누르면 회복하고 지도로 가요.
// 카드 강화를 누르면 덱 고르기 창(run/deckPick, 상점 빼기와 같은 틀 · 두 단계)이 떠요. 고른 카드 오른쪽에 강화한 카드가 끼어 전→후가 보이고,
// 강화할 수 없는 카드는 회색이에요(0043).
// 둘 다 할 것이 없을 때(모두 HP가 가득하고 강화할 카드도 없음)만 떠나기가 보여요.
import { MOVE, reducedMotion } from "../style/motion";
import * as Phaser from "phaser";
import { upgradedId } from "../../core/data";
import type { RestSession } from "../../session/rest";
import { preloadHandCard } from "../card/HandCard";
import { drawBackdrop } from "../run/backdrop";
import { CHOICE_ICONS, type ChoiceVM } from "../run/choices";
import { COPY as RUN_COPY } from "../run/copy";
import { DECK_PICK_ICONS, drawDeckPick, drawQuietButton } from "../run/deckPick";
import { cardVM, deckCardVM, lane } from "../run/fromCore";
import { RUN_TOP_ICONS, drawRunTop } from "../run/topbar";
import { outcomeFx } from "../run/outcomes";
import { drawStoryPanel } from "../run/panel";
import { drawSlimParty } from "../run/slimLane";
import type { DeckCardVM, LaneVM } from "../run/viewmodel";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { COPY } from "./copy";
import { restSession } from "./fixtures";

export const REST_SCENE = "rest";

export interface RestSceneData {
  session?: RestSession;
  /** 고정 장면 이름 (fixtures RESTS). 세션을 주면 무시해요 */
  scene?: string;
  /** 시각 검증용: "rest"(쉬기에 올림) · "upgrade"(덱 펼침) · "upgrade:<카드 id>"(그 카드를 고름) */
  hover?: string;
  /** 쉬기나 강화를 마치면(또는 그냥 떠나면) 불려요 */
  onLeave?: (scene: Phaser.Scene) => void;
  /** 위 띠의 덱 보기 */
  onDeck?: (scene: Phaser.Scene) => void;
}

/** 선택지 판 순서 */
const Pick = { Rest: 0, Upgrade: 1 } as const;

export class RestScene extends Phaser.Scene {
  private session!: RestSession;
  private onLeave?: (scene: Phaser.Scene) => void;
  private onDeck?: (scene: Phaser.Scene) => void;
  private hover?: number;
  /** 강화: 덱을 펼쳐 고르는 중 */
  private upgrading = false;
  private deckHover?: number;
  private pick?: number;
  private dirty = false;

  constructor() {
    super(REST_SCENE);
  }

  init(data: RestSceneData) {
    this.session = data.session ?? restSession(data.scene);
    this.onLeave = data.onLeave;
    this.onDeck = data.onDeck;
    const [mode, key] = (data.hover ?? "").split(":");
    this.hover = mode === "rest" ? Pick.Rest : undefined;
    this.upgrading = mode === "upgrade" && this.session.canUpgrade();
    this.pick = this.upgrading && key ? this.session.run.deck.find((c) => c.cardId === key && this.session.run.canUpgrade(c.uid))?.uid : undefined;
    this.deckHover = undefined;
    this.dirty = false;
    this.rested = false;
  }

  preload() {
    for (const [id, w] of [...DECK_PICK_ICONS, ...CHOICE_ICONS, ...RUN_TOP_ICONS]) loadIcon(this, id, w);
    for (const row of Object.values(this.rows())) for (const c of row) {
      preloadHandCard(this, c.card, { showRarity: true });
      if (c.after) preloadHandCard(this, c.after, { showRarity: true });
    }
    preloadSpiritArt(this, this.session.run.spirits.map((s) => s.id));
  }

  create() {
    this.input.setPollAlways();
    this.paint();
    Object.assign(window, { __screenReady: REST_SCENE });
  }

  update() {
    if (!this.dirty) return;
    this.dirty = false;
    this.paint();
  }

  private redraw() {
    this.dirty = true;
  }

  private lanes(): LaneVM[] {
    return this.session.run.spirits.map((rs) => lane(rs));
  }

  /** 정령마다 그 정령의 덱. 강화할 수 있는 카드는 강화한 모습을 함께 */
  private rows(): Record<string, DeckCardVM[]> {
    const run = this.session.run;
    return Object.fromEntries(run.spirits.map((rs) => [rs.id, run.deck.filter((c) => c.owner === rs.id).map((c): DeckCardVM => ({
      uid: c.uid, card: deckCardVM(c),
      after: run.canUpgrade(c.uid) ? cardVM(upgradedId(c.cardId), c.owner) : undefined,
    }))]));
  }

  private leave() {
    this.onLeave?.(this);
  }

  /** 쉬기를 골랐어요 (넘어가기 전 한 박자) */
  private rested = false;

  private choose(i: number) {
    if (i === Pick.Rest) {
      if (this.rested || !this.session.dispatch({ kind: "rest" })) return;
      // 찬 HP를 한 박자 보고 넘어가요 (0088)
      this.rested = true;
      this.hover = undefined;
      this.redraw();
      if (reducedMotion()) return this.leave();
      this.time.delayedCall(MOVE.duration, () => this.leave());
      return;
    }
    if (!this.session.canUpgrade()) return;
    this.upgrading = true;
    this.hover = undefined;
    this.redraw();
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    drawBackdrop(this);
    if (this.upgrading) return this.paintUpgrade();
    const s = this.session;
    const heal = s.healPreview();
    const lit = this.hover === Pick.Rest;
    const lanes = this.lanes();
    drawRunTop(this, s.run.gold, {}, this.onDeck);
    drawSlimParty(this, lanes, (l) => (lit && heal[l.id] ? { hpTo: Math.min(l.maxHp, l.hp + heal[l.id]), hot: true } : {}));
    const items: ChoiceVM[] = [
      { label: COPY.rest, faces: lanes.filter((l) => heal[l.id]).map((l) => ({ face: l.face, from: l.hp, to: Math.min(l.maxHp, l.hp + heal[l.id]) })), fx: [], enabled: s.canRest() },
      { label: COPY.upgrade, fx: [outcomeFx({ type: "upgradeCard" })!], enabled: s.canUpgrade() },
    ];
    drawStoryPanel(this, {
      items, hot: this.hover,
      on: {
        click: (i) => this.choose(i),
        over: (i) => { this.hover = i; this.redraw(); },
        out: (i) => { if (this.hover === i) { this.hover = undefined; this.redraw(); } },
      },
    });
    if (s.canLeaveEmpty()) drawQuietButton(this, "g-back", RUN_COPY.leave, () => this.leave());
  }

  private paintUpgrade() {
    const run = this.session.run;
    drawRunTop(this, run.gold, {}, this.onDeck);
    drawDeckPick(this, {
      lanes: this.lanes(), rows: this.rows(), mode: "upgrade", hover: this.deckHover, pick: this.pick,
      off: (uid) => !run.canUpgrade(uid),
      confirm: { label: COPY.confirm, icon: "g-up" },
      cancelLabel: RUN_COPY.cancel,
      on: {
        hover: (uid) => { if (this.deckHover !== uid) { this.deckHover = uid; this.redraw(); } },
        toggle: (uid) => { this.pick = this.pick === uid ? undefined : uid; this.redraw(); },
        clear: () => { this.pick = undefined; this.redraw(); },
        ok: (uid) => {
          if (!this.session.dispatch({ kind: "upgrade", uid })) return;
          this.leave();
        },
        back: () => { this.upgrading = false; this.pick = undefined; this.deckHover = undefined; this.redraw(); },
      },
    });
  }
}
