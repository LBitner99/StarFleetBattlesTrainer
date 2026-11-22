let TRK={};
/* ===== refits ===== */
['CC','DN'].forEach(k=>{SHIPS[k].sys.APR=2;GEO[k].g.forEach(g=>{if(g[0]==='y'&&g[1]==='APR'){g[4]=0;g[3].forEach(b=>{b.length=2})}})});
['GCA','GCL'].forEach(k=>GEO[k].g.forEach(g=>{if(g[0]==='s'&&(g[1]===1||g[1]===2)){const n=[];g[3].forEach(b=>{n.push(b);n.push([b[0]+32,b[1]].concat(b.slice(2)))});g[3]=n}}));
SHIPS.GCA.shields.splice(0,6,30,24,24,24,24,24);SHIPS.GCL.shields.splice(0,6,24,18,16,16,16,18);
const LSA=['LF','L','LR'],RSA=['RF','R','RR'],LPA=['L','LF','RF'],RPA=['LF','RF','R'];
const REFITS={
 CA:[{id:'car',n:'CAR: two rear Ph-1 (R2.R2)',pv:4,g:[35],arcs:{35:['RH']}},
  {id:'plus',n:'CA+: stronger #3/#4/#5 shields, 2 APR, a drone rack, two Ph-3 (R2.R1)',pv:14,g:[2,3,4,22,30,36,37],arcs:{36:['ALL'],37:['ALL']}},
  {id:'awr',n:'AWR: the APRs become warp reactors (R2.R3)',pv:2,req:'plus',awr:1},{id:'y175',n:'Y175 refit: type-B drone rack (R2.R4)',pv:0,req:'plus',y175:1}],
 CC:[{id:'plus',n:'CC+: stronger #3/#4/#5 shields, a drone rack, two Ph-3 (R2.R1)',pv:10,g:[2,3,4,31,37,38],arcs:{37:['ALL'],38:['ALL']}},
  {id:'awr',n:'AWR: the APRs become warp reactors (R2.R3)',pv:2,awr:1},{id:'y175',n:'Y175 refit: type-B drone rack (R2.R4)',pv:0,req:'plus',y175:1}],
 DN:[{id:'awr',n:'AWR: the APRs become warp reactors (R2.R3)',pv:2,awr:1}],
 DD:[{id:'plus',n:'DD+: two Ph-3 (R2.R1)',pv:6,g:[28,29],arcs:{28:LSA,29:RSA}}],
 SC:[{id:'plus',n:'SC+: two Ph-3 and four of the labs become APRs (R2.7)',pv:4,g:[15,27,28,29],arcs:{27:LSA,28:RSA}}],
 CL:[{id:'plus',n:'CL+: stronger shields, a drone rack, two Ph-3 (R2.R1)',pv:13,g:[0,1,2,3,4,5,30,36],arcs:{36:['ALL']}},
  {id:'awr',n:'AWR: the APRs become warp reactors (R2.R3)',pv:2,awr:1},{id:'y175',n:'Y175 refit: type-B drone rack (R2.R4)',pv:0,req:'plus',y175:1}],
 D7:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, an ADD rack, DERFACS (R3.R1)',pv:7,g:[2,3,4,33]},{id:'k',n:'K-refit: phasers #1 to #3 become Ph-1 (R3.R2)',pv:3,req:'b',ph:{0:'P1',1:'P1',2:'P1'}},{id:'uim1',n:'UIM refit: one Ubitron interface module (D6.5)',pv:5,uim:1},{id:'uim2',n:'A second UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: type-B drone racks, ADD-12 (R3.R4)',pv:4,y175:1}],
 D6:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, an ADD rack, DERFACS (R3.R1)',pv:10,g:[2,3,4,33]},{id:'k',n:'K-refit: phasers #1 to #3 become Ph-1 (R3.R2)',pv:3,req:'b',ph:{0:'P1',1:'P1',2:'P1'}},{id:'uim1',n:'UIM refit: one Ubitron interface module (D6.5)',pv:5,uim:1},{id:'uim2',n:'A second UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: type-B drone racks, ADD-12 (R3.R4)',pv:4,y175:1}],
 F5:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields and an ADD rack (R3.R1)',pv:5,g:[2,3,4,28]},{id:'k',n:'K-refit: phasers #1 and #2 become Ph-1 (R3.R2)',pv:2,req:'b',ph:{0:'P1',1:'P1'}},{id:'y175',n:'Y175 refit: type-B drone racks, ADD-12 (R3.R4)',pv:3,y175:1}],
 E4:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields and an ADD rack (R3.R1)',pv:4,g:[2,3,4,24]},{id:'y175',n:'Y175 refit: type-B drone rack, ADD-12 (R3.R4)',pv:3,y175:1}],
 C9:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, DERFACS (R3.R1)',pv:6,g:[2,3,4]},{id:'k',n:'K-refit: phasers #3 to #6 become Ph-1 (R3.R2)',pv:4,req:'b',ph:{2:'P1',3:'P1',4:'P1',5:'P1'}},{id:'uim1',n:'UIM refit: a third Ubitron interface module (two are standard) (D6.5)',pv:5,uim:1},{id:'uim2',n:'Extra UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: type-B drone racks, ADD-12 (R3.R4)',pv:5,y175:1}],
 C8:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, DERFACS (R3.R1)',pv:7,g:[2,3,4]},{id:'k',n:'K-refit: phasers #3 to #10 become Ph-1 (R3.R2)',pv:8,req:'b',ph:{2:'P1',3:'P1',4:'P1',5:'P1',6:'P1',7:'P1',8:'P1',9:'P1'}},{id:'uim1',n:'UIM refit: a third Ubitron interface module (two are standard) (D6.5)',pv:5,uim:1},{id:'uim2',n:'Extra UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: type-B drone racks, ADD-12 (R3.R4)',pv:8,y175:1}],
 WE:[{id:'rear',n:'Rear phaser refit: two Ph-3 (R4.3)',pv:3,g:[26,27],arcs:{26:['L','LR','RR'],27:['R','LR','RR']}}],
 BT:[{id:'y165',n:'Y165 plus refit: two drone racks and four Ph-3 (R2.10)',pv:28,g:[14,15,16,17,19,20],arcs:{14:LSA,15:RSA,16:['ALL'],17:['ALL']}},{id:'gad',n:'Type-G racks carry anti-drones (FD3.7)',pv:0,req:'y165',gad:1}],
 TUG:[{id:'y165',n:'Y165 plus refit: two Ph-3 and a drone rack (R2.8)',pv:8,g:[10,11,12],arcs:{10:LSA,11:RSA}},{id:'gad',n:'Type-G rack carries anti-drones (FD3.7)',pv:0,req:'y165',gad:1},{id:'cp1',n:'Carries one cargo pod (R2.11, G14)',pv:21,g:[31],wt:1},{id:'cp2',n:'Carries a second cargo pod (R2.11)',pv:21,g:[32],wt:1,req:'cp1'},{id:'sl1',n:'Carries a Starliner pod (R2.9)',pv:48,g:[33,34,35,36,37,38,39,40,41,42,43,44,45],wt:1}],
 BP:[{id:'y165',n:'Y165 plus refit: two Ph-3 and a drone rack (R2.10)',pv:20,g:[10,11,13],arcs:{10:['ALL'],11:['ALL']}},{id:'gad',n:'Type-G rack carries anti-drones (FD3.7)',pv:0,req:'y165',gad:1}],
 EFF:[{id:'c10',n:'C-10 refit: stronger #3/#4/#5 shields, two ADD, two drone racks and two Ph-3 (R5.8)',pv:9,g:[2,3,4,13,29,35,36],arcs:{35:LSA,36:RSA}}],
 KFF:[{id:'c10',n:'C-10 refit: stronger #3/#4/#5 shields and more drone racks (R5.8)',pv:9,g:[2,3,4,27,28]},{id:'y175',n:'Y175 refit: two type-C racks, the rest type-B (R5.R5)',pv:0,y175k:1}],
 KR:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, swivelling plasma-S (R4.R1)',pv:17,g:[2,3,4],pl:{0:{T:'S',arcs:LPA},1:{T:'S',arcs:RPA}}}],
 K5R:[{id:'b',n:'B-refit: stronger #3/#4/#5 shields, swivelling plasma-F (R4.R1)',pv:6,g:[2,3,4],pl:{0:{arcs:LPA},1:{arcs:RPA}}}],
 KCL:[{id:'c12',n:'C-12 refit: 2 more APR, drone racks, disruptors C and D, range 30 (R5.5)',pv:12,g:[19,28,29,37,38],arcs:{37:['LF','RF','L'],38:['LF','RF','R']},dmax:30,disArcs:{0:['LF','RF','L'],1:['LF','RF','R']},phArcs:{0:['LF','RF','L'],1:['LF','RF','R']}},{id:'uim1',n:'UIM refit: one Ubitron interface module (D6.5)',pv:5,uim:1},{id:'uim2',n:'A second UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: two type-C racks, the rest type-B (R5.R5)',pv:0,y175k:1}],
 KCS:[{id:'uim1',n:'UIM refit: one Ubitron interface module (D6.5)',pv:5,uim:1},{id:'uim2',n:'A second UIM (D6.5)',pv:5,req:'uim1',uim:1},{id:'y175',n:'Y175 refit: two type-C racks, the rest type-B (R5.R5)',pv:0,y175k:1}],
 KBC:[{id:'y175',n:'Y175 refit: two type-C racks, the rest type-B (R5.R5)',pv:0,y175k:1}],
 KCC:[{id:'y175',n:'Y175 refit: two type-C racks, the rest type-B (R5.R5)',pv:0,y175k:1}],
 GCA:[{id:'plus',n:'Plus refit: plasma-S on swivel mounts, two Ph-3, two plasma-F (R6.2)',pv:26,g:[39,40,43,46],arcs:{39:LSA,40:RSA,43:LSA,46:RSA},pl:{0:{T:'S',arcs:LPA},1:{T:'S',arcs:RPA}}}],
 GCL:[{id:'plus',n:'Plus refit: plasma-S on swivel mounts (R6.3)',pv:16,pl:{0:{T:'S',arcs:LPA},1:{T:'S',arcs:RPA}}},{id:'f',n:'F refit: two Ph-3 and two plasma-F (R6.3)',pv:14,g:[32,33,34,37],arcs:{32:LSA,33:RSA,34:LSA,37:RSA}}],
 GDD:[{id:'plus',n:'Plus refit: stronger shields and a battery (R6.4)',pv:6,g:[0,1,2,3,4,5,16]}],
 CR:[{id:'plus',n:'Plus refit (Y169): the shaded shield boxes are added, six more on #1 and eight on each of the others (R8.2)',pv:8,sh:[6,8,8,8,8,8]},{id:'cloak',n:'Cloak refit (Y155): a cloaking device, cost 10/2 (G15.3, R8.2)',pv:18,clk:[10,2]},{id:'oak',n:'OAKDISC (Y127): seeking-weapon control doubled, every rack can fire at its full rate (FD4.5)',pv:5,oak:1}]};
const RFTODO={CR:'the SSD drawing of the extra Plus shield boxes',KR:'sabot (rules are in Module R10)',K5R:'sabot (rules are in Module R10)',GCA:'sabot (Module R10)',GCL:'sabot (Module R10)',GDD:'sabot (Module R10)',WE:'sabot (Module R10)'};
const rfSet=(key,ids)=>{const a=new Set();(REFITS[key]||[]).forEach(r=>{if(r.g&&ids&&ids.includes(r.id))r.g.forEach(g=>a.add(g))});return a};
const UIMSTD={C8:2,C9:2},DERNEEDB=['D7','C8','C9'];
function refitDef(key,ids){const base=DEFS[key];ids=ids||[];
 const d=Object.assign({},base),G=GEO[key],act=rfSet(key,ids),RL=REFITS[key]||[];
 d.sys={...base.sys};d.shields=[...base.shields];d.phs=base.phs.map(p=>({...p}));d.plas=base.plas.map(q=>({...q}));d.dis=base.dis?{...base.dis,each:(base.dis.each||Array.from({length:base.dis.n},()=>base.dis.arcs)).map(a=>[...a])}:null;d.pv=base.pv;d.awr=false;d.gad=false;let wt=0;d.uim=UIMSTD[key]||0;d.rackAmmo=4;d.addAmmo=6;
 G.g.forEach((g,gi)=>{if(!act.has(gi))return;if(g[5]==='x'){if(g[0]==='y')d.sys[g[1]]-=g[3].length;return} // a group marked 'x' is removed by the refit (SC+ labs)
  g[3].forEach((b,i)=>{if(!(g[4]||b[2]))return;
  if(g[0]==='s')d.shields[g[1]]++;else if(g[0]==='y')d.sys[g[1]]=(d.sys[g[1]]||0)+1;
  else if(g[0]==='w'&&g[1]==='ph'){const lab=g[2]?g[2][i]:'',own=RL.find(r=>r.g&&r.g.includes(gi)&&ids.includes(r.id)&&r.arcs&&r.arcs[gi]);
   d.phs.push({T:/Ph-3/.test(lab)?P3:P1,arcs:own?own.arcs[gi]:['ALL']})}
  else if(g[0]==='w'&&g[1]==='ds'){const own=RL.find(r=>r.g&&r.g.includes(gi)&&ids.includes(r.id)&&r.arcs&&r.arcs[gi]);d.dis.n++;d.dis.each.push(own?own.arcs[gi]:d.dis.arcs)}
  else if(g[0]==='w'&&g[1]==='pl'){const lab=g[2]?g[2][i]:'',own=RL.find(r=>r.g&&r.g.includes(gi)&&ids.includes(r.id)&&r.arcs&&r.arcs[gi]);d.plas.push({T:/Plasma-(\w)/.exec(lab)[1],arcs:own?own.arcs[gi]:['ALL']})}})});
 RL.forEach(r=>{if(!ids.includes(r.id))return;d.pv+=r.pv;if(r.sh)for(let i=0;i<6;i++)d.shields[i]+=r.sh[i]; // [R8.2] Plus refit shield boxes
  if(r.clk)d.clk=r.clk; // [G15.3] Orion cloak refit
  if(r.wt)wt+=r.wt;if(r.gad)d.gad=true;if(r.awr)d.awr=true;if(r.uim)d.uim+=r.uim;if(r.oak)d.oak=true;if(r.y175){d.rackAmmo=6;d.addAmmo=12}if(r.y175k){d.rackKz=true;d.pv+=d.sys.Drone||0} // [R5.R5, FD3.2, FD3.3] Kzinti Y175: the first two type-A racks become type-C (4 spaces, two launches a turn), the rest type-B (6 spaces); one point each
 if(r.ph)for(const i in r.ph)d.phs[i]={...d.phs[i],T:TT[r.ph[i]]};if(r.phArcs)for(const i in r.phArcs)d.phs[i]={...d.phs[i],arcs:r.phArcs[i]};if(r.pl)for(const i in r.pl)d.plas[i]={...d.plas[i],...r.pl[i]};if(r.dmax)d.dis.max=r.dmax;if(r.disArcs)for(const i in r.disArcs)d.dis.each[i]=r.disArcs[i]});
 if(base.tug&&wt>=2){d.mc=wt>=3?2:1.5;d.cat=wt>=3?'F':'E'} // [G14.21, Annex #3A] two pod weights: movement cost 1.5, turn mode E
 d.derf=!!(d.dis&&d.dis.max>=30&&(!DERNEEDB.includes(key)||ids.includes('b')));if(optOM&&omOn(key,ids))omApply(d,ids);d.rfIds=ids;if(ids.filter(i=>!isOM(i)&&!/^co:/.test(i)).length)d.n=base.n+' ('+ids.filter(i=>!isOM(i)&&!/^co:/.test(i)).map(i=>(RL.find(r=>r.id===i)||{id:i}).id.toUpperCase()).join(', ')+' refit'+(ids.filter(i=>!isOM(i)&&!/^co:/.test(i)).length>1?'s':'')+')';return d}
let rfA=[],rfB=[];
function togRf(who,id,key){const t=curTab(who);if(key&&key!==slotK(who,t))setSlot(who,t,key,[]);let a=slotRf(who,t);a=a.includes(id)?a.filter(x=>x!==id):[...a,id];key=slotK(who,t);
 a=a.filter(x=>{const r=REFITS[key].find(q=>q.id===x);return !r||!r.req||a.includes(r.req)});setSlot(who,t,key,a);drawSel()}
const SSDS={};
function prep(key,ids){ids=ids||[];const ck=key+'|'+[...ids].sort().join(',');if(SSDS[ck])return SSDS[ck];const act=rfSet(key,ids);const G=GEO[key],S={W:G.W,H:G.H,bx:[],gr:[],by:{},sh:[[],[],[],[],[],[]],w:{ph:[],pt:[],ds:[],pl:[]}},WX={ph:[],pt:[],ds:[],pl:[]};
 const omA=optOM&&omOn(key,ids);G.g.forEach((g,gi)=>{const grp=[];if((g[5]==='x'&&act.has(gi))||(g[5]==='o'&&!act.has(gi))||(omA&&g[0]==='w'&&g[1]==='ds'))return;g[3].forEach((b,i)=>{const o={id:S.bx.length,x:b[0],y:b[1],t:g[0],k:g[1],rf:!!(g[4]||b[2])&&!act.has(gi),lab:g[2]?g[2][i]:null,gi:i};S.bx.push(o);grp.push(o);
  if(g[0]==='s'){if(!o.rf)S.sh[g[1]].push(o)}else if(g[0]==='w'){if(!o.rf)(g[4]||b[2]?WX:S.w)[g[1]].push(o)}else{o.n=g[1];if(!o.rf)(S.by[g[1]]=S.by[g[1]]||[]).push(o)}});S.gr.push(grp)});
 for(const k in WX)S.w[k]=S.w[k].concat(WX[k]);
 if(omA){const P=G.g.find(g=>g[0]==='w'&&g[1]==='ds')[3];omGet(ids).forEach((c,k)=>{const w=OMW[c],grp=[],o={id:S.bx.length,x:P[k][0],y:P[k][1],rf:false,gi:0};if(['ds','ph','pt','pl'].includes(w.k)){o.t='w';o.k=w.k;o.lab=w.n.replace(' (standard)','')+' '+'ABC'[k];S.bx.push(o);grp.push(o);S.w[w.k].push(o)}else{o.t='y';o.k=o.n=w.k==='rk'?'Drone':w.k==='ad'?'Add':w.sy;o.lab=null;S.bx.push(o);grp.push(o);(S.by[o.n]=S.by[o.n]||[]).push(o)}S.gr.push(grp)})}
 return SSDS[ck]=S}
function deadSet(s,S){const d={};
 S.sh.forEach((a,k)=>{const n=Math.max(0,a.length-s.sh[k]);for(let i=0;i<n;i++)d[a[a.length-1-i].id]=1});
 Object.keys(S.by).forEach(n=>{if(!(n in s.d.sys))return;const a=S.by[n],n2=Math.max(0,a.length-(s.sys[n]||0));for(let i=0;i<n2;i++)d[a[i].id]=1});
 [['ph',s.ph],['pt',s.tu],['ds',s.di],['pl',s.pl]].forEach(([k,L])=>S.w[k].forEach((b,i)=>{if(L[i]&&!L[i].alive)d[b.id]=1}));return d}
const SHC=b=>b.t==='s'?'#3b82f6':b.t==='w'?(b.k==='ph'?'#a855f7':b.k==='pt'?'#f97316':b.k==='pl'?'#06b6d4':'#22c55e'):/W En|Impulse|APR|Battery/.test(b.n)?'#f59e0b':(TRK[b.n]||b.n==='Excess Damage')?'#14b8a6':'#94a3b8';
const ABR={'Left W En':'L WARP','Right W En':'R WARP','Trans':'TRAN','Tractor':'TRAC','Battery':'BTTY','Emer Bridge':'EMER','Aux Control':'AUX','Damage Control':'DAM CON','Excess Damage':'EX DAM','Shuttle':'SHTL','A Hull':'A HULL','F Hull':'F HULL','Impulse':'IMP','Bridge':'BRIDGE','Probe':'PRB','Lab':'LAB','Drone':'DRONE','Add':'ADD','Armor':'ARMOR','C Hull':'C HULL','APR':'APR','ArmorU':'ARMOR (UPPER, SHIELDS 6-1-2)','ArmorL':'ARMOR (LOWER, SHIELDS 3-4-5)','Sensor':'SENSOR','Scanner':'SCANNER','SS-A':'SPEC 1-4','SS-B':'SPEC 5-8'};
function ssdSvg(s,k){TRK=s.d.trk;const S=prep(s.key,s.rf),d=deadSet(s,S),B=S.bx,OL=GEO[s.key].o||[];
 const M=26,ox=OL.flat().map(p=>p[0]),oy=OL.flat().map(p=>p[1]),x0=Math.min(...B.map(b=>b.x),...ox)-M,x1=Math.max(...B.map(b=>b.x+28),...ox)+M+20,y0=Math.min(...B.map(b=>b.y),...oy)-50,y1=Math.max(...B.map(b=>b.y+28),...oy)+M;
 let o=`<svg viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" style="width:100%;max-height:calc(100vh - 250px);display:block;color:var(--tx)" font-family="system-ui,-apple-system,Segoe UI,sans-serif">`;
 o+=OL.map(p=>`<path d="M${p.map(q=>q[0]+' '+q[1]).join('L')}Z" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd"/>`).join('');
 o+=(GEO[s.key].t||[]).map(t=>`<text x="${t[0]}" y="${t[1]}" font-size="24" font-weight="700" fill="currentColor" fill-opacity=".75">${t[2]}</text>`).join(''); // module headings (starbases)
 S.gr.forEach(g=>{const ins=g.filter(b=>!b.rf);const all=ins.length?ins:[];if(!all.length)return;const f=g[0],gx=Math.min(...all.map(b=>b.x)),gy=Math.min(...all.map(b=>b.y)),gx2=Math.max(...all.map(b=>b.x))+28,gy2=Math.max(...all.map(b=>b.y))+28;
  if(f.t==='s'){const left=all.filter(b=>!d[b.id]).length,ex=s.spec[f.k]?` +${s.spec[f.k]}`:'';o+=`<text x="${(gx+gx2)/2}" y="${gy-10}" text-anchor="middle" font-size="19" font-weight="700" fill="#3b82f6">#${f.k+1}  ${left}/${all.length}${ex}</text>`}
  else{o+=`<rect x="${gx-5}" y="${gy-5}" width="${gx2-gx+10}" height="${gy2-gy+10}" rx="9" fill="none" stroke="currentColor" stroke-opacity=".2"/>`;if(f.t==='y')o+=`<text x="${gx-3}" y="${gy-11}" font-size="14" fill="currentColor" fill-opacity=".65">${ABR[f.n]||f.n}</text>`}});
 B.forEach(b=>{const c=SHC(b);
  if(b.rf){o+=`<rect x="${b.x+1}" y="${b.y+1}" width="26" height="26" rx="5" fill="none" stroke="${c}" stroke-opacity=".35" stroke-dasharray="4 3"/>`;return}
  const dd=d[b.id];let fo=.22,tx='',ring='';
  if(b.t==='w'){const m=b.lab.match(/#(\d+)|([A-M])(?: \(rear\))?$/);tx=m?(m[1]||m[2]):'';
   if(!dd){if(b.k==='pt'){const t=s.tu[S.w.pt.indexOf(b)]||{state:'empty'};fo=t.state==='armed'?.85:t.state==='half'?.5:.15}
    else if(b.k==='pl'){const q=s.pl[S.w.pl.indexOf(b)];fo=q?(q.rdy||q.st===3?.85:q.st===2?.6:q.st===1?.4:.15):.15}
    else if(b.k==='ds'){const t=s.di[b.gi-0];const idx=S.w.ds.indexOf(b);const q=s.di[idx];fo=q&&q.armed?.85:.15}
    else{const idx=S.w.ph.indexOf(b),q=s.ph[idx];if(q&&q.fired)ring=' stroke-dasharray="3 2"'}}}
  else if(TRK[b.n]){tx=TRK[b.n][b.gi===undefined?0:b.gi];if(tx===undefined)tx=''}
  o+=`<g class="bxg" onclick="ssdTog(${k},${b.id})"><title>${b.lab||b.n||('Shield #'+(b.k+1))}</title><rect x="${b.x+1}" y="${b.y+1}" width="26" height="26" rx="5" fill="${dd?'#dc2626':c}" fill-opacity="${dd?1:fo}" stroke="${dd?'#991b1b':c}" stroke-width="2"${ring}/>`+(dd?`<path d="M${b.x+8} ${b.y+8}L${b.x+20} ${b.y+20}M${b.x+20} ${b.y+8}L${b.x+8} ${b.y+20}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`:(tx!==''?`<text x="${b.x+14}" y="${b.y+19}" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">${tx}</text>`:''))+`</g>`});
 return o+'</svg>'}
function ssdTog(k,id){const s=sh[k],S=prep(s.key,s.rf),b=S.bx[id],d=deadSet(s,S);
 if(b.t==='s'){s.sh[b.k]=Math.max(0,Math.min(s.d.shields[b.k],s.sh[b.k]+(d[id]?1:-1)))}
 else if(b.t==='w'){const L=b.k==='ph'?s.ph:b.k==='pt'?s.tu:b.k==='pl'?s.pl:s.di,i=S.w[b.k].indexOf(b),q=L[i];if(q){q.alive=!q.alive;if(!q.alive&&'state' in q)q.state='empty';if(!q.alive&&'armed' in q)q.armed=false;if(!q.alive&&'st' in q){q.st=0;q.rdy=false}s.capCur=Math.min(s.capCur,capMax(s))}}
 else{const n=b.n;if(!(n in s.d.sys))return;s.sys[n]=Math.max(0,Math.min(s.d.sys[n],s.sys[n]+(d[id]?1:-1)))}
 L(`Manual edit: ${s.tag} ${b.lab||b.n||'shield #'+(b.k+1)} box ${d[id]?'restored':'marked destroyed'}.`);draw()}
const LEG='<div class="leg">'+[['#3b82f6','Shield'],['#a855f7','Phaser'],['#f97316','Photon (solid = armed)'],['#06b6d4','Plasma (solid = armed)'],['#22c55e','Disruptor (solid = charged)'],['#f59e0b','Power'],['#14b8a6','Sensors / damage tracks'],['#94a3b8','Other']].map(x=>`<span style="margin-right:10px;white-space:nowrap"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${x[0]}33;border:2px solid ${x[0]};vertical-align:-2px"></span> ${x[1]}</span>`).join('')+'<span style="white-space:nowrap"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#dc2626;vertical-align:-2px"></span> Destroyed</span></div>';
function ssdPanel(k){const s=sh[k],p=pw(s),col=s.col;
 const shl=s.sh.reduce((a,b)=>a+b,0),shm=s.d.shields.reduce((a,b)=>a+b,0);
 return`<div class="card"><h2 style="color:${col};margin-bottom:4px">${s.n}${k===0?' (you)':s.tm===0?' (your ally)':''}</h2>${k===0&&s.qh?`<div style="margin-bottom:6px"><button onclick="qReveal(sh[0],'is revealed by its captain');draw()">Reveal this Q-ship (R1.7B)</button> <span class="mu">The convoy takes you for a freighter until you do, are hit, or fire a weapon no freighter has.</span></div>`:''}<div style="margin-bottom:4px">${ckHid(s)?'<span class="chip">Hex and facing <b>hidden</b> (cloaked, G13.61)</span>':`<span class="chip">Hex <b>${hexNo(s.c,s.r)}</b> facing <b>${FL[s.f]}</b></span>`}<span class="chip">Speed <b>${s.sp}</b></span><span class="chip">Shields <b>${shl}</b>/${shm}</span><span class="chip">Power <b>${p.warp+p.imp+p.apr}</b>/${s.p0}</span><span class="chip">Phaser charge <b>${fmt(s.capCur)}</b>/${fmt(capMax(s))}</span><span class="chip">Batteries <b>${s.bat}</b>/${s.sys.Battery||0}${s.bw?` (${s.bw} reserve warp)`:''}</span><span class="chip">Sensor <b>${sensorRate(s)}</b>, scanner <b>+${scanAdj(s)}</b>${s.lock===false?' <b class="bad">no lock-on</b>':''}; ECM <b>${s.ecm||0}</b> ECCM <b>${s.eccm||0}</b></span>${s.gen?`<span class="chip">General reinf. <b>${s.gen}</b></span>`:''}${s.d.clk?`<span class="chip">Cloak <b>${{off:'off',on:'ON',out:'fading out',in:'fading in'}[s.ck.mode]}</b></span>`:''}<span class="chip">HET breakdown on <b>${s.bd}+</b>${s.hetAvail?`, ${s.hetAvail} paid`:''}</span>${absI(imp+1)<=s.noMove?'<span class="chip bad">Broken down</span>':''}</div>
 <div class="mu" style="font-size:.82rem;margin-bottom:4px">Updates live as the game plays. Tap a box to override it by hand (mark destroyed or restore). Refit-only boxes are dashed and not used.</div>
 <div style="margin:6px 0">${ssdSvg(s,k)}</div>${LEG}</div>`}
