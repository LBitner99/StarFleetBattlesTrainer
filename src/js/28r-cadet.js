/* [A4.0 to A4.4] The Cadet's Game: a staircase of Duels that adds one weapon system at a time. Chosen in the Mission box beside the scenario (plain Duel only).
   A4.1 phasers only (CA against D7); A4.2 photon torpedoes (CA against CA), disruptors (D7 against D7), then the CA against the D7 with overloads (A5.0);
   A4.3 the D7's drones, then the CA's refit rack too, then plasma (Gorn CA without refits against the Federation CA or the D7); A4.4 is the full game ("Assume command").
   Steps use the Basic rules level. Weapons a step does not teach are taken off the ships (their SSD boxes still show). F1.21: drones launch at the start of the turn (impulse 1), plasma at the end (impulse 32).
   The Cadet drone is the Basic Set drone: speed 20, 4 damage points, 12 points of warhead (A4.3). "Either ship can concede" (A4.1): the Concede button always works.
   Not built: the FD2.0 reload rules are ignored by not using them (the reload row is simply not needed), and the 5 to 6 turn guidance of A4.1 is advice, not a limit. */
let cadet='';
const CAD={
 a1:{n:'A4.1 Phasers',A:'CA',B:'D7',rfA:[],rfB:[],w:'',txt:'Phasers only: no photon torpedoes, disruptors or drones. Learn movement, energy allocation, shields and phaser fire. Play it once and stop after five or six turns.'},
 a2p:{n:'A4.2 Photon torpedoes',A:'CA',B:'CA',rfA:[],rfB:[],w:'t',txt:'Two Federation heavy cruisers: arm and fire photon torpedoes (E4.0 to E4.2), no overloads.'},
 a2d:{n:'A4.2 Disruptors',A:'D7',B:'D7',rfA:[],rfB:[],w:'d',txt:'Two Klingon D7s: energize and fire disruptors (E3.0 to E3.3), no overloads.'},
 a2o:{n:'A4.2 CA v D7, overloads',A:'CA',B:'D7',rfA:[],rfB:[],w:'tdo',txt:'The basic duel of the sample game (A5.0): photons and disruptors, with overloads. Overload range (8 hexes) is the key tactical point.'},
 a3d:{n:'A4.3 D7 drones',A:'CA',B:'D7',rfA:[],rfB:[],w:'tdok1',txt:'As before, and the D7 may now use its two drone racks (four drones each, one launch a turn per rack, 8 impulses apart). Drones: speed 20, 4 damage points, 12 warhead.'},
 a3b:{n:'A4.3 Drones both sides',A:'CA',B:'D7',rfA:['plus'],rfB:[],w:'tdok2',txt:'Both ships use drones: the CA flies its refit (CA+) with its one drone rack.'},
 a3p:{n:'A4.3 Gorn plasma',A:'GCA',B:'CA',rfA:[],rfB:[],w:'tdokp2',txt:'A Gorn heavy cruiser without refits against the Federation CA (then try the D7): plasma torpedoes arm over three turns and are launched at the end of the turn (F1.21).'}};
function setCadet(v){cadet=CAD[v]?v:'';if(cadet){const c=CAD[cadet];setScn('duel');setLevel('basic');selA=c.A;selB=c.B;rfA=c.rfA.slice();rfB=c.rfB.slice();XE=[];XF=[];selTab=[0,0];optOvl=c.w.includes('o');dtype='B'}drawSel()}
const cadOn=()=>!!cadet&&!scr();
// Strip the weapons a step does not teach (called once the ships are built).
function cadetApply(){if(!cadOn())return;const c=CAD[cadet],w=c.w;
 sh.forEach(s=>{if(s.d.base||s.neu)return;if(!w.includes('t'))s.tu=[];if(!w.includes('d'))s.di=[];if(!w.includes('p'))s.pl=[];
  const kl=s.d.side==='kli';if(!(w.includes('k2')||(w.includes('k1')&&kl)))s.rk=[];s.ad=[]});
 L(`Cadet's Game, ${c.n}: ${c.txt} Basic rules level; either ship may concede.`+RL('A4.0, A4.1, A4.2, A4.3'))}
// [F1.21] Drone launch phase is the start of the turn, plasma launch the end of the turn.
const cadLaunchWhy=(i,pl)=>!cadOn()?'':pl?(i===32?'':'Cadet game: plasma torpedoes are launched at the end of the turn (F1.21)'):(i===1?'':'Cadet game: drones are launched at the start of the turn (F1.21)');

/* ===== Cadet's Tutorial (A4.0 to A4.3): a guided walk through the sections, one scenario at a time =====
   Menu (button in the Mission box) -> start a section -> call-outs appear when the situation they teach comes up (once each) ->
   when the scenario ends a card offers the next section or the new game page. Progress (sections finished) is kept in this browser only. */
let tut=null,tutQ=[],tutBusy=false;
const TUTGRP=[
 {id:'A4.1',n:'First Cadet Scenario: Combat with Phasers',s:['a1']},
 {id:'A4.2',n:'Second Cadet Scenario: Combat with Heavy Weapons',s:['a2p','a2d','a2o']},
 {id:'A4.3',n:'Third Cadet Scenario: Combat with Seeking Weapons',s:['a3d','a3b','a3p']}];
const TUTSTEPS=Object.keys(CAD);
const tutDone=()=>{try{return JSON.parse(localStorage.getItem('sfbTut')||'{}')}catch(e){return {}}};
const tutMark=k=>{try{const d=tutDone();d[k]=1;localStorage.setItem('sfbTut',JSON.stringify(d))}catch(e){}};
const tutEl=id=>{let e=document.getElementById(id);if(e)e.remove();e=document.createElement('div');e.id=id;document.body.appendChild(e);return e};
function tutMenu(){const w=tutEl('tutm'),d=tutDone();w.style.cssText='position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,.6);overflow:auto;padding:16px';
 w.innerHTML=`<div class="card" style="max-width:720px;margin:0 auto"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Cadet's Tutorial</h2><button onclick="document.getElementById('tutm').remove()">Close</button></div>
 <p class="mu">The Cadet's Game (A4.0) is the way into Star Fleet Battles: each section is a Duel that adds one kind of weapon, with call-outs that explain what you are looking at as it comes up. Pick where to begin. When a section ends you can go on to the next or go back here.</p>
 ${TUTGRP.map(g=>`<h3 style="margin:12px 0 4px"><span class="rl" data-r="${g.id}" tabindex="0" role="button">${g.id}</span> ${g.n}</h3>`+g.s.map(k=>`<div class="row" style="justify-content:space-between;align-items:center;margin:3px 0;padding:6px 8px;border:1px solid var(--line,#345);border-radius:8px"><span><b>${CAD[k].n}</b>${d[k]?' <span style="color:#2bff6a">&#10003; done</span>':''}<br><span class="mu">${CAD[k].txt}</span></span><button class="pri" onclick="tutStart('${k}')">${d[k]?'Play again':'Start'}</button></div>`).join('')).join('')}
 <p class="mu" style="margin-top:10px">A4.4, Assume Command!: after the last section, close this and play any Duel from the setup page.</p></div>`}
function tutStart(k){const m=document.getElementById('tutm');if(m)m.remove();tut=null;setCadet(k);startGame();tut={k,seen:{},ended:false};tutQ=[];draw()}
// Conditions the call-outs wait for.
const T={me:()=>sh[0],foe:()=>foeOf(sh[0]),rng:()=>dist(sh[0],foeOf(sh[0])),ea:n=>phase==='ea'&&turn===n,run:()=>phase==='run'&&imp>=1,
 near:n=>phase==='run'&&dist(sh[0],foeOf(sh[0]))<=n,
 ready:()=>phase==='run'&&weapons(sh[0]).some(x=>{try{return wStatus(sh[0],x,foeOf(sh[0])).ok}catch(e){return false}}),
 armed:()=>phase==='run'&&sh[0].tu.some(x=>x.state==='armed'),
 dis:()=>phase==='run'&&sh[0].di.some(x=>x.armed),
 tookHit:()=>log.some(l=>l.includes('hits '+sh[0].tag+' shield')||l.includes('detonates for')&&l.includes(sh[0].tag)),
 gaveHit:()=>log.some(l=>l.includes('hits '+foeOf(sh[0]).tag+' shield')),
 myDr:()=>DR.some(d=>d.own===sh[0]&&!d.ft&&!d.pl&&!d.ss&&!d.shu),foeDr:()=>DR.some(d=>d.own!==sh[0]&&!d.ft&&!d.pl&&!d.ss&&!d.shu&&d.own.tm!==0),
 myPl:()=>DR.some(d=>d.own===sh[0]&&d.pl),turnGE:n=>turn>=n};
const TIPS={
 a1:[
  {id:'in',w:()=>T.ea(1),t:'A4.1: Combat with phasers',b:'Your Federation CA fights a Klingon D7 using phasers only. Before you start, the rulebook asks you to read B2.1, B2.3, B3.0, C1.1 to C1.4, C2.0, C3.0, D1.0 to D4.0, E1.0, E2.0 and H1.0 to H6.0; the call-outs below point at each as it comes up. This is a peacetime patrol meeting: either ship can concede (A4.1) and the other is the victor. Play it once and stop after five or six turns.'},
  {id:'ea',w:()=>T.ea(1),t:'Energy allocation (B3.0)',b:'Every turn begins by deciding where your power goes before anything moves. Your warp engines make the power (H1.0, H2.0); you spend it on movement (C2.0: one point a hex at the ship\'s movement cost), shields (D3.0), phaser capacitors (E2.3), life support and fire control (B3.1). Unspent power is wasted, so put what is left into shields. A sensible first turn: a moderate speed, shields at minimum or better, and fill the phaser capacitors. Allocation is secret from your opponent (B3.5).'},
  {id:'mv',w:()=>T.run(),t:'Movement and impulses (B2.1, C1.1, C1.2)',b:'A turn has 32 impulses. A ship at speed N moves on N of them, spread out by the Impulse Chart (C1.2). Ships move in the direction they face (C1.31) and may turn only after moving straight for the number of hexes in their turn mode (C3.0): the CA has to fly a few hexes before each 60 degree turn. The Turn buttons set your next move; the preview arrow shows where it lands.'},
  {id:'rng',w:()=>T.near(25),t:'Range and phasers (E1.0, E2.0)',b:'Phaser damage falls as the range grows (see the phaser table in E2.0): a Ph-1 does the most at point-blank and reaches out to 75 hexes. Closing to short range makes your shots count, but it also lets the D7\'s phasers count against you. Phasers need power in the capacitor to fire (E2.3) and each weapon can fire once per turn per eight impulses (E1.5).'},
  {id:'arc',w:()=>T.near(15),t:'Arcs and shields (D2.0, D3.0)',b:'Weapons fire only into their firing arc (D2.0): the target must be inside the arc printed beside the weapon. Each ship has six shields facing the six hex sides; a shot hits the shield facing the shooter, so keep your strongest-facing shield toward the enemy and turn to present a fresh one.'},
  {id:'fire',w:()=>T.ready(),t:'Fire decision (D1.0, E1.0)',b:'The game stops when a weapon can reach the target. Choose which phasers to fire and press Fire: damage is rolled on the weapon\'s chart (E1.2) with the range and electronic warfare modifiers (D6.0). Shots at long range often miss; holding fire until the range closes saves capacitor energy for later (E2.3).'},
  {id:'hit',w:()=>T.tookHit(),t:'You were hit (D3.0, D4.0)',b:'Damage first strips the shield on the facing the shot arrived on (D3.0). Once that shield is gone, the remainder goes through to the ship\'s systems: each point you take rolls on the damage allocation chart (D4.0) and destroys a box on your SSD, which can knock out weapons, power or movement. Reinforcing a shield with spare power (D3.3) stops damage before it gets through.'},
  {id:'gave',w:()=>T.gaveHit(),t:'A hit on the enemy',b:'Watch the log for the enemy shield you struck. Concentrate fire on one shield to break through to internal systems, and hit the weakened side again as it turns away.'},
  {id:'end',w:()=>T.turnGE(5),t:'How this scenario ends',b:'Play on until one ship is crippled or destroyed, or concede (A4.1). The rulebook suggests five or six turns for this first scenario: by then you will be ready for more advanced combat. You win by destroying the enemy or driving it off, scored by BPV (S2.0).'}],
 a2p:[
  {id:'in',w:()=>T.ea(1),t:'A4.2: Photon torpedoes (E4.0 to E4.2)',b:'Two Federation heavy cruisers. Read E4.0, E4.1 and E4.2 first; the rulebook says to fight two CAs to get a feel for arming and firing photons. No overloads yet (E4.4 comes later). Your four photon tubes are the CA\'s main punch.'},
  {id:'arm',w:()=>T.ea(1),t:'Arming a photon (E4.21)',b:'A photon torpedo takes two turns of energy to arm: two points one turn and two the next (2 + 2), spread across the turn. Allocate arming energy to a tube in Energy Allocation. It cannot fire before the second payment; a half-armed tube shows as "half". Four tubes cost a lot of power, so you may arm two at a time and keep speed lower.'},
  {id:'arm2',w:()=>T.ea(2),t:'Second turn of arming',b:'Pay the second half now: tubes that were half armed last turn finish arming this turn and can fire as soon as the turn begins. An armed torpedo can be held for the next turn at a small energy cost, so you can wait for the right range.'},
  {id:'rng',w:()=>T.near(20),t:'Photon range (E4.1, E4.2)',b:'A photon torpedo does 8 points when it hits, but it has to hit: it cannot hit at range 0 to 1; at range 2 it hits on a die of 1 to 5, at 3 to 4 on 1 to 4, at 5 to 8 on 1 to 3, at 9 to 12 on 1 or 2, and from 13 to 30 only on a 1. Close in, but stay out of range 1.'},
  {id:'fire',w:()=>T.armed()&&T.ready(),t:'Fire the photons (E4.2)',b:'An armed tube can fire when the target is inside its arc (forward arc for the CA\'s photons) and in range. The roll is made at the moment of firing; a miss wastes the torpedo. Fire a salvo together to overwhelm the shield on one facing, then arm again.'},
  {id:'hit',w:()=>T.tookHit(),t:'Damage from a torpedo',b:'A photon hit does 8 points to the shield on that facing, so a salvo of several torpedoes can burn through a shield in one volley. Shield reinforcement (D3.3) and presenting a fresh facing absorb some of it.'}],
 a2d:[
  {id:'in',w:()=>T.ea(1),t:'A4.2: Disruptors (E3.0 to E3.3)',b:'Two Klingon D7 battlecruisers. Read E3.0, E3.1, E3.2 and E3.3 first. The D7\'s heavy weapons are its disruptors; no overloads in this step (E3.5 comes next).'},
  {id:'en',w:()=>T.ea(1),t:'Energizing a disruptor (E3.2)',b:'A disruptor is powered at the start of the turn by one point of energy per shot and can then fire during that turn. Power it in Energy Allocation; unlike a photon it needs no multi-turn arming, but it only fires once every eight impulses (E1.5).'},
  {id:'rng',w:()=>T.near(30),t:'Disruptor range and damage (E3.3)',b:'A disruptor reaches 30 hexes. Both its hit chance and its damage fall with range: at range 1 it hits on a die of 1 to 5 for 5 points; at 23 to 30 it hits only on a 1 or 2 for 2 points (disruptor chart, E3.0).'},
  {id:'fire',w:()=>T.dis()&&T.ready(),t:'Firing disruptors',b:'Disruptors fire into their arc like phasers (D2.0). Fire them when the range makes a hit probable, and keep a few phasers for the weapon-by-weapon finish.'},
  {id:'hit',w:()=>T.tookHit(),t:'Taking a hit',b:'The same shield and damage rules apply to everyone (D3.0, D4.0). Compare how quickly a shield falls to disruptors vs photons.'}],
 a2o:[
  {id:'in',w:()=>T.ea(1),t:'A4.2: the basic duel with overloads (A5.0)',b:'Now the real duel: a Federation CA against a Klingon D7, using your photons, disruptors and overloads. The rulebook uses the A5.0 sample game as this step, with overloaded weapons because the overload range (8 hexes) decides the fight.'},
  {id:'ovl',w:()=>T.ea(1),t:'Overloaded weapons (E3.5, E4.4)',b:'You can put double energy into a disruptor (E3.5) or a photon (E4.4) to double its damage, but an overloaded weapon can only be fired at range 8 or less. The winner is often the ship that controls the range.'},
  {id:'r8',w:()=>T.near(10),t:'Overload range: 8 hexes',b:'An overloaded weapon can only be fired at range 8 or less. Decide now whether to close to 8 or stay out and use plain weapons.'},
  {id:'fire',w:()=>T.ready(),t:'Your shot',b:'Fire the weapons you armed. Overloads are shown on the tube (OVL).'},
  {id:'hit',w:()=>T.tookHit(),t:'Damage goes through',b:'An overloaded volley can break a shield and continue into the ship: read the log for how many points went through and where (D4.0).'}],
 a3d:[
  {id:'in',w:()=>T.ea(1),t:'A4.3: Combat with seeking weapons',b:'Drones are small unmanned missiles that chase a target. Read F1.1, F1.21, F2.11, F2.12, F2.2, F2.3, F3.1, FD1.1 to FD1.4, FD1.51 to FD1.55 (skip FD1.53), FD1.6, FD3.1, FD4.1, FD4.2 and FD5.3. The D7 now uses its drones: two racks of four, one launch a turn from each rack and not within 8 impulses of that rack\'s previous launch. Each drone is speed 20, takes 4 damage points to destroy and does 12 points to the ship it hits. Ignore FD2.0 (reloads).'},
  {id:'launch',w:()=>T.ea(1),t:'Launching a drone (F1.21, FD3.1)',b:'In the Cadet\'s Game drones are launched at the start of the turn, so the launch buttons are available only on impulse 1 (F1.21). Each launched drone takes one of your control channels (F3.1); you can only keep as many in flight as your sensor rating allows.'},
  {id:'fly',w:()=>T.foeDr(),t:'An enemy drone is chasing you (F2.0, FD1.1)',b:'A drone moves at its own speed (20 means it moves 20 hexes a turn, FD1.4) and steers itself to the target by the most direct route (F2.2). It lasts three turns (its endurance). It explodes when it reaches your hex.'},
  {id:'shoot',w:()=>T.foeDr()&&T.ready(),t:'Shoot it down (FD1.5)',b:'Drones are destroyed by 4 points of damage (FD1.5); your phasers can fire at them: choose the drone as the target in the fire table. A drone you destroy cannot hurt you, but phaser shots used on it are not used on the ship.'},
  {id:'ecm',w:()=>T.foeDr(),t:'Electronic warfare helps (D6.0)',b:'Electronic counter-measures can reduce the damage a drone does when it reaches you (D6.36). Spare power into ECM when drones are coming.'},
  {id:'hit',w:()=>T.tookHit(),t:'A drone hit',b:'A drone does its 12 points to the shield facing it when it arrives. Compare it to a photon: it is slower and can be shot, but you cannot dodge it forever.'}],
 a3b:[
  {id:'in',w:()=>T.ea(1),t:'A4.3: drones on both sides',b:'Now the CA flies its refit (CA+) with one drone rack as well (FD1.56 and F2.5 add refinements). Both ships can launch drones and shoot the other\'s drones: the question is whether to spend your phasers on drones or on the ship.'},
  {id:'mine',w:()=>T.ea(1),t:'Your drone rack (FD3.1)',b:'Your rack launches one drone a turn, at the start of the turn only (F1.21). The drone chases the enemy ship and counts against your control channels (F3.1).'},
  {id:'fly',w:()=>T.myDr(),t:'Your drone is in flight',b:'It steers itself. The enemy will try to shoot it down; saturating the defence with more than one drone is how drones win.'},
  {id:'foe',w:()=>T.foeDr(),t:'Enemy drones in flight',b:'Use phasers on the drones (FD1.5) only as they get close, and keep the shield facing them strong.'},
  {id:'hit',w:()=>T.tookHit(),t:'Hit',b:'Every point that gets through is rolled on the damage chart (D4.0).'}],
 a3p:[
  {id:'in',w:()=>T.ea(1),t:'A4.3: Plasma torpedoes (FP1.1 to FP1.6)',b:'A Gorn heavy cruiser without refits against the Federation CA. Read FP1.1 to FP1.6, FP2.3, FP2.5, FP3.1, FP4.1 and FP4.2. Plasma torpedoes are big seeking weapons: they hit very hard but must be armed over several turns, and they weaken the farther they fly.'},
  {id:'arm',w:()=>T.ea(1),t:'Arming plasma (FP1.1 to FP1.3)',b:'A plasma launcher takes several turns of energy to arm, then launches the torpedo or holds it. Plan so both launchers are not empty at the same time.'},
  {id:'launch',w:()=>T.ea(1),t:'Launch time (F1.21)',b:'In the Cadet\'s Game plasma torpedoes are launched at the end of the turn (impulse 32); drones at the start. The torpedo then flies and impacts during the next turn.'},
  {id:'fly',w:()=>T.myPl(),t:'Your torpedo is flying (FP2.3, FP4.1)',b:'A plasma torpedo moves 32 hexes a turn, steers itself and loses warhead strength with every hex it flies (FP2.3), so launching from closer does more damage. Phasers can shoot it down.'},
  {id:'hit',w:()=>T.tookHit(),t:'Hit',b:'Plasma damage is a large single blow: reinforce the shield facing the torpedo if you can (D3.3).'}]};
function tutCard(tip,k){const w=tutEl('tutc');w.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99996;width:min(640px,94vw);box-shadow:0 8px 30px rgba(0,0,0,.6)';
 w.innerHTML=`<div class="card" style="border:2px solid #ffd84a"><div class="row" style="justify-content:space-between;align-items:center"><b style="color:#ffd84a">Cadet's Tutorial &middot; ${CAD[k].n}</b><button onclick="tutOk()">Got it</button></div><h3 style="margin:6px 0 4px">${tip.t}</h3><p style="margin:0;line-height:1.45">${tip.b}</p></div>`}
function tutOk(){const e=document.getElementById('tutc');if(e)e.remove();tutBusy=false;tutCheck()}
function tutCheck(){
 if(!started){if(tut&&!tut.keep){tut=null;cadet=''}const e=document.getElementById('tutc');if(e)e.remove();tutBusy=false;return}
 if(!tut||!cadOn())return;
 if(over){if(!tut.ended){tut.ended=true;tutBusy=false;const e=document.getElementById('tutc');if(e)e.remove();tutEnd()}return}
 if(tutBusy)return;const list=TIPS[tut.k]||[];for(const tip of list){if(tut.seen[tip.id])continue;let ok=false;try{ok=!!tip.w()}catch(e){}if(ok){tut.seen[tip.id]=1;tutBusy=true;tutCard(tip,tut.k);return}}}
function tutEnd(){const k=tut.k,i=TUTSTEPS.indexOf(k),nx=TUTSTEPS[i+1],win=!!over.win;tutMark(k);const w=tutEl('tute');w.style.cssText='position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
 w.innerHTML=`<div class="card" style="max-width:520px"><h2 style="margin:0 0 6px">Section complete</h2><p><b>${CAD[k].n}</b> is over: ${over.text}</p>${nx?`<p class="mu">Next: <b>${CAD[nx].n}</b>. ${CAD[nx].txt}</p>`:`<p class="mu">That was the last section. Next is A4.4, Assume Command!: play any Duel from the setup page and read the rules that catch your interest.</p>`}
 <div class="row" style="gap:8px;justify-content:flex-end"><button onclick="tutAgain('${k}')">Replay this section</button><button onclick="tutBack()">New game page</button>${nx?`<button class="pri" onclick="tutNext('${nx}')">Continue to the next section</button>`:''}</div></div>`}
function tutNext(k){const e=document.getElementById('tute');if(e)e.remove();tutStart(k)}
function tutAgain(k){const e=document.getElementById('tute');if(e)e.remove();tutStart(k)}
function tutBack(){const e=document.getElementById('tute');if(e)e.remove();tut=null;cadet='';toSelect()}
function tutHook(){const d0=draw;draw=function(){const r=d0.apply(this,arguments);try{tutCheck()}catch(e){}return r}}
