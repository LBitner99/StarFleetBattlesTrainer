/* ================= plasma torpedoes (FP) and cloaking device (G13) ================= */
// [G13.33] Cloak detection range column.
const ckRF=r=>r<=4?0:r<=10?1:r<=15?2:r<=20?3:r<=30?4:r<=40?5:6;
// [G13.33] Cloak detection speed column.
const ckSF=v=>v<=4?0:v<=8?1:v<=12?2:v<=15?3:v<=17?4:v===18?5:6;
// [G13.3, G13.37] Roll on the cloak damage chart: how much of a hit gets through.
function ckChart(foe,by){if(ckFadeB(foe))return{f:1,txt:'fade option (b): no chart, normal EW shifts apply'};const wo=by&&hasRole(by,'weapons')?1:0,c=Math.max(1,d6()-wo),A=absI(imp+1); // [G22.73] a legendary weapons officer takes one off the cloak chart roll when firing direct-fire weapons at a cloaked ship
let v=c,x='';if(foe.ck.mode!=='on'){v=Math.max(1,c+ckPen(foe,A)-5);x=` (+${ckPen(foe,A)} fade, -5)`}
 const f=v<=2?1:v<=4?.5:v<=6?.25:0;return{f,txt:`chart roll ${c}${wo?' (one off, legendary weapons officer, G22.73)':''}${x} gives ${f*100}% damage`}}
const ckNote=foe=>ckOn(foe)?` <b>Target is cloaked</b> (${foe.ck.mode==='on'?(foe.ck.lockBy?'you kept lock-on':'no lock-on: range doubled')+', +5 range':foe.ck.mode==='out'?'fading out, +'+ckPen(foe,absI(imp+1))+' range':'fading in, +'+ckPen(foe,absI(imp+1))+' range'}). ${ckFadeB(foe)?'Fade option (b): no chart, normal EW shifts. [G13.362]':'Every hit is then reduced on the cloak chart: roll 1–2 full damage, 3–4 half, 5–6 quarter (G13.37). ECM is ignored. [G13.30, G13.303]'}`:'';
// [G13.33] Maneuver rate used by the cloak chart.
const mRate=(s,A)=>s.sp+(s.hetAt===A?5:0);
// [G13.33, G13.34] Chance that an enemy keeps lock on a cloaked ship.
function ckP(s){const h=foeOf(s),net=(s.ecm||0)-(h.eccm||0),ew=net>=0?sqrtShift(net):-sqrtShift(-net);return sensorRate(h)-ew-ckRF(dist(s,h))+ckSF(mRate(s,absI(imp+1)))-4}
// [G13.33, G13.34] Roll to hold lock-on to a cloaked ship.
function ckRoll(s,i,first){const h=foeOf(s),k=s.ck,P=ckP(s);
 if(first||(k.lockBy&&P<k.lastP)){const d=d6();k.lockBy=d<=P;k.lastP=P;L(`Impulse ${i}: ${h.tag} tries to keep its lock-on to cloaked ${s.tag}: needs ${P} or less, rolled ${d} → ${k.lockBy?'lock-on kept (the +5 range and the damage chart still apply)':'LOCK-ON LOST: range is doubled and seeking weapons are lost'}.`+RL('G13.331, G13.301'))}
 else if(!k.lockBy&&P-6>k.lastP-6&&P-6>=1){const d=d6();k.lockBy=d<=P-6;k.lastP=P;L(`Impulse ${i}: ${h.tag} tries to re-acquire ${s.tag}: needs ${P-6}, rolled ${d} → ${k.lockBy?'lock-on regained':'still no lock-on'}.`+RL('G13.333'))}}
// [G13.11, G13.14, G13.15] Start fading out or in.
function ckStart(s,mode,i){const k=s.ck;k.mode=mode;k.start=absI(i);k.fadeRev=false;k.fadeOpt=s===sh[0]&&k.pref==='b'?'b':'a';if(k.fadeOpt==='b')L(`  ${s.tag} chooses fade option (b): during this fade enemy fire uses the normal EW shifts instead of the fire adjustment chart.`+RL('G13.36, G13.362'));if(mode==='out'){k.onT=turn;L(`Impulse ${i}: ${s.tag} activates its cloaking device. It fades out over 5 impulses (range penalty +1 each impulse) and cannot fire or launch from now on.`+RL('G13.11, G13.14, G13.51'))}else{k.offT=turn;L(`Impulse ${i}: ${s.tag} switches its cloaking device off. It fades in over 5 impulses and cannot fire until that is done.`+RL('G13.15'))}}
// [G13.1] Cloaking device stage of each impulse.
function ckStage(i){const A=absI(i);if(optHide&&(i===8||i===24))sh.slice(1).forEach(f=>{if(!f.out&&ckHid(f)){const a=rel(sh[0],f),n=a===null?'your own hex':'the '+['RF','R','RR','LR','L','LF'][Math.floor(a/60)%6]+' arc';L(`Impulse ${i}: observation of the hidden cloaked ${f.tag}: it is in ${n}, true range ${dist(sh[0],f)}.`+RL('G13.612'))}});sh.forEach(s=>{const k=s.ck;
 if(k.mode==='out'&&A-k.start>=5){k.mode='on';L(`Impulse ${i}: ${s.tag}'s cloak is fully active.`+RL('G13.14'));ckRoll(s,i,true)}
 else if(k.mode==='in'&&A-k.start>=5){k.mode='off';L(`Impulse ${i}: ${s.tag} has finished fading in. It can use fire control again.`+RL('G13.15'))}
 else if(k.mode==='on'){if(optWeb&&webStrAt(s.c,s.r)>=1){if(!k.lockBy||!k.inWeb)L(`Impulse ${i}: cloaked ${s.tag} is in a web hex and can be locked onto.`+RL('G13.45'));k.inWeb=true;k.lockBy=true;k.vd=false}else{k.inWeb=false;if(k.vd){k.vd=false;ckRoll(s,i,true)}else ckRoll(s,i,false)}} // [G13.401, G13.402] a voided cloak: the enemy rolls to retain the lock-on at the next lock-on stage
 if(s!==sh[0]&&s.ckPaid&&!s.ckDead&&k.mode==='off'&&k.onT!==turn&&!s.conceded)ckStart(s,'out',i)})}
// [G13.118, G13.161] Involuntary deactivation: the cloak effect is lost at once and fade-in begins on the next Cloak Stage.
function ckLose(s,i,why,rule){const k=s.ck;if(!k||(k.mode!=='on'&&k.mode!=='out'))return;k.mode='in';k.start=absI(i);k.fadeRev=true;k.offT=turn;k.lockBy=true;k.vd=false;L(`${s.tag}'s cloak is lost: ${why}. The cloaked effect ends immediately and fade-in begins at the next Cloak Stage; it cannot reverse the fade.`+RL(rule+', G13.118'))}
// [G13.4, G13.40, G13.401] A voided cloak: the ship can be locked onto at once (the +5 range and the chart stay); the enemy rolls to retain the lock-on at the next lock-on stage. Only a fully active cloak without a lock-on is affected.
function ckVoid(s,why,rule){const k=s.ck;if(!k||k.mode!=='on'||k.lockBy)return;k.lockBy=true;k.vd=true;L(`${s.tag}'s cloak is voided: ${why}. It can be locked onto, and the enemy rolls to keep that lock-on at the next lock-on stage.`+RL(rule+', G13.4, G13.401'))}
// [G13.115] Reverse a fade: the ship fades back the same number of impulses it had already faded; it counts as the turn's only fade-in and fade-out, and that fade cannot be reversed again.
function ckReverse(){const s=sh[0],k=s.ck,i=imp+1,A=absI(i);if(!s.d.clk||k.fadeRev||(k.mode!=='out'&&k.mode!=='in'))return;
 const prev=ckPen(s,A-1);if(k.mode==='in'){k.mode='out';k.start=A-prev;L(`Impulse ${i}: ${s.tag} reverses its fade-in and fades out again; it will be fully cloaked on impulse ${((k.start+5-1)%32)+1}.`+RL('G13.115'))}
 else{k.mode='in';k.start=A-6+prev;L(`Impulse ${i}: ${s.tag} reverses its fade-out and fades back in; the fade-in will be complete on impulse ${((k.start+5-1)%32)+1}.`+RL('G13.115'))}
 k.fadeRev=true;k.onT=k.offT=turn;draw()}
function ckToggle(){const s=sh[0],k=s.ck,i=imp+1;if(k.mode==='off'&&s.ckPaid&&k.onT!==turn)ckStart(s,'out',i);else if(k.mode==='on'&&k.offT!==turn)ckStart(s,'in',i);draw()}
// [FP1.0, FP2.0, FP4.2, C10.511] Why a plasma torpedo cannot be launched right now.
function plWhy(s,i,t,fake,foe0){const foe=foe0||foeOf(s);if(s.emOn)return'Erratic maneuvering: no plasma launches (C10.511)';
 if(!t.alive)return'Destroyed';if(!mannedW(s,t))return'Undermanned: no crew unit free to operate it (G9.422)';if(fake){if(t.pptUsed)return'This launcher has already used its pseudo-plasma torpedo (FP6.21)';if(t.fi===absI(i))return'A real torpedo left this launcher this impulse (FP6.22)'}else{if(t.fired)return'Launched this turn';{const o=s.pl.find(u=>u!==t&&u.fi===absI(i));if(o&&(t.sg||o.sgFi===absI(i)))return'A plasma launcher cannot fire in the same impulse as a shotgun (FP7.23)'}if(!t.rdy)return t.st<3?'Not fully armed ('+t.st+' of 3 turns)':'Not ready'}
 if(!fcOk(s))return ckOn(s)?'Cloaked (G13.512)':'No active fire control (FP4.1)';if(s.lock===false)return'No lock-on (FP4.1)';
 if(absI(i)<=s.noFire)return'Post-breakdown: no weapons (C6.5471)';
 if(ckOn(foe)&&foe.ck.mode==='on'&&!foe.ck.lockBy)return'No lock-on to the cloaked ship (G13.311)';
 if(dist(s,foe)===0)return'Same hex (FP1.33, not simplified here)';if(effRange(s,foe)>35)return'Target beyond 35 hexes (F3.31)';
 const a=rel(s,foe);if(!t.arcs.some(x=>inTok(x,a)))return'Target not in the launch arc (FP1.312)';return''}
const plList=(s,i)=>s.pl.map((_,k)=>k).filter(k=>!plWhy(s,i,s.pl[k]));
// [FP1.0, FP2.0, FP4.0] Launch a plasma torpedo (or a pseudo-plasma, FP6.0).
function launchPl(s,k,i,fake){if(s.qh)qReveal(s,'launches a plasma torpedo');const t=s.pl[k],foe=foeOf(s);{const w=monSeekWhy(s,foe);if(w){L(w+RL('SM3.48, SM3.491, SM1.46'));return}}if(fake){t.pptUsed=true;t.fi=absI(i)}else{t.rdy=false;t.fired=true;t.st=0;t.fi=absI(i)}const efT=plEff(t);if(!fake){t.A=undefined;t.noHold=false}
 const d={id:++drN,dr:true,pl:true,T:efT,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f:s.f,st:0,spd:32,exp:absI(i)+32,born:absI(i),hetT:-99,mv:-1,ecm:0,trav:0,dmg:0,ept:fake?false:!!t.ept,fake:!!fake};if(!fake)t.ept=false;DR.push(d);
 L(`Impulse ${i}: ${s.tag} launches ${d.fake?'a pseudo-plasma torpedo (a fake: it will do no damage) simulating ':d.ept?'an enveloping ':''}${efT!==t.T&&!fake?'a plasma-'+efT+' from ':''}${t.name} (#${d.id}) at ${foe.tag}, range ${dist(s,foe)}. Warhead ${plStr(d)} now, falling as it travels; it moves 32 hexes a turn, steers itself and lasts 32 impulses.`+RL(d.fake?'FP6.1, FP6.12, FP6.21, FP6.3':d.ept?'FP5.1, FP5.21, FP1.31, FP1.4':'FP1.31, FP1.32, FP1.312, FP1.4'))}
// [FP2.0, FP4.0] Computer plasma torpedo decisions.
function aiPlasma(s,i){if(s.conceded||!s.pl.length)return;const foe=foeOf(s),r=dist(s,foe),late=(i>=26);
 s.pl.forEach((t,k)=>{if(plWhy(s,i,t))return;const lim=({R:level==='hard'?14:10,S:level==='hard'?11:8,G:level==='hard'?9:7,F:level==='hard'?6:5})[t.T]+(level==='easy'?-2:0);
  if(r<=lim||(late&&PLA[t.T].h===null&&r<=22))launchPl(s,k,i)})}
function plUI(me,i){if(!me.pl.length)return'';let b='',why=[];const foe=foeOf(me);
 me.pl.forEach((t,k)=>{const w=plWhy(me,i,t);if(!t.alive)return;if(w&&t.rdy)why.push(t.name+': '+w);const row=PLA[plEff(t)].t;b+=plResBtns(me,k,t);
  if(optPPT){const wf=plWhy(me,i,t,true);b+=`<button ${wf?'disabled':''} title="${wf}" onclick="doLaunchPl(${k},1)">Launch pseudo-plasma ${t.T} (fake, free, one per game)</button>`}
  if(t.sg&&(t.rdy||t.st===3)){const tg=sgTargets(me,i,t);b+=`<button ${tg.length?'':'disabled'} onclick="doShotgun(${k})">Fire ${t.name} as a shotgun: ${Math.min(SGN[plEff(t)],tg.length)} type-F at ${tg.map(x=>x.tag).join(', ')||'no target'}</button>`}else if(t.rdy||t.st===3)b+=`<button ${w?'disabled':''} title="${w}" onclick="doLaunchPl(${k})">Launch ${t.name} (warhead ${row[0]} out to range 5, ${row[1]} to 10, ${row[4]} to 15)</button>`});
 return b?`<div class="mu" style="margin:6px 0">Plasma torpedoes steer themselves, travel 32 hexes a turn and get weaker the farther they go. Only phasers can shoot them down (FP1.61).</div><div class="row">${b}</div>${why.length?`<p class="mu" style="margin:2px 0">${why.join('. ')}.</p>`:''}`:''}
const SGN={R:5,S:3,G:2}; // [FP7.1] type-Fs produced by a shotgun: R 5, S 3, G 2
function sgTargets(s,i,t){const foes=sh.filter(x=>!x.out&&x.tm!==s.tm);return foes.filter(f=>!plWhy(s,i,t,false,f))}
function launchShotgun(s,k,i){const t=s.pl[k],tg=sgTargets(s,i,t),n=Math.min(SGN[plEff(t)]||0,tg.length);if(!n)return;const sgn=SGN[plEff(t)];t.A=undefined;t.rdy=false;t.fired=true;t.st=0;t.fi=absI(i);t.sgFi=absI(i);t.sg=false;const ids=[];
 tg.slice(0,n).forEach(foe=>{const d={id:++drN,dr:true,pl:true,T:'F',own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f:s.f,st:0,spd:32,exp:absI(i)+32,born:absI(i),hetT:-99,mv:-1,ecm:0,trav:0,dmg:0,ept:false,fake:false};DR.push(d);ids.push(`#${d.id} at ${foe.tag}`)});
 L(`Impulse ${i}: ${s.tag} fires its ${t.name} as a plasma shotgun: ${n} type-F torpedoes (${ids.join(', ')})${sgn>n?`; the other ${sgn-n} have no separate target and are removed`:''}.`+RL('FP7.1, FP7.21, FP7.22, FP7.44'))} // [FP7.21, FP7.22] all type-Fs leave on one impulse, each at its own target in the launch arc; spare ones are removed
function doShotgun(k){launchShotgun(sh[0],k,imp+1);draw()}
// [FP1.93, FP1.96, FP1.961, FP1.963, FP1.964] Reserve-power plasma options (human, option optPF): buttons shown beside the launcher in the fire step.
function plUpTargets(t){const e=plEff(t);if(!optPF||!t.alive||t.fired||e==='F'||t.sg||t.ept||!(t.n3||(t.hl&&t.st===3)))return[];return['G','S','R'].filter(x=>PRK[x]>PRK[e]&&PRK[x]<=PRK[t.T])}
function plResBtns(me,k,t){if(!optPF||!t.alive||t.fired)return'';let b='';
 plUpTargets(t).forEach(x=>{const c=PLA[x].c[2]-PLA[plEff(t)].c[2];b+=`<button ${me.bw<c?'disabled':''} onclick="doPlUp(${k},'${x}')">${t.name}: raise to type-${x} with ${c} reserve warp (FP1.96${t.hl&&!t.n3?', cannot be held again, FP1.961':''})</button>`});
 if(t.n2&&t.st===2&&t.T!=='F'&&plEff(t)!=='F')b+=`<button ${me.bw<2?'disabled':''} onclick="doPlAcc(${k})">${t.name}: accelerated arming, 2 reserve warp makes a type-F that is launched at once (FP1.93)</button>`;
 if(t.n1&&t.st===1&&t.A==='F'&&t.T!=='F')['G','S','R'].filter(x=>PRK[x]<=PRK[t.T]).forEach(x=>{b+=`<button ${me.bw<1?'disabled':''} onclick="doPlCommit(${k},'${x}')">${t.name}: add 1 reserve warp to commit to a type-${x} (FP1.963)</button>`});
 if(t.rolled&&t.st===2&&!t.rdy)b+=`<button ${me.bw<t.rdD?'disabled':''} onclick="doPlRd(${k})">${t.name}: finish the rolling-delay torpedo with ${t.rdD} reserve warp; it must be launched at once (FP1.222)</button>`;
 return b}
function doPlUp(k,x){const s=sh[0],t=s.pl[k];if(!plUpTargets(t).includes(x))return;const c=PLA[x].c[2]-PLA[plEff(t)].c[2];if(s.bw<c)return;s.bw-=c;s.bat-=c;const was=plEff(t);t.A=x!==t.T?x:undefined;if(!t.n3)t.noHold=true;
 L(`${s.tag} spends ${c} reserve warp point${c>1?'s':''} to raise ${t.name} from a type-${was} to a type-${x}${t.n3?'':'; it must be fired this turn'}.`+RL(t.n3?'FP1.96':'FP1.961, FP1.964'));draw()}
function doPlAcc(k){const s=sh[0],t=s.pl[k];if(!(t.n2&&t.st===2)||s.bw<2)return;const i=imp+1,old=[t.A,t.st,t.rdy];t.A='F';t.st=3;t.rdy=true;const w=plWhy(s,i,t);if(w){t.A=old[0];t.st=old[1];t.rdy=old[2];L(`${s.tag} cannot use accelerated arming on ${t.name}: ${w}. The torpedo must be launched the moment it is armed.`+RL('FP1.93'));draw();return}
 s.bw-=2;s.bat-=2;L(`Impulse ${i>32?32:i}: ${s.tag} spends 2 reserve warp points on accelerated arming of ${t.name}, which becomes a type-F and is launched at once.`+RL('FP1.93'));launchPl(s,k,i);draw()}
function doPlRd(k){const s=sh[0],t=s.pl[k];if(!(t.rolled&&t.st===2)||s.bw<t.rdD)return;const i=imp+1,old=[t.st,t.rdy];t.st=3;t.rdy=true;const w=plWhy(s,i,t);if(w){t.st=old[0];t.rdy=old[1];L(`${s.tag} cannot finish ${t.name} with reserve power: ${w}. A torpedo finished that way must be fired before the end of the turn.`+RL('FP1.222'));draw();return}
 s.bw-=t.rdD;s.bat-=t.rdD;t.rolled=false;L(`Impulse ${i>32?32:i}: ${s.tag} spends ${t.rdD} reserve warp point${t.rdD>1?'s':''} to complete the rolling-delay ${t.name} and launches it at once.`+RL('FP1.221, FP1.222'));launchPl(s,k,i);draw()}
function doPlCommit(k,x){const s=sh[0],t=s.pl[k];if(!(t.n1&&t.st===1&&t.A==='F')||s.bw<1||PRK[x]>PRK[t.T])return;s.bw-=1;s.bat-=1;t.A=x!==t.T?x:undefined;t.n1=false;L(`${s.tag} adds 1 reserve warp point to the first-turn energy of ${t.name}: it is now committed to a type-${x} (three turns) and can no longer finish as an F.`+RL('FP1.963'));draw()}
function doLaunchPl(k,fake){launchPl(sh[0],k,imp+1,fake);draw()}
