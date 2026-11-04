# 배경 제거본을 2×로 키워요 (Drive jjal-handoff up2x와 같은 공정). RGB는 RealESRGAN anime_6B(4×)로 키운 뒤 2×로 줄이고,
# 알파는 2× 리샘플 후 끝값(8 미만 0, 247 초과 255)을 붙여요.
# 쓰는 법 (torch·spandrel이 있는 파이썬, 예: ComfyUI venv): python -I tools/art/upscale-2x.py <jjal-bgrm 폴더> <저장 폴더>
# 그다음 tools/art/import-spirits.py 에 저장 폴더를 넘겨요.
import sys, numpy as np, torch
from pathlib import Path
from PIL import Image
from spandrel import ModelLoader
W=Path(sys.argv[1]); out=Path(sys.argv[2])
m=ModelLoader().load_from_file(r'C:/ai/ComfyUI/models/upscale_models/RealESRGAN_x4plus_anime_6B.pth').cuda().eval().half()
S=["flash","glass-salamander","kelp-seahorse","magma-ibex","mirage","mirror-peacock","mist-cat","night-owl","pearl-oyster","prism-chameleon","rain-frog","river-otter","rune","shadow-moth"]
for s in S:
    for t in ["cub","adult","awakened"]:
        p = W/"final-owl-out/lucida+vitmatte"/f"{s}__{t}.rgba.png" if (s,t)==("night-owl","awakened") else W/"final-out/hybrid+vitmatte"/f"{s}__{t}.rgba.png"
        im=Image.open(p).convert("RGBA"); w,h=im.size
        rgb=torch.from_numpy(np.asarray(im.convert("RGB"),dtype=np.float32)/255).permute(2,0,1)[None].cuda().half()
        with torch.no_grad(): y=m(rgb)
        y=(y[0].float().clamp(0,1).permute(1,2,0).cpu().numpy()*255).round().astype(np.uint8)
        up=Image.fromarray(y).resize((w*2,h*2),Image.LANCZOS)
        a=np.asarray(im.getchannel("A").resize((w*2,h*2),Image.BICUBIC)).copy(); a[a<8]=0; a[a>247]=255
        up.putalpha(Image.fromarray(a)); up.save(out/f"{s}__{t}.png")
        print(s,t,up.size,flush=True)
