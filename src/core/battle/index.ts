// 전투 규칙. 구조: docs/architecture/0003-battle-engine.md
export { Battle } from "./battle";
export type { BCard, BEnemy, BSpirit, BattleEvent, BattleResult, EnemySlot, FallChoice, HoldState, Intent, Planned, Ref, StarState, StatusId, StatusMap, StatusStack } from "./state";
export { STATUS_IDS, statusN, statusStrength, stackOf } from "./state";
export { STATUSES } from "./statuses";
export { EFFECTS } from "./effects";
export { AURAS } from "./passives";
