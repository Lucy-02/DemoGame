# 2× 배경 제거본(알파로 자른 좌표)에서 얼굴 상자를 찾아요. 성체·각성체 구도를 같은 얼굴 크기로 맞추는 데 써요.
# 쓰는 법 (ultralytics가 있는 파이썬, 예: ComfyUI venv): python -I tools/art/detect-faces.py <2× 폴더> tools/art/faces.json
# 모델: ComfyUI Impact Pack의 face_yolov8m (애니 얼굴). 결과: 자른 그림 폭·높이 비율 [신뢰도, x0, y0, x1, y1], 신뢰도 순
import sys, json
from pathlib import Path
from PIL import Image
from ultralytics import YOLO
up=Path(sys.argv[1]); out=sys.argv[2]
m=YOLO(r'C:/ai/ComfyUI/models/ultralytics/bbox/face_yolov8m.pt')
S=["flash","glass-salamander","kelp-seahorse","magma-ibex","mirage","mirror-peacock","mist-cat","night-owl","pearl-oyster","prism-chameleon","rain-frog","river-otter","rune","shadow-moth"]
res={}
for s in S:
    for t in ["cub","adult","awakened"]:
        im=Image.open(up/f"{s}__{t}.png").convert("RGBA"); im=im.crop(im.getbbox())
        bg=Image.new("RGB",im.size,(255,255,255)); bg.paste(im,(0,0),im)
        r=m.predict(bg, conf=0.2, verbose=False)[0]
        boxes=[(float(b.conf), [float(v) for v in b.xyxy[0]]) for b in r.boxes]
        boxes.sort(reverse=True)
        W,H=im.size
        res[f"{s}/{t}"]={"size":[W,H],"faces":[[round(c,3)]+[round(v/(W if i%2==0 else H),4) for i,v in enumerate(b)] for c,b in boxes[:3]]}
        print(s,t,res[f"{s}/{t}"]["faces"][:2],flush=True)
json.dump(res,open(out,"w"),indent=1)
