/* ================= [D9.7] Continuous Damage Repair (a core Basic Set rule, always in force) =================
   Each turn a ship earns repair points equal to its damage control rating (D9.711). In Energy Allocation they go to destroyed boxes at the
   cost on the Annex #9 chart. At most 5 points a turn on one box (D9.72, G17.33); one box at a time, so only the LAST job of a turn may be
   left unfinished and its points carry over (D9.74, D9.741, D9.742); a repair finishes at the end of the turn (D9.73); a ship may finish no
   more repairs in a scenario than its ORIGINAL damage control rating (D9.76); damage control and excess damage cannot be repaired (D9.76);
   a box destroyed again and repaired again counts again (D9.77). Shield boxes can be repaired this way too, but not on a box that the energy
   repair of D9.2 is also working on (D9.712).
   Not built: shuttle and fighter damage points (D9.76 shuttle repairs; the Duel has no landed shuttles), the cool-down note D9.743 (no weapon here has a
   cool-down), repair facilities (D9.75, G17.0), Hasty Repairs (G17.5) and Emergency Damage Repair (D14.0, Advanced Missions, rule text not supplied).
   Armor is left out: its chart line carries a footnote mark whose text is not supplied, and D9.45 ties armor repair to a repair facility. */
// Annex #9 Cost of Repair chart: repair points per box, by SSD system name.
const RPCOST={'Sensor':10,'Scanner':10,'Battery':2,'Bridge':6,'Emer Bridge':6,'Aux Control':6,'Flag Bridge':6,'Lab':5,'Trans':3,'Tractor':3,'Probe':3,'Impulse':5,'APR':4,
 'Left W En':10,'Center W En':10,'Right W En':10,'F Hull':1,'A Hull':1,'C Hull':1,'Cargo':1,'Drone':3,'Add':3,'SS-A':15,'SS-B':15,'Web':6};
const RPMAX=5; // [D9.72, G17.33] most points on one box in one turn
const RPJOBS=4;
const rpOK=s=>!!(s&&s.d&&s.d.trk&&s.d.trk['Damage Control']&&!s.out&&!s.boom);
const rpInit=s=>s.rp||(s.rp={tgt:null,pts:0,n:0,lab:''});
// [D9.76] Original damage control rating: the top of the damage control track.
const rpCap=s=>s.d.trk['Damage Control'][0];
const rpPh=w=>({1:5,2:4,3:2,4:10,G:6}[(/^Ph-(\d|G)/.exec(w.name||'')||[])[1]]||4);
const rpDi=w=>{const r=w.max||30;return r<=10?4:r<=15?5:r<=22?7:r<=30?8:10};
const rpPl=w=>({F:5,G:10,R:20,S:15}[w.T]||10);
// Every destroyed box that can be repaired, one entry per kind (a ship repairs one box at a time).
function rpItems(s){const o=[];if(!rpOK(s))return o;
 s.ph.forEach((w,i)=>{if(!w.alive)o.push({k:'w:ph:'+i,lab:w.name,cost:rpPh(w)})});
 s.tu.forEach((w,i)=>{if(!w.alive)o.push({k:'w:tu:'+i,lab:w.name,cost:8})});
 s.di.forEach((w,i)=>{if(!w.alive)o.push({k:'w:di:'+i,lab:w.name,cost:rpDi(w)})});
 s.pl.forEach((w,i)=>{if(!w.alive)o.push({k:'w:pl:'+i,lab:w.name,cost:rpPl(w)})});
 s.d.shields.forEach((m,k)=>{if(missing(s,k)>0)o.push({k:'sh:'+k,lab:'Shield #'+(k+1)+' box',cost:2})});
 Object.keys(RPCOST).forEach(n=>{const lost=(s.d.sys[n]||0)-(s.sys[n]||0);if(lost<=0)return;
  let c=RPCOST[n];if(n==='Add'){const a=s.ad&&s.ad[s.sys.Add||0];c=a&&a.cap>6?4:3} // chart: ADD 6-round 3, 12-round 4
  o.push({k:'s:'+n,lab:n+(lost>1?` (${lost} destroyed)`:''),nm:n,cost:c})});
 return o}
// Check the repair jobs in a plan; pushes problems onto e.
function rpCheck(s,p,e){const J=(p.rpj||[]).filter(j=>j&&j.k&&j.n>0);if(!J.length||!rpOK(s))return;
 const R=rpInit(s),items=rpItems(s),pts=dcRating(s);let used=0,done=0;const seen=new Set();
 J.forEach((j,ix)=>{const n=ix+1,it=items.find(x=>x.k===j.k);
  if(!it){e.push(`Repair job ${n}: that box is not destroyed (D9.7)`);return}
  if(seen.has(j.k)){e.push(`Repair job ${n}: ${it.lab} is listed twice`);return}seen.add(j.k);
  if(j.n>RPMAX)e.push(`Repair job ${n}: at most ${RPMAX} repair points can go to one box in a turn (D9.72, G17.33)`);
  used+=j.n;
  if(R.tgt===j.k&&ix>0)e.push(`Repair job ${n}: ${it.lab} is the repair already under way, so it must be job 1 (a ship works on one box at a time, D9.741)`);
  const have=(R.tgt===j.k&&ix===0)?R.pts:0;
  if(j.n>it.cost-have)e.push(`Repair job ${n}: ${it.lab} needs only ${it.cost-have} more point${it.cost-have===1?'':'s'} (cost ${it.cost}${have?`, ${have} already done`:''})`);
  const fin=have+j.n>=it.cost;if(fin)done++;
  else if(ix<J.length-1)e.push(`Repair job ${n}: ${it.lab} is not finished (${have+j.n} of ${it.cost}), so no other box can be started this turn; only the last job may be left unfinished (D9.741)`);
  if(it.k.startsWith('sh:')&&fin&&(p.dsh[+it.k.slice(3)]||0)+1>missing(s,+it.k.slice(3)))e.push(`Repair job ${n}: shield #${+it.k.slice(3)+1} has no spare destroyed box for both the energy repair (D9.2) and this one; they cannot be on the same box (D9.712)`)});
 if(used>pts)e.push(`Repair points: your damage control rating gives ${pts} this turn (D9.711); you allocated ${used}`);
 const left=rpCap(s)-R.n,last=J[J.length-1],lit=items.find(x=>last&&x.k===last.k);
 if(done>left)e.push(`Repair limit: a ship can finish no more repairs in a scenario than its original damage control rating, ${rpCap(s)} (D9.76); ${left} left`);
 else if(lit&&((R.tgt===last.k?R.pts:0)+last.n<lit.cost)&&done>=left)e.push(`Repair limit: you have no repairs left to finish ${lit.lab} with (D9.76)`)}
// Plan applied at the start of the turn: carried work that is not continued is abandoned and its points are lost.
function rpStart(s,p){if(!rpOK(s))return[];const J=(p.rpj||[]).filter(j=>j&&j.k&&j.n>0).map(j=>({k:j.k,n:j.n})),R=rpInit(s);
 if(R.tgt&&!(J.length&&J[0].k===R.tgt)){LS(`${s.tag} abandons the repair of ${R.lab}; its ${R.pts} accumulated repair point${R.pts===1?'':'s'} are lost.`+RL('D9.741'),isFoe(s));R.tgt=null;R.pts=0}
 return J}
function rpApply(s,k){const a=k.split(':');
 if(a[0]==='w'){const w={ph:s.ph,tu:s.tu,di:s.di,pl:s.pl}[a[1]][+a[2]];w.alive=true;if('state' in w)w.state='empty';if('st' in w){w.st=0;w.rdy=false}if('armed' in w)w.armed=false;if(w.ovl)w.ovl=typeof w.ovl==='number'?0:false;return}
 if(a[0]==='sh'){s.sh[+a[1]]=Math.min(s.d.shields[+a[1]],s.sh[+a[1]]+1);return}
 const n=a.slice(1).join(':'),i=s.sys[n]||0;s.sys[n]=i+1;
 if(n==='Drone'&&s.rk&&s.rk[i])s.rk[i].ammo=0;if(n==='Add'&&s.ad&&s.ad[i])s.ad[i].ammo=0; // the rack comes back empty; reload it from stores
 if(s.d.sb&&typeof sbSync==='function')sbSync(s)}
// End of turn: spend the points, finish repairs, carry over the rest (D9.73, D9.74).
function rpEnd(s){if(!rpOK(s)||!s.rpj)return;const J=s.rpj;s.rpj=null;const R=rpInit(s);
 J.forEach(j=>{const it=rpItems(s).find(x=>x.k===j.k);if(!it){if(R.tgt===j.k){R.tgt=null;R.pts=0}return}
  const have=R.tgt===j.k?R.pts:0,tot=have+j.n;
  if(tot>=it.cost){rpApply(s,j.k);R.n++;R.tgt=null;R.pts=0;LS(`${s.tag} finishes repairing ${it.nm||it.lab} (${it.cost} repair points; ${R.n} of ${rpCap(s)} repairs used this scenario).`+RL('D9.73, D9.76'),isFoe(s))}
  else{R.tgt=j.k;R.pts=tot;R.lab=it.nm||it.lab;LS(`${s.tag} puts ${j.n} repair point${j.n===1?'':'s'} into ${it.nm||it.lab}: ${tot} of ${it.cost}; the work carries over to next turn.`+RL('D9.74, D9.741'),isFoe(s))}})}
// The computer's repair jobs. Value is a rough worth of the box to the computer; boxes it has no use for are never repaired
// because each ship has only a few repairs for the whole scenario (D9.76).
const rpVal=it=>{const k=it.k;if(k.startsWith('sh:'))return 3;if(k.startsWith('w:')){const c=it.cost;return k.startsWith('w:tu')||k.startsWith('w:pl')?10:k.startsWith('w:di')?7:c>=10?8:c>=5?6:c>=4?4:3}
 const n=k.slice(2);return({'Sensor':6,'Scanner':6,'Left W En':6,'Right W En':6,'Center W En':6,'Impulse':4,'APR':4,'Battery':2,'Drone':3,'Add':2,'Bridge':1,'Tractor':1,'Trans':1,'SS-A':2,'SS-B':2})[n]||0};
function aiRepair(s){if(!rpOK(s))return[];const R=rpInit(s),items=rpItems(s);let pts=dcRating(s);if(!items.length||pts<=0)return[];
 const ord=[];if(R.tgt){const c=items.find(x=>x.k===R.tgt);if(c)ord.push(c)}
 items.filter(x=>!ord.includes(x)&&rpVal(x)>=2).sort((a,b)=>rpVal(b)/b.cost-rpVal(a)/a.cost).forEach(x=>ord.push(x));
 const jobs=[];let done=0;const left=rpCap(s)-R.n;
 for(const it of ord){if(pts<=0||jobs.length>=RPJOBS)break;const have=(R.tgt===it.k&&!jobs.length)?R.pts:0,n=Math.min(RPMAX,pts,it.cost-have);if(n<=0)continue;
  const fin=have+n>=it.cost;if(fin&&done>=left)continue;if(!fin&&done>=left)break;
  jobs.push({k:it.k,n,lab:it.nm||it.lab});pts-=n;if(fin)done++;else break}
 return jobs}
// --- Energy Allocation row ---
function rpRow(s,p){if(!rpOK(s))return'';const R=rpInit(s),items=rpItems(s),pts=dcRating(s);if(!items.length&&!R.tgt)return'';
 const J=p.rpj=p.rpj||[],used=J.reduce((a,j)=>a+(j&&j.n>0?j.n:0),0),left=rpCap(s)-R.n;
 const opts=(sel,ix)=>`<option value="">- none -</option>`+items.filter(x=>x.k===sel||!J.some((j,jx)=>jx!==ix&&j&&j.k===x.k)).map(x=>{const have=R.tgt===x.k?R.pts:0;return`<option value="${x.k}" ${x.k===sel?'selected':''}>${x.lab} - cost ${x.cost}${have?` (${have} done)`:''}</option>`}).join('');
 let jobs='';for(let i=0;i<Math.min(RPJOBS,Math.max(1,J.filter(j=>j&&j.k).length+1));i++){const j=J[i]||{k:'',n:0};
  jobs+=`<div style="margin:2px 0"><select style="max-width:200px" onchange="setRpk(${i},this.value)">${opts(j.k,i)}</select> <input type="number" style="width:54px;padding:4px" min="0" max="${RPMAX}" value="${j.n||0}" ${j.k?'':'disabled'} onchange="setRpn(${i},Math.max(0,+this.value||0))"> <span class="mu">points</span></div>`}
 return`<tr><td class="l">Continuous damage repair<br><small>Free: your damage control rating gives ${pts} repair point${pts===1?'':'s'} a turn to spend on destroyed boxes (D9.711). Cost per box is on the Annex #9 chart; at most 5 points a box a turn; one box at a time, so only the last job may be left unfinished and its points carry over (D9.74). A box repairs at the end of the turn it is paid for, never the turn it was destroyed. This ship may finish ${left} more repair${left===1?'':'s'} this scenario (D9.76: no more than its original damage control rating, ${rpCap(s)}). Damage control and excess damage cannot be repaired.${R.tgt?` <b>Under way: ${R.lab}, ${R.pts} points done.</b> Not continuing it as job 1 abandons it and loses those points (D9.741).`:''}</small></td><td>${jobs}</td><td>${used}/${pts}</td></tr>`}
function setRpk(i,k){const J=plan0.rpj=plan0.rpj||[];const it=rpItems(sh[0]).find(x=>x.k===k);if(!it){J.splice(i,1)}else{const R=rpInit(sh[0]),have=R.tgt===k&&i===0?R.pts:0;J[i]={k,lab:it.nm||it.lab,n:Math.min(RPMAX,Math.max(1,it.cost-have),dcRating(sh[0]))}}eaMsg='';draw()}
function setRpn(i,n){const J=plan0.rpj=plan0.rpj||[];if(J[i]){J[i].n=n;if(n<=0)J.splice(i,1)}eaMsg='';draw()}
