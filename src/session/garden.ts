// 정원 세션: 화면이 보내는 명령을 받아 core/garden 규칙을 부르고, 바뀐 상태를 알려요.
// 화면은 상태를 직접 고치지 않아요 (아키텍처 0001 "화면은 명령만 보내고"). 저장은 snapshot/restore로 (다음 단계에서 platform에 연결).
import {
  choosePersonality, endRun, grantBattle, grantMidJoin, join, markGuide, setFront, startGarden, GARDEN_VERSION,
  type Garden, type RunOutcome,
} from "../core/garden";
import { PERSONALITIES, SPIRITS } from "../core/data";
import type { BattleTier } from "../core/growth";
import { upgradeSave, type SaveStep } from "./migrate";

/** 옛 정원 저장을 올리는 함수 (버전 n → n + 1) */
const GARDEN_STEPS: Readonly<Record<number, SaveStep>> = {
  /**
   * 1 → 2 (0157 · 0159): 성장과 장비가 판 안으로 들어가서 정원에는 줄과 성격만 남아요.
   * 판을 넘어 쌓였던 경험 · 단계 · 갈래 · 남긴 장비 · 재료 · 유대는 버려요.
   */
  1: (old) => {
    const { material: _m, ...rest } = old;
    const spirits = (Array.isArray(old.spirits) ? old.spirits : []).map((s: Record<string, unknown>) => ({ id: s.id, personality: s.personality }));
    return { ...rest, version: 2, spirits };
  },
};

/** 옛 정원 저장(판 저장에 든 떠날 때의 정원 포함)을 지금 버전으로 올려요 */
export const upgradeGarden = (raw: unknown) => upgradeSave(raw, GARDEN_VERSION, GARDEN_STEPS, "정원");

/** 저장에서 읽은 정원이 쓸 수 있는 모양인지 봐요. 아니면 던져요 (GameSession.load가 복구해요) */
function checkGarden(g: Garden): Garden {
  if (!Array.isArray(g.spirits) || g.spirits.length === 0) throw new Error("정원 저장에 정령이 없어요");
  for (const s of g.spirits) {
    const ok = typeof s === "object" && s !== null && SPIRITS.some((d) => d.id === s.id) && PERSONALITIES.some((p) => p.id === s.personality) && (s.cleared === undefined || Array.isArray(s.cleared));
    if (!ok) throw new Error(`정원 저장의 정령을 읽을 수 없어요: ${JSON.stringify(s)?.slice(0, 80)}`);
  }
  return g;
}

export type GardenCommand =
  /** 이긴 전투 하나. 첫 보스를 가라앉히면 정령이 하나 더 깃들어요 (0053) */
  | { kind: "grantBattle"; tier: BattleTier }
  /** 판이 끝났어요 (져도). done = 출전한 정령과 그 판의 성격, 완주했는지 (0157: 성격 열기) */
  | { kind: "endRun"; done?: RunOutcome }
  /** 완주로 연 성격 가운데 하나를 다음 판의 성격으로 골라요 (0157) */
  | { kind: "choosePersonality"; id: string; personality: string }
  /** 깃들기 후보 가운데 하나를 골랐어요 (0053) */
  | { kind: "join"; id: string }
  /** 혼자 떠난 첫 판이 정한 층을 마쳤어요. 둘째 정령이 깃들 차례예요 (0156) */
  | { kind: "grantMidJoin" }
  /** 출전 준비에서 앞열을 정하고 떠나요. 다음 출전 준비의 기본값이 돼요 (0076 14) */
  | { kind: "setFront"; id: string }
  /** 안내를 한 번 짚었어요 (0095) */
  | { kind: "guide"; id: string };

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
      case "grantBattle": return grantBattle(g, cmd.tier);
      case "endRun": return endRun(g, cmd.done);
      case "choosePersonality": return choosePersonality(g, cmd.id, cmd.personality);
      case "join": return join(g, cmd.id);
      case "grantMidJoin": return grantMidJoin(g);
      case "setFront": return setFront(g, cmd.id);
      case "guide": return markGuide(g, cmd.id);
    }
  }

  /** 저장용 문자열 */
  snapshot(): string {
    return JSON.stringify(this.garden);
  }

  static restore(text: string): GardenSession {
    const g = upgradeGarden(JSON.parse(text)) as unknown as Garden;
    return new GardenSession(checkGarden(g));
  }
}
