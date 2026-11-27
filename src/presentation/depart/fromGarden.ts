// 정원 + 떠나기 전에 정한 판(센 기운 · 기본 앞열) → 출전 준비 값. 정령은 떠날 때의 모습(유체 Lv 1)이에요 (0157).
import { C, ELEMENT_NAME, PERSONALITIES, spiritDef } from "../../core/data";
import { toRunSpirit, type Garden } from "../../core/garden";
import type { Element } from "../../core/types";
import { ELEMENT_ICON } from "../faces";
import { personalityVM } from "../join/fromGarden";
import { lane } from "../run/fromCore";
import { spiritArt } from "../spiritArt";
import { ROLE_ICON } from "../spirits/fromGarden";
import type { DepartVM, SeatVM } from "./viewmodel";

export function departVM(g: Garden, plan: { strongElement: Element; front: string }): DepartVM {
  const seats = g.spirits.slice(0, C.party_size).map((s): SeatVM => {
    const def = spiritDef(s.id);
    const rs = toRunSpirit(s);
    const l = lane(rs);
    return {
      id: s.id, name: def.name, level: l.level, element: ELEMENT_ICON[def.element] ?? ELEMENT_ICON.none, role: ROLE_ICON[def.role],
      stats: l.stats, slots: l.slots, art: spiritArt(s.id, rs.stage),
      personality: personalityVM(s.personality),
      // 성격 데이터 순서대로 (고를 때마다 자리가 덜 바뀌어요)
      opened: PERSONALITIES.filter((p) => p.id !== s.personality && s.cleared?.includes(p.id)).map((p) => personalityVM(p.id)),
    };
  });
  return { strong: { icon: ELEMENT_ICON[plan.strongElement] ?? ELEMENT_ICON.none, name: ELEMENT_NAME[plan.strongElement] }, seats, front: plan.front };
}
