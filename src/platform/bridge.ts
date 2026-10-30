// Electron main · preload · 렌더러가 함께 쓰는 IPC 약속. 타입과 상수만 둬요(Node·DOM 의존 없음).

/** 렌더러가 window.platformBridge로 받는 객체의 모양. preload가 이걸 그대로 노출해요. */
export interface PlatformBridge {
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
  remove(key: string): Promise<void>;
  setFullscreen(on: boolean): Promise<void>;
  isFullscreen(): Promise<boolean>;
  quit(): Promise<void>;
}

export const IPC = {
  read: "platform:read",
  write: "platform:write",
  remove: "platform:remove",
  setFullscreen: "platform:setFullscreen",
  isFullscreen: "platform:isFullscreen",
  quit: "platform:quit",
} as const;

/** 저장 키는 파일 이름이 되므로 좁게 제한해요. 경로 조작(../)을 막는 1차 방어선이에요. */
export const STORAGE_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export function assertStorageKey(key: string): void {
  if (!STORAGE_KEY_RE.test(key)) throw new Error(`invalid storage key: ${JSON.stringify(key)}`);
}
