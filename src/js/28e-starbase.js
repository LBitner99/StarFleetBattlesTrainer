/* ===== Starbases (R1.1) ===== */
// [R1.1A] The five starbases (Federation, Klingon, Kzinti, Gorn, Romulan). Y168 is the assumed year (SG8.2): 50 shield boxes a facing, BPV 600. The Y170 refit (+50 BPV) makes the shields 70 boxes (limited aegis, D13.4) and the Y175 refit (+25) makes them 80 (full aegis, D13.0). The SSD shows 8 extra armour boxes for each refit as well.
const SBK_=['SBF','SBK','SBZ','SBG','SBR'],isSB=k=>SBK_.includes(k);
SBK_.forEach(k=>{const [a,b]=SBR_REFITS[k];REFITS[k]=[
 {id:'y170',n:'Y170 refit: shields 70 boxes each, 8 more armour boxes, limited aegis (R1.1A)',pv:50,g:a},
 {id:'y175',n:'Y175 refit: shields 80 boxes each, 8 more armour boxes, full aegis (R1.1A)',pv:25,req:'y170',g:b}]});
// [FD3.8, E5.53, R1.1A] Type-H starbase drone racks (five magazines: 20 drone spaces here, the type-VI magazine is not modelled), ADD-30 launchers (five six-round magazines), and seeking-weapon control equal to double the sensor rating (R1.1A).
const _rfdSB=refitDef;refitDef=function(key,ids){const d=_rfdSB(key,ids);if(isSB(key)){d.rackT=Array((d.sys.Drone||0)).fill('H');d.addT=Array((d.sys.Add||0)).fill(30);d.ctl2=true;d.awr=true}return d} // [R1.1A, H4.3] the module AWR boxes are hit on APR damage and can arm photons; every power box is treated as AWR-capable here (see the backlog);
SBK_.forEach(k=>{SIL[k]=SIL.BATS}); // map token: the Battle Station silhouette stands in until a Starbase drawing is made (see the backlog)

/* ===== [R1.1D] Damage procedure for starbases ===== */
// Each docking module (shield #1 to #6) has its own boxes; the core holds the rest. s.sbm = {mod:[{system:count}x6], core:{system:count}}. s.sys stays the total of all regions, because the rest of the game reads it.
const SBARM=k=>(k===5||k===0||k===1)?'ArmorU':'ArmorL'; // [R1.1D 3] upper armor row takes damage through shields 6-1-2, lower row through 3-4-5
function sbMax(s,R,n,idx){return idx==='c'?(n==='ArmorU'||n==='ArmorL'?s.d.sys[n]:s.d.sbm.core[n]):s.d.sbm.mod[idx][n]||0}
function sbInit(s){const m=s.d.sbm;s.sbm={mod:m.mod.map(o=>({...o})),core:{...m.core,ArmorU:s.d.sys.ArmorU,ArmorL:s.d.sys.ArmorL}}}
const _mkShipSB=mkShip;mkShip=function(){const s=_mkShipSB.apply(this,arguments);if(s.d.sb)sbInit(s);return s};
// Keep the region counts equal to s.sys (damage control repairs and hand edits change s.sys only).
function sbSync(s){if(!s.sbm)sbInit(s);const regs=[...s.sbm.mod.map((R,i)=>[R,i]),[s.sbm.core,'c']],names=new Set(Object.keys(s.d.sys));
 names.forEach(n=>{if(n==='Excess Damage')return;let T=0;regs.forEach(([R])=>T+=R[n]||0);const tg=Math.max(0,s.sys[n]||0);
  while(T<tg){const r=regs.find(([R,i])=>(R[n]||0)<sbMax(s,R,n,i));if(!r)break;r[0][n]=(r[0][n]||0)+1;T++}
  while(T>tg){const r=[...regs].reverse().find(([R])=>(R[n]||0)>0);if(!r)break;r[0][n]--;T--}})}
function sbDac(tgt,src,used,k){crewTick(tgt);sbSync(tgt);used=used||new Set();const hid=isFoe(tgt),r=d6()+d6(),row=DAC[r],W=tgt.d.wmod,M=tgt.sbm.mod,C=tgt.sbm.core;
 const out=(txt,rc,j)=>LS(`  roll ${r}${j>=0?', column '+WCOL[j]:''}: ${txt}`+RL(rc),hid);
 const kill=c=>{c.alive=false;if('state' in c)c.state='empty';else if('st' in c){c.st=0;c.rdy=false}else if('armed' in c)c.armed=false;tgt.capCur=Math.min(tgt.capCur,capMax(tgt))};
 const lose=(R,n)=>{R[n]--;tgt.sys[n]--;if(n==='Battery'&&tgt.bat>tgt.sys.Battery){tgt.bat=tgt.sys.Battery;tgt.bw=Math.min(tgt.bw,tgt.bat);tgt.bi=Math.min(tgt.bi||0,Math.max(0,tgt.bat-tgt.bw))}};
 const wl=idx=>{const o=[];[[tgt.ph,W.ph],[tgt.tu,W.tu],[tgt.pl,W.pl],[tgt.di,W.di]].forEach(([L,mp])=>L.forEach((w,i)=>{if(w.alive&&mp[i]===idx)o.push(w)}));return o};
 // one DAC entry applied to one region (idx = module number 0-5, or 'c' for the core); returns text or null
 const tryHit=(R,idx,n)=>{
  if(n==='Phaser'||n==='Torp'||n==='Any Weapon'){const L=wl(idx);const c=n==='Phaser'?L.find(w=>tgt.ph.includes(w)):n==='Torp'?L.find(w=>!tgt.ph.includes(w)):(L.find(w=>tgt.ph.includes(w))||L[0]);if(!c)return null;kill(c);return `${c.name} destroyed`+(n==='Any Weapon'?' (any weapon hit, the owner picks)':'')}
  if(/ W En$|^Impulse$/.test(n))return null; // starbases have no warp engines of their own: their power is APR (R1.1C)
  let nn=n;if(n==='A Hull'||n==='F Hull')nn=(R['C Hull']||0)>0?'C Hull':'Cargo'; // [R1.1D] hull hits take the six hull boxes, then the repair boxes (counted as cargo in the Basic Set)
  if(n==='Drone'&&!((R.Drone||0)>0)&&idx==='c'&&(R.Add||0)>0)nn='Add';
  if(!((R[nn]||0)>0))return null;
  if((nn==='Sensor'||nn==='Scanner'||nn==='Damage Control')&&(tgt.sys[nn]||0)<=1)return null; // D4.33
  lose(R,nn);return `${nn==='Cargo'&&n!=='Cargo'?'Cargo (repair)':nn} box destroyed`};
 const modOpen=m=>m!==k&&(C[SBARM(m)]||0)<=0; // [R1.1D 4] another module may be hit only when the armor behind it is gone
 const go=(tg)=>{for(let j=0;j<12;j++){let n=row[j];const bold=n.endsWith('*');if(bold)n=n.slice(0,-1);const key=r+'|'+j;if(bold&&used.has(key))continue;
  for(const [R,idx] of tg){const t=tryHit(R,idx,n);if(t){if(bold)used.add(key);return {j,t,idx}}}}return null};
 const nm=i=>i==='c'?'the core':'docking module '+(i+1);
 let h=go([[M[k],k]]);if(h){out(`${h.t} in docking module ${k+1} (shield #${k+1})`,'R1.1D, D4.221',h.j);return}
 // [R1.1D 3] nothing left in the module: the hit goes into the main body and first strikes armor
 const sec=SBARM(k);
 if((C[sec]||0)>0){lose(C,sec);out(`docking module ${k+1} has nothing left to hit; the hit penetrates to the main body and destroys an ${sec==='ArmorU'?'upper':'lower'} armor box (${C[sec]} left)`,'R1.1D',-1);return}
 const tg=[[C,'c']];for(let m=0;m<6;m++)if(modOpen(m))tg.push([M[m],m]);
 h=go(tg);if(h){out(`docking module ${k+1} has nothing left to hit and the ${sec==='ArmorU'?'upper':'lower'} armor is gone: ${h.t} in ${nm(h.idx)}`,'R1.1D 3, 4, 5',h.j);return}
 const oth=sec==='ArmorU'?'ArmorL':'ArmorU'; // [R1.1D 5] excess damage is scored on the armor on the other side of the core
 if((C[oth]||0)>0){lose(C,oth);out(`excess damage strikes the armor on the other side of the core (${C[oth]} left)`,'R1.1D 5',-1);return}
 if(tgt.exd===undefined)tgt.exd=exdOf(tgt.d.key);
 if(tgt.exd>0){tgt.exd--;out(`Excess Damage box destroyed (${tgt.exd} left)`,'R1.1D 5, D4.4',12)}else{tgt.boom=true;out('an Excess Damage hit with no Excess Damage boxes left: the starbase is destroyed','R1.1D 5, D4.4',12)}}
// SSD sheet: dead boxes per module / core.
const _deadSetSB=deadSet;deadSet=function(s,S){if(!s.d.sb)return _deadSetSB(s,S);sbSync(s);const d={},G=GEO[s.key].g;
 S.sh.forEach((a,k)=>{const n=Math.max(0,a.length-s.sh[k]);for(let i=0;i<n;i++)d[a[a.length-1-i].id]=1});
 const by={};S.gr.forEach((grp,gi)=>{const g=G[gi];if(!g||g[0]!=='y')return;const key=g[1]+'@'+g[6];(by[key]=by[key]||{n:g[1],reg:g[6],b:[]}).b.push(...grp.filter(o=>!o.rf))});
 Object.values(by).forEach(o=>{const cur=o.n==='Excess Damage'?(s.exd===undefined?exdOf(s.key):s.exd):((o.reg==='c'?s.sbm.core:s.sbm.mod[o.reg])[o.n]||0);for(let i=0;i<Math.max(0,o.b.length-cur);i++)d[o.b[i].id]=1});
 [['ph',s.ph],['pt',s.tu],['ds',s.di],['pl',s.pl]].forEach(([k,L])=>S.w[k].forEach((b,i)=>{if(L[i]&&!L[i].alive)d[b.id]=1}));return d};
const _ssdTogSB=ssdTog;ssdTog=function(k,id){const s=sh[k];if(!s.d.sb)return _ssdTogSB(k,id);const S=prep(s.key,s.rf),b=S.bx[id];if(b.t!=='y')return _ssdTogSB(k,id);
 sbSync(s);const d=deadSet(s,S),G=GEO[s.key].g,gi=S.gr.findIndex(g=>g.includes(b)),g=G[gi],reg=g[6],n=g[1],dead=!!d[id];
 if(n==='Excess Damage'){if(s.exd===undefined)s.exd=exdOf(s.key);s.exd=Math.max(0,Math.min(exdOf(s.key),s.exd+(dead?1:-1)))}
 else{const R=reg==='c'?s.sbm.core:s.sbm.mod[reg],mx=sbMax(s,R,n,reg),v=Math.max(0,Math.min(mx,(R[n]||0)+(dead?1:-1)));s.sys[n]+=v-(R[n]||0);R[n]=v}
 L(`Manual edit: ${s.tag} ${n} box (${reg==='c'?'core':'docking module '+(reg+1)}) ${dead?'restored':'marked destroyed'}.`);draw()};
