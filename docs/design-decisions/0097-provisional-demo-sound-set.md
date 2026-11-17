# 0097. 임시 데모 소리 세트

- 날짜: 2026-11-18
- 단계: P6 엔진 구현
- 라운드: 프로젝트 스레드 "소리 기본 세트 정하고 넣기"
- 상태: 수락됨 (Lucy 2026-11-18 "소리는 네가 알아서 … 지금은 임시 데모로 잡고 진행"). 최종 소리는 Lucy가 따로 정해요
- 앞 결정: 0087, 0091

## 판단
1. **임시 세트를 연결해요.** 효과음 사건 28개(파일 35개)와 음악 넷. 전투 · 상태 · UI는 Leohpaz RPG Essentials SFX (Free), 빈 곳은 Ovani Sound FX Starter Pack Vol. 1, 음악은 AlkaKrab Free 25 Fantasy RPG Game Tracks의 루프(메인 Ambient 3, 지도 Ambient 4, 전투 Action 1, 보스 Action 3).
2. **아무도 듣지 않고 골랐어요.** 이름 · 길이 · 음량으로만 골랐고, 기준 음량(-18 LUFS, 음악 -20)에 맞췄어요. 사건별 음량(`gain`)은 비워 뒀어요.
3. **새 손패(`hand.new`)는 비워 뒀어요.** 맞는 소리가 크레딧 필수 팩(JDSherbert)에만 있어서, 크레딧 화면이 생기기 전에는 넣지 않아요.
4. **파일은 저장소 밖.** 맥의 `~/workspace/jjal/sound-packs/game/`에 있고 `pnpm audio`가 `public/assets/audio/`로 가져와요. 저장소와 CI에는 소리 파일이 없어서 거기서는 조용해요. 출처는 `assets/provenance.jsonl`에 `placeholder`로 적었어요.
5. **갈아 끼울 때**는 사건 이름은 그대로 두고 `bank.json`의 파일 이름과 소리 폴더만 바꿔요.

## 알아 둘 것
- AlkaKrab 음악은 오픈소스 게임에 넣으려면 허락이 필요하다고 적혀 있어요. 파일을 공개 저장소에 넣지 않는 한 해당하지 않지만, 데모를 밖에 내기 전에 다시 확인해요.
- 지도 이동 소리는 0.08초로 아주 짧고, 상태 · 타격 보통 소리는 기준보다 작아요. 들어 보고 `gain`으로 맞춰요.
