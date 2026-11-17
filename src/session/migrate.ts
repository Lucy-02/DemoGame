// 저장 형식 올리기. 저장 파일의 version이 지금보다 낮으면 한 단계씩 올려요.
// 형식을 바꿀 때: 버전 상수를 올리고, 옛 버전 번호 자리에 "그 버전 → 다음 버전" 함수를 더하고,
// `saves/`에 옛 저장 고정 파일을 하나 남겨 테스트(saves.test.ts)가 계속 읽게 해요.
export type SaveStep = (old: Record<string, unknown>) => Record<string, unknown>;

/** 읽은 저장을 지금 버전으로 올려요. 모양이 아니거나, 더 새 버전이거나, 올릴 길이 없으면 던져요 */
export function upgradeSave(raw: unknown, current: number, steps: Readonly<Record<number, SaveStep>>, name: string): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error(`${name} 저장 모양이 아니에요`);
  let save = raw as Record<string, unknown>;
  for (;;) {
    const v = save.version;
    if (v === current) return save;
    const step = typeof v === "number" ? steps[v] : undefined;
    if (!step) throw new Error(`${name} 저장 형식이 달라요: ${String(v)}`);
    save = step(save);
  }
}
