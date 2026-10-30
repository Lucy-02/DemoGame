// 정본 페이지의 <symbol>을 한 장씩 SVG 파일로 꺼내요.
// 한 가지 색으로 칠하는 기호는 흰색으로 저장해서 Phaser에서 틴트로 색을 입혀요. 여러 색이 박힌 그림(en-*)은 그대로 둬요.
// 사용: pnpm tsx tools/canon/extract-icons.ts design/canon/battle-r5/page.html public/assets/ui/icons
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [page, outDir] = process.argv.slice(2);
if (!page || !outDir) throw new Error("usage: extract-icons <page.html> <outDir>");

const html = readFileSync(page, "utf8");
const SYMBOL = /<symbol id="([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g;
mkdirSync(outDir, { recursive: true });

const ids: string[] = [];
for (const [, id, viewBox, body] of html.matchAll(SYMBOL)) {
  const multicolor = /fill="#/.test(body);
  const fill = multicolor ? "" : ' fill="#ffffff"';
  const [, , w, h] = viewBox.split(" ");
  // currentColor는 CSS color(= 칠할 색)를 따르니 흰색으로 바꿔 틴트에 맡겨요.
  const inner = multicolor ? body : body.replaceAll("currentColor", "#ffffff");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}"${fill}>${inner}</svg>\n`;
  writeFileSync(join(outDir, `${id}.svg`), svg);
  ids.push(id);
}
writeFileSync(join(outDir, "index.json"), JSON.stringify(ids, null, 2) + "\n");
console.log(`${ids.length}개 기호를 ${outDir}에 꺼냈어요`);
