// 번들한 글꼴(Orbit, 빠진 글자는 Pretendard)을 문서에 올려요. 글꼴이 준비된 뒤에 Phaser를 시작해야 글자 폭이 맞아요.
import { tokens } from "../../design/tokens";

const FACES: [family: string, url: string][] = [
  ["Orbit", "assets/fonts/Orbit-Regular.ttf"],
  ["Pretendard", "assets/fonts/Pretendard-Regular.woff2"],
];

export const FONT_STACK: string = tokens.font.body;

export async function loadFonts(): Promise<void> {
  await Promise.all(
    FACES.map(async ([family, url]) => {
      const face = new FontFace(family, `url(${url})`);
      document.fonts.add(await face.load());
    }),
  );
}
