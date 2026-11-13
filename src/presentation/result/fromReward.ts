// 보상 세션 → 화면 값.
import { cardDef, equipDef } from "../../core/data";
import type { Run } from "../../core/run";
import { baseStat } from "../../core/stats";
import { describeCard, describeEquipTier, describeSignatureSwap } from "../../core/text";
import type { EquipTier, RunEquip, RunSpirit } from "../../core/types";
import type { RewardSession } from "../../session/reward";
import { cardVM, equipVM, lane, laneWith, statOf } from "../run/fromCore";
import type { LaneVM } from "../run/viewmodel";
import { COPY } from "./copy";
import type { EquipChipVM, EquipOfferVM, EquipOptionVM, EquipSheetVM, EquipStatId, ResultVM } from "./viewmodel";

const EQUIP_STATS: readonly string[] = ["hp", "power", "guard", "focus"] satisfies EquipStatId[];
const pct = (v: number) => `${Math.round(Math.abs(v) * 100)}%`;

/** 이 층이 조건 없이 주는 수치 (조건부 · 치명 · 스피드는 효과문으로 나와요) */
const chips = (tier: EquipTier): EquipChipVM[] => (tier.stats ?? [])
  .filter((m) => !m.when && EQUIP_STATS.includes(m.stat))
  .map((m) => ({ stat: m.stat as EquipStatId, neg: m.value < 0, label: `${m.value < 0 ? "-" : "+"}${m.op === "pct" ? pct(m.value) : Math.abs(m.value)}` }));

/**
 * 장비 하나의 설명. holder를 주면 그 정령이 지녔을 때의 모습이에요: 공명 점 상한, 갈래의 기술 카드, 그 정령 능력치로 계산한 카드 숫자.
 */
function sheet(run: Run, e: RunEquip, holder?: RunSpirit): EquipSheetVM {
  const def = equipDef(e.id);
  const item = equipVM(e, holder?.stage ?? "awakened");
  const tiers: EquipTier[] = [def.tiers[item.resonance - 1], ...(def.downside ? [def.downside] : [])];
  const out: EquipSheetVM = { item, chips: tiers.flatMap(chips), lines: tiers.flatMap(describeEquipTier) };
  if (def.signature && holder) {
    const swap = run.signatureSwap(holder, e);
    const inDeck = run.deck.some((c) => c.owner === holder.id && c.cardId === def.signature!.card);
    if (swap && inDeck) {
      out.lines.push(describeSignatureSwap(swap.from, swap.to));
      const st = { power: baseStat(holder, "power"), guard: baseStat(holder, "guard"), focus: baseStat(holder, "focus") };
      out.card = { vm: cardVM(swap.to, holder.id), text: describeCard(cardDef(swap.to), st) };
    } else if (!swap) {
      out.note = COPY.noBranch;
    }
  }
  return out;
}

/** 이 정령이 이 장비를 받는 방법 하나의 미리보기 */
function option(run: Run, equipId: string, before: RunSpirit, laneBefore: LaneVM, replace?: RunEquip): EquipOptionVM {
  const after = run.withEquipment(equipId, before.id, replace?.id);
  const got = after.equipment.find((e) => e.id === equipId)!;
  return {
    slot: after.equipment.indexOf(got), replace: replace?.id, after: laneWith(laneBefore, after),
    tip: { sheet: sheet(run, got, after), drop: replace && sheet(run, replace, before) },
  };
}

/** 정예 장비 하나를 파티가 받는 방법들 */
export function equipOffer(run: Run, equipId: string, lanes: LaneVM[]): EquipOfferVM {
  const def = equipDef(equipId);
  const fresh: RunEquip = { id: equipId, resonance: 1, from: "run" };
  const takers: EquipOfferVM["takers"] = {};
  for (const s of run.equipTakers(equipId)) {
    const l = lanes.find((x) => x.id === s.id);
    if (!l) continue;
    takers[s.id] = run.needsReplace(equipId, s.id)
      ? s.equipment.map((old) => option(run, equipId, s, l, old))
      : [option(run, equipId, s, l)];
  }
  // 받을 정령이 정해지기 전의 설명. 전용 무기는 주인이 정해져 있어서 주인이 받았을 때의 모습을 보여요
  const owner = def.owner ? run.equipTakers(equipId)[0] : undefined;
  const plain = owner ? sheet(run, run.withEquipment(equipId, owner.id, owner.equipment[0]?.id).equipment.find((e) => e.id === equipId)!, owner) : sheet(run, fresh);
  return {
    item: plain.item, gain: plain.chips, takers, tip: { sheet: plain },
    canSkip: Object.keys(takers).length > 0 && run.equipTakers(equipId).every((s) => run.needsReplace(equipId, s.id)),
  };
}

export function resultVM(s: RewardSession): ResultVM {
  // 경험 정산이 아직 런에 연결되지 않아서 링은 비어 있고 문턱 표식도 없어요 (0044 열린 질문)
  const lanes = s.run.spirits.map((rs) => lane(rs));
  return {
    gold: { total: s.run.gold, gained: s.gained },
    cards: s.offers.map((o) => ({
      card: cardVM(o.cardId, o.learners.length === 1 ? o.learners[0] : undefined),
      owners: o.learners, stat: statOf(cardDef(o.cardId)),
    })),
    skipGold: s.skipGold,
    lanes,
    equip: s.equipId ? equipOffer(s.run, s.equipId, lanes) : undefined,
  };
}
