// 화면이 판 안 메뉴와 설정을 만나는 자리. 게임 흐름(flow.ts)이 registry에 올려 두고, 화면은 여기 함수만 불러요.
// 고정 장면(?screen=)처럼 흐름이 없으면 아무 일도 하지 않아요.
import type * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import type { SettingsSession } from "../../session/settings";
import { ms } from "../style/ease";

export const RUN_MENU_KEY = "runMenu";
export const SETTINGS_KEY = "settings";

type OpenMenu = (scene: Phaser.Scene) => void;

const opener = (scene: Phaser.Scene) => scene.game.registry.get(RUN_MENU_KEY) as OpenMenu | undefined;

/** 판 안 메뉴를 열 수 있는 화면인가 (톱니를 누를 수 있게 그릴지) */
export const hasRunMenu = (scene: Phaser.Scene) => !!opener(scene);

export const openRunMenu = (scene: Phaser.Scene) => opener(scene)?.(scene);

/** Esc로 판 안 메뉴를 열어요. 다시 그릴 때마다 불러도 한 번만 걸려요 (장면이 닫히면 Phaser가 지워요) */
export function bindMenuKey(scene: Phaser.Scene) {
  const kb = scene.input.keyboard;
  if (!kb || !hasRunMenu(scene) || kb.listenerCount("keydown-ESC")) return;
  kb.on("keydown-ESC", () => openRunMenu(scene));
}

export const settingsOf = (scene: Phaser.Scene) => (scene.game.registry.get(SETTINGS_KEY) as SettingsSession | undefined)?.state;

/** 턴 재생에 거는 배속 (0084 7번: 속도는 턴 재생에만 걸려요). 보통 = 1, 빠르게 = 보통 시간 ÷ 빠른 시간 */
export function playbackScale(scene: Phaser.Scene): number {
  const M = tokens.provisional.motion.playback;
  return settingsOf(scene)?.speed === "fast" ? ms(M.step) / ms(M.fastStep) : 1;
}
