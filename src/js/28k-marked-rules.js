/* ===== Marked Basic Set rules built in v209 (each behind a switch, all off by default) =====
   C6.55 tumbling after a breakdown (Commander's), D6.4 non-violent combat (Optional), D7.7 preventing self-destruction (Commander's). */
let optTumble=false,optNVC=0,optD77=false; // optNVC: 0 off, 1 your ships, 2 opposing ships, 3 both sides

// [C6.55] A breakdown can leave the ship tumbling: roll one die, 1 = tumbling.
// It keeps moving at its old speed and direction for the 16 impulses of the post-breakdown period, turns to a random facing every impulse,
// cannot fire or act, counts as erratic (+4 ECM against it, C6.553), cannot be tractored, takes one extra die of crew and internal damage (C6.555).
function tumbleRoll(s,i,sp0,f0,dir0){if(!optTumble||sp0<=0||s.d.base)return false;const d=d6();
 L(`  Tumbling roll for ${s.tag} (C6.55): ${d}${d===1?' → THE SHIP IS TUMBLING.':' → no tumble.'}`+RL('C6.55'));if(d!==1)return false;
 s.tum={dir:dir0?(f0+3)%6:f0,sp:sp0,end:absI(i)+16};s.noFire=Math.max(s.noFire||0,s.tum.end);
 if(LNK&&(LNK.by===s||LNK.on===s))breakLink('the violent gyrations of the tumbling ship tear the link apart','C6.553');
 L(`  ${s.tag} keeps drifting ${FL[s.tum.dir]} at speed ${sp0} for 16 impulses, whatever way it faces. It turns to a random facing every impulse, cannot fire or act, and enemy fire against it counts 4 more ECM points. It cannot use emergency deceleration.`+RL('C6.551, C6.5511, C6.552, C6.553, C6.557'));return true}
// [C6.555] The extra damage of a tumble: one die of crew units and one die of internal damage, in the same volley as the breakdown damage.
function tumbleHurt(s,u){const d=d6();let kill=Math.min(d,Math.max(0,Math.floor(s.gc)-2));s.gc-=kill;s.cK+=kill;
 L(`  Tumbling adds ${d} crew units killed${kill<d?` (only ${kill} can be, the last two crew units never die, G9.22)`:''} and ${d} more internal damage points to the same volley.`+RL('C6.555, G9.22')+crewNote(s));for(let k=0;k<d;k++)dac(s,null,u)}
// Movement of a tumbling ship for one impulse. Returns true when it handled the ship.
function tumbleMove(s,i){const T=s.tum;if(!T)return false;if(s.out||s.boom||absI(i)>T.end){s.tum=null;return false}
 s.sp=T.sp;let m=`Impulse ${i}: ${s.tag} (tumbling)`;
 if(moves(T.sp,i)){let[nc,nr]=NB(s.c,s.r,T.dir);
  if(nc<1||nc>COLS||nr<1||nr>ROWS){if(optFloat&&!scn6){const sft=floatShift(nc,nr);if(sft){[nc,nr]=NB(s.c,s.r,T.dir);m+=` (the map floats: every unit is moved ${sft} away from the edge)`+RL('S1.43')}}
   if(nc<1||nc>COLS||nr<1||nr>ROWS){m+=' stops at the map edge: a ship cannot tumble off a fixed map.'+RL('C6.551');nc=s.c;nr=s.r}}
  if(terBlk(nc,nr)&&T.sp>1){const gas=!!(TER.gas&&dist({c:nc,r:nr},TER.gas)<=TER.gas.R);s.c=nc;s.r=nr;s.boom=true;s.tum=null;s.killTxt=`${s.n} tumbles into ${hexNo(nc,nr)}, ${gas?'a gas giant':'a planet'} hex, and ${gas?'is destroyed':'is wrecked'}.`;if(!gas)s.exploded=true;L(m+` tumbles into ${hexNo(nc,nr)}, ${gas?'a gas giant':'a planet'} hex, and is destroyed without survivors.`+RL('C6.556, P2.435, P2.812'));if(gas)explode(s);checkEnd();return true}
  if(nc!==s.c||nr!==s.r){s.c=nc;s.r=nr;s.path.push([nc,nr]);m+=` drifts to ${hexNo(nc,nr)}`;
   if(!ckHid(s))L(m+RL('C6.551'));if(optAst&&inAst(nc,nr))astHit(s,i);if(RGH.size&&inRing(nc,nr))ringHit(s,i)}else if(!ckHid(s))L(m+'.'+RL('C6.551'))}
 s.f=d6()-1;s.st=0;
 if(absI(i)>=T.end){s.sp=0;s.tum=null;L(`Impulse ${i}: ${s.tag} stops tumbling and comes to a halt facing ${FL[s.f]}.`+RL('C6.554'))}
 return true}

// [D6.4] Non-violent combat: a ship that uses it resolves every direct-fire hit on the NVC chart instead of the DAC.
// Seeking weapons, mines and the monsters never use it (D6.43), so the flag is set only around the ordinary firing volleys.
let NVCNOW=false;
const NVC_W={2:'Bridge',3:'Scanner',4:'Torp',7:'Phaser',10:'Drone',11:'Sensor',12:'Bridge'},NVC_P={1:'Impulse',2:'APR',3:'Warp',4:'Warp'};
function nvcOn(s){return !!(optNVC&&s&&s.nvc)}
function nvcHit(tgt,src,used){const hid=isFoe(tgt),r1=d6();const out=t=>LS(`  NVC roll: ${t}`+RL('D6.4, D6.41, D6.411, D6.412'),hid);
 const pick=nm=>{
  if(nm==='Bridge'){const c=['Bridge','Flag Bridge','Aux Control','Emer Bridge'].find(k=>(tgt.sys[k]||0)>0);if(!c)return out('a control system hit, but none is left: a miss');tgt.sys[c]--;let t=`${c} box destroyed`;if(tgt.gc>1){tgt.gc--;tgt.cK++;t+=' and one crew unit is killed (D6.42)'+crewNote(tgt)}else t+=' (the last crew unit cannot be killed)';return out(t)}
  if(nm==='Scanner'||nm==='Sensor'){if((tgt.sys[nm]||0)<=1)return out(`${nm}: the last box of the track is never destroyed: a miss`);tgt.sys[nm]--;return out(`${nm} box destroyed`)}
  if(nm==='Torp'){const c=tgt.tu.find(w=>w.alive)||tgt.pl.find(w=>w.alive)||tgt.di.find(w=>w.alive);if(!c)return out('torpedo hit, but no torpedo or disruptor is left: a miss');c.alive=false;if('state' in c)c.state='empty';else if('st' in c){c.st=0;c.rdy=false}else if('armed' in c)c.armed=false;tgt.capCur=Math.min(tgt.capCur,capMax(tgt));return out(`${c.name} destroyed`)}
  if(nm==='Phaser'){const a=src&&src.c!==undefined?rel(tgt,src):null,c=tgt.ph.find(w=>w.alive&&(!a||w.arcs.some(t=>inTok(t,a))));if(!c)return out('phaser hit, but no phaser is left: a miss');c.alive=false;tgt.capCur=Math.min(tgt.capCur,capMax(tgt));return out(`${c.name} destroyed`)}
  if(nm==='Drone'){const k=(tgt.sys.Drone||0)>0?'Drone':(tgt.sys.Add||0)>0?'Add':null;if(!k)return out('drone hit, but no drone rack is left: a miss');tgt.sys[k]--;return out(`${k==='Drone'?'drone rack':'ADD'} box destroyed`)}
  if(nm==='Impulse'||nm==='APR'){if((tgt.sys[nm]||0)<=0)return out(`${nm} hit, but none is left: a miss`);tgt.sys[nm]--;return out(`${nm} box destroyed`)}
  if(nm==='Warp'){const e=['Center W En','Left W En','Right W En'].filter(x=>(tgt.sys[x]||0)>0).sort((x,y)=>tgt.sys[y]-tgt.sys[x])[0];if(!e)return out('warp engine hit, but none is left: a miss');tgt.sys[e]--;return out(`${e} box destroyed`)}};
 if(r1>=3&&r1<=5)return out(`${r1}: miss, no effect`);
 if(r1===6){out('6: a random hit, normal damage allocation chart (D6.41)');return dacPlain(tgt,src,used)}
 if(r1===1){const r=d6()+d6();out(`1: weapons system hit, two dice ${r}`);const nm=NVC_W[r];return nm?pick(nm):out('miss, no effect')}
 const r=d6();out(`2: power system hit, one die ${r}`);const nm=NVC_P[r];return nm?pick(nm):out('miss, no effect')}

// [D7.7] A ship that tries to self-destruct while enemy boarding parties are aboard: roll to see whether they stop it.
// Returns true when the ship may go ahead and destroy itself.
function sdPrevent(s){if(!optD77||!optBoard)return true;if(s.sdBlocked){L(`${s.tag}'s self-destruction is permanently blocked by the enemy boarding parties.`+RL('D7.71'));return false}
 const b=typeof boardedBy==='function'?boardedBy(s):null;if(!b||!(b.n>0))return true;const att=b.by;
 let mod=0,t=[];const maj=att&&hasRole(att,'maj');if(maj){mod-=1;t.push('−1 enemy marine major, D7.72')}
 const cqv=typeof cq==='function'?cq(s):0;if(cqv>0){mod+=1;t.push('+1 outstanding crew, D7.73')}else if(cqv<0){mod-=1;t.push('−1 poor crew, D7.73')}
 if(optLeg&&['maj','eng','weapons','captain'].some(x=>hasRole(s,x))){mod+=1;t.push('+1 legendary officer aboard, D7.73')}
 const d=d6(),n=d+mod;let res;
 if(n<=1){s.sdBlocked=true;s.sdNext=false;res='permanently blocked'}else if(n<=3){s.sdNext=true;res='temporarily prevented: roll again next turn'}else res='the crew destroys the ship';
 L(`${s.tag} tries to self-destruct with ${b.n} enemy boarding part${b.n===1?'y':'ies'} aboard: die ${d}${t.length?' ('+t.join(', ')+')':''} = ${n} → ${res}.`+RL('D7.7, D7.71, D7.72, D7.73, D5.52'));
 return n>=4}

/* ===== [G4.2] Identifying seeking weapons with labs (Advanced), switch optLabID, off by default =====
   With the switch on, an enemy drone, plasma torpedo or suicide shuttle shows only that it exists until a lab identifies it: its target line,
   warhead and damage rating are hidden from you (the computer always knows its own). Each lab box can make one attempt a turn and not within
   a quarter turn (8 impulses) of its last use; roll a die per lab: any result above the range identifies the weapon (G4.22). A ship with no lab
   can use one control space (G4.31). Not usable while cloaked or erratic (G4.21). */
let optLabID=false;
const labHide=d=>optLabID&&d&&d.own&&d.own.tm!==0&&!d.idd&&!d.ft;
function labCount(s){const n=s.sys.Lab||0;if(n>0)return n;return((s.sys.Bridge||0)+(s.sys['Emer Bridge']||0)+(s.sys['Aux Control']||0))>0?1:0} // [G4.31] a control space can serve as the one lab
function labAvail(s){if(!optLabID||!s||s.out||s.boom||s.emOn||(s.ck&&s.ck.mode==='on'))return 0;const A=absI(imp+1),b=(turn-1)*32;
 const used=(s.labU||[]).filter(u=>u>b||A-u<8).length;return Math.max(0,labCount(s)-used)} // [G4.22] one attempt a turn per lab, none within a quarter turn of a use in an earlier turn
function labTry(k,n){const s=sh[0],d=DR[k];if(!d||!labHide(d))return;const a=Math.min(n,labAvail(s));if(a<1)return;const A=absI(imp+1),r=dist(s,d);s.labU=(s.labU||[]).filter(u=>A-u<64);for(let q=0;q<a;q++)s.labU.push(A);
 const rolls=[];for(let q=0;q<a;q++)rolls.push(d6());const ok=rolls.some(x=>x>r);
 L(`Impulse ${imp+1}: ${s.tag} tries to identify ${d.pl?'plasma torpedo':d.ss?'suicide shuttle':'drone'} #${d.id} at range ${r} with ${a} lab${a>1?'s':''}: rolled ${rolls.join(', ')} (a result above ${r} is needed) → ${ok?'identified':'no result'}.`+RL('G4.22, G4.21'));
 if(ok){d.idd=true;L(`  Identified: ${d.pl?`plasma torpedo (warhead ${plStr(d)})`:d.ss?`suicide shuttle, warhead ${d.wh}`:`drone, warhead ${d.wh}, ${d.hp} damage destroys it`}; its target is ${d.tgt.tag}.`+RL(d.pl?'G4.232':'G4.231, G4.23'))}
 draw()}
function labCard(){if(!optLabID)return'';const s=sh[0],a=labAvail(s),c=DR.map((d,k)=>[d,k]).filter(x=>labHide(x[0]));if(!c.length&&!a)return'';
 return`<div class="row" style="margin:6px 0"><span class="mu"><b>Labs (G4.2)</b>: ${a} attempt${a===1?'':'s'} free (${labCount(s)} lab${labCount(s)===1?'':'s'}). ${c.length?'Enemy seeking weapons not yet identified:':'No unidentified enemy seeking weapons.'}</span>`+c.map(([d,k])=>{const r=dist(s,d);return`<button ${a<1||r>=6?'disabled':''} title="${r>=6?'A die cannot beat a range of 6 or more':'Roll one die per lab; a result above the range identifies it'}" onclick="labTry(${k},1)">${d.pl?'Plasma':d.ss?'Shuttle':'Drone'} #${d.id} (range ${r}), 1 lab</button>${a>1&&r<6?`<button onclick="labTry(${k},${a})">all ${a} labs</button>`:''}`}).join('')+`</div>`}
const tgtTxt=(s,foe)=>(optLabID&&s.tm!==0)?'':` at ${foe.tag}`; // [G4.2] an enemy launch does not name its target until a lab identifies the weapon

/* ===== [D7.6, D7.63, G7.8, D7.637] Capturing enemy shuttles (Commander's / Advanced), switch optCapSh, off by default =====
   Needs the shuttle and boarding switches. Three ways, all yours (the computer never tries):
   - Beam one boarding party onto an enemy shuttle, wild weasel or suicide shuttle within transporter range (D7.60-D7.62, tables D7.601, D7.61, D7.62).
   - Hold an enemy shuttle in a tractor beam, bring it into your hex and pull it into an empty shuttle box (G7.8, one rotation a turn, G7.71).
   - Once it is in the bay, at the end of each turn one or two boarding parties try to capture it (D7.631), or up to four shoot it (D7.637).
   Simplifications: a pulled-in combat shuttle fires its Ph-3 at range 0 once a turn inside the bay (G7.81, G7.812: half the points on shuttle boxes
   in the bay, the rest as internal damage); it cannot launch again (J1.635) and shuttles crashing into a bay (J1.63, J1.65), overcrowding (J1.64) and
   firing from the bay's other weapons are not built. A captured shuttle joins your bay if a box is free, otherwise it is simply removed. */
let optCapSh=false;
const capOn=()=>optCapSh&&optShut&&optBoard;
const capKind=d=>d.ww?'ww':d.ss?'ss':d.shu?'adm':'ftr';
const capCrip=d=>!!d.crip||(d.hp!==undefined&&d.mhp&&d.hp<=d.mhp-SHU.cr);
// Results of the D7.601 / D7.61 / D7.62 tables for a crew of quality c (-1 poor, 0 normal, 1 outstanding) and a die r.
function capTable(kind,c,r){const k=c>0?1:c<0?-1:0;
 if(kind==='adm'){const cm={0:2,1:3,'-1':1}[k],dm={0:6,1:6,'-1':5}[k];return r<=cm?'cap':r>=dm?'doubt':'bp'}
 if(kind==='ss'){const cm={0:1,1:3,'-1':1}[k],bm={0:5,1:5,'-1':4}[k];return r<=cm?'cap':r<=bm?'bp':'doubt'}
 const vm={0:1,1:2,'-1':1}[k],dm={0:4,1:4,'-1':3}[k];return r<=vm?'void':r<=dm?'doubt':'boom'} // wild weasel (D7.61)
function capWhy(s,d){if(!capOn())return'off';if(!shCap(s))return'This ship has no shuttles';if(d.doubt)return'A boarding party is already aboard it (D7.601)';if(!d.ft&&!d.ss)return'Not a shuttle';if(d.ft&&!d.shu)return'Fighters cannot be boarded in space (J4.42)';
 if(SUN.noTx)return'Sunspots: transporters do not work this turn (P11.21)';if(hasCrit(s,'tr'))return'Transporters are knocked out (D8.2)';if(s.emOn)return'Erratic maneuvering: no transporters (C10.52)';if((s.tnLeft||0)<=0)return'No powered transporter left this turn (G8.13)';if(dist(s,d)>5)return'Transporter range is five hexes (G8.14)';if(!fcOk(s)||s.lock===false)return'No lock-on (G8.17)';if(freeBP(s)<=0)return'No boarding parties left';if(absI(imp+1)<=s.noFire)return'Post-breakdown (C6.5471)';return''}
function capTake(s,d,i,why){const A=absI(i),kind=capKind(d);s.bp++;
 if(kind==='ww'){const o=d.own;if(o.ww)wwVoid(o,'its shuttle is captured by a boarding party (D7.611)');rmDr(d);L(`  ${s.tag}'s boarding party takes over the wild weasel shuttle and returns.`+RL('D7.611'));return}
 rmDr(d);if(kind==='ss'){L(`  The suicide shuttle is deactivated and taken over by ${s.tag}'s boarding party, which returns.`+RL('D7.621'));return}
 if((s.sys.Shuttle||0)>s.shb.length){s.shb.push({hp:d.hp,l:turn,la:A});s.shLast=A;L(`  Shuttle #${d.id} is captured and flown into ${s.tag}'s bay (${d.hp} of ${SHU.hp} damage points left). It is now ${s.tag}'s shuttle.`+RL('D7.601, D7.603'))}else L(`  Shuttle #${d.id} is captured, but ${s.tag} has no free shuttle box for it: it is a prize and out of the fight.`+RL('D7.601'))}
function capResult(s,d,res,i,first){const kind=capKind(d);
 if(res==='cap'||res==='void'){L(`  ${first?'':'The issue in doubt is settled: '}${kind==='ww'?'weasel systems voided; captured':'captured'}.`+RL(kind==='ww'?'D7.611':kind==='ss'?'D7.621':'D7.601'));d.doubt=null;capTake(s,d,i)}
 else if(res==='bp'){L(`  ${kind==='ss'?'A booby trap destroys the boarding party; the shuttle goes on with its mission':'The boarding party is destroyed'}.`+RL(kind==='ss'?'D7.622':'D7.601'));s.bK=(s.bK||0)+1;d.doubt=null}
 else if(res==='boom'){L(`  The boarding party sets off the weasel: it and the party are destroyed, and the weasel's explosion period begins.`+RL('D7.612'));s.bK=(s.bK||0)+1;d.doubt=null;if(d.wwOf)wwDestroyed(d,'by the boarding party');else rmDr(d)}
 else{d.doubt=s;if(kind==='adm'){L(`  The issue is in doubt: the shuttle stops moving and cannot fire until it is settled at the end of the turn.`+RL('D7.602'))}else L(`  The issue is in doubt: roll again at the end of each turn; the ${kind==='ww'?'weasel works on':'shuttle continues its mission'}.`+RL(kind==='ww'?'D7.613':'D7.623'))}}
function capBeam(s,d,i){if(capWhy(s,d))return;const k1=shieldFor(s,d).k,kind=capKind(d);s.tnLeft--;s.bp--;s.dn[k1]=absI(i)+8;
 const r=d6(),res=capTable(kind,cq(s),r);L(`Impulse ${i}: ${s.tag} drops its #${k1+1} shield (down for at least eight impulses) and beams one boarding party onto ${kind==='ww'?'wild weasel':kind==='ss'?'suicide shuttle':'shuttle'} #${d.id} at range ${dist(s,d)}. Die ${r} → ${{cap:'captured',void:'voided and captured',bp:'party lost',doubt:'issue in doubt',boom:'exploded'}[res]}.`+RL(kind==='ww'?'D7.61':kind==='ss'?'D7.62':'D7.601, D7.604'));
 capResult(s,d,res,i,true)}
// [G7.8] Pull a held enemy shuttle into an empty shuttle box: the one rotation (G7.71) a turn.
function capPullWhy(s,d){if(!capOn())return'off';if(d.held!==s)return'Not held in your tractor beam';if(dist(s,d)>1)return'It must be in your hex or the next one (G7.8, G7.71)';if((s.sys.Shuttle||0)<=s.shb.length)return'No empty shuttle box (G7.8)';if(s.rotT===turn)return'The one rotation allowed this turn is used (G7.71)';if(!d.ft)return'Only shuttles and fighters (G7.8)';if(d.ww)return'A wild weasel is not pulled in this way';if(spdOf(s)>d.spd&&false)return'';return''}
function capPull(s,d,i){if(capPullWhy(s,d))return;rmDr(d);d.held=null;s.rotT=turn;s.shLast=absI(i);s.shb.push({hp:d.hp,l:turn,la:1e9,cap:d,hpMax:d.mhp||SHU.hp,kind:capKind(d)});
 L(`Impulse ${i}: ${s.tag} pulls ${d.shu?'shuttle':'fighter'} #${d.id} of ${d.own.tag} into its shuttle bay (${d.hp} damage points left).`+RL('G7.8, G7.71, J1.620, J1.634'))}
// [D7.63, D7.631, D7.637, G7.81] End of turn: the captives in the bay fire, then the ship's boarding parties go to work.
function capEnd(){if(!capOn())return;sh.forEach(s=>{if(!s.shb||s.out||s.boom||!s.shb.some(f=>f.cap))return;const A=absI(32);
 s.shb.filter(f=>f.cap).slice().forEach(f=>{const d=f.cap;if(!s.shb.includes(f))return;
  if(!capCrip(d)&&d.own&&!d.doubt&&d.hp>0){const r0=d6(),dm=phDmg(P3,0,r0,0);L(`End of turn ${turn}: shuttle #${d.id} fires its Ph-3 inside ${s.tag}'s bay at range 0: rolled ${r0} → ${dm} damage.`+RL('G7.81, G7.812'));
   if(dm>0){const bx=Math.ceil(dm/2);let gone=false;for(let q=0;q<bx&&(s.sys.Shuttle||0)>0;q++){const idx=Math.floor(Math.random()*(s.sys.Shuttle||0));if(idx<s.shb.length){const v=s.shb.splice(idx,1)[0];L(`  A shuttle box is destroyed and the shuttle in it is lost${v===f?' (the attacker itself)':''}.`+RL('G7.811, J1.413'));if(v===f)gone=true}else L('  A shuttle box is destroyed.'+RL('G7.811'));s.sys.Shuttle--}
    const used=new Set();for(let q=0;q<dm-bx;q++)dac(s,null,used);if(dm-bx>0)L(`  ${dm-bx} point${dm-bx>1?'s':''} of internal damage inside the armor.`+RL('G7.812'));if(gone)return}}
  if(!s.shb.includes(f))return;
  const plan=f.plan||'cap2',kind=f.kind;
  if(plan==='shoot'){const n=Math.min(4,freeBP(s));if(n<1){L(`  ${s.tag} has no free boarding parties to shoot at shuttle #${d.id}.`);return}f.hp-=n;L(`  ${n} boarding part${n===1?'y fires':'ies fire'} at shuttle #${d.id}: ${n} damage point${n>1?'s':''}. It has ${Math.max(0,f.hp)} left.`+RL('D7.637'));
   if(f.hp<=0){s.shb.splice(s.shb.indexOf(f),1);L(`  Shuttle #${d.id} is destroyed.`+RL('D7.637'))}else d.hp=f.hp;return}
  const n=Math.min(plan==='cap1'?1:2,freeBP(s));if(n<1){L(`  ${s.tag} has no free boarding parties to try to capture shuttle #${d.id} (D7.631).`);return}
  const crip=f.hp<=(f.hpMax||SHU.hp)-SHU.cr;let won=false,lost=0;
  for(let q=0;q<n&&!won;q++){let r=d6();const raw=r,c=cq(s);if(r<6){r=Math.max(1,Math.min(6,r-c))}
   const res=crip?'cap':kind==='ftr'?(r<=5?'cap':'bp'):(r<=4?'cap':r===5?'none':'bp');
   L(`  End of turn ${turn}: a boarding party of ${s.tag} tries to capture ${kind==='ftr'?'fighter':'shuttle'} #${d.id} in the bay: ${crip?'it is crippled and cannot resist (D7.632)':`die ${raw}${raw!==r?` modified to ${r} (crew quality, D7.636)`:''}`} → ${res==='cap'?'captured':res==='bp'?'boarding party killed':'no effect'}.`+RL('D7.631, D7.632, D7.636'));
   if(res==='cap')won=true;else if(res==='bp'){lost++;s.bp--;s.bK=(s.bK||0)+1}}
  if(won){f.cap=null;f.kind=undefined;f.la=absI(32);f.l=turn;L(`  Shuttle #${d.id} is captured: it is ${s.tag}'s shuttle now.`+RL('D7.631'))}})});
 // [D7.602, D7.613, D7.623] Boarding parties still fighting aboard shuttles in space: roll again.
 DR.filter(d=>d.doubt).slice().forEach(d=>{const s=d.doubt;if(!sh.includes(s)||s.out||s.boom){d.doubt=null;return}const kind=capKind(d),r=d6(),res=capTable(kind,cq(s),r);L(`End of turn ${turn}: the boarding party aboard ${kind==='ww'?'wild weasel':kind==='ss'?'suicide shuttle':'shuttle'} #${d.id} fights on: die ${r}.`+RL(kind==='ww'?'D7.613':kind==='ss'?'D7.623':'D7.602'));capResult(s,d,res,32,false)})}
// Interface: what you can do with enemy shuttles right now.
function capCard(){if(!capOn())return'';const s=sh[0];if(!shCap(s))return'';let h='';
 const en=DR.filter(d=>(d.ft||d.ss)&&d.own.tm!==s.tm&&!d.dead);
 const beam=en.filter(d=>(d.ss||d.shu)&&dist(s,d)<=5),pull=en.filter(d=>d.held===s&&d.ft),bay=s.shb.filter(f=>f.cap);
 if(!beam.length&&!pull.length&&!bay.length)return'';
 h+=`<div class="row" style="margin:6px 0"><span class="mu"><b>Capturing shuttles (D7.6, G7.8)</b></span>`;
 beam.forEach(d=>{const w=capWhy(s,d);h+=`<button ${w?'disabled':''} title="${w||'Beam one boarding party aboard (your shield on that side drops)'}" onclick="capBeamGo(${d.id})">Board ${d.ww?'wild weasel':d.ss?'suicide shuttle':'shuttle'} #${d.id}</button>`});
 pull.forEach(d=>{const w=capPullWhy(s,d);h+=`<button ${w?'disabled':''} title="${w||'Pull it into an empty shuttle box'}" onclick="capPullGo(${d.id})">Pull #${d.id} into the bay</button>`});
 bay.forEach((f,k)=>{h+=`<span class="mu">Captive #${f.cap.id} (${f.hp} of ${f.hpMax||SHU.hp}): at turn end <select onchange="s0capPlan(${s.shb.indexOf(f)},this.value)">${[['cap2','two parties try to capture it'],['cap1','one party tries to capture it'],['shoot','up to four parties shoot it']].map(a=>`<option value="${a[0]}" ${(f.plan||'cap2')===a[0]?'selected':''}>${a[1]}</option>`).join('')}</select></span>`});
 return h+'</div>'}
const capBeamGo=id=>{const d=DR.find(z=>z.id===id);if(d)capBeam(sh[0],d,imp+1);draw()},capPullGo=id=>{const d=DR.find(z=>z.id===id);if(d)capPull(sh[0],d,imp+1);draw()},s0capPlan=(k,v)=>{const f=sh[0].shb[k];if(f)f.plan=v};

/* ===== [C3.8] Directed turn modes (Optional), switch optDTM, off by default =====
   Every ship (not bases, and only above speed 1) declares each moving impulse that it is accumulating turn mode points to the left, to the right or
   not at all (neutral). A ship cannot shift straight from right to left (C3.82). Each hex moved while declared adds a point (C3.83); points of the
   other side cancel earlier ones (C3.84). When the points reach the turn mode at the current speed the ship MUST turn that way on its next moving
   impulse, which wipes the points out (C3.85). A sideslip is only possible toward the side being accumulated (C3.86). A high energy turn or tactical
   maneuver also clears the points. The computer declares the side it wants to turn to. Not built: C3.89 (declaring after a stop), mauler arcs (E8). */
let optDTM=false;
const dtmOn=s=>optDTM&&s&&!s.d.base&&s.sp>1;
const dtmNeed=s=>Math.max(1,tmS(s));
function dtmTk(s,req){ // req: -1/0/1 declaration, or +-2 declaration plus a sideslip
 if(s.st<(s.dtmSt||0))s.dtmA=0;
 const slipReq=Math.abs(req)===2;let dec=Math.sign(req);
 if(dec&&s.dtmD&&dec===-s.dtmD)dec=0; // [C3.82] no direct change from right to left
 s.dtmD=dec;
 if(Math.abs(s.dtmA||0)>=dtmNeed(s))return Math.sign(s.dtmA); // [C3.85] the turn is forced
 if(slipReq&&dec&&slipOk(s)&&(!s.dtmA||Math.sign(s.dtmA)===dec||true))return 2*dec; // [C3.86] only toward the side being accumulated
 return 0}
function dtmAfter(s,turned){if(!optDTM||s.d.base)return;if(turned){s.dtmA=0;s.dtmD=0}else s.dtmA=Math.max(-dtmNeed(s),Math.min(dtmNeed(s),(s.dtmA||0)+(s.dtmD||0)));s.dtmSt=s.st}
const canAsk=s=>dtmOn(s)?s.sp>0:(elig(s)||(slipStop&&slipOk(s)));
function dtmBanner(me){const a=me.dtmA||0,need=dtmNeed(me),forced=Math.abs(a)>=need,d=me.dtmD||0,so=slipOk(me);
 const b=(lbl,v,pri)=>`<button ${pri?'class="pri" ':''}onclick="pend=${v};go()">${lbl}</button> `;
 return`<div class="banner" style="margin:6px 0">Impulse ${imp+1}: directed turn mode (C3.8). Facing <b>${FL[me.f]}</b>; turn mode points ${a===0?'0':Math.abs(a)+(a<0?' left':' right')} of ${need}. ${forced?`<b>Your ship must turn ${a<0?'left':'right'} this impulse (C3.85).</b> `+b('Continue',0,1):`Declare for this move: ${b('Accumulate left',-1)}${b('Neutral',0,1)}${b('Accumulate right',1)}${so&&d!==0?`${b('Sideslip '+(d<0?'left':'right'),2*d)}`:''}`}${d&&!forced?`<span class="mu">Declared ${d<0?'left':'right'} last time; going straight to the other side needs a neutral impulse in between (C3.82).</span>`:''}</div>`}

/* ===== [C1.32, C1.33 level C1, C1.34, C1.35] Pre-plotted movement (Optional), switch optPlot, off by default =====
   Your ship's movement for the whole turn is written in Energy Allocation, hex by hex, in the book's notation: "4C 2B 2A 2F" means four hexes
   in direction C, then two in B, and so on. A leg whose direction differs from the facing by 60 degrees is a turn (turn mode must be met); add "s" for a
   sideslip (C4) instead; a leg that turns more than 60 degrees needs "h" and a high energy turn allocated (C6, 8 impulses apart, not impulse 1).
   The total must equal the hexes the turn's speed gives. During the turn the ship follows the plot by itself; you still fire, launch and use
   everything in C1.35 (never plotted) freely. If something spoils the plot (a breakdown, a tow, a pull, a blocked hex), the ship goes straight on
   and the log says so. Level C1 only: shuttles and fighters are not plotted; the computer's own ships fly as usual (C1.342). Not built: half-turn
   (C1.321) and segmented (C1.323) plotting, and pursuit, evasion and station-keeping plots (C1.322-C1.3227). */
let optPlot=false;
const tmAt=(s,v)=>v>1?tmFor(navCat(s),v)+(under(s)?1:0)+(hasCrit(s,'man')?1:0):0;
function plotParse(txt){const out=[],bad=[];String(txt||'').trim().split(/[\s,;]+/).filter(Boolean).forEach(t=>{const m=/^(\d{1,2})([A-Fa-f])([sShH]?)$/.exec(t);if(!m){bad.push(t);return}const n=+m[1],d='ABCDEF'.indexOf(m[2].toUpperCase()),k=m[3]?m[3].toLowerCase():'';for(let q=0;q<n;q++)out.push({d,k:q?'':k,txt:t})});return{items:out,bad}}
function plotCheck(s,p,e){if(!optPlot||s!==sh[0]){return}p.mp=String(p.mp||'');const spd=p.spd;
 if(spd<=0&&!p.mp.trim())return;const T=plotParse(p.mp),hexes=plotHexes(p);
 if(!p.mp.trim()){e.push(`Plot your movement (C1.32): ${hexes} hex${hexes===1?'':'es'} this turn, for example "${hexes}${'ABCDEF'[s.f]}" to go straight ahead`);return}
 if(T.bad.length){e.push(`Movement plot: cannot read "${T.bad.join(' ')}". Use a number and a letter A to F, such as 4C, with s (sideslip) or h (high energy turn) after it`);return}
 if(T.items.length!==hexes){e.push(`Movement plot covers ${T.items.length} hex${T.items.length===1?'':'es'} but this turn's speed moves ${hexes} (C1.32)`);return}
 if(s.dir){e.push('Plotted movement does not cover a ship that is reversing (C3.5)');return}
 const sp=spdPlot(p);let f=s.f,st=s.st||0,sl=s.sl||0,het=p.het||0,lastH=s.lastHet||-99,k=0,errs=0;const b0=(turn-1)*32;
 for(let i=1;i<=32&&k<T.items.length;i++){if(!moves(sp[i],i))continue;const it=T.items[k++],v=sp[i],delta=(it.d-f+6)%6,why=m=>{if(errs++<3)e.push(`Movement plot, hex ${k} (${it.txt}, impulse ${i}): ${m}`)};
  if(delta===0){st++;sl=Math.min(9,sl+1);continue}
  if(it.k==='h'){if(het<=0)why('a high energy turn is not allocated (C6.2)');else if(i<=1)why('no high energy turn on impulse 1 (C6.37)');else if(b0+i-lastH<8)why('a high energy turn within 8 impulses of the last (C6.36)');else{het--;lastH=b0+i;f=it.d;st=1;sl=0}continue}
  if(it.k==='s'){if(delta!==1&&delta!==5)why('a sideslip moves only 60 degrees off the facing (C4.1)');else if(!(optSlip&&v>0&&sl>=1))why('the ship has not moved a hex straight since its last sideslip or turn (C4.1)');else{sl=0;st++}continue}
  if(delta===1||delta===5){if(v>1&&st<tmAt(s,v))why(`turn mode ${tmAt(s,v)} not met: ${st} hex${st===1?'':'es'} since the last turn (C3.1)`);else{f=it.d;st=1;sl=1}continue}
  why('a turn of more than 60 degrees needs a high energy turn: write h after the leg (C6.0)')}}
function plotStart(s,p){s.mpq=null;if(!optPlot||s!==sh[0]||!p.mp)return;const T=plotParse(p.mp);s.mpq=T.items.slice();s.mpTxt=p.mp;L(`${s.tag} flies the plotted movement for turn ${turn}: ${p.mp}.`+RL('C1.32, C1.33'))}
// Called at the start of every impulse before the game would ask you what to do: the ship follows its plot.
function plotStep(s,i){if(!optPlot||s!==sh[0]||!s.mpq||pend!==null||!moves(linkSp(s),i)||blocked(s,i)||s.sp<=0)return;
 if(LNK&&LNK.on===s){return}const it=s.mpq.shift();if(!it){s.mpq=null;return}const delta=(it.d-s.f+6)%6,fail=m=>{L(`Impulse ${i}: the movement plot cannot be followed (${m}); ${s.tag} goes straight ahead and the rest of the plot is dropped.`+RL('C1.32'));s.mpq=null;pend=0};
 if(delta===0){pend=0;return}
 if(it.k==='h'){if(canHet(s,i)){s.hetNext=it.d;pend=0;L(`Impulse ${i}: the plot calls for a high energy turn to ${FL[it.d]}.`+RL('C1.32, C6.1'))}else fail('no high energy turn is possible now');return}
 if(it.k==='s'){if(slipOk(s)&&(delta===1||delta===5)){pend=delta===1?2:-2}else fail('the sideslip is not possible now');return}
 if(delta===1||delta===5){if(elig(s)||s.sp<=1)pend=delta===1?1:-1;else fail('the turn mode is not met');return}
 fail('the leg turns more than 60 degrees without a high energy turn')}
function plRow(s,p){if(!optPlot||s!==sh[0])return'';const hexes=plotHexes(p);
 return`<tr><td class="l">Movement plot (C1.32)<br><small>Write every hex of the turn: a number and a direction A-F, e.g. "4C 2B 2A 2F". Add s for a sideslip or h for a high energy turn. ${hexes} hex${hexes===1?'':'es'} this turn; facing now ${'ABCDEF'[s.f]}.</small></td><td colspan="1"><input type="text" size="26" value="${(p.mp||'').replace(/"/g,'&quot;')}" onchange="plan0.mp=this.value;eaMsg='';draw()" placeholder="${hexes}${'ABCDEF'[s.f]}"> <button onclick="plan0.mp='${hexes}${'ABCDEF'[s.f]}';eaMsg='';draw()">Straight</button></td><td></td></tr>`}
