# 0001 · 실 클라이언트 구조 (2026-10-30)

- 상태: ✅ Lucy 확정 (화면 경계 C안, 2026-10-30)
- 제안서 원문: https://claude.ai/artifact/UhT7tjwG62T3tkWzx4RW2T

## 결정

1. **화면 경계 = C안.** 전투·지도·카드·HUD 등 게임 화면은 전부 Phaser가 그려요. DOM은 설정·일시정지·세이브 슬롯·크레딧·디버그 같은 앱 메뉴에만 쓰고, Preact + vanilla-extract(`*.css.ts`)로 만들어요. (기각: A 전부 Phaser — 메뉴 UI를 직접 만들어야 함 / B DOM HUD — CSS가 화면마다 퍼지고 캔버스와 깊이·연출 맞추기 어려움)
2. **레이어와 의존 방향.** 아래 층은 위 층을 몰라요. `.dependency-cruiser.cjs`가 강제해요.

```
electron/main     창, app:// 프로토콜, 저장 IPC (나중에 Steamworks)
electron/preload  window.platformBridge 하나만 노출 (샌드박스, CJS)
src/app           부트, 서비스 연결
src/presentation  Phaser 화면: scenes / views / viewmodels / fx / style / placeholder(임시 UI)
src/menu          DOM 앱 메뉴 (C안)
src/session       명령 받기 → core 호출 → 이벤트, 세이브 스냅샷
src/core          규칙. 순수 TS
src/data          JSON (+ 스키마)
src/platform      Platform 인터페이스, Electron/웹 구현. 저장은 문자열만
```

3. **화면은 명령만 보내고, 연출은 확정된 결과만 보여줘요.** 연출 구조는 `design/card/research/R3-vfx-animation-architecture.md` §2의 Director + Sequencer를 따라요.
4. **스타일 값은 `design/tokens/tokens.json` 한 곳.** 새 폴더는 `design/strict-paths.txt`에 넣어 리터럴을 막아요.
5. **결정성.** 한 판 = 시드 + 명령 목록. 골든 테스트(`src/core/battle.golden.test.ts`)가 규칙 변화를 잡아요.
6. **Electron 보안.** contextIsolation·sandbox 켜기, nodeIntegration 끄기, 렌더러는 `app://`로 서빙, 저장 키는 `^[a-z0-9][a-z0-9_-]{0,31}$`만.

## 순서

- PR 1 (이 문서와 함께): Electron 셸, platform, 폴더 이동, Vitest·골든·e2e, 의존 규칙, CI
- PR 2: session 층 (`getRun/setRun` 제거, 명령 dispatch, 칸 사이 저장)
- PR 3: 연출 시퀀서 (core에 이벤트 추가는 Lucy 확인 후)
- 그 뒤: DOM 메뉴 층, 확정된 디자인으로 뷰 교체

## 남은 질문

- Spine 에디터 4.2 / 4.3 (런타임을 거기에 맞춰 고정)
- 기준 해상도·화면비 대응 (디자인 시스템 §4)
- 글꼴 번들 (Orbit·Pretendard, 지금은 임시 UI가 Google Fonts CDN 사용)
