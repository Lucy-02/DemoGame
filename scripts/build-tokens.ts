// design/tokens/tokens.json(DTCG) → src/design/tokens.ts. 생성 파일은 손으로 고치지 않아요.
import { readFileSync, writeFileSync } from 'node:fs';

type Node = Record<string, unknown>;
const src = JSON.parse(readFileSync('design/tokens/tokens.json', 'utf8')) as Node;
const todos: string[] = [];

function walk(node: Node, path: string[]): unknown {
  if ('$value' in node) {
    if (node.$value === 'TODO_TOKEN') todos.push(path.join('.'));
    return node.$value;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') || typeof v !== 'object' || v === null) continue;
    out[k] = walk(v as Node, [...path, k]);
  }
  return out;
}

const tree = walk(src, []);
const body = `// 자동 생성: npm run tokens (원본 design/tokens/tokens.json). 직접 고치지 마세요.
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
