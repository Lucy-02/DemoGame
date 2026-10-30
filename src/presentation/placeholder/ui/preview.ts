// ⚠ 임시 플레이스홀더 UI: 레이아웃·디자인 미확정. 디자인 확정 후 교체 예정.
import { getRun } from "../../../core/run";
import { baseStat } from "../../../core/stats";
import type { CasterStats } from "../../../core/text";

/** 전투 밖에서 카드 수치를 미리 보여줄 때 쓰는 정령 능력치 */
export function runStats(owner: string): CasterStats {
  const rs = getRun().spirit(owner);
  return { power: baseStat(rs, "power"), guard: baseStat(rs, "guard"), focus: baseStat(rs, "focus") };
}
