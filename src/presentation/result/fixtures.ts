// 고정 장면 (?screen=result&scene=…). 런에 연결되기 전까지 화면 확인·시각 검증에 써요.
// normal은 E1 시안 프레임 f1과 같은 상황이에요: 불여우 · 유리 도롱뇽(쓰러졌다 돌아옴) · 안개 고양이(레벨 업 + 새 카드).
import { cardName } from "../../core/text";
import type { RunSpirit } from "../../core/types";
import { cardVM, lane, statOf } from "../run/fromCore";
import { cardDef } from "../../core/data";
import type { ResultVM } from "./viewmodel";

const LEVEL = 3;
const spirit = (id: string, hp: number): RunSpirit => ({ id, hp, maxHpBonus: 0, stage: "baby", level: LEVEL, personality: "", equipment: [] });

const reward = (cardId: string, owner: string) => ({ card: cardVM(cardId, owner), owner, stat: statOf(cardDef(cardId)) });

const fox = spirit("fire_fox", 14);
const salamander = spirit("glass_salamander", 1);
const cat = spirit("mist_cat", 17);

export const RESULTS: Record<string, ResultVM> = {
  normal: {
    gold: { total: 146, gained: 18 },
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
};

export const DEFAULT_RESULT = "normal";
