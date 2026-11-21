/* ================= movement ================= */
// [C3.1, C3.4] Has the unit moved straight far enough to turn?
const elig=s=>s.sp<=1||s.st>=tmS(s);
const slipOk=s=>optSlip&&s.sp>0&&(s.sl||0)>=1; // C4.1: slip mode of 1 for every ship
const absI=i=>(turn-1)*32+i;
// [C6.541] Is the ship unable to move after a breakdown?
const blocked=(s,i)=>absI(i)<=s.noMove;
// [C6.2, C6.3, C6.37] A high energy turn needs allocated energy, not impulse 1, 8 impulses since the last, no breakdown.
const canHet=(s,i)=>optHet&&s.hetAvail>0&&!hasCrit(s,'man')&&i>1&&!blocked(s,i)&&absI(i)-s.lastHet>=8&&s.sp>=0;
// [C6.37, C6.541] Why a high energy turn is not allowed right now.
const hetWhy=(s,i)=>s.hetAvail<=0?'No HET energy allocated':i<=1?'Not on the first impulse (C6.37)':blocked(s,i)?'Broken down (C6.541)':absI(i)-s.lastHet<8?'Within 8 impulses of the last HET (C6.36)':'';
// [C6.5, C6.52] Chance that a high energy turn breaks down the ship.
const bdChance=s=>{const adj=cq(s)<0?0:(s.hetUsed&&!(cq(s)>0&&(s.hetN||0)<(nimble(s)?3:2)))?0:2,bd=s.bd-(cq(s)<0?1:0);let n=0;for(let d=1;d<=6;d++)if(d-adj>=bd)n++;return n/6};
// Helper: the facing that points most nearly at a target.
function bestFacing(s,o){const a=Math.atan2(cy(o.c,o.r)-cy(s.c,s.r),cx(o.c)-cx(s.c))*180/Math.PI;return(((Math.round((a+90)/60))%6)+6)%6}
function aiTurn(s,o){if(s.qh&&s!==sh[0]&&o&&dist(s,o)<=8)qReveal(s,'erects its shields at full strength as the raider closes');if(aiBlind(s))return 0;if(s.merch&&s!==sh[0]){const cv=sh.filter(x=>x.merch&&!x.out&&x!==s&&!x.captured);if(cv.length){const far=cv.reduce((m,x)=>dist(s,x)>dist(s,m)?x:m,cv[0]);if(dist(s,far)>=8){const mid={c:Math.round(cv.reduce((a,x)=>a+x.c,s.c)/(cv.length+1)),r:Math.round(cv.reduce((a,x)=>a+x.r,s.r)/(cv.length+1))},b=bestFacing(s,mid);if(b===s.f)return 0;return((b-s.f+6)%6)<=3?1:-1}} /* [SG4.45] close up when any other freighter is 8 or more hexes away, so the convoy never spreads past 10 */ if(dist(s,o)>16)return 0;const b=(bestFacing(s,o)+3)%6;if(b===s.f)return 0;return((b-s.f+6)%6)<=3?1:-1}let b=bestFacing(s,o);const cv=aiCover(s,o);if(cv)b=bestFacing(s,cv);if(s.retreat&&s!==sh[0]){if(s.tm===0){const dE=COLS-s.c,dN=s.r-1;b=bestFacing(s,dE<=dN?{c:COLS,r:s.r}:{c:s.c,r:1});if(Math.min(dE,dN)===0)b=s.f}else{const dW=s.c-1,dS=ROWS-s.r;b=bestFacing(s,dW<=dS?{c:1,r:s.r}:{c:s.c,r:ROWS});if(Math.min(dW,dS)===0)b=s.f}}else if(s.retreat)b=(b+3)%6;if(b===s.f)return 0;return((b-s.f+6)%6)<=3?1:-1}
// [C6.1, C6.21, C6.32, C6.5] Make the high energy turn, roll for breakdown.
function doHet(s,f,i){const foe=foeOf(s),turnBy=((f-s.f)+6)%6,ang=turnBy>3?60*(6-turnBy):60*turnBy;
 let m=`Impulse ${i}: ${s.tag} makes a high energy turn from facing ${FL[s.f]} to ${FL[f]} (${ang}°). It costs ${hetC(s)} warp, ignores turn mode, and resets it to zero.`;
 s.f=f;s.st=0;s.sl=-1;s.hetAvail--;s.lastHet=absI(i);s.hetAt=absI(i);L(m+RL('C6.1, C6.21, C6.32, C4.36'));
 s.hetN=(s.hetN||0)+1;const first=s.hetN<=(nimble(s)?2:1)+(cq(s)>0?1:0),adj=first&&!isCrip(s)&&cq(s)>=0?2:0,emH=s.emOn&&!nimble(s)?1:0,d=d6(),navB=hasRole(s,'nav')&&!s.leg.used?(s.leg.used=true,1):0,net=d-adj+emH-navB; // [G22.86] the legendary navigator's one-time bonus on a breakdown rolls.hetUsed=true;
 let t=`  Breakdown roll for ${s.tag}: ${d}${adj?(nimble(s)?' − 2 (first two HETs of a nimble ship, C6.521)':' − 2 (first HET this scenario, C6.52)'):''}${navB?' − 1 (legendary navigator, G22.86)':''}${emH?' + 1 (erratic maneuvering, C10.55)':''} = ${net} against a breakdown rating of ${s.bd}–6`;
 const bdR=s.bd-(cq(s)<0?1:0);if(cq(s))t+=cq(s)<0?' (poor crew: rating lowered by one and no first-HET bonus, G21.121)':' (outstanding crew: one extra HET bonus, G21.221)';if(net>=bdR){L(t.replace(`rating of ${s.bd}–6`,`rating of ${bdR}–6`)+' → BREAKDOWN!'+RL('C6.51, C6.54'));breakdown(s,i)}else L(t.replace(`rating of ${s.bd}–6`,`rating of ${bdR}–6`)+' → safe'+RL('C6.51'))}
// [C6.54, C6.541, C6.5421, C6.5422, C6.5471] Breakdown effects: stops dead, 16 impulses no move, 8 no fire, fifth warp boxes lost, crew losses.
function breakdown(s,i){if(optFly&&!s.fwDead){s.hReset=true;if(s.fwBroke){s.fwDead=true;L(`  A second breakdown destroys the positron flywheel of ${s.tag}.`+RL('C9.234'))}else{s.fwBroke=true;L(`  The breakdown stops the positron flywheel of ${s.tag}: speeds before this cannot be used any more.`+RL('C9.234'))}}
 s.sp=0;s.f=d6()-1;s.noMove=absI(i)+16;s.noFire=absI(i)+8;if(s.emOn||s.emPaid){s.emOn=false;s.emBegun=true}s.tacLeft=0;s.tacReady=false;s.stacLeft=0;s.freeTac=false;s.hetAvail=0;
 L(`  ${s.tag} stops dead and spins to face ${FL[s.f]}. It cannot move for 16 impulses or fire for 8, and its movement energy is lost.`+RL('C6.541, C6.5471'));
 const wk=['Left W En','Right W En','Center W En'].filter(k=>k in s.d.sys),wsum=()=>wk.reduce((a,k)=>a+s.sys[k],0),tot=wsum(),n=Math.floor(tot/5);
 for(let q=0;q<n;q++){const k=wk.reduce((b,x)=>s.sys[x]>s.sys[b]?x:b,wk[0]);if(s.sys[k]>0)s.sys[k]--}
 L(`  Every fifth warp box is destroyed: ${n} lost (${tot} → ${wsum()} left).`+RL('C6.5422'));
 {const U=s.gc+s.bp/2,kill=Math.floor(U/3),bk=Math.floor(s.bp/4),gk=Math.max(0,Math.min(Math.floor(kill-bk/2),Math.floor(s.gc)-1));s.gc-=gk;s.bp-=bk;s.cK+=gk;s.bK+=bk;
 L(`  One third of the crew units are killed (${kill}, including a quarter of the boarding parties): ${gk} general crew unit${gk===1?'':'s'} and ${bk} boarding part${bk===1?'y':'ies'}.`+RL('C6.5421, G9.22')+crewNote(s))}
 L(`  Two internal damage points as a single volley:`+RL('C6.5423'));{const u=new Set();dac(s,null,u);dac(s,null,u)}
 s.bd=Math.max(1,s.bd-1);L(`  ${s.tag}'s breakdown rating is now ${s.bd}–6 for the rest of the scenario.`+RL('C6.544'));
 s.capCur=Math.min(s.capCur,capMax(s))}
// [C6.0] Computer choice of when to make a high energy turn.
function aiHet(s,foe,i){if(!canHet(s,i)||level==='easy')return undefined;if(AIO&&AIO.crew&&cq(s)<0&&!s.retreat)return undefined; // [G21.121, G21.122] a poor crew's HET is dearer and breaks down more often, so the captain does without
 const a=rel(s,foe),r=dist(s,foe);
 const behind=a!==null&&a>=105&&a<=255;if(!behind||r>20)return undefined;
 if(level==='normal'&&elig(s)&&s.sp>1)return undefined; // can simply turn
 let f=bestFacing(s,foe);if(f===s.f)return undefined;return f}
/* ---- C8 emergency deceleration ---- */
// [C8.4] Movement points left in the turn from an impulse on.
const unusedMove=(s,from)=>{let n=0;for(let j=from;j<=32;j++)if(moves(s.sp,j))n++;return n};
// [C8.0, C8.1] Begin an emergency deceleration: the ship stops two impulses later.
function startED(s){if(s.ed||s.sp<=0||phase!=='run'||over)return;s.ed={ann:absI(imp),stop:absI(imp)+2};
 L(`Impulse ${imp}: ${s.tag} announces emergency deceleration. It keeps flying at speed ${s.sp} (and may still turn) and stops at the end of the movement segment of impulse ${imp+2>32?imp+2-32+' of the next turn':imp+2}.`+RL('C8.10, C8.101, C8.31'));draw()}
function edReinf(s,half,kind){ // C8.11: any one shield, or split over the front or rear group; general reinforcement is worth half
 if(half<=0)return'';if(s.shOn<1)return' (your shields are down, so the energy is lost)';
 if(kind==='gen'){const g=Math.floor(half/2);s.gen+=g;return ` ${g} point${g===1?'':'s'} of general reinforcement (it costs two energy per point, C8.11)`}
 if(kind==='front'||kind==='rear'){const ks=kind==='front'?[5,0,1]:[2,3,4];let n=half;for(let q=0;n>0;q=(q+1)%3){s.spec[ks[q]]++;n--}return ` ${half} point${half===1?'':'s'} spread over the ${kind} shields`}
 s.spec[kind]+=half;return ` ${half} point${half===1?'':'s'} of specific reinforcement on shield #${kind+1}`}
// [C8.1, C8.2] Emergency deceleration takes effect two impulses after it is announced.
function edStop(i){sh.forEach((s,k)=>{if(!s.ed||absI(i)<s.ed.stop)return;
 const tl=s.tacLeft||0,pts=unusedMove(s,i+1),e=(pts+tl)*s.d.mc,half=Math.floor(e/2);s.edHalt=absI(i); // [C5.51] allocated tactical-maneuver energy joins the other unspent movement energy
 if(tl){s.tacLeft=0;s.tacReady=false;L(`  The ${tl} tactical maneuver${tl===1?'':'s'} ${s.tag} had allocated ${tl===1?'is':'are'} given up: that energy joins the unspent movement energy.`+RL('C5.51'))}
 if(optFly&&!s.fwDead){s.hReset=true;L(`  The positron flywheel of ${s.tag} is stopped and its earlier speeds can no longer be used.`+RL('C9.231'))}
 if(s.emOn||s.emPaid){s.emOn=false;s.emBegun=true;L(`  ${s.tag} loses the effects of erratic maneuvering, and the energy paid for it is lost.`+RL('C8.23'))}
 s.ed=null;s.disOk=false;s.edPost=true;s.sp=0;s.st=0;s.sl=0;s.noMove=absI(i)+16;
 L(`Impulse ${i}: ${s.tag} comes to a stop. It cannot move out of its hex for 16 impulses (until impulse ${(absI(i)+17-1)%32+1}${absI(i)+17>turn*32?' of the next turn':''}).`+RL('C8.101, C8.41'));
 L(`  ${pts} movement point${pts===1?'':'s'} were still unspent: ${e%1?e.toFixed(2):e} energy, halved (fractions dropped) to ${half}.`+RL('C8.102, C8.112'));
 if(k===0&&half>0&&s.shOn>0)edAsk={half};else if(half>0){const kk=shieldFor(s,foeOf(s)).k;L(`  `+s.tag+edReinf(s,half,kk)+'.'+RL('C8.11'))}})}
// [C8.11] Player chooses where the released energy goes.
function edPick(kind){const s=sh[0],m=edReinf(s,edAsk.half,kind);L(`  ${s.tag} puts the released energy into${m}.`+RL('C8.11, C8.111'));edAsk=null;go()}
function edCarry(s){ // C8.412: a post-deceleration period running into the new turn still pays for movement; the unspent part becomes shield reinforcement
 if(!s.edPost)return;if(s.noMove<absI(1)){s.edPost=false;return}
 const blockedN=s.noMove-absI(0),pts=Math.min(32,blockedN)>0?(()=>{let n=0;for(let j=1;j<=Math.min(32,blockedN);j++)if(moves(s.sp,j))n++;return n})():0,e=pts*s.d.mc,half=Math.floor(e/2);
 s.edPost=false;if(half>0&&s.shOn>0){const kk=shieldFor(s,foeOf(s)).k;L(`${s.tag} is still in its post-deceleration period: the ${pts} movement point${pts===1?'':'s'} it pays for but cannot use become ${half} point${half===1?'':'s'} of reinforcement on shield #${kk+1} (simplification: placed on the shield facing the enemy).`+RL('C8.412, C8.102'));s.spec[kk]+=half}}
function tacOpp(p){const a=spdPlot(p);let n=0;[8,16,24].forEach(j=>{let ok=true;for(let k=j-4;k<=j;k++)if(k<1||a[k]!==0)ok=false;if(ok)n++});if(p.spd===0&&a[2]===0)n++;return n} // [C5.52, C5.532] a halted ship earns a maneuver on impulse 8, 16 or 24 only after four impulses at zero; a ship stopped from impulse 1 also earns one on impulse 2
function tacOK(s,i){const p=s.plan;if(!(optChg&&p&&(p.chg||[]).length))return true;const z=k=>k>=1&&s.sph&&s.sph[k]===0;if(s.sp!==0)return false;if(i===2)return p.spd===0&&z(1);for(let k=i-4;k<=i-1;k++)if(!z(k))return false;return true} // [C5.532] four impulses after coming to a halt
// [C5.51, C5.532, C5.22, C5.221] After an emergency deceleration a ship can buy warp tactical maneuvers with reserve warp power. A maneuver is earned on impulse 8, 16 or 24 (only one earned-and-unused at a time, C5.232) if the halt came before that impulse, and cannot be made until four impulses after the halt. Cost: the energy to move one hex. Four a turn in all.
function rtacAvail(s){if(!optChg||phase!=='run'||over||!s.edHalt||s.sp!==0||(s.rtacN||0)>=4)return 0;const b=(turn-1)*32,n=absI(imp+1);let e=0;[8,16,24].forEach(E=>{if(b+E<=absI(imp)+1&&s.edHalt<b+E)e=b+E});return e&&e!==s.rtacUsed&&n>=s.edHalt+4&&Math.ceil(s.d.mc-1e-9)<=s.bw?e:0}
// [C5.531, H7.47, C5.12] After an emergency deceleration a ship that kept its impulse engines out of movement can pay one reserve impulse point for a sublight tactical maneuver; never on the impulse after the halt.
function stacRAvail(s){return !!(optRI&&optChg&&phase==='run'&&!over&&s.edHalt&&s.sp===0&&!s.impMove&&(s.bi||0)>=1&&!s.stacRUsed&&absI(imp+1)>=s.edHalt+2&&s.tacAt!==absI(imp+1)&&!blocked(s,imp+1))}
function doStacR(dir){const s=sh[0];if(!stacRAvail(s))return;s.bi--;s.bat--;s.impMove=true;s.stacRUsed=true;s.tacAt=absI(imp+1);const was=s.f;s.f=(s.f+dir+6)%6;s.st=0;
 L(`Impulse ${imp+1>32?32:imp+1}: ${s.tag} pays 1 reserve impulse point for a sublight tactical maneuver after its emergency deceleration and turns ${dir>0?'right':'left'} from facing ${FL[was]} to ${FL[s.f]} without leaving its hex.`+RL('C5.531, C5.12, H7.47, C2.111'));draw()}
function doRtac(dir){const s=sh[0],e=rtacAvail(s);if(!e)return;const c=Math.ceil(s.d.mc-1e-9);s.bw-=c;s.bat-=c;s.rtacUsed=e;s.rtacN=(s.rtacN||0)+1;s.tacAt=absI(imp+1);const was=s.f;s.f=(s.f+dir+6)%6;s.st=0;
 L(`Impulse ${imp+1>32?32:imp+1}: ${s.tag} pays ${c} reserve warp point${c===1?'':'s'} for a tactical maneuver after its emergency deceleration and turns ${dir>0?'right':'left'} from facing ${FL[was]} to ${FL[s.f]} without leaving its hex (${s.rtacN} of 4).`+RL('C5.51, C5.532, C5.221'));draw()}
function tacEarn(i){sh.forEach(s=>{if(blocked(s,i)){s.tacReady=false;return}if(s.tacLeft>0&&[2,8,16,24].includes(i)&&s.tacLast!==absI(i)&&tacOK(s,i)){s.tacLast=absI(i);s.tacReady=true}if(s.freeTac&&i===32){s.freeTac=false;s.tacLeft=1;s.tacReady=true;s.tacFree=true}})}
// [C5.1, C5.2] Make a tactical maneuver: turn 60 degrees at once, ignoring turn mode.
function doTac(dir){const s=sh[0];if(!s.tacReady||s.tacLeft<=0||blocked(s,imp+1)||s.stacAt===absI(imp+1))return;s.tacAt=absI(imp+1);const was=s.f;s.f=(s.f+dir+6)%6;s.tacLeft--;s.tacReady=false;s.st=0;
 L(`Impulse ${imp+1>32?32:imp+1}: ${s.tag} makes a tactical maneuver and turns ${dir>0?'right':'left'} from facing ${FL[was]} to ${FL[s.f]} without leaving its hex.`+RL(s.tacFree?'C5.13':'C5.21, C5.231, C5.232'));draw()}
// [C10.0, C10.2, C10.3] Erratic maneuvering starts.
function beginEM(s){if(!s.emPaid||s.emBegun||over)return;s.emOn=s.emBegun=true;s.st=Math.min(s.st,tmS(s));L(`Impulse ${imp}: ${s.tag} begins erratic maneuvering at the end of the impulse. Enemy fire at it, and its own fire, count as 4 more ECM points; its turn mode is one hex longer and it cannot launch.`+RL('C10.311, C10.41, C10.414, C10.55, C10.511'))}
function stopEM(s){if(!s.emOn)return;s.emOn=false;L(`Impulse ${imp}: ${s.tag} stops erratic maneuvering. It cannot start again this turn.`+RL('C10.32'))}
// [C5.53] A sublight tactical maneuver.
function doStac(dir){const s=sh[0];if(phase!=='run'||over||!(s.stacLeft>0)||imp<1||blocked(s,imp+1)||s.tacAt===absI(imp+1))return;const was=s.f;s.f=(s.f+dir+6)%6;s.stacLeft--;s.stacAt=absI(imp+1);s.st=0;
 L(`Impulse ${imp+1}: ${s.tag} makes a sublight tactical maneuver and turns ${dir>0?'right':'left'} from facing ${FL[was]} to ${FL[s.f]} without leaving its hex.`+RL('C5.11, C5.12'));draw()}
function aiSlipPick(s){ // the scripted opponent sideslips toward the side it wants to turn to when its turn mode is not met (C4)
 if(level==='easy'||!slipOk(s)||elig(s))return 0;const t=aiTurn(s,foeOf(s));return t===0?0:2*t}
// [C1.0, C3.0, C4.0, C1.43, G7.36, G10.5] Movement stage of one impulse: HETs, turns, sideslips, the one-hex move, tractor pair, webs, asteroids, map edge.
/* the computer keeps well clear of a black hole (5 hexes, outside its first pull ring) and of a pulsar hex (2 hexes) */const hzNear=(c,r)=>!!(MINEZ.has(c+','+r)||(TER.moon&&c===TER.moon.c&&r===TER.moon.r)||(TER.bh&&dist({c,r},TER.bh)<=8)||(TER.pul&&dist({c,r},TER.pul)<=2));
let AUTOPL=false; // test hook: lets the planet-avoidance steering also act on the first ship when a script flies it
function moveShips(i){const t=sh.map((s,k)=>k===0?(pend===null?0:pend):(s.out?0:aiTurn(s,foeOf(s)))),hf=sh.map((s,k)=>k===0?s.hetNext:(s.out?undefined:aiHet(s,foeOf(s),i)));
 sh.forEach((s,k)=>{if(k&&!s.out&&!elig(s)){const q=aiSlipPick(s);if(q)t[k]=q}});
 sh[0].hetNext=undefined;
 if(LNK&&(((LNK.by.sys.Tractor||0)<1)||dist(LNK.by,LNK.on)>(optG76?3:1)||LNK.by.emOn||(optWeb&&webThrough(LNK.by,LNK.on))||LNK.by.exitEdge||LNK.on.exitEdge))breakLink('the ships can no longer hold the link','G7.122');
 const pairOn=pairMode(),pairHet={}; // [G7.36] when both linked ships move, the pair is resolved together after any high energy turns
 sh.forEach((s,k)=>{let het=false;
  if(k&&s.out)return;if(LNK&&LNK.on===s&&!pairOn)return;
  if(s.d.base){if(!s.out&&[12,28].includes(i)){s.f=(s.f+1)%6;L(`Impulse ${i}: ${s.tag} rotates 60° to facing ${FL[s.f]}.`+RL('C3.7, C3.71, C3.72'))}return} // C3.7: the computer base rotates twice a turn

  if(hf[k]!==undefined&&canHet(s,i)){doHet(s,hf[k],i);het=true}
  if(pairOn&&(s===LNK.by||s===LNK.on)){pairHet[k]=het;return}
  if(s.exitEdge)return;if(optLand&&s.pst&&s.pact!=='leave')return; // [P2.80] a ship in the atmosphere or on the ground does not move across the map
  if(!moves(spdOf(s),i)||blocked(s,i)){if(s.disOk&&moves(s.plan?s.plan.spd:s.sp,i)&&blocked(s,i))s.disOk=false;return}let m=`Impulse ${i}: ${s.tag}`,tr=false,slip=0,tk=t[k];const pc0=s.c,pr0=s.r;
  if(Math.abs(tk)===2){if(!het&&slipOk(s))slip=Math.sign(tk);tk=0}
  if((k>0||AUTOPL)&&(TBLK.size||TER.bh||TER.pul||MN.size||TER.moon||(AIO&&AIO.terr&&(ASTH.size||RGH.size)))&&!het&&!slip&&elig(s)){const LA=Math.min(TER.bh?20:12,4+Math.ceil(spdOf(s)/2)+(TER.bh?6:0)),aHz=AIO&&AIO.terr&&spdOf(s)>6,ahead=f=>{let c=s.c,r=s.r;for(let n=0;n<LA;n++){[c,r]=NB(c,r,f);if(terBlk(c,r)||hzNear(c,r)||(aHz&&(inAst(c,r)||inRing(c,r))))return n+1}return 99}/* [P3.2, P2.223] with the AI switch on the computer also steers clear of asteroid and ring hexes when it is fast enough to be hurt (speed above 6) */,f0=s.dir?(s.f+3)%6:s.f; // AI keeps clear of a planet: turn away when one lies straight ahead within a distance that grows with speed (a crash now destroys the ship, P2.812)
   const f1=((s.dir?(s.f+tk+3):(s.f+tk))%6+6)%6; // the heading after the turn the AI wanted
   if(ahead(f1)<99){if(ahead(f0)<99){const L1=ahead((f0+1)%6),R1=ahead((f0+5)%6);tk=L1>=R1?1:-1}else tk=0}
   if(TER.bh&&dist(s,TER.bh)<=13){const nd=f=>{const[c,r]=NB(s.c,s.r,f);return dist({c,r},TER.bh)},best=[0,1,-1].map(d=>[d,nd(((f0+d)%6+6)%6)]).sort((x,y)=>y[1]-x[1])[0];tk=best[0]} /* close to the hole the computer steers away from it so the pull rings do not carry it in */}
  if(optWeb){const hw=webHold(s,i,tk,het);if(hw===1)return;if(hw===2)slip=0} // [G10.511, G10.57] a caught ship stays put until it has spent enough movement points; it cannot leave by a sideslip
  if(!het&&tk!==0&&elig(s)){s.f=(s.f+tk+6)%6;s.st=0;m+=` turns ${tk>0?'right':'left'} to facing ${FL[s.f]} and`;tr=true}
  const df=slip?(s.f+(s.dir?3-slip:slip)+6)%6:(s.dir?(s.f+3)%6:s.f);let [nc,nr]=NB(s.c,s.r,df);
  if((nc<1||nc>COLS||nr<1||nr>ROWS)&&!(s.disPlan&&!noDis(s))&&optFloat&&!scn6){const sft=floatShift(nc,nr);if(sft){[nc,nr]=NB(s.c,s.r,df);m+=` (the map floats: every unit and asteroid is moved ${sft} away from the edge)`+RL('S1.43')}} // [S1.43, SG1.41] floating map: when a unit is about to leave the map, move everything away from that edge and go on
  if(terBlk(nc,nr)&&spdOf(s)>1){ // [P2.812, P2.431, P2.435] entering a planet or atmosphere hex at a speed above 1 is a crash: a class-M planet wrecks the ship (no explosion), a gas giant destroys it in a catastrophic landing that explodes as D5.2
   const gas=!!(TER.gas&&dist({c:nc,r:nr},TER.gas)<=TER.gas.R);s.c=nc;s.r=nr;s.boom=true;s.killTxt=`${s.n} enters ${hexNo(nc,nr)}, ${gas?'a gas giant':'a planet'} hex, at speed ${spdOf(s)} and ${gas?'is destroyed in a catastrophic landing':'crashes and is wrecked'}.`;if(!gas)s.exploded=true;
   L(`Impulse ${i}: ${s.tag} enters ${hexNo(nc,nr)}, ${gas?'a gas giant':'a planet'} hex, at speed ${spdOf(s)} (more than 1) and ${gas?'is destroyed in a catastrophic landing; it explodes':'crashes and is wrecked (no explosion)'}.`+RL(gas?'P2.812, P2.222, P2.435':'P2.812, P2.212, P2.431'));if(gas)explode(s);checkEnd();return}
  if(optLand&&k===0&&mHexOK(nc,nr)&&!s.pst&&!s.d.base&&spdOf(s)<=1){s.c=nc;s.r=nr;s.pst='A';s.clb=0;s.st=0;s.path.push([nc,nr]);L(`Impulse ${i}: ${s.tag} enters ${hexNo(nc,nr)}, the moon's hex, at speed 1 or less and hovers over the moon (there is no atmosphere). Next turn it can land, hover or leave; the climbing and descending turn is skipped.`+RL('P2.421, P2.231, P2.411'));return}
  if(optLand&&k===0&&pHexOK(nc,nr)&&!s.pst&&!s.d.base){s.c=nc;s.r=nr;s.pst='A';s.clb=0;s.st=0;s.path.push([nc,nr]);L(`Impulse ${i}: ${s.tag} enters ${hexNo(nc,nr)}, the planet's hex, at speed 1 or less and is now in the atmosphere. Next turn it can fly, descend and land, or leave (power for one hex of movement each turn).`+RL('P2.411, P2.4112, P2.80, P2.81'));return}
  if(terBlk(nc,nr)){s.st=Math.max(s.st,tmS(s)); // a ship held at a planet may turn at once on its next impulse, so it cannot wedge itself
   if(s.tbT!==turn){s.tbT=turn;if(!ckHid(s))L(`Impulse ${i}: ${s.tag} is going slowly enough (speed 1 or less) to start a landing at ${hexNo(nc,nr)}, a planet hex, but landing and atmospheric flight (P2.41, P2.8) are not modelled, so it holds its position.`+RL('P2.212, P2.224'))}return}
  if(nc<1||nc>COLS||nr<1||nr>ROWS){if(s.disPlan&&!noDis(s)){const ex=nc<1?'W':nc>COLS?'E':nr<1?'N':'S';s.exitEdge=ex;m+=` leaves the map through the ${EDGE_NAME[ex]}`;tr=false}else{m+=' is stopped at the map edge (simplification: the real map floats)';s.sp=0}}else{s.c=nc;s.r=nr;if(s.pst&&!terBlk(nc,nr)){s.pst=undefined;s.pact=undefined;m+=' leaves the atmosphere and'}if(slip){s.st++;s.sl=0;m+=` sideslips ${slip>0?'right':'left'} into ${hexNo(nc,nr)}, still facing ${FL[s.f]}`}else{s.st++;s.sl=het?0:tr?1:Math.min(9,(s.sl||0)+1);m+=` ${s.dir?'reverses':'moves'} to ${hexNo(nc,nr)}`}s.path.push([nc,nr]);if(LNK&&LNK.by===s&&!s.exitEdge)m+=towHeld(s,df)}
  if(!ckHid(s))L(m+(s.exitEdge?RL('SG1.41'):slip?RL('C4.1, C4.2, C4.31, C4.32'):tr?RL('C3.1, C3.41, C4.33'):RL('C1.43')));if(optAst&&!s.exitEdge&&s.c===nc&&s.r===nr&&inAst(nc,nr))astHit(s,i);if(RGH.size&&!s.exitEdge&&s.c===nc&&s.r===nr&&inRing(nc,nr))ringHit(s,i);if(optWeb&&!s.exitEdge&&!over)webAfter(s,i,pc0,pr0)});if(pairOn&&pairMode())movePair(i,t,pairHet)}
