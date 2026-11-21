// ===== G14 Tugs and pods: releasing and attaching a battle pod (Captain's Basic Set rulebook G14.3, G14.4) =====
// The Battle Tug (R2.10) is the Fleet Tug (R2.8) with a Battle Pod (R2.10) attached. Releasing the pod turns the ship object into the Fleet Tug (same object, so drones and links
// that point at it stay valid) and adds the pod as a separate computer-flown unit. Damage is counted per box name, so each side's share of the combined damage is split in proportion
// to the boxes each part brought (G14.113 lets the owner distribute it; the proportional split is the simplification).
const POD_TUG={Sensor:6,Scanner:6,'Damage Control':6,Bridge:2,'Emer Bridge':2,'F Hull':12,Battery:2,Trans:2,Lab:4,APR:1,Tractor:2,Probe:1,Shuttle:2,Impulse:4,'Left W En':15,'Right W En':15};
const POD_POD={Sensor:2,Scanner:2,'Damage Control':3,Tractor:2,Shuttle:4,'Aux Control':2,Battery:4,APR:12,'A Hull':10,'Flag Bridge':2,Impulse:2,Trans:2};
const BT_SH=[[20,8],[20,8],[20,6],[20,6],[20,6],[20,8]];
const podPlus=s=>(s.rf||[]).includes('y165');
// share of the destroyed boxes of one kind that belong to the first part (t of t+p boxes), rounded, never more than the part brought
const splitLoss=(lost,t,p)=>{if(t+p<=0)return[0,0];let a=Math.round(lost*t/(t+p));a=Math.min(a,t);let b=Math.min(lost-a,p);a=Math.min(lost-b,t);return[a,b]};
function podCanRelease(s){return s===sh[0]&&s.key==='BT'&&phase==='run'&&!over}
function podCanAttach(s){if(!(s===sh[0]&&s.key==='TUG'&&phase==='run'&&!over&&s.podOf))return false;const p=s.podOf;return !p.out&&!p.merged&&p.c===s.c&&p.r===s.r&&p.f===s.f&&s.sp===0&&(s.sys.Tractor||0)>0} // the book wants both stopped; the computer's pod creeps at sublight speed, so only the tug has to be stopped here
function podRelease(){const s=sh[0];if(!podCanRelease(s))return;const plus=podPlus(s),i=imp+1;
 const rfT=s.rf.filter(x=>x==='y165'||x==='gad'),rfP=rfT.slice();
 const dT=refitDef('TUG',rfT),dP=refitDef('BP',rfP);
 const pod=mkShip('BP',s.c,s.r,s.f,s.col,'BP',rfP);pod.tm=s.tm;pod.sp=pod.prev=0;pod.merged=false;
 // damage split per system name
 const bt=s.d,tugSys={},podSys={};
 Object.keys(bt.sys).forEach(n=>{const T=(POD_TUG[n]||0)+(plus&&n==='Drone'?1:0),P=(POD_POD[n]||0)+(plus&&n==='Drone'?1:0),full=bt.sys[n],lost=Math.max(0,full-(s.sys[n]||0)),[lt,lp]=splitLoss(lost,T,P);tugSys[n]=T-lt;podSys[n]=P-lp});
 const shT=[],shP=[];for(let k=0;k<6;k++){const[mt,mp]=BT_SH[k],lost=Math.max(0,bt.shields[k]-s.sh[k]),[lt,lp]=splitLoss(lost,mt,mp);shT.push(mt-lt);shP.push(mp-lp)}
 // weapons: phasers 0-3 tug, 4-7 pod, then (plus refit) 8-9 tug Ph-3, 10-11 pod Ph-3
 const phT=[0,1,2,3].concat(plus?[8,9]:[]),phP=[4,5,6,7].concat(plus?[10,11]:[]);
 const oldPh=s.ph,oldTu=s.tu,oldRk=s.rk,oldAd=s.ad;
 // the tug (the same object)
 s.key='TUG';s.d=dT;s.n=dT.n;s.tag='TUG';s.sys={...dT.sys};Object.keys(s.sys).forEach(n=>{s.sys[n]=Math.max(0,tugSys[n]!==undefined?tugSys[n]:s.sys[n])});s.sh=shT;
 s.ph=phT.map(k=>oldPh[k]);s.ph.forEach((w,j)=>{w.name=(w.T===P3?'Ph-3':'Ph-1')+' #'+(j+1)});s.tu=[];
 s.rk=plus?[oldRk[0]]:[];s.ad=oldAd.filter(a=>a.g===undefined||a.g===0);s.ad.forEach(a=>{if(a.g!==undefined)a.g=0});
 const bat=s.bat,bT=(POD_TUG.Battery)/(POD_TUG.Battery+POD_POD.Battery);s.bat=Math.round(bat*bT*2)/2;pod.bat=bat-s.bat;
 s.bd=dT.bd0;s.p0=pw(s).warp+pw(s).imp+pw(s).apr;s.podOf=pod;pod.podOf=s;
 // the pod
 pod.sys={...dP.sys};Object.keys(pod.sys).forEach(n=>{pod.sys[n]=Math.max(0,podSys[n]!==undefined?podSys[n]:pod.sys[n])});pod.sh=shP;
 pod.ph=phP.map(k=>oldPh[k]);pod.ph.forEach((w,j)=>{w.name=(w.T===P3?'Ph-3':'Ph-1')+' #'+(j+1)});pod.tu=oldTu;
 pod.rk=plus?[oldRk[1]]:[];pod.ad=oldAd.filter(a=>a.g===undefined||a.g===1);pod.ad.forEach(a=>{if(a.g!==undefined)a.g=0});
 ['ecm','eccm','lock','fc','shOn','ws','capCur','part','cap','gc','gc0'].forEach(k=>{if(s[k]!==undefined)pod[k]=s[k]&&typeof s[k]==='object'?{...s[k]}:s[k]});
 pod.p0=pw(pod).warp+pw(pod).imp+pw(pod).apr;pod.pend=true;
 sh.push(pod);
 // G14.32: released above speed 1 each part takes one internal damage point per unit of the tug's speed
 const spd=Math.round(s.sp||0);let note='';
 if(spd>1){for(let n=0;n<spd;n++){dac(s,null);dac(pod,null)}note=` It was released at speed ${spd}, so the tug and the pod each take ${spd} points of internal damage (G14.32).`}
 // the pod has no warp engines; it plans its own energy for the rest of the turn (G14.353, G14.3531)
 try{lockIn(pod,aiPlanOpt(pod,autoPlan(pod,foeOf(pod),level)))}catch(e){}
 L(`Impulse ${i}: the ${s.tag} releases its battle pod in hex ${hexNo(s.c,s.r)}. The tug is now the Fleet Tug (movement cost ${dT.mc}, turn mode ${dT.cat}) and the pod flies on its own as a sublight unit with ${pod.ph.length} phasers and ${pod.tu.length} photon tubes; the computer flies the pod for you.${note}`+RL('G14.3, G14.31, G14.32, G14.34, G14.35'));
 draw()}
function podAttach(){const s=sh[0];if(!podCanAttach(s))return;const pod=s.podOf,plus=podPlus(s),i=imp+1,bt=refitDef('BT',s.rf.filter(x=>x==='y165'||x==='gad'));
 const tugSys=s.sys,podSys=pod.sys,sys={};Object.keys(bt.sys).forEach(n=>{const T=(POD_TUG[n]||0)+(plus&&n==='Drone'?1:0),P=(POD_POD[n]||0)+(plus&&n==='Drone'?1:0),lt=Math.max(0,T-(tugSys[n]||0)),lp=Math.max(0,P-(podSys[n]||0));sys[n]=Math.max(0,bt.sys[n]-lt-lp)});
 const sh6=[];for(let k=0;k<6;k++){const[mt,mp]=BT_SH[k];sh6.push(Math.max(0,bt.shields[k]-(mt-s.sh[k])-(mp-pod.sh[k])))}
 const ph=[].concat(s.ph.slice(0,4),pod.ph.slice(0,4),plus?[s.ph[4],s.ph[5],pod.ph[4],pod.ph[5]]:[]);ph.forEach((w,j)=>{w.name=(w.T===P3?'Ph-3':'Ph-1')+' #'+(j+1)});
 const rk=plus?[s.rk[0],pod.rk[0]]:[];const ad=[];s.ad.forEach(a=>{if(a.g!==undefined)a.g=0;ad.push(a)});pod.ad.forEach(a=>{if(a.g!==undefined)a.g=1;ad.push(a)});
 s.key='BT';s.d=bt;s.n=bt.n;s.tag='BT';s.sys=sys;s.sh=sh6;s.ph=ph;s.tu=pod.tu;s.rk=rk.filter(Boolean);s.ad=ad;s.bat=s.bat+pod.bat;s.bd=bt.bd0;s.p0=pw(s).warp+pw(s).imp+pw(s).apr;
 pod.out=true;pod.merged=true;s.podOf=null;
 L(`Impulse ${i}: the Fleet Tug and its battle pod are in the same hex with the same facing and speed zero; the tug attaches the pod and the two fly as one Battle Tug again (movement cost ${bt.mc}, turn mode ${bt.cat}). Damage on both parts is added together.`+RL('G14.4, G14.41, G14.11, G14.21'));draw()}
function podCard(){const s=sh[0];if(!s||over)return'';
 if(podCanRelease(s)){const sp=Math.round(s.sp||0);return `<div class="card" style="margin:6px 0"><b>Battle pod (G14.3)</b><p style="margin:4px 0">You may release the pod now. ${sp>1?`<b>Your speed is ${sp}</b>: the tug and the pod would each take ${sp} points of internal damage (G14.32).`:'Your speed is 0 or 1, so nothing is damaged (G14.31).'} The tug becomes the Fleet Tug and the computer flies the pod, a sublight unit with its own shields and weapons (G14.35). <button onclick="podRelease()">Release the pod</button></p></div>`}
 if(podCanAttach(s))return `<div class="card" style="margin:6px 0"><b>Battle pod (G14.4)</b><p style="margin:4px 0">The pod is in your hex, facing the same way, and you are stopped. <button onclick="podAttach()">Attach the pod</button></p></div>`;
 return''}
