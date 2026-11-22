/* ================= seeking weapons (F, FD) ================= */
const DT={I:{n:'Type-I drone',spd:8,end:3,wh:12,hp:4},II:{n:'Type-II drone',spd:12,end:2,wh:12,hp:4},B:{n:'Basic Set drone',spd:20,end:3,wh:12,hp:4}};
DT.VI={n:'Type-VI dogfight drone',spd:12,end:1,wh:2,hp:3};
let dtype='I',DR=[],drN=0,noLaunch=0,aiLI=-1,fireTgt={};
let tgSel=1;
const AIL=()=>sh.slice(1).filter(s=>!s.out&&!s.neu); // every computer ship still in the fight, allies included
// [D1.5] Teams: tm 0 is your side (you and any computer allies), tm 1 the opposing side. ENL = enemy ships still in the fight; isFoe is true for a ship whose private records are hidden from you.
const ENL=()=>sh.filter(x=>x.tm===1&&!x.out),isFoe=x=>x!==sh[0]&&x.tm!==0;
// [D1.5] Friendly fire: you may not fire on a friendly unit or guide weapons at one, except where a case below applies. ffRule(x) names the case that lets you target your ally x, or '' if none does.
let ffInv=null; // D1.522: {s: the ally, turn} while the disengaging player has invoked it
const crewLeft=x=>x.gc+x.bp/2; // crew units left (general crew plus boarding parties counted as half-units)
function boardedBy(x){return BRD&&BRD.on===x&&BRD.by.tm!==x.tm&&BRD.n>0?BRD:null}
// [D5.51] A ship may not self-destruct while other friendly ships are in play unless all but two crew units are gone, or the enemy have more boarding parties aboard than it has itself.
function sdEligible(x){const b=boardedBy(x);return crewLeft(x)<=2||(b&&b.n>x.bp)||!sh.some(y=>y!==x&&!y.out&&y.tm===x.tm)}
function unableDis(x){return pw(x).warp<disNeed(x)||(LNK&&LNK.on===x&&LNK.by.tm!==x.tm)}
function ffRule(x){if(!x||x===sh[0]||x.tm!==0||x.out)return'';
 if(ffInv&&ffInv.turn===turn&&ffInv.s===x)return'D1.522';
 if(sdEligible(x)&&crewLeft(x)<=2)return'D1.51'; // D1.51: eligible for self-destruction (D5.51)
 const b=boardedBy(x);if(b){const near=dist(b.by,x)<=5&&b.by.bp>0,bs=x.sh[shieldFor(x,b.by).k]<=0,pc=b.n>=Math.ceil(x.bp*.75),big=b.n>=Math.ceil(x.bp*1.5);if(big||(near&&bs&&pc))return'D1.521'}
 if(LNK&&LNK.on===x&&LNK.by.tm!==x.tm&&absI(imp+1)-LNK.since>=32)return'D1.523'; // held in an enemy tractor beam for a whole turn
 return''}
const ffTargets=()=>sh.filter(x=>x.tm===0&&ffRule(x));
const TG=()=>{if(ffInv&&ffInv.turn===turn&&!ffInv.s.out)return ffInv.s;const c=sh[tgSel];if(c&&!c.out&&(c.tm===1||c.neu||(c.tm===0&&ffRule(c))))return c;const l=ENL();return l.length?l.reduce((b,s)=>dist(sh[0],s)<dist(sh[0],b)?s:b,l[0]):(sh.find(x=>x.tm===1)||sh[1])}; // the computer ship you are shooting at
// [D1.5] A computer ship picks the nearest ship of the other side as its foe; it never aims at its own side.
const foeOf=s=>{if(s===sh[0])return TG();const e=sh.filter(x=>!x.out&&x.tm!==s.tm&&!x.neu);if(!e.length)return s.tm===1?sh[0]:(sh.find(x=>x.tm===1)||sh[1]);return e.reduce((b,x)=>dist(s,x)<dist(s,b)?x:b,e[0])};
function endFor(k,s,tAI,tHu,rc){if(sh5Dis(k,s))return;const ally=k>0&&s.tm===0;let t=(k===0||ally)?tHu:tAI;if(k===0)over={win:false,text:t};else{s.out=true;if(ally)t='Your ally: '+t;else if(!ENL().length&&!pendRein())over={win:true,text:t};else t=t.replace(' You win!','')}L(t+RL(rc))}
function setTg(k){tgSel=k;draw();side()}
function tgBar(){const me=sh[0],inv=ffInv&&ffInv.turn===turn&&!ffInv.s.out,l=inv?[ffInv.s]:sh.filter(x=>x.tm===1||x.neu||ffRule(x)),can=!inv&&me.disPlan&&phase==='run'?sh.filter(x=>x.tm===0&&x!==me&&!x.out&&unableDis(x)):[];
 if(l.length<2&&!can.length&&!inv)return'';
 return`<div class="row" style="margin:0 0 6px"><span class="mu">Your target:</span>${l.map(s=>`<button class="${TG()===s?'on':''}" ${s.out?'disabled':''} title="${s.neu?'Neutral: if you fire on it the opponent takes control of it (S5.2 result 9)':s.tm===0?'Friendly fire allowed: '+ffRule(s)+' (D1.5)':''}" onclick="setTg(${sh.indexOf(s)})">${s.tag}${s.neu?' (neutral)':''}${s.tm===0?' (friendly, '+ffRule(s)+')':''}${s.out?' (out)':''}</button>`).join('')}${can.map(x=>`<button title="D1.522: your other units are disengaging and ${x.tag} cannot. You may fire only at it until it is destroyed, then you must disengage at once." onclick="ffInvoke(${sh.indexOf(x)})">Invoke D1.522 on ${x.tag}</button>`).join('')}${inv?'<span class="mu">D1.522 is in force: fire only at '+ffInv.s.tag+' until it is destroyed, then disengage.</span>':''}</div>`}
function ffInvoke(k){const a=sh[k];if(!a||a.out||ffInv&&ffInv.turn===turn)return;ffInv={s:a,turn};tgSel=k;L(`Impulse ${imp+1}: you invoke the friendly fire rule for capture prevention: the ${a.tag} cannot disengage while your other units are disengaging. All of your units may fire only at the ${a.tag} until it is destroyed and must then disengage in an expeditious manner.`+RL('D1.522'));draw();side()}
const rkAlive=(s,k)=>k<(s.sys.Drone||0);
const ctrlN=s=>DR.filter(d=>d.own===s&&!d.ft&&!d.fc&&!d.cr).length; // fighters and the drones they launch use their own controls (J4.25)
const rmDr=d=>{const k=DR.indexOf(d);if(k>=0)DR.splice(k,1)};
// [F1.0, FD2.0, C10.511] Why a drone launch is not allowed right now.
function launchWhy(s,k,i){const rk=s.rk[k],foe=foeOf(s);if(s.emOn)return'Erratic maneuvering: no launching (C10.511)';
 if(!rkAlive(s,k))return'Rack destroyed';if(rk.ammo<=0)return'Rack empty';if(!fcOk(s))return ckOn(s)?'Cloaked (G13.512)':'No active fire control (FD1.22)';if(s.lock===false)return'No lock-on (F3.31)';if(ckOn(foe)&&foe.ck.mode==='on'&&!foe.ck.lockBy)return'No lock-on to the cloaked ship (G13.311)';
 if(absI(i)<=s.noFire)return'Post-breakdown: no weapons (C6.5471)';if(rk.rlT===turn)return'Plotted for reload this turn (FD2.421)';if(rk.turn===turn&&(!rk.C||rk.nT>=2))return rk.C?'Type-C rack: two launches a turn at most (FD3.3)':'Already launched this turn (FD4.2)';if(absI(i)-rk.last<(rk.C?12:8))return rk.C?'Type-C rack must wait 12 impulses (FD3.3)':'Rack must wait 8 impulses (FD3.1)';
 if(ctrlN(s)>=ctlMax(s))return'No free control channel (F3.21)';if(effRange(s,foe)>35)return'Target beyond 35 hexes (F3.31)';return''}
const launchList=(s,i)=>s.rk.map((_,k)=>k).filter(k=>!launchWhy(s,k,i));
// [FD2.0, FD3.0] Launch a drone from a rack: type, speed, endurance and facing.
function launch(s,k,i){if(s.qh)qReveal(s,'launches a drone');const rk=s.rk[k],foe=foeOf(s),T=DT[dtype];{const w=monSeekWhy(s,foe);if(w){L(w+RL('SM3.48, SM3.491, SM1.46'));return}}rk.ammo--;rk.nT=rk.turn===turn?rk.nT+1:1;rk.turn=turn;rk.last=absI(i);const f=bestFacing(s,foe);
 DR.push({id:++drN,dr:true,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f,st:0,hp:T.hp,wh:T.wh,spd:T.spd,exp:absI(i)+T.end*32,born:absI(i),hetT:-99,mv:-1,ecm:0});
 L(`Impulse ${i}: ${s.tag} launches a ${T.n} (#${drN}) from rack ${k+1} at ${foe.tag}, range ${dist(s,foe)}, facing ${FL[f]}. It moves ${T.spd} hexes a turn and lasts ${T.end} turns.`+RL('F1.22, FD1.21, FD1.22, FD3.1'))}
let LNK=null,BRD=null;
// [G7.13, G7.15] Powered tractor beams not already busy.
const trFree=s=>hasCrit(s,'tow')?0:(optTrac?Math.min(s.trN||0,s.sys.Tractor||0):0)-DR.filter(d=>d.held===s).length-(LNK&&LNK.by===s?1:0)-(s.trBurnt||0);
// [G7.33, G7.34] A tractor link ends.
function breakLink(why,rc){if(!LNK)return;L(`The tractor link between ${LNK.by.tag} and ${LNK.on.tag} is broken: ${why}.`+RL(rc||'G7.122'));LNK=null}
// [G7.35, G7.42, G7.421] Tractor auction: strength against negative tractor each turn.
function tracAuction(){if(!LNK)return;const by=LNK.by,on=LNK.on;if(!optTrac){LNK=null;return}if(!(by.trN>=1)||(by.sys.Tractor||0)<1){breakLink(`${by.tag} did not power a tractor beam for it this turn`,'G7.42, G7.124');return}
 const rg=Math.max(1,dist(by,on)),P=Math.floor((1+(by.trx||0))/(optG76?rg:1)),N=on.ntrac||0;if(P>N){LNK.P=P;if(optG76&&by===sh[0]&&on.c!==undefined)rotPend=true;L(`Tractor auction: ${by.tag} powers the link at strength ${P}${rg>1&&optG76?' (effective, at range '+rg+', G7.61-G7.63)':''} against ${on.tag}'s negative tractor ${N}. The link holds.`+RL('G7.42, G7.421, G7.35'))}else{L(`Tractor auction: ${by.tag}'s strength ${P} does not exceed ${on.tag}'s negative tractor ${N}.`);breakLink('the negative tractor beat it','G7.42, G7.35, G7.352')}by.trx=0}
// [G7.1, G7.41, G7.6, G7.412] Why a ship cannot tractor another ship right now.
function shipTrWhy(s,f){if(!optTrac)return'off';if(LNK)return'A tractor link already exists';if(s.emOn)return'Erratic maneuvering: no tractor (G7.92)';if(trFree(s)<=0)return'No powered tractor beam free (G7.13, G7.15)';if(dist(s,f)>(optG76?3:1))return optG76?'The target must be within three hexes (G7.6)':'The target must be in your hex or an adjacent hex (G7.41)';if(optWeb&&webThrough(s,f))return'Tractor beams cannot work through a web hex (G10.71)';if(!fcOk(s)||s.lock===false)return'No lock-on (G7.412)';if(ckOn(f)&&f.ck.mode==='on'&&!f.ck.lockBy)return'No lock-on to the cloaked ship (G13.311)';if(absI(imp+1)<=s.noFire)return'Post-breakdown (C6.5471)';return''}
function tractShip(s,f,i,b){const rg=Math.max(1,dist(s,f)),P=Math.floor((1+(s.trx||0)+b)/(optG76?rg:1)),N=f.ntrac||0; // [G7.61, G7.62, G7.63] at range two or three each point of effective tractor costs two or three points of power
 if(b)spendBat(s,b);s.trBurnt=(s.trBurnt||0)+1;s.trx=0;
 if(P>N){LNK={by:s,on:f,P,since:absI(i)};L(`Impulse ${i}: ${s.tag} tractors ${f.tag}: strength ${P}${rg>1&&optG76?` effective at range ${rg}`:''}${b?` (including ${b} reserve)`:''} against negative tractor ${N}. The link is made. ${f.tag} no longer moves on its own and is towed along with ${s.tag}.`+RL('G7.41, G7.414, G7.32, G7.35'+(rg>1&&optG76?', G7.6':'')))}
 else L(`Impulse ${i}: ${s.tag} tries to tractor ${f.tag}: strength ${P} does not exceed negative tractor ${N}. The attempt fails and the energy is lost.`+RL('G7.41, G7.35, G7.352, G7.4221'))}
function tractorShipGo(){const s=sh[0],f=TG(),e=document.getElementById('trb'),b=Math.min(e?+e.value||0:0,s.bat||0);if(!shipTrWhy(s,f))tractShip(s,f,imp+1,b);draw()}
function tractorShipOff(){if(LNK&&LNK.by===sh[0])breakLink('it was released','G7.33');draw()}
/* ---- [G7.36] two moving ships linked by a tractor beam ---- */
// [G7.36] Both linked ships are moving.
function pairMode(){return !!(LNK&&optTrac&&LNK.by&&LNK.on&&!LNK.by.out&&!LNK.on.out&&!LNK.by.d.base&&!LNK.on.d.base&&!LNK.by.exitEdge&&!LNK.on.exitEdge)}
const larger=(a,b)=>a.d.size<b.d.size?1:a.d.size>b.d.size?-1:(a.d.mc||1)>(b.d.mc||1)?1:(a.d.mc||1)<(b.d.mc||1)?-1:0; // [G7.36-B] larger by size class, then by movement cost
function pseudoOf(X){ // [G7.36-B, C2.46] warp energy divided by the movement cost of both ships; the smaller ship's impulse power is ignored (and both ignore it if the ships tie)
 const A=LNK.by,B=LNK.on,tm=(A.d.mc||1)+(B.d.mc||1),Y=X===A?B:A,mc=X.d.mc||1,lg=larger(X,Y),hasImp=(pw(X).imp>=1&&X.sp>=1)?1:0,warp=Math.max(0,Math.ceil(X.sp*mc-1e-9)-hasImp);
 return Math.floor(warp/tm+1e-9)+(lg>0?hasImp:0)}
const linkSp=s=>(pairMode()&&(LNK.by===s||LNK.on===s))?pseudoOf(s):s.sp;
const spdOf=s=>(pairMode()&&(LNK.by===s||LNK.on===s))?pseudoOf(LNK.by)+pseudoOf(LNK.on):s.sp; // [C2.412] the effective speed of the pair is the sum of the pseudo-speeds
function pairStep(X,dir,i){ // move both ships one hex in direction dir; false if that would drag one off the map
 const Y=X===LNK.by?LNK.on:LNK.by,off=(c,r)=>c<1||c>COLS||r<1||r>ROWS;let [xc,xr]=NB(X.c,X.r,dir),[yc,yr]=NB(Y.c,Y.r,dir),note='';
 if((off(xc,xr)||off(yc,yr))&&optFloat&&!X.disPlan&&!scn6){const nx=off(xc,xr)?[xc,xr]:[yc,yr],sft=floatShift(nx[0],nx[1]);if(sft){[xc,xr]=NB(X.c,X.r,dir);[yc,yr]=NB(Y.c,Y.r,dir);note=` (the map floats: everything is moved ${sft} away from the edge)`+RL('S1.43')}}
 if(off(xc,xr)||off(yc,yr)){breakLink('the pair would be dragged off the map','G7.273');return null}
 X.c=xc;X.r=xr;Y.c=yc;Y.r=yr;X.path.push([xc,xr]);Y.path.push([yc,yr]);return note}
function pairExec(p,i,mrg){ // [G7.36-C] carry out one movement point of the pair
 const X=p.s;if(!pairMode()||X.out)return;const Y=X===LNK.by?LNK.on:LNK.by,pc=X.c,pr=X.r;
 if(optWeb&&webHold(X,i,0,false)===1)return;
 let m=`Impulse ${i}: ${X.tag}`;if(p.turned){m+=` turns ${p.turned>0?'right':'left'} to facing ${FL[p.f2]} and`;X.f=p.f2;X.st=0}else X.st++;
 X.sl=p.turned?1:Math.min(9,(X.sl||0)+1);
 const dir=mrg!==undefined?mrg:p.df,note=pairStep(X,dir,i);if(note===null)return;
 m+=` ${X.dir?'reverses':'moves'} both ships${mrg!==undefined?' (the two movements combine into one hex)':''} to ${hexNo(X.c,X.r)} (${Y.tag} to ${hexNo(Y.c,Y.r)})`+(p.A!==absI(i)?`, a movement owed from impulse ${p.A%32||32}`:'')+note;
 L(m+RL('G7.36, C2.46'));
 if(optAst){[X,Y].forEach(Z=>{if(inAst(Z.c,Z.r))astHit(Z,i)})}
 if(optWeb&&!over)webAfter(X,i,pc,pr)}
// [G7.36] Resolve the pair's movement on one impulse: pseudo-speed, cancel, combine, delay.
function movePair(i,t,het){
 const A=LNK.by,B=LNK.on;LNK.q=LNK.q||[];const pts=[];
 [A,B].forEach(X=>{if(!moves(pseudoOf(X),i)||blocked(X,i))return;const k=sh.indexOf(X);let tk=t[k]||0,f2=X.f,turned=0;if(Math.abs(tk)===2)tk=0; // sideslips are left out while ships are linked (simplification)
  if(!het[k]&&tk!==0&&elig(X)){f2=(X.f+tk+6)%6;turned=tk}
  pts.push({s:X,turned,f2,df:X.dir?(f2+3)%6:f2,A:absI(i)})});
 if(pts.length===2&&(larger(pts[1].s,pts[0].s)>0||(larger(pts[1].s,pts[0].s)===0&&Math.random()<.5)))pts.reverse(); // [G7.36-C3] the larger ship's movement goes first; equal ships toss a coin
 if(!LNK.q.length&&pts.length===2){const rel=(pts[1].df-pts[0].df+6)%6;
  if(rel===3){pts.forEach(p=>{if(p.turned){p.s.f=p.f2;p.s.st=0}else p.s.st++});L(`Impulse ${i}: ${A.tag} and ${B.tag} both move on this impulse in opposite directions: each ends where it began, so neither moves.`+RL('G7.36, G7.36-C'));return}
  if(rel===2||rel===4){const dm=(pts[0].df+(rel===2?1:5))%6;pairExec(pts[0],i,dm);pts[1].s.st=pts[1].turned?0:pts[1].s.st+1;if(pts[1].turned)pts[1].s.f=pts[1].f2;return}}
 pts.forEach(p=>LNK.q.push(p));
 if(LNK.q.length){const p=LNK.q.shift();pairExec(p,i)}}

// [G7.32] Old towing step for a non-moving held ship (the pair method has replaced it).
function towHeld(s,df){const h=LNK.on,[hc,hr]=NB(h.c,h.r,df);if(hc<1||hc>COLS||hr<1||hr>ROWS){breakLink(`${h.tag} would be dragged off the map`,'G7.273');return''}h.c=hc;h.r=hr;h.path.push([hc,hr]);return`, towing ${h.tag} to ${hexNo(hc,hr)}`}
// [G7.2, G7.26, G7.51] Why a drone cannot be tractored right now.
function trWhy(s,d){if(!optTrac)return'off';if(SUN.noTx)return'Sunspots: tractor beams do not work this turn (P11.22)';if(d.pl)return'Plasma torpedoes cannot be held in a tractor (G7.26)';if(d.held)return'Already held';if(trFree(s)<=0)return'No powered tractor beam free (G7.15, G7.13)';if(!fcOk(s)||s.lock===false)return'No lock-on (G7.51)';if(dist(s,d)>1)return'More than one hex away (G7.51)';return''}
// [G7.5, G7.51] Hold an enemy drone in a tractor beam.
function tractorOn(s,d,i){d.held=s;L(`Impulse ${i}: ${s.tag} tractors drone #${d.id} of ${d.own.tag} at range ${dist(s,d)}. It stops moving and cannot hit anything until its endurance runs out or it is released.`+RL('G7.12, G7.15, G7.51, G7.521'))}
function tracUI(me,i){if(!optTrac)return'';const foe=TG();let sp='';
 if(LNK)sp+=`<span class="mu">Tractor link: ${LNK.by.tag} holds ${LNK.on.tag} (strength ${LNK.P}). ${LNK.on===me?'You cannot move on your own while held (a simplification of G7.36); the enemy tows you.':'The enemy ship moves along with you and your speed is cut by its movement cost.'}</span>${LNK.by===me?`<button onclick="tractorShipOff()">Release ${LNK.on.tag}</button>`:''}`;
 else if(me.trN>0&&dist(me,foe)<=1){const w=shipTrWhy(me,foe);sp+=`<span class="mu">Tractor ${foe.tag} (strength ${1+(me.trx||0)} plus reserve; it has negative tractor ${foe.ntrac||0}):</span>${me.bat>0?`<select id="trb">${Array.from({length:Math.min(me.bat,4)+1},(_,n)=>`<option value="${n}">+${n} reserve</option>`).join('')}</select>`:''}<button ${w?'disabled':''} title="${w}" onclick="tractorShipGo()">Tractor the ship</button>`}
 const near=DR.filter(d=>d.own!==me&&!d.pl&&me.trN>0&&(d.held===me||dist(me,d)<=1));if(!near.length&&!sp)return'';
 return`<div class="row" style="margin:4px 0">${sp}${near.length?`<span class="mu">Tractors: ${trFree(me)} of ${me.trN} free.</span>`+near.map(d=>d.held===me?`<button onclick="tractorOff(${d.id})">Release drone #${d.id}</button>`:`<button ${trWhy(me,d)?'disabled':''} title="${trWhy(me,d)}" onclick="tractorGo(${d.id})">Tractor drone #${d.id}</button>`).join(''):''}</div>`}
function tractorGo(id){const d=DR.find(z=>z.id===id);if(d&&!trWhy(sh[0],d))tractorOn(sh[0],d,imp+1);draw()}
function tractorOff(id){const d=DR.find(z=>z.id===id);if(d){d.held=null;L(`Impulse ${imp+1}: ${sh[0].tag} releases drone #${d.id}.`+RL('G7.33'))}draw()}
// [G8.1, G8.13, G8.14, G8.17] Why a transporter cannot beam a boarding party right now.
function beamWhy(s,f){if(!optBoard)return'off';if(SUN.noTx)return'Sunspots: transporters do not work this turn (P11.21)';if(hasCrit(s,'tr'))return'Transporters are knocked out by a critical hit (D8.2)';if(s.emOn)return'Erratic maneuvering: no transporters (C10.52)';if((s.tnLeft||0)<=0)return'No powered transporter left this turn (G8.13, G8.112)';if(dist(s,f)>5)return'Transporter range is five hexes (G8.14)';if(optWeb&&webThrough(s,f))return'Transporters cannot work through a web hex (G10.71)';if(hzBeam(s,f))return'Transporters cannot work through or along the edge of a black hole or pulsar hex (P4.27, P5.353)';if(!fcOk(s)||s.lock===false)return'No lock-on (G8.17)';if(ckOn(f)&&f.ck.mode==='on'&&!f.ck.lockBy)return'No lock-on to the cloaked ship (G13.311)';if(freeBP(s)<=0)return'No boarding parties left';if(absI(imp+1)<=s.noFire)return'Post-breakdown (C6.5471)';return''}
// [G8.3, D7.3] Beam a boarding party to an enemy ship.
function beamAboard(s,f,i,n){const k1=shieldFor(s,f).k,k2=shieldFor(f,s).k;n=Math.max(1,Math.min(n,s.tnLeft,freeBP(s)));s.tnLeft-=n;
 s.dn[k1]=absI(i)+8;const blk=f.shOn>0&&((f.sh[k2]||0)>0||((f.spec&&f.spec[k2])||0)>0||(f.gen||0)>0)&&!(f.dn&&f.dn[k2]&&absI(i)<f.dn[k2]);
 let m=`Impulse ${i}: ${s.tag} drops its #${k1+1} shield (it stays down for at least eight impulses) and tries to beam ${n} boarding part${n===1?'y':'ies'} onto ${f.tag} through its #${k2+1} shield. `;
 if(blk){L(m+'The transfer is blocked: shields or reinforcement are still in the way. The boarding parties stay home and the transporters are used up for the turn.'+RL('G8.21, G8.22, G8.23, G8.31'));return false}
 s.bp-=n;BRD=BRD&&BRD.on===f&&BRD.by===s?{...BRD,n:BRD.n+n}:{by:s,on:f,n};L(m+`They arrive. ${BRD.n} boarding part${BRD.n===1?'y is':'ies are'} now aboard; combat is resolved at the end of the turn.`+RL('G8.11, G8.31, D7.31, D7.32'));return true}
function boardUI(me,i){if(!optBoard)return'';const f=TG();let h='';if(BRD&&BRD.by===me)h+=`<span class="mu">${BRD.n} of your boarding parties are aboard ${BRD.on.tag}; you have ${me.bp} left at home.</span>`;
 if((me.tnLeft||0)>0){const w=beamWhy(me,f);h+=`<span class="mu">Transporters ready: ${me.tnLeft}. Shield #${shieldFor(me,f).k+1} must come down on your side, and the enemy's facing shield must be down with no reinforcement.</span>${w?'':`<select id="bn">${Array.from({length:Math.min(me.tnLeft,freeBP(me))},(_,n)=>`<option value="${n+1}">${n+1}</option>`).join('')}</select>`}<button ${w?'disabled':''} title="${w}" onclick="beamGo()">Beam boarding parties aboard</button>${w?`<span class="mu">${w}</span>`:''}`}
 if((me.tnLeft||0)>0){const rw=raidWhy(me,f),tl=raidTargets(f);h+=`<span class="mu">Hit-and-run raid (D7.8): one boarding party, one box; it beams back if it survives.</span><select id="rdt">${tl.map(t=>`<option value="${t.id}">${t.label}</option>`).join('')}</select><button ${rw||!tl.length?'disabled':''} title="${rw}" onclick="raidGo()">Raid the box</button>`}
 return h?`<div class="row" style="margin:4px 0">${h}</div>`:''}
const RAID_SYS=['Sensor','Scanner','Bridge','Emer','Aux','Probe','Battery','Trans','Lab','Tractor','Impulse','Left W En','Right W En','Center W En','APR']; // [D7.823] sensors, scanners and ordinary SSD boxes; never damage control or excess damage
function raidTargets(f){const o=[];RAID_SYS.forEach(n=>{if((f.sys[n]||0)>0)o.push({id:'s:'+n,label:n+' ('+f.sys[n]+' left)'})});if(f.d.clk&&!f.ckDead)o.push({id:'x:ck',label:'Cloak H&R'}); // [D7.85, G13.161] the cloaking device is a restricted target: it can be destroyed but never captured
[['ph','Phaser'],['tu','Torpedo'],['di','Disruptor'],['pl','Plasma']].forEach(([k,l])=>(f[k]||[]).forEach((w,i)=>{if(w.alive)o.push({id:k+':'+i,label:w.name})}));return o}
// [D7.8, D7.84] Why a hit-and-run raid cannot be made.
function raidWhy(s,f){const w=beamWhy(s,f);if(w==='No boarding parties left')return w;if(w)return w;if(freeBP(s)-(s.bpBusy||0)<=0)return'Every free boarding party has already made a raid this turn (D7.821)';return''}
// [D7.82, D7.821] Declare a raid.
function raidGo(){const s=sh[0],f=TG(),e=document.getElementById('rdt');if(!e||raidWhy(s,f))return;raidRun(s,f,imp+1,e.value);draw()}
// [D7.83] Guards: boarding parties posted at the start of the turn to guard one SSD box each (no more than one party per box). They do not count as free parties for beaming, raids or D7.4 boarding combat.
const gN=s=>Object.keys(s.guard||{}).length,gCap=s=>s.bp+(hasRole(s,'maj')?1:0),freeBP=s=>Math.max(0,s.bp-Math.max(0,gN(s)-(hasRole(s,'maj')?1:0))); // [G22.54] a legendary major of marines can guard one box by himself, as an extra guard that costs no boarding party
function guardAlive(f,id){const [k,n]=id.split(':');if(k==='x')return!!f.d.clk&&!f.ckDead;return k==='s'?(f.sys[n]||0)>0:!!(f[k]&&f[k][+n]&&f[k][+n].alive)}
// [D7.832] A guarded box that is destroyed by any means: on a 1-3 the guard dies with it (50%); otherwise it is released to the general pool.
function guardCheck(){if(!optBoard)return;sh.forEach(f=>{if(!f.guard)return;for(const id of Object.keys(f.guard)){if(guardAlive(f,id))continue;const majG=Object.keys(f.guard).length>f.bp&&hasRole(f,'maj');delete f.guard[id];const d=d6();if(majG&&d<=3){f.leg.st='dead';L(`${f.tag}: the box the legendary major was guarding is destroyed and he dies with it (rolled ${d}).`+RL('D7.832, G22.54'))}else if(d<=3&&f.bp>0){f.bp--;f.bK=(f.bK||0)+1;L(`${f.tag}: the box a boarding party was guarding is destroyed and the guard dies with it (rolled ${d}).`+RL('D7.832, D7.21'))}else L(`${f.tag}: the box a boarding party was guarding is destroyed; the guard survives and rejoins the pool (rolled ${d}).`+RL('D7.832'))}})}
function raidRun(s,f,i,id){ // [D7.8, D7.81] one boarding party beams to one box, tries to destroy it and beams home
 const k1=shieldFor(s,f).k,k2=shieldFor(f,s).k,tg=raidTargets(f).find(t=>t.id===id);if(!tg)return;s.tnLeft--;s.dn[k1]=absI(i)+8;
 f.raidAt=f.raidAt||{};if(f.raidAt[id]!==undefined&&absI(i)-f.raidAt[id]<8){L(`Impulse ${i}: ${s.tag} cannot raid ${tg.label} again so soon: two raids on one box need eight impulses between them.`+RL('D7.84'));return}
 const blk=f.shOn>0&&((f.sh[k2]||0)>0||((f.spec&&f.spec[k2])||0)>0||(f.gen||0)>0)&&!(f.dn&&f.dn[k2]&&absI(i)<f.dn[k2]);
 let m=`Impulse ${i}: ${s.tag} drops its #${k1+1} shield and beams a boarding party onto ${f.tag} to raid its ${tg.label} through its #${k2+1} shield. `;
 if(blk){L(m+'The transfer is blocked by shields or reinforcement. The boarding party stays home and the transporter is used up.'+RL('G8.21, G8.22, D7.8'));return}
 f.raidAt[id]=absI(i);if(f.qh)qReveal(f,'is raided by a hit-and-run party');
 if(f.guard&&f.guard[id]){const g=d6(),q0=cq(s),lost=q0<0?g<=4:q0>0?g<=2:g<=3,ret=q0<0?g===5:q0>0?g<=4:g<=5; // [D7.831] Normal 1-3 lost, 4-5 returns, 6 raid goes ahead; Poor 1-4/5/6; Outstanding 1-2/3-4/5-6
  if(lost){s.bp--;L(m+`The box is guarded. Rolled ${g} on the guard table: the boarding party is destroyed.`+RL('D7.83, D7.831'));return}
  if(ret){s.bpBusy=(s.bpBusy||0)+1;L(m+`The box is guarded. Rolled ${g} on the guard table: the boarding party returns without result.`+RL('D7.83, D7.831'));return}
  m+=`The box is guarded; rolled ${g} on the guard table, so the raid goes ahead. `}
 const d=d6(),q=Math.min(1,cq(s)+(hasRole(s,'maj')?1:0)),res=q<0?(d===1?'both':d<=4?'bp':'none'):q>0?(d<=2?'sys':d===3?'both':d===4?'bp':'none'):d===1?'sys':d===2?'both':d<=5?'bp':'none'; // [D7.81, G21.0] real hit-and-run columns. Normal: 1 sys, 2 both, 3-5 BP lost, 6 BP home. Poor: 1 both, 2-4 BP lost, 5-6 BP home. Outstanding: 1-2 sys, 3 both, 4 BP lost, 5-6 BP home. (Commando column omitted: not a crew quality in this game.)
 m+=`Rolled ${d}: `;
 if(res==='sys'||res==='both'){const [k,n]=id.split(':');if(k==='x'){f.ckDead=true;ckLose(f,i,'its cloaking device was destroyed by the raid','G13.161, D7.85')}else if(k==='s'){f.sys[n]--;if(n==='Battery'&&f.bat>f.sys.Battery){f.bat=f.sys.Battery;f.bw=Math.min(f.bw,f.bat);f.bi=Math.min(f.bi||0,Math.max(0,f.bat-f.bw))}}else{const c=f[k][+n];c.alive=false;if('state' in c)c.state='empty';else if('st' in c){c.st=0;c.rdy=false}else if('armed' in c)c.armed=false;f.capCur=Math.min(f.capCur,capMax(f))}
  m+=`the ${tg.label.replace(/ \(.*/,'')} is destroyed`}else m+='the system is not harmed';
 if(res==='sys'||res==='none'){s.bpBusy=(s.bpBusy||0)+1;m+=' and the boarding party beams back.'}else{s.bp--;m+=' and the boarding party is lost.'}
 L(m+RL('D7.8, D7.81, D7.821, D7.823, D7.84'))}
// [G8.1, D7.1] Human beaming action.
function beamGo(){const s=sh[0],f=TG(),e=document.getElementById('bn');if(!beamWhy(s,f))beamAboard(s,f,imp+1,e?+e.value||1:1);draw()}
// [D7.0, D7.3, D7.4] Resolve boarding party combat at the end of the turn.
function boardResolve(){if(!BRD||BRD.n<=0){BRD=null;return}const a=BRD.by,d=BRD.on;if(d.qh)qReveal(d,'is boarded');if(!optBoard){BRD=null;return}
 const TB=[[0,0,0,0,1,1,1,1,1,1],[0,0,1,1,1,1,1,2,2,2],[0,1,1,1,2,2,2,2,3,3],[0,1,1,2,2,2,3,3,4,4],[1,1,2,2,3,3,4,4,5,5],[1,1,2,2,3,4,4,5,5,6]];
 const roll=(n,mod,mj=0)=>{let pts=0;const rs=[];let first=true;while(n>0){const g=Math.min(10,n);n-=g;const m1=mod+(first?mj:0);first=false;const r=d6(),adj=Math.max(1,Math.min(6,r+m1)); /* [G22.51] the major's shift covers one group of up to ten parties only */pts+=TB[adj-1][g-1];rs.push(m1?`${r}+${m1}`:`${r}`)}return{pts,rs}};
 const secOK=Math.max(0,(d.sys.Security||0)-(d.cap.Security||0)),mod=d.d.side==='kli'?Math.min(2,secOK):0;
 const dB=freeBP(d); // [D7.834] guards are not counted in D7.4
 const A=roll(BRD.n,cq(a),hasRole(a,'maj')?1:0),D=dB>0?roll(dB,mod+cq(d),hasRole(d,'maj')?1:0):{pts:0,rs:[]}; // [G22.51] a legendary major shifts boarding die rolls one in his favour
  // [G21.141, G21.241] marine die roll modifier of the crew quality
 let m=`End of turn ${turn}: boarding combat aboard ${d.tag}. ${a.tag} has ${BRD.n} boarding part${BRD.n===1?'y':'ies'} there against ${dB}. The attackers roll ${A.rs.join(', ')||'-'} for ${A.pts} casualty point${A.pts===1?'':'s'}; the defenders roll ${D.rs.join(', ')||'none'}${mod?` (+${mod} for security stations)`:''} for ${D.pts}.`+RL('D7.31, D7.32, D7.41, D7.42, D7.421'+(mod?', D7.422':''));
 const lostD=Math.min(dB,A.pts);d.bp-=lostD;let rem=A.pts-lostD;const lostA=Math.min(BRD.n,D.pts);BRD.n-=lostA;
 m+=` ${d.tag} loses ${lostD} boarding part${lostD===1?'y':'ies'}; ${a.tag} loses ${lostA}.`+RL('D7.44');
 const rooms=[['Security',3],['Flag Bridge',2],['Aux Control',2],['Emer Bridge',2],['Bridge',2]];
 const left=k=>Math.max(0,(d.sys[k]>0?(k==='Security'?d.sys[k]:1):0)-(d.cap[k]||0));
 if(rem>0){d.part=(d.part||0)+rem;m+=` The ${rem} extra casualty point${rem===1?'':'s'} fall on the control rooms.`+RL('D7.361, D7.362');
  for(const[k,c]of rooms){while(left(k)>0&&d.part>=c){d.part-=c;d.cap[k]=(d.cap[k]||0)+1;m+=` ${d.tag}'s ${k==='Security'?'security station':k.toLowerCase()} is captured.`}}}
 L(m);
 const remaining=rooms.reduce((t,[k])=>t+left(k),0);
 if(remaining===0&&!over){const _o={win:a===sh[0],text:a===sh[0]?`Your boarding parties have captured every control room of the ${d.n}. You have captured the ship and win a decisive victory!`:`${d.n}'s crew has captured your ship.`};if(a===sh[0]){d.out=true;d.captured=true;if(!ENL().length)over=_o}else over=_o;L(_o.text+RL('D7.50, D7.36'))}
 else if(BRD.n<=0){BRD=null}}
// [FD2.5] Why a dogfight (type VI) drone cannot be launched.
function dogWhy(s,k,i){const a=s.ad[k],foe=foeOf(s);if(!optDog)return'off';if(NEB())return'Dogfight drones do not work in a nebula (P6.6)';if(k>=(s.sys.Add||0))return'ADD destroyed';if(a.ammo<=0)return'Rack empty';if(a.rlT===turn)return'Plotted for reload (E5.74)';if(s.emOn)return'Erratic maneuvering: no type-VI launch (E5.43)';
 if(!fcOk(s))return ckOn(s)?'Cloaked (G13.512)':'No active fire control';if(s.lock===false)return'No lock-on (F3.31)';if(ckOn(foe)&&foe.ck.mode==='on'&&!foe.ck.lockBy)return'No lock-on to the cloaked ship (G13.311)';
 if(absI(i)<=s.noFire)return'Post-breakdown: no weapons (C6.5471)';if(a.vt===turn)return'One type-VI a turn from each ADD (E5.42)';if(a.adT===turn)return'This ADD fired anti-drones this turn (E5.42)';if(absI(i)-(a.lastAdd||-99)<8)return'Eight-impulse delay after switching modes (E5.42)';
 if(ctrlN(s)>=ctlMax(s))return'No free control channel (F3.21)';if(effRange(s,foe)>6)return'Target must be within six hexes (E5.41)';return''}
// [FD2.5] Launch a dogfight drone from an ADD rack.
function launchVI(s,k,i){const a=s.ad[k],foe=foeOf(s),T=DT.VI;a.ammo--;a.vt=turn;a.lastVI=absI(i);const f=bestFacing(s,foe);
 DR.push({id:++drN,dr:true,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f,st:0,hp:T.hp,wh:T.wh,spd:T.spd,exp:absI(i)+T.end*32,born:absI(i),hetT:-99,mv:-1,ecm:0,vi:true});
 L(`Impulse ${i}: ${s.tag} launches a ${T.n} (#${drN}) from ADD rack ${k+1} at ${foe.tag}, range ${dist(s,foe)}. It moves ${T.spd} hexes a turn, lasts one turn and does only ${T.wh} damage to a ship.`+RL('E5.41, E5.42, FD2.54, FD2.55'))}
function dogUI(me,i){if(!optDog||!me.ad||!me.ad.length)return'';let b='',why=[];me.ad.forEach((a,k)=>{if(k>=(me.sys.Add||0))return;const w=dogWhy(me,k,i);if(w)why.push('ADD '+(k+1)+': '+w);b+=`<button ${w?'disabled':''} onclick="launchVI(sh[0],${k},imp+1);draw()">Launch type-VI dogfight drone from ADD ${k+1} (${a.ammo} left)</button>`});
 return b?`<div class="row" style="margin:4px 0">${b}</div>${why.length?`<p class="mu" style="margin:2px 0">${why.join('. ')}.</p>`:''}`:''}
// [F3.2, F3.4] Why a seeking weapon is no longer controlled by its launcher.
function ctrlWhy(d){const s=d.own,t=d.tgt;if(d.cr)return'';if(d.fc){if(!DR.includes(d.fc))return'its fighter was destroyed (J4.22)';if(dist(d.fc,d)>35||dist(d,t)>35)return'it is more than 35 hexes from its fighter or target';return''}if(power(s)<=0)return'its controller is dead in space';if(s.emOn)return'its controller is using erratic maneuvering and cannot guide it (C10.512)'; if(!fcOk(s))return ckOn(s)?'its controller is cloaked':'its controller has no active fire control';if(s.lock===false)return'its controller has no lock-on';
 if(effRange(s,t)>35)return'the target is more than 35 hexes from its controller';if(dist(s,d)>35)return'it is more than 35 hexes from its controller';if(dist(d,t)>35)return'it is more than 35 hexes from its target';
 if(plBetween(s,t))return'a planet is between its controller and the target, so the lock-on is lost (P2.322, P2.3222)';if(TER.moon&&sh.includes(t)&&MOONB.has(moonKey(s,t)))return'the moon has broken its controller\'s lock-on (P2.3221, P2.3222)';return''}
// [F2.1, F2.2, F2.13, FP1.4, F3.0] Drone and plasma movement: control, endurance, turns, high energy turn.
function moveDrones(i){const A=absI(i),notes=[];
 DR.slice().forEach(d=>{if(d.ft)return;const tg0=d.tgt,w=ctrlWhy(d);
  if(tg0.ck&&tg0.ck.mode==='on'&&!tg0.ck.lockBy){
   if(d.pl&&!d.ckTry){d.ckTry=true;const net=(tg0.ecm||0)-(3+(d.free?0:(d.own.eccm||0))),ew=net>=0?sqrtShift(net):-sqrtShift(-net),P=6-ew-ckRF(dist(d,tg0))+ckSF(mRate(tg0,A))-4,dd=d6();L(`Plasma torpedo #${d.id} tries for its own lock-on to the cloaked ${tg0.tag}: needs ${P} or less, rolled ${dd}.`+RL('G13.334, FP4.5'));if(dd<=P)d.free=true;else{rmDr(d);L(`It loses the target and is removed from play.`);return}}
   else if(!d.pl||d.ckTry&&!d.free){rmDr(d);L(`${d.pl?'Plasma torpedo':'Drone'} #${d.id} of ${d.own.tag} cannot track the cloaked ${tg0.tag} and is removed from play.`+RL('G13.311, G13.334'));return}}
  if(w){if(d.pl){if(!d.free){d.free=true;L(`Plasma torpedo #${d.id} of ${d.own.tag} is released (${w}) and guides itself.`+RL('FP4.2, F3.42'))}
    if(dist(d,tg0)>35){rmDr(d);L(`Plasma torpedo #${d.id} loses its target (more than 35 hexes) and is removed.`+RL('FP4.23'));return}}
   else{rmDr(d);L(`Drone #${d.id} of ${d.own.tag} is released and goes inert: ${w}.`+RL('F3.32, F3.41, FD1.7'));return}}
  if(d.pl&&d.free&&TBLK.size&&plBetween(d,tg0)){rmDr(d);L(`Plasma torpedo #${d.id} of ${d.own.tag} loses its target behind the planet, takes the planet as its new target and explodes on it.`+RL('P2.33, P2.322'));return} // [P2.33] a self-guided seeking weapon whose target goes behind a planet hits the planet
  if(A>d.exp){rmDr(d);L(`${d.pl?'Plasma torpedo':'Drone'} #${d.id} of ${d.own.tag} has run out of endurance and is removed.`+RL(d.pl?'FP1.42':'FD1.4, FD1.71'))}});
 sh.forEach(s=>{const m=DR.filter(d=>d.own===s&&!d.ft&&!d.fc&&!d.cr);while(m.filter(z=>!z.pl).length>ctlMax(s)){const d=m.filter(z=>!z.pl).pop();m.splice(m.indexOf(d),1);rmDr(d);L(`${s.tag} has lost control channels: drone #${d.id} goes inert.`+RL('F3.21, F3.41'))}});
 DR.forEach(d=>{if(d.ft||d.held||!moves(d.spd,i)||d.born>=A)return;if(optWeb&&dWebHold(d,A))return;const tg=d.tgt,a=rel(d,tg);
  if(A-d.hetT>=32&&a!==null&&a>=120&&a<=240){d.f=bestFacing(d,tg);d.st=0;d.hetT=A;if(!d.pl)notes.push(`#${d.id} makes a high-energy turn to ${FL[d.f]}`);else L(`Plasma torpedo #${d.id} makes a high-energy turn to ${FL[d.f]}.`+RL('F2.13'));return}
  const opts=[0];if(d.st>=1)opts.push(-1,1);
  const ev=opts.map(df=>{const nf=(d.f+df+6)%6,[nc,nr]=NB(d.c,d.r,nf);if(nc<1||nc>COLS||nr<1||nr>ROWS)return null;const aa=rel({c:nc,r:nr,f:nf},tg);return{df,nf,nc,nr,dd:dist({c:nc,r:nr},tg),fa:(aa===null||inTok('FA',aa))?0:1,tn:df?1:0}}).filter(Boolean).sort((x,y)=>x.dd-y.dd||x.fa-y.fa||x.tn-y.tn);
  if(!ev.length){rmDr(d);L(`Drone #${d.id} reaches the map edge and is lost (simplification).`);return}
  const b=ev[0];d.pc=d.c;d.pr=d.r;if(b.df){d.f=b.nf;d.st=1}else d.st++;d.c=b.nc;d.r=b.nr;d.mv=A;if(optAst&&inAst(d.c,d.r)&&astSeek(d,i))return;if(optWeb&&dWebEnter(d,tg,A))return;if(d.pl){if(!(d.c===tg.c&&d.r===tg.r))d.trav++;if(NEB())d.dmg=(d.dmg||0)+1; /* [P6.73] 1 point of phaser damage (half a warhead point) per hex entered */ if(plStr(d)<=0){rmDr(d);L(`Plasma torpedo #${d.id} of ${d.own.tag} has dissipated: its warhead has faded to nothing.`+RL('FP1.51'));return}}else{if(NEB()){d.neb=(d.neb||0)+.25;if(d.neb>=d.hp){rmDr(d);L(`Drone #${d.id} of ${d.own.tag} has taken ${d.neb} points of damage from the nebula and is destroyed.`+RL('P6.73'));return}} /* [P6.73] 1/4 point per hex entered */ notes.push(`#${d.id}${b.df?(b.df>0?' turns right':' turns left'):''} to ${hexNo(d.c,d.r)}`)}});
 if(notes.length)L(`Impulse ${i}: drones move: ${notes.join('; ')}.`+RL('F2.11, F2.12, F2.13, F2.21, F2.22'))}
// [E5.2, E5.6] Anti-drone racks fire automatically at drones within three hexes.
function addFire(i){sh.forEach(s=>{if(!s.ad||!s.ad.length||!fcOk(s)||s.lock===false||power(s)<=0)return;const taken=new Set();
  s.ad.forEach((rk,k)=>{if((rk.g!==undefined?rk.g>=(s.sys.Drone||0):k>=(s.sys.Add||0))||rk.ammo<=0)return;if(rk.rlT===turn||rk.vt===turn||absI(i)-(rk.lastVI||-99)<8)return; // [E5.74] a plotted ADD reload means no firing
   const t=DR.filter(d=>d.own!==s&&!d.pl&&!taken.has(d)&&dist(s,d)>=1&&dist(s,d)<=3).sort((a,b)=>dist(s,a)-dist(s,b))[0];if(!t)return;taken.add(t);
   const rg=dist(s,t),need=rg+1-(s.emOn?1:0),roll=d6(),v=roll+scanAdj(s);rk.ammo--;rk.adT=turn;rk.lastAdd=absI(i);
   if(v<=need){rmDr(t);L(`Impulse ${i}: ${s.tag}'s ADD fires at drone #${t.id} at range ${rg}: rolled ${roll}${scanAdj(s)?` +${scanAdj(s)} scanner`:''} (needs ${need} or less). HIT: the drone is destroyed. ${rk.ammo} anti-drones left.`+RL('E5.21, E5.61'))}
   else L(`Impulse ${i}: ${s.tag}'s ADD fires at drone #${t.id} at range ${rg}: rolled ${roll}${scanAdj(s)?` +${scanAdj(s)} scanner`:''} (needs ${need} or less). Miss. ${rk.ammo} anti-drones left.`+RL('E5.21, E5.61'))})})}
// [F2.31, FP2.0, D6.36] Drones and plasma reaching their target: proximity roll, damage to the shield facing.
function resolveImpacts(i){const A=absI(i);
 DR.slice().forEach(d=>{const t=d.tgt;if(d.ft||d.held||d.born>=A||d.c!==t.c||d.r!==t.r)return;rmDr(d);
  if(d.fake){L(`Impulse ${i}: plasma torpedo #${d.id} of ${d.own.tag} reaches ${t.tag} in hex ${hexNo(t.c,t.r)}. It was a pseudo-plasma torpedo: it disintegrates and does no damage.`+RL('FP6.3, FP6.31'));return}
  const wh=d.pl?plStr(d):d.wh;let pct=1,m='';
  if(ckOn(t)){const cf=ckChart(t);pct=cf.f;m=` Cloak: ${cf.txt}.`+RL('G13.35, G13.37')}
  else{const sf=sqrtShift(ecmOf(t)+zEcm()+(NEB()?9:0)+((TER.bh&&dist(t,TER.bh)<=10)||(TER.pul&&dist(t,TER.pul)<=10)?2:0)-(d.pl?3+(d.free?0:(d.own.eccm||0)):(d.own.eccm||0)));
   if(sf>0){const roll=d6(),v=roll+sf;pct=v<=6?1:v<=8?.5:v<=10?.25:0;m=` Proximity roll ${roll} + ECM shift ${sf} = ${v}: warhead at ${pct*100}% strength.`+RL('D6.36')}}
  const dmg=Math.round(wh*pct),pv=t.path.length>1?t.path[t.path.length-2]:[d.pc,d.pr],from=d.mv===A?{c:d.pc,r:d.pr}:{c:pv[0],r:pv[1]},sk=shieldFor(t,from);
  L(`Impulse ${i}: ${d.pl?'plasma torpedo':'drone'} #${d.id} of ${d.own.tag} reaches ${t.tag} in hex ${hexNo(t.c,t.r)}${d.pl?` (warhead ${wh} after ${d.trav} hexes${d.dmg?' and '+d.dmg+' phaser damage':''})`:''}.${m}`+RL('F2.31'));
  if(dmg>0&&d.ept)envelop(t,dmg,from,d);else if(dmg>0)applyVolley(t,sk.k,dmg,from,sk.note,`${d.pl?'Plasma torpedo':'Drone'} #${d.id} detonates for ${dmg} on ${t.tag} shield #${sk.k+1}${sk.note}.`,'F2.31, FD1.62, D4.11');else L(`The warhead goes off too far from ${t.tag} to do any damage.`+RL('D6.36'))})}
const droneReady=s=>DR.filter(d=>d.own!==s&&dist(s,d)<=Math.min(pauseAt,8)&&weapons(s).some(x=>wStatus(s,x,d).ok));
// [FD2.0] Computer drone launch decisions.
function aiLaunch(s,i){if(s.conceded||!s.rk.length)return;const foe=foeOf(s),r=dist(s,foe),lim=level==='easy'?12:level==='normal'?18:24;if(r>lim)return;
 s.rk.forEach((_,k)=>{if(launchWhy(s,k,i))return;if(level==='easy'&&Math.random()<.5)return;launch(s,k,i)})}
// [D3.3] Computer reinforcement and defensive choices.
function aiDefend(s,out){const used=new Set(),lim=level==='easy'?2:level==='normal'?4:6;
 DR.filter(d=>d.own!==s&&d.own.tm!==s.tm).map(d=>({d,r:dist(s,d)})).filter(o=>o.r<=(o.d.pl?lim+3:lim)).sort((a,b)=>a.r-b.r).forEach(o=>{let e=0;const need=o.d.pl?Math.max(4,Math.round(plStr(o.d)*.6)*2):o.d.hp+(level==='hard'?0:1);
  weapons(s).forEach(x=>{if(x.kind!=='ph'||used.has(x.id)||e>=need)return;const st=wStatus(s,x,o.d);if(!st.ok)return;x.dt=o.d;used.add(x.id);out.push(x);e+=st.info.exp})});return used}
function launchUI(me,i){if(!me.rk.length)return'';const T=DT[dtype],why=[];let b='';
 me.rk.forEach((rk,k)=>{const w=launchWhy(me,k,i);if(w)why.push('Rack '+(k+1)+': '+w);b+=`<button ${w?'disabled':''} onclick="doLaunch(${k})">Launch ${T.n} from rack ${k+1} (${rk.ammo} left)</button>`});
 return`<div class="mu" style="margin:6px 0">Drones: control channels used <b>${ctrlN(me)}</b> of ${ctlMax(me)}. Launching is free but needs fire control (FD1.22). ${noLaunch===turn?'':`<button onclick="noLaunch=turn;draw()">No more launches this turn</button>`}</div><div class="row">${b}</div>${why.length?`<p class="mu" style="margin:2px 0">${why.join('. ')}.</p>`:''}`}
function doLaunch(k){launch(sh[0],k,imp+1);draw()}
function drSvg(){return DR.map(d=>{const x=cx(d.c),y=cy(d.c,d.r),col=d.own.col,t=d.tgt;if(d.ft)return ftSvg(d,x,y,col);
 if(d.pl)return`<line x1="${x}" y1="${y}" x2="${cx(t.c)}" y2="${cy(t.c,t.r)}" stroke="${col}" stroke-opacity=".4" stroke-dasharray="3 4"/><g transform="translate(${x+11} ${y+11})"><circle r="10" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width="2.5"/><text y="4" font-size="11" font-weight="800" text-anchor="middle" fill="${col}">${plStr(d)}</text></g><text x="${x+11}" y="${y+32}" font-size="10" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">P${d.id}</text>`;
 return`<line x1="${x}" y1="${y}" x2="${cx(t.c)}" y2="${cy(t.c,t.r)}" stroke="${col}" stroke-opacity=".4" stroke-dasharray="3 4"/><g transform="translate(${x+11} ${y+11})"><circle r="9" fill="var(--card)" fill-opacity=".92" stroke="${col}" stroke-width="1.5"/><g transform="rotate(${60*d.f})"><polygon points="0,-7 5,5 0,2 -5,5" fill="${col}"/></g></g><text x="${x+11}" y="${y+30}" font-size="10" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">D${d.id}</text>`}).join('')}
function plCard(s,pm){let h=`<p style="margin:6px 0 2px"><b>Plasma and cloak</b></p>`+s.pl.map(t=>`<span class="chip ${t.alive?'':'bad'}">${t.name}: ${!t.alive?'destroyed':t.rdy?'ready':t.fired?'launched':t.st+' of 3 turns armed'}</span>`).join('');if(s.d.clk)h+=`<span class="chip">Cloak (${s.d.clk[0]}/turn): <b>${{off:'off',on:'ON',out:'fading out',in:'fading in'}[s.ck.mode]}</b></span>`;if(pm.length)h+='<div class="scroll"><table><tr><th>Torpedo</th><th>Hex</th><th>Range</th><th>Warhead</th></tr>'+pm.map(d=>`<tr><td>#${d.id}</td><td>${hexNo(d.c,d.r)}</td><td>${dist(d,d.tgt)}</td><td>${plStr(d)}</td></tr>`).join('')+'</table></div>';return h}
function seekCard(s){const mine=DR.filter(d=>d.own===s&&!d.pl&&!d.ft),pm=DR.filter(d=>d.own===s&&d.pl);if(!s.rk.length&&!mine.length&&!s.pl.length&&!s.d.clk)return'';if(!s.rk.length&&!mine.length)return plCard(s,pm);const T=DT[dtype];
 let h=`<p style="margin:6px 0 2px"><b>Seeking weapons</b>: ${T.n}s, speed ${T.spd}, ${T.end} turns, warhead ${T.wh}, ${T.hp} damage destroys one</p>`;
 h+=s.rk.map((rk,k)=>`<span class="chip ${rkAlive(s,k)?'':'bad'}">Rack ${k+1}: ${rkAlive(s,k)?rk.ammo+' drones':'destroyed'}</span>`).join('')+`<span class="chip">Controlling <b>${mine.length}</b> of ${sensorRate(s)}</span>`;
 if(mine.length)h+='<div class="scroll"><table><tr><th>Drone</th><th>Hex</th><th>Range to target</th><th>Turns left</th></tr>'+mine.map(d=>`<tr><td>#${d.id}</td><td>${hexNo(d.c,d.r)}</td><td>${dist(d,d.tgt)}</td><td>${fmt(Math.max(0,Math.round((d.exp-absI(imp))/3.2)/10))}</td></tr>`).join('')+'</table></div>';
 return h}
