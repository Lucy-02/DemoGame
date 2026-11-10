// 카드 정의 묶음. 카드는 아무 묶음 파일에나 넣을 수 있고, 게임은 아래 순서대로 이어 붙인 한 목록으로 써요.
// 새 묶음 파일을 만들면 여기에 더해요 (data.test.ts가 빠진 파일을 잡아요).
import fire from "./fire.json";
import water from "./water.json";
import wind from "./wind.json";
import light from "./light.json";
import earth from "./earth.json";
import forest from "./forest.json";
import none from "./none.json";

export const CARD_FILES: Record<string, unknown[]> = { fire, water, wind, light, earth, forest, none };
