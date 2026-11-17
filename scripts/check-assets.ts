// public/ 아래 이미지(퍼핏 압축 텍스처 .ktx 포함)와 소리가 assets/provenance.jsonl에 기록돼 있는지 검사해요.
// 인자 없음: 기록 없는 파일, 기록과 해시가 다른 파일, 근거가 빈 채 release로 올린 줄이 있으면 실패 (`pnpm check` · CI).
// --release: 위에 더해 status가 release가 아닌 파일이 있으면 실패 (출시 관문).
// --summary: 스팀 AI 공개 설문에 쓸 집계를 찍어요 (docs/release/AI_DISCLOSURE.md).
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface Entry { path: string; sha256?: string; status?: string; model?: string; seed?: unknown; prompt?: unknown }

const release = process.argv.includes("--release");
const summary = process.argv.includes("--summary");
const entries = new Map<string, Entry>();
for (const line of readFileSync("assets/provenance.jsonl", "utf8").split("\n")) {
  if (!line.trim()) continue;
  const e = JSON.parse(line) as Entry;
  entries.set(e.path, e);
}
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(png|jpe?g|webp|svg|ktx|ogg|mp3|wav)$/i.test(p) ? [p] : [];
  });
}

/** 생성 모델로 만든 줄인지 (`없음 (…)`은 손으로 만든 것) */
const generated = (e: Entry) => !!e.model && !e.model.startsWith("없음");
/**
 * 공개 근거의 빈칸: 모델이 추정 · 미확인이거나, 생성 값(seed · prompt)이 없는 줄.
 * 이런 줄은 임시로는 둘 수 있지만 release로 올릴 수 없어요 (스팀 설문 = 장부 = 스토어 문구).
 */
function gap(e: Entry): string {
  if (!generated(e)) return "";
  if (/추정|미확인/.test(e.model!)) return "모델 추정 · 미확인";
  if (e.seed == null || e.prompt == null) return "생성 값(seed · prompt) 없음";
  return "";
}

const onDisk = files("public").map((f) => ({ file: f, key: relative("public", f).replaceAll("\\", "/") }));

if (summary) {
  const rows = onDisk.map((f) => entries.get(f.key)).filter((e): e is Entry => !!e);
  const count = (pick: (e: Entry) => string) => {
    const c = new Map<string, number>();
    for (const e of rows) c.set(pick(e), (c.get(pick(e)) ?? 0) + 1);
    return [...c].sort((a, b) => b[1] - a[1]);
  };
  console.log(`빌드에 들어가는 파일 ${onDisk.length}개, 기록 ${rows.length}줄`);
  console.log("\n만든 방법 · 상태");
  for (const [k, n] of count((e) => `${generated(e) ? "생성 모델" : "손으로 만듦"} · ${e.status}`)) console.log(`  ${n}\t${k}`);
  console.log("\n모델");
  for (const [k, n] of count((e) => e.model ?? "(없음)")) console.log(`  ${n}\t${k}`);
  console.log("\n공개 근거의 빈칸 (release로 올릴 수 없는 줄)");
  for (const [k, n] of count(gap)) if (k) console.log(`  ${n}\t${k}`);
  process.exit(0);
}

let bad = 0;
for (const { file, key } of onDisk) {
  const e = entries.get(key);
  const problems: string[] = [];
  if (!e) problems.push("출처 기록 없음");
  else {
    if (e.sha256 && e.sha256 !== createHash("sha256").update(readFileSync(file)).digest("hex")) problems.push("기록과 해시가 달라요 (파일이 바뀌었으면 기록도 고쳐요)");
    if (e.status === "release" && gap(e)) problems.push(`release인데 ${gap(e)}`);
  }
  const notRelease = e && e.status !== "release" ? `상태 ${e.status}` : "";
  if (release && notRelease) problems.push(notRelease);
  if (problems.length) {
    bad++;
    console.log(`✗ ${key}: ${problems.join(", ")}`);
  } else if (notRelease && process.argv.includes("--verbose")) console.log(`· ${key}: ${notRelease}`);
}
const waiting = onDisk.filter(({ key }) => entries.get(key)?.status !== "release").length;
console.log(release ? `출시 점검: 문제 ${bad}건` : `출처 기록: 문제 ${bad}건 (임시 상태 ${waiting}개는 --release에서 봐요)`);
process.exit(bad ? 1 : 0);
