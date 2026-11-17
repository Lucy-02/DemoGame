// 소리를 게임에 달아요. 화면은 `audioOf(scene)?.play("card.play")`처럼 불러요. 소리 층이 없으면(테스트 · 지원 안 하는 환경) 아무 일도 없어요.
import * as Phaser from "phaser";
import { tokens } from "../../design/tokens";
import { ms } from "../style/ease";
import { AudioDirector, type Volumes } from "./AudioDirector";
import { BANK, SFX_IDS, type SfxId } from "./sounds";

export { AudioDirector, type Volumes } from "./AudioDirector";
export type { Bus, MusicId, SfxId } from "./sounds";

const KEY = "audio";
/** 게임 오브젝트에 `setData(SFX_DATA, "map.move")`로 누를 때 날 소리를 바꾸고, false로 끄세요 */
export const SFX_DATA = "sfx";

export function audioOf(from: Phaser.Scene | Phaser.Game): AudioDirector | undefined {
  const game = from instanceof Phaser.Game ? from : from.game;
  return game.registry.get(KEY) as AudioDirector | undefined;
}

export function installAudio(game: Phaser.Game, volumes: Volumes): AudioDirector | undefined {
  if (typeof AudioContext === "undefined") return undefined;
  const audio = new AudioDirector(BANK, ms(tokens.provisional.motion.musicFade.duration) / 1000);
  audio.setVolumes(volumes);
  game.registry.set(KEY, audio);
  const unlock = () => audio.unlock();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => audio.setHidden(document.hidden));
  installUiSounds(game, audio);
  return audio;
}

const isSfx = (v: unknown): v is SfxId => (SFX_IDS as readonly unknown[]).includes(v);

/**
 * 누를 수 있는 것(누름 · 뗌을 듣는 오브젝트)에 올리면 호버 소리, 누르면 클릭 소리.
 * 화면마다 달지 않고 한 곳에서 달아요. 장면이 다시 시작되면 입력 구독이 지워져서 단계마다 확인해요.
 */
function installUiSounds(game: Phaser.Game, audio: AudioDirector) {
  const pressable = (o: Phaser.GameObjects.GameObject) => o.listenerCount("pointerup") + o.listenerCount("pointerdown") > 0;
  const custom = (o: Phaser.GameObjects.GameObject): unknown => o.data?.get(SFX_DATA);
  const down = (_p: Phaser.Input.Pointer, o: Phaser.GameObjects.GameObject) => {
    const c = custom(o);
    if (c === false) return;
    if (isSfx(c)) audio.play(c);
    else if (pressable(o)) audio.play("ui.click");
  };
  const over = (_p: Phaser.Input.Pointer, o: Phaser.GameObjects.GameObject) => {
    if (custom(o) !== false && pressable(o)) audio.play("ui.hover");
  };
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    for (const scene of game.scene.getScenes(true)) {
      const input = scene.input;
      if (!input || input.listeners(Phaser.Input.Events.GAMEOBJECT_DOWN).includes(down)) continue;
      input.on(Phaser.Input.Events.GAMEOBJECT_DOWN, down);
      input.on(Phaser.Input.Events.GAMEOBJECT_OVER, over);
    }
  });
}
