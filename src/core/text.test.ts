import { describe, expect, it } from "vitest";
import { CARDS, cardDef } from "./data";
import { andThen, hasBatchim, josa, polite } from "./korean";
import { describeCard } from "./text";

describe("한국어 도우미", () => {
  it("받침으로 조사를 골라요. 숫자는 읽는 소리로", () => {
    expect([josa("불여우", "이/가"), josa("유리 도롱뇽", "이/가"), josa("성체", "으로/로"), josa("물", "으로/로")])
      .toEqual(["불여우가", "유리 도롱뇽이", "성체로", "물로"]);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 100].map((n) => hasBatchim(String(n))))
      .toEqual([true, false, true, false, false, true, true, true, false, true, true, true]);
  });

  it("동사 줄기를 합니다체·연결형으로", () => {
    expect(["입히", "얻", "오르", "부여하", "뽑", "나서", "되"].map(polite))
      .toEqual(["입힙니다", "얻습니다", "오릅니다", "부여합니다", "뽑습니다", "나섭니다", "됩니다"]);
    expect(andThen("입히")).toBe("입히고");
  });
});

describe("카드 효과 문구 (0022)", () => {
  const text = (id: string) => describeCard(cardDef(id), null);

  it("Lucy 예시 그대로: 서술어가 있는 합니다체, 조건은 앞에", () => {
    expect(text("fire_claw")).toBe("피해를 6 입힙니다.");
    expect(text("backfire")).toBe("피해를 8 입힙니다. 대상이 화상 상태이면 피해를 추가로 8 입힙니다.");
  });

  it("대상은 효과마다. 같은 대상이 이어지면 한 번만", () => {
    expect(text("fire_storm")).toBe("모든 적에게 피해를 5 입히고 화상을 3 부여합니다.");
    expect(text("tempered_glass")).toBe("모든 아군이 방어도를 5 얻고 반격을 2 얻습니다.");
    expect(text("rally")).toBe("모든 아군의 싱크로율이 10%p 오릅니다.");
    expect(text("bubble_shield")).toBe("아군 하나에게 방어도를 5 줍니다.");
    expect(text("mend")).toBe("아군 하나의 HP를 4 회복합니다.");
  });

  it("다단 히트·연속·소멸·지속", () => {
    expect(text("double_strike")).toBe("피해를 3씩 2번 입힙니다.");
    expect(text("whirl_slash")).toBe("피해를 3 입힙니다. 연속 2: 피해를 3씩 2번 입힙니다.");
    expect(text("eternal_ice")).toBe("빙결시킵니다. 보스에게는 대신 냉기를 5 부여합니다. 소멸.");
    expect(text("blaze_aura")).toBe("지속. 이 정령이 화상을 부여할 때마다 화상을 1 더 부여합니다.");
  });

  it("시전 정령 능력치를 반영한 최종 수치를 써요", () => {
    expect(describeCard(cardDef("fire_claw"), { power: 15, guard: 10, focus: 10 })).toMatch(/^피해를 \d+ 입힙니다\.$/);
  });

  it("모든 카드: 마침표로 끝나고, 괄호 조사·명사 끝·× 기호가 없어요", () => {
    for (const c of CARDS) {
      const s = describeCard(c, null);
      expect(s, c.id).toMatch(/\.$/);
      expect(s, c.id).not.toMatch(/\(|×|→|!|,/);
      // 숫자 뒤 조사 없음 (고정 문구 "비용이 0이 됩니다"는 숫자가 바뀌지 않아요)
      expect(s.replace("0이 됩니다", ""), c.id).not.toMatch(/\d(을|를|이|가)\s/);
    }
    expect(Object.fromEntries(CARDS.map((c) => [c.name, describeCard(c, null)]))).toMatchSnapshot();
  });
});
