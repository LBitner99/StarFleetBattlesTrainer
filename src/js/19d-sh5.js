/* ================= SH5 The Destruction of Attack Shuttle Group #26 (Y166) =================
   You fly the Klingon F5 Vigilance; the computer flies the Kzinti auxiliary light carrier (AxCVL) and its 12 AAS fighters.
   Built on the fighter code in 28c-fighters.js. Rules built: SH5.2 set-up, SH5.3 turn-10 limit, SH5.41 edges, SH5.44 no refits,
   SH5.45 deck crews (four; one fighter prepared per crew per turn, none can launch on turn 1), SH5.46 no drones for the fighters, SH5.5 victory.
   Not built: SH5.42 shuttles as fighters (the admin shuttles are not flown), fighters disengaging by separation, SH5.43 commander's option items for the F5. */
const sh5Car=()=>sh.find(s=>s.sh5),
 sh5Fly=()=>{const K=sh5Car();return K?DR.filter(d=>d.ft&&d.own===K).length:0},
 sh5Alive=()=>{const K=sh5Car();return K?((K.boom?0:(K.fb||[]).length)+sh5Fly()):0};
// [SH5.45] At the start of each turn the AxCVL's four deck crews each prepare one fighter; it can launch from the next turn.
function sh5Prep(){if(scnX!=='sh5')return;const K=sh5Car();if(!K||K.out||K.boom||!K.fb||K.prepTurn===turn)return;K.prepTurn=turn;let n=0;
 K.fb.forEach(f=>{if(f.prepT===undefined&&n<4){f.prepT=turn;n++}});
 if(n)L(`Turn ${turn}: the four deck crews of the ${K.tag} prepare ${n} fighter${n>1?'s':''} (SH5.45). ${turn===1?'None can launch this turn; ':''}They can launch from turn ${turn+1}.`+RL('SH5.45'))}
// [SH5.5] Victory. why: 'f5dead', 'f5dis', 't10' or 'kgone'.
function sh5Result(why){const F=sh[0],K=sh5Car(),alive=sh5Alive(),lost=12-alive;let win=false,text='';
 if(why==='f5dead'||why==='t10')text=alive>0?`${why==='t10'?'Turn 10 ends and your F5 has not disengaged: it is destroyed (SH5.3). ':'Your F5 is destroyed. '}${alive} attack shuttle${alive===1?'':'s'} survive${alive===1?'s':''} (${lost} destroyed): the Kzinti player wins (SH5.5).`:'Your F5 is destroyed as the last attack shuttle dies: neither side wins (SH5.5).';
 else if(why==='f5dis')text=lost>=10?(win=true,`Your F5 disengages after destroying ${lost} of the 12 attack shuttles: you win (SH5.5).`):(isCrip(F)&&lost<6)?`Your crippled F5 is forced to disengage with only ${lost} attack shuttles destroyed (fewer than six): the Kzinti player wins (SH5.5).`:`Your F5 disengages with ${lost} of the 12 attack shuttles destroyed (you need 10): neither side wins (SH5.5).`;
 else if(lost>=10){win=true;text=K.captured?`The auxiliary carrier is captured and ${lost} of the 12 attack shuttles are destroyed: an amazing Klingon victory (SH5.5).`:(K.boom&&alive===0)?'The auxiliary carrier and all 12 attack shuttles are destroyed: an outstanding Klingon victory (SH5.5).':`${lost} of the 12 attack shuttles are destroyed and your F5 survives: a Klingon victory (SH5.5).`}
 else text=`The auxiliary carrier is gone but only ${lost} of the 12 attack shuttles are destroyed (you need 10): the Kzinti player holds (SH5.5).`;
 over={win,text};L(text+RL('SH5.5'))}
function sh5Check(){if(scnX!=='sh5'||over)return;const F=sh[0],K=sh5Car();if(!F||!K)return;
 if(F.boom||power(F)<=0){sh5Result('f5dead');return}
 if((K.out||K.boom)&&sh5Fly()===0)sh5Result('kgone')}
// [SH5.3] If the F5 has not disengaged by the end of turn 10 it is destroyed.
function sh5End(){if(scnX==='sh5'&&!over&&turn>=10&&!sh[0].out)sh5Result('t10')}
// Disengagement hook called from endFor (22-seeking-weapons.js): returns true when SH5 handled it.
function sh5Dis(k,s){if(scnX!=='sh5')return false;if(k===0){if(s.exitDead)sh5Result('f5dead');else{s.out=true;sh5Result('f5dis')}return true}
 s.out=true;L(`The ${s.tag} leaves the map. Any fighters still flying keep fighting (SH5.41).`+RL('SH5.41'));return true}
Object.assign(SCX,{sh5:{btn:'Attack shuttles',tip:'Destruction of Attack Shuttle Group #26 (SH5, Y166): a Klingon F5 hunts a Kzinti auxiliary carrier and its 12 attack shuttles',ttl:'Destruction of Attack Shuttle Group #26 &middot; Scenario SH5.0',code:'SH5.0',name:'SH5.0, Destruction of Attack Shuttle Group #26',go:'Start the hunt',he:['S'],ae:['N','E','W'],
  opp:()=>`Kzinti auxiliary carrier (${DEFS.AXC.pv} BPV) with 12 AAS`,
  txt:()=>`your Klingon F5 Vigilance attacks the Kzinti auxiliary carrier FV-41 and its 12 attack shuttles. <span class="mu">Destroy at least 10 of the attack shuttles without losing your ship (SH5.5). The carrier has four deck crews: it can prepare four fighters a turn and launch none on turn 1 (SH5.45); the fighters carry no drones (SH5.46). If your F5 has not disengaged by the end of turn 10 it is destroyed, and you may leave only by the south edge (SH5.3, SH5.41).</span>`,
  sub:()=>'hunting a Kzinti auxiliary carrier and its attack shuttles',
  log:()=>`Scenario SH5.0, The Destruction of Attack Shuttle Group #26 (Y166): your Klingon F5 Vigilance is in 4025 heading F at speed 10, Weapon Status I. The Kzinti auxiliary light carrier FV-41 (12 AAS fighters) is in 2217 heading E at speed 4, Weapon Status 0, flown by the computer. The map floats. You may leave only by the south edge (xx30); the Kzinti may leave by any other edge; a unit leaving by an unauthorized edge counts as destroyed (SH5.41). No refits; all drones are slow (speed 8). The carrier has four deck crews and cannot launch fighters on turn 1 (SH5.45); the fighters carry no drones (SH5.46). If your F5 has not disengaged by the end of turn 10 it is destroyed (SH5.3).`+RL('SH5.2, SH5.3, SH5.41, SH5.44, SH5.45, SH5.46, SH5.5'),
  pick(){selA='F5';selB='AXC';rfA=[];rfB=[];XE=[];XF=[];selTab=[0,0];optFtr=true},
  build(){selA='F5';selB='AXC';rfA=[];rfB=[];dtype='I';optFtr=true; // [SH5.44] no refits, [SH5.432] all drones slow (speed 8)
   const f=mkShip('F5',40,25,5,'var(--d7)',undefined,[]),k=mkShip('AXC',22,17,4,'var(--ca)',undefined,[]); // [SH5.2] F5 in 4025 heading F, carrier in 2217 heading E
   f.prev=f.sp=10;k.prev=k.sp=4;f.tm=0;k.tm=1;setWS(f,'I');setWS(k,'0');k.sh5=true;sh=[f,k]}}});
