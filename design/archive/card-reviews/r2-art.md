# CARD-R2 · art-director 리뷰

아트 바이블이 아직 없어서, 기준은 Lucy가 잠근 카드 시각 결정(0005·0007·0008, CONTEXT "이미 확정된 카드 시각 결정")이에요. heuristic_id의 AB-CORE는 "잠긴 기본기", AB-SURF는 "바뀌어도 되는 표면"을 이 결정들에 맞춰 쓴 것이에요.

```json
[
  {
    "id": "R2-ART-001",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "awb",
    "persona": "art-director",
    "severity": 3,
    "heuristic_id": "AB-CORE",
    "target_element": "awb-grp-fire",
    "title": "b안은 '재질: 손패는 이름 띠만, 호버 때 카드 전체' 잠금 규칙을 정면으로 깸",
    "standard": "0005 잠금: 재질은 손패에서 이름 띠에만, 호버 시 카드 전체로. 재질 확산은 호버라는 한 상태의 시각 표지.",
    "gap": "각성 중에는 호버하지 않은 손패 카드 여러 장이 카드 전체 재질을 입음. 같은 시각 표지가 '호버'와 '각성 중' 두 뜻을 갖게 되고, 각성 중 카드를 실제로 호버했을 때 더 바뀔 것이 남지 않음.",
    "evidence": "awb.png 이그니 카드 셋의 그림 창까지 용암석 반점. page.html CSS `.aw-b .g-awk .cd.h{background-color:var(--mc);background-image:var(--mi);...border-color:var(--me)}`, 페이지 설명 '포기하는 것: 각성 중엔 호버(재질이 퍼짐)와 평…'.",
    "suggestion": "잠금 규칙을 유지하는 안(a·c)을 택하거나, b를 원한다면 0005의 재질 규칙 자체를 다시 여는 결정으로 Lucy에게 따로 올리기.",
    "confidence": "high",
    "status": "open"
  },
  {
    "id": "R2-ART-002",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "awc",
    "persona": "art-director",
    "severity": 2,
    "heuristic_id": "AB-CORE",
    "target_element": "awc-grp-fire",
    "title": "c안은 재질을 속성이 아닌 '상태(각성)' 신호로, 잠금 목록에 없는 새 표면(묶음 바탕)에 씀",
    "standard": "0008: 재질은 속성 전용(희귀도에 재질을 쓰는 안을 같은 이유로 기각). 재질이 놓이는 표면은 이름 띠와 호버 카드 둘.",
    "gap": "묶음 바탕이 불 재질로 바뀌는 것은 재질에 '이 정령이 각성 중'이라는 두 번째 뜻을 줌. 다른 속성 정령이 각성하면 묶음 바탕 재질도 그 속성으로 바뀌어 '각성 = 묶음 바탕 재질'이라는 새 문법이 생김.",
    "evidence": "awc.png 이그니 묶음 바탕 전체에 용암석 반점과 테. page.html CSS `.aw-c .g-awk{background-color:var(--m-fire);background-image:radial-gradient(...)...}`. 0008 '희귀도에 재질·색·반짝임: 재질은 속성 전용' 기각.",
    "suggestion": "c를 고른다면 '정령 단위 상태에 한해 묶음 바탕에 그 정령 속성 재질을 쓴다'를 재질 규칙의 명시적 예외로 결정 기록에 남기기. 아니라면 묶음 머리표·초상 홈만 쓰는 a로.",
    "confidence": "medium",
    "status": "open"
  },
  {
    "id": "R2-ART-003",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mkb",
    "persona": "art-director",
    "severity": 2,
    "heuristic_id": "AB-CORE",
    "target_element": "mkb-star-whirl-ready",
    "title": "b안 꼭지가 숫자판 위로 튀어나와 그림 창 안쪽을 침범함 (R1 기각 사유와 같음)",
    "standard": "0005 잠금: 일러스트 필수(그림 창). 0008: 1차 B의 받침·희귀도 점을 '그림 창 안전 영역 침범'으로 기각.",
    "gap": "꼭지 표식이 숫자판 위쪽 바깥에 놓여 그림 창 아래 영역에 겹침. 실제 일러스트가 들어오면 표식이 그림 위에 얹힘.",
    "evidence": "page.html CSS `.mk-b .rmk{right:6px;top:-11px;...}`(숫자판 기준 위로), 호버 카드는 `top:-15px`. mkb.png에서 점화·백드래프트의 ▼가 그림 창 안 효과 기호 높이에 있음.",
    "suggestion": "표식을 숫자판 경계 안쪽(또는 숫자판 자체 모양)에 두는 안을 택하기.",
    "confidence": "high",
    "status": "open"
  },
  {
    "id": "R2-ART-004",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mkc",
    "persona": "art-director",
    "severity": 1,
    "heuristic_id": "AB-SURF",
    "target_element": "mkc-fire-ignite-ready",
    "title": "c안 받침 줄이 숫자판과 이름 띠 경계에 걸쳐, 재질 표면(이름 띠) 위에 UI 요소가 얹힘",
    "standard": "0005: 이름 띠 = 손패에서 재질이 보이는 유일한 표면. 재질 리뷰 지적: 텍스트 영역엔 결 없이(재질 표면과 UI 요소를 분리).",
    "gap": "받침 줄이 숫자판 아래 바깥으로 나와 이름 띠 윗선과 맞닿음. 불·숲 카드는 띠의 결 위에 줄이 걸쳐 보여 재질 표면의 경계가 흐려짐.",
    "evidence": "page.html CSS `.mk-c .rmk{left:4px;right:4px;bottom:-4px;height:4px}`. mkc.png 점화(불 재질 띠) 숫자판 아래 줄이 띠 윗선 바로 위에 붙어 있음.",
    "suggestion": "c를 고른다면 줄을 숫자판 경계 안쪽에 두어 이름 띠와 떨어지게 배치.",
    "confidence": "medium",
    "status": "open"
  },
  {
    "id": "R2-ART-005",
    "round": "CARD-R2",
    "stage": "P4",
    "option": "mka",
    "persona": "art-director",
    "severity": 1,
    "heuristic_id": "AB-SURF",
    "target_element": "mka-star-whirl-ready",
    "title": "a안 접힌 모서리의 '뒤쪽'이 카드 바깥 벽 색으로 칠해져, 접힘이 아니라 카드에 뚫린 구멍처럼 보임",
    "standard": "접힌 모서리는 숫자판 위에 있으므로 접혀 드러나는 면은 그 아래 카드 몸체여야 물건으로서 일관됨.",
    "gap": "접힘의 바깥 삼각형이 전투 배경 벽 색을 써서, 카드 몸체 한가운데 배경이 비쳐 보임. 못 내는 카드에서도 같은 벽 색.",
    "evidence": "page.html CSS `.mk-a .rmk{border-color:transparent var(--wall) #2f2c29 transparent}`, `.mk-a .cd.off .rmk{border-color:transparent var(--wall) #5a5550 transparent}`. mka.png 회오리 베기 숫자판 오른쪽 위.",
    "suggestion": "드러나는 면을 숫자판 아래 카드 몸체 표면으로 그리는 구조로 수정(값은 토큰).",
    "confidence": "high",
    "status": "open"
  }
]
```

## 고른 것 (art-director 관할, 잠금 결정 기준)

준비 표식은 **a(접힌 모서리)**를 골라요. 숫자판 경계 안에서 끝나 그림 창(b가 침범)과 이름 띠 재질 표면(c가 맞닿음) 어느 쪽도 건드리지 않는 유일한 안이고, 종이 카드라는 물건의 문법 안에 있는 모양이에요. 다만 접힌 면을 벽 색으로 칠한 부분은 고쳐야 해요. 각성 중 카드는 **a(초상 홈 + 남은 턴 칩)**만 잠긴 재질 규칙을 그대로 지키고, b는 규칙을 깨며 c는 재질에 상태라는 새 뜻을 얹어요. 모션 성격은 카드 몸체가 종이 계열 표면(무속성 = 무지, 숲 = 한지)으로 잠겨 있으니 **가(가벼운 종이)**가 겉모습과 움직임이 맞고, 나의 "돌판"은 불 재질 외에는 겉모습과 어긋나며, 다는 손패에서 이름 띠에만 보이는 재질이 카드 전체의 움직임을 정해 겉에 안 보이는 성질을 움직임이 말하게 돼요.
