// 고정 장면 (?screen=result&scene=…). 런에 연결되기 전까지 화면 확인·시각 검증에 써요.
// normal은 E1 시안 프레임 f1과 같은 상황이에요: 불여우 · 유리 도롱뇽(쓰러졌다 돌아옴) · 안개 고양이(레벨 업 + 새 카드).
import { Run } from "../../core/run";
import { cardName } from "../../core/text";
import type { RunEquip, RunSpirit, Stage } from "../../core/types";
import { cardVM, lane, statOf } from "../run/fromCore";
import { C, cardDef } from "../../core/data";
import { equipOffer } from "./fromReward";
import type { ResultVM } from "./viewmodel";

const LEVEL = 3;
const spirit = (id: string, hp: number): RunSpirit => ({ id, hp, maxHpBonus: 0, stage: "baby", level: LEVEL, personality: "", equipment: [] });

const reward = (cardId: string, owner: string) => ({ card: cardVM(cardId, owner), owners: [owner], stat: statOf(cardDef(cardId)) });

const fox = spirit("fire_fox", 14);
const salamander = spirit("glass_salamander", 1);
const cat = spirit("mist_cat", 17);

/** 정예 장면 (Q2-A 프레임 f1 · f1b · f2): 런 하나를 세워 단계 · 갈래 · 지닌 장비를 맞춘 뒤 실제 규칙으로 미리보기를 만들어요 */
const kept = (id: string, resonance = 1): RunEquip => ({ id, resonance, from: "kept" });
function elite(equipId: string, party: Record<string, { stage: Stage; branch?: string; hp: number; equipment?: RunEquip[] }>): ResultVM {
  const run = new Run({ seed: 7, frontId: fox.id, adult: false, unlockAll: true });
  for (const s of run.spirits) Object.assign(s, { equipment: [] }, party[s.id]);
  const lanes = run.spirits.map((s) => lane(s));
  return {
    gold: { total: 187, gained: 31 },
    skipGold: C.reward.skip_gold,
    cards: [reward("ember_flick", fox.id), reward("glass_shatter", salamander.id), reward("chill_wave", cat.id)],
    lanes,
    equip: equipOffer(run, equipId, lanes),
  };
}

export const RESULTS: Record<string, ResultVM> = {
  normal: {
    gold: { total: 146, gained: 18 },
    skipGold: C.reward.skip_gold,
    cards: [
      reward("ember_flick", fox.id),
      reward("glass_shatter", salamander.id),
      reward("chill_wave", cat.id),
    ],
    lanes: [
      lane(fox, { exp: { before: 0.48, after: 0.62 } }),
      lane(salamander, { exp: { before: 0.66, after: 0.8 }, down: true }),
      lane(cat, { exp: { before: 0, after: 0.07 }, levelUp: true, badges: ["g-up", "g-cardnew"], unlocked: [cardName("frost_bite")] }),
    ],
  },
  /** 일반 장비를 셋 중 누구에게 (f1) */
  elite: elite("bone_sword", {
    fire_fox: { stage: "adult", branch: "burst", hp: 22 },
    glass_salamander: { stage: "awakened", branch: "hold", hp: 9, equipment: [kept("bronze_helmet")] },
    mist_cat: { stage: "baby", hp: 17 },
  }),
  /** 유니크 무기는 주인에게만, 대표 카드가 기술로 바뀌어요 (f1b) */
  eliteUnique: elite("fox_spear", {
    fire_fox: { stage: "adult", branch: "burst", hp: 22 },
    glass_salamander: { stage: "awakened", branch: "hold", hp: 9, equipment: [kept("bronze_helmet")] },
    mist_cat: { stage: "baby", hp: 17 },
  }),
  /** 셋 다 칸이 꽉 참: 내려놓을 것을 고르거나 넘겨요 (f2) */
  eliteFull: elite("round_shield", {
    fire_fox: { stage: "adult", branch: "burst", hp: 22, equipment: [kept("bone_sword")] },
    glass_salamander: { stage: "awakened", branch: "hold", hp: 9, equipment: [kept("salamander_gauntlet", 2), kept("bronze_helmet")] },
    mist_cat: { stage: "baby", hp: 17, equipment: [kept("short_bow")] },
  }),
};

export const DEFAULT_RESULT = "normal";
