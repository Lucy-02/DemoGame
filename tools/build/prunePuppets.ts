// 빌드 결과에서 게임이 부를 수 없는 퍼핏을 빼요. 퍼핏은 정령 데이터(src/data/spirits.json)에 있는 정령만 불러요(presentation/spirits/fromGarden.ts).
// 데이터에 아직 없는 정령의 퍼핏은 저장소(public/)에는 두고 패키지에만 넣지 않아요. 정령이 데이터에 들어오면 저절로 같이 들어가요.
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

/** 퍼핏 폴더 이름(fire-fox) 가운데 데이터에 없는 정령의 것 */
export function unusedPuppets(folders: readonly string[], spiritIds: readonly string[]): string[] {
  const used = new Set(spiritIds.map((id) => id.replaceAll("_", "-")));
  return folders.filter((f) => !used.has(f));
}

export function prunePuppets(): Plugin {
  let outDir = "";
  return {
    name: "prune-puppets",
    apply: "build",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const dir = join(outDir, "assets/puppets");
      if (!existsSync(dir)) return;
      const spirits = JSON.parse(readFileSync(resolve("src/data/spirits.json"), "utf8")) as { id: string }[];
      const folders = readdirSync(dir).filter((n) => statSync(join(dir, n)).isDirectory());
      const drop = unusedPuppets(folders, spirits.map((s) => s.id));
      for (const name of drop) rmSync(join(dir, name), { recursive: true });
      if (drop.length) console.log(`퍼핏 ${drop.length}개를 패키지에서 뺐어요 (데이터에 없는 정령): ${drop.join(", ")}`);
    },
  };
}
