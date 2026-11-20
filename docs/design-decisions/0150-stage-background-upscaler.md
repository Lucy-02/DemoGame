# 0150. 배경 업스케일러: IllustrationJaNai V3detail

- 날짜: 2026-11-20
- 단계: P6 엔진 구현 / 에셋
- 라운드: 배경 후처리
- 상태: 수락됨 (Lucy 2026-11-20)

## 맥락
0149에서 배경을 정령 그림과 같은 anime_6B로 키웠는데, 붓 자국이 납작한 색면으로 뭉개졌어요.

## 고려한 선택지
비교본(실제 픽셀 조각): https://claude.ai/artifact/DhjtDuuWQamxkjFHWRjM17
- anime_6B (RealESRGAN_x4plus_anime_6B)
- JaNai (4x_IllustrationJaNai_V3detail_DAT2_28k_bf16)
- UltraSharp (4x-UltraSharpV2)

## 결정 (Lucy)
- **배경은 JaNai로 키워요.** 1~5막 · 상점 여섯 장을 모두 다시 만들었어요.
- 공정: 원본(1216×768)을 4배 키운 뒤 LANCZOS로 2432×1536까지 줄여요(256px 타일, 겹침 32px). 그다음 후처리는 0149 그대로예요.

## 근거
원본의 붓결과 천 결이 가장 잘 남아요.

## 기각한 것과 이유
- anime_6B: 붓 자국이 납작해지고 셀화처럼 보여요.
- UltraSharp: 평평한 면에 잔 잡티가 남아요.

## 결과와 후속 작업
- `public/assets/stages/` 11장, `assets/provenance.jsonl`.
- 키운 원본: 프로젝트 파일 `stage-bg/up2x/compare/*-janai.png`, Drive `jjal-handoff/stage-bg-up2x/compare`.
- 정령 그림의 업스케일러(anime_6B)는 그대로예요.
