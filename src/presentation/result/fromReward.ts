// 보상 세션 → 화면 값.
import { cardDef, equipDef } from "../../core/data";
import type { Run } from "../../core/run";
import { baseStat, maxHpOf, round } from "../../core/stats";
import { cardName, describeCard, describeEquipTier } from "../../core/text";
import type { EquipDef, RunEquip, RunSpirit } from "../../core/types";
import type { RewardSession } from "../../session/reward";
import { cardVM, equipVM, lane, laneWith, statOf } from "../run/fromCore";
import { COPY as RUN_COPY } from "../run/copy";
import type { LaneVM } from "../run/viewmodel";
import { COPY } from "./copy";
import type { EquipOfferVM, EquipOptionVM, EquipStatId, EquipTipVM, ResultVM, StatChangeVM } from "./viewmodel";

const EQUIP_STATS: readonly EquipStatId[] = ["hp", "power", "guard", "focus"];
const statValue = (rs: RunSpirit, k: EquipStatId) => (k === "hp" ? maxHpOf(rs) : round(baseStat(rs, k)));

/** 받기 전과 뒤의 수치 차이 */
function changes(before: RunSpirit, after: RunSpirit): StatChangeVM[] {
  return EQUIP_STATS.flatMap((stat) => {
    const from = statValue(before, stat), to = statValue(after, stat);
    return from === to ? [] : [{ stat, delta: to - from, from, to }];
  });
}

/** 장비의 한 공명 단계가 보여 주는 효과문 (대가는 따로) */
const tierLines = (def: EquipDef, resonance: number) => describeEquipTier(def.tiers[resonance - 1]);

/** 이 정령이 이 장비를 받는 방법 하나의 미리보기 */
function option(run: Run, equipId: string, before: RunSpirit, laneBefore: LaneVM, replace?: RunEquip): EquipOptionVM {
  const after = run.withEquipment(equipId, before.id, replace?.id);
  const def = equipDef(equipId);
  const got = after.equipment.find((e) => e.id === equipId)!;
  const item = equipVM(got, after.stage);
  const all = changes(before, after);
  const tip: EquipTipVM = {
    item,
    stats: replace ? all.filter((c) => c.delta > 0) : all,
    lines: [...tierLines(def, item.resonance), ...(def.downside ? describeEquipTier(def.downside) : [])],
  };
  if (def.signature) {
    const held = before.equipment.find((e) => e.id === equipId);
    const was = held ? run.signatureSwap(before, held)?.to ?? def.signature.card : def.signature.card;
    const now = run.signatureSwap(after, got);
    const inDeck = run.deck.some((c) => c.owner === before.id && c.cardId === def.signature!.card);
    if (now && inDeck) {
      tip.swap = { from: cardVM(was, before.id), to: cardVM(now.to, before.id) };
      // 바뀐 카드의 효과문 (받는 정령의 능력치를 반영한 숫자)
      tip.lines.push(describeCard(cardDef(now.to), { power: baseStat(after, "power"), guard: baseStat(after, "guard"), focus: baseStat(after, "focus") }));
    }
    else if (!now) tip.note = COPY.noBranch;
  }
  if (replace) {
    const old = equipDef(replace.id);
    const oldItem = equipVM(replace, before.stage);
    const back = run.signatureSwap(before, replace);
    tip.lose = {
      item: oldItem,
      back: back && `${cardName(back.to)}${RUN_COPY.arrow}${cardName(back.from)}`,
      stats: all.filter((c) => c.delta < 0),
      lines: [...tierLines(old, oldItem.resonance), ...(old.downside ? describeEquipTier(old.downside) : [])],
    };
  }
  return { slot: after.equipment.indexOf(got), replace: replace?.id, after: laneWith(laneBefore, after), tip };
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
  // 받을 정령이 정해지기 전: 공명 1의 고정 보정만 증감으로 보여요
  const gain: StatChangeVM[] = (def.tiers[0].stats ?? [])
    .filter((m) => !m.when && m.op === "add" && (EQUIP_STATS as readonly string[]).includes(m.stat))
    .map((m) => ({ stat: m.stat as EquipStatId, delta: m.value }));
  const item = equipVM(fresh, "awakened");
  return {
    item, gain, takers,
    tip: { item, stats: gain, lines: [...tierLines(def, 1), ...(def.downside ? describeEquipTier(def.downside) : [])] },
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
