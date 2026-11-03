# 0002 · 정령 퍼핏(라투디, 각성체 idle) 런타임과 에셋 (2026-11-03)

- 상태: 런타임·에셋 반영. 정령 관리(정원) 화면의 각성체 그림을 퍼핏(라투디)으로 그려요(Lucy 2026-11-03). 다른 화면은 미정
- 범위: 정령 일러스트 한 장을 레이어로 나눠 메시로 움직이는 idle(호흡·머리 갸웃·머리카락 흩날림·꼬리·베일·날개·귀). 공격·피격 같은 큰 동작은 아니에요. Spine은 그대로 둬요(Lucy 2026-11-03).

## 결정

1. **그리기 = Phaser 4 `Extern` + 버텍스 셰이더.** 정점 채널은 정적 버퍼에 한 번 올리고, 매 프레임 퍼핏 신호(각도·호흡·머리 묶음 위상·체인 마디)만 유니폼으로 보내요. CPU 몫은 마리당 수 µs.
   - 기각: CPU로 정점 계산 + 동적 버퍼 — 8마리에서 60 Hz 틱마다 Mac 5.8 ms·Windows 11.1 ms. Phaser 4.2 `Mesh2D` — 그릴 때 정점을 CPU로 한 번 더 변환해서 8마리 프레임 11.9 ms(Mac)·35 ms(Windows).
   - 셰이더는 GLSL 100이라 Phaser 기본 WebGL1과 WebGL2 컨텍스트 둘 다에서 같은 화면이 나와요.
2. **식은 한 곳.** `src/presentation/puppet/puppetCore.ts`가 정본 식이에요. `applyCPU`(CPU)와 셰이더는 같은 식이고, 골든 테스트는 CPU 쪽으로 돌려요.
3. **에셋 = 정령당 아틀라스 한 장, 해상도 티어 @2만**(Lucy 2026-11-03). BC7 KTX1(밉맵 포함, 프리멀티플라이드 알파) + BC7을 못 쓰는 기기용 PNG. Phaser 4.2 로더는 KTX1·PVR만 읽어요(KTX2·Basis 안 됨).
4. **리그를 만드는 빌더는 jjal 저장소에 둬요.** See-through·SAM(GPU), Python 과학 패키지, 정령당 수백 MB 중간 산출물이 따라와서요. 게임 저장소에는 결과만 `tools/art/import-puppets.py`로 들여와요(`import-spirits.py`와 같은 방식). 포맷이 바뀌면 `rig.json`의 `format`을 올려요.

## 파일

```
public/assets/puppets/index.json            들어 있는 정령 목록
public/assets/puppets/<정령>/rig.json        메시·정점 채널·움직임 프로필 (format 1)
public/assets/puppets/<정령>/atlas@2.bc7.ktx 아틀라스 BC7
public/assets/puppets/<정령>/atlas@2.png     아틀라스 PNG (대체)
src/presentation/puppet/puppetCore.ts        식 (엔진 모름)
src/presentation/puppet/puppetRenderer.ts    Phaser Extern + 셰이더
src/presentation/puppet/loadPuppet.ts        queuePuppet(preload) · ensurePuppet(화면이 뜬 뒤 필요할 때) · createPuppet
src/presentation/puppet/puppetIds.ts         퍼핏이 있는 정령 목록 (Phaser 없음, 뷰모델용)
puppet-preview.html, tools/puppet-preview/   개발용 미리보기 (pnpm dev:web → /puppet-preview.html)
tools/art/import-puppets.py                  jjal 빌더 결과 들여오기 + provenance
```

쓰는 법:

```ts
preload() { queuePuppet(this, "mist-cat"); }
create() { const p = createPuppet(this, "mist-cat", { seed: 7 }); p.setScale(0.3).setPosition(x, y); }
```

좌표는 리그 캔버스 px(2432 또는 2048 정사각)예요. `setScale`로 화면 크기를 맞춰요. 여러 마리면 seed를 다르게 줘요.

정령 관리 화면: 각성체 정령을 고르면 `ensurePuppet`으로 그 정령만 불러오고, 올라올 때까지는 일러스트를 그려요. 올라오면 일러스트 자리(`placeArt`)에 같은 크기로 퍼핏을 올려요. 맞추는 기준은 `rig.json`의 `art.bbox`(리그 캔버스에서 일러스트 알파 경계 상자, webp가 같은 상자로 잘려 있음)예요. 색 번짐은 일러스트로 그대로 그리고, 위 막대·아래 띠 자르기와 아래 페이드는 셰이더의 `setScreenClip`이 해요. 화면을 다시 그려도 움직임이 이어지게 정령별 `PuppetCore`를 남겨 둬요.

## rig.json (format 1)

| 필드 | 내용 |
|---|---|
| `canvas` | 리그 캔버스 크기(px) |
| `points` | 머리 피벗·머리카락 뿌리·골반·귀 뿌리 |
| `bundles` | 머리 묶음별 진폭·주기·위상·축 기울기·돌풍 |
| `chains` | 꼬리·베일 체인 마디(뿌리→끝), 프로필(tail/cloth), 갈래면 부모 체인·마디 |
| `motion` | 기본 움직임 값(`MOTION_DEFAULTS`)을 덮어쓰는 정령별 값 |
| `layers[]` | 그리기 순서. 정점·삼각형·아틀라스 UV(@1 기준 px)와 정점 채널: `head`(머리 상속) `bx,by`(호흡) `sway`(자세) `earL,earR` `spring`(머리카락 잔여) `hb,hw,hpx,hpy,hp,hn`(머리 묶음) `seg,t,tc`(체인) `rot,rw`(날개 회전) `hem,hx`(치맛단) |
| `atlas` | @1 논리 크기, 티어 파일 |

## 측정 (헤드리스 Chrome, 정점 약 1.4만/마리)

| | 8마리 프레임 | 32마리 프레임 | 60 Hz 틱당 JS(8마리) |
|---|---|---|---|
| Mac M2 (ANGLE Metal) | 2.06 ms | 2.18 ms | 0.055 ms |
| Windows RTX 4070 Ti (ANGLE D3D11) | 2.61 ms | 3.17 ms | 0.062 ms |
| 같은 PC 내장 AMD Radeon | 6.01 ms | — | 0.139 ms |

- 텍스처: 마리당 GPU 메모리 RGBA8 대비 1/4(BC7). @2 KTX 2.8~5.6 MB(gzip 시 0.7~0.8 MB).
- 셰이더 유니폼은 퍼핏당 약 140 vec4. 측정한 한도는 Mac 1024, Windows 4095. WebGL1 최소 보장(128)보다 많아서 모바일로 가면 체인 표를 데이터 텍스처로 옮겨야 해요.
- 화질: BC7 vs PNG 같은 프레임 비교에서 16/255 넘게 다른 픽셀 0.08%.

## 남은 것

- 다른 화면(전투·편성 등)에 붙일지와 크기 (Lucy)
- 화면이 리그 캔버스의 1/2보다 크게 그리면 @1이 필요해요(그때 Git LFS로)
- 컨텍스트 손실 복구, Electron 실기 측정, 해상도 티어 자동 선택
