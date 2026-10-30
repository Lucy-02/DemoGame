# 정본 (canon)

Lucy가 확정한 시안 원본을 그대로 보관해요. 실제 화면은 이 파일들과 **비율·배치·정렬이 같게** 만들고, `pnpm visual`로 겹쳐서 확인해요.

| 폴더 | 정본 | 원본 아티팩트 | 결정 |
| --- | --- | --- | --- |
| `battle-r5/` | 전투 R5 "판단 동선" (1280×800) | https://claude.ai/artifact/Kqa9pCZnjAs6juuboj1wRh (r5/page.html) | 장부 §2, 0007 |
| `spirit-r4v5/` | 정령 관리 R4 v5 (1280×800 프레임 5개) | https://claude.ai/artifact/NMVaQPmBkfaJrpX1A4MGWZ (index.html → page.html) | 장부 §3, 0006 |

- `page.html`, `*.css`, `img/`: 시안 소스 그대로 (수정 금지)
- `frame-*.png`: 시안을 만들 때 찍은 프레임 캡처
- 색 값은 `design/tokens/tokens.json`의 `palette`로, 배치 수치는 `src/presentation/<화면>/layout.ts`로 옮기고 출처 선택자를 주석에 적어요.
- 정본의 기호(`<symbol>`)는 `pnpm tsx tools/canon/extract-icons.ts design/canon/battle-r5/page.html public/assets/ui/icons`로 꺼내요.

## 시각 검증

```
pnpm visual                      # 전체 비교
pnpm visual --crop 760,6,370,50  # 영역 확대 비교 (x,y,w,h), 3배
```

결과는 `test-results/visual/`에 `canon.png`, `game.png`, `side.png`(나란히), `overlay.png`(반투명 겹침), `diff.png`(차이 = 분홍), `crop-*.png`로 나와요.
처음 한 번 `pnpm exec playwright install chromium`이 필요해요. 미리 깔린 크로미움을 쓰려면 `CHROMIUM_PATH=<경로>`.

## 정본에서 옮기지 않는 것 (Lucy 2026-10-30)
- 정본의 색·글자 크기·재질 무늬는 `design/tokens/tokens.json`의 `provisional` 구역에만 둬요. 확정 구역(color·font·size·motion·screen)은 Lucy가 고른 값만.
- 정본의 임시 그림(아군 실루엣 sil-*, 적 도형 en-*, 카드 그림 자리)은 쓰지 않고 `style/placeholder.ts`의 X 상자로 비워 둬요. 시각 검증에서 이 자리는 차이로 남아요.
- 기능 기호(수치·상태·시스템 기호)는 정본 SVG를 쓰되 `assets/provenance.jsonl`에 placeholder로 기록해 `pnpm check:assets --release`가 출시 전에 잡아요.

## 정령 관리 정본(`spirit-r4v5/`)에서 따르지 않는 것 (2026-10-31)
뼈대(띠 · 전면 일러스트 · 이름 카드 · 오른쪽 패널과 접힌 레일)는 0006·장부 §3 그대로 따라요. 시안을 만든 뒤(10/29 12:50) 나온 기획 답·결정과 어긋나는 내용은 옮기지 않아요.
- 정령 이름·속성·카드(불·해파리·별, 빛 속성, 태양 구슬 등) → 0017의 불여우 · 유리 도롱뇽 · 안개 고양이와 `src/data`
- 그림(`img/*.webp`)은 임시 그림이에요. 화면에서는 X 상자 자리로 비워 둬요.
- "레벨 없음 · 다음 단계까지 %" 가정 → 레벨 있음(장부 §7 Q2). 링·성장 길 내용은 정령 성장 기획(0021)을 따라요.
- "배우기" 행동, "유대 5에서 열려요", "기믹형·인간형" 같은 제작 용어 → 0021, 0012 리뷰
- `frames/`: 정본 페이지(https://claude.ai/artifact/6mauUwAoRT9KSmGidBnWx3)에 실린 정령 관리·성장 캡처
