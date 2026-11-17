// 의존 규칙 검사가 실제로 잡는지 스스로 확인해요 (`pnpm lint:deps`의 둘째 걸음).
// dependency-cruiser는 TypeScript 7을 아직 지원하지 않는다고 경고해요. 지금은 swc 파서로 읽어서 값 import와 타입 import를 모두 잡아요.
// 그 길이 끊기면(파서 · 버전이 바뀌어 TS 파일을 못 읽으면) 여기서 실패해요: 금지 방향 import를 심은 파일을 넣고 검사가 실패하는지 봐요.
import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const PROBES = [
  { file: "src/core/__depsProbe.ts", body: 'import "../presentation/game";\n', rule: "core-is-pure" },
  { file: "src/core/__depsProbe.ts", body: 'import type { Platform } from "../platform/types";\nexport type P = Platform;\n', rule: "core-is-pure" },
  { file: "src/platform/__depsProbe.ts", body: 'import "../session/game";\n', rule: "platform-is-leaf" },
];

let bad = 0;
for (const p of PROBES) {
  writeFileSync(p.file, p.body);
  try {
    const r = spawnSync("pnpm", ["exec", "depcruise", p.file, "--config", ".dependency-cruiser.cjs"], { encoding: "utf8", shell: process.platform === "win32" });
    const caught = r.status !== 0 && `${r.stdout}${r.stderr}`.includes(p.rule);
    if (!caught) {
      bad++;
      console.log(`✗ ${p.rule}: 금지 방향 import(${p.body.trim().split("\n")[0]})를 못 잡았어요`);
    }
  } finally {
    rmSync(p.file, { force: true });
  }
}
console.log(bad ? `의존 규칙 자체 점검: 못 잡은 것 ${bad}건` : `의존 규칙 자체 점검: 심은 위반 ${PROBES.length}건을 모두 잡았어요`);
process.exit(bad ? 1 : 0);
