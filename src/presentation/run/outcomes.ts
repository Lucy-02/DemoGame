// 선택지 효과 칩 (Lucy 2026-11-17: 기호를 쓰고 글은 짧게). 효과 하나 = 기호 + 짧은 명사구 한 조각.
// 효과문 전체(합니다체)는 쓰지 않아요. 대상 · 수치는 정령 줄 미리보기가 함께 보여줘요.
import { C, RARITY_NAME } from "../../core/data";
import type { EventOutcome } from "../../core/types";
import { EVENT_CARD_CHOICES } from "../../session/event";
import { COPY } from "./copy";

export interface FxVM {
  icon: string;
  text: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const F = COPY.fx;

export const FX_ICONS = ["fx-heal", "i-coin", "fx-damage", "g-up", "g-cardnew", "fx-discard"] as const;

/** 이벤트 결과 하나 → 칩 하나 (없으면 undefined) */
export function outcomeFx(o: EventOutcome): FxVM | undefined {
  switch (o.type) {
    case "healPct": return { icon: "fx-heal", text: F.healAll(pct(o.value)) };
    case "gold": return { icon: "i-coin", text: F.gold(o.value) };
    case "damageAll": return { icon: "fx-damage", text: F.hurtAll(o.value) };
    case "damageFront": return { icon: "fx-damage", text: F.hurtFront(o.value) };
    case "maxHpAll": return { icon: "g-up", text: F.maxHpAll(o.value) };
    case "cardReward": return { icon: "g-cardnew", text: F.cardReward(EVENT_CARD_CHOICES, o.rarity ? RARITY_NAME[o.rarity] : undefined) };
    case "removeCard": return { icon: "fx-discard", text: F.removeCard };
    case "upgradeCard": return { icon: "g-up", text: F.upgradeCard(pct(C.card_upgrade.pct)) };
    case "duplicateCard": return { icon: "g-cardnew", text: F.duplicateCard };
    default: return undefined;
  }
}

export const outcomesFx = (outs: readonly EventOutcome[]): FxVM[] => outs.map(outcomeFx).filter((f): f is FxVM => !!f);
