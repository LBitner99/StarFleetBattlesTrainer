/* ================= Scripted scenarios from the Basic Set scenario section (SG7, SH1 and later) =================
   Each entry in SCX describes one scenario: btn/tip (the button), ttl (title bar), code and name (rule number and name),
   go (start button text), opp() (opponent line), txt() (mission line), sub() (line under the map), log() (first log line),
   pick() (set the ship choice when the scenario is selected), build() (place the ships), he/ae (the edges you and the computer may leave by),
   float (floating map; default yes), mod (Modified Victory Conditions, S2.201: no points for the starting BPV difference). */
const SCX={
 sg7:{btn:'Big game',tip:'The Pirates Go for Big Game (SG7): a Navy cruiser against three Orion raiders',ttl:'The Pirates Go for Big Game &middot; Scenario SG7.0',code:'SG7.0',name:'SG7.0, The Pirates Go for Big Game',go:'Start the ambush',mod:true,
  opp:()=>`3 x Orion CR (${3*DEFS.CR.pv} BPV)`,
  txt:()=>`caught by three Orion raiders: one is on his tail, two wait on the flanks. <span class="mu">Cripple one raider with each alpha strike and keep your speed up so you can leave (SG7.8). Modified victory conditions (SG7.5).</span>`,
  sub:()=>'against three Orion raiders',
  log:()=>`Scenario SG7.0, The Pirates Go for Big Game: your ${sh[0].tag} starts in 2203 heading D at high speed. One Orion CR is in 2219 heading D at high speed, the others in 0725 (heading B) and 3625 (heading F), both at speed 4. All ships start at Weapon Status III. The map floats and any unit can leave by any edge (SG7.41). Victory uses the Modified Victory Conditions (S2.201): no points for the starting BPV difference.`+RL('SG7.2, SG7.41, SG7.5, S2.201'),
  pick(){selB='CR';XE=[];XF=[];selTab=[0,0];if(['ori','civ','bas'].includes(SHIPS[selA].side))selA='CA'},
  build(){const me=mkShip(selA,22,3,3,'var(--ca)',undefined,rfA); // [SG7.2] Navy ship in 2203 heading D
   const cr=[[22,19,3,20],[7,25,1,4],[36,25,5,4]].map((p,i)=>{const s=mkShip('CR',p[0],p[1],p[2],'var(--d7)','CR-'+(i+1),[]);s.prev=s.sp=p[3];setWS(s,'III');return s}); // [SG7.2] CRs in 2219 (speed max), 0725 and 3625 (speed 4), WS-III
   me.prev=me.sp=20;me.tm=0;setWS(me,'III');sh=[me,...cr];selB='CR'}},
 sh1:{btn:'Sabotage',tip:'Sabotage (SH1, Y161): your Federation cruiser has sabotaged warp engines and a Klingon D7 is closing in',ttl:'Sabotage &middot; Scenario SH1.0',code:'SH1.0',name:'SH1.0, Sabotage',go:'Start the scenario',he:['E','S'],ae:['W','N'],
  opp:()=>`Klingon D7 (${DEFS.D7.pv} BPV)`,
  txt:()=>`the Federation heavy cruiser Kongo, warp engines sabotaged and speed 1, against the Klingon D7 Antagonist. <span class="mu">Repair the engines before the D7 arrives (SH1.45). You score a 25 point bonus (SH1.5).</span>`,
  sub:()=>'with sabotaged warp engines against a Klingon D7',
  log:()=>`Scenario SH1.0, Sabotage (Y161): your Federation CA Kongo is in 0823 heading B at speed 1, Weapon Status 0, and its warp engines have been sabotaged: they cannot be used for anything until repaired (SH1.45). From turn 2 you roll a die each turn before Energy Allocation and the repair is done when the total reaches 13, or you may try a crash start (a 1 starts the engines, any other number gets nothing, SH1.452). The Klingon D7 Antagonist is in 0405 heading D at high speed, Weapon Status III. No refits, all drones are slow (speed 8). The Federation player scores a 25 point bonus (SH1.5). The map floats; you may leave by the south or east edge, the Klingon by the north or west edge (SH1.41).`+RL('SH1.2, SH1.41, SH1.44, SH1.45, SH1.432'),
  pick(){selA='CA';selB='D7';XE=[];XF=[];selTab=[0,0];rfA=[];rfB=[]},
  build(){selA='CA';selB='D7';rfA=[];rfB=[];dtype='I'; // [SH1.44] no refits, [SH1.432] all drones slow (speed 8)
   const k=mkShip('CA',8,23,1,'var(--ca)',undefined,[]),d=mkShip('D7',4,5,3,'var(--d7)',undefined,[]); // [SH1.2] CA in 0823 heading B, D7 in 0405 heading D
   k.prev=k.sp=1;d.prev=d.sp=20;k.tm=0;setWS(k,'0');setWS(d,'III');k.sab=true;k.sabSum=0;k.sabT=0;sh=[k,d]}} // [SH1.45] warp engines sabotaged
};
// [SH1.45, SH1.451, SH1.452] The sabotaged Federation warp engines: pw() gives no warp power while s.sab is set. Before Energy Allocation on turn 2 and later the player picks a method and rolls once.
const sabPending=()=>{const s=sh[0];return !!(scnX==='sh1'&&s&&s.sab&&turn>1&&s.sabT!==turn&&phase==='ea'&&!over)};
function sabDo(mode){const s=sh[0];if(!sabPending())return;s.sabT=turn;const d=d6();
 if(mode==='crash'){if(d===1){s.sab=false;L(`Turn ${turn}: crash start (SH1.452): you rolled 1 and the warp engines start at once.`+RL('SH1.452'))}else L(`Turn ${turn}: crash start (SH1.452): you rolled ${d}, the attempt fails and the engines stay dead. The roll is not added to the total (${s.sabSum} of 13).`+RL('SH1.452'))}
 else{s.sabSum+=d;if(s.sabSum>=13){s.sab=false;L(`Turn ${turn}: repair roll (SH1.451): you rolled ${d}, the total is ${s.sabSum} and the warp engines are repaired.`+RL('SH1.451'))}else L(`Turn ${turn}: repair roll (SH1.451): you rolled ${d}; the total is ${s.sabSum} of 13.`+RL('SH1.451'))}
 plan0=autoPlan(sh[0],TG(),'normal',true);fit(sh[0],plan0);draw()}
const sabUI=()=>{const s=sh[0];return `<div class="card" style="margin:6px 0"><b>Sabotaged warp engines (SH1.45)</b><p style="margin:4px 0">Your warp engines are still dead (repair total ${s.sabSum} of 13). Choose one method before Energy Allocation and roll once. <button onclick="sabDo('roll')">Roll for repair (add to the total)</button> <button onclick="sabDo('crash')">Crash start (a 1 starts them, otherwise nothing)</button></p></div>`};

