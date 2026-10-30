// UI 코드에 색·폰트·크기·시간 리터럴이 직접 들어갔는지 검사해요.
// 테스트 파일(*.test.ts)은 검사하지 않아요. design/strict-paths.txt에 적힌 경로(접두사)는 위반 시 실패, 나머지는 보고만 해요.
// 사용: npm run check:design  (--all 이면 모든 경로를 엄격하게)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src'];
const SKIP = ['src/design', 'src/core', 'src/data'];
const RULES: [string, RegExp][] = [
  ['색 리터럴', /0x[0-9a-fA-F]{6}\b|['"`]#[0-9a-fA-F]{3,8}['"`]/g],
  ['폰트 이름', /fontFamily\s*:\s*['"`]/g],
  ['글자 크기', /fontSize\s*:\s*['"`]?\d/g],
  ['시간 값', /\bduration\s*:\s*\d/g],
];
const strictAll = process.argv.includes('--all');
const strict = existsSync('design/strict-paths.txt')
  ? readFileSync('design/strict-paths.txt', 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
  : [];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n).replaceAll('\\', '/');
    if (SKIP.some(s => p.startsWith(s))) return [];
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p) ? [p] : [];
  });
}

let failed = 0, reported = 0;
for (const f of ROOTS.flatMap(files)) {
  const lines = readFileSync(f, 'utf8').split('\n');
  const isStrict = strictAll || strict.some(s => f.startsWith(s));
  lines.forEach((line, i) => {
    for (const [name, re] of RULES) {
      if (line.match(re)) {
        if (isStrict) { failed++; console.error(`✗ ${f}:${i + 1} ${name}: ${line.trim()}`); }
        else reported++;
      }
    }
  });
}
console.log(`리터럴 검사: 엄격 경로 위반 ${failed}건, 보고만 한 위반 ${reported}건 (임시 UI 포함)`);
process.exit(failed ? 1 : 0);
