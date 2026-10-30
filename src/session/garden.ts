// 정원 세션: 화면이 보내는 명령을 받아 core/garden 규칙을 부르고, 바뀐 상태를 알려요.
// 화면은 상태를 직접 고치지 않아요 (아키텍처 0001 "화면은 명령만 보내고"). 저장은 snapshot/restore로 (다음 단계에서 platform에 연결).
import {
  evolve, feed, markSeen, newGarden, reroll, rerollChoices, seeEpisode, spiritUnlocks, gardenSpirit, GARDEN_VERSION,
  type Garden,
} from "../core/garden";
import { Rng } from "../core/rng";

export type GardenCommand =
  | { kind: "evolve"; id: string }
  | { kind: "feed"; id: string }
  | { kind: "reroll"; id: string }
  | { kind: "seeEpisode"; id: string }
  /** 성장 길을 열어 이 정령의 해금을 봤어요 (배지가 사라져요) */
  | { kind: "seeUnlocks"; id: string };

export class GardenSession {
  private listeners = new Set<(g: Garden) => void>();
  private rng: Rng;

  constructor(private garden: Garden, seed = 1) {
    this.rng = new Rng(seed);
  }

  static fresh(seed: number) {
    return new GardenSession(newGarden(seed), seed);
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
      case "evolve": return evolve(g, cmd.id);
      case "feed": return feed(g, cmd.id);
      case "seeEpisode": return seeEpisode(g, cmd.id);
      case "seeUnlocks": {
        const s = gardenSpirit(g, cmd.id);
        const fresh = spiritUnlocks(s).filter((k) => !s.seen.includes(k));
        return fresh.length ? markSeen(g, cmd.id, fresh) : g;
      }
      case "reroll": {
        // 고르기(3화)는 화면이 생기면 choices를 보여 주고 고른 값으로 불러요. 지금은 첫 후보로
        const [pick] = rerollChoices(gardenSpirit(g, cmd.id), this.rng);
        return pick ? reroll(g, cmd.id, pick) : g;
      }
    }
  }

  /** 저장용 문자열 */
  snapshot(): string {
    return JSON.stringify(this.garden);
  }

  static restore(text: string, seed = 1): GardenSession {
    const g = JSON.parse(text) as Garden;
    if (g.version !== GARDEN_VERSION) throw new Error(`정원 저장 형식이 달라요: ${g.version}`);
    return new GardenSession(g, seed);
  }
}
