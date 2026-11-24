/* [C14.0] Tholian pinwheel (Advanced rule, off by default).
   Three Tholian patrol corvettes (TPC or TPP, the PC hull, C14.211) docked stern to stern to stern with facings A-C-E or B-D-F act as one small base:
   they stay in one hex and cannot move by warp (C14.12), disengage (C14.14), use EM or HET; the whole pinwheel can rotate three sides a turn for one point of impulse power (C14.131), the three
   shields that face the same direction combine into one (C14.24), all three share the best ECM (C14.11), the LR and RR arcs of every ship are blocked (C14.29), holding it together costs three points of power
   a turn (one from each ship, C14.233) and at least one working web generator (C14.231); losing every web box splits it at the end of the turn (C14.32).
   Simplifications (see the audit): one hit is scored on one of the three ships at random for its internal damage (C14.16 reading), reinforcement is the hit ship's own, the pinwheel does not move by impulse power,
   it counts as three size-4 ships for life support and shield costs (not one size-2 ship, C14.21), power is allocated by each ship (not pooled, C14.11), and the excess damage, damage control, sensor and scanner
   tracks stay separate (C14.26). Forming is at the start of the scenario (a switch below) or by plan when the three ships already sit in one hex with alternate facings and speed 0 (no two-turn wait, C14.20). The computer never forms or separates one. */
let optPW=false,pwStart=0; // pwStart: 1 = your Tholian ships start as a pinwheel, 2 = the opponent's, 3 = both
const PWOK=s=>!!s&&!s.dr&&!!s.d&&!s.d.base&&/^TP[CP]$/.test(s.d.key||'')&&!s.out&&!s.boom&&!s.captured;
const pwGroup=s=>s&&s.pw?s.pw.ships.filter(x=>!x.out&&!x.boom):null;
const pwOn=s=>optPW&&!!s&&!s.dr&&!!s.pw&&!s.out&&!s.boom;
// [C14.20] Form a pinwheel from three ships in one hex.
function pwFormShips(g,why){g.forEach(x=>{x.pw={ships:g};x.sp=0;x.prev=0});L(`${g.map(x=>x.tag).join(', ')} form a Tholian pinwheel in ${hexNo(g[0].c,g[0].r)} (${why}). They cannot move, disengage or use warp maneuvers; the shields facing each direction combine.`+RL('C14.20, C14.1, C14.24'))}
// Game start: place three Tholian PCs of a side in the lead's hex with facings 2 sides apart.
function pwInit(){sh.forEach(s=>{s.pw=null});if(!optPW||!pwStart)return;
 [0,1].forEach(t=>{if(!(pwStart&(t===0?1:2)))return;const g=sh.filter(x=>PWOK(x)&&x.tm===t&&!x.neu);if(g.length<3){L(`Tholian pinwheel (C14): ${t===0?'your side has':'the opponent has'} fewer than three Tholian PC-hull ships, so no pinwheel is formed.`+RL('C14.211'));return}
  const q=g.slice(0,3),lead=q[0];q.forEach((x,i)=>{x.c=lead.c;x.r=lead.r;x.f=(lead.f+2*i)%6});pwFormShips(q,'start of the scenario')})}
// [C14.24] Shield #k of unit x faces absolute direction (x.f+k)%6. The pinwheel's shield in that direction is the three ship-shields facing it.
function pwHit(tgt,k,dmg,src,note,lbl,rc,av){const g=pwGroup(tgt);if(!g||g.length<2)return av(tgt,k,dmg,src,note,lbl,rc);
 const D=(tgt.f+k)%6,R=g[Math.min(g.length-1,Math.floor(Math.random()*g.length))],kR=(D-R.f+6)%6; // [C14.16] the ship that takes the internal damage of the volley is picked by die
 const parts=g.map(x=>({x,k:(D-x.f+6)%6,v:x.sh[(D-x.f+6)%6]}));let pool=0;parts.forEach(q=>{pool+=q.v;if(q.x!==R)q.x.sh[q.k]=0});R.sh[kR]=pool;
 const lb=lbl||`${src?src.tag:'A weapon'} volley of ${dmg} hits the Tholian pinwheel on its ${'ABCDEF'[D]} shield (${g.length} ship-shields combined, ${pool} boxes), with ${R.tag} taking any internal damage.`+RL('C14.24, C14.16');
 av(R,kR,dmg,src,note,lb,rc||'C14.24');
 // the boxes left are shared back among the three ships, never above what each had
 let rem=Math.max(0,R.sh[kR]);const prev=parts.map(q=>q.v);parts.forEach(q=>{q.x.sh[q.k]=0});
 const tot=prev.reduce((a,b)=>a+b,0)||1;parts.forEach((q,i)=>{q.give=Math.min(prev[i],Math.floor(rem*prev[i]/tot))});let left=rem-parts.reduce((a,q)=>a+q.give,0);
 for(let pass=0;left>0&&pass<3;pass++)parts.forEach((q,i)=>{const add=Math.min(left,prev[i]-q.give);if(add>0){q.give+=add;left-=add}});
 parts.forEach(q=>{q.x.sh[q.k]=q.give})}
const __avPW=applyVolley;
applyVolley=function(tgt,k,dmg,src,note,lbl,rc){if(optPW&&tgt&&!tgt.dr&&tgt.pw&&dmg>0&&!tgt.out&&!tgt.boom&&!(src&&src.pw&&src.pw===tgt.pw))return pwHit(tgt,k,dmg,src,note,lbl,rc,__avPW);return __avPW(tgt,k,dmg,src,note,lbl,rc)};
// [C14.11] Every ship in the pinwheel gets the ECM of the best one.
function pwEcm(s){if(!pwOn(s))return 0;const g=pwGroup(s),m=Math.max(...g.map(x=>x.ecm||0));return Math.max(0,m-(s.ecm||0))}
// [C14.29] The LR and RR arcs are blocked on every ship of the pinwheel (the row between LR and L, and between RR and R, is not).
function pwFireWhy(s,foe){if(!pwOn(s)||!foe||foe===s)return'';const a=rel(s,foe);if(a===null)return'';if(a>120+EPS&&a<240-EPS)return'Tholian pinwheel: the LR and RR arcs are blocked (C14.29)';return''}
// [C14.12, C14.14, C14.132, C14.233] Plan checks: no movement, EM, HET, disengagement; pay the hold cost. Returns the energy this ship pays.
function pwCheck(s,p,e){if(!optPW||!s.pw||!pwOn(s)){p.pwr=0;p.pws=0;if(!optPW)p.pwf='';return 0}
 if(p.pws)return 0;
 p.spd=0;p.tac=0;p.het=0;p.em=0;p.stac=0;p.dis=0;if(p.chg)p.chg=[];
 return 1+(p.pwr&&s===sh[0]?1:0)}
// [C14.20, C14.31, C14.131] Plan effects at the start of the turn: voluntary separation, forming, rotation.
function pwTurn(s,p){if(!optPW)return;
 if(s.pw&&p.pws){const g=s.pw.ships;L(`The Tholian pinwheel of ${g.map(x=>x.tag).join(', ')} separates into three ships at the start of the turn.`+RL('C14.31, C14.201'));g.forEach(x=>{x.pw=null});return}
 if(!s.pw&&p.pwf&&s===sh[0]){const c=sh.filter(x=>PWOK(x)&&x.tm===s.tm&&x.c===s.c&&x.r===s.r&&x.sp===0&&!x.pw);const fs=c.map(x=>x.f).sort();
  if(c.length>=3&&c.slice(0,3).map(x=>x.f%2).every(v=>v===c[0].f%2)&&new Set(c.slice(0,3).map(x=>x.f)).size===3&&c.slice(0,3).some(x=>(x.sys.Web||0)>0)){pwFormShips(c.slice(0,3),'formed in Energy Allocation')}
  else L(`${s.tag} cannot form a pinwheel: it needs three Tholian PC-hull ships in one hex, stopped, facing A-C-E or B-D-F, and one with a web generator.`+RL('C14.20, C14.231'))}
 if(s.pw&&p.pwr)s.pw.rotT=turn}
// [C14.131] Rotation: three sides a turn, on impulses 7, 17 and 28 (rotation rate 3, C3.7).
function pwStep(i){if(!optPW)return;const seen=new Set();sh.forEach(s=>{if(!s.pw||seen.has(s.pw))return;seen.add(s.pw);const g=pwGroup(s);if(!g||s.pw.rotT!==turn||![7,17,28].includes(i))return;g.forEach(x=>{x.f=(x.f+1)%6});L(`Impulse ${i}: the Tholian pinwheel rotates 60° (ships now face ${g.map(x=>FL[x.f]).join(', ')}).`+RL('C14.131, C3.7'))})}
// [C14.32] End of turn: a pinwheel with a destroyed ship, or with no working web box, comes apart.
function pwEnd(){if(!optPW)return;const seen=new Set();sh.forEach(s=>{if(!s.pw||seen.has(s.pw))return;seen.add(s.pw);const all=s.pw.ships,g=pwGroup(s);
 if(g.length<all.length){L(`A ship of the Tholian pinwheel is destroyed: the pinwheel is dissolved.`+RL('C14.32'));all.forEach(x=>{x.pw=null});return}
 if(!g.some(x=>(x.sys.Web||0)>0)){L(`Every web generator holding the Tholian pinwheel is destroyed: it separates at the end of the turn.`+RL('C14.32, C14.231'));all.forEach(x=>{x.pw=null})}})}
// Energy Allocation row (the human ship only).
function pwRow(s,p){if(!optPW||s!==sh[0]||!PWOK(s))return'';
 if(s.pw){return`<tr><td class="l">Tholian pinwheel (C14)<br><small>Formed with ${s.pw.ships.filter(x=>x!==s).map(x=>x.tag).join(', ')}. It cannot move or disengage, holding it costs one point of power from each ship, and the LR and RR arcs are blocked. Rotation costs one more point of impulse power.</small></td><td><label><input type="checkbox" ${p.pwr?'checked':''} onchange="plan0.pwr=this.checked?1:0;eaMsg='';draw()"> Rotate 3 sides</label> <label><input type="checkbox" ${p.pws?'checked':''} onchange="plan0.pws=this.checked?1:0;eaMsg='';draw()"> Separate</label></td><td></td></tr>`}
 const c=sh.filter(x=>PWOK(x)&&x.tm===s.tm&&x.c===s.c&&x.r===s.r&&!x.pw);if(c.length<3)return'';
 return`<tr><td class="l">Tholian pinwheel (C14)<br><small>Three Tholian PC-hull ships are in this hex. Stopped, with facings A-C-E or B-D-F and one web generator, they can form a pinwheel.</small></td><td><label><input type="checkbox" ${p.pwf?'checked':''} onchange="plan0.pwf=this.checked?1:0;eaMsg='';draw()"> Form a pinwheel</label></td><td></td></tr>`}
