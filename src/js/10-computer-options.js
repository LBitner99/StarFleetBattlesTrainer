/* ================= Computer uses the optional rules (switch: optAIOpt, snapshot AIO) ================= */
// The computer captain adds each extra to its plan or its impulse play only when that option was on for the whole scenario. Each addition is tried and dropped again if it makes the plan illegal, so ordinary play and AI difficulty are unchanged when the switch is off.
function aiPlanOpt(a,p){if(!AIO||a.neu||a.merch||a.d.base){return p}
 const tryAdd=(f,undo)=>{f();if(!cost(a,p).errors.length)return;const g0=p.gen,e0=p.ecm; // short of power: give up a little general reinforcement for it, up to three points
  for(let k=0;k<3&&p.gen>0&&cost(a,p).errors.length;k++)p.gen--;if(cost(a,p).errors.length){p.gen=g0;undo()}}
 if(AIO.board&&(a.sys.Trans||0)>0&&a.bp>=2){tryAdd(()=>{p.trn=1},()=>{p.trn=0}); // [G8.13, D7.8] power one bank of transporters for raids and boarding
  if(a.bp>=3)p.gd={'s:Sensor':1}} // [D7.83] one boarding party guards the sensor box; guards do not fight in D7.4, so it is posted only with spare parties
 if(AIO.trac&&(a.sys.Tractor||0)>0&&!(p.trac>0)&&(dist(a,foeOf(a))<=10||DR.some(d=>!d.pl&&d.own&&d.own.tm!==a.tm)))tryAdd(()=>{p.trac=1},()=>{p.trac=0}); // [G7.13] one tractor beam powered for grabbing drones or a ship
 if(AIO.ri&&(a.sys.Battery||0)>0)tryAdd(()=>{p.bri=1},()=>{p.bri=0}); // [H7.47, C12.25] one battery point held as reserve impulse power
 return p}

// [P2.21, P2.211, P2.23] With the AI switch on, a computer ship that is much weaker than its foe heads for a hex two away from the planet on the far side, where the planet blocks the line of fire, until the foe moves round it.
function aiCover(s,o){if(!AIO||!AIO.terr||s===sh[0]||s.retreat||!TER.plan||s.merch||s.d.base)return null;if(power(s)>=power(o)*0.6)return null;
 const P=TER.plan;let best=null,bd=-1;for(let c=Math.max(1,P.c-3);c<=Math.min(COLS,P.c+3);c++)for(let r=Math.max(1,P.r-3);r<=Math.min(ROWS,P.r+3);r++){if(dist({c,r},P)!==2||terBlk(c,r))continue;const d=dist({c,r},o);if(d>bd){bd=d;best=({c,r})}}
 if(!best||dist(s,best)<=1)return null;return best}
function aiOpts(a,i){if(!AIO||a.out||a.boom||a.neu||a.merch||a.d.base)return;const foe=foeOf(a);if(!foe||foe.out||foe.boom)return;
 // [C12.25] reserve impulse power: one more point of speed when running away or when the range has opened beyond 14 hexes
 if(AIO.ri&&(a.bi||0)>=1&&!a.impMove&&a.sp>0&&a.sp<31&&(a.retreat||dist(a,foe)>14)&&!a.ed){const n0=(a.unp||[]).length;unpCore(a,true,a.sp+1,32,()=>{});if((a.unp||[]).length>n0)return}
 // [G7.5, G7.51] tractor an enemy drone that comes within one hex; [G7.41] tractor a crippled or much weaker ship, and let go when running
 if(AIO.trac){DR.filter(d=>!d.pl&&!d.held&&d.own&&d.own.tm!==a.tm&&dist(a,d)<=1).forEach(d=>{if(!trWhy(a,d))tractorOn(a,d,i)});
  if(LNK&&LNK.by===a&&a.retreat)breakLink('it was released','G7.33');
  else if(!LNK&&!a.retreat&&!shipTrWhy(a,foe)&&(isCrip(foe)||power(a)>=power(foe)*1.3))tractShip(a,foe,i,0)}
 // [D7.8, D7.3] raids and boarding, only when the enemy's facing shield is down and a transporter is in range
 if(AIO.board&&(a.tnLeft||0)>0&&dist(a,foe)<=5&&!beamWhy(a,foe)){const k2=shieldFor(foe,a).k,blk=foe.shOn>0&&((foe.sh[k2]||0)>0||((foe.spec&&foe.spec[k2])||0)>0||(foe.gen||0)>0)&&!(foe.dn&&foe.dn[k2]&&absI(i)<foe.dn[k2]);
  if(blk)return;const fr=freeBP(foe);
  if(freeBP(a)>=3&&freeBP(a)>=Math.ceil(fr*1.5)){beamAboard(a,foe,i,Math.min(freeBP(a),a.tnLeft));return} // [D7.3] board only when clearly stronger
  if(!raidWhy(a,foe)){const t=raidTargets(foe),w=t.find(x=>/^(ph|tu|di|pl):/.test(x.id))||t.find(x=>x.id==='s:Sensor')||t[0];if(w)raidRun(a,foe,i,w.id)}}}


