// 보상 세션 → 화면 값.
import { cardDef, equipDef } from "../../core/data";
import type { Run } from "../../core/run";
import type { RunEquip, RunSpirit } from "../../core/types";
import type { RewardSession } from "../../session/reward";
import { cardVM, equipSheet, lane, laneWith, statOf } from "../run/fromCore";
import type { LaneVM } from "../run/viewmodel";
import type { EquipOfferVM, EquipOptionVM, ResultVM } from "./viewmodel";

const sheet = (run: Run, e: RunEquip, holder?: RunSpirit) =>
  equipSheet(e, holder, (cardId) => !!holder && run.deck.some((c) => c.owner === holder.id && c.cardId === cardId));

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
