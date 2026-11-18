# 0147. 불여우 그림: 잿불 라인 s8105

- 날짜: 2026-11-18
- 단계: P6 엔진 구현
- 라운드: 프로젝트 스레드 "불여우 성체 그림 다시 뽑기" (시트 https://claude.ai/artifact/EGMKqUt7HmXqfdouSF3QYQ#ash)
- 상태: 수락됨 (Lucy 2026-11-17 "잿불 2라인으로 하자", 2026-11-18 "s8105 라인으로 가자")

## 결정
- 불여우 생김새는 **잿불 라인**이에요. 10월에 고른 라인(등불 심지 유체 · 불씨 드레스 성체 · 불새 각성체)의 형태와 구도에, 재 흰색 털 · 머리, 숯불 주홍 끝, 숯빛 귀끝, 꼬리 끝 숯불을 입혀요. 꼬리는 1 → 2 → 3.
- 칸은 **세 단계 모두 ash-r2 seed 8105**예요(유체 · 성체 · 각성체). 처음엔 유체 r1-8101을 임시로 넣었다가 Lucy 선택으로 바꿨어요. 후처리는 다른 정령과 같은 길(배경 제거 → 2× → 재묘사 denoise 0.55)이에요.
- 다시 갈아 끼울 땐 `tools/art/import-spirit-one.py <전달 폴더> fire_fox .`. 피팅 값(`spiritFit.json`)은 처음 값이라 피팅 페이지에서 고쳐요.

## 결과
- `public/assets/spirits/fire-fox/`, `spiritFrames.json` · `spiritFit.json`의 `fire_fox`, `assets/provenance.jsonl`(note에 Lucy 선택).
- 불여우가 빈 상자였던 정령 화면 · 손패 초상 · 순서표 얼굴 · 전투 유체 자리에 그림이 들어가요.
- 기존 원화는 세로 · 흰 배경 생성이라 다른 정령(정사각 · 회색)과 생성 규격이 달라요. 게임에서는 누끼라 차이가 없어요.
- 1라운드 새 컨셉 셋(`design/concepts/fire-fox/r1-looks.md`)은 참고용이에요.
