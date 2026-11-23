/* ================= impulse loop ================= */
// [E1.5] Weapons the human could fire this impulse and why not.
function humanReady(){return weapons(sh[0]).map(x=>({x,st:wStatus(sh[0],x,TG())}))}
// [P4.1, P4.11, P4.12] Black hole: on the listed impulses every unit within range is moved one hex toward hex 2215, closest first, units at one range together; facing is unchanged.
const BHI=[[2,null],[5,[2,5,8,11,13,16,19,22,24,27,29,32]],[10,[5,11,16,22,27,32]],[20,[11,22,32]],[30,[32]]]; // range, impulses (null = every impulse)
const bhPulls=(d,i)=>{for(const[r,l]of BHI)if(d<=r)return l===null||l.includes(i);return false};
function bhStep(n,u){const B=TER.bh;let best=null;for(let f=0;f<6;f++){const[c,r]=NB(u.c,u.r,f);if(c<1||c>COLS||r<1||r>ROWS||terBlk(c,r))continue;const dd=dist({c,r},B),e=(cx(c)-cx(B.c))**2+(cy(c,r)-cy(B.c,B.r))**2;if(!best||dd<best.dd||(dd===best.dd&&e<best.e))best={c,r,dd,e,f}}return best&&best.dd<dist(u,B)?best:null}
function bhMove(i){if(!TER.bh)return;const B=TER.bh,us=sh.filter(s=>!s.out&&!s.exitEdge).concat(DR).filter(u=>{const d=dist(u,B);return d>0&&bhPulls(d,i)});if(!us.length)return;
 const done=new Set(),ds=[...new Set(us.map(u=>dist(u,B)))].sort((a,b)=>a-b),moved=[];let nd=0;
 ds.forEach(d=>{const grp=us.filter(u=>dist(u,B)===d&&!done.has(u)),mv=grp.map(u=>({u,b:bhStep(0,u)})); // units at the same range move together (B2.4)
  mv.forEach(({u,b})=>{if(!b)return;done.add(u);const pc=u.c,pr=u.r;u.c=b.c;u.r=b.r;if(u.dr)nd++;else{if(u.path)u.path.push([b.c,b.r]);moved.push(`${u.tag} to ${hexNo(b.c,b.r)}`)}
   if(!u.dr&&typeof LNK!=='undefined'&&LNK&&(LNK.by===u||LNK.on===u)){const o=LNK.by===u?LNK.on:LNK.by;if(!done.has(o)){done.add(o);const[c2,r2]=NB(o.c,o.r,b.f);if(c2>=1&&c2<=COLS&&r2>=1&&r2<=ROWS&&!terBlk(c2,r2)){o.c=c2;o.r=r2;moved.push(`${o.tag} (linked by tractor) to ${hexNo(c2,r2)}`)}}}})});
 if(moved.length||nd)L(`Impulse ${i}: the black hole in ${hexNo(B.c,B.r)} pulls ${moved.concat(nd?[nd+' seeking weapon'+(nd>1?'s':'')]:[]).join(', ')} one hex closer (facings unchanged).`+RL('P4.1, P4.11, P4.12'))}
// [P6.5] Nebula drift: on impulses 5, 15 and 26 every unit, seeking weapons included, moves one hex in a random direction; ships also roll to turn (1-2 left, 3-4 none, 5-6 right). Turn and sideslip modes are not affected.
function nebDrift(i){if(!NEB()||optQuietNeb||![5,15,26].includes(i))return;const out=[];
 sh.filter(s=>!s.out&&!s.exitEdge).concat(DR).forEach(u=>{if(!u.dr&&i!==15&&hasRole(u,'nav'))return; /* [G22.84] a ship with a legendary navigator only wanders on impulse 15 */ const f=Math.floor(Math.random()*6),[c,r]=NB(u.c,u.r,f);if(c<1||c>COLS||r<1||r>ROWS||terBlk(c,r))return;u.c=c;u.r=r;if(u.dr)return;if(u.path)u.path.push([c,r]);const x=d6(),t=x<=2?-1:x>=5?1:0;if(t)u.f=(u.f+t+6)%6;out.push(`${u.tag} to ${hexNo(c,r)}${t?(t>0?' and turns right':' and turns left'):''}`)});
 L(`Impulse ${i}: the nebula tosses everything about: ${out.join(', ')||'nothing moves'}; seeking weapons drift too.`+RL('P6.5'))}
// [P5.2, P5.23] A radiation burst of the given base strength from a hex: 100% within 5 hexes, 75% to 10, 50% to 20, 25% to 50; scored on the shield facing the source, fractions of .5 up.
const plBetween=(a,b)=>TBLK.size>0&&lineKeys(a,b).some(([c,r],k,ar)=>k>0&&k<ar.length-1&&TBLK.has(c+','+r)); // [P5.354, P2.5472] a planet between a unit and the pulsar shields it from the burst
function radiate(z,base,why,rc){const pct=d=>d<=5?1:d<=10?.75:d<=20?.5:d<=50?.25:0,hit=[];
 sh.filter(s=>!s.out&&!s.boom).forEach(t=>{const d=dist(t,z),f=pct(d);if(!f)return;if(z===TER.pul&&plBetween(t,z)){hit.push(`${t.tag} shielded by a planet`);return}const dm=Math.round(base*f+1e-9);if(dm<=0)return;const k=shieldFor(t,z).k;hit.push(`${t.tag} ${dm}`);applyVolley(t,k,dm,t,'',`${t.tag} takes ${dm} radiation damage on shield #${k+1}.`,rc);ckVoid(t,'it took terrain damage from radiation','G13.48')});
 let nd=0;DR.slice().forEach(d=>{const f=pct(dist(d,z));if(!f||(z===TER.pul&&plBetween(d,z)))return;const dm=Math.round(base*f+1e-9);if(d.pl){d.dmg=(d.dmg||0)+dm;if(plStr(d)<=0){rmDr(d);nd++}}else if(dm>=d.hp){rmDr(d);nd++}}); // [P5.33] plasma damage counts as phaser damage
 L(`${why} (strength ${base}): ${hit.join(', ')||'no ship in range'}${nd?`; ${nd} seeking weapon${nd>1?'s':''} destroyed`:''}.`+RL(rc))}
// [P4.21, P5.34] A unit that enters a black hole or pulsar hex is destroyed; a ship falling into a black hole gives a radiation burst equal to its explosion strength.
function hazKill(i){const z=[TER.bh&&{z:TER.bh,n:'black hole',rc:'P4.21'},TER.pul&&{z:TER.pul,n:'pulsar',rc:'P5.34'}].filter(Boolean);if(!z.length)return;
 z.forEach(o=>{DR.slice().forEach(d=>{if(d.c===o.z.c&&d.r===o.z.r){rmDr(d);L(`Impulse ${i}: ${d.pl?'plasma torpedo':'drone'} #${d.id} enters the ${o.n} hex and is destroyed.`+RL(o.rc))}});
  sh.filter(s=>!s.out&&!s.boom&&s.c===o.z.c&&s.r===o.z.r).forEach(s=>{s.boom=true;s.exploded=true;s.killTxt=`${s.n} enters the ${o.n} hex and is destroyed.`;L(`Impulse ${i}: ${s.tag} enters the ${o.n} hex and is destroyed.`+RL(o.rc));if(o.rc==='P4.21'&&(s.d.ex||0)>0)radiate(o.z,s.d.ex,`The black hole turns the loss of ${s.tag} into a burst of radiation`,'P4.21, P5.2')})});
 checkEnd()}
// [P5.1, P5.11, P5.12, P5.21] The pulsar bursts on the first turn, then a die roll of turns later; the impulse is the total of six dice (33 to 36 count as 2 to 5); base strength is one die times ten.
function pulStep(i){if(!TER.pul)return;
 if(i===1&&turn===PUL.next&&PUL.imp===null){let t=0;for(let k=0;k<6;k++)t+=d6();PUL.imp=t>=33?t-31:t} // [P5.12] the impulse is not announced
 if(PUL.imp!==null&&turn===PUL.next&&i===PUL.imp){const b=d6()*10;radiate(TER.pul,b,`Impulse ${i}: the pulsar in ${hexNo(TER.pul.c,TER.pul.r)} bursts`,'P5.2, P5.23');PUL.next=turn+d6();PUL.imp=null;checkEnd()}}
function step(){ // returns 'pause' | 'done'
 guardCheck();legCheck();
 const i=imp+1,me=sh[0];
 if(edAsk)return'pause';
 if(stage==='mov'){
  AIL().forEach(a=>{if(a.emPaid&&!a.emBegun&&i>=2)beginEM(a)});
  if(me.emPaid&&!me.emBegun&&i===1&&me.emAsk!==turn){me.emAsk=turn;return'pause'}
  if(rotPend&&i===1&&LNK&&LNK.by===me&&optG76)return'pause'; // [G7.7] a ship that kept its tractor link may rotate the held unit before the turn's movement
  tacEarn(i);if(me.tacReady&&me.tacAsk!==absI(i)){me.tacAsk=absI(i);return'pause'}
  if(me.stacLeft>0&&i===2&&me.stacAsk!==turn){me.stacAsk=turn;return'pause'}
  if(moves(linkSp(me),i)&&(elig(me)||(slipStop&&slipOk(me)))&&pend===null&&linkSp(me)>0&&!blocked(me,i)){if(!skip)return'pause';if(!skipOK&&turn>1){skipAsk=true;return'pause'}}
  if(i===1)sh.forEach(qrRoll);sh.forEach(s=>applyChg(s,i));
  const MPRE=minePre();eelMove(i);moveShips(i);sh.forEach(s=>{if(s.sph)s.sph[i]=s.sp});MONS.forEach(m=>withMon(m,()=>mcids(i,false)));moveDrones(i);moveFighters(i);metStep(i);bhMove(i);gwStep(i);mineStep(i,MPRE);mineAuto(i,MPRE);moonStep(i,MPRE);if(i===32)planetEnd();moonLocks(i);eelEnd(i);nebDrift(i);hazKill(i);zoneImp(i);pulStep(i);webReinforce(i);ckStage(i);edStop(i);pend=null;stage='fire';fireSel=null;holdNow=false;if(edAsk)return'pause'}
 if(edAsk)return'pause';
 if(stage==='fire'){
  const rd=humanReady().filter(o=>o.st.ok),range=dist(sh[0],TG());statTick(i,rd,range);
  if(aiLI!==absI(i)){aiLI=absI(i);AIL().forEach(a=>{if(aiBlind(a))return;aiLaunch(a,i);aiPlasma(a,i);aiOpts(a,i);ftrAi(a,i)})}
  if(fireSel===null&&!holdNow&&((rd.length&&range<=pauseAt)||(optSweep&&spdOf(sh[0])===0&&mineNear(sh[0]).length)||droneReady(sh[0]).length||(range<=pauseAt&&noLaunch!==turn&&(launchList(sh[0],i).length||plList(sh[0],i).length||ftrList(sh[0],i)))))return'pause';
  const aiSels=AIL().map(a=>{let fo=foeOf(a);const pt=aiBlind(a)?null:aiPirTarget(a);if(pt)fo=pt;return{s:a,foe:fo,list:aiBlind(a)?[]:aiFire(a,fo,i)}}).filter(a=>a.list.length),hs=(fireSel||[]).map(id=>{const x=weapons(sh[0]).find(z=>z.id===id);if(x){const t=fireTgt[id];x.dt=t&&t!=='S'?DR.find(d=>d.id==+t):null;x.lp=x.kind==='ph'&&x.w.T!==P3&&lowSel.includes(id)&&effRange(sh[0],x.dt||TG())<=15;x.ns=!!nsOn&&optNar&&!x.dt}return x}).filter(x=>x&&wStatus(sh[0],x,x.dt||TG()).ok);
  if(hs.length||aiSels.length)resolveFire(hs,aiSels);
  addFire(i);ftrAct(i);resolveImpacts(i);d22All(i);explodeAll();
  stage='mov';fireSel=null;holdNow=false;imp=i;checkEnd();
  if(imp>=32&&!over)endTurn();return'done'}
 return'done'}
function qrRoll(s){if(!s.qr)return;const d=d6()+(cq(s)>0?1:cq(s)<0?-1:0),sf=s.qr.short; // [G21.126, G21.226]
 s.lastQr=absI(1);s.qr=null;L(`Impulse 1: ${s.tag} attempts a quick reverse, short of braking energy by ${sf}. Breakdown roll ${d}: ${d<=sf?'a die roll of '+sf+' or less is a BREAKDOWN':'safe, direction reversed'}.`+RL('C3.6, C3.61'));if(d<=sf)breakdown(s,1)}
// [C12.0, C12.1, C12.13, C12.24, C12.37] Apply plotted and unplotted speed changes.
function applyChg(s,i){if(i===1){s.unp=[];s.chgImp=-99;s.unpN=0;unpMsg=''}
 const u=(s.unp||[]).find(x=>x.e===i);if(u&&!s.ed&&!(s.noMove>absI(i))){s.sp=u.v;s.plotSp=u.v;s.chgImp=i;s.usedChg=true;L(`Impulse ${i}: ${s.tag} ${u.back?'drops back to':'accelerates to'} speed ${u.v} (${u.back?'end of the unplotted acceleration':'announced on impulse '+(i-1)+', paid with reserve warp power'}).`+RL(u.back?'C12.244':'C12.24'))} // [C12.24, C12.244] non-plotted acceleration takes effect on the impulse after it is announced
 const p=s.plan;if(!p||!(optChg&&p.chg||[]).length||s.ed)return;const c=p.chg.find(x=>x.e===i);if(!c)return;if(s.sp!==s.plotSp){L(`Impulse ${i}: the plotted speed change of ${s.tag} is cancelled because its speed was changed by something else.`+RL('C12.132'));return}L(`Impulse ${i}: ${s.tag} changes speed from ${s.sp} to ${c.v}${c.rev?', now moving in '+(s.dir?'forward':'reverse')+' with no braking cost':''} (announced on impulse ${i-1}).`+RL(c.rev?'C12.10, C12.36, C12.37':'C12.10, C12.36'));if(c.rev)s.dir=s.dir?0:1;s.sp=c.v;s.plotSp=c.v;s.usedChg=true;s.chgImp=i}
function enemyEv(L0){const tg='(?:'+sh.filter(x=>x.tm===1).map(s=>s.tag).join('|')+')',re=new RegExp('^(?:Impulse \\d+: )?(?:'+tg+'\\b.*(?:fires|launches|high energy turn|begins erratic|volley|cloak|tactical)|.*#\\d+ of '+tg+' reaches)');
 return log.slice(0,Math.max(0,log.length-L0)).filter(l=>re.test(l.replace(/<[^>]*>/g,'')))}
function go(){advance(autoGo?'all':'one')}
function advance(mode){prevArr=null;stopWhy=null;HL.clear();let g=0;while(phase==='run'&&!over&&g++<400){const L0=log.length,r=step();if(r==='pause')break;
  if(r==='done'&&phase==='run'&&!over){const ev=enemyEv(L0);if(ev.length&&(optEnemyStop||mode==='one')){stopWhy={imp,lines:ev.slice().reverse()};ev.forEach(l=>HL.add(l));break}}
  if(mode==='one'&&r==='done')break}draw()}
const exLeft=()=>sh.some(s=>s.boom&&!s.exploded);
// [D5.41, D5.31] Explosion damage to ships in range.
function blast(x,bes,done){const hit=[];sh.forEach(t=>{if(t===x||t.boom||done.has(t))return;const d=dist(x,t);if(d>(bes>=10?1:0))return;
  const k=d===0?Math.floor(Math.random()*6):shieldFor(t,x).k;applyVolley(t,k,bes,x,'',`${x.tag}'s explosion hits ${t.tag}${d===0?' in the same hex':''} for ${bes} on shield #${k+1}.`+(d===0?' The facing is rolled.':''),'D5.41, D3.42');ckVoid(t,`it is inside the blast of ${x.tag}'s explosion`,'G13.52');hit.push(t)});return hit}
// [D5.2, D5.3, D5.41] Ship explosion: strength, hexes hit, combined explosions.
function explode(s){if(!optBoom||s.exploded)return;s.exploded=true;const q=[{s,bes:s.d.ex||0}],done=new Set([s]);
 while(q.length){const{s:x,bes:b0}=q.shift();let bes=b0;if(bes<=0)continue;
  L(`${x.tag} explodes. Basic explosion strength ${bes}: ${bes>=10?'the hex and the six hexes around it':'its own hex only'}.`+RL('D5.2, D5.12, D4.43, D5.41'));
  let add=bes;while(add>0){const hit=blast(x,add,done);add=0;hit.forEach(t=>{if(!t.boom)return;t.exploded=true;done.add(t);if(dist(x,t)===0){add+=t.d.ex||0;L(`${t.tag} is destroyed in the same hex and adds its explosion strength ${t.d.ex||0} to the blast.`+RL('D5.31'))}else q.push({s:t,bes:t.d.ex||0})});if(add>0)bes+=add}}}
function explodeAll(){let g=0;while(exLeft()&&g++<8)sh.forEach(s=>{if(s.boom&&!s.exploded)explode(s)})}
// [D5.1] Self-destruct at the start of the turn.
function selfDestructPhase(){if(!optBoom)return;sh.forEach((s,k)=>{const p=s.plan;if(!(p&&p.sd)&&!s.sdNext)return;if(s.out||s.boom)return;L(`${s.tag} self-destructs at the start of the turn.`+RL('D5.1'));s.boom=true;s.selfD=true;s.sdNext=false;if(k===0)plan0.sd=0});explodeAll();checkEnd()}
let sdAsk=false;
function sdUI(){const p=plan0,allies=sh.filter(x=>x!==sh[0]&&x.tm===0&&!x.out).length;if(p.sd)return`<div class="row"><b style="color:var(--bad)">Self-destruct ordered for this turn (D5.1).</b> <button onclick="plan0.sd=0;draw()">Cancel</button></div>`;if(!sdAsk)return`<div class="row"><button ${allies&&!sdEligible(sh[0])?'disabled':''} onclick="sdAsk=true;draw()">Self-destruct...</button><span class="mu">Your ship explodes at the start of the turn (D5.1). ${allies&&!sdEligible(sh[0])?'<span class="mu" style="color:var(--bad)">Not allowed now: with allies still in play your ship may not self-destruct until all but two crew units are lost or the enemy have more boarding parties aboard (D5.51).</span>':allies?'<span class="mu">Allowed: your crew has fallen to two units or fewer, or the enemy outnumber your boarding parties (D5.51).</span>':'<span class="mu">With one ship on your side there is no crew restriction (D5.51).</span>'}</span></div>`;const e=sh[0].d.ex;return`<div class="row"><b>Really self-destruct? Explosion strength ${e}${e>=10?': every ship in your hex and the six around it takes it on the shield facing you':': your own hex only'} (D5.4).</b> <button onclick="plan0.sd=1;sdAsk=false;draw()">Yes, order it</button><button onclick="sdAsk=false;draw()">No</button></div>`}
// [D5.4, S2.41] Dead in space or destroyed ends the fight.
function checkEnd(){sh4Check();sh5Check();sh.forEach((s,k)=>{if(s.out||over||!((power(s)<=0&&!s.merch)||s.boom))return;
  if(optLeg&&s.leg&&s.leg.st==='ok'&&!s.legTried){s.legTried=true;const e=sh.find(x=>!x.out&&x.tm!==s.tm&&!x.dr&&(x.d.size||9)>=(s.d.size||0)),d2=d6()+d6(),ok=d2===2&&d6()<=3; // [G22.223] when the legendary captain's ship is destroyed: a 1% chance (2 on two dice, then 1 to 3) that he ends up in control of the nearest enemy ship of the same or smaller size class
   if(e){L(`${s.tag} is lost, and its legendary captain tries something legendary (1% chance): ${ok?'it works!':'it fails.'}`+RL('G22.223'));if(ok){e.out=true;e.captured=true;const _t=s.tm===0?`${s.n}'s legendary captain turns up aboard the ${e.n} and takes control of it. You have captured the ship and win!`:`${s.n}'s legendary captain has taken over your ${e.n}. You lose.`;if(s.tm===0){if(!sh.filter(x=>!x.out&&x.tm!==0).length)over={win:true,text:_t}}else if(e===sh[0])over={win:false,text:_t};L(_t+RL('G22.223'));s.out=true;return}}}const friend=k>0&&s.tm===0,w=!friend&&!ENL().filter(x=>x!==s).length;
  const t=s.killTxt?`${s.killTxt} ${k?(w?'You win a decisive victory!':''):'You have been defeated.'}`:s.boom?`${s.n} ${s.selfD?'self-destructs':'takes an excess damage hit with no boxes left and is destroyed'}. ${k?(w?'You win a decisive victory!':''):'You have been defeated.'}`:`${s.n} has lost all power and is dead in space. ${k?(w?'You win a decisive victory!':''):'You have been defeated.'}`;
  if(k===0)over={win:false,text:t};else{s.out=true;if(!friend&&!ENL().length&&!pendRein()&&scnX!=='sh5')over={win:true,text:t}}L(t+RL('simplified victory test'))})}
const scnName=()=>scnX?SCX[scnX].name:scn6?'SG6.0, Pursuit into the Asteroids':scn4?'SG4.0, Basic Piracy':(selA&&selB&&(SHIPS[selA].side==='ori'||SHIPS[selB].side==='ori'))?'SG5.0, Duel with a Pirate Raider':'SG1.0, the Duel';
function dblLoss(){sh.forEach(s=>{if(!s.dbl||!s.d.dbl)return;const lost=[];[['Left W En',0],['Right W En',1]].forEach(([n,i])=>{if(s.dbl[i]&&(s.sys[n]||0)>0){s.sys[n]--;lost.push(n.replace(' W En',' warp'))}});if(s.dbl[2]&&(s.sys.Impulse||0)>0){s.sys.Impulse--;lost.push('impulse')} // [G15.231] size-3 ship: one impulse box is marked off if the impulse engine ran doubled
 if(lost.length)L(`${s.tag} doubled its ${lost.join(' and ')} engine${lost.length>1?'s':''} this turn and loses one box from each (G15.202, G15.212, G15.231).`+RL('G15.2, G15.202, G15.231'));s.dbl=null})}
// [B2.3, C7.11, S2.2] End of turn: disengagement, repairs, damage control, next turn.
function rkReload(){sh.forEach(s=>{if(!s.rst||s.out)return;s.rk.forEach((r,k)=>{if(r.rlT!==turn)return;const n=Math.min(2,r.cap-r.ammo,s.rst.dr);if(n>0){r.ammo+=n;s.rst.dr-=n;L(`${s.tag} loads ${n} drone${n>1?'s':''} onto rack ${k+1} (${r.ammo} aboard, ${s.rst.dr} left in the stockpile).`+RL('FD2.42, FD2.421'))}});s.ad.forEach((r,k)=>{if(r.rlT!==turn)return;const n=Math.min(4,r.cap-r.ammo,s.rst.ad);if(n>0){r.ammo+=n;s.rst.ad-=n;L(`${s.tag} loads ${n} anti-drone${n>1?'s':''} onto ADD ${k+1} (${r.ammo} aboard, ${s.rst.ad} left in the stockpile).`+RL('E5.74, E5.71'))}})})} // [FD2.42, E5.74] a rack that was plotted for reload and did not fire takes up to two drone spaces (four anti-drones)
function endTurn(){rkReload();sh2End();legEnd();webEndTurn();if(scn4&&sh.filter(s=>s.merch&&!s.out).length>1){const m=sh.filter(s=>s.merch&&!s.out),far=m.some(a=>m.some(b=>dist(a,b)>10));if(far&&!c4.cohW){c4.cohW=1;L('The convoy has spread beyond 10 hexes (SG4.45). The computer freighters turn toward the middle of the convoy once they are 8 hexes from another freighter, but running from the pirate can still spread them.'+RL('SG4.45'))}}snapTurn();boardResolve();dblLoss();L(`Turn ${turn} ends. Range ${dist(sh[0],TG())}. `+AIL().map(a=>`The ${a.tag} flew at speed ${a.plan.spd}.`).join(' ')+RL('B2.3'));AIL().forEach(a=>LS(`The ${a.tag} had allocated: ${planText(a,a.plan)}.`+RL('B3.5'),1));
 sh.forEach((s,k)=>{if(!s.disPlan||over||s.out)return;const w=pw(s).warp,need=disNeed(s),ok=s.tm===0?HUMAN_EDGES:AI_EDGES,ex=s.exitEdge;s.exitEdge=null;
  if(ex&&!ok.includes(ex)){s.exitDead=true;endFor(k,s,`The ${s.tag} leaves the map through the ${EDGE_NAME[ex]}, which is not one of its authorized edges, and is considered destroyed. You win!`,`Your ${s.tag} left the map through the ${EDGE_NAME[ex]}, which is not one of your authorized edges (${ok.map(e=>EDGE_NAME[e]).join(' and ')}). It is considered destroyed.`,'SG1.41');return}
  if(!s.disOk)L(`${s.tag} cannot disengage: it did not fly the whole turn at full speed.`+RL('C7.11, C7.121'));
  else if(w<need)L(`${s.tag} cannot disengage: only ${w} warp power remains and it needs ${need}.`+RL('C7.11'));
  else if(!ex)L(`${s.tag} flew at full speed but did not reach an edge of the map, so it has not disengaged. It may leave by the ${ok.map(e=>EDGE_NAME[e]).join(' or ')}.`+RL('SG1.41, C7.11'));
  else{s.fled=turn;endFor(k,s,`The ${s.tag} accelerates off the ${EDGE_NAME[ex]} and disengages with ${w} warp power left. You forced it out of the battle (a forced disengagement scores the enemy 25% of its BPV, S2.2).`,`Your ${s.tag} accelerates off the ${EDGE_NAME[ex]} and disengages with ${w} warp power left. The enemy scores a forced disengagement (25% of your BPV, S2.2).`,'C7.11, C7.53, SG1.41')}});
 sh5End();sh.forEach(s=>{try{critRepair(s)}catch(e){}});
 sh.forEach(s=>{const hs=(s.sph||[]).slice(1).filter(x=>x!==undefined);s.lastSph=s.sph;s.lowPrev=(s.usedChg&&hs.length)?Math.min(...hs):undefined;s.brkSp=s.usedChg?Math.max(0,...(s.sph||[]).slice(25,33).filter(x=>x!==undefined)):undefined});
 sh.forEach(s=>{rpEnd(s);s.rep.forEach((n,k)=>{if(n>0){const g=Math.min(n,missing(s,k));if(g>0){s.sh[k]+=g;LS(`${s.tag} damage control repairs ${g} box${g>1?'es':''} on shield #${k+1} (${s.sh[k]}/${s.d.shields[k]})`+RL('D9.21'),isFoe(s))}}});s.rep=[0,0,0,0,0,0];s.bw=0;s.hetAvail=0;fwTurn(s);s.emCarry=!!s.emOn;s.prev=s.sp;s.gen=0;s.spec=[0,0,0,0,0,0];s.di.forEach(d=>{d.armed=false;d.ovl=false});s.ph.forEach(w=>w.fired=false);s.tu.forEach(t=>t.fired=false);s.di.forEach(d=>d.fired=false)});
 pirEnd();if(over){draw();return}turn++;pirTurn();stopWhy=null;skipOK=false;skipAsk=false;phase='ea';imp=0;stage='mov';
 AIL().forEach(ai=>{if(!ai.merch&&!ai.d.base&&!ai.retreat&&power(ai)<=ai.p0*(level==='easy'?AICFG.concE:level==='hard'?AICFG.concH:AICFG.concN)&&!over){if(pw(ai).warp>=disNeed(ai)&&warp0(ai)>0){ai.retreat=true;L(`The ${ai.tag} is badly hurt and turns away to disengage by acceleration.`+RL('C7.11'))}else{ai.retreat=true;ai.conceded=true;ai.fled=turn;if(optBoom&&ai.d.dbl&&(ai.d.ex||0)>0){ai.sdNext=true;L(`The ${ai.tag} cannot escape and an Orion never surrenders: it will self-destruct at the start of next turn (explosion strength ${ai.d.ex}, nuclear suicide bomb included).`+RL('G15.11, G15.12, D5.2'))}else endFor(1,ai,`The ${ai.tag} is crippled, has too little warp power left to run, and concedes the engagement. You win!`,'','A4.1, simplified')}}});
 reinforce();plan0=autoPlan(sh[0],TG(),'normal',true);L(`Turn ${turn}: allocate your energy.`+RL('B3.1'))}
// [D6.11, D6.123] Roll for sensor lock-on at the start of the turn; no lock doubles range.
function rollLock(s){if(s.out)return;const rt=sensorRate(s);if(rt>=6){s.lock=true;return}const d=d6();s.lock=d<=rt;L(`${s.tag} rolls for sensor lock-on: ${d} against sensor rating ${rt} → ${s.lock?'locked on':'NO lock-on: all its firing ranges are doubled this turn'}.`+RL('D6.11, D6.123'))}
// [B3.0, B3.5, H7.0] Lock in the energy allocation and begin the turn.
function startTurn(){sh5Prep();sg9Turn();if(sabPending()){eaMsg='Choose how to repair the sabotaged warp engines first (SH1.45).';draw();return}if(plan0.sd){plan0=autoPlan(sh[0],TG(),'normal',true);fit(sh[0],plan0);plan0.sd=1}const c=cost(sh[0],plan0);if(c.errors.length){eaMsg='Fix the problems listed in red first.';draw();return}eaMsg='';
 const aiPs=sh.slice(1).map(a=>a.out?null:a.neu?pirPlan(a):aiPlanOpt(a,autoPlan(a,foeOf(a),level)));lockIn(sh[0],plan0);sh.slice(1).forEach((a,k)=>{if(aiPs[k])lockIn(a,aiPs[k])});tracAuction();sh.forEach(rollLock);selfDestructPhase();
 sh.forEach(s=>s.st=turn===1?99:s.st);sh.forEach(edCarry);
 L(`Turn ${turn} begins. You: ${planText(sh[0],plan0)}.`+RL('B3.1, C2.21, D3.3'));if(sh[0].brakeNote)L(sh[0].brakeNote+'.'+RL('C3.5, C3.52'));phase='run';imp=0;stage='mov';zoneTurn();draw()}
