/* ===== Shuttles (J1.0 general rules, J2.0 administrative shuttles): standard (unmarked) rules, on by default (optShut) =====
   Every shuttle box on the SSD holds one administrative shuttle (J1.41, J2.1). A shuttle is a unit in DR flagged ft (so ships shoot it with the normal
   direct-fire code, like a fighter) and shu. Two uses are built: a combat shuttle with its Ph-3 (J2.13, J2.213) and the suicide shuttle (J2.22).
   Not built (backlog): landing by tractor beam (J1.62), enemy landings and capture (J1.63), overcrowding and crash landing (J1.64, J1.65), warp booster
   packs (J5), wild weasels (J3, Advanced), scatter packs, cargo (J2.214), monster information from shuttles (J2.212), shuttles left behind on disengagement
   (J1.7), Tholian web effects on shuttles (J2.229). The computer flies your combat shuttles for you, like fighters; you launch and recall them. */
let optShut=true;
const SHU={spd:6,hp:6,cr:4,wmin:6,wmax:18}; // [J2.11, J2.14] speed 6; destroyed by 6 damage points, crippled by 4; [J2.2211] suicide warhead 6 to 18
const shOK=s=>optShut&&s&&!s.dr&&!s.d.sb&&!s.sh5&&SHIPS[s.key]&&!SHIPS[s.key].ftr&&(s.d.sys.Shuttle||0)>0;
const shOne=s=>{s.shb=shOK(s)?Array.from({length:s.d.sys.Shuttle},()=>({hp:SHU.hp,l:-1,la:-99})):[];s.shLast=-99;s.shRec=false;s.ssA=null};
const shCap=s=>{const ok=shOK(s);if(ok&&!s.shb)shOne(s);return ok}; // ships added after the start (reinforcements) get their shuttles on first use
function shInit(){sh.forEach(shOne);if(typeof wwInit==='function')wwInit()}
const shOut=s=>DR.filter(d=>d.shu&&!d.ww&&d.own===s);
const shReady=(f,A)=>!f.cap&&f.l!==turn&&A-f.la>=8; // [J1.52] a landed shuttle waits a quarter turn; one launch a turn is not required for admin shuttles, but a shuttle that landed this turn stays aboard
const shWarhead=A=>Math.max(SHU.wmin,Math.min(SHU.wmax,2*A.E)); // [J2.2211] two times the energy applied
// [J1.50, J1.34, J2.221] Why this ship cannot launch a shuttle now ('' when it can). ss: a suicide shuttle.
function shWhy(s,i,ss){const A=absI(i);if(!shCap(s)||!s.shb||!s.shb.length)return'No shuttles aboard';if(s.out||s.boom)return'The ship is gone';if((s.sys.Shuttle||0)<=0)return'The shuttle bay is destroyed (J1.41)';if(hasCrit(s,'shl'))return'Shuttle launch controls are jammed (D8.24)';
 if(A-s.shLast<2)return'The bay launched or landed a shuttle in the last two impulses (J1.50)';
 if(s.shb.findIndex(f=>shReady(f,A))<0)return'No shuttle is ready: one that landed this turn, or in the last quarter turn, cannot launch yet (J1.52)';
 if(!foeOf(s))return'No enemy';
 if(ss){if(!s.ssA||!s.ssA.ready)return'No suicide shuttle is armed: arming takes three turns of warp energy (J2.2211)';if(ctrlN(s)>=ctlMax(s))return'No free control channel: a suicide shuttle counts as a seeking weapon (J2.22, F3.2)'}
 return''}
function shLaunch(s,i,ss){const A=absI(i),foe=foeOf(s);let k=-1;s.shb.forEach((f,x)=>{if(shReady(f,A)&&(k<0||f.hp>s.shb[k].hp))k=x});const f=s.shb.splice(k,1)[0];s.shLast=A;
 if(ss){const w=shWarhead(s.ssA);DR.push({id:++drN,dr:true,ss:true,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f:bestFacing(s,foe),st:0,hp:SHU.hp,wh:w,spd:SHU.spd,exp:A+99999,born:A,hetT:-99,mv:-1,ecm:0});s.ssA=null;
  LS(`Impulse ${i}: ${s.tag} launches a suicide shuttle (#${drN}) at ${foe.tag}, range ${dist(s,foe)}. Warhead ${w}, speed ${SHU.spd}. It is a seeking weapon and explodes when it enters its target's hex.`+RL('J2.22, J2.221, J2.223'),isFoe(s));return}
 const cr=f.hp<=SHU.hp-SHU.cr;
 DR.push({id:++drN,dr:true,ft:true,shu:true,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f:bestFacing(s,foe),st:0,hp:f.hp,mhp:SHU.hp,crip:cr,spd:cr?Math.ceil(SHU.spd/2):SHU.spd,born:A,hetT:-99,mv:-1,ecm:0,drn:0,fT:-1,lastDr:-99,tmT:-99});
 L(`Impulse ${i}: ${s.tag} launches administrative shuttle #${drN} (speed ${cr?Math.ceil(SHU.spd/2)+', crippled':SHU.spd}, one Ph-3 in all directions, ${f.hp} of ${SHU.hp} damage points left). It cannot fire for eight impulses (J1.342). ${s.shb.length} shuttle${s.shb.length===1?'':'s'} left aboard.`+RL('J2.11, J2.13, J2.213, J1.50, J1.34'))}
// [J1.61] Landing under its own power: same hex, the ship not faster than the shuttle, a free box and a working bay.
function shLand(d,s,i){const A=absI(i);if(!shCap(s)||s.out||s.boom||(s.sys.Shuttle||0)<=s.shb.length||A-s.shLast<2||spdOf(s)>d.spd)return false;
 rmDr(d);s.shb.push({hp:d.hp,l:turn,la:A});s.shLast=A;L(`Impulse ${i}: shuttle #${d.id} lands aboard ${s.tag} (${d.hp} of ${SHU.hp} damage points left).`+RL('J1.61, J1.52'));return true}
// [J2.2211, J2.2212] Suicide shuttle arming energy for this turn's plan (warp energy). Returns the energy; adds errors.
function ssCheck(s,p,e){const n=shCap(s)?+(p.ssE||0):0;p.ssE=n;if(!n)return 0;const A=s.ssA;
 if(!s.shb.length||(s.sys.Shuttle||0)<=0){e.push('There is no shuttle aboard to arm as a suicide shuttle (J2.221)');return 0}
 if(n<1||n>3||Math.abs(n*2-Math.round(n*2))>1e-9)e.push('Suicide shuttle energy is 1 to 3 points of warp power a turn, in half points (J2.2211)');
 if(A&&A.ready&&A.at<turn&&A.E+n-1>9)e.push('A held suicide shuttle can take at most nine points of energy in all (J2.2212)');
 return n}
// Applied with the plan: the arming steps, then holding.
function ssStart(s,p){if(!shCap(s))return;const n=+(p.ssE||0),A=s.ssA;
 if(!A){if(n>0&&s.shb.length){s.ssA={t:1,E:n,at:turn,ready:false};LS(`${s.tag} begins arming a suicide shuttle: turn 1 of 3, ${n} warp energy.`+RL('J2.221, J2.2211'),isFoe(s))}return}
 if(A.t<3){if(n<1){LS(`${s.tag} does not pay the arming energy: the suicide shuttle arming is aborted and the energy lost.`+RL('J2.2211'),isFoe(s));s.ssA=null;return}
  A.t++;A.E+=n;if(A.t===3){A.at=turn;A.ready=true;LS(`${s.tag}'s suicide shuttle is armed (warhead ${shWarhead(A)}). It can launch this turn; holding it aboard later costs one energy a turn.`+RL('J2.2211, J2.2212'),isFoe(s))}
  else LS(`${s.tag} arms its suicide shuttle: turn ${A.t} of 3, ${n} warp energy (${A.E} so far).`+RL('J2.2211'),isFoe(s));return}
 if(A.at<turn){if(n<1){LS(`${s.tag} does not pay the holding energy: its suicide shuttle is deactivated and the arming energy lost.`+RL('J2.2212'),isFoe(s));s.ssA=null}else A.E=Math.min(9,A.E+n-1)}}
// Aboard shuttles are lost with their boxes (J1.41); arming is lost with its shuttle.
function shStep(){sh.forEach(s=>{if(!s.shb)return;const cap=Math.max(0,s.sys.Shuttle||0);while(s.shb.length>cap){s.shb.pop();L(`Shuttle box damage destroys a shuttle aboard ${s.tag}.`+RL('J1.41'))}
 if(s.ssA&&!s.shb.length){LS(`${s.tag} loses the suicide shuttle it was arming.`+RL('J1.41'),isFoe(s));s.ssA=null}})}
function shDo(ss){const s=sh[0],w=shWhy(s,imp+1,ss);if(w)return;shLaunch(s,imp+1,ss);draw()}
function shRecall(){sh[0].shRec=!sh[0].shRec;L(`Impulse ${imp+1}: you ${sh[0].shRec?'recall':'release'} your shuttles${sh[0].shRec?'; they fly back to the ship and land when it is slow enough (J1.61)':''}.`+RL('J1.61'));draw()}
function shCard(){const s=sh[0];if(!shCap(s))return'';const w=shWhy(s,imp+1,false),w2=shWhy(s,imp+1,true),A=s.ssA;
 return `<p style="margin:6px 0 2px"><b>Shuttles (J1, J2)</b></p><span class="chip">Aboard <b>${s.shb.length}</b></span><span class="chip">Flying <b>${shOut(s).length}</b></span>${A?`<span class="chip">Suicide shuttle: ${A.ready?`armed, warhead <b>${shWarhead(A)}</b>`:`arming, turn <b>${A.t}</b> of 3`}</span>`:''}<div class="row"><button ${w?'disabled':''} onclick="shDo(false)">Launch a shuttle</button><button ${w2?'disabled':''} onclick="shDo(true)">Launch the suicide shuttle</button><button class="${s.shRec?'on':''}" onclick="shRecall()">${s.shRec?'Stop recalling':'Recall shuttles'}</button></div>${w&&s.shb.length?`<p class="mu" style="margin:2px 0">${w}.</p>`:''}${!w&&w2&&A?`<p class="mu" style="margin:2px 0">Suicide shuttle: ${w2}.</p>`:''}${typeof wwCard==='function'?wwCard(s):''}<p class="mu" style="margin:2px 0">A launched shuttle flies itself (speed ${SHU.spd}, one Ph-3 all round, destroyed by ${SHU.hp} damage, crippled by ${SHU.cr}) and cannot fire for eight impulses. Arm a suicide shuttle on the Power and shields tab.</p>`}
// Energy allocation row: arming and holding a suicide shuttle.
function ssRow(s,p){if(!shCap(s)||(!s.shb.length&&!s.ssA))return'';const A=s.ssA,n=+(p.ssE||0);
 const st=!A?'None started. Arming takes three turns of 1 to 3 warp energy each (half points allowed); the warhead is twice the energy applied (6 to 18).':A.t<3?`Arming: turn ${A.t} of 3 done, ${A.E} energy so far. This turn needs 1 to 3 warp energy, or the arming is aborted and the energy lost (J2.2211).`:A.at===turn?`Armed this turn (warhead ${shWarhead(A)}); launch it any time. Nothing more is needed unless it stays aboard.`:`Armed (warhead ${shWarhead(A)}, ${A.E} energy applied). Holding it aboard costs 1 energy; any more adds to the warhead up to 9 in all, at most 3 a turn (J2.2212).`;
 const opts=[0,1,1.5,2,2.5,3].map(v=>`<option value="${v}" ${v===n?'selected':''}>${v?v+' warp energy':'none'}</option>`).join('');
 return`<tr><td class="l">Suicide shuttle arming<br><small>${st} The shuttle bay must hold a shuttle (J2.22).</small></td><td><select onchange="setSsE(+this.value)">${opts}</select></td><td>${n}</td></tr>`}
function setSsE(v){plan0.ssE=v;eaMsg='';draw()}
// Computer arming (hard level only): start when there is energy to spare, keep paying, hold only a short while.
function aiSuicide(s,p){if(!shCap(s)||s.conceded||!foeOf(s))return;const A=s.ssA;let n=0;
 if(!A){if(s.shb.length>=2&&dist(s,foeOf(s))>=10)n=1.5}else if(A.t<3)n=1.5;else if(A.at<turn&&A.at>=turn-3)n=1;
 if(!n)return;let c=cost(s,p);if(A&&A.t<3)for(let g=0;g<4&&!c.errors.length&&c.left<n&&p.spd>0;g++){p.spd--;c=cost(s,p)} // an arming in progress is worth slowing down for (J2.2211)
 if(c.errors.length||c.left<n+(A?0:3.5))return;p.ssE=n;if(cost(s,p).errors.length)p.ssE=0}
function shAi(s,i){if(!shCap(s)||s===sh[0]||s.conceded||level==='easy')return;const foe=foeOf(s);if(!foe)return;const r=dist(s,foe);
 if(s.ssA&&s.ssA.ready&&r<=10&&!shWhy(s,i,true)){shLaunch(s,i,true);return}
 const spare=s.shb.length-(s.ssA?1:0)-(s.wwA?1:0);if(r<=10&&spare>0&&shOut(s).length<(level==='hard'?3:2)&&!shWhy(s,i,false))shLaunch(s,i,false)}
