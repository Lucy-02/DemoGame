// 이벤트 화면 (0046 · 정리안 f8 · 0076 17번): 왼쪽에 골드, 이벤트 이름 줄, 상황 두세 문장, 선택지 판. 오른쪽 정령 세 줄. 장면 그림은 없어요.
// 선택지에 올리면 대가가 전부 미리 보여요: 골드 a→b, 영향 받는 줄의 HP a→b와 테, 카드를 받으면 줄마다 받을 자리.
// 덱에서 카드를 고르는 선택지(빼기 · 강화 · 복제)는 왼쪽이 덱으로 바뀌고, 고르고 확인해야 선택지 전체가 적용돼요. 고르기 전엔 돌아갈 수 있어요.
// 카드 보상은 결과를 적용한 뒤 onCards로 넘겨요 (보상 화면은 게임 흐름이 띄워요).
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { EventSession } from "../../session/event";
import { preloadHandCard } from "../card/HandCard";
import { drawBackdrop } from "../run/backdrop";
import { CHOICE_ICONS, drawChoices } from "../run/choices";
import { COPY as RUN_COPY } from "../run/copy";
import { DECK_PICK_ICONS, drawDeckPick } from "../run/deckPick";
import { cardVM, deckCardVM, lane } from "../run/fromCore";
import { GOLD_ICONS, drawGold } from "../run/gold";
import { LANE_ICONS, drawLane, type LaneState } from "../run/lanes";
import { CHOICE, STORY } from "../run/layout";
import { outcomesFx } from "../run/outcomes";
import type { DeckCardVM, LaneVM } from "../run/viewmodel";
import { P, text } from "../spirits/views/parts";
import { render, size, type Node } from "../style/flex";
import { upgradedId } from "../../core/data";
import { preloadSpiritArt } from "../spiritArt";
import { loadIcon } from "../style/icons";
import { PICK_CONFIRM } from "./copy";
import { eventSession } from "./fixtures";

export const EVENT_SCENE = "event";

const T = tokens.provisional.text.runScreen;

export interface EventSceneData {
  session?: EventSession;
  /** 고정 장면: 이벤트 id (fixtures). 세션을 주면 무시해요 */
  scene?: string;
  /** 시각 검증용: 이 번호의 선택지에 올린 상태, 또는 "pick:<번호>"(그 선택지를 골라 덱을 편 상태) */
  hover?: string;
  /** 이벤트를 마쳤어요 */
  onDone?: (scene: Phaser.Scene) => void;
  /** 카드 보상을 고를 차례예요 (결과는 이미 적용됐어요) */
  onCards?: (scene: Phaser.Scene, cardIds: string[]) => void;
}

export class EventScene extends Phaser.Scene {
  private session!: EventSession;
  private data_?: EventSceneData;
  private hover?: number;
  private deckHover?: number;
  private pick?: number;
  private dirty = false;

  constructor() {
    super(EVENT_SCENE);
  }

  init(data: EventSceneData) {
    this.session = data.session ?? eventSession(data.scene);
    this.data_ = data;
    const [mode, n] = (data.hover ?? "").split(":");
    if (mode === "pick") this.session.choose(Number(n));
    this.hover = mode !== "pick" && data.hover !== undefined && data.hover !== "" ? Number(data.hover) : undefined;
    this.deckHover = undefined;
    this.pick = undefined;
    this.dirty = false;
  }

  preload() {
    for (const [id, w] of [...LANE_ICONS, ...GOLD_ICONS, ...DECK_PICK_ICONS, ...CHOICE_ICONS]) loadIcon(this, id, w);
    for (const c of this.session.run.deck) {
      preloadHandCard(this, deckCardVM(c), { showRarity: true });
      if (this.session.run.canUpgrade(c.uid)) preloadHandCard(this, cardVM(upgradedId(c.cardId), c.owner), { showRarity: true });
    }
    preloadSpiritArt(this, this.session.run.spirits.map((s) => s.id));
  }

  create() {
    this.input.setPollAlways();
    this.paint();
    Object.assign(window, { __screenReady: EVENT_SCENE });
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
    return this.session.run.spirits.map((rs) => lane(rs, { exp: { before: 0, after: 0 }, deck: this.session.run.deck.filter((c) => c.owner === rs.id).length }));
  }

  /** 단계가 바뀌었으면 다음으로 넘겨요 */
  private advance() {
    const st = this.session.step;
    if (st.kind === "cards") this.data_?.onCards?.(this, st.cardIds);
    else if (st.kind === "done") this.data_?.onDone?.(this);
    else this.redraw();
  }

  private paint() {
    for (const o of [...this.children.list]) o.destroy();
    drawBackdrop(this);
    const st = this.session.step;
    if (st.kind === "pick") return this.paintPick(st.mode);
    if (st.kind !== "choose") return;
    const s = this.session;
    const pv = this.hover === undefined ? undefined : s.preview(this.hover);
    drawGold(this, pv?.gold?.to ?? s.run.gold, pv?.gold ? { was: pv.gold.from } : {});

    this.lanes().forEach((l, i) => {
      const lst: LaneState = { noSocket: !pv?.cards };
      if (pv) {
        const hp = pv.hp[l.id], max = pv.maxHp[l.id];
        if (hp) lst.hpTo = hp.to;
        if (max) lst.maxHpTo = max.to;
        if (hp || max) lst.hot = true;
        if (pv.cards) lst.open = true;
      }
      drawLane(this, l, i, lst);
    });

    // 이름 줄 + 상황 글. 글이 길면 선택지 판이 그만큼 내려가요
    const story: Node = {
      t: "col", w: STORY.w, gap: STORY.gap,
      children: [
        text(s.event.title, T.eventName, P.ink, { lh: STORY.titleLh }),
        text(s.event.text, T.story, P.ink, { lh: STORY.lh, wrap: STORY.w, keepAll: true }),
      ],
    };
    const titleH = size(story.children[0]).h + STORY.gap;
    const top = STORY.top - titleH;
    render(this, story, STORY.x, top);
    const choicesTop = top + size(story).h + CHOICE.gap;
    drawChoices(this, s.event.options.map((o, i) => ({ label: o.label, fx: outcomesFx(o.outcome), enabled: s.canChoose(i) })), choicesTop, this.hover, {
      click: (i) => { if (this.session.choose(i)) { this.hover = undefined; this.advance(); } },
      over: (i) => { this.hover = i; this.redraw(); },
      out: (i) => { if (this.hover === i) { this.hover = undefined; this.redraw(); } },
    }, RUN_COPY.fx.none);
  }

  private paintPick(mode: "removeCard" | "upgradeCard" | "duplicateCard") {
    const run = this.session.run;
    const ok = new Set(this.session.candidates(mode));
    drawGold(this, run.gold);
    const rows: Record<string, DeckCardVM[]> = Object.fromEntries(run.spirits.map((rs) => [rs.id, run.deck.filter((c) => c.owner === rs.id).map((c): DeckCardVM => ({
      uid: c.uid, card: deckCardVM(c),
      // 강화는 강화한 모습, 복제는 같은 카드 한 장이 옆에 끼어요
      after: mode === "upgradeCard" ? (ok.has(c.uid) ? cardVM(upgradedId(c.cardId), c.owner) : undefined) : mode === "duplicateCard" ? deckCardVM(c) : undefined,
    }))]));
    drawDeckPick(this, {
      lanes: this.lanes(), rows, mode: mode === "removeCard" ? "remove" : "upgrade", hover: this.deckHover, pick: this.pick,
      off: (uid) => !ok.has(uid),
      lane: (l, mine) => (!mine ? { noSocket: true }
        : mode === "upgradeCard" ? { hot: true, noSocket: true }
        : { hot: true, noSocket: true, deckTo: (l.deck ?? 0) + (mode === "removeCard" ? -1 : 1) }),
      confirm: { label: PICK_CONFIRM[mode], icon: mode === "removeCard" ? "fx-discard" : mode === "upgradeCard" ? "g-up" : "g-cardnew", danger: mode === "removeCard" },
      cancelLabel: RUN_COPY.cancel,
      on: {
        hover: (uid) => { if (this.deckHover !== uid) { this.deckHover = uid; this.redraw(); } },
        toggle: (uid) => { this.pick = this.pick === uid ? undefined : uid; this.redraw(); },
        clear: () => { this.pick = undefined; this.redraw(); },
        ok: (uid) => { if (this.session.pick(uid)) this.advance(); },
        back: () => { this.session.cancelPick(); this.pick = undefined; this.deckHover = undefined; this.redraw(); },
      },
    });
  }
}
