// 고정 장면 (?screen=event&scene=<이벤트 id>). 씨앗을 정한 런 위에 실제 이벤트 규칙을 써요. 화면 확인용이에요.
import { EVENTS } from "../../core/data";
import { Run } from "../../core/run";
import { EventSession } from "../../session/event";

/** 파티 순서대로 지금 HP */
const HP = [22, 40, 17];

export function eventSession(id?: string): EventSession {
  const run = new Run({ seed: 11, frontId: "glass_salamander", adult: false, unlockAll: true });
  run.gold = 98;
  run.spirits.forEach((s, i) => { s.hp = Math.min(s.hp, HP[i] ?? s.hp); });
  const eventId = EVENTS.some((e) => e.id === id) ? id : EVENTS[0].id;
  return new EventSession(run, eventId);
}
