/* [C13.0] Docking (Advanced rule, off by default).
   A friendly ship can dock externally to a friendly base (C13.7) or to another friendly ship (C13.9). Plot the dock in Energy Allocation (C13.17); it is carried out at the end of the turn
   (Final Activity Phase, C13.911) if both are in the same hex, at speed 1 or less (both stopped for two ships, C13.912) and the ship used none of the prohibited maneuvers (C13.16).
   A docked ship does not move (C13.763, C13.921 simplified), rotates with its base (C13.713), cannot fire through its docking shield or the two beside it for a base of a larger size class
   (C13.72), cannot fire at ships while docked to a base (C13.762, fire control disrupted), cannot fire at its partner (C13.7611, C13.964), and is destroyed with it (C13.43, C13.942).
   Not built: internal docking in starbases and repair docks (C13.3 to C13.6, C13.8), power and crew transfers (C13.41, C13.47, C13.951, C13.952), shield extension (C13.731), forced docking (C13.714, C13.917),
   moving docked ships (C13.92), cloak, shuttle and fighter docking, the D21 escape. The computer never docks. */
let optDock=false;
const dkList=p=>sh.filter(x=>x.dk&&x.dk.to===p&&!x.out&&!x.boom);
// [C13.763, C13.97] A docked ship, and a ship with another docked to it, cannot move.
const dockLock=s=>optDock&&!s.out&&(!!s.dk||(!s.d.base&&dkList(s).length>0));
// Which of unit u's shield sectors (0 to 5) contains b? -1 in the same hex.
const dkSec=(u,b)=>{const a=rel(u,b);return a===null?-1:Math.floor(((a+30)%360)/60)%6};
// [C13.72, C13.724, C13.941] The shields through which a unit cannot fire or be fired at: the docking shield and the two beside it for a ship docked to a larger base, else just the docking shield.
function dkBlocked(u){const o=[];if(!u||!u.d)return o;if(u.dk&&!u.dk.to.out){const k=u.dk.kd,p=u.dk.to,big=p.d.base&&(p.d.size||3)<(u.d.size||4);if(big)o.push((k+5)%6,k,(k+1)%6);else o.push(k)}
 if(!u.d.base)dkList(u).forEach(x=>{if(x.dk.kp!==undefined)o.push(x.dk.kp)});return o}
// [C13.72, C13.7611, C13.762, C13.964] Why a weapon of s cannot fire at foe because of docking ('' when it can).
function dockFireWhy(s,foe){if(!optDock||!foe||foe===s)return'';
 if(s.dk&&s.dk.to===foe||foe.dk&&foe.dk.to===s)return'Docked units cannot fire at each other (C13.7611, C13.964)';
 if(s.dk&&s.dk.to.d.base&&!foe.dr)return'Docked to a base: fire control is disrupted, so no fire at ships (C13.762)';
 const bs=dkBlocked(s);if(bs.length&&bs.includes(dkSec(s,foe)))return'Blocked by the docking: no fire through the docking shield (C13.72)';
 const bf=dkBlocked(foe);if(bf.length&&bf.includes(dkSec(foe,s)))return'The target is docked: it cannot be fired at through its docking shields (C13.722)';
 return''}
// [C13.723] Seeking weapons (and explosions) that arrive through a blocked shield strike the docking partner instead.
function dockHit(tgt,k){if(!optDock||!tgt||tgt.dr)return null;if(!dkBlocked(tgt).includes(k))return null;
 let o=null;if(tgt.dk&&!tgt.dk.to.out)o=tgt.dk.to;else if(!tgt.d.base)o=dkList(tgt).find(x=>x.dk.kp===k)||null;if(!o)return null;
 const dir=(tgt.f+k)%6,k2=(dir-o.f+6)%6;L(`The hit on ${tgt.tag} comes through its docking shield #${k+1} and strikes ${o.tag} instead, on its shield #${k2+1}.`+RL('C13.723, C13.72'));return{t:o,k:k2}}
// [C13.713] A docked ship rotates with its base.
function dockRot(b){if(!optDock)return;dkList(b).forEach(x=>{x.f=(x.f+1)%6;L(`${x.tag}, docked to ${b.tag}, turns with it to facing ${FL[x.f]}.`+RL('C13.713'))})}
// [C13.43, C13.942] A ship docked to a unit that is destroyed is destroyed too (the D21 escape is not built).
function dockScan(){if(!optDock)return;sh.forEach(s=>{if(!s.dk)return;if(s.out||s.boom){s.dk=null;return}const p=s.dk.to;
 if(p.boom||p.captured||(p.out&&!p.fled&&power(p)<=0)){L(`${p.tag} is gone, and ${s.tag}, docked to it, is destroyed with it.`+RL('C13.43, C13.942'));s.boom=true;s.dk=null}})}
// Why docking cannot be completed now ('' when it can). Checked at the end of the turn.
function dockWhy(s,p){if(!p||p===s)return'there is nothing to dock to';if(p.out||p.boom)return`${p.tag} is not in play`;if(p.tm!==s.tm||p.neu)return`${p.tag} is not friendly (an enemy cannot be docked to by choice, C13.45)`;
 if(s.dk)return'already docked';if(p.dk)return`${p.tag} is itself docked (C13.916)`;if(s.d.base)return'a base does not dock to other units';
 if(s.c!==p.c||s.r!==p.r)return`the ships are not in the same hex (C13.11)`;
 if(s.emOn||s.emPaid||s.hetUsed||(s.unpN|0)>0||s.edHalt)return'it used erratic maneuvering, a high energy turn, emergency deceleration or a mid-turn speed change this turn (C13.16)';
 if(p.d.base){if(s.sp>1)return'speed must be 1 or less (C13.11)';if(dkList(p).length>=(p.sys.Tractor||0))return`${p.tag} has no free tractor beam to dock to (C13.71)`}
 else{if(s.sp>0||p.sp>0)return'two ships can dock only when both are at speed zero (C13.912)';if(dkList(p).length>0)return`${p.tag} already has a ship docked (C13.97)`;if(!((s.sys.Tractor||0)>0||(p.sys.Tractor||0)>0))return'neither ship has a tractor beam (C13.91)'}
 return''}
// [C13.17] Docking is carried out at the end of the turn.
function dockEnd(){if(!optDock)return;sh.forEach(s=>{if(!s.dkPlan)return;const p=sh.find(x=>x.tag===s.dkPlan);s.dkPlan=null;if(s.out||s.boom)return;const w=dockWhy(s,p);
 if(w){L(`${s.tag} cannot dock with ${p?p.tag:'its partner'}: ${w}.`+RL('C13.1, C13.11, C13.16'));return}
 const kp=p.d.base?undefined:(((s.f+3)%6)-p.f+6)%6;s.dk={to:p,kd:0,kp,turn};s.sp=0;
 L(`${s.tag} docks with ${p.tag} (${p.d.base?'to one of its tractor beams':'ship to ship'}). Its #1 shield faces the ${p.d.base?'base':'other ship'}${dkBlocked(s).length>1?`; shields #${dkBlocked(s).map(x=>x+1).join(', #')} are blocked`:''}. It cannot move, and it is destroyed if ${p.tag} is.`+RL('C13.11, C13.113, C13.713, C13.72'))})}
// [C13.21, C13.22, C13.23] Undocking at the start of the turn, but not on the turn after docking.
function dockStart(s,p){if(!optDock)return;s.dkPlan=(!s.dk&&p.dk)?p.dk:null;
 if(s.dk&&p.udk){if(turn<s.dk.turn+2){L(`${s.tag} cannot undock on the turn after it docks (C13.22).`+RL('C13.22'));return}L(`${s.tag} undocks from ${s.dk.to.tag} and keeps its facing ${FL[s.f]}.`+RL('C13.21, C13.75'));s.dk=null}}
// [C13.1, C13.2, C13.16, C13.17, C13.23] Checks on the plan.
function dockCheck(s,p,e){if(!optDock){p.dk='';p.udk=0;return}
 if(dockLock(s)&&!(p.udk&&s.dk)){if(p.spd>0||p.tac||p.het||p.em||p.stac){p.spd=0;p.tac=0;p.het=0;p.em=0;p.stac=0}}
 if(p.dk&&!s.dk){if(p.spd>1)e.push('To dock, speed must be 1 or less (C13.11)');if(p.em||p.het>0||(optChg&&p.chg&&p.chg.length))e.push('A ship that docks cannot use erratic maneuvering, a high energy turn or mid-turn speed changes (C13.16)')}
 if(s.dk&&p.udk){if(turn<s.dk.turn+2)e.push('A ship cannot undock on the turn after it docks (C13.22)');else if(p.spd>1||p.em||p.het>0||p.tac)e.push('On the turn of undocking the ship moves at speed 1 or less with no erratic maneuvering, HET or tactical maneuvers (C13.23, C13.231)')}}
// The Energy Allocation row (human ship only).
function dkRow(s,p){if(!optDock||s!==sh[0]||s.d.base)return'';
 if(s.dk){const can=turn>=s.dk.turn+2;return`<tr><td class="l">Docking (C13)<br><small>Docked with ${s.dk.to.tag} since turn ${s.dk.turn}. A docked ship cannot move, fire at ships (when docked to a base) or fire through its docking shields${can?'':'; it cannot undock on the turn after docking (C13.22)'}.</small></td><td><label><input type="checkbox" ${p.udk?'checked':''} ${can?'':'disabled'} onchange="plan0.udk=this.checked?1:0;eaMsg='';draw()"> Undock this turn</label></td><td></td></tr>`}
 const f=sh.filter(x=>x!==s&&!x.out&&!x.boom&&x.tm===s.tm&&!x.neu&&!x.dk);if(!f.length)return'';
 return`<tr><td class="l">Docking (C13)<br><small>Plot a dock with a friendly unit: both must be in the same hex at the end of the turn (a base: speed 1 or less; a ship: both stopped).</small></td><td><select onchange="plan0.dk=this.value;eaMsg='';draw()"><option value="">No docking</option>${f.map(x=>`<option value="${x.tag}"${p.dk===x.tag?' selected':''}>Dock with ${x.tag}${x.c===s.c&&x.r===s.r?' (same hex)':''}</option>`).join('')}</select></td><td></td></tr>`}
