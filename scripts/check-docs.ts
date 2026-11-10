// 문서 검사: 결정 기록 번호·색인과 현행 문서의 경로.
// - 실패: 같은 번호의 결정 기록이 둘 이상, 색인 표가 없는 파일을 가리킴
// - 알림: 색인 표에 빠진 결정 기록, 현행 문서가 가리키는 없는 경로
// 사용: pnpm check:docs [--strict]  (--strict면 알림도 실패)
import { existsSync, globSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DECISIONS = "docs/design-decisions";
const strict = process.argv.includes("--strict");
const errors: string[] = [];
const warnings: string[] = [];

// ───────────────────────── 결정 기록 ─────────────────────────

const files = readdirSync(DECISIONS).filter((f) => /^\d{4}-.+\.md$/.test(f) && !f.startsWith("0000"));
const byNumber = new Map<string, string[]>();
for (const f of files) byNumber.set(f.slice(0, 4), [...(byNumber.get(f.slice(0, 4)) ?? []), f]);
for (const [n, fs] of byNumber) if (fs.length > 1) errors.push(`결정 번호 ${n}이 겹쳐요: ${fs.join(", ")}`);

const index = readFileSync(join(DECISIONS, "README.md"), "utf8");
const indexed = new Set([...index.matchAll(/^\| (\d{4}) \|/gm)].map((m) => m[1]));
for (const n of indexed) if (!byNumber.has(n)) errors.push(`색인 표의 ${n}에 해당하는 결정 기록 파일이 없어요`);
for (const n of [...byNumber.keys()].sort()) if (!indexed.has(n)) warnings.push(`색인 표(${DECISIONS}/README.md)에 ${n}이 빠졌어요`);

// ───────────────────────── 현행 문서의 경로 ─────────────────────────

/** 보관함과 수락된 결정 기록은 그때의 기록이라 검사하지 않아요 */
const SKIP = [/^node_modules\//, /^docs\/archive\//, /^design\/archive\//, /^docs\/design-decisions\/\d{4}-/, /\/rounds\//, /^design\/card\/research\//];
const ROOTS = "docs|design|src|tools|scripts|assets|electron|public|tests";
const PATH = new RegExp("`((?:" + ROOTS + ")/[^`\\s]+)`", "g");
/** 자리표시(NNNN, <id>), 생략(…), 묶음(a·b), 중괄호 묶음은 경로가 아니에요 */
const PLACEHOLDER = /NNNN|[<>…·{}]/;

for (const md of globSync("**/*.md").map((p) => p.replaceAll("\\", "/")).filter((p) => !SKIP.some((r) => r.test(p)))) {
  const text = readFileSync(md, "utf8");
  const missing = new Set<string>();
  for (const [, raw] of text.matchAll(PATH)) {
    if (PLACEHOLDER.test(raw)) continue;
    const path = raw.replace(/[.,:;)]+$/, "").replace(/\/$/, "");
    // `docs/design-decisions/0006`처럼 번호만 적은 것은 그 번호로 시작하는 파일이 있으면 돼요
    const found = path.includes("*") ? globSync(path).length > 0 : existsSync(path) || globSync(`${path}-*`).length > 0;
    if (!found) missing.add(raw);
  }
  if (missing.size) warnings.push(`${md}: 없는 경로 ${[...missing].join(", ")}`);
}

// ───────────────────────── 결과 ─────────────────────────

for (const w of warnings) console.log(`알림  ${w}`);
for (const e of errors) console.error(`실패  ${e}`);
const failed = errors.length + (strict ? warnings.length : 0);
console.log(`문서 검사: 결정 기록 ${files.length}개, 실패 ${errors.length}, 알림 ${warnings.length}`);
process.exit(failed ? 1 : 0);
