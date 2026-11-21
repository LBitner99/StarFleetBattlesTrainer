/* ===== Wandering monster, the Moray Eel of Space (S5.2 result 5, SM3.0) ===== It starts in hex 2220, speed 12, moving in direction A (it sideslips toward column 22 if it is off it) and ignores everything that does not attack it. A hit by direct fire sends it, on the next impulse, to the hex of each firing unit (up to six hexes, in a random order) to bite for 5-10 points that ignore shields. It cannot be hit from beyond six hexes. It dies when the total damage reaches N = BPV/125 x 200 and a die roll of 1 follows (and again on later impulses with at least I = BPV/125 x 10 more damage). Its planet is 119 hexes away; it leaves when it gets there. */
let EEL=null,MONS=[],LABUSE={}; // MONS: every monster in play (the amoeba divides, SM2.49); EEL is the one being processed
// {s, dmg, N, I, imp (damage this impulse), rolled, prov: units that struck it, trav}
const MONN={eel:'Moray Eel',amoeba:'Space Amoeba',cloud:'Cosmic Cloud',crusher:'Planet Crusher'};
function eelBuild(){const V=sh[0].d.pv||125,kind=TER.mon||'eel',at={eel:[22,20],amoeba:[21,15],cloud:[22,15],crusher:[2,30]}[kind]; // [SM1.2] the crusher starts in hex 0230, the planet is in 2502; // [SM2.2] amoeba in hex 2115, [SM4.2] cloud in hex 2215, [SM3.2] eel in 2220
 const q=mkShip('CR',at[0],at[1],0,kind==='eel'?'#7bc67e':kind==='amoeba'?'#e0a050':kind==='crusher'?'#e0605a':'#b48be0',MONN[kind],[]);q.tm=2;q.neu='eel';q.prev=0;q.sp=0;sh.push(q);EEL={s:q,kind,name:MONN[kind],dmg:0,N:Math.floor(V/125*200),I:Math.floor(V/125*10),imp:0,rolled:false,prov:[],trav:0,close:{},info:0,need:Math.floor(V/125*400),stage:0,kill200:kind==='crusher',friendly:false,hp:200,pdmg:0,fired:{},chase:null,gone:false,leaveT:0,split:false};MONS=[EEL]}
// [SM2.0, SM4.0, S6.1, G4.1] The Space Amoeba and the Cosmic Cloud move at speed 4 in a random direction. At the end of every turn each ship takes the effect of its closest approach: the amoeba does damage on the facing shield (ignoring reinforcement), the cloud kills crew units. A ship with labs gathers scientific information; at BPV/125 x 400 points the defeat table S6.1 is rolled.
function monMove(i){const q=EEL.s;if(EEL.kind==='crusher'){crushMove(i);return}if(!moves(4,i))return;const dir=d6()-1;let[nc,nr]=NB(q.c,q.r,dir);
 const taken=(c,r)=>MONS.some(m=>m!==EEL&&!m.s.out&&m.s.c===c&&m.s.r===r);
 if(taken(nc,nr)){const alt=[0,1,2,3,4,5].map(k=>NB(q.c,q.r,k)).filter(([c,r])=>c>=1&&c<=COLS&&r>=1&&r<=ROWS&&!terBlk(c,r)&&!taken(c,r));if(alt.length)[nc,nr]=alt[Math.floor(Math.random()*alt.length)]} // [SM2.49] the two halves do not enter the same hex if there is a legal alternative
 // [SM2.45, SM4.46] one die picks the direction of every move
 if(nc<1||nc>COLS||nr<1||nr>ROWS||terBlk(nc,nr)||(TER.bh&&dist({c:nc,r:nr},TER.bh)<=30&&EEL.kind==='amoeba'))return; // [SM2.453] never into a planet; [SM2.454] never within 30 hexes of a black hole
 q.c=nc;q.r=nr}
const labDie=(rng)=>{const d=d6();return{d,v:Math.max(0,11-d-rng)}}; // [G4.11] the chart reads 11 minus the die roll minus the range, never below zero
function monEnd(i){const q=EEL.s;if(q.out)return;if(EEL.kind==='crusher'){crushEnd(i);return}
 sh.filter(x=>!x.out&&!x.boom&&!x.neu&&!x.dr).forEach(x=>{const d=dist(x,q),c=EEL.close[x.tag];if(!c||d<c.r)EEL.close[x.tag]={r:d,k:shieldFor(x,q).k}}); // [SM2.461] closest approach this turn and the shield that faced the monster then
 if(EEL.kill200&&EEL.dmg>=(EEL.hp||200)){q.out=true;L(`Impulse ${i}: the ${EEL.name} has taken ${EEL.dmg} damage and is destroyed (S6.1 result 3).`+RL('S6.1'));return}
 if(i!==32)return;
 sh.filter(x=>!x.out&&!x.boom&&!x.neu&&!x.dr).forEach(x=>{const c=EEL.close[x.tag];if(!c||EEL.friendly)return;const mine=x===sh[0];
  if(EEL.kind==='amoeba'){const r=labDie(c.r),dm=r.v*2; // [SM2.461] the G4.1 number times two is the damage on the facing shield; reinforcement does not help
   L(`End of turn ${turn}: the ${EEL.name}'s closest approach to ${x.tag} was ${c.r} hexes (rolled ${r.d}): ${dm?`${dm} points of damage on shield #${c.k+1}, ignoring reinforcement`:'no damage'}.`+RL('SM2.461, SM2.467'));
   if(dm){const g=x.gen,sp=x.spec.slice();x.gen=0;x.spec[c.k]=0;applyVolley(x,c.k,dm,q,'',`${x.tag} takes ${dm} damage from the ${EEL.name}.`,'SM2.461');x.gen=g;x.spec=sp}
   if(mine)monInfo(x,r.v)}
  else{const T=[[4,4,4,3,2,0],[4,3,3,3,1,0],[3,3,3,2,0,0],[3,3,2,1,0,0],[2,2,1,0,0,0],[1,1,1,0,0,0]],col=c.r<=2?c.r:c.r<=5?3:c.r<=10?4:5,d=d6();let n=T[d-1][col];
   const full=x.shOn===2&&[0,1,2,3,4,5].every(k=>(x.sh[k]||0)>0);if(!full&&n>0)n*=2; // [SM4.451] losses double unless the shields run at full power; a down shield counts wherever it faces
   L(`End of turn ${turn}: the ${EEL.name}'s closest approach to ${x.tag} was ${c.r} hexes (rolled ${d}): ${n} crew unit${n===1?'':'s'} drained${n&&!full?' (doubled: shields not at full power)':''}.`+RL('SM4.451'));
   for(let k=0;k<n;k++){if(x.gc>1){x.gc--;x.cK=(x.cK||0)+1}else if(x.bp>=2){x.bp-=2;x.bK=(x.bK||0)+2}else{x.gc=0;x.bp=0;const ix=sh.indexOf(x);L(`${x.tag}: every crew unit has been drained of life energy.`+RL('SM4.451'));endFor(ix,x,`Every crew unit aboard ${x.tag} was drained by the Cosmic Cloud (SM4.451).`,`Every crew unit of your ship was drained by the Cosmic Cloud (SM4.451).`,'SM4.451');break}}
   if(n>0&&!x.out)L(crewNote(x).trim());
   if(mine&&!x.out)monInfo(x,labDie(c.r).v)}}); // [SM4.48] labs use G4.1 with their own die roll
 EEL.close={};if(EEL.kind==='amoeba'&&turn===20&&!EEL.split&&!EEL.friendly&&!EEL.s.out)ameSplit(); // [SM2.49] at the end of turn 20 the monster divides
 checkEnd()}
function monInfo(x,v){if(EEL.stage>=2)return;if(x.emOn){L(`${x.tag} is using erratic maneuvering, so its labs gather no information this turn.`+RL('C10.521, G4.12'));return}if(MONS.length>1){const k=x.tag+':'+turn;if(LABUSE[k]&&LABUSE[k]!==EEL){L(`${x.tag}'s labs already gathered information against the ${LABUSE[k].name} this turn, so they gather none against the ${EEL.name} (a lab cannot work on two monsters in the same impulse).`+RL('SM2.49'));return}LABUSE[k]=EEL} /* [SM2.49] */ const labs=((x.sys&&x.sys.Lab)||1)+(hasRole(x,'sci')?3:0)+(hasRole(x,'doc')?1:0); // [G22.31, G22.62] a legendary science officer counts as three more lab boxes, a doctor as one // [G4.12] the number times the functioning lab boxes; [G4.31] a ship with no lab uses a control space
 EEL.info+=v*labs;L(`Scientific information gained this turn: ${v} x ${labs} lab${labs===1?'':'s'} = ${v*labs} (${EEL.info} of ${EEL.need} needed).`+RL('G4.12, G4.31, SM2.5'));
 if(EEL.info>=EEL.need&&!EEL.friendly&&!EEL.kill200){let d=d6();for(let g=0;g<20&&d>=5&&hasRole(x,'captain');g++){L(`${x.tag}'s legendary captain refuses the result (${d===5?'insufficient data':'friendly'}) and rolls S6.1 again.`+RL('G22.222'));d=d6()} /* [G22.222] a legendary captain keeps rolling until the result lets him kill the monster */ L(`The ${EEL.need} points are in. Monster defeat table (S6.1), rolled ${d}: `+[
  'a suicide shuttle would destroy it, but this game has no shuttles. You need 100 more points and a new roll.',
  'it would be destroyed if held in a tractor beam, which this game cannot do to a monster. You need 100 more points and a new roll.',
  'it can be destroyed by 200 points of damage from any weapons.',
  'a probe would destroy it, but probes are not modelled against monsters here. You need 100 more points and a new roll.',
  'insufficient data. You need 100 more points and a new roll.',
  `communication is established and the ${EEL.name} becomes friendly. ${EEL.dmg>50?'You scored more than 50 points of damage on it, so you lose.':'It no longer attacks.'}`][d-1]+RL('S6.1'));
  if(d===3){EEL.kill200=true;if(EEL.dmg>=200){EEL.s.out=true;L(`The ${EEL.name} already has ${EEL.dmg} damage and is destroyed.`+RL('S6.1'))}}
  else if(d===6){EEL.friendly=true;if(EEL.dmg>50){over={win:false,text:`You scored more than 50 points of damage on the ${EEL.name} before it became friendly, and so you lose (S6.1 result 6).`}}}
  else EEL.need+=100}}
// [SM2.49] At the end of turn 20 the amoeba divides in two. All lab points are lost and each half needs its own points. Reading used here: the original keeps the damage already scored on it, the new half starts with none; the two halves start in the same hex and move apart under SM2.49.
function ameSplit(){const o=EEL,V=sh[0].d.pv||125,q=mkShip('CR',o.s.c,o.s.r,0,'#f0b878','Space Amoeba #2',[]);q.tm=2;q.neu='eel';q.prev=0;q.sp=0;sh.push(q);
 const need=Math.floor(V/125*400);o.name='Space Amoeba #1';o.split=true;o.info=0;o.need=need;o.kill200=false;o.rolled=false;
 const n={...o,s:q,name:'Space Amoeba #2',dmg:0,imp:0,prov:[],close:{},info:0,need,stage:0,kill200:false,friendly:false,rolled:false,split:true};MONS.push(n);
 L(`End of turn 20: the Space Amoeba divides into two (hex ${hexNo(o.s.c,o.s.r)}). Every lab point is lost; each half needs its own ${need} points. They move independently and avoid sharing a hex.`+RL('SM2.49'))}
// [SM1.0] The Planet Crusher: a monster that is out to destroy a class-M planet (hex 2502). Speed 6, any facing; pursues any ship within two hexes (and keeps after it out to six); fires its anti-proton beam once per turn at each uncloaked ship within six hexes and once at the planet, on the first impulse it is in range; no shields, destroyed by 200 points of damage; cannot be hit from beyond six hexes.
const CRW=[0,35,30,25,20,15,10]; // [SM1.49] the weapon chart: die 1 = 35 ... die 6 = 10, no range effect
function crushStep(q,t,away){const c=[0,1,2,3,4,5].map(k=>NB(q.c,q.r,k)).filter(([a,b])=>a>=1&&a<=COLS&&b>=1&&b<=ROWS&&!(TER.plan&&TER.plan.c===a&&TER.plan.r===b)&&!(TER.bh&&dist({c:a,r:b},TER.bh)<11&&dist({c:a,r:b},TER.bh)<=dist(q,TER.bh))); // [SM1.456] never closer than 11 hexes to a black hole; [SM1.455] terrain does not stop it
 if(!c.length)return null;const sc=c.map(([a,b])=>dist({c:a,r:b},t)*(away?-1:1)),m=Math.min(...sc),best=c.filter((x,k)=>sc[k]===m);return best[Math.floor(Math.random()*best.length)]} // [SM1.45] equal choices are decided by a die
function crushMove(i){const q=EEL.s;if(!moves(6,i))return; // [SM1.45] speed 6
 if(EEL.gone){if(turn>=EEL.leaveT+10){q.out=true;L(`Impulse ${i}: the Planet Crusher, its work done, disengages by acceleration.`+RL('SM1.5'));return}const t=TER.plan||{c:25,r:2},n=crushStep(q,t,true);if(n){q.c=n[0];q.r=n[1]}return} // [SM1.5] ten turns moving away from the dead planet
 const alive=x=>x!==q&&!x.out&&!x.boom&&!x.neu&&!x.dr&&!ckOn(x); // [SM1.451, SM1.495] ships only; cloaked ships are ignored
 let ch=EEL.chase&&alive(EEL.chase)&&dist(EEL.chase,q)<=6?EEL.chase:null; // [SM1.453] a ship it follows is kept until it is more than six hexes off
 if(!ch){const w=sh.filter(x=>alive(x)&&dist(x,q)<=2).sort((a,b)=>dist(a,q)-dist(b,q)||(b.d.pv||0)-(a.d.pv||0));ch=w[0]||null} // [SM1.451] closer ship first, then the larger one
 EEL.chase=ch;if(ch){if(dist(ch,q)===0)return; // [SM1.451] in the ship's hex it stays until the ship dies or leaves
  const n=crushStep(q,ch,false);if(n){q.c=n[0];q.r=n[1]}return}
 if(!TER.plan||dist(q,TER.plan)<=1)return; // [SM1.452] adjacent to the planet it stops
 const n=crushStep(q,TER.plan,false);if(n){q.c=n[0];q.r=n[1]}}
function crushEnd(i){const q=EEL.s;if(q.out)return;
 if(EEL.dmg>=EEL.hp){q.out=true;L(`Impulse ${i}: the Planet Crusher has taken ${EEL.dmg} damage and is destroyed.`+RL('SM1.5'));checkEnd();return}
 sh.filter(x=>x!==q&&!x.out&&!x.boom&&!x.neu&&!x.dr&&!ckOn(x)&&dist(x,q)<=6).forEach(x=>{const key=x.tag+':'+turn;if(EEL.fired[key])return;EEL.fired[key]=1; // [SM1.49, SM1.492] one shot per turn at each ship, on the first impulse it is within six hexes
  const d=d6(),b3=x.d.base&&x.d.size<=4,dm=CRW[d]*(b3?3:1),k=shieldFor(x,q).k;L(`Impulse ${i}: the Planet Crusher fires its anti-proton beam at ${x.tag} (rolled ${d}): ${dm} points on shield #${k+1}${b3?' (tripled because the target is a base of size class 4 or larger)':''}.`+RL('SM1.49, SM1.491, SM1.492'+(b3?', SM1.493':'')));
  applyVolley(x,k,dm,q,'',`${x.tag} takes ${dm} damage from the Planet Crusher.`,'SM1.49')});
 if(TER.plan&&!EEL.gone&&dist(q,TER.plan)<=6&&!EEL.fired['planet:'+turn]){EEL.fired['planet:'+turn]=1;const d=d6(),dm=CRW[d];EEL.pdmg+=dm; // [SM1.491, SM1.5] it fires on the planet whenever the planet is in range
  L(`Impulse ${i}: the Planet Crusher fires at the planet (rolled ${d}): ${dm} points, ${EEL.pdmg} of 200 so far.`+RL('SM1.49, SM1.5'));
  if(EEL.pdmg>=200){EEL.gone=true;EEL.leaveT=turn;L('The planet is destroyed. The Planet Crusher will move away for ten turns and then leave.'+RL('SM1.5'))}}
 checkEnd()}
function eelIntro(){if(!EEL)return;if(EEL.kind==='crusher'){L(`A Planet Crusher (SM1.0) is in hex 0230 and a class-M planet is in hex 2502. The monster moves at speed 6 toward the planet, turns to chase any ship that comes within two hexes, and fires its anti-proton beam (10 to 35 points, once per turn at each uncloaked ship within six hexes and once at the planet). It has no shields: 200 points of damage destroy it, and it can be hit only from six hexes or less. If it deals 200 points to the planet, it leaves after ten turns. Seeking weapons are not offered against it (MCIDS).`+RL('S5.2, SM1.2, SM1.45, SM1.451, SM1.46, SM1.49, SM1.5'));return}
 if(EEL.kind==='amoeba'){L(`A Space Amoeba (SM2.0) is in hex 2115. It drifts at speed 4 in random directions and hurts every ship by how close it comes: the damage is twice the G4.1 chart number on the shield that faced it, ignoring reinforcement. Gather ${EEL.need} points of scientific information (labs) and the defeat table S6.1 is rolled. Seeking weapons are not offered against it (MCIDS).`+RL('S5.2, SM2.2, SM2.45, SM2.461, SM2.5, SM2.7'));return}
 if(EEL.kind==='cloud'){L(`A Cosmic Cloud (SM4.0) is in hex 2215. It drifts at speed 4 in random directions. At the end of each turn it drains crew units according to your closest approach (doubled if your shields are not at full power). Gather ${EEL.need} points of scientific information (labs) and the defeat table S6.1 is rolled. Seeking weapons are not offered against it (MCIDS).`+RL('S5.2, SM4.2, SM4.451, SM4.46, SM4.5, SM4.7'));return}
L(`A Moray Eel of Space (SM3.0) is in hex 2220 moving in direction A at speed 12, ignoring both ships unless it is attacked. Direct fire reaches it only from six hexes or less. If you hit it, it moves to your hex on the next impulse and bites for 5 to 10 points that ignore shields. It is destroyed by ${EEL.N}+ points of damage followed by a die roll of 1 (and again on any impulse that adds ${EEL.I}+ points). It goes away when it reaches its planet, 119 hexes off.`+RL('S5.2, SM3.45, SM3.47, SM3.49, SM3.5, SM3.7'))}
function eelHit(dmg,src){if(!EEL||EEL.s.out||dmg<=0)return;EEL.dmg+=dmg;EEL.imp+=dmg;if(src&&src!==EEL.s&&!src.dr&&!src.neu&&!EEL.prov.includes(src)&&!src.out)EEL.prov.push(src);const m=`The ${EEL.name} takes ${dmg} damage (${EEL.dmg} in all).`;L(m+RL(EEL.kind==='eel'?'SM3.5':EEL.kind==='amoeba'?'SM2.47':'SM4.47')); }
// [SM3.49, SM3.491, SM1.46] Seeking weapons against the Moray Eel or the Planet Crusher: only from six hexes or less. The amoeba and the cloud are not offered them.
function monSeekWhy(s,foe){if(foe.neu!=='eel')return'';const m=MONS.find(x=>x.s===foe);if(!m||(m.kind!=='eel'&&m.kind!=='crusher'))return'Seeking weapons are not offered against this monster in this game (SM3.48, SM3.491); use direct fire.';if(effRange(s,foe)>6)return'Seeking weapons will not accept the monster as a target if launched from more than six hexes away (SM3.491, SM1.46).';return''}
/* [E6.0] Monster close-in defence system (MCIDS), on the Moray Eel (SM3.48) and the Planet Crusher (SM1.48). It fires up to three times an impulse at seeking weapons aimed at the monster that are within three hexes, once at each target (E6.31). The computer picks the most threatening: weapons about to hit it first, by warhead strength, then the rest (E6.42). A drone is destroyed on 1-4 (E6.1); a plasma torpedo loses 35, 25 or 10 warhead points on 1-2, 3-4, 5-6 (E6.51). It ignores pseudo-plasma torpedoes (E6.52), cannot fire through planets (E6.32) and, when the eel moves into a hex by reactive movement, fires first at the seeking weapons there (E6.33). Shuttles and fighters are not in this game. */
function mcids(i,react){if(!EEL||EEL.s.out||(EEL.kind!=='eel'&&EEL.kind!=='crusher'))return;const q=EEL.s,A=absI(i);if(EEL.mcK!==A){EEL.mcK=A;EEL.mcN=0;EEL.mcT=new Set()}
 const c=DR.filter(d=>d.tgt===q&&!d.fake&&!EEL.mcT.has(d.id)&&(react?(d.c===q.c&&d.r===q.r):dist(d,q)<=3)&&!plBetween(q,d)),str=d=>d.pl?plStr(d):(d.wh||0),soon=d=>dist(d,q)<=1?1:0;
 c.sort((a,b)=>soon(b)-soon(a)||str(b)-str(a));
 c.forEach(d=>{if(EEL.mcN>=3)return;EEL.mcN++;EEL.mcT.add(d.id);const r=d6(),nm=d.pl?'plasma torpedo':'drone';
  if(!d.pl){if(r<=4){rmDr(d);L(`Impulse ${i}: the ${EEL.name} fires its close-in defence at drone #${d.id} (rolled ${r}): the drone is intercepted and destroyed.`+RL('E6.1, E6.31, E6.42'+(react?', E6.33':'')))}else L(`Impulse ${i}: the ${EEL.name} fires its close-in defence at drone #${d.id} (rolled ${r}) and misses.`+RL('E6.1, E6.31'))}
  else{const red=r<=2?35:r<=4?25:10;d.dmg=(d.dmg||0)+2*red;if(plStr(d)<=0){rmDr(d);L(`Impulse ${i}: the ${EEL.name} fires its close-in defence at plasma torpedo #${d.id} (rolled ${r}): its warhead falls by ${red} and nothing is left.`+RL('E6.5, E6.51, E6.42'+(react?', E6.33':'')))}else L(`Impulse ${i}: the ${EEL.name} fires its close-in defence at plasma torpedo #${d.id} (rolled ${r}): its warhead falls by ${red} to ${plStr(d)}.`+RL('E6.5, E6.51, E6.42'+(react?', E6.33':'')))}})}
function eelMove1(i){if(!EEL||EEL.s.out)return;const q=EEL.s;if(EEL.kind!=='eel'){monMove(i);return}
 if(EEL.prov.length){ // [SM3.46, SM3.461, SM3.462] the monster answers every unit that hit it, in a random order, in the same impulse
  const l=EEL.prov.filter(u=>!u.out&&!u.boom).sort(()=>Math.random()-.5);EEL.prov=[];
  l.forEach(u=>{if(u.out||u.boom)return;q.c=u.c;q.r=u.r;mcids(i,true);const d=d6(),dm=11-d,used=new Set(); // [SM3.47] bite table: die 1 = 10 points ... die 6 = 5 points, scored directly on the ship
   L(`Impulse ${i}: the Moray Eel moves to ${hexNo(u.c,u.r)} and bites ${u.tag} (rolled ${d}): ${dm} points of damage that ignore shields.`+RL('SM3.461, SM3.47'));for(let n=0;n<dm;n++)dac(u,q,used)});
  checkEnd();return}
 if(!moves(12,i))return;const f=q.c<22?1:q.c>22?5:0;let[nc,nr]=NB(q.c,q.r,f); // [SM3.45] direction A, sideslipping toward column 22
 if((nc<1||nc>COLS||nr<1||nr>ROWS)){if(!optFloat||!floatShift(nc,nr))return;[nc,nr]=NB(q.c,q.r,f)}
 q.c=nc;q.r=nr;EEL.trav++;
 if(EEL.trav>=119){q.out=true;L(`Impulse ${i}: the Moray Eel reaches its planet, 119 hexes away, and disengages (SM3.452). In this Duel that has no further effect.`+RL('SM3.452'))}}
function eelEnd1(i){if(EEL&&EEL.kind!=='eel'){if(!EEL.s.out)monEnd(i);return}if(!EEL||EEL.s.out){if(EEL)EEL.imp=0;return}
 const q=EEL.s;if(EEL.dmg>=EEL.N&&(!EEL.rolled||EEL.imp>=EEL.I)&&EEL.imp>0){const first=!EEL.rolled;EEL.rolled=true;const d=d6();L(`Impulse ${i}: the Moray Eel has taken ${EEL.dmg} damage${first?` (${EEL.N} needed before the die rolls begin)`:` and ${EEL.imp} more this impulse (${EEL.I} needed)`}: destruction roll ${d}${d===1?', and it is destroyed!':', it survives.'}`+RL('SM3.5, SM3.7'));if(d===1){q.out=true;L('The Moray Eel of Space is destroyed.'+RL('SM3.5'))}}
 EEL.imp=0}
const withMon=(m,f)=>{const o=EEL;EEL=m;try{return f()}finally{EEL=o}}; // run f with EEL pointing at monster m
function eelMove(i){MONS.slice().forEach(m=>withMon(m,()=>eelMove1(i)))}
function eelEnd(i){MONS.slice().forEach(m=>withMon(m,()=>eelEnd1(i)))}
function eelToken(s){const mo=MONS.find(m=>m.s===s)||EEL;const x=cx(s.c),y=cy(s.c,s.r),col=s.col;return`<g transform="translate(${x} ${y})"><circle r="21" fill="var(--card)" fill-opacity=".88" stroke="${col}" stroke-width="2"/><path d="M-15 6 Q-9 -10 -3 2 T9 -2 T16 -8" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/><circle cx="16" cy="-8" r="3.2" fill="${col}"/></g><text x="${x}" y="${y+34}" font-size="12" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">${mo?mo.name:'Moray Eel'} (${mo?mo.dmg:0}${mo&&mo.kind==='eel'?'/'+mo.N:mo&&mo.kind==='crusher'?'/'+mo.hp:''})</text>`}
function terSvg(){if(!TBLK.size&&!RGH.size&&!TER.bh&&!TER.neb&&!TER.pul&&!MN.size&&!TER.moon)return'';const pts=(c,r)=>[0,1,2,3,4,5].map(i=>(cx(c)+R*Math.cos(i*Math.PI/3)).toFixed(1)+','+(cy(c,r)+R*Math.sin(i*Math.PI/3)).toFixed(1)).join(' ');
 const hx=(k,f,o,s)=>{const[c,r]=k.split(',').map(Number);return`<polygon points="${pts(c,r)}" fill="${f}" fill-opacity="${o}" stroke="${s}" stroke-opacity=".5" stroke-width="1"/>`};
 const bh=TER.bh?`<g pointer-events="none">${[2,5,10].map(n=>`<circle cx="${cx(TER.bh.c)}" cy="${cy(TER.bh.c,TER.bh.r)}" r="${(n*Math.sqrt(3)*R).toFixed(1)}" fill="none" stroke="#9b7fe8" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="4 6"/>`).join('')}<circle cx="${cx(TER.bh.c)}" cy="${cy(TER.bh.c,TER.bh.r)}" r="${R*.95}" fill="#000" stroke="#a98cf0" stroke-width="3"/></g>`:'',nb=TER.neb?'<rect x="-3000" y="-3000" width="9000" height="9000" fill="#8a5fd1" fill-opacity=".16" pointer-events="none"/>':'';
 const pu=TER.pul?`<g pointer-events="none"><circle cx="${cx(TER.pul.c)}" cy="${cy(TER.pul.c,TER.pul.r)}" r="${R*1.6}" fill="#ffd84a" fill-opacity=".18"/><circle cx="${cx(TER.pul.c)}" cy="${cy(TER.pul.c,TER.pul.r)}" r="${R*.8}" fill="#fff3a0" stroke="#ffb300" stroke-width="3"/></g>`:'';
 const mn=[...MN].filter(([k,v])=>(v.L&&(!optSweep||v.dL))||(v.S&&(!optSweep||v.dS))).map(([k,v])=>{const[c,r]=k.split(',').map(Number),big=v.L&&(!optSweep||v.dL);return`<polygon points="${pts(c,r)}" fill="#c0392b" fill-opacity=".14" stroke="#c0392b" stroke-opacity=".35" stroke-width="1"/><circle cx="${cx(c)}" cy="${cy(c,r)}" r="${big?4:2.5}" fill="#c0392b" fill-opacity=".8"/>`}).join(''); // [M6.1, M7.23] with the minesweeping option on, only detected mines are drawn
 const mo=TER.moon?`<circle cx="${cx(TER.moon.c)}" cy="${cy(TER.moon.c,TER.moon.r)}" r="${R*.5}" fill="#9aa0a8" stroke="#555" stroke-width="2"/>`:'';
 return nb+bh+pu+mn+mo+[...RGH].map(k=>hx(k,'#c9b27a',.2,'#c9b27a')).join('')+[...TBLK].map(k=>hx(k,TER.gas&&dist({c:+k.split(',')[0],r:+k.split(',')[1]},TER.gas)<=TER.gas.R?'#a0825a':'#4f86c6',.55,'#2b2118')).join('')}
// [S5.1, S5.2] Set up the terrain for a new game from the chosen mode.
function terInit(){TER={plan:null,gas:null,bh:null,neb:false,pul:null};MN=new Map();MINEZ=new Set();MOONB=new Set();PUL={next:1,imp:null};LC.last='';
 if(!lcOn()){if(LC.astSave!==undefined){optAst=LC.astSave;LC.astSave=undefined}terBuild();return}
 if(LC.astSave===undefined)LC.astSave=optAst;
 let m=LC.man,txt='';
 if(LC.mode==='roll'){const r=lcRoll();m=r.man;txt=`Local conditions (S5.1): rolled${r.notes.length?' ('+r.notes.join('; ')+')':''}: ${r.set.map(x=>LCN[x]).join(' and ')}${r.set.includes(10)?`, radius ${m.gasR}`:''}.`}
 else txt='Local conditions chosen: '+([m.ast&&'asteroid belt',m.plan&&'class-M planet',m.gas&&`gas giant (radius ${m.gasR}${m.rings?', with rings':''})`,m.bh&&'black hole in hex 2215',m.pul&&!m.bh&&'variable pulsar in hex 2215',m.mine&&'old minefield',m.pir&&!m.bh&&!m.pul&&'pirate cruiser in hex 2215',m.eel&&!m.bh&&!m.pul&&({amoeba:'Space Amoeba in hex 2115',cloud:'Cosmic Cloud in hex 2215'}[m.mon||'eel']||'Moray Eel in hex 2220'),m.neb&&'nebula'].filter(Boolean).join(', ')||'empty space')+'.';
 optAst=!!m.ast;if(m.bh)TER.bh={c:22,r:15}; // [S5.2 #2] black hole in hex 2215
 if(m.pul&&!m.bh)TER.pul={c:22,r:15}; // [S5.2 #11] variable pulsar in hex 2215 (a black hole in the same hex wins)
 if(m.neb)TER.neb=true; // [S5.2 #3] the whole map is inside a nebula
 if(m.plan)TER.moon={c:15,r:14}; // [S5.2 #4, P2.23] the small moon in hex 1514 comes with the planet
 if(m.plan)TER.plan={c:24,r:20}; // [S5.2 #4] class-M planet in hex 2420
 if(m.gas&&!m.bh)TER.gas={c:18,r:15,R:m.gasR,rings:!!m.rings}; // [S5.2 #10] gas giant in hex 1815
 if(m.plan&&m.gas)TER.plan=null,TER.moon=null,txt+=' (S5.2: with both a planet and a gas giant, the planet is ignored)';
 if(m.mine&&!m.bh&&!m.pul)mineBuild();TER.pir=!!(m.pir&&!m.bh&&!m.pul);TER.eel=!!(m.eel&&!m.bh&&!m.pul);TER.mon=m.mon||LC.man.mon||'eel';if(TER.eel&&TER.mon==='crusher'){if(m.gas||m.bh||m.pul){TER.mon='eel';txt+=' (the Planet Crusher needs a class-M planet, so the Moray Eel is used instead)'}else TER.plan={c:25,r:2}} // [SM1.2] the crusher scenario has its planet in hex 2502
  // [S5.2 #9] the pirate is added to the ships in init
 // [S5.2 #8] a black hole or pulsar result cancels the other result
 terBuild();LC.last=txt+(MN.size?' Every hex of the belt layout holds a large and a small mine; ships that move into a hex next to a mine may set it off (M2.0). Ships set up inside the field were moved clear (S5.33).':'')+(TER.pul?' The pulsar bursts on the first turn and then after random gaps; everything within 50 hexes is hurt (P5.0).':'')+(m.bh?' The black hole pulls every unit toward hex 2215 on set impulses (P4.1).':'')+(m.neb?' Inside a nebula everyone has 9 points of natural ECM, shields work only at minimum, units drift at random'+(optQuietNeb?' (quiet nebula: no drift)':'')+', and cloaks, tractors, transporters and webs do not work (P6.0).':'')+(TER.moon?' A small moon sits in hex 1514 (P2.23): a unit entering its hex may collide with it, and it may break lock-ons across it.':'')+(m.plan||m.gas?' No unit may enter a planet hex (the game stops it instead of crash-landing it), nobody can fire through a planet, and ring hexes hurt like asteroids.':'')}
function astSvg(){if(!optAst)return'';const pts=(c,r)=>[0,1,2,3,4,5].map(i=>(cx(c)+R*Math.cos(i*Math.PI/3)).toFixed(1)+','+(cy(c,r)+R*Math.sin(i*Math.PI/3)).toFixed(1)).join(' ');
 return[...ASTH].map(k=>{const[c,r]=k.split(',').map(Number);return`<polygon points="${pts(c,r)}" fill="#8a6d4b" fill-opacity=".22" stroke="#8a6d4b" stroke-opacity=".35" stroke-width="1"/>`}).join('')+AST.map(([c,r])=>`<circle cx="${cx(c)}" cy="${cy(c,r)}" r="7" fill="#b08f66" stroke="#2b2118" stroke-width="2"/>`).join('')}
const ESCORT={fed:'DD',kli:'E4',rom:'K5R',gor:'GDD',kzi:'KFF',tho:'TPC'},RELIEF={fed:'CA',kli:'D6',rom:'KR',gor:'GCL',kzi:'KCL',tho:'TPC'}; // SG4.47 smallest warship as escort; SG4.46 one cruiser as relief force
const c4QK=()=>QMAP[c4.race]+((c4.qm||'').slice(1)==='S'?'S':'L'),c4Q=()=>(c4.qm||'0')[0]==='c',c4Q64=()=>(c4.qm||'0')[0]==='p';
const c4Pen=()=>(c4.esc?Math.round(DEFS[ESCORT[c4.race]].pv/3)*(c4.esc2?2:1):0)+(c4Q()?DEFS[c4QK()].pv:0); // SG4.47 escort, SG4.48 Q-ship (its full BPV) // SG4.47: the convoy pays 1/3 of the escort's BPV
const c4Txt=()=>`${c4.nL} large and ${c4.nS} small freighter${c4.nL+c4.nS===1?'':'s'}`+(c4.esc?` with ${c4.esc2?'two ':'a '}${SHIPS[ESCORT[c4.race]].name}${c4.esc2?'s':''} as escort`:'');
function c4Log(){return `Scenario SG4.0, Basic Piracy: your ${sh[0].tag} (${c4Q64()?'a Q-ship hidden in the convoy, SG4.64':'the Orion pirate'}) raids a convoy of ${c4Txt()}. The freighters start in hexes 2316, 2117, 1918, 2519, 2320 and 2121 heading B at speed 6; ${c4Q64()?'you start among them in 2318 as if you were one of them, and the convoy takes you for a freighter until you reveal yourself (R1.7B)':'you enter at 4203 heading E at speed 15'}. All freighters must stay within 10 hexes of each other. From turn 6 the convoy rolls a die each turn for help (a 1 brings a relief cruiser). You win only if you capture at least one freighter.`+RL('SG4.2, SG4.3, SG4.45, SG4.46, SG4.5')}
// [S4.1, S4.10, S4.13] Weapons status at the start. WS-II (the game's default) has the last-but-one turn of arming done; WS-III has multi-turn weapons fully armed and held (holding energy has to be paid on turn 1; a plasma-R cannot be held, S4.13); WS-0 and WS-I have tubes empty and no plasma armed (the capacitors start empty in this game, so WS-0 and WS-I are the same here).
function setWS(s,w){if(!s||s.d.base)return;if(w==='III'){s.tu.forEach(t=>{t.state='armed'});s.pl.forEach(t=>{if(t.T!=='R'){t.st=3;t.rdy=true}})}else if(w==='0'||w==='I'){s.tu.forEach(t=>{t.state='empty'});s.pl.forEach(t=>{if(t.T!=='F'){t.st=0;t.rdy=false}})}}
// [R1.7B] Q-ship special rules. While hidden (s.qh) a Q-ship passes for a freighter: its shields work at freighter strength (8 on a large, 5 on a small).
let qAuto=true; // a hidden Q-ship you fly shows itself when it is first hit (R1.7B lets the owner choose); the computer always does
const QMAP={fed:'QF',tho:'QF',kli:'QK',kzi:'QK',gor:'QG',rom:'QG'};
const aiBlind=s=>s!==sh[0]&&!!sh[0]&&!!sh[0].qh&&s.tm===1; // SG4.64: the convoy does not know the pirate Q-ship in its midst is an enemy until it shows itself
const qStd=(s,x)=>x.kind==='ph'&&(x.w.T===P3||(s.d.fk==='FL'&&x.w.T===P2)); // weapons a plain freighter also has
function qReveal(s,why){if(!s.qh)return;s.qh=false;const was=s.tag;s.n=s.d.n;s.tag=s.d.tag;s.merch=0;setWS(s,'III');s.di.forEach(w=>{if(w.alive)w.armed=true});
 L(`R1.7B: the ${was} ${why}. It is a ${s.n}! Its shields are now at full strength and its held weapons are ready to fire.`+RL('R1.7B'));if(s===sh[0])L('The convoy now knows you for an enemy.'+RL('SG4.64'))}
function buildConvoy(){ // SG4.2: three to six freighters, one optional escort, all heading B at speed 6
 const pos=[[23,16],[21,17],[19,18],[25,19],[23,20],[21,21]],ks=[];for(let i=0;i<c4.nL+c4.nS&&i<6;i++)ks.push(i<c4.nL?'FL':'FS');
 let qi=-1;if(c4Q()&&ks.length){qi=ks.indexOf(c4.qm.slice(1)==='S'?'FS':'FL');if(qi<0)qi=0} // SG4.48: the Q-ship stands in for one of the freighters
 const ex=c4.esc?ESCORT[c4.race]:'',ex2=c4.esc&&c4.esc2?ESCORT[c4.race]:'',all=['CR'].concat(ks).concat(ex?[ex]:[]).concat(ex2?[ex2]:[]),cnt={},idx={};all.forEach(k=>cnt[k]=(cnt[k]||0)+1);
 const tg=k=>cnt[k]<2?undefined:(DEFS[k].tag+'-'+(idx[k]=(idx[k]||0)+1));
 sh=[c4Q64()?mkShip(c4QK(),23,18,1,'var(--ca)',undefined,[]):mkShip('CR',42,3,4,'var(--ca)',tg('CR'),rfA)];
 if(c4Q64()){sh[0].prev=6;sh[0].qh=true} // SG4.64: the pirate is a Q-ship already inside the convoy
 ks.forEach((k,i)=>{const s=mkShip(i===qi?c4QK():k,pos[i][0],pos[i][1],1,'var(--d7)',tg(k),[]);s.prev=6;s.merch=1;if(i===qi){s.qh=true;s.n=DEFS[k].n;s.tag=tg(k)||DEFS[k].tag}sh.push(s)});
 if(ex){const s=mkShip(ex,23,14,1,'var(--d7)',tg(ex),[]);s.prev=6;sh.push(s)}
 if(ex2){const s=mkShip(ex2,22,14,1,'var(--d7)',tg(ex2),[]);s.prev=6;sh.push(s)} // [SG4.71] a second escort
 sh.forEach((x,i)=>setWS(x,i===0?'III':'0')); // [SG4.2] the pirate starts at WS-III, the convoy and its escort at WS-0
 c4.arr=false;selA=c4Q64()?c4QK():'CR'}
// [SG4.46] SG4: from turn 6 the convoy rolls a die each turn for a relief cruiser.
function reinforce(){sg3Rein();if(scnX==='sh4'&&turn>1)sh4Spawn((turn-1)*32);if(!scn4||c4.arr||turn<(c4.helpT||6)||over)return;const r=d6();L(`Turn ${turn}: the convoy rolls a die for help: ${r}. `+(r===1?'The SOS has been received and the relief force arrives.':'No help yet.')+RL('SG4.46'));if(r!==1)return;c4.arr=true;
 const key=RELIEF[c4.race],cv=sh.filter((s,k)=>k>0&&s.merch&&!s.out);let best=[1,1],bd=-1;[[1,1],[42,1],[1,30],[42,30]].forEach(([c,rw])=>{const dm=Math.min(...(cv.length?cv:[sh[0]]).map(s=>dist({c,r:rw},s)));if(dm>bd){bd=dm;best=[c,rw]}});
 const s=mkShip(key,best[0],best[1],0,'var(--d7)','Relief '+DEFS[key].tag,[]);s.f=bestFacing(s,cv[0]||sh[0]);s.prev=15;setWS(s,'III');sh.push(s);L(`The relief force, a ${s.n}, arrives at hex ${String(best[0]).padStart(2,'0')}${String(best[1]).padStart(2,'0')} (the real rule says 35 hexes from the nearest freighter; this map is smaller) and joins the convoy side.`+RL('SG4.46'))}
function sg6Log(){return `Scenario SG6.0, Pursuit into the Asteroids: your ${sh[0].tag} (the Navy cruiser) starts in 0327 heading B, a pirate Orion CR starts in 0517 heading B at high speed, and the pirate ${c6.bats?'battle station (BATS, SG6.71)':'base station'} sits in 4017. An asteroid field fills the map (P3.1). Any unit can leave the map in any direction. Points (SG6.5): you score 1 if the CR is crippled, 3 if destroyed, 10 if captured, 4 if the base is crippled, 20 if destroyed or captured; the pirate scores 1 if you disengage, 2 if you are crippled, 5 if destroyed, 10 if captured. The higher score wins.`+RL('SG6.2, SG6.41, SG6.5, P3.11')}
function buildSG6(){ // SG6.2: Navy cruiser in 0327, CR in 0517 heading B, pirate base station in 4017
 const me=mkShip(selA,3,27,1,'var(--ca)',undefined,rfA),cr=mkShip('CR',5,17,1,'var(--d7)',undefined,optOM?omRoll():[]),bs=mkShip(c6.bats?'BATS':'BS',40,17,0,'var(--d7)',undefined,[]);me.prev=20;cr.prev=20;bs.prev=0;sh=[me,cr,bs];HUMAN_EDGES=AI_EDGES=['E','N','W','S'];selB='CR';setWS(me,'III');setWS(cr,'III');setWS(bs,'I')} // [SG6.2] both cruisers WS-III, the base WS-I
function sg6Hurt(){const cr=sh.find(s=>s.d.key==='CR');if(!scn6||!c6.hurt||!cr)return;const k=Math.floor(Math.random()*6),v=cr.sh[k];cr.sh[k]=0;applyVolley(cr,k,10,cr,'','','');cr.sh[k]=v;L(`SG6.73: ten internal damage points were scored on the pirate CR before the scenario began.`+RL('SG6.73'))} // [SG6.73] shields are bypassed by zeroing one shield for the volley
// [SG6.5] Score SG6.
function sg6End(){if(!scn6||!over||over.sg6)return;over.sg6=1;const me=sh[0],cr=sh.find(s=>s.d.key==='CR'),bs=sh.find(s=>s.d.base);
 const st=s=>s.captured?'captured':s.boom?'destroyed':(s.out&&power(s)<=0)?'destroyed':cripWhy(s).length?'crippled':s.fled?'disengaged':'intact';
 const sc=st(cr),sb=st(bs),sm=st(me);
 const navy=({captured:10,destroyed:3,crippled:1})[sc]||0,navyB=({captured:20,destroyed:20,crippled:4})[sb]||0,pir=({captured:10,destroyed:5,crippled:2,disengaged:1})[sm]||0,N=navy+navyB;
 over.win=N>pir;const t=`SG6.5 points: you ${N} (CR ${sc}: ${navy}; base ${sb}: ${navyB}), the pirate ${pir} (your ${me.tag} ${sm}). ${N>pir?'You win.':N<pir?'The pirate wins.':'A draw: the pirate holds.'}`;if(N===pir)over.win=false;over.text+=' '+t;L(t+RL('SG6.5'))}
// [SG4.5] Score SG4.
function sg4End(){if(!scn4||!over||over.sg4)return;over.sg4=1;const cap=sh.filter(s=>s.captured).length;
 if(over.win&&!cap){over.win=false;over.text+=' But you captured no freighter, and the Orion player loses unless he captures at least one (SG4.5).';L('You captured no freighter: the pirate loses.'+RL('SG4.5'))}
 else if(cap)L(`You captured ${cap} ship${cap>1?'s':''}.`+RL('SG4.5'))}
let SEC=[],revealed=false,openInfo=true,optFly=false,optEM=false;
const isCripOld=s=>{const wk=['Left W En','Right W En','Center W En'].filter(k=>k in s.d.sys),o=wk.reduce((a,k)=>a+s.d.sys[k],0),c=wk.reduce((a,k)=>a+Math.max(0,s.sys[k]||0),0);if(o>0&&c<=o*.1)return true;if(s.boom)return true;return weapons(s).length>0&&weapons(s).every(x=>!x.w.alive&&x.w.alive!==undefined)}; 
const CRIP_EXCL=['Sensor','Scanner','Damage Control','Armor'],CTRL=['Bridge','Emer Bridge','Aux Control','Flag Bridge'];
// [S2.41] The five crippled conditions A to E.
function cripWhy(s){const w=[],S=s.d.sys,cur=k=>Math.max(0,s.sys[k]||0);
 const o=warp0(s),c=pw(s,1).warp;if(o>0&&c<=o*.1)w.push('A: 10% or less of the warp engine boxes are left');
 const ik=Object.keys(S).filter(k=>!CRIP_EXCL.includes(k)),tot=ik.reduce((a,k)=>a+S[k],0),lost=ik.reduce((a,k)=>a+S[k]-cur(k),0);if(tot>0&&lost*2>=tot)w.push(`B: ${lost} of ${tot} interior boxes destroyed`);
 if(s.boom||(s.exd!==undefined&&s.exd<exdOf(s.d.key)))w.push('C: excess damage was scored');
 const ck=CTRL.filter(k=>k in S);if(ck.length&&ck.every(k=>cur(k)<=0))w.push('D: every control space is destroyed');
 const wl=[...s.ph,...s.tu,...s.di,...s.pl];if(wl.length+(s.d.sys.Drone||0)>0&&wl.every(x=>!x.alive)&&!(s.sys.Drone>0))w.push('E: every weapon is destroyed');
 return w}
const isCrip=s=>cripWhy(s).length>0; // S2.41 conditions A to E
const nimble=s=>s.key==='TPC'||s.key==='TPP'||s.key==='CR'; // C11: the Tholian PC/PC+ are nimble
const emHex=s=>nimble(s)?3:6,emCost=s=>Math.ceil(emHex(s)*s.d.mc*(hasRole(s,'nav')?.5:1)-1e-9); /* [G22.812] a legendary navigator halves the cost of EM */ // C10.11, C10.12: six hexes of movement (three for a nimble ship)
let HUMAN_EDGES=['E','N'],AI_EDGES=['W','S']; // SG1.41: the ship starting in 4203 may leave by 42xx or xx01, the one in 0730 by 01xx or xx30
const EDGE_NAME={get E(){return'east edge (column '+COLS+')'},N:'north edge (row 01)',W:'west edge (column 01)',get S(){return'south edge (row '+ROWS+')'}};
// [C9.1, C9.2] Flywheel: the speed that counts as previous speed for the acceleration limit.
const fwBase=s=>optFly&&!s.fwDead&&s.hist&&s.hist.length?Math.max(s.prev,...s.hist):s.prev;
// [C3.5] The direction of movement (forward or reverse) the ship currently has.
const dirNow=s=>(s.dirSet===turn?s.dir0:s.dir)||0;
// [C3.5] The direction of movement the plan asks for.
const wantDir=(s,p)=>!optRev?dirNow(s):p.rev===undefined?dirNow(s):(p.rev?1:0);
// [C3.52] Braking energy to reverse: the movement cost of the previous speed.
const brkFull=s=>Math.ceil((s.brkSp!==undefined?s.brkSp:(s.prev||0))*s.d.mc-1e-9);
// [C3.5] A change of direction needs braking energy.
const needBrk=(s,p)=>wantDir(s,p)!==dirNow(s)&&brkFull(s)>0;
// [C3.5, C3.6] Braking energy actually paid in the plan (a shortfall is a quick reverse).
const brkPaid=(s,p)=>needBrk(s,p)?Math.max(0,Math.min(brkFull(s),p.brk===undefined?brkFull(s):p.brk)):0;
// [C12.1, C12.13] Speed on each impulse of the turn from the plotted speed changes.
function spdPlot(p){const a=[],ch=(optChg&&p.chg||[]).slice().sort((x,y)=>x.e-y.e);let v=p.spd;for(let i=1;i<=32;i++){ch.forEach(c=>{if(c.e===i)v=c.v});a[i]=v}return a}
// [C12.1] Hexes moved in a turn under the plotted speed changes (what movement energy pays for).
function plotHexes(p){if(!(optChg&&p.chg||[]).length)return p.spd;const a=spdPlot(p);let n=0;for(let i=1;i<=32;i++)if(moves(a[i],i))n++;return n}
const accLim=(s,p)=>{const b0=fwBase(s),b=(!optFly&&s.lowPrev!==undefined)?Math.min(b0,s.lowPrev):b0;let l=Math.min(s.d.dbl?30:31,b+Math.max(b,10));if(s.d.base)l=0; // C3.7: a base does not move
 if(s.d.acc)l=Math.min(l,b+s.d.acc);if(s.d.q)l=Math.min(l,Math.max(b+5,b*2)); // R1.7C: a Q-ship gains five movement points a turn or doubles its speed, whichever is greater
  // R1.5/R1.6: a freighter gains only 3 (small) or 4 (large) movement points a turn
  // G15.26: an Orion cannot generate more than 30 movement points
 if(p&&needBrk(s,p))l=10;if(hasCrit(s,'man'))l=Math.min(l,8);if(hasCrit(s,'warp'))l=Math.min(l,1);return l};
// [C9.2] Flywheel history: record this turn's speed.
function fwTurn(s){if(!optFly)return;s.hist=s.hist||[];if(s.hReset){s.hist=[];s.hReset=false}else{s.hist.push(s.plan.spd);if(s.hist.length>4)s.hist.shift()}}
const LS=(t,secret)=>{if(secret&&!over&&!openInfo&&typeof sh!=='undefined')SEC.push(`Turn ${turn}${phase==='run'?', impulse '+imp:''}: ${t}`);else L(t)};
const RL=c=>` [${c}]`;
