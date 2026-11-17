/**
 * 렌더러가 바깥 세계(파일·창·앱 종료)에 닿는 유일한 길이에요.
 * 저장은 문자열만 다뤄요. JSON 모양·버전·마이그레이션은 session 층의 일이에요.
 */
export interface Platform {
  readonly kind: "electron" | "web";
  read(key: string): Promise<string | null>;
  write(key: string, text: string): Promise<void>;
  remove(key: string): Promise<void>;
  /** 덮어쓰기 직전에 남겨 둔 저장. 없으면 null (웹은 늘 null) */
  readBackup(key: string): Promise<string | null>;
  /** 못 읽는 저장을 옆에 치워 둬요. 그 키는 비어요 */
  setAside(key: string): Promise<void>;
  setFullscreen(on: boolean): Promise<void>;
  isFullscreen(): Promise<boolean>;
  /** 웹에서는 아무 일도 하지 않아요. */
  quit(): Promise<void>;
  /** 오류 기록 파일에 한 건 덧붙여요. 웹에서는 아무 일도 하지 않아요(콘솔에 이미 보여요). */
  logError(text: string): Promise<void>;
}
