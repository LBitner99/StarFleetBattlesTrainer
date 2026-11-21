/* ===== Orion option mounts (G15.4, Annex #8B, R8.R3) and OAKDISC (FD4.5). Master Rulebook rules, behind the switch optOM. =====
   The Orion Raider Cruiser has three option mounts (the OPT boxes on its SSD): A on the centerline (forward) and B and C in the left and right wings.
   A mount's choice is stored in the ship's refit list as 'om<mount>:<code>' (mount 0 = centerline, 1 = left wing, 2 = right wing). With no entry a mount holds the standard
   disruptor-22 (cost 0), which is how the ship was built before this option. refitDef() applies the choices to the ship definition, prep() draws them on the SSD. */
let optOM=false;
const OMW={ // [Annex #8B] cost is the BPV change; k = kind of box; ctr = centerline mounts only (G15.42, Annex #8B note)
 D15:{n:'Disruptor-15',pv:-1,k:'ds',mx:15},D22:{n:'Disruptor-22 (standard)',pv:0,k:'ds',mx:22},D30:{n:'Disruptor-30',pv:1,k:'ds',mx:30},
 P1:{n:'Phaser-1',pv:0,k:'ph',T:'P1'},P2:{n:'Phaser-2',pv:-0.25,k:'ph',T:'P2'},P3:{n:'Phaser-3',pv:-0.5,k:'ph',T:'P3'},
 PHO:{n:'Photon torpedo',pv:0,k:'pt'},PLF:{n:'Plasma-F (no swivel)',pv:0,k:'pl',T:'F'},PLFS:{n:'Plasma-F (swivel)',pv:1,k:'pl',T:'F',sw:1},
 DRA:{n:'Drone rack A',pv:0,k:'rk',rt:'A'},DRB:{n:'Drone rack B',pv:1,k:'rk',rt:'B'},DRC:{n:'Drone rack C',pv:1,k:'rk',rt:'C'},
 AD6:{n:'ADD (6 rounds)',pv:0,k:'ad',am:6},AD12:{n:'ADD (12 rounds)',pv:1,k:'ad',am:12},
 BAT:{n:'Battery',pv:0,k:'y',sy:'Battery'},APR:{n:'APR',pv:0,k:'y',sy:'APR'},LAB:{n:'Lab',pv:0,k:'y',sy:'Lab'},CGO:{n:'Cargo',pv:0,k:'y',sy:'Cargo'},
 TRC:{n:'Tractor beam',pv:0,k:'y',sy:'Tractor'},PRB:{n:'Probe launcher',pv:0,k:'y',sy:'Probe'},TRN:{n:'Transporter (centerline only)',pv:0,k:'y',sy:'Trans',ctr:1},HUL:{n:'Hull (centerline only)',pv:0,k:'y',sy:'C Hull',ctr:1}};
const OMNAME=['Centerline (A)','Left wing (B)','Right wing (C)'];
const isOM=i=>/^om\d:/.test(i);
function omGet(ids){const m=['D22','D22','D22'];(ids||[]).forEach(i=>{if(isOM(i)){const c=i.slice(4);if(OMW[c])m[+i[2]]=c}});return m}
function omOn(key,ids){return key==='CR'&&(ids||[]).some(isOM)}
const omArc=(w,m)=>w.k==='ds'?[['LF','RF'],['L','LF'],['RF','R']][m]:w.k==='pt'?['LF','RF']:w.k==='ph'?[['LF','RF'],['LF','L','LR'],['RF','R','RR']][m]:w.k==='pl'?(m===0||w.sw?['L','LF','RF','R']:m===1?['L','LF','RF']:['LF','RF','R']):['ALL']; // [R8.R3] centerline: FA (FP for plasma); wings: disruptor L+LF / RF+R, phaser LS / RS, plasma LP / RP, drone and ADD 360 degrees. A swivel plasma mount is given the whole forward-plasma arc (my reading).
// [G15.4] apply the chosen mounts to a ship definition built by refitDef (called from there)
function omApply(d,ids){const m=omGet(ids);d.dis=null;let ds=[],P=0;d.rackT=[];d.addT=[];const torp=[],pl=[];
 m.forEach((c,k)=>{const w=OMW[c];P+=w.pv;
  if(w.k==='ds')ds.push({a:omArc(w,k),mx:w.mx});else if(w.k==='ph')d.phs.push({T:TT[w.T],arcs:omArc(w,k)});else if(w.k==='pt')torp.push(1);else if(w.k==='pl')d.plas.push({T:w.T,arcs:omArc(w,k)});
  else if(w.k==='rk'){d.sys.Drone=(d.sys.Drone||0)+1;d.rackT.push(w.rt)}else if(w.k==='ad'){d.sys.Add=(d.sys.Add||0)+1;d.addT.push(w.am)}else if(w.k==='y')d.sys[w.sy]=(d.sys[w.sy]||0)+1});
 if(ds.length)d.dis={n:ds.length,arcs:ds[0].a,max:22,each:ds.map(x=>x.a),maxs:ds.map(x=>x.mx)};
 if(torp.length)d.torp={n:torp.length,arcs:['LF','RF']};
 d.pv+=P;d.derf=!!(d.dis&&d.dis.maxs.some(x=>x>=30)); // [SSD note] a CR with a disruptor of range 30 or more has DERFACS at no cost (Y168)
 d.omName=m.map((c,k)=>OMNAME[k].split(' ')[0]+' '+OMW[c].n.replace(' (standard)','')).join(', ')}
function omCost(ids){return omGet(ids).reduce((t,c)=>t+OMW[c].pv,0)}
function setOM(who,k,c){const t=curTab(who);let a=slotRf(who,t).filter(i=>!(isOM(i)&&+i[2]===k));if(c!=='D22')a.push('om'+k+':'+c);setSlot(who,t,slotK(who,t),a);drawSel()}
function omRoll(){const T=[['D22',40],['D15',6],['D30',9],['PHO',10],['P3',7],['P1',4],['DRA',6],['DRC',4],['PLF',6],['PLFS',3],['AD6',3],['TRC',2]],tot=T.reduce((a,b)=>a+b[1],0);
 return [0,1,2].map(k=>{let r=Math.random()*tot,c='D22';for(const [x,w] of T){if((r-=w)<0){c=x;break}}return c}).map((c,k)=>c==='D22'?null:'om'+k+':'+c).filter(Boolean)} // [G15.44] a rough availability roll for computer pirates (not the book's cartel tables)
function omUI(who){if(!optOM)return'';const ids=slotRf(who),m=omGet(ids);
 return`<div class="rfs"><b>Option mounts (G15.4, Master Rulebook)</b>`+m.map((c,k)=>`<label class="rf">${OMNAME[k]} <select onchange="setOM(${who},${k},this.value)">${Object.keys(OMW).filter(x=>k===0||!OMW[x].ctr).map(x=>`<option value="${x}" ${x===c?'selected':''}>${OMW[x].n} (${OMW[x].pv>0?'+':''}${OMW[x].pv} BPV)</option>`).join('')}</select></label>`).join('')+`<small>Weapons from Annex #8B that a size-3 Orion ship can take: no Phaser-4, hellbore, Plasma-R, Plasma-G or S (they need two adjacent centerline mounts) and no D40 (not in this game). Wing mounts cannot hold hull or transporters (G15.42).</small></div>`}
// [FD4.5] OAKDISC: an Orion ship with it controls twice as many seeking weapons as its sensor rating (F3.21)
const ctlMax=s=>sensorRate(s)*(s.d&&s.d.oak?2:1);
