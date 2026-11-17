// 이벤트 세션: 선택지 하나를 고르면 그 결과를 판에 적용해요 (0046 이벤트). 결과 적용은 화면이 아니라 여기서만 해요.
// 덱에서 카드를 골라야 하는 결과(빼기 · 강화 · 복제)는 카드를 고르고 확인해야 선택지 전체가 적용돼요. 고르기 전에는 물러날 수 있어요.
// 카드 보상(cardReward)은 나머지 결과를 적용한 뒤 보상 화면으로 넘겨요(주인이 정해지지 않은 카드 묶음, RewardSession "cards").
// 새 결과 타입은 apply의 switch에 한 줄, 고르기가 필요하면 PICK에 한 줄 더하면 돼요.
import { C, canUpgradeCard, cardDef, eventDef } from "../core/data";
import { Run } from "../core/run";
import { maxHpOf } from "../core/stats";
import type { DeckPickOutcome, EventDef, EventOutcome } from "../core/types";

/** 지금 할 일 */
export type EventStep =
  | { kind: "choose" }
  /** 선택지 option을 골랐고, 덱에서 카드를 고르는 중 */
  | { kind: "pick"; option: number; mode: DeckPickOutcome }
  /** 결과가 적용됐고, 카드 보상을 고를 차례 */
  | { kind: "cards"; cardIds: string[] }
  | { kind: "done" };

/** a→b */
export interface Change {
  from: number;
  to: number;
}

/** 선택지에 올렸을 때 미리 보이는 대가 전부 (0046) */
export interface EventPreview {
  gold?: Change;
  /** 바뀌는 정령만 */
  hp: Record<string, Change>;
  maxHp: Record<string, Change>;
  /** 카드를 받아요 (정령 줄에 받을 자리) */
  cards: boolean;
  /** 덱에서 카드를 골라요 */
  pick?: DeckPickOutcome;
}

/** 카드 보상에서 보여 주는 장수 */
export const EVENT_CARD_CHOICES = 3;

const PICK: readonly DeckPickOutcome[] = ["removeCard", "upgradeCard", "duplicateCard"];
const pickOf = (outs: readonly EventOutcome[]) => outs.find((o): o is Extract<EventOutcome, { type: DeckPickOutcome }> => PICK.includes(o.type as DeckPickOutcome))?.type;

export class EventSession {
  readonly event: EventDef;
  private _step: EventStep = { kind: "choose" };

  /** event: 이벤트 id(이어 하기) 또는 정의(시험용). 없으면 판이 골라요 */
  constructor(readonly run: Run, event?: string | EventDef) {
    this.event = typeof event === "string" ? eventDef(event) : event ?? run.pickEvent();
  }

  get step(): EventStep {
    return this._step;
  }

  /** 이 결과로 고를 수 있는 덱 카드 uid */
  candidates(mode: DeckPickOutcome): number[] {
    const deck = this.run.deck.filter((c) => cardDef(c.cardId).obtain !== "generated");
    return (mode === "upgradeCard" ? deck.filter((c) => this.run.canUpgrade(c.uid)) : deck).map((c) => c.uid);
  }

  /** 고를 수 있는 선택지: 덱에서 고를 카드가 없으면 고를 수 없어요 */
  canChoose(i: number): boolean {
    const opt = this.event.options[i];
    if (!opt || this._step.kind !== "choose") return false;
    const pick = pickOf(opt.outcome);
    return !pick || this.candidates(pick).length > 0;
  }

  preview(i: number): EventPreview {
    const outs = this.event.options[i].outcome;
    // 판을 통째로 복사해 결과를 적용해 보고 차이를 읽어요. 카드 보상과 덱 고르기는 고른 뒤에 정해져서 빼요
    const trial = Run.load(this.run.save());
    apply(trial, outs.filter((o) => o.type !== "cardReward" && !PICK.includes(o.type as DeckPickOutcome)));
    const out: EventPreview = { hp: {}, maxHp: {}, cards: outs.some((o) => o.type === "cardReward"), pick: pickOf(outs) };
    if (trial.gold !== this.run.gold) out.gold = { from: this.run.gold, to: trial.gold };
    for (const s of this.run.spirits) {
      const t = trial.spirit(s.id);
      if (t.hp !== s.hp) out.hp[s.id] = { from: s.hp, to: t.hp };
      if (maxHpOf(t) !== maxHpOf(s)) out.maxHp[s.id] = { from: maxHpOf(s), to: maxHpOf(t) };
    }
    return out;
  }

  /** 선택지를 골라요. 덱에서 고를 카드가 있으면 고르기로, 아니면 바로 적용해요. 적용했거나 고르기로 넘어가면 true */
  choose(i: number): boolean {
    if (!this.canChoose(i)) return false;
    const pick = pickOf(this.event.options[i].outcome);
    if (pick) this._step = { kind: "pick", option: i, mode: pick };
    else this.finish(i);
    return true;
  }

  /** 카드를 고르다가 선택지로 돌아가요 (아직 아무것도 적용되지 않았어요) */
  cancelPick() {
    if (this._step.kind === "pick") this._step = { kind: "choose" };
  }

  /** 덱 카드를 고르고 확인했어요. 선택지 전체를 적용해요 */
  pick(uid: number): boolean {
    const st = this._step;
    if (st.kind !== "pick" || !this.candidates(st.mode).includes(uid)) return false;
    this.finish(st.option, uid);
    return true;
  }

  /** 카드 보상을 받거나 넘겼어요 */
  finishCards() {
    if (this._step.kind === "cards") this._step = { kind: "done" };
  }

  private finish(i: number, uid?: number) {
    const cards = apply(this.run, this.event.options[i].outcome, uid);
    this._step = cards ? { kind: "cards", cardIds: cards } : { kind: "done" };
  }
}

/** 결과를 차례로 적용해요. 카드 보상을 뽑았으면 그 카드 id들을 돌려줘요 */
function apply(run: Run, outs: readonly EventOutcome[], uid?: number): string[] | undefined {
  let cards: string[] | undefined;
  for (const o of outs) {
    switch (o.type) {
      case "healPct": run.healAllPct(o.value); break;
      case "gold": run.gold = Math.max(0, run.gold + o.value); break;
      case "damageAll": for (const s of run.spirits) s.hp = Math.max(1, s.hp - o.value); break;
      case "damageFront": { const s = run.spirit(run.frontId); s.hp = Math.max(1, s.hp - o.value); break; }
      case "maxHpAll": for (const s of run.spirits) { s.maxHpBonus += o.value; s.hp = Math.min(maxHpOf(s), s.hp + o.value); } break;
      case "cardReward": cards = run.rollCards(EVENT_CARD_CHOICES, C.reward.rarity_normal, o.rarity).map((c) => c.id); break;
      case "removeCard": if (uid !== undefined) run.removeCard(uid); break;
      case "upgradeCard": if (uid !== undefined && canUpgradeCard(cardDef(run.deck.find((c) => c.uid === uid)!.cardId))) run.upgradeCard(uid); break;
      case "duplicateCard": if (uid !== undefined) run.duplicateCard(uid); break;
    }
  }
  return cards;
}
