#!/usr/bin/env python3
"""Generates src/data/starbase.js: the five racial starbases (R1.1) from the Starbase SSD (Captain's Basic Set SSD book pages 24 and 25) and the R1.1A weapon table.
Each docking module has its own boxes (needed for the R1.1D damage procedure); the core has the rest. The sheet layout is synthetic but grouped by module."""
import json,os
ALL=["ALL"]
MA=[["L","LF","RF","R"],["RF","R","RR","LF"],["RF","R","RR","LR"],["L","LR","RR","R"],["LF","L","LR","RR"],["LF","L","LR","RF"]]  # module 1 to 6 arcs: FX, RS+LF, RS+LR, RX, LS+RR, LS+RF (SSD)
W3A=[["RF","R","RR"],["RR","LR","L"],["L","LR","RF"]]  # R1.1A: the three plasma-D racks
LET='ABCDEFGHJKLM'
R={'F':('SBF','Federation Starbase','Fed SB'),'K':('SBK','Klingon Starbase','Kli SB'),'Z':('SBZ','Kzinti Starbase','Kzi SB'),'G':('SBG','Gorn Starbase','Gor SB'),'R':('SBR','Romulan Starbase','Rom SB')}
SEC_U=[5,0,1]   # modules whose side is the upper armor row (shields 6, 1, 2)
def modsys(r):
    m={"Aux Control":1,"Tractor":2,"Bridge":1,"Trans":2,"Battery":4,"Shuttle":2,"APR":6,"C Hull":6,"Cargo":30}
    if r in 'FK':m["Drone"]=1      # W4 type-H drone rack
    if r=='K':m["Flag Bridge"]=1   # R1.1 notes: one security station in each Klingon module; flag bridge boxes count as security
    if r=='Z':m["Drone"]=2         # W1 drone racks
    return m
def coresys(r):
    c={"Sensor":12,"Scanner":12,"Damage Control":16,"Excess Damage":16,"Flag Bridge":4,"Emer Bridge":2,"Aux Control":4,"Probe":4,"Lab":20,"Trans":10,"Battery":20,"C Hull":48,"Cargo":28,"APR":52,"ArmorU":8,"ArmorL":8}
    if r in 'FKZ':c["Add"]=3       # W3 ADD-30
    return c
def build(r):
    key,name,sh=R[r]
    ph=[];wm={"ph":[],"tu":[],"di":[],"pl":[]}
    for m in range(6):
        for _ in range(2):ph.append({"t":"P4","arcs":MA[m]});wm["ph"].append(m)
        ph.append({"t":"P3","arcs":MA[m]});wm["ph"].append(m)   # W2 (Ph-G only after Y168: Ph-3 stands in)
    s={"side":"bas","name":name,"short":sh,"cat":"E","size":1,"mc":1,"bd":6,"ls":3,"shc":[2,5],"pv":600,"ex":54,"base":1,"noDA":1,"rot":4,"shields":[50]*6,
       "tubes":None,"ntube":0,"dis":None,"trk":{"Sensor":[6,6,6,6,5,5,4,4,3,2,1,0],"Scanner":[0,0,0,0,1,1,2,3,3,5,7,9],"Damage Control":[12,12,12,10,10,10,8,8,8,6,6,4,4,2,2,0]}}
    if r=='F':s["tubes"]=MA[0];s["ntube"]=12;s["tubee"]=[MA[i//2] for i in range(12)];wm["tu"]=[i//2 for i in range(12)]
    if r=='K':s["dis"]=ALL;s["ndis"]=12;s["dmax"]=30;s["dise"]=[MA[i//2] for i in range(12)];wm["di"]=[i//2 for i in range(12)]
    if r=='Z':s["dis"]=ALL;s["ndis"]=6;s["dmax"]=30;s["dise"]=[MA[i] for i in range(6)];wm["di"]=list(range(6))
    if r in 'GR':
        s["plas"]=[{"t":t,"arcs":MA[m]} for m in range(6) for t in 'RF'];wm["pl"]=[m for m in range(6) for _ in range(2)]
        for a in W3A:ph.append({"t":"P3","arcs":a});wm["ph"].append("c")   # W3 Plasma-D racks: not built; Ph-3 stand-ins with the rack arcs
    s["phasers"]=ph;s["wmod"]=wm
    mods=[modsys(r) for _ in range(6)];core=coresys(r)
    tot={}
    for reg in mods+[core]:
        for k,v in reg.items():tot[k]=tot.get(k,0)+v
    tot.pop("Excess Damage",None)
    s["sys"]=tot;s["sbm"]={"mod":mods,"core":core}
    return key,s
# ---------- layout
def pack(items,x0,y0,W):
    """items: (n,cap,row_h_extra) -> list of (x,y,cols) and total height"""
    out=[];x=x0;y=y0;rowh=0
    for n,cap in items:
        cols=min(n,cap);w=cols*32;h=20+((n+cap-1)//cap)*32+12
        if x>x0 and x+w>x0+W:x=x0;y+=rowh;rowh=0
        out.append((x,y,cols));x+=w+26;rowh=max(rowh,h)
    return out,(y+rowh-y0)
def grid(x,y,cols,n):return [[x+(i%cols)*32,y+20+(i//cols)*32] for i in range(n)]
CAP={"Repair":10,"Cargo":14,"C Hull":10,"Lab":10,"Battery":10,"Trans":10,"APR":13,"Armor":24,"Sensor":12,"Scanner":12,"Damage Control":16,"Excess Damage":16}
def layout(r,s):
    G=[];gi={}
    def add(g):G.append(g);return len(G)-1
    CW=700;CX=[1000,1740,2480]
    # which cell each module sits in: top row: modules 6,1,2 (idx 5,0,1); bottom row: 5,4,3 (idx 4,3,2)
    cell={5:(0,0),0:(1,0),1:(2,0),4:(0,1),3:(1,1),2:(2,1)}
    mods=s["sbm"]["mod"]
    def modlist(m):
        it=[];
        it.append(("Phaser",3,6));
        if r=='F':it.append(("Photon",2,2))
        if r=='K':it.append(("Disruptor",2,2))
        if r in 'GR':it.append(("Plasma",2,2))
        if r=='Z':it.append(("Drone",2,2));it.append(("Disruptor",1,1))
        if r in 'FK':it.append(("Drone",1,1))
        for n in ("Aux Control","Tractor","Bridge","Flag Bridge","Trans","Battery","Shuttle","APR","C Hull","Cargo"):
            if mods[m].get(n):it.append((n,mods[m][n],10 if n=="Cargo" else 12))
        return it
    def modw(m):  # pre-compute block height
        _,h=pack([(n,c) for _,n,c in [(a,b,c2) for a,b,c2 in modlist(m)]],0,0,CW);return h
    ph_=max(pack([(b,c) for a,b,c in modlist(m)],0,0,CW)[1] for m in range(6))
    SH=8*32+30
    topY=120;modY_top=topY+SH+20;rowH=SH+20+ph_+40
    coreY=topY+rowH+20
    # core items
    core=s["sbm"]["core"]
    citems=[("ArmorU",16,16)]
    corenames=["Sensor","Scanner","Damage Control","Excess Damage","Flag Bridge","Emer Bridge","Aux Control","Probe","Lab","Trans","Battery","C Hull","Cargo","APR"]
    if "Add" in core:corenames.append("Add")
    citems+= [(n,core[n],CAP.get(n,12)) for n in corenames]
    if r in 'GR':citems.append(("Phaser",3,3))
    citems.append(("ArmorL",16,16))
    cpos,ch=pack([(b,c) for a,b,c in citems],CX[0],coreY,3*CW+80)
    botY=coreY+ch+80
    # ---- shields (groups 0-5 base, 6-11 y170, 12-17 y175), placed beside each module
    shp={}
    for m in range(6):
        c,rw=cell[m];x=CX[c];y=(topY if rw==0 else botY+ph_+20)
        shp[m]=(x,y)
    for m in range(6):
        x,y=shp[m];add(["s",m,None,grid(x,y-20,10,50)])
    y170=[];y175=[]
    for m in range(6):
        x,y=shp[m];y170.append(add(["s",m,None,[[x+(i%10)*32,y+160+(i//10)*32] for i in range(20)],1]))
    for m in range(6):
        x,y=shp[m];y175.append(add(["s",m,None,[[x+(i%10)*32,y+224+(i//10)*32] for i in range(10)],1]))
    T=[]
    # ---- modules, in module order 0..5 (weapon index order)
    for m in range(6):
        c,rw=cell[m];x=CX[c];y=(modY_top if rw==0 else botY)
        T.append([x,y-34,"MODULE %d  /  SHIELD #%d"%(m+1,m+1)])
        lst=modlist(m);pos,_=pack([(b,c2) for a,b,c2 in lst],x,y,CW)
        for (nm,n,cap),(px,py,cols) in zip(lst,pos):
            b=grid(px,py,cols,n)
            if nm=="Phaser":
                labs=["Ph-4 #%d"%(3*m+1),"Ph-4 #%d"%(3*m+2),"Ph-3 #%d"%(3*m+3)];add(["w","ph",labs,b,None,None,m])
            elif nm=="Photon":add(["w","pt",["Photon "+LET[2*m+i] for i in range(2)],b,None,None,m])
            elif nm=="Disruptor":
                base=(2*m if r=='K' else m);k=n;add(["w","ds",["Disruptor "+LET[base+i] for i in range(k)],b,None,None,m])
            elif nm=="Plasma":add(["w","pl",["Plasma-R %s"%LET[2*m],"Plasma-F %s"%LET[2*m+1]],b,None,None,m])
            else:add(["y",nm,None,b,None,None,m])
    # ---- core
    # armor groups come after (armor upper/lower with refit groups)
    a170=[];a175=[]
    for (nm,n,cap),(px,py,cols) in zip(citems,cpos):
        b=grid(px,py,cols,n)
        if nm in("ArmorU","ArmorL"):
            add(["y",nm,None,b[:8],None,None,'c'])
            a170.append(add(["y",nm,None,b[8:12],1,None,'c']))
            a175.append(add(["y",nm,None,b[12:16],1,None,'c']))
        elif nm=="Phaser":add(["w","ph",["Ph-3 #%d"%(19+i) for i in range(3)],b,None,None,'c'])
        else:add(["y",nm,None,b,None,None,'c'])
    T.append([CX[0],coreY-6,"CORE"])
    ox=CX[0]-30;ox2=CX[0]+3*CW+60
    outl=[[[ox,coreY-10],[ox2,coreY-10],[ox2,coreY+ch+10],[ox,coreY+ch+10]]]
    return {"g":G,"o":outl,"t":T},y170+a170,y175+a175
out=["// [R1.1] Starbases (SB). Generated by tools/sbgen.py from the Starbase SSD (Captain's Basic Set SSD book pages 24 and 25) and the W1 to W4 table of R1.1A. Each docking module has its own boxes (R1.1D damage procedure); the sheet layout is synthetic."]
refits={}
for r,(key,_,_) in R.items():
    k,s=build(r);geo,a,b=layout(r,s)
    out.append("SHIPS.%s=%s;"%(k,json.dumps(s,separators=(',',':'))))
    out.append("const GEO_%s=%s;"%(k,json.dumps(geo,separators=(',',':'))))
    refits[k]=(a,b)
out.append("['SBF','SBK','SBZ','SBG','SBR'].forEach(mkDef);")
out.append("const SBR_REFITS=%s;"%json.dumps(refits,separators=(',',':')))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src','data','starbase.js'),'w').write('\n'.join(out)+'\n')
print('ok')
