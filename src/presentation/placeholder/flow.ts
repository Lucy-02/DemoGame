// ⚠ 임시 UI가 판 세션에 닿는 길. 새 화면이 생기면 그 화면이 같은 일을 하고, 임시 장면과 함께 지워요.
// 임시 장면은 판을 직접 들지 않고, 게임 흐름(presentation/flow.ts)이 registry에 넣어 둔 이것으로 명령만 보내요.
import type * as Phaser from "phaser";
import type { Run } from "../../core/run";
import type { BattleOutcome } from "../../session/run";

export interface LegacyFlow {
  /** 지금 판 (끝난 판도 결과를 그리는 동안은 남아요) */
  readonly run: Run;
  /** 지도에서 칸에 들어가요 */
  enter(nodeId: string): void;
  /** 이벤트·휴식을 마치고 지도로 */
  leave(): void;
  /** 전투가 끝났어요. 보상 창은 이 장면 위에 띄워요 */
  battleOver(scene: Phaser.Scene, outcome: BattleOutcome): void;
  /** 판 결과에서 나가요 */
  finish(): void;
}

export const LEGACY_FLOW = "legacyFlow";

export const flowOf = (scene: Phaser.Scene) => scene.registry.get(LEGACY_FLOW) as LegacyFlow;
