/* ================= Legendary officers (G22, option) ================= */
// One legendary officer per ship, chosen per side in the options or rolled on the G22.111 chart. s.leg={t:type, st:'ok'|'dead'|'disabled', loc:SSD box he is in, busy:last turn he cannot work, mode:the captain's current job, used:navigator bonus spent}.
let optLeg=false,legQ={you:'none',opp:'none'};
const LEGN={captain:'Legendary captain',weapons:'Legendary weapons officer',nav:'Legendary navigator',eng:'Legendary chief engineer',sci:'Legendary science officer',maj:'Legendary major of marines',doc:'Legendary ship\'s doctor'};
const legCtrl=s=>CTRL.some(k=>(s.sys[k]||0)>0);
// [G22.125, G22.133] role the officer is working now: the captain is versatile (G22.23) and can take the job of any other officer but the doctor
const legRole=s=>{const o=s&&s.leg;if(!optLeg||!o||o.st!=='ok'||turn<=o.busy||legAsCrew(s))return null;const r=o.t==='captain'?(o.mode||'captain'):o.t;
 if(['captain','weapons','nav','eng','sci'].includes(r)&&o.t!=='captain'&&!legCtrl(s))return null; // [G22.133] these officers need a working control box
 if(o.t==='captain'&&r!=='captain'&&!legCtrl(s)&&r!=='maj')return null;return r};
const hasRole=(s,r)=>legRole(s)===r;
// [G22.612] a disabled legendary doctor can cure himself, which takes two turns
function legSelfCure(){sh.forEach(s=>{const o=s.leg;if(!optLeg||!o||o.t!=='doc'||o.st!=='disabled')return;o.cure=(o.cure||0)+1;if(o.cure>=2){o.st='ok';o.cure=0;o.busy=turn;L(`${s.tag}'s legendary doctor has cured himself after two turns and is back at work next turn.`+RL('G22.612'))}else L(`${s.tag}'s disabled legendary doctor is treating himself (one more turn).`+RL('G22.612'))})}
function legRoll(){const d=d6()+d6();return d===2||d===12?'captain':d===3?'weapons':d===4?'nav':d===5?'doc':d===9?'sci':d===10?'maj':d===11?'eng':null} // [G22.111]
function legAssign(){sh.forEach(s=>{s.leg=null;if(!optLeg||s.neu||s.merch||s.d.base||s.dr)return;let t=s.tm===0?legQ.you:legQ.opp;if(t==='none')return;if(t==='roll')t=legRoll();
  if(t==='eng'&&s.d.side==='tho')t=null; // [G22.46] Tholians never have a legendary engineer
  if(!t)return;s.leg={t,st:'ok',loc:CTRL.find(k=>(s.sys[k]||0)>0)||null,busy:0,mode:'captain',used:false};L(`${s.tag} has a ${LEGN[t].toLowerCase()} (G22).`+RL('G22.0, G22.111'))})}
// [G22.134] If the last box of the officer's location is destroyed he rolls: 1 killed, 6 disabled for the scenario, otherwise he moves to another control box and cannot work until the next turn is over.
function legCheck(){if(!optLeg)return;sh.forEach(s=>{const o=s.leg;if(!o||o.st!=='ok'||!o.loc)return;if((s.sys[o.loc]||0)>0)return;const d=d6(),nl=CTRL.find(k=>(s.sys[k]||0)>0)||null;
  if(d===1){o.st='dead';L(`${s.tag}: the ${o.loc} is destroyed and the ${LEGN[o.t].toLowerCase()} is killed (rolled 1).`+RL('G22.134'))}
  else if(d===6){o.st='disabled';L(`${s.tag}: the ${o.loc} is destroyed and the ${LEGN[o.t].toLowerCase()} is disabled for the rest of the scenario (rolled 6).`+RL('G22.134'))}
  else{o.loc=nl;o.busy=turn+1;L(`${s.tag}: the ${o.loc===nl&&nl?'last box of his post':'post'} is destroyed; the ${LEGN[o.t].toLowerCase()} is unharmed (rolled ${d}) ${nl?`and moves to the ${nl}, unable to work until the turn after this one`:'but has no control box to go to'}.`+RL('G22.134, G22.132'))}})}
// [G22.43] doubles the output of four power boxes; the extra power lasts the whole turn it was planned (G22.125)
const engP=s=>phase==='ea'?(hasRole(s,'eng')?4:0):(s.engPow||0);
// [G22.41, G22.411, G22.61, G22.611] end of turn: the engineer repairs a box on a 1, the doctor returns one crew unit
function legEnd(){if(!optLeg)return;legSelfCure();sh.forEach(s=>{if(s.out||s.boom)return;
  if(hasRole(s,'eng')){const dc=s.d.sys['Damage Control']||0,done=s.legRep||0;if(done<dc){const d=d6();if(d===1){const c=Object.keys(s.d.sys).filter(k=>!['Damage Control','Sensor','Scanner','Armor'].includes(k)&&(s.sys[k]||0)<s.d.sys[k]);if(c.length){const k=c[Math.floor(Math.random()*c.length)];s.sys[k]++;s.legRep=done+1;L(`End of turn ${turn}: the legendary engineer of ${s.tag} rolls a 1 and repairs a ${k} box.`+RL('G22.41, G22.411'))}}}}
  if(hasRole(s,'doc')&&(s.cK||0)>(s.cured||0)){s.cured=(s.cured||0)+1;s.gc+=1;L(`End of turn ${turn}: the legendary doctor of ${s.tag} saves a crew unit (${fh(s.gc)} general crew now).`+RL('G22.61, G22.611')+crewNote(s))}})}
// [G22.21, G22.211] bluff, once per scenario, at the end of a turn: 50% plus or minus one point per BPV of difference, between 33% and 67%
function legBluff(){const s=sh[0];if(!hasRole(s,'captain')||s.leg.bluffed||over||turn<2)return;const mine=sh.filter(x=>!x.out&&!x.neu&&x.tm===0).reduce((a,x)=>a+(x.d.pv||0),0),th=sh.filter(x=>!x.out&&!x.neu&&x.tm===1).reduce((a,x)=>a+(x.d.pv||0),0);
  const ch=Math.max(33,Math.min(67,50+mine-th)),d=Math.ceil(Math.random()*100);s.leg.bluffed=true;
  if(d<=ch){L(`Your legendary captain bluffs the enemy (${ch}% chance, rolled ${d}): both forces disengage at once with no points scored or lost.`+RL('G22.21, G22.211'));over={win:false,text:`Your legendary captain bluffed the enemy and both forces disengaged with no points scored or lost (G22.21).`,bluff:true}}
  else L(`Your legendary captain tries to bluff the enemy (${ch}% chance, rolled ${d}) and fails. The battle goes on.`+RL('G22.21, G22.211'));draw()}

