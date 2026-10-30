# 정본 (canon)

Lucy가 확정한 시안 원본을 그대로 보관해요. 실제 화면은 이 파일들과 **비율·배치·정렬이 같게** 만들고, `pnpm visual`로 겹쳐서 확인해요.

| 폴더 | 정본 | 원본 아티팩트 | 결정 |
| --- | --- | --- | --- |
| `battle-r5/` | 전투 R5 "판단 동선" (1280×800) | https://claude.ai/artifact/Kqa9pCZnjAs6juuboj1wRh (r5/page.html) | 장부 §2, 0007 |

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
