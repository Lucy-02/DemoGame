// 전투 이벤트 → 소리. 규칙이 확정한 결과만 들려줘요 (아키텍처 0001 3절).
import type { BattleEvent } from "../../core/battle";
import type { SfxId } from "./sounds";

/**
 * 타격의 세 무게 (0087): 치명 · 약점은 무겁게, 저항했거나 방어가 절반 넘게 받아 냈으면 가볍게, 나머지는 보통.
 * 방어가 다 받아 냈으면 타격 대신 방어 소리예요.
 */
function hit(ev: Extract<BattleEvent, { k: "damage" }>): SfxId | undefined {
  if (ev.amount <= 0) return ev.blocked > 0 ? "block" : undefined;
  if (ev.crit || ev.weakHit) return "hit.heavy";
  if (ev.resist || ev.blocked > ev.amount) return "hit.light";
  return "hit.medium";
}

export function cueOf(ev: BattleEvent): SfxId | undefined {
  switch (ev.k) {
    case "damage": return hit(ev);
    case "block": return "block";
    case "status":
    case "freeze": return "status";
    case "heal": return "heal";
    case "release": return "release";
    case "downed": return "down.ally";
    case "enemyDead": return "down.enemy";
    case "charge": return "charge";
    case "cancel": return "break";
    default: return undefined;
  }
}

/** 한 번에 나는 소리 묶음: 같은 소리는 한 번만 */
export function cuesOf(events: readonly BattleEvent[]): SfxId[] {
  const out: SfxId[] = [];
  for (const ev of events) {
    const id = cueOf(ev);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** 유닛에게 보이는 결과 (알약 · 쓰러짐) */
const shows = (ev: BattleEvent) => (ev.k === "damage" && ev.amount + ev.blocked > 0) || ev.k === "heal" || ev.k === "block" || ev.k === "downed" || ev.k === "enemyDead";

/**
 * 턴 재생에서 i번째 이벤트가 새 걸음을 여는지. 행동(정령 카드 · 적 행동)마다 한 걸음이고,
 * 턴 끝 효과(화상 등 행동자 없는 사건)는 보일 것이 있을 때만 자기 걸음을 가져요. 장면(playbackFrames)과 소리(playbackCues)가 같이 써요
 */
export function opensStep(events: readonly BattleEvent[], i: number): boolean {
  const ev = events[i];
  if (ev.k === "spiritAct" || ev.k === "enemyAct") return true;
  return ev.k === "turnEnd" && events.slice(i + 1).some(shows);
}

/**
 * 턴 재생의 장면마다 날 소리. playbackFrames와 같은 자리에서 끊어요:
 * 첫 장면은 재생 시작(소리 없음), 그 뒤로 걸음(opensStep)마다 한 장면이에요.
 */
export function playbackCues(events: readonly BattleEvent[]): SfxId[][] {
  const groups: BattleEvent[][] = [[]];
  let acted = false;
  events.forEach((ev, i) => {
    if (opensStep(events, i)) {
      if (acted) groups.push([]);
      acted = true;
    }
    groups[groups.length - 1].push(ev);
  });
  return acted ? [[], ...groups.map(cuesOf)] : [[]];
}
