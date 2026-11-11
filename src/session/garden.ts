// 정원 세션: 화면이 보내는 명령을 받아 core/garden 규칙을 부르고, 바뀐 상태를 알려요.
// 화면은 상태를 직접 고치지 않아요 (아키텍처 0001 "화면은 명령만 보내고"). 저장은 snapshot/restore로 (다음 단계에서 platform에 연결).
import {
  endRun, evolve, feed, join, markSeen, openBranches, startGarden, seeEpisode, spiritUnlocks, gardenSpirit, GARDEN_VERSION,
  type Garden,
} from "../core/garden";

export type GardenCommand =
  /** 키우기. 갈래 고르기면 고른 갈래 id (0027) */
  | { kind: "evolve"; id: string; branch?: string }
  | { kind: "feed"; id: string }
  | { kind: "seeEpisode"; id: string }
  /** 판이 끝났어요 (져도). received = 정령 id → 이번 탐험에서 받은 카드 id들 (Run.receivedBySpirit, 갈래 조건) */
  | { kind: "endRun"; received?: Record<string, string[]> }
  /** 깃들기 후보 가운데 하나를 골랐어요 (0053) */
  | { kind: "join"; id: string }
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
      case "endRun": return endRun(cmd.received ? openBranches(g, cmd.received) : g);
      case "join": return join(g, cmd.id);
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
