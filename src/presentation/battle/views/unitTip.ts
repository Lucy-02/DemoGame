// 가리킨 유닛의 설명판 내용 (0067 추기): 이름 줄(속성·약점 표지·등급·앞열 깃발), 상태(기호 + 이름 + 수), 적이면 행동 문장(정본 .etip).
// 모양은 툴팁 공용 스킨 GLASS.
import type * as Phaser from "phaser";
import type { TipContent } from "../../tooltip/content";
import { GLASS } from "../../tooltip/skins";
import type { BattleVM, UnitRef } from "../viewmodel";
import { unitTipHead } from "./units";

/** headless: 집중 보기용. 펼친 판에 이름·속성·상태가 이미 있으니 행동 문장만 (아군은 빈 내용) */
export function unitTipContent(scene: Phaser.Scene, vm: BattleVM, ref: UnitRef, headless = false): TipContent {
  const inner = GLASS.w - GLASS.pad[1] - GLASS.pad[3];
  const u = ref.side === "ally" ? { side: "ally" as const, vm: vm.allies[ref.i] } : { side: "enemy" as const, vm: vm.enemies[ref.i] };
  const head = headless ? [] : unitTipHead(scene, u, inner).map((node) => ({ kind: "node", node } as const));
  const lines = u.side === "enemy" ? (u.vm.tip?.lines ?? []).map((l) => ({ kind: "text", role: "body", text: l } as const)) : [];
  return [...head, ...lines];
}
