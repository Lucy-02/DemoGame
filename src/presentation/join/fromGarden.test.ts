// 깃들기 · 출전 준비 화면 값: 규칙(core/garden)이 정한 후보 · 성격 · 앞열을 그대로 옮겨요
import { describe, expect, it } from "vitest";
import { endRun, join, joinCandidates, startGarden } from "../../core/garden";
import { departVM } from "../depart/fromGarden";
import { joinVM, signatureCard } from "./fromGarden";

describe("깃들기 화면 값", () => {
  const g = endRun(startGarden(11));

  it("후보 둘과 후보마다의 성격, 대표 카드를 보여요 (0076 12)", () => {
    const vm = joinVM(g);
    const cands = joinCandidates(g);
    expect(vm.cands.map((c) => c.id)).toEqual(cands.map((c) => c.id));
    expect(vm.cands[0].personality.name).not.toBe(vm.cands[1].personality.name);
    for (const c of vm.cands) expect(c.card.key).toBe(signatureCard(c.id));
    expect(vm.party).toHaveLength(1);
    expect(vm.prev).toBeUndefined();
  });

  it("연달아 둘째 깃들기만 앞서 고른 얼굴을 가져요 (0078 고칠 점 3)", () => {
    const id = joinCandidates(g)[0].id;
    expect(joinVM(join(g, id), id).prev).toBeDefined();
  });

  it("출전 준비는 가진 정령 모두와 기본 앞열, 오늘 센 기운을 보여요 (0076 14)", () => {
    const two = join(g, joinCandidates(g)[0].id);
    const vm = departVM(two, { strongElement: "forest", front: two.spirits[1].id });
    expect(vm.seats.map((s) => s.id)).toEqual(two.spirits.map((s) => s.id));
    expect(vm.front).toBe(two.spirits[1].id);
    expect(vm.strong.icon).toBe("el-forest");
  });
});
