// CSS opacity처럼 다 그린 뒤 한 번에 투명하게. 컨테이너 alpha는 겹친 조각마다 따로 먹어서 겹친 곳이 진해져요.
// 한 장으로 그린 뒤 알파를 곱하는 필터를 써요. 1이면 필터를 꺼서 글자가 선명해요.
import type * as Phaser from "phaser";

export interface Opacity {
  value: number;
}

export function opacityOf(root: Phaser.GameObjects.Container): Opacity {
  const fx = root.enableFilters().filters!.internal.addColorMatrix();
  let value = 1;
  const apply = () => {
    fx.colorMatrix.set([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, value, 0]);
    fx.active = value < 1;
  };
  apply();
  return {
    get value() { return value; },
    set value(v: number) { value = v; apply(); },
  };
}

/** 어둡게: 색만 k배로 (알파는 그대로). 어두운 바탕 위 반투명은 어두워 보이지 않고 비쳐 보여서, 흐림 대신 써요 */
export function darken(root: Phaser.GameObjects.Container, k: number) {
  const fx = root.enableFilters().filters!.internal.addColorMatrix();
  fx.colorMatrix.set([k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]);
}
