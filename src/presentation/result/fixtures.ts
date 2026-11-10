// 고정 장면 (?screen=result&scene=…). 런에 연결되기 전까지 화면 확인·시각 검증에 써요.
// normal은 E1 시안 프레임 f1과 같은 상황이에요: 불여우 · 유리 도롱뇽(쓰러졌다 돌아옴) · 안개 고양이(레벨 업 + 새 카드).
import { cardName } from "../../core/text";
import type { RunSpirit } from "../../core/types";
import { lane, rewardCard } from "./fromCore";
import type { ResultVM } from "./viewmodel";

const LEVEL = 3;
const spirit = (id: string, hp: number): RunSpirit => ({ id, hp, maxHpBonus: 0, stage: "baby", level: LEVEL, personality: "", equipment: [] });

const fox = spirit("fire_fox", 14);
const salamander = spirit("glass_salamander", 1);
const cat = spirit("mist_cat", 17);

export const RESULTS: Record<string, ResultVM> = {
  normal: {
    gold: { total: 146, gained: 18 },
    cards: [
      rewardCard("ember_flick", fox.id, { values: [{ icon: "kw-burn", n: 2 }] }),
      rewardCard("glass_shatter", salamander.id, { values: [] }),
      rewardCard("chill_wave", cat.id, { values: [{ icon: "kw-chill", n: 3 }] }),
    ],
    lanes: [
      lane(fox, { exp: { before: 0.48, after: 0.62 } }),
      lane(salamander, { exp: { before: 0.66, after: 0.8 }, down: true }),
      lane(cat, { exp: { before: 0, after: 0.07 }, levelUp: true, badges: ["g-up", "g-cardnew"], unlocked: [cardName("frost_bite")] }),
    ],
  },
};

export const DEFAULT_RESULT = "normal";
