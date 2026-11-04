// 마우스 커서 (결정 0025: 깎은 보석). 브라우저(CSS) 커서라 화면이 버벅여도 커서는 늦지 않아요.
// 커서를 바꾸는 곳은 여기 하나예요. 화면은 Phaser의 useHandCursor만 쓰면 누를 수 있는 곳 위에서 hover 커서가 되고,
// 누르는 동안 press, 그 밖의 상태(grab·blocked·wait)는 push/pop으로 잠깐 덮어요.
// 파일: public/assets/ui/cursors/cursor-<상태>-{32,64}.png (원본 SVG 같은 폴더). 핫스팟은 모든 상태가 같아요.
import type * as Phaser from "phaser";

export type CursorState = "default" | "hover" | "press" | "grab" | "blocked" | "wait";

const DIR = "assets/ui/cursors";
/** 32×32 격자에서 화살 끝 (모든 상태 같음, 2x 파일도 이 1x 좌표를 써요) */
const HOT = { x: 6, y: 4 };
/** Phaser useHandCursor가 넣는 값. 이 값이 오면 hover 커서로 바꿔요 */
const HAND = "pointer";

type CursorHooks = {
  setCursor(io: Phaser.Types.Input.InteractiveObject): void;
  resetCursor(io: Phaser.Types.Input.InteractiveObject | null, forceReset?: boolean): void;
};

/** CSS cursor 값: 2x 화면은 64px 파일, 못 읽으면 32px, 그것도 안 되면 OS 커서 */
export function cursorCss(state: CursorState): string {
  const one = `${DIR}/cursor-${state}-32.png`;
  const two = `${DIR}/cursor-${state}-64.png`;
  const fallback = state === "hover" || state === "press" ? HAND : state === "blocked" ? "not-allowed" : state === "wait" ? "progress" : "default";
  return `-webkit-image-set(url("${one}") 1x, url("${two}") 2x) ${HOT.x} ${HOT.y}, url("${one}") ${HOT.x} ${HOT.y}, ${fallback}`;
}

/**
 * 게임 하나에 커서를 붙여요(부트 직후 한 번).
 * - 기본 커서를 바꾸고, Phaser가 useHandCursor 오브젝트 위에서 넣는 "pointer"를 hover 커서로 바꿔 끼워요.
 * - 누르는 동안은 press. 손을 떼면 그 자리 상태(hover/기본)로 돌아가요.
 * 돌려주는 push/pop: 끌기·대기처럼 잠깐 덮는 상태 (겹치면 마지막 것이 보여요).
 */
export function installCursor(game: Phaser.Game) {
  // setCursor·resetCursor는 Phaser 타입에 없지만(내부용) InputManager에 있는 메서드예요(4.2.1 InputManager.js)
  const input = game.input as Phaser.Input.InputManager & CursorHooks;
  const canvas = game.canvas;
  let over: CursorState = "default";
  let pressed = false;
  const stack: CursorState[] = [];
  const show = () => {
    const s = stack.length ? stack[stack.length - 1] : pressed && over === "hover" ? "press" : over;
    canvas.style.cursor = cursorCss(s);
  };
  input.setDefaultCursor(cursorCss("default"));
  const setCursor = input.setCursor.bind(input);
  input.setCursor = (io: Phaser.Types.Input.InteractiveObject) => {
    if (io.cursor === HAND) {
      over = "hover";
      show();
    } else {
      setCursor(io);
    }
  };
  const resetCursor = input.resetCursor.bind(input);
  input.resetCursor = (io: Phaser.Types.Input.InteractiveObject | null, forceReset?: boolean) => {
    over = "default";
    resetCursor(io, forceReset);
    show();
  };
  canvas.addEventListener("pointerdown", () => {
    pressed = true;
    show();
  });
  window.addEventListener("pointerup", () => {
    pressed = false;
    show();
  });
  show();
  return {
    push(state: CursorState) {
      stack.push(state);
      show();
    },
    pop(state: CursorState) {
      const i = stack.lastIndexOf(state);
      if (i >= 0) stack.splice(i, 1);
      show();
    },
  };
}
