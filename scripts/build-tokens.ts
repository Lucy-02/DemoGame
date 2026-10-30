// design/tokens/tokens.json(DTCG) → src/design/tokens.ts. 생성 파일은 손으로 고치지 않아요.
// "{palette.ink}" 같은 참조는 여기서 실제 값으로 풀어요.
import { readFileSync, writeFileSync } from 'node:fs';

type Node = Record<string, unknown>;
const src = JSON.parse(readFileSync('design/tokens/tokens.json', 'utf8')) as Node;
const todos: string[] = [];
const REF = /^\{([^}]+)\}$/;

function lookup(path: string, seen: string[]): unknown {
  if (seen.includes(path)) throw new Error(`토큰 참조가 돌고 있어요: ${[...seen, path].join(' → ')}`);
  let node: unknown = src;
  for (const k of path.split('.')) node = (node as Node | undefined)?.[k];
  if (!node || typeof node !== 'object' || !('$value' in node)) throw new Error(`없는 토큰을 참조해요: {${path}}`);
  return resolve((node as Node).$value, [...seen, path]);
}

function resolve(v: unknown, seen: string[]): unknown {
  const m = typeof v === 'string' ? REF.exec(v) : null;
  return m ? lookup(m[1], seen) : v;
}

function walk(node: Node, path: string[]): unknown {
  if ('$value' in node) {
    const v = resolve(node.$value, [path.join('.')]);
    if (v === 'TODO_TOKEN') todos.push(path.join('.'));
    return v;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || typeof v !== 'object' || v === null) continue;
    out[k] = walk(v as Node, [...path, k]);
  }
  return out;
}

const tree = walk(src, []);
const body = `// 자동 생성: pnpm tokens (원본 design/tokens/tokens.json). 직접 고치지 마세요.
export const TODO_TOKEN = 'TODO_TOKEN' as const;

export const tokens = ${JSON.stringify(tree, null, 2)} as const;

/** 아직 Lucy가 정하지 않은 토큰 경로 */
export const todoTokens: readonly string[] = ${JSON.stringify(todos, null, 2)};

export function isTodo(v: unknown): v is typeof TODO_TOKEN {
  return v === TODO_TOKEN;
}
`;
writeFileSync('src/design/tokens.ts', body);
console.log(`tokens.ts 생성: 미정 ${todos.length}개`);
