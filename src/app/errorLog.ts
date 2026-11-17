// 오류 기록: 렌더러에서 잡히지 않은 오류를 플랫폼의 기록 파일로 보내요 (0084 9번). 버전을 같이 적어요.
import type { Platform } from "../platform";

/** 한 번 켠 동안 보낼 기록 수. 같은 오류가 매 프레임 나도 파일이 불지 않게 해요 */
const MAX_PER_SESSION = 50;

export function installErrorLog(platform: Platform, version: string, target: Pick<Window, "addEventListener"> = window) {
  let sent = 0;
  const send = (kind: string, reason: unknown) => {
    if (sent++ >= MAX_PER_SESSION) return;
    const detail = reason instanceof Error ? reason.stack ?? `${reason.name}: ${reason.message}` : String(reason);
    void platform.logError(`v${version} ${kind} ${detail}`).catch(() => {});
  };
  target.addEventListener("error", (e) => send("error", (e as ErrorEvent).error ?? (e as ErrorEvent).message));
  target.addEventListener("unhandledrejection", (e) => send("unhandledrejection", (e as PromiseRejectionEvent).reason));
}
