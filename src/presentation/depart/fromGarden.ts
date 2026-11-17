// 정원 + 떠나기 전에 정한 판(센 기운 · 기본 앞열) → 출전 준비 값.
import { CARDS, C, ELEMENT_NAME, spiritDef } from "../../core/data";
import { toRunSpirit, todos, type Garden } from "../../core/garden";
import type { Element } from "../../core/types";
import { ELEMENT_ICON } from "../faces";
import { lane } from "../run/fromCore";
import { spiritArt } from "../spiritArt";
import { ROLE_ICON } from "../spirits/fromGarden";
import type { DepartVM, SeatVM } from "./viewmodel";

export function departVM(g: Garden, plan: { strongElement: Element; front: string }): DepartVM {
  const seats = g.spirits.slice(0, C.party_size).map((s): SeatVM => {
    const def = spiritDef(s.id);
    const l = lane(toRunSpirit(s));
    const fresh = todos(s).flatMap((t) => (t.kind === "unlock" ? CARDS.filter((c) => c.unlock === t.key) : []))[0];
    return {
      id: s.id, name: def.name, level: l.level, element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, role: ROLE_ICON[def.role],
      stats: l.stats, slots: l.slots, ...(fresh ? { newCard: fresh.name } : {}), art: spiritArt(s.id, s.stage),
    };
  });
  return { strong: { icon: ELEMENT_ICON[plan.strongElement] ?? ELEMENT_ICON.none, name: ELEMENT_NAME[plan.strongElement] }, seats, front: plan.front };
}
