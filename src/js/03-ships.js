/* ================= ships ================= */
// [D8.2] Does the ship have this critical hit in force?
const hasCrit=(s,k)=>(s.crit||[]).some(c=>c.k===k);
const pw=(s,raw)=>{let w=(s.sys['Left W En']||0)+(s.sys['Right W En']||0)+(s.sys['Center W En']||0);if(!raw&&s.dbl&&s.d.dbl)w+=(s.dbl[0]?(s.sys['Left W En']||0):0)+(s.dbl[1]?(s.sys['Right W En']||0):0); // G15.2: a doubled engine gives twice its output
 return{warp:(s.sab&&!raw)?0:(hasCrit(s,'warp')?Math.floor(w/2):w)+engP(s), // [SH1.45] sabotaged warp engines give no power at all
 imp:(s.sys.Impulse||0)*((!raw&&s.dbl&&s.d.dbl&&s.dbl[2])?2:1),apr:s.sys.APR||0}}; // [G15.23] doubled impulse engine gives twice its power
const capMax=s=>s.ph.filter(w=>w.alive).reduce((a,w)=>a+(w.T.cp||1),0);
Object.keys(DEFS).forEach(k=>{const c=CREW[k]||[20,6];DEFS[k].cr=c[0];DEFS[k].bp=c[1]});
// [G9.42] General crew units needed to man a ship, by its crew size (1 to 4).
const minCrew=n=>n<=4?1:n<=8?2:n<=12?3:4,fh=x=>Number.isInteger(x)?String(x):Math.floor(x)+'½';
// [G9.42] Is the ship below its minimum crew?
const under=s=>s.gc<minCrew(s.d.cr)&&!legAsCrew(s);
// [G22.121] A living legendary officer stands in for one missing crew unit to reach the minimum crew; while he does he loses all his other abilities.
const legAsCrew=s=>!!(optLeg&&s&&s.leg&&s.leg.st==='ok'&&s.gc<minCrew(s.d.cr)&&s.gc+1>=minCrew(s.d.cr));
const navCat=s=>hasRole(s,'nav')&&s.d.cat!=='A'&&s.d.cat!=='AA'?'ABCDEF'['ABCDEF'.indexOf(s.d.cat)-1]||s.d.cat:s.d.cat; // [G22.811] a legendary navigator improves the turn mode category by one level
const tmS=s=>s.sp>1?tmFor(navCat(s),(LNK&&optTrac&&(LNK.by===s||LNK.on===s))?Math.max(1,linkSp(s)):s.sp)+(under(s)?1:0)+(s.emOn&&!nimble(s)?1:0)+(hasCrit(s,'man')?1:0):0;
// [G9.422] An undermanned ship can only operate as many weapons as it has crew units beyond two.
function mannedW(s,w){if(!under(s)||w.pr)return true;const o=[...s.ph,...s.tu,...s.di,...(s.pl||[])].filter(x=>x.alive),k=o.indexOf(w);return k>=0&&k<Math.max(0,Math.floor(s.gc)-2)}
// [G9.22] Every tenth internal damage point kills one crew unit.
function crewTick(s){s.intTot++;if(s.intTot%10)return;
 let m=`Internal damage point ${s.intTot} on ${s.tag}: one crew unit is killed`;
 if(s.gc>1){s.gc--;s.cK++}else m=`Internal damage point ${s.intTot} on ${s.tag}: the last crew unit cannot be killed`;
 if(s.intTot>=50){if(s.bp>2){s.bp--;s.bK++;m+=' and one boarding party is destroyed'}else if(s.bp===2)m+=' (the last two boarding parties cannot be destroyed)'}else m+=' (the first four boarding party losses are ignored)';
 LS(m+'.'+RL('G9.21, D7.21, G9.22')+crewNote(s),isFoe(s))}
// [G9.2] Text of the crew status after a loss.
function crewNote(s){let t=` Crew now ${fh(s.gc)} general crew unit${s.gc===1?'':'s'} + ${s.bp} boarding part${s.bp===1?'y':'ies'}.`;
 if(under(s)&&s.bp===2){s.bp=0;s.gc+=1;t+=` The last two boarding parties are disbanded into one general crew unit (${fh(s.gc)} now).`+RL('G9.431')}
 if(under(s)&&!s.underN){s.underN=true;t+=` ${s.tag} is UNDERMANNED: turn mode +1, and only ${Math.max(0,Math.floor(s.gc)-2)} weapon${Math.floor(s.gc)-2===1?'':'s'} can be operated.`+RL('G9.41, G9.42, G9.421, G9.422')}
 return t}
function mkShip(key,c,r,f,col,tag,rf){const d=refitDef(key,rf);
 const s={tm:1,rf:rf||[],awr:!!d.awr,pl:d.plas.map((q,i)=>({alive:true,T:q.T,arcs:q.arcs,st:q.T==='F'?3:2,rdy:q.T==='F',fired:false,name:'Plasma-'+q.T+' '+'ABCD'[i]})),ck:{mode:'off',start:-99,onT:0,offT:0,lockBy:true,lastP:9},ckPaid:false,key,d,n:d.n,tag:tag||d.tag,col,c,r,f,sp:15,prev:15,st:99,sl:1,path:[[c,r]],sh:[...d.shields],sys:{...d.sys},retreat:false,
  ph:d.phs.map((a,i)=>({arcs:a.arcs,alive:true,fired:false,T:a.T,name:(a.T===P4?'Ph-4':a.T===P3?'Ph-3':a.T===P2?'Ph-2':'Ph-1')+' #'+(i+1)})),
  tu:d.torp?Array.from({length:d.torp.n},(_,i)=>({alive:true,state:'half',fired:false,ovl:0,arcs:d.torp.arcs,name:'Photon '+'ABCDEF'[i]})):[],
  di:d.dis?Array.from({length:d.dis.n},(_,i)=>({alive:true,armed:false,fired:false,ovl:false,arcs:(d.dis.each&&d.dis.each[i])||d.dis.arcs,max:(d.dis.maxs&&d.dis.maxs[i])||d.dis.max,name:'Disruptor '+'ABCDEF'[i]})):[],
  rep:[0,0,0,0,0,0],ecm:0,eccm:0,lock:true,bd:d.bd0,bat:d.sys.Battery||0,bw:0,bi:0,impMove:false,hetUsed:false,hetAvail:0,lastHet:-99,hetAt:-99,gc:d.cr-d.bp/2,gc0:d.cr-d.bp/2,bp:d.bp,intTot:0,cK:0,bK:0,underN:false,noMove:-1,noFire:-1,hetNext:undefined,ed:null,edPost:false,capCur:0,shOn:2,gen:0,spec:[0,0,0,0,0,0],fc:true,plan:null};
 s.rk=Array.from({length:d.sys.Drone||0},(_,j)=>d.rackT&&d.rackT[j]?({ammo:d.rackT[j]==='B'?6:4,last:-99,turn:0,nT:0,C:d.rackT[j]==='C'||(d.rackT[j]==='A'&&!!optRackC)}):d.rackKz?({ammo:j<2?4:6,last:-99,turn:0,nT:0,C:j<2}):({ammo:d.rackAmmo||4,last:-99,turn:0,nT:0,C:!!optRackC}));
 s.dn=[];s.tnLeft=0;s.cap={};s.part=0;
 s.pr=Array.from({length:d.sys.Probe||0},(_,i)=>({alive:true,ammo:5,st:0,fired:false,arcs:['ALL'],pr:true,name:'Probe '+(i+1)}));
 s.ad=Array.from({length:d.sys.Add||0},(_,j)=>({ammo:(d.addT&&d.addT[j])||d.addAmmo||6}));if(d.gad)s.rk.forEach((r,j)=>{r.ammo=0;r.adm=true;s.ad.push({ammo:16,g:j})}); // [FD3.7] a type-G rack loaded with anti-drones (8 in the rack and 8 in the all-ADD reload) fires them like an ADD launcher and launches no drones
 s.uim=d.uim||0;s.uimWait=0;s.derf=!!d.derf;s.di.forEach(w=>w.derf=s.derf&&(w.max||DIS.max)>=30);
 s.capCur=capMax(s);s.p0=pw(s).warp+pw(s).imp+pw(s).apr;return s}
const DCT=[4,4,2,2,2,0];
// [D9.2] Damage control rating, from the damage control track on the SSD.
const dcRating=s=>{const t=s.d.trk['Damage Control'],lost=s.d.sys['Damage Control']-s.sys['Damage Control'];const v=t[Math.min(t.length-1,Math.max(0,lost))];return s.gc<s.gc0/2?Math.min(v,2):v};
// [D9.21] Shield boxes missing on one shield (what repairs can restore).
const missing=(s,k)=>Math.max(0,s.d.shields[k]-s.sh[k]);
// [H1.0] Total power the ship can still generate: warp + impulse + auxiliary reactor.
const power=s=>{const p=pw(s);return p.warp+p.imp+p.apr};
