/* ===== Fighters (J4.0, R5.F2): the Kzinti advanced attack shuttle (AAS), optional (optFtr) =====
   The Kzinti CV carries 12 AAS. Each fighter is a unit in DR (flagged ft) so ships can shoot it with the normal direct-fire code.
   Simplifications: the computer flies every fighter (yours too); you launch them and can recall them. Fighters are not rearmed or repaired aboard
   (deck crews, J4.8, are not built). Fighters score nothing on their own; their BPV is part of the carrier's. */
let optFtr=false;
const AAS={spd:8,hp:8,drn:2,pv:6}; // [R5.F2] speed 8, one Ph-3 (FA arc), two type-I drones, destroyed by 8 damage points, BPV 6
SHIPS.CV.ftr=12; // [R5.F2] the Kzinti carrier's fighter boxes
const ftrCap=s=>optFtr&&s&&!s.dr&&SHIPS[s.key]&&SHIPS[s.key].ftr||0;
function ftInit(){sh.forEach(s=>{s.fb=ftrCap(s)?Array.from({length:SHIPS[s.key].ftr},()=>({hp:AAS.hp,drn:s.sh5?0:AAS.drn})):[];s.fbLast=-99;s.recall=false})}
const ftFoe=d=>{const e=sh.filter(x=>!x.out&&!x.boom&&x.tm!==d.own.tm&&!x.neu);return e.length?e.reduce((b,x)=>dist(d,x)<dist(d,b)?x:b,e[0]):null};
// [J1.50, J1.52, J1.34] Why a fighter cannot launch from this carrier now ('' when it can).
const ftRdy=(s,f,A)=>f.l!==turn&&A-(f.la===undefined?-99:f.la)>=8&&(!s.sh5||(f.prepT!==undefined&&f.prepT<turn)); // [SH5.45] a fighter must have been prepared on an earlier turn
function ftWhy(s,i){const A=absI(i);if(!ftrCap(s)||!s.fb||!s.fb.length)return'No fighters aboard';if(s.out||s.boom)return'The carrier is gone';if((s.sys.Shuttle||0)<=0)return'The shuttle bay is destroyed';
 if(A-s.fbLast<2)return'The bay launched or landed a shuttle in the last two impulses (J1.50)';
 if(s.fb.findIndex(f=>ftRdy(s,f,A))<0)return'No fighter is ready: one launch a turn, and a landed fighter waits a quarter turn (J1.52)';
 const foe=foeOf(s);if(!foe)return'No enemy';return''}
const ftrList=(s,i)=>ftrCap(s)&&!ftWhy(s,i);
function ftLaunch(s,i){const A=absI(i),k=s.fb.findIndex(f=>ftRdy(s,f,A)),f=s.fb.splice(k,1)[0],foe=foeOf(s);
 DR.push({id:++drN,dr:true,ft:true,own:s,tgt:foe,c:s.c,r:s.r,pc:s.c,pr:s.r,f:bestFacing(s,foe),st:0,hp:f.hp,spd:AAS.spd,born:A,hetT:-99,mv:-1,ecm:0,drn:f.drn,fT:-1,lastDr:-99,tmT:-99});f.l=turn;s.fbLast=A;
 L(`Impulse ${i}: ${s.tag} launches fighter #${drN} (an advanced attack shuttle, speed ${AAS.spd}, ${f.drn} drone${f.drn===1?'':'s'}, ${f.hp} damage points left). ${s.fb.length} fighters remain aboard. It cannot fire or launch drones for a while (J1.341, J1.342).`+RL('R5.F2, J1.50, J1.34'))}
function ftrDo(){const s=sh[0];if(ftWhy(s,imp+1))return;ftLaunch(s,imp+1);draw()}
function ftrRecall(){sh[0].recall=!sh[0].recall;L(`Impulse ${imp+1}: you ${sh[0].recall?'recall':'release'} your fighters${sh[0].recall?'; they fly back to the carrier and land when it is slow enough (J1.61)':''}.`+RL('J1.61'));draw()}
const ftrOut=s=>DR.filter(d=>d.ft&&d.own===s);
function ftrCard(){const s=sh[0];if(!ftrCap(s))return'';const out=ftrOut(s),w=ftWhy(s,imp+1);
 return `<p style="margin:6px 0 2px"><b>Fighters (R5.F2, J4)</b></p><span class="chip">Aboard <b>${s.fb.length}</b></span><span class="chip">Flying <b>${out.length}</b></span><div class="row"><button ${w?'disabled':''} onclick="ftrDo()">Launch a fighter</button><button class="${s.recall?'on':''}" onclick="ftrRecall()">${s.recall?'Stop recalling':'Recall fighters'}</button></div>${w&&s.fb.length?`<p class="mu" style="margin:2px 0">${w}.</p>`:''}`+(out.length?'<div class="scroll"><table><tr><th>Fighter</th><th>Hex</th><th>Damage left</th><th>Drones</th></tr>'+out.map(d=>`<tr><td>#${d.id}</td><td>${hexNo(d.c,d.r)}</td><td>${d.hp} of ${AAS.hp}</td><td>${d.drn}</td></tr>`).join('')+'</table></div>':'')}
function ftSvg(d,x,y,col){return `<g transform="translate(${x+11} ${y+11})"><circle r="8" fill="var(--card)" fill-opacity=".92" stroke="${col}" stroke-width="1.5"/><g transform="rotate(${60*d.f})"><polygon points="0,-7 6,6 0,3 -6,6" fill="${col}" fill-opacity=".55" stroke="${col}"/></g></g><text x="${x+11}" y="${y+30}" font-size="10" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">F${d.id}</text>`}
// [J4.45, J4.89] A hit on a fighter: damage points accumulate; 8 destroy it; half cripples it (J1.33).
function ftHit(d,n){d.hp-=n;if(d.hp<=0){rmDr(d);L(`Fighter #${d.id} of ${d.own.tag} takes ${n} damage and is destroyed.`+RL('R5.F2, J1.322'))}else L(`Fighter #${d.id} of ${d.own.tag} takes ${n} damage: ${d.hp} of ${AAS.hp} points left${d.hp<=AAS.hp/2?' (crippled: it flies home)':''}.`+RL('R5.F2, J1.33'))}
// [J1.61] Landing: the fighter and the carrier are in the same hex and the carrier is not moving faster than the fighter.
function ftLand(d,s,i){const A=absI(i);if(!ftrCap(s)||s.out||s.boom||(s.sys.Shuttle||0)<=0||A-s.fbLast<2||spdOf(s)>AAS.spd)return false;
 rmDr(d);s.fb.push({hp:d.hp,drn:d.drn,l:turn,la:A,prepT:0});s.fbLast=A;L(`Impulse ${i}: fighter #${d.id} lands aboard ${s.tag} (${d.hp} damage points left, ${d.drn} drones).`+RL('J1.61, J1.52'));return true}
// Movement, once per impulse the fighter's speed calls for (J1.2).
function moveFighters(i){const A=absI(i);DR.filter(d=>d.ft).forEach(d=>{if(d.born>=A||!moves(d.spd,i))return;const home=d.own,foe=ftFoe(d);if(foe)d.tgt=foe;
 const homeOk=ftrCap(home)&&!home.out&&!home.boom,ret=homeOk&&((home===sh[0]&&home.recall)||d.hp<=AAS.hp/2||(d.drn<=0&&d.fT===turn)||!foe),goal=ret?home:foe;if(!goal)return;
 if(ret&&d.c===home.c&&d.r===home.r){ftLand(d,home,i);return}
 const dd=dist(d,goal);
 if(!ret&&dd<=1){const bf=bestFacing(d,goal);if(d.f!==bf&&A-d.tmT>=4){d.f=bf;d.tmT=A;d.st=0}return} // [J4.11] hovers beside the enemy ship and turns by a tactical maneuver
 const opts=[0];if(d.st>=1)opts.push(-1,1);
 const ev=opts.map(df=>{const nf=(d.f+df+6)%6,[nc,nr]=NB(d.c,d.r,nf);if(nc<1||nc>COLS||nr<1||nr>ROWS)return null;return{df,nf,nc,nr,dd:dist({c:nc,r:nr},goal),tn:df?1:0}}).filter(Boolean).sort((x,y)=>x.dd-y.dd||x.tn-y.tn);
 if(!ev.length)return;let b=ev[0];if(b.dd>=dd&&!ret){const bf=bestFacing(d,goal);if(d.f!==bf&&A-d.tmT>=4){d.f=bf;d.tmT=A;d.st=0}return}
 d.pc=d.c;d.pr=d.r;if(b.df){d.f=b.nf;d.st=1}else d.st++;d.c=b.nc;d.r=b.nr;d.mv=A;if(ret&&d.c===home.c&&d.r===home.r)ftLand(d,home,i)})}
// Fire and drone launch (fire stage). A fighter fires its Ph-3 once a turn (J4.44), eight impulses after launch (J1.342), at a target in its FA arc.
function ftrAct(i){const A=absI(i);
 sh.forEach(s=>{if(!s.fb||!s.fb.length)return;const cap=Math.max(0,(s.sys.Shuttle||0)-3);while(s.fb.length>cap){s.fb.pop();L(`Impulse ${i}: shuttle box damage destroys a fighter aboard ${s.tag}.`+RL('J1.41'))}});
 DR.filter(d=>d.ft).forEach(d=>{const foe=ftFoe(d);if(!foe||A-d.born<8)return;d.tgt=foe;const r=dist(d,foe),a=rel(d,foe),fa=a===null||inTok('FA',a);
  if(fa&&d.drn>0&&A-d.born>=16&&A-d.lastDr>=8&&d.dT!==turn&&r<=14&&r>=3){d.drn--;d.dT=turn;d.lastDr=A;const T=DT[dtype];
   DR.push({id:++drN,dr:true,own:d.own,fc:d,tgt:foe,c:d.c,r:d.r,pc:d.c,pr:d.r,f:bestFacing(d,foe),st:0,hp:T.hp,wh:T.wh,spd:T.spd,exp:A+T.end*32,born:A,hetT:-99,mv:-1,ecm:0});
   L(`Impulse ${i}: fighter #${d.id} launches a ${T.n} (#${drN}) at ${foe.tag}, range ${r}. It controls the drone itself. ${d.drn} left.`+RL('J4.21, J4.24, J4.25'))}
  if(fa&&d.fT!==turn&&r<=4){let sf=0;try{sf=ewShift(d,foe,'ph')||0}catch(e){sf=0}const dd=d6(),dmg=phDmg(P3,r,dd,sf);d.fT=turn;
   L(`Impulse ${i}: fighter #${d.id}'s Ph-3 fires at ${foe.tag}, range ${r}: rolled ${dd}${sf?` +${sf} ECM shift`:''} → ${dmg} damage.`+RL('J4.44, E2.4'));
   if(dmg>0){const sk=shieldFor(foe,d);applyVolley(foe,sk.k,dmg,d,sk.note,`Fighter #${d.id} hits ${foe.tag} shield #${sk.k+1} for ${dmg}${sk.note}.`,'J4.44, E2.4')}}})}
// Computer carriers launch a fighter every other impulse once the enemy is within 16 hexes.
function ftrAi(s,i){if(!ftrCap(s)||s===sh[0]||s.conceded)return;const foe=foeOf(s);if(!foe||dist(s,foe)>16)return;if(!ftWhy(s,i))ftLaunch(s,i)}
