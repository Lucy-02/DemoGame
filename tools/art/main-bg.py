#!/usr/bin/env python3
"""메인(정원) 배경 층 나누기 (0165 · 0166): 원본 한 장 → 하늘 / 땅 · 집 / 나무 윗부분 + 자리 정보.

  python3 tools/art/main-bg.py <원본 1216x768.png> <작업 폴더 1배> 1 40
  python3 tools/art/main-bg.py <2배 키운 것 2432x1536.png> <작업 폴더 2배> 2 40 <작업 폴더 1배> public/assets/stages/main

- 그림에서 반딧불과 굴뚝 연기를 지워요(화면이 다시 그림). 별은 그림에 두고 자리만 적어요.
- 하늘: 줄마다 위쪽 하늘 색과 견줘 가르고, 나무 · 집 뒤는 왼쪽 하늘을 비춰 채워요.
- 나무 윗부분은 고정선(pin) 위만 떼요. 땅 층은 지붕 · 줄기처럼 맞닿은 곳에서만 나무 쪽으로 겹쳐요(나무 둘레에 테가 남지 않게).
- 잎 덩어리(leaves.webp)는 나무 그림에서 둥글게 뜬 조각이에요. 자리는 CLUMPS.
- 2배는 색만으로 가르면 가장자리가 흔들려서 1배에서 만든 마스크를 키워 써요.
- 자리 값(나무 상자 · 고정선 · 굴뚝 · 창)은 M5-s30801 그림에 맞춘 것이에요. 다른 그림이면 다시 재야 해요.
"""
import cv2, numpy as np, sys, json
# 잎 덩어리 자리 (1배 그림 좌표: 가운데 x, y, 반지름). 눈으로 잎 뭉치마다 하나씩 잡은 것
CLUMPS=[(925,237,48),(980,172,52),(1060,137,52),(1140,167,52),(1185,247,44),(1040,212,56),(990,262,38),(1115,272,42)]
EDGE=20  # 나무를 오른쪽 그림 밖으로 늘이는 폭 (1배 px). 바람이 가장 셀 때 밀리는 폭보다 커야 해요
CLUMP_CORE=0.45  # 반지름의 이만큼까지는 또렷하고, 그 밖은 가장자리로 갈수록 흐려져요
TOL=int(sys.argv[4]) if len(sys.argv)>4 else 40
src=sys.argv[1]; out=sys.argv[2]; S=int(sys.argv[3]) if len(sys.argv)>3 else 1
im=cv2.imread(src); H,W=im.shape[:2]
hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int); h,s,v=hsv[...,0],hsv[...,1],hsv[...,2]  # h 0..179
b,g,r=[im[...,i].astype(int) for i in range(3)]
k=lambda n:np.ones((n*S,n*S),np.uint8)
# 1) 반딧불: 땅(아래 절반)의 밝은 노랑 점
fire=((r>150)&(g>170)&(b<140)&(np.arange(H)[:,None]>int(H*0.5))).astype(np.uint8)
# 창 · 등불(주황)은 빼요: 집 근처 상자
hx0,hx1,hy0,hy1=[int(a*S) for a in (735,1216,290,520)]
fire[hy0:hy1,hx0:int(1060*S)]=0
fire=cv2.dilate(fire,k(9))
# 2) 연기: 굴뚝 위 밝은 회백색
smoke=np.zeros((H,W),np.uint8)
sx0,sx1,sy0,sy1=[int(a*S) for a in (800,900,280,318)]
sub=((v[sy0:sy1,sx0:sx1]>150)&(s[sy0:sy1,sx0:sx1]<110)).astype(np.uint8)
smoke[sy0:sy1,sx0:sx1]=cv2.dilate(sub,k(7))
clean=cv2.inpaint(im,(fire|smoke)*255,4*S,cv2.INPAINT_TELEA)
hsv=cv2.cvtColor(clean,cv2.COLOR_BGR2HSV).astype(int); h,s,v=hsv[...,0],hsv[...,1],hsv[...,2]
# 3) 하늘이 아닌 것: 파랑(h 100~125)이 아닌 칸, 또는 언덕선 아래
yy=np.arange(0,int(360*S)); med=np.median(clean[:int(360*S),:int(560*S)].astype(float),axis=1)
ref=np.stack([np.polyval(np.polyfit(yy,med[:,c],3),np.arange(H)) for c in range(3)],1)
ref[:len(yy)]=med
blur=cv2.GaussianBlur(clean,(0,0),0.8*S).astype(float)
diff=np.abs(blur-ref[:,None,:]).sum(2)
sky=(diff<TOL)
sky[int(470*S):]=False
notsky=(~sky).astype(np.uint8)
# 별(흰 점)은 하늘: 작은 조각 지우기
notsky=cv2.morphologyEx(notsky,cv2.MORPH_OPEN,k(5))
notsky=cv2.morphologyEx(notsky,cv2.MORPH_CLOSE,k(7))
# 가장 큰 연결 덩어리만(땅 + 집 + 나무)
n,lab,st,_=cv2.connectedComponentsWithStats(notsky,8)
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); solid=(lab==big).astype(np.uint8)
# 구멍 메우기
ff=solid.copy(); m=np.zeros((H+2,W+2),np.uint8); cv2.floodFill(ff,m,(0,0),1); solid=solid|(1-ff)
# 4) 나무 윗부분: x>860, 고정선(pin) 위
pin=int(378*S); tx0=int(860*S)
canopy=np.zeros((H,W),np.uint8); canopy[:pin,tx0:]=(solid&notsky)[:pin,tx0:]
# 집 지붕 · 굴뚝은 빼요: 굴뚝/지붕은 x<1050, y>300 의 따뜻한/회색. 나무는 초록(h 60~95)
green=((h>=55)&(h<=97)).astype(np.uint8)
roofbox=np.zeros((H,W),np.uint8); roofbox[int(300*S):pin,:int(1052*S)]=1
warm=roofbox&(((s<90)&(v>70))|((h>115)|(h<40))).astype(np.uint8)
warm=cv2.morphologyEx(warm&canopy,cv2.MORPH_OPEN,k(3))
canopy=canopy&(1-cv2.dilate(warm,k(3)))
YY,XX=np.mgrid[0:H,0:W]
canopy[(YY>(309+(XX/S-905)*0.62)*S)&(XX<1052*S)]=0
n,lab,st,_=cv2.connectedComponentsWithStats(canopy,8)
big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); canopy=(lab==big).astype(np.uint8)
MD=sys.argv[5] if len(sys.argv)>5 else None
if MD:   # 1배에서 만든 마스크를 키워 써요 (2배에서는 색만으로 가르면 가장자리가 흔들림)
    up=lambda n:(cv2.resize(cv2.imread(MD+'/'+n,0),(W,H),interpolation=cv2.INTER_CUBIC)>127).astype(np.uint8)
    solid=up('m_solid.png'); canopy=cv2.erode(up('m_canopy.png'),np.ones((3,3),np.uint8)); grow=cv2.dilate(solid,k(15)).astype(bool)
else:
    cv2.imwrite(out+'/m_solid.png',solid*255); cv2.imwrite(out+'/m_canopy.png',canopy*255)
ys,xs=np.where(canopy); bbox=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
# 5) 하늘 레이어: 하늘 아닌 칸을 같은 줄의 왼쪽 하늘로 채움
skyL=clean.copy()
grow=cv2.dilate(solid,k(15)).astype(bool)
for y in range(H):
    row=grow[y]
    if not row.any(): continue
    idx=np.where(row)[0]
    a=idx[0]
    src=a-1-(idx-a)
    ok=(src>=0)
    ok[ok]&=~row[src[ok]]
    skyL[y,idx[ok]]=clean[y,src[ok]]
    skyL[y,idx[~ok]]=ref[y].clip(0,255)
skyL=cv2.GaussianBlur(skyL,(0,0),0.6*S)*grow[...,None]+skyL*(~grow[...,None]) if False else skyL
# 6) 땅 레이어(집 · 울타리 · 줄기 포함, 나무 윗부분 제외) / 나무 레이어
def rgba(img,mask,feather=1.2):
    a=cv2.GaussianBlur(mask.astype(np.float32),(0,0),feather*S); a=np.clip((a-0.35)/0.5,0,1)
    return np.dstack([img,(a*255).astype(np.uint8)])
base=solid&(1-canopy)
base=cv2.morphologyEx(base,cv2.MORPH_OPEN,k(5))   # 나무 둘레의 실 같은 찌꺼기 지우기
n_,lab_,st_,_c=cv2.connectedComponentsWithStats(base,8); base=(lab_==1+np.argmax(st_[1:,cv2.CC_STAT_AREA])).astype(np.uint8)
ground_mask=base|(cv2.dilate(base,k(7))&canopy)   # 땅 · 지붕과 맞닿은 곳만 나무 쪽으로 겹침
canopy_draw=cv2.dilate(canopy,k(5))&solid
# 나무를 치운 자리 뒤(먼 언덕)는 하늘 레이어가 보이므로, 땅 레이어의 그 자리 가장자리는 고정선 아래만
cv2.imwrite(out+'/sky.png',skyL)
cv2.imwrite(out+'/ground.png',rgba(clean,ground_mask))
x0,y0,x1,y1=bbox; pad=4*S
x0=max(0,x0-pad); y0=max(0,y0-pad); x1=min(W,x1+pad)
cv2.imwrite(out+'/tree.png',rgba(clean,canopy_draw)[y0:pin+3*S,x0:x1])
cv2.imwrite(out+'/clean.png',clean)
# 별 자리: 하늘의 밝은 점
star=((v>165)&(s<130)&(solid==0)).astype(np.uint8)
n,lab,st,cen=cv2.connectedComponentsWithStats(star,8)
stars=[[round(float(c[0])/S,1),round(float(c[1])/S,1)] for c,q in zip(cen[1:],st[1:]) if q[cv2.CC_STAT_AREA]<=30*S*S]
fn,flab,fst,fcen=cv2.connectedComponentsWithStats(fire,8)
json.dump({'w':W,'h':H,'scale':S,'tree':{'x':x0,'y':y0,'w':x1-x0,'h':pin+3*S-y0,'pin':pin-y0},'stars':stars,'fireflies':int(fn-1)},open(out+'/layers.json','w'))
print(bbox,'pin',pin,'stars',len(stars),'fire',fn-1,'smoke px',int(smoke.sum()))
dbg=clean.copy(); dbg[canopy>0]=(dbg[canopy>0]*0.4+np.array([0,0,255])*0.6); dbg[(ground_mask>0)]=(dbg[ground_mask>0]*0.6+np.array([0,255,0])*0.4)
t=cv2.imread(out+'/tree.png',cv2.IMREAD_UNCHANGED)[:pin-y0]; bgc=np.full(t.shape[:2]+(3,),(200,60,200),np.uint8); a=t[...,3:]/255.; comp=(t[...,:3]*a+bgc*(1-a)).astype(np.uint8)
cv2.imwrite(out+'/dbg2.jpg',np.hstack([comp,skyL[y0:pin,x0:x1],(clean[y0:pin,x0:x1])]))
cv2.imwrite(out+'/dbg.jpg',np.hstack([cv2.resize(dbg,(W//S//2*1,H//S//2)),cv2.resize(skyL,(W//S//2,H//S//2))]))

# 게임 에셋으로 내보내기: 층은 webp, 자리는 원본 1배(1216x768) 좌표
if len(sys.argv)>6:
    import os
    exp=sys.argv[6]; os.makedirs(exp,exist_ok=True)
    q=[cv2.IMWRITE_WEBP_QUALITY,92]
    cv2.imwrite(exp+'/sky.webp',skyL,q)
    cv2.imwrite(exp+'/ground.webp',rgba(clean,ground_mask),q)
    # 나무가 그림 오른쪽 끝에 닿아 있어서, 바람에 왼쪽으로 밀릴 때 틈이 안 보이게 끝 줄을 EDGE만큼 늘여 둬요
    wide=cv2.copyMakeBorder(rgba(clean,canopy_draw),0,0,0,EDGE*S,cv2.BORDER_REPLICATE); x1+=EDGE*S
    cv2.imwrite(exp+'/tree.webp',wide[y0:pin+3*S,x0:x1],q)
    # 잎 덩어리: 나무 그림에서 둥글게 떠서 가장자리를 흐리게 한 조각. 화면이 나무 위에 얹어 덩어리마다 따로 흔들어요
    tr=wide.astype(np.float32); side=2*max(c[2] for c in CLUMPS)*S
    strip=np.zeros((side,0,4),np.float32); clumps=[]
    for cx,cy,cr in CLUMPS:
        n=2*cr*S; tile=np.zeros((side,n,4),np.float32)
        ax,ay=cx*S-cr*S,cy*S-cr*S
        sx0,sy0,sx1,sy1=max(0,ax),max(0,ay),min(W+EDGE*S,ax+n),min(H,ay+n)
        tile[sy0-ay:sy1-ay,sx0-ax:sx1-ax]=tr[sy0:sy1,sx0:sx1]
        yy,xx=np.mgrid[0:side,0:n]; d=np.hypot(xx-n/2+.5,yy-n/2+.5)/(n/2)
        f=np.clip((1-d)/(1-CLUMP_CORE),0,1); tile[...,3]*=f*f*(3-2*f)
        clumps.append({'x':cx,'y':cy,'r':cr,'u':strip.shape[1]//S}); strip=np.hstack([strip,tile])
    cv2.imwrite(exp+'/leaves.webp',strip.astype(np.uint8),q)
    one=json.load(open(MD+'/layers.json')) if MD else None
    json.dump({'source':{'w':W//S,'h':H//S},'scale':S,
      'tree':{'x':x0/S,'y':y0/S,'w':(x1-x0)/S,'h':(pin+3*S-y0)/S,'pin':(pin-y0)/S,'clumps':clumps},
      'stars':(one or {'stars':stars})['stars'],
      'chimney':{'x':846,'y':314},
      'lights':[{'x':893,'y':431,'r':46},{'x':949,'y':437,'r':50},{'x':861,'y':447,'r':34}],
      'meadow':{'top':470,'bottom':745},
      # 빛 색: 그림의 창 불빛 · 반딧불 · 연기에서 고른 값 (움직임 첫 판에서 Lucy가 본 색)
      'colors':{'star':0xdcebff,'light':0xffaa50,'smoke':0xbec8e1,'fireflyA':0xc8ff5a,'fireflyB':0xf5e696,'fireflyCore':0xfaffc8}},open(exp+'/layers.json','w'))
