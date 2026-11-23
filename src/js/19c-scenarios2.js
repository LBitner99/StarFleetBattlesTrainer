/* ================= Historical scenarios SH3 and SH4 (more scripted scenarios, same SCX table as 19b) ================= */
// A stand-in enemy that never appears on the map: it owns the cruise drones of SH4 (so they have a side) and gives the computer something to point at.
function dummyFoe(tag){const d=mkShip('F5',-50,-50,0,'var(--d7)',tag,[]);d.out=true;d.dummy=true;d.tm=1;d.eccm=3;return d}
// ---------- SH4 Cruise Drones (Y158) ----------
const dtX=()=>{DT.X=DT.X||{n:'Type-III-XX cruise drone',spd:12,end:25,wh:12,hp:4};return DT.X}; // [FD2.1, FD5.25] speed 12, endurance 25 turns, warhead 12, 4 damage points
let c4x={n:0};
function sh4Spawn(A0){const fs=sh.find(s=>s.merch),dm=sh.find(s=>s.dummy);if(!fs||fs.out||!dm||over)return;const n=d6()+3,T=dtX(),cols=[];
 for(let k=0;k<n;k++){const c=fs.c+k;if(c>COLS)break;cols.push(c);const odd=(++c4x.n)%2===1,tg=odd?fs:sh[0]; // [SH4.46] odd drones go for the freighter, even ones for the frigate
  DR.push({id:++drN,dr:true,cr:true,own:dm,tgt:tg,c,r:1,pc:c,pr:1,f:3,st:0,hp:T.hp,wh:T.wh,spd:T.spd,exp:A0+T.end*32,born:A0,hetT:-99,mv:-1,ecm:0});DR[DR.length-1].f=bestFacing(DR[DR.length-1],tg)}
 if(cols.length&&A0>=0&&typeof log!=='undefined'&&log.length)L(`Turn ${turn}: ${cols.length} cruise drones (type III-XX) appear in hexes ${cols.map(c=>hexNo(c,1)).join(', ')}: odd numbers go for the freighter, even numbers for your frigate. They need no guidance.`+RL('SH4.45, SH4.46, SH4.48'))}
function sh4Check(){if(scnX!=='sh4'||over)return;const fs=sh.find(s=>s.merch);if(!fs)return;
 if(fs.boom||power(fs)<=0||fs.out&&!fs.exitHome){over={win:false,text:'The freighter is destroyed or dead in space: the cargo will not get through. The Klingon player loses (SH4.5).'};L(over.text+RL('SH4.5'));return}
 if(fs.c>=COLS){const cg=fs.sys.Cargo||0;over={win:cg>=10,text:cg>=10?`The freighter leaves by the 42xx column with ${cg} undestroyed cargo boxes: the Klingon player wins (SH4.5).`:`The freighter reaches the 42xx column with only ${cg} undestroyed cargo boxes (it needs 10): the Klingon player loses (SH4.5).`};fs.out=true;fs.exitHome=1;L(over.text+RL('SH4.5'))}}
Object.assign(SCX,{sh4:{btn:'Cruise drones',tip:'Cruise Drones (SH4, Y158): a Klingon F5 escorts a small freighter through waves of Kzinti type III-XX cruise drones',ttl:'Cruise Drones &middot; Scenario SH4.0',code:'SH4.0',name:'SH4.0, Cruise Drones',go:'Start the run',float:false,he:['N','E','S','W'],ae:['N','E','S','W'],mod:true,
  opp:()=>'Kzinti cruise drones (4 to 9 a turn)',
  txt:()=>`your Klingon F5 Vandal escorts a small freighter carrying a critical part. <span class="mu">Each turn from 4 to 9 Kzinti type III-XX cruise drones appear on the top edge. Odd-numbered drones chase the freighter, even-numbered ones you. The freighter (computer-flown, speed 4) must leave through the 42xx column with at least 10 undestroyed cargo boxes (SH4.5). Kill drones with phasers; the freighter's own Ph-3 helps.</span>`,
  sub:()=>'escorting a freighter through cruise drones',
  log:()=>`Scenario SH4.0, Cruise Drones (Y158): your F5 Vandal is in 0108 and the small freighter in 0110, both at speed 4, Weapon Status I. The map is fixed; any edge may be used. Each turn 3 + one die (4 to 9) type III-XX cruise drones (speed 12, 25 turns of endurance, warhead 12, built-in ECCM) appear along the top edge starting in the freighter's column and moving to higher columns; odd ones go for the freighter, even ones for you. The freighter is limited to speed 4. If it leaves by the 42xx column with 10 or more cargo boxes you win; if it dies you lose. All Klingon drones are slow (speed 8); no refits.`+RL('SH4.2, SH4.45, SH4.46, SH4.47, SH4.5'),
  pick(){selA='F5';selB='FS';XE=[];XF=[];selTab=[0,0];rfA=[];rfB=[]},
  build(){dtype='I';c4x.n=0;const f=sh[0],dm=dummyFoe('Cruise drones'),fs=mkShip('FS',1,10,1,'var(--ca)',undefined,[]); // [SH4.2] F5 in 0108, freighter in 0110
   f.c=1;f.r=8;f.f=1;f.prev=f.sp=4;fs.tm=0;fs.merch=1;fs.prev=fs.sp=4;fs.goal={c:COLS,r:10};fs.spcap=4; // [SH4.47] freighter speed 4
   setWS(f,'I');setWS(fs,'I');sh=[f,fs,dm];sh4Spawn(0)}}}); // drones appear on turn 1 too
// ---------- SH3 The Coming of the Meteor (Y160) ----------
let MET=null;
const PLANET3={c:30,r:20};
function metSvg(){if(!MET)return'';const x=cx(MET.c),y=cy(MET.c,MET.r);return `<g transform="translate(${x} ${y})"><circle r="15" fill="#8a7a66" stroke="#4a3f33" stroke-width="2.5"/><circle cx="-5" cy="-4" r="3.5" fill="#6e604f"/><circle cx="5" cy="4" r="4.5" fill="#6e604f"/><circle cx="4" cy="-7" r="2.2" fill="#6e604f"/></g><text x="${x}" y="${y+28}" font-size="10" font-weight="700" text-anchor="middle" fill="var(--tx)" stroke="var(--card)" stroke-width="3" paint-order="stroke">Meteor${MET.dmg?' ('+MET.dmg+')':''}</text>`}
function metStep(i){if(scnX!=='sh3'||!MET||over)return;const A=absI(i);
 if(i===1){MET.tow=new Set(); // [SH3.45] the meteor moves one hex in direction C on the first impulse of each turn
  const [nc,nr]=NB(MET.c,MET.r,2);MET.c=nc;MET.r=nr;
  sh.filter(s=>!s.out&&!s.boom&&s.c===MET.c&&s.r===MET.r).forEach(s=>{s.boom=true;s.out=true;s.killTxt=`${s.n} is struck by the meteor and destroyed (SH3.45).`;L(`Impulse 1: the meteor moves into hex ${hexNo(MET.c,MET.r)} and destroys ${s.tag} (SH3.45).`+RL('SH3.45'))});
  L(`Turn ${turn}: the meteor moves to hex ${hexNo(MET.c,MET.r)}, ${dist(MET,PLANET3)} hexes from the planet.`+RL('SH3.45'));
  MET.min=Math.min(MET.min,dist(MET,PLANET3));
  if(MET.c>=32||dist(MET,PLANET3)===0){metEnd();return}}
 // [SH3.46] towing: a ship adjacent to the meteor and facing away from it with tractor power for half a turn (16 impulses) moves it one hex
 sh.forEach(s=>{if(s.out||s.boom||s.dummy)return;const ok=dist(s,MET)===1&&s.f===bestFacing(MET,s)&&optTrac&&(s.trN||0)>0&&!MET.tow.has(s);
  if(!ok){s.towSince=undefined;return}
  if(s.towSince===undefined)s.towSince=A;
  if(A-s.towSince>=15){const [nc,nr]=NB(s.c,s.r,s.f);MET.c=s.c;MET.r=s.r;s.c=nc;s.r=nr;s.path.push([nc,nr]);MET.tow.add(s);s.towSince=undefined;MET.min=Math.min(MET.min,dist(MET,PLANET3));
   L(`Impulse ${i}: ${s.tag} has towed the meteor for half a turn: the meteor moves into hex ${hexNo(MET.c,MET.r)} and ${s.tag} one hex forward to ${hexNo(s.c,s.r)}. It is now ${dist(MET,PLANET3)} hexes from the planet.`+RL('SH3.46'))}})}
function metEnd(){const m=MET.min,hit=dist(MET,PLANET3)===0;let t,win=false;
 if(hit||m===0){t='The meteor enters the planet hex: the planet is destroyed and a million inhabitants die. Klingon Total Victory (SH3.5).'}
 else if(m===1){t='The meteor passed through a hex next to the planet: fragments strike it and 900,000 of the inhabitants die. Klingon Tactical Victory (SH3.5).'}
 else if(m===2){t='The meteor passed within 2 hexes of the planet: smaller fragments strike it and 100,000 of the inhabitants die. Draw (SH3.5).'}
 else{t='The meteor has missed the planet. Federation Decisive Victory (SH3.5).';win=true}
 over={win,text:t};L(t+RL('SH3.5'))}
Object.assign(SCX,{sh3:{btn:'Meteor',tip:'The Coming of the Meteor (SH3, Y160): your Federation cruiser must tow a meteor off its course to a colony planet while a Klingon frigate interferes',ttl:'The Coming of the Meteor &middot; Scenario SH3.0',code:'SH3.0',name:'SH3.0, The Coming of the Meteor',go:'Start the scenario',float:false,he:['N','E'],ae:['S','W'],
  opp:()=>`Klingon F5 (${DEFS.F5.pv} BPV) and a meteor`,
  txt:()=>`the Federation heavy cruiser Kongo against the Klingon frigate Khedive, which is shepherding a huge meteor toward the colony on Pollux IX. <span class="mu">The meteor moves one hex in direction C each turn. Park next to it, facing away, with a tractor beam powered (switch the tractor option on) for half a turn, and it is moved one hex toward your facing. Victory depends only on how close the meteor comes to the planet (SH3.5).</span>`,
  sub:()=>'to save a colony from a meteor',
  log:()=>`Scenario SH3.0, The Coming of the Meteor (Y160): a class-M planet is in hex 3020 and the meteor in 2015. Your Federation CA Kongo is in 4209 heading E at high speed, Weapon Status II. The Klingon F5 Khedive is in 2016 heading C at speed 1, Weapon Status I. The map is fixed; you may leave only by the 01 row (north) or the 42xx column (east), the Klingon only by the 30 row or the 01xx column. The meteor moves one hex in direction C on impulse 1 of every turn and destroys any ship it enters (SH3.45). It cannot be damaged in this version of the game. No refits; all drones are slow (speed 8). The scenario ends when the meteor hits the planet or reaches a hex beginning with 32.`+RL('SH3.2, SH3.3, SH3.41, SH3.45, SH3.46, SH3.5'),
  pick(){selA='CA';selB='F5';XE=[];XF=[];selTab=[0,0];rfA=[];rfB=[];optTrac=true},
  build(){dtype='I';optTrac=true;TER.plan={...PLANET3};TER.moon=null;terBuild();MET={c:20,r:15,min:dist({c:20,r:15},PLANET3),dmg:0,tow:new Set()};
   const f=sh[0],k=sh[1];f.c=42;f.r=9;f.f=4;f.prev=f.sp=20;setWS(f,'II');k.c=20;k.r=16;k.f=2;k.prev=k.sp=1;setWS(k,'I')}}}); // [SH3.2]
// ---------- SH2 The Surprise Reversed (Y173) ----------
// [SH2.2] the Neutral Zone runs from hex 0126 to hex 4205; the Federation cruiser "enters" it when it reaches that line (approximated as a straight line through the hex centres).
const nzRow=c=>26-(c-1)*21/41,nzOff=s=>s.r-nzRow(s.c);
function nzSvg(){if(scnX!=='sh2')return'';const x1=cx(1),y1=cy(1,26),x2=cx(42),y2=cy(42,5);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d6a420" stroke-width="3" stroke-dasharray="14 8" opacity=".75"/><text x="${cx(8)}" y="${cy(8,nzRow(8))+22}" font-size="11" font-weight="700" fill="#d6a420" stroke="var(--card)" stroke-width="3" paint-order="stroke">Neutral Zone</text>`}
const _autoPlanSur=autoPlan;
autoPlan=function(s,foe,lv,human){const p=_autoPlanSur(s,foe,lv,human);if(!s.sur||human)return p; // [SH2.45] a surprised ship: speed 1, no arming, no EW, no HET, no erratic manoeuvring, minimum shields, no reinforcement, no reserve power
 p.spd=Math.min(p.spd,1);p.het=0;p.ecm=0;p.eccm=0;p.sh=1;p.gen=0;p.bd=0;p.br=0;p.brw=0;p.ph=0;p.clk=0;p.spec=[0,0,0,0,0,0];p.dsh=[0,0,0,0,0,0];p.tu=p.tu.map(()=>'none');p.tuo=p.tuo.map(()=>0);p.di=p.di.map(()=>0);p.pl=p.pl.map(()=>'none');if(p.dbl)p.dbl=null;return p};
function sh2End(){if(scnX!=='sh2'||over)return;const f=sh[0];if(!f||f.out)return;
 const sur=sh.filter(s=>s.sur&&!s.out&&!s.boom);if(!sur.length)return;
 if(!SH2.trig){const ent=nzOff(f)>=0,fired=SHOTS.some(x=>x.t===turn&&x.by===0&&!x.dr);if(ent||fired){SH2.trig=true;L(`Turn ${turn}: ${ent?'your cruiser has entered the Neutral Zone':'you have fired on the Romulans'}. Each unreleased Romulan ship now rolls a die at the end of every turn: a 1 or 2 releases it for the next turn (SH2.46).`+RL('SH2.46'))}} // [SH2.46]
 if(SH2.trig)sur.forEach(s=>{const d=d6();if(d<=2){s.sur=false;L(`The ${s.tag} rolls ${d} and is released: it may operate normally next turn, though it must still arm its weapons and build up speed (SH2.46).`+RL('SH2.46'))}else L(`The ${s.tag} rolls ${d} and stays surprised (SH2.46).`+RL('SH2.46'))})}
const SH2={trig:false};
Object.assign(SCX,{sh2:{btn:'Surprise reversed',tip:'The Surprise Reversed (SH2, Y173): your Federation command cruiser raids a Romulan task force that is not yet alert, then runs for home',ttl:'The Surprise Reversed &middot; Scenario SH2.0',code:'SH2.0',name:'SH2.0, The Surprise Reversed',go:'Cross the Neutral Zone',fleet:true,xmax:[0,4],txtFleet:true,float:true,he:['N','W'],ae:['S','E'],
  opp:()=>'Romulan task force (KR, WE, K5R, 2 WB)',
  txt:()=>`Commodore Stocker's Federation command cruiser Lexington (with the R2.R1 refit) crosses the Neutral Zone to hit a Romulan task force of five ships that is not ready for war. <span class="mu">The Romulans start at speed 1 with every weapon unarmed and are <b>surprised</b>: they cannot arm weapons, speed up, use EW, HET or reinforce shields, and keep minimum shields until released (SH2.45). When you enter the Neutral Zone or fire, each ship rolls every turn end and a 1 or 2 releases it (SH2.46). Disengage by the north or west edge only (SH2.41). The computer flies all five Romulan ships.</span>`,
  sub:()=>'raiding a surprised Romulan task force',
  log:()=>`Scenario SH2.0, The Surprise Reversed (Y173): your Federation CC Lexington (R2.R1 refit) is in 0621 heading B at speed 10, Weapon Status III. The Romulan KR (R4.R1 refit) is in 1820, the WE (R4 rear-phaser refit) in 1720, the K5R (R4.R1 refit) in 1821 and two WB in 1620 and 1722, all heading B at speed 1, Weapon Status 0 and surprised (SH2.45). The Neutral Zone is the dashed line from 0126 to 4205. All drones are medium (speed 20, SH2.432). The map floats; you may leave only by the 01xx or xx01 edge, the Romulans only by the xx30 or 42xx edge (SH2.41).`+RL('SH2.2, SH2.41, SH2.44, SH2.45, SH2.46'),
  pick(){selA='CC';rfA=['plus'];selB='KR';rfB=['b'];XF=[];XE=[{k:'WE',rf:['rear']},{k:'K5R',rf:['b']},{k:'WB',rf:[]},{k:'WB',rf:[]}];selTab=[0,0]},
  build(){dtype='B';SH2.trig=false;const P=[[18,20],[17,20],[18,21],[16,20],[17,22]],f=sh[0];f.c=6;f.r=21;f.f=1;f.prev=f.sp=10;setWS(f,'III'); // [SH2.2] CC in 0621, heading B, speed 10, WS-III
   sh.slice(1).forEach((s,i)=>{s.c=P[i][0];s.r=P[i][1];s.f=1;s.prev=s.sp=1;s.sur=true;setWS(s,'0')})}}});
// ---------- SG8 Assault on a Starbase ----------
// [SG8.0] The main battle fleets are the SG8.61 table; the base is the real Starbase (R1.1) of any of the five races, or a Battle Station (SG8.62). Force sizes: the full table, the SG8.2 BALANCE option (ships from the table while the total stays within the base's BPV), half of it (SG8.63), or the SG8.62 small force (the three smallest ships and one heavy cruiser).
const SG8L={fed:['Federation','DN CC CA CA CL CL CL DD DD DD BT','DD DD DD CA'],kli:['Klingon','C8 D7 D7 D7 D6 D6 D6 D6 F5 F5 F5','F5 F5 F5 D7'],kzi:['Kzinti','CV CV KCS KCS KCS KCL KCL EFF EFF KFF','KFF EFF EFF KCS'],gor:['Gorn','GCA GCA GCA GCA GCL GCL GCL GDD GDD GDD','GDD GDD GDD GCA'],rom:['Romulan','KR KR KR WE WE WE WE K5R K5R K5R','K5R K5R K5R KR']},
 SG8B={SBF:'Federation Starbase',SBK:'Klingon Starbase',SBZ:'Kzinti Starbase',SBG:'Gorn Starbase',SBR:'Romulan Starbase',BATS:'Battle Station (SG8.62)'},
 SG8S={full:'Full main battle fleet (SG8.61)',bal:"Balanced to the base's BPV (SG8.2)",half:'Half the fleet (SG8.63)',small:'Three smallest ships and one heavy cruiser (SG8.62)'},SG8E={W:'West edge (01xx)',N:'North edge (xx01)',E:'East edge (42xx)',S:'South edge (xx30)'},SG8V={5:'Speed 5',10:'Speed 10',15:'Speed 15',20:'Speed 20',25:'Speed 25',30:'Speed 30'},c8={race:'fed',base:'SBK',size:'full',edge:'W',spd:'10'}; // [SG8.2] the attacker chooses the edge (or two adjacent edges; one edge here) and the speed
function sg8List(){const L=SG8L[c8.race],full=L[1].split(' ');if(c8.size==='small')return L[2].split(' ');if(c8.size==='half')return full.filter((_,i)=>i%2===0);
 if(c8.size==='bal'){const lim=DEFS[c8.base].pv;let t=0;return full.filter(k=>{if(t+DEFS[k].pv>lim)return false;t+=DEFS[k].pv;return true})}return full}
function sg8Set(){if(!SG8L[c8.race])c8.race='fed';if(!SG8B[c8.base])c8.base='SBK';const ks=sg8List();selA=ks[0];rfA=[];XF=ks.slice(1).map(k=>({k,rf:[]}));selB=c8.base;rfB=[];XE=[];selTab=[0,0]}
function sg8Opt(f,v){c8[f]=v;if(f==='edge'){const X=SCX.sg8;X.he=[v];X.ae=['N','E','S','W'].filter(e=>e!==v)}if(f==='race'&&c8.base==={fed:'SBF',kli:'SBK',kzi:'SBZ',gor:'SBG',rom:'SBR'}[v])c8.base=v==='fed'?'SBK':'SBF';sg8Set();drawSel()}
const sg8Sel=(f,o,v,lab)=>`<select onchange="sg8Opt('${f}',this.value)" aria-label="${lab}">${Object.keys(o).map(k=>`<option value="${k}" ${v===k?'selected':''}>${typeof o[k]==='string'?o[k]:o[k][0]}</option>`).join('')}</select>`;
Object.assign(SCX,{sg8:{btn:'Assault a base',tip:'Assault on a Starbase (SG8): a main battle fleet attacks a starbase; you fly the flagship',ttl:'Assault on a Starbase &middot; Scenario SG8.0',code:'SG8.0',name:'SG8.0, Assault on a Starbase',go:'Start the assault',fleet:true,xmax:[0,10],txtFleet:true,float:false,mod:true,he:['W'],ae:['N','E','S'],
  opp:()=>`${SG8B[c8.base]} (${DEFS[c8.base].pv} BPV)`,
  txt:()=>{const ks=[selA].concat(XF.map(x=>x.k));return `you lead a ${SG8L[c8.race][0]} assault force against the ${SG8B[c8.base]} in hex 2217. <span class="mu">Attackers: ${sg8Sel('race',SG8L,c8.race,'Attacking race')} ${sg8Sel('size',SG8S,c8.size,'Force size')} Defender: ${sg8Sel('base',SG8B,c8.base,'Base')} (${ks.length} ships, ${ks.reduce((t,k)=>t+DEFS[k].pv,0)} BPV against ${DEFS[c8.base].pv}). Entry: ${sg8Sel('edge',SG8E,c8.edge,'Entry edge')} ${sg8Sel('spd',SG8V,c8.spd,'Entry speed')} Your force enters at Weapon Status III and may only leave by that edge (SG8.2); the base (Weapon Status II) may leave by the others. The map is fixed (SG8.41). You fly your first ship and the computer flies the others. Modified victory conditions (SG8.5). The scenario is not balanced (SG8.2).</span>`},
  sub:()=>'assaulting a starbase',
  log:()=>`Scenario SG8.0, Assault on a Starbase: the ${SG8B[c8.base]} is in 2217 at Weapon Status II, rotation rate 4 (SG8.2, C3.72). Your ${SG8L[c8.race][0]} force (${ownList().map(x=>SHIPS[x.k].short).join(', ')}) enters on the ${SG8E[c8.edge]} on turn 1 at speed ${c8.spd}, Weapon Status III. The map is fixed; your units may leave only by that edge and the base's only by the others (SG8.41). Modified victory conditions (SG8.5). Year Y168 is assumed (SG8.2): no starbase refit unless you chose one.`+RL('SG8.2, SG8.41, SG8.5, SG8.61, SG8.62, R1.1A, C3.72'),
  pick(){sg8Set()},
  build(){const att=sh.filter(s=>s.tm===0),bs=sh.find(s=>s.tm===1);sh=[...att,bs];bs.c=22;bs.r=17;bs.f=0;bs.prev=bs.sp=0;setWS(bs,'II'); // [SG8.2] base in 2217, WS-II
   att.forEach((s,i)=>{const o=(i%2?1:-1)*Math.ceil(i/2)*2,e=c8.edge,sp=+c8.spd||10;if(e==='W'){s.c=1;s.r=15+o;s.f=2}else if(e==='E'){s.c=COLS;s.r=15+o;s.f=4}else if(e==='N'){s.c=22+o;s.r=1;s.f=3}else{s.c=22+o;s.r=ROWS;s.f=0}s.prev=s.sp=sp;setWS(s,'III')}); // [SG8.2] entry edge and speed chosen by the attacker
   sh.sort((a,b)=>a.tm-b.tm||0)}}});
