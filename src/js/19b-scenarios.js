const SG2L={"fed": [["1xDN, 1xCA, 2xCL", "DN CA CL CL"], ["1xCC, 2xCA", "CC CA CA"], ["1xCC, 1xCA, 2xCL", "CC CA CL CL"], ["1xBT, 2xCL", "BT CL CL"], ["1xBT, 3xDD", "BT DD DD DD"], ["1xDN, 1xCA, 1xDD, 1xSC", "DN CA DD SC"], ["1xCC, 1xCA, 3xDD", "CC CA DD DD DD"]], "kli": [["1xD7, 3xD6", "D7 D6 D6 D6"], ["3xD7", "D7 D7 D7"], ["1xC8, 1xD7, 1xD6, 1xF5", "C8 D7 D6 F5"], ["1xC8, 2xD6, 2xF5", "C8 D6 D6 F5 F5"], ["2xD6, 2xF5, 2xE4", "D6 D6 F5 F5 E4 E4"]], "kzi": [["1xCS, 3xCL", "KCS KCL KCL KCL"], ["2xCS, 2xCL", "KCS KCS KCL KCL"], ["1xCV, 2xCL, 1xFF", "CV KCL KCL KFF"], ["1xCV, 1xCS, 1xCL, 2xFF", "CV KCS KCL KFF KFF"]], "rom": [["4xWB+", "WB WB WB WB"], ["3xWE", "WE WE WE"], ["3xKR", "KR KR KR"], ["1xKR, 2xWE, 2xWB+", "KR WE WE WB WB"], ["2xKR, 2xK5R", "KR KR K5R K5R"], ["2xWE, 2xK5R", "WE WE K5R K5R"]], "gor": [["2xCA, 2xCL", "GCA GCA GCL GCL"], ["3xCA", "GCA GCA GCA"], ["2xCA, 3xDD", "GCA GCA GDD GDD GDD"], ["2xCA, 1xCL, 2xDD", "GCA GCA GCL GDD GDD"]]},SG2R={fed:'Federation',kli:'Klingon',kzi:'Kzinti',rom:'Romulan',gor:'Gorn'};let sg2s=['fed:1','kli:1'];
// [SG2.6] Possible forces: the list for each race, picked from a menu; the first ship goes on tab 0 and the rest on the extra-ship tabs. Ships the game does not have yet are played as the nearest ship (SG2.62).
function sg2Set(w,v){const [r,i]=v.split(':'),ks=SG2L[r][+i][1].split(' ');sg2s[w]=v;if(w){selB=ks[0];rfB=[];XE=ks.slice(1).map(k=>({k,rf:[]}))}else{selA=ks[0];rfA=[];XF=ks.slice(1).map(k=>({k,rf:[]}))}selTab[w]=0}
function sg2Pick(w,v){sg2Set(w,v);drawSel()}
const sg2Menu=w=>`<select onchange="sg2Pick(${w},this.value)" aria-label="${w?'Computer':'Your'} force">${Object.keys(SG2L).map(r=>`<optgroup label="${SG2R[r]}">${SG2L[r].map((f,i)=>`<option value="${r}:${i}" ${sg2s[w]===r+':'+i?'selected':''}>${f[0]}</option>`).join('')}</optgroup>`).join('')}</select>`;
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
   const cr=[[22,19,3,20],[7,25,1,4],[36,25,5,4]].map((p,i)=>{const s=mkShip('CR',p[0],p[1],p[2],'var(--d7)','CR-'+(i+1),optOM?omRoll():[]);s.prev=s.sp=p[3];setWS(s,'III');return s}); // [SG7.2] CRs in 2219 (speed max), 0725 and 3625 (speed 4), WS-III
   me.prev=me.sp=20;me.tm=0;setWS(me,'III');sh=[me,...cr];selB='CR'}},
 sh1:{btn:'Sabotage',tip:'Sabotage (SH1, Y161): your Federation cruiser has sabotaged warp engines and a Klingon D7 is closing in',ttl:'Sabotage &middot; Scenario SH1.0',code:'SH1.0',name:'SH1.0, Sabotage',go:'Start the scenario',he:['E','S'],ae:['W','N'],
  opp:()=>`Klingon D7 (${DEFS.D7.pv} BPV)`,
  txt:()=>`the Federation heavy cruiser Kongo, warp engines sabotaged and speed 1, against the Klingon D7 Antagonist. <span class="mu">Repair the engines before the D7 arrives (SH1.45). You score a 25 point bonus (SH1.5).</span>`,
  sub:()=>'with sabotaged warp engines against a Klingon D7',
  log:()=>`Scenario SH1.0, Sabotage (Y161): your Federation CA Kongo is in 0823 heading B at speed 1, Weapon Status 0, and its warp engines have been sabotaged: they cannot be used for anything until repaired (SH1.45). From turn 2 you roll a die each turn before Energy Allocation and the repair is done when the total reaches 13, or you may try a crash start (a 1 starts the engines, any other number gets nothing, SH1.452). The Klingon D7 Antagonist is in 0405 heading D at high speed, Weapon Status III. No refits, all drones are slow (speed 8). The Federation player scores a 25 point bonus (SH1.5). The map floats; you may leave by the south or east edge, the Klingon by the north or west edge (SH1.41).`+RL('SH1.2, SH1.41, SH1.44, SH1.45, SH1.432'),
  pick(){selA='CA';selB='D7';XE=[];XF=[];selTab=[0,0];rfA=[];rfB=[]},
  build(){selA='CA';selB='D7';rfA=[];rfB=[];dtype='I'; // [SH1.44] no refits, [SH1.432] all drones slow (speed 8)
   const k=mkShip('CA',8,23,1,'var(--ca)',undefined,[]),d=mkShip('D7',4,5,3,'var(--d7)',undefined,[]); // [SH1.2] CA in 0823 heading B, D7 in 0405 heading D
   k.prev=k.sp=1;d.prev=d.sp=20;k.tm=0;setWS(k,'0');setWS(d,'III');k.sab=true;k.sabSum=0;k.sabT=0;sh=[k,d]}}, // [SH1.45] warp engines sabotaged
 sg2:{btn:'Fleet action',tip:'Fleet Action (SG2): two fleets of three to six ships meet; you fly the first ship of your force and the computer flies the rest',ttl:'Fleet Action &middot; Scenario SG2.0',code:'SG2.0',name:'SG2.0, Fleet Action',go:'Start the fleet action',fleet:true,xmax:[5,5],txtFleet:true,he:['W','S'],ae:['E','N'],
  opp:()=>enemyList().map(x=>SHIPS[x.k].short).join(' + ')+' ('+enemyList().reduce((t,x)=>t+refitDef(x.k,x.rf).pv,0)+' BPV)',
  txt:()=>`a fleet action. <span class="mu">Your force (Force A, starting on the west edge; you fly the first ship, the computer flies the rest): ${sg2Menu(0)}. The computer's force (Force B, east edge): ${sg2Menu(1)}. Destroy or disable the largest enemy ship you can each turn and keep your fleet together (SG2.8). Standard victory conditions (SG2.5). You may change any ship on the tabs below and give ships refits (SG2.44).</span>`,
  sub:()=>'in a fleet action',
  log:()=>`Scenario SG2.0, Fleet Action: Force A (yours: ${ownList().map(x=>SHIPS[x.k].short).join(', ')}) starts in the 01xx to 04xx hexes, the computer's Force B (${enemyList().map(x=>SHIPS[x.k].short).join(', ')}) in the 39xx to 42xx hexes. Every ship starts at speed 10 and Weapon Status II. The map floats. Force A may leave only by the west (01xx) or south (xx30) edge, Force B only by the east (42xx) or north (xx01) edge; a unit leaving by any other edge counts as destroyed (SG2.41). Your computer allies fly on your side and the computer fires only at enemy ships (D1.5). Standard Victory Conditions (S2.2).`+RL('SG2.2, SG2.41, SG2.5, SG2.6, D1.5'),
  pick(){sg2Set(0,sg2s[0]);sg2Set(1,sg2s[1]);selTab=[0,0]},
  build(){const place=(list,col,f)=>list.forEach((s,i)=>{const row=15+(i%2?1:-1)*Math.ceil(i/2)*3;s.c=col+(i%3===2?1:0);s.r=row;s.f=f;s.prev=s.sp=10;setWS(s,'II')});
   place(sh.filter(s=>s.tm===0),2,1+0);place(sh.filter(s=>s.tm===1),41,4)}}, // [SG2.2] Force A in 01xx to 04xx, Force B in 39xx to 42xx, speed 10, WS-II
 sg3:{btn:'Base defense',tip:'Base Defense (SG3): you lead the attackers against a base station; a defending ship arrives on a secret turn',ttl:'Base Defense &middot; Scenario SG3.0',code:'SG3.0',name:'SG3.0, Base Defense',go:'Start the attack',fleet:true,xmax:[2,0],txtFleet:true,float:false,he:['E'],ae:['N','S','W'],
  opp:()=>`${c3.bats?'Battle Station':'Base Station'} + ${SHIPS[selB].short} (${DEFS[c3.bats?'BATS':'BS'].pv+refitDef(selB,rfB).pv} BPV)`,
  txt:()=>{const pv=ownList().reduce((t,x)=>t+refitDef(x.k,x.rf).pv,0),lim=225+(c3.bats?100:0),dl=135+(c3.bats?50:0),dp=refitDef(selB,rfB).pv;return `you are the attacker against a ${c3.bats?'battle':'base'} station in hex 2215. <span class="mu">Your force (enters on the 42xx edge): ${sg3Menu(0)} (${pv} BPV, limit ${lim}${pv>lim?', <b>over the limit</b>':''}). The defending ship that rescues the base (computer): ${sg3Menu(1)} (${dp} BPV, limit ${dl}${dp>dl?', <b>over the limit</b>':''}); it arrives on turn 1 to 4, which you are not told (SG3.45). You fly your first ship and the computer flies the others and the defenders. The map is fixed and you may leave only by the 42xx edge (SG3.41). Victory is by points (SG3.5).</span>`},
  sub:()=>'attacking a base station',
  log:()=>`Scenario SG3.0, Base Defense: the ${c3.bats?'battle station (SG3.61)':'base station'} is in 2215 at Weapon Status I. Your force (${ownList().map(x=>SHIPS[x.k].short).join(', ')}) enters on the 42xx edge at speed 10, Weapon Status II. A defending ${SHIPS[selB].short} will arrive on the 01xx edge at maximum speed and Weapon Status III on a turn between 1 and 4 that you are not told (SG3.45). The map is fixed; you may leave only by the 42xx edge, and a unit that leaves by any other edge counts as destroyed (SG3.41). Victory is by the points of SG3.5.${c3.T===1?` The drawn arrival turn is 1, so the defending ${SHIPS[selB].short} is already on the map in hex ${hexNo(sh.find(s=>s.rein).c,sh.find(s=>s.rein).r)}.`:''}`+RL('SG3.2, SG3.41, SG3.45, SG3.5'),
  pick(){sg3Set(0,c3.a);sg3Set(1,c3.d);selTab=[0,0]},
  build(){c3.T=1+Math.floor(Math.random()*4);const rein=sh.find(s=>s.tm===1),att=sh.filter(s=>s.tm===0);sh=[...att,rein];
   const bs=mkShip(c3.bats?'BATS':'BS',22,15,0,'var(--d7)',undefined,[]);bs.prev=bs.sp=0;setWS(bs,'I');sh.splice(1,0,bs); // [SG3.2] base in 2215, WS-I
   att.forEach((s,i)=>{s.c=COLS;s.r=15+(i%2?1:-1)*Math.ceil(i/2)*3;s.f=4;s.prev=s.sp=10;setWS(s,'II')}); // [SG3.2] attackers in 42xx, speed 10, WS-II
   rein.rein=c3.T;rein.arr=false;setWS(rein,'III');rein.out=true;if(c3.T===1)sg3Arrive(rein,1)}}, // [SG3.45] the arrival turn is secret

};
// [SH1.45, SH1.451, SH1.452] The sabotaged Federation warp engines: pw() gives no warp power while s.sab is set. Before Energy Allocation on turn 2 and later the player picks a method and rolls once.
const sabPending=()=>{const s=sh[0];return !!(scnX==='sh1'&&s&&s.sab&&turn>1&&s.sabT!==turn&&phase==='ea'&&!over)};
function sabDo(mode){const s=sh[0];if(!sabPending())return;s.sabT=turn;const d=d6();
 if(mode==='crash'){if(d===1){s.sab=false;L(`Turn ${turn}: crash start (SH1.452): you rolled 1 and the warp engines start at once.`+RL('SH1.452'))}else L(`Turn ${turn}: crash start (SH1.452): you rolled ${d}, the attempt fails and the engines stay dead. The roll is not added to the total (${s.sabSum} of 13).`+RL('SH1.452'))}
 else{s.sabSum+=d;if(s.sabSum>=13){s.sab=false;L(`Turn ${turn}: repair roll (SH1.451): you rolled ${d}, the total is ${s.sabSum} and the warp engines are repaired.`+RL('SH1.451'))}else L(`Turn ${turn}: repair roll (SH1.451): you rolled ${d}; the total is ${s.sabSum} of 13.`+RL('SH1.451'))}
 plan0=autoPlan(sh[0],TG(),'normal',true);fit(sh[0],plan0);draw()}
const sabUI=()=>{const s=sh[0];return `<div class="card" style="margin:6px 0"><b>Sabotaged warp engines (SH1.45)</b><p style="margin:4px 0">Your warp engines are still dead (repair total ${s.sabSum} of 13). Choose one method before Energy Allocation and roll once. <button onclick="sabDo('roll')">Roll for repair (add to the total)</button> <button onclick="sabDo('crash')">Crash start (a 1 starts them, otherwise nothing)</button></p></div>`};


// [SG3.0] Base Defense. State: c3.bats (SG3.61), c3.a and c3.d (menu picks), c3.T (secret arrival turn, SG3.45).
const c3={bats:false,a:'fed:0',d:'kli:0',T:1};
const SG3L={fed:[['1xCA + 1xCL','CA CL'],['1xCC + 1xDD','CC DD']],kli:[['1xD7 + 1xD6','D7 D6'],['1xD6 + 2xF5','D6 F5 F5']],rom:[['3xWB','WB WB WB'],['1xKR + 1xWE','KR WE']],kzi:[['1xCS + 1xCL','KCS KCL'],['1xCV + 1xFF','CV KFF']],gor:[['1xCA + 1xCL','GCA GCL']],ori:[['3xCR','CR CR CR']]}, // [SG3.63] attacking forces
 SG3D={fed:[['1xCA','CA']],kli:[['1xD6','D6']],rom:[['1xWE','WE'],['1xKR','KR']],kzi:[['1xCS','KCS']],gor:[['1xCA','GCA']]},SG3R={...SG2R,ori:'Orion'}; // [SG3.63] defending ships
function sg3Set(w,v){const T=w?SG3D:SG3L;if(!v||!T[v.split(':')[0]])v=w?'kli:0':'fed:0';const [r,i]=v.split(':'),ks=T[r][+i][1].split(' ');if(w){c3.d=v;selB=ks[0];rfB=[];XE=[]}else{c3.a=v;selA=ks[0];rfA=[];XF=ks.slice(1).map(k=>({k,rf:[]}))}selTab=[0,0]}
function sg3Pick(w,v){sg3Set(w,v);drawSel()}
const sg3Menu=w=>{const T=w?SG3D:SG3L,cur=w?c3.d:c3.a;return `<select onchange="sg3Pick(${w},this.value)" aria-label="${w?'Defending ship':'Attacking force'}">${Object.keys(T).map(r=>`<optgroup label="${SG3R[r]}">${T[r].map((f,i)=>`<option value="${r}:${i}" ${cur===r+':'+i?'selected':''}>${f[0]}</option>`).join('')}</optgroup>`).join('')}</select>`};
const pendRein=()=>scnX==='sg3'&&sh.some(s=>s.rein&&s.out&&!s.arr); // [SG3.3] a defending ship that has not yet arrived keeps the scenario going
function sg3Arrive(s,q){const at=sh.filter(x=>x.tm===0&&!x.out),r0=at.length?Math.min(...at.map(x=>x.r)):15,rw=Math.max(3,Math.min(28,at.length?Math.round(at.reduce((t,x)=>t+x.r,0)/at.length):15));s.c=1;s.r=rw;s.out=false;s.arr=true;const bs=sh.find(x=>x.d.base);s.f=bs?bestFacing(s,bs):1;s.prev=s.sp=20;setWS(s,'III');
 if(!q)L(`Turn ${turn}: the defending ${s.n} arrives in hex ${hexNo(s.c,s.r)} at maximum speed and Weapon Status III (the number drawn for its arrival was ${s.rein}).`+RL('SG3.45'))}
function sg3Rein(){if(scnX!=='sg3'||over)return;const s=sh.find(x=>x.rein&&x.out&&!x.arr);if(s&&turn>=s.rein)sg3Arrive(s)}
// [SG3.5] Score: a positive total is a defender win, a negative total an attacker win.
function sg3End(){if(scnX!=='sg3'||!over||over.sg3)return;over.sg3=1;
 const st=s=>s.captured?'captured':(s.boom||s.exitDead||(s.out&&!s.fled&&power(s)<=0))?'destroyed':cripWhy(s).length?'crippled':s.fled?'disengaged':'intact';
 let tot=0;const parts=[];
 sh.filter(s=>s.tm===0).forEach(s=>{const k=st(s),p=({captured:7,destroyed:5,crippled:3})[k]||0;tot+=p;parts.push(`${s.tag} ${k}: ${p}`)});
 const bs=sh.find(s=>s.d.base),bk=st(bs),bp=({captured:-18,destroyed:-12,crippled:-6})[bk]||0;tot+=bp;parts.push(`base ${bk}: ${bp}`);
 const rn=sh.find(s=>s.rein&&s.arr);if(rn){const k=st(rn),p=({captured:-8,destroyed:-4,crippled:-2})[k]||0;tot+=p;parts.push(`${rn.tag} ${k}: ${p}`)}
 over.win=tot<0;const t=`SG3.5 points (${parts.join('; ')}): total ${tot}. ${tot<0?'A negative total: you, the attacker, win.':tot>0?'A positive total: the defender wins.':'A total of zero: a draw.'} The defending ship was due on turn ${c3.T}.`;over.text+=' '+t;L(t+RL('SG3.5'))}
