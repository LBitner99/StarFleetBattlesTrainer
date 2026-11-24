/* ===== Wild weasels (J3.0, Advanced): optional, off by default (optWW) =====
   An administrative shuttle (J2) is charged with one energy on each of two turns (J3.12), then launched on a straight course (J3.11). While it works, every seeking
   weapon aimed at the launching ship follows the weasel instead (J3.20), the ship gets six free ECM (J3.23), and the ship is restricted: speed at most 4 (J3.131),
   no active fire control, so no weapons, no ECCM, no control of seeking weapons (J3.132, J3.43). Seeking weapons that hit the weasel hurt every unit in its hex
   (collateral damage, J3.3). A destroyed weasel keeps its effect for an explosion period of four impulses (J3.211) and then until the weapons aimed at it are gone (J3.212).
   How voiding works here: the rule says certain actions void the weasel. The game applies a plan that does one of them (active fire control, speed above 4, transporters, probes) as
   a voiding at the start of the turn, voids it at once if it is more than 35 hexes from its ship (J3.42), and offers a button to void it on purpose. Firing and launching seeking
   weapons already need active fire control, which the weasel rules switch off.
   Not built (backlog): charging with reserve power (J3.122), substituting a tug pod (J3.14), pre-set courses with turns (J3.111: the weasel flies straight), sublight shuttles (J3.15),
   stasis (J3.5), mines, ESGs and webs (J3.26, J3.44, J3.451, J3.46), recovery of a voided weasel (J3.222, needs tractor landing), type-VI drone details (they ignore weasels, J3.20),
   boarding parties on a weasel (D7.61), scouts (G24.16), planets blocking the voiding action (J3.404). */
let optWW=false,WWX=[]; // WWX: destroyed weasels still on the map (they attract weapons but cannot be shot)
const wwLive=s=>!!(s&&s.ww&&(s.ww.st==='active'||s.ww.st==='expl'||s.ww.st==='post'));
const wwBenefit=s=>!!(s&&s.ww&&(s.ww.st==='active'||s.ww.st==='expl')); // [J3.23, J3.232] six ECM while the weasel works and through the explosion period
function wwInit(){WWX=[];sh.forEach(s=>{s.ww=null;s.wwA=null;s.wwGo=-1})}
// [J3.31] Collateral damage chart: damage points scored on the weasel -> damage on other units in its hex.
function wwChart(n){return n>=96?10:n>=76?9:n>=56?8:n>=41?7:n>=29?6:n>=19?5:n>=11?4:n>=7?3:n>=5?2:n>=3?1:0}
// [J3.12] The plan's charge: one energy on each of two consecutive turns.
function wwCheck(s,p,e){if(!optWW||!shCap(s)||!p.ww){p.ww=0;return 0}
 if(!s.shb.length||(s.sys.Shuttle||0)<=0){e.push('There is no shuttle aboard to charge as a wild weasel (J3.12)');return 0}return 1}
function wwStart(s,p){if(!optWW||!shCap(s))return;const A=s.wwA;
 if(p.ww){if(!A||A.last!==turn-1){s.wwA={t:1,last:turn,ready:false};LS(`${s.tag} begins charging a wild weasel: turn 1 of 2.`+RL('J3.12'),isFoe(s))}
  else{A.t++;A.last=turn;if(A.t>=2&&!A.ready){A.ready=true;LS(`${s.tag}'s wild weasel is charged and can launch this turn. Keeping it charged costs one energy a turn.`+RL('J3.12, J3.121'),isFoe(s))}}}
 else if(A){LS(`${s.tag} does not supply its wild weasel: the charge is lost and the shuttle can launch normally.`+RL('J3.121'),isFoe(s));s.wwA=null}
 if(wwLive(s)){const W=s.ww,why=[];if(p.fc&&W.st!=='expl')why.push('active fire control');if(p.spd>4)why.push('a speed above 4');if((p.trn|0)>0)why.push('transporters');if((p.prb||[]).some(Boolean))why.push('a probe');
  if(why.length)wwVoid(s,'the plan uses '+why.join(' and ')+' (J3.401, J3.131, J3.453, J3.454)')}}
function wwVoid(s,why){const W=s.ww;if(!W)return;const u=W.u;W.st='void';
 DR.forEach(d=>{if(d.tgt===u){d.tgt=d.wwFrom||s;d.wwFrom=null}});
 if(u.dead){WWX=WWX.filter(x=>x!==u)}else{u.void=true}
 s.ww=null;L(`${s.tag}'s wild weasel is voided: ${why}. All weapons that followed it return to ${s.tag}${u.dead?'':'; the shuttle flies on its course until it is destroyed'}.`+RL('J3.22, J3.40'))}
function wwWhy(s,i){const A=absI(i);if(!optWW||!shCap(s))return'Wild weasels are off, or this ship has no shuttles';if(!s.wwA||!s.wwA.ready)return'No weasel is charged: allocate 1 energy on each of two turns (J3.12)';
 if(s.out||s.boom)return'The ship is gone';if((s.sys.Shuttle||0)<=0)return'The shuttle bay is destroyed (J1.41)';if(hasCrit(s,'shl'))return'Shuttle launch controls are jammed (D8.24)';
 if(A-s.shLast<2)return'The bay launched or landed a shuttle in the last two impulses (J1.50)';if(s.shb.findIndex(f=>shReady(f,A))<0)return'No shuttle is ready (J1.52)';
 if(fcOk(s))return'Active fire control must be off this turn: untick it in Energy Allocation (J3.132, J3.401)';if(spdOf(s)>4)return'The ship is moving faster than 4 hexes a turn (J3.131)';
 if(LNK&&(LNK.by===s||LNK.on===s))return'Release the tractor beam first (J3.452)';if(s.emOn)return'Erratic maneuvering: no weasel (J3.112)';return''}
function wwLaunch(s,i,dir,spd){const A=absI(i);let k=-1;s.shb.forEach((f,x)=>{if(shReady(f,A)&&(k<0||f.hp>s.shb[k].hp))k=x});const f=s.shb.splice(k,1)[0];s.shLast=A;s.wwA=null;
 if(wwLive(s))wwVoid(s,'a second weasel is launched (J3.116)');
 const u={id:++drN,dr:true,ft:true,shu:true,ww:true,own:s,tgt:foeOf(s),tag:'wild weasel #'+drN,c:s.c,r:s.r,pc:s.c,pr:s.r,f:dir,st:0,hp:f.hp,mhp:SHU.hp,spd:Math.max(1,Math.min(SHU.spd,spd||SHU.spd)),born:A,hetT:-99,mv:-1,ecm:0,drn:0,fT:99999,lastDr:-99,tmT:-99,l0:{c:s.c,r:s.r}};
 DR.push(u);const W={u,st:'active',from:s,l:A,turn,acc:0};u.wwOf=W;s.ww=W;
 let n=0;DR.forEach(d=>{if(d.tgt===s&&!d.ft&&!d.vi&&d.own!==s){d.tgt=u;d.wwFrom=s;n++}});
 L(`Impulse ${i}: ${s.tag} launches a wild weasel (shuttle #${u.id}) heading ${FL[dir]} at speed ${u.spd}. ${n} seeking weapon${n===1?'':'s'} now follow${n===1?'s':''} it. ${s.tag} gets 6 ECM free and may not use active fire control, ECCM or a speed above 4 while it works.`+RL('J3.11, J3.20, J3.23, J3.13, J3.17'))}
// Each impulse (before drones move): the weasel flies straight, the 35-hex limit, the explosion period, and new weapons aimed at a protected ship follow the weasel.
function wwStep(i){if(!optWW)return;const A=absI(i);
 DR.filter(d=>d.ww&&d.born<A).forEach(u=>{if(moves(u.spd,i)){const[nc,nr]=NB(u.c,u.r,u.f);if(nc>=1&&nc<=COLS&&nr>=1&&nr<=ROWS){u.pc=u.c;u.pr=u.r;u.c=nc;u.r=nr;u.mv=A}}});
 sh.forEach(s=>{const W=s.ww;if(!W)return;const u=W.u;
  if(dist(s,u)>35){wwVoid(s,'it is more than 35 hexes from its ship (J3.42)');return}
  if(W.st==='expl'&&A>W.dAt+4){W.st='post';L(`${s.tag}'s destroyed wild weasel is now a pocket of ionised radiation: weapons already following it keep going, new weapons ignore it, and its ECM is gone.`+RL('J3.212'))}
  if(W.st==='post'&&!DR.some(d=>d.tgt===u)){s.ww=null;WWX=WWX.filter(x=>x!==u);L(`${s.tag}'s wild weasel has no weapons left following it and is gone.`+RL('J3.212'));return}
  if(W.st==='active'||W.st==='expl')DR.forEach(d=>{if(d.tgt===s&&!d.ft&&!d.vi&&d.own!==s&&d.born<A){d.tgt=u;d.wwFrom=s}})})}
// [J3.21] The weasel is destroyed by direct fire or by seeking weapons: it stops, and its explosion period begins.
function wwDestroyed(u,how){const W=u.wwOf,s=u.own;if(!W||u.dead)return;u.dead=true;rmDr(u);WWX.push(u);W.st='expl';W.dAt=absI(imp+1);
 L(`Wild weasel #${u.id} of ${s.tag} is destroyed (${how}). It stops where it is. For the next four impulses it still draws seeking weapons and gives ${s.tag} its 6 ECM.`+RL('J3.21, J3.211, J3.2111'))}
function wwHitDirect(d,n){d.hp-=n;if(d.hp<=0){wwDestroyed(d,'by direct fire');return}
 if(!d.crip&&d.hp<=SHU.hp-SHU.cr){d.crip=true;d.spd=Math.ceil(d.spd/2)}L(`Wild weasel #${d.id} of ${d.own.tag} takes ${n} damage: ${d.hp} of ${SHU.hp} points left${d.crip?' (crippled: slower, but it still works, J3.115)':''}.`+RL('J3.115, J2.14'))}
// [J3.30] Seeking weapons arriving at a weasel: they are used up, add their strength to the impulse's volley.
const WWQ=[];
function wwStrike(d,t,i){const wh=d.pl?plStr(d):(d.wh||0);WWQ.push({t,wh,d});L(`Impulse ${i}: ${d.pl?'plasma torpedo':d.ss?'suicide shuttle':'drone'} #${d.id} of ${d.own.tag} reaches wild weasel #${t.id} (${t.dead?'destroyed':'working'}) and goes off for ${wh}.`+RL('J3.30, J3.21'))}
function wwEnd(i){if(!WWQ.length)return;const by=new Map();WWQ.splice(0).forEach(q=>{by.set(q.t,(by.get(q.t)||0)+q.wh)});
 by.forEach((tot,u)=>{const W=u.wwOf,s=u.own;if(W)W.acc=(W.acc||0)+tot;
  if(!u.dead){u.hp-=tot;if(u.hp<=0)wwDestroyed(u,`by ${tot} damage from seeking weapons`);else if(!u.crip&&u.hp<=SHU.hp-SHU.cr){u.crip=true;u.spd=Math.ceil(u.spd/2)}}
  const cd=wwChart(tot);if(cd<=0){L(`Wild weasel #${u.id} took ${tot}: collateral damage is 0 (1 to 2 points on the weasel does none).`+RL('J3.31'));return}
  const units=sh.filter(x=>!x.out&&!x.boom&&x.c===u.c&&x.r===u.r);
  if(!units.length){L(`Collateral damage of ${cd} (from ${tot} on the weasel) hits nothing: no unit is in its hex.`+RL('J3.30, J3.31'));return}
  units.forEach(x=>{let k;const inLaunchHex=x===s&&u.l0&&u.l0.c===u.c&&u.l0.r===u.r;
   if(inLaunchHex){const[nc,nr]=NB(x.c,x.r,u.f);k=shieldFor(x,{c:nc,r:nr}).k}else k=d6()-1;
   applyVolley(x,k,cd,{c:u.c,r:u.r},'',`Collateral damage from wild weasel #${u.id} (${tot} points on it): ${cd} damage on ${x.tag} shield #${k+1}.`,'J3.30, J3.303, J3.31')});
  DR.filter(z=>z.ft&&!z.ww&&z.c===u.c&&z.r===u.r).forEach(z=>ftHit(z,cd))})}
// Map marks for destroyed weasels (the live ones are drawn as shuttles).
function wwMarks(){return WWX.map(u=>{const x=cx(u.c),y=cy(u.c,u.r),col=u.own.col;return `<g transform="translate(${x+11} ${y+11})"><circle r="9" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="3 3"/><text y="4" font-size="11" font-weight="800" text-anchor="middle" fill="${col}">×</text></g><text x="${x+11}" y="${y+30}" font-size="10" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">W${u.id}</text>`}).join('')}
// Human controls.
let wwDir=0,wwSpd=6;
function wwDo(){const s=sh[0];if(wwWhy(s,imp+1))return;wwLaunch(s,imp+1,wwDir,wwSpd);draw()}
function wwVoidBtn(){const s=sh[0];if(wwLive(s)){wwVoid(s,'you void it on purpose');draw()}}
function wwCard(s){if(!optWW)return'';const w=wwWhy(s,imp+1),W=s.ww,A=s.wwA;
 const st=wwLive(s)?`Weasel ${W.st==='active'?'working':W.st==='expl'?'destroyed, explosion period':'destroyed, post-explosion'}`:A?(A.ready?'Weasel charged':'Weasel charging, turn '+A.t+' of 2'):'No weasel charged';
 return `<p style="margin:6px 0 2px"><b>Wild weasel (J3, Advanced)</b></p><span class="chip">${st}</span><div class="row"><select onchange="wwDir=+this.value">${['A','B','C','D','E','F'].map((n,k)=>`<option value="${k}" ${k===wwDir?'selected':''}>Course ${n}</option>`).join('')}</select><select onchange="wwSpd=+this.value">${[1,2,3,4,5,6].map(v=>`<option value="${v}" ${v===wwSpd?'selected':''}>Speed ${v}</option>`).join('')}</select><button ${w?'disabled':''} onclick="wwDo()">Launch the weasel</button><button ${wwLive(s)?'':'disabled'} onclick="wwVoidBtn()">Void it</button></div>${w&&(A||wwLive(s))?`<p class="mu" style="margin:2px 0">${w}.</p>`:''}${wwLive(s)?`<p class="mu" style="margin:2px 0">While it works: speed 4 at most, no active fire control (so no weapons, ECCM or control of seeking weapons), 6 free ECM. A plan with fire control, speed above 4, transporters or a probe voids it at the start of the turn (J3.13, J3.4).</p>`:''}`}
function wwRow(s,p){if(!optWW||!shCap(s)||(!s.shb.length&&!s.wwA))return'';const A=s.wwA,live=wwLive(s);
 const st=live?'A weasel is out. Keeping the plan inside its limits (no fire control, speed 4 or less, no transporters or probes) keeps it working (J3.13).':A&&A.ready?'Charged. Supply 1 energy to keep it charged (J3.121); launch it from the Shuttles box during the turn.':A?'Charging: turn 1 of 2 done. Pay 1 energy again to finish (J3.12).':'1 energy on each of two turns charges one shuttle as a wild weasel (J3.12). Launching it needs active fire control off, speed 4 or less and no tractor beams.';
 return`<tr><td class="l">Wild weasel charge<br><small>${st}</small></td><td><label><input type="checkbox" ${p.ww?'checked':''} onchange="setWw(this.checked)"> charge a shuttle (1 energy)</label></td><td>${p.ww?1:0}</td></tr>`}
function setWw(v){plan0.ww=v?1:0;eaMsg='';draw()}
// Computer: charges a weasel when the enemy has seeking weapons and a shuttle is spare; flies a slow, fire-control-off turn and launches when two or more seeking weapons are coming.
function aiWW(s,p,foe){if(!AIO||!optWW||!shCap(s)||s.conceded||level==='easy')return;
 const thr=DR.filter(d=>d.tgt===s&&!d.ft&&!d.vi&&d.own!==s&&dist(d,s)<=24).length,W=s.ww;
 if(wwLive(s)){const out=DR.some(d=>d.tgt===W.u);if(W.st==='post'||out||turn-W.turn<2){p.fc=0;p.eccm=0;p.spd=Math.min(p.spd,4);fit(s,p)}return}
 const spare=s.shb.length-(s.ssA?1:0);
 if(s.wwA&&s.wwA.ready&&thr>=2){p.fc=0;p.eccm=0;p.spd=Math.min(p.spd,4);p.ww=1;s.wwGo=turn;fit(s,p);if(cost(s,p).errors.length)p.ww=0;return}
 if(spare>=1&&(foe.rk.length||foe.pl.length)){const q=JSON.parse(JSON.stringify(p));q.ww=1;for(let g=0;g<3&&cost(s,q).errors.length;g++){if(q.gen>0)q.gen--;else if(q.ph>0)q.ph--;else if(q.ecm>0)q.ecm--;else break}if(!cost(s,q).errors.length)Object.assign(p,q)}} // one energy a turn is worth a little reinforcement
function wwAi(s,i){if(!AIO||!optWW||s===sh[0]||s.wwGo!==turn||!s.wwA||!s.wwA.ready||wwLive(s)||wwWhy(s,i))return false;const foe=foeOf(s);if(!foe)return false;wwLaunch(s,i,(bestFacing(s,foe)+2)%6,SHU.spd);s.wwGo=-1;return true}
