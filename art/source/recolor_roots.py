# Recolours the painted root layers (art/plant/*/roots.png) to a turquoise with a slight purple lean, near the Bloom's centre.
# Each pixel keeps its alpha and its light and shade; its colour comes from the turquoise ramp below at the same brightness, with the
# layer's lit roots brightened into the ramp's middle (shadows stay dark). Usage: python3 recolor_roots.py <src dir> <out dir>
# where both hold one folder per structure (art/plant). Run it on freshly painted roots, not on already recoloured ones.
import sys,os
from PIL import Image
src,out=sys.argv[1],sys.argv[2]
lum=lambda p:.299*p[0]+.587*p[1]+.114*p[2]
STOPS=[(0,(0,0,0)),(28,(26,30,62)),(70,(44,92,124)),(115,(66,158,170)),(165,(118,206,210)),(210,(188,236,236)),(255,(244,252,252))]
lut=[]
for L in range(256):
    j=next(k for k in range(1,len(STOPS)) if STOPS[k][0]>=L);(l0,c0),(l1,c1)=STOPS[j-1],STOPS[j];t=(L-l0)/(l1-l0)
    lut.append(tuple(round(a+(b-a)*t) for a,b in zip(c0,c1)))
for d in sorted(os.listdir(src)):
    fn=os.path.join(src,d,'roots.png')
    if not os.path.isfile(fn):continue
    im=Image.open(fn).convert('RGBA');px=list(im.getdata())
    lit=sorted(lum(p) for p in px if p[3]>100 and lum(p)>20)
    g=150/lit[int(len(lit)*.9)] if lit else 1                             # the layer's brighter roots land in the ramp's middle
    im.putdata([(*lut[min(255,round(lum(p)*g))],p[3]) if p[3] else p for p in px])
    os.makedirs(os.path.join(out,d),exist_ok=True);im.save(os.path.join(out,d,'roots.png'),optimize=True)
    print(d,'gain %.2f'%g)
