// 정원 세션: 화면이 보내는 명령을 받아 core/garden 규칙을 부르고, 바뀐 상태를 알려요.
// 화면은 상태를 직접 고치지 않아요 (아키텍처 0001 "화면은 명령만 보내고"). 저장은 snapshot/restore로 (다음 단계에서 platform에 연결).
import {
  addDeed, endRun, evolve, feed, grantBattle, join, keepEquipment, markGuide, markSeen, setFront, openBranches, startGarden, seeEpisode, spiritUnlocks, gardenSpirit, GARDEN_VERSION,
  type BattleTier, type Garden,
} from "../core/garden";
import type { RunSpirit } from "../core/types";
import type { DeedKind, DeedTally } from "./deeds";

export type GardenCommand =
  /** 키우기. 갈래 고르기면 고른 갈래 id (0027) */
  | { kind: "evolve"; id: string; branch?: string }
  | { kind: "feed"; id: string }
  | { kind: "seeEpisode"; id: string }
  /** 이긴 전투 하나: 출전한 정령이 경험을, 정원이 재료를 받아요 */
  | { kind: "grantBattle"; party: string[]; tier: BattleTier }
  /** 이긴 전투에서 센 자람 조건 (0021 · 0045). 지금 진화 조건과 종류가 같은 것만 쌓여요 */
  | { kind: "deeds"; tally: DeedTally }
  /** 판이 끝났어요 (져도). received = 정령 id → 이번 탐험에서 받은 카드 id들 (Run.receivedBySpirit, 갈래 조건) */
  | { kind: "endRun"; received?: Record<string, string[]> }
  /** 판이 끝나고 남길 장비 (0056). keep = 정령 id → 남길 장비 id들 */
  | { kind: "keepEquipment"; party: readonly RunSpirit[]; keep: Record<string, string[]> }
  /** 깃들기 후보 가운데 하나를 골랐어요 (0053) */
  | { kind: "join"; id: string }
  /** 출전 준비에서 앞열을 정하고 떠나요. 다음 출전 준비의 기본값이 돼요 (0076 14) */
  | { kind: "setFront"; id: string }
  /** 안내를 한 번 짚었어요 (0095) */
  | { kind: "guide"; id: string }
  /** 성장 길을 열어 이 정령의 해금을 봤어요 (배지가 사라져요) */
  | { kind: "seeUnlocks"; id: string };

export class GardenSession {
  private listeners = new Set<(g: Garden) => void>();

  constructor(private garden: Garden) {}

  static fresh(seed: number) {
    return new GardenSession(startGarden(seed));
  }

  get state(): Garden {
    return this.garden;
  }

  onChange(f: (g: Garden) => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  dispatch(cmd: GardenCommand) {
    const next = this.apply(cmd);
    if (next === this.garden) return;
    this.garden = next;
    for (const f of this.listeners) f(next);
  }

  private apply(cmd: GardenCommand): Garden {
    const g = this.garden;
    switch (cmd.kind) {
      case "evolve": return evolve(g, cmd.id, undefined, cmd.branch);
      case "feed": return feed(g, cmd.id);
      case "seeEpisode": return seeEpisode(g, cmd.id);
      case "grantBattle": return grantBattle(g, cmd.party, cmd.tier);
      case "deeds":
        return Object.entries(cmd.tally).reduce(
          (acc, [id, row]) => (acc.spirits.some((s) => s.id === id)
            ? Object.entries(row).reduce((a, [kind, n]) => addDeed(a, id, kind as DeedKind, n ?? 0), acc)
            : acc),
          g,
        );
      case "endRun": return endRun(cmd.received ? openBranches(g, cmd.received) : g);
      case "keepEquipment": return keepEquipment(g, cmd.party, cmd.keep);
      case "join": return join(g, cmd.id);
      case "setFront": return setFront(g, cmd.id);
      case "guide": return markGuide(g, cmd.id);
      case "seeUnlocks": {
        const s = gardenSpirit(g, cmd.id);
        const fresh = spiritUnlocks(s).filter((k) => !s.seen.includes(k));
        return fresh.length ? markSeen(g, cmd.id, fresh) : g;
      }
    }
  }

  /** 저장용 문자열 */
  snapshot(): string {
    return JSON.stringify(this.garden);
  }

  static restore(text: string): GardenSession {
    const g = JSON.parse(text) as Garden;
    if (g.version !== GARDEN_VERSION) throw new Error(`정원 저장 형식이 달라요: ${g.version}`);
    return new GardenSession(g);
  }
}
