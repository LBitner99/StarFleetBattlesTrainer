/* [G6.0] Klingon security stations and mutiny (Advanced rule, off by default).
   When the last security station of a Klingon ship is destroyed (or captured by boarding parties) the crew may mutiny. A die is rolled at once, then at the end of
   every turn until a mutiny happens or a station is repaired or recaptured (G6.20). A second die says whether the loyal crew put it down.
   Simplifications (documented in the audit): the loyal officers always hold the boom or lose it on the G6.40 roll, and if they hold it they try the self-destruct at once
   (G6.41); boom separation (G6.42, needs G12) and recapture of a mutinous ship (G6.5) are not built, so a ship the mutineers seize is surrendered and counts as captured (G6.33). */
let optMut=false;
const mutSec=s=>Math.max(0,(s.sys.Security||0)-((s.cap&&s.cap.Security)||0));
// [G6.14] Which ships can mutiny: Klingon ships that have security stations on the SSD, not PFs (size 5), and only once per scenario (G6.24).
const mutCan=s=>optMut&&s.d&&s.d.side==='kli'&&(s.d.sys.Security||0)>0&&(s.d.size||4)<5&&!s.mutDone&&!s.out&&!s.boom&&!s.captured;
// [G6.22] Every Nth enemy boarding party aboard counts one: N is 4 for size class 3, 6 for class 2, 2 for class 4, 10 for a starbase of class 1.
function mutEnemyBP(s){const b=typeof boardedBy==='function'?boardedBy(s):null;if(!b)return 0;const z=s.d.size||3,n=z<=1?10:z===2?6:z>=4?2:4;return Math.floor(b.n/n)}
// [G2.11, G6.23] Control spaces: bridge, flag bridge, auxiliary control, emergency bridge.
const mutNoCtl=s=>!['Bridge','Flag Bridge','Aux Control','Emer Bridge'].some(k=>(s.sys[k]||0)>0);
function mutMods(s){let o=0,t=0,n=[];const e=mutEnemyBP(s);if(e){o-=e;t+=e;n.push(`${e} per ${s.d.size>=4?'2nd':s.d.size===2?'6th':s.d.size<=1?'10th':'4th'} enemy boarding party aboard (G6.22)`)}
 if(mutNoCtl(s)){o-=1;t+=1;n.push('all control spaces destroyed (G6.23)')}
 const q=cq(s);if(q<0){o-=1;t+=1;n.push('poor crew (G21.144, read as one more likely)')}else if(q>0){o+=1;t-=1;n.push('outstanding crew (G21.244, read as one less likely)')}
 if(typeof hasRole==='function'&&optLeg&&hasRole(s,'maj')){o+=1;t-=1;n.push('legendary marine major aboard (G22.53, read as loyal)')}
 return{o,t,n}}
// One mutiny roll: the occurrence die, then the success die.
function mutRoll(s,when){const m=mutMods(s),r=d6(),r1=Math.max(1,r+m.o);const nt=m.n.length?` (${m.n.join('; ')})`:'';
 if(r1!==1){L(`${s.tag} has no security station left. ${when} mutiny roll: ${r}${m.o?` with modifier ${m.o>0?'+':''}${m.o}`:''}${nt}: no mutiny yet.`+RL('G6.20, G6.22'));return}
 L(`${s.tag} has no security station left. ${when} mutiny roll: ${r}${nt}: a MUTINY breaks out!`+RL('G6.20, G6.22'));
 s.mutDone=true;
 const r2=d6(),n2=Math.max(1,Math.min(6,r2+m.t));
 if(n2<=3){mutDown(s,r2,m.t);return}
 mutWin(s,r2,m.t)}
// [G6.24, G6.34, G6.62] The loyal crew win: no more mutiny rolls, a third of the crew is lost and each Klingon boarding party survives on 1 to 3.
function mutDown(s,r2,mt){const bp0=s.bp||0;let keep=0;for(let i=0;i<bp0;i++)if(d6()<=3)keep++;s.bp=keep;const g0=s.gc;s.gc=Math.round(s.gc*2/3*2)/2;
 L(`The loyal crew of ${s.tag} put the mutiny down (second roll ${r2}${mt?` ${mt>0?'+':''}${mt}`:''}). Each of its ${bp0} boarding part${bp0===1?'y':'ies'} rolls: ${keep} survive. About a third of the crew died in the fighting (${fh(g0)} to ${fh(s.gc)} general crew units). No more mutiny rolls this scenario.`+RL('G6.20, G6.24, G6.34, G6.62'));
}
// [G6.20, G6.33, G6.40, G6.41] The mutineers win: the ship cannot move or fire, the loyal officers may hold the boom and try the self-destruct, otherwise the ship surrenders.
function mutWin(s,r2,mt){L(`The mutineers seize ${s.tag} (second roll ${r2}${mt?` ${mt>0?'+':''}${mt}`:''}). It can no longer move or fire.`+RL('G6.20, G6.32'));
 s.noMove=1e9;s.noFire=1e9;s.mutSeized=true;
 const b=d6();
 if(b<=2){L(`Boom control roll ${b}: the mutineers also hold the boom. The officers have no way to self-destruct.`+RL('G6.40'))}
 else{const sd=d6();L(`Boom control roll ${b}: the loyal officers hold the boom and try the self-destruct device (roll ${sd}; only a 1 works).`+RL('G6.40, G6.41, D5.53'));
  if(sd===1){L(`${s.tag} self-destructs on the officers' order (the boom escapes).`+RL('G6.41, D5.53'));s.boom=true;s.selfD=true;if(typeof explodeAll==='function')explodeAll();return}}
 const o={win:s.tm!==0,text:s.tm===0?`${s.tag}'s crew mutinied and surrendered the ship to the enemy. The ship is lost.`:`${s.tag}'s crew mutinied and surrendered to you. You have captured the ship.`};
 L(`${s.tag}'s mutineers surrender the ship. It counts as captured unless it is destroyed or recaptured.`+RL('G6.33, G6.62'));
 s.out=true;s.captured=true;
 if(s===sh[0])over=o;else if(s.tm===1&&!ENL().length&&!over)over=o}
// Every impulse (from checkEnd): the moment the last security station goes, roll at once (G6.20). A repaired or recaptured station stops the rolling.
function mutScan(){if(!optMut||over)return;sh.forEach(s=>{if(!mutCan(s))return;if(mutSec(s)>0){s.mutArm=false;return}if(!s.mutArm){s.mutArm=true;mutRoll(s,'Immediate')}})}
// End of turn (G6.20): another roll for every ship still without a station.
function mutEnd(){if(!optMut||over)return;sh.forEach(s=>{if(!mutCan(s))return;if(mutSec(s)>0){s.mutArm=false;return}s.mutArm=true;mutRoll(s,`End-of-turn ${turn}`)})}
