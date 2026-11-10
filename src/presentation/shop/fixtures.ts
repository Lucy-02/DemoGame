// 고정 장면 (?screen=shop&scene=…). 씨앗을 정한 런 위에 실제 상점 규칙으로 진열해요. 저장·지도가 연결되기 전까지 화면 확인용이에요.
import { Run } from "../../core/run";
import { ShopSession } from "../../session/shop";

interface ShopSetup {
  seed: number;
  gold: number;
  /** 파티 순서대로 지금 HP */
  hp: number[];
}

export const SHOPS: Record<string, ShopSetup> = {
  /** 골드가 넉넉하지 않아 비싼 카드는 못 사고, 셋 다 다친 상태 */
  normal: { seed: 11, gold: 146, hp: [19, 30, 12] },
  /** 빈손 */
  poor: { seed: 11, gold: 20, hp: [19, 30, 12] },
};

export const DEFAULT_SHOP = "normal";

export function shopSession(name?: string): ShopSession {
  const setup = SHOPS[name ?? DEFAULT_SHOP] ?? SHOPS[DEFAULT_SHOP];
  const run = new Run({ seed: setup.seed, frontId: "", adult: false, unlockAll: true });
  run.gold = setup.gold;
  run.spirits.forEach((s, i) => { s.hp = Math.min(s.hp, setup.hp[i] ?? s.hp); });
  return new ShopSession(run);
}
