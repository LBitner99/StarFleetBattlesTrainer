/* ===== Crew quality (G21, optional): s.cq is -1 for a poor crew, 0 for an average crew, +1 for an outstanding crew. It is chosen for each side on the start screen (crewQ). ===== */
const cq=s=>(s&&s.cq)||0,cqSh=(n,s)=>n>0?Math.floor(Math.sqrt(n)):(n<0&&cq(s)>0?-1:0); // [G21.211] an outstanding crew's natural ECCM can push the net EW below zero for a shift of -1
const emToEn=f=>cq(f)<0?3:cq(f)>0?5:4,emOwn=s=>cq(s)<0?5:cq(s)>0?3:4; // [C10.41, G21.127, G21.227] ECM an erratic ship gives the enemy, and the penalty on its own fire
const cqTerr=(s,d)=>Math.max(1,Math.min(6,d+(cq(s)<0?1:cq(s)>0?-1:0))); // [G21.128, G21.228] terrain rolls (rings, asteroids, moons) shift one against a poor crew and one in favour of an outstanding crew
const hetC=s=>5*(cq(s)<0?1.2:cq(s)>0?.8:1); // [G21.122, G21.222] HET cost +20% / -20%
function crewEW(s){const q=cq(s);if(!q||s.pfc)return;let t=(s.ecm||0)+(s.eccm||0);if(t<1)return;
 if(q<0){if(s.eccm>=s.ecm&&s.eccm>0)s.eccm--;else s.ecm--;t=s.ecm+s.eccm;while(t>5){if(s.eccm>=s.ecm)s.eccm--;else s.ecm--;t--}L(`  ${s.tag}'s poor crew gets one point less electronic warfare than it paid for: ${s.ecm} ECM / ${s.eccm} ECCM (at most five points).`+RL('G21.1121'))}
 else{if(s.eccm>=s.ecm)s.eccm++;else s.ecm++;L(`  ${s.tag}'s outstanding crew turns its first point of EW energy into two: ${s.ecm} ECM / ${s.eccm} ECCM.`+RL('G21.2121'))}}
// [D6.1, D9.1] Read a track (sensor, scanner, damage control) at the current number of boxes lost.
const trkVal=(s,n)=>{const t=s.d.trk[n],l=s.d.sys[n]-s.sys[n];return t[Math.min(t.length-1,Math.max(0,l))]};
// [D6.11, D6.12] Sensor rating (lock-on) and scanner adjustment, from the SSD tracks.
const sensorRate=s=>trkVal(s,'Sensor')+(s.legSn||0),scanAdj=s=>trkVal(s,'Scanner')-(s.legSc||0); // [G22.71, G22.712] a legendary weapons officer can add a point to the sensor rating or take one off the scanner penalty (down to -1)
// [G13.1] Is the cloaking device on, fading in or fading out?
// [G13.61] Hidden movement (option optHide): an enemy that is fully cloaked and not locked onto vanishes from the board, its hex, facing and range are not shown, and its movement is not logged. On impulses 8 and 24 each of your ships is told the 60 degree arc and the true range (G13.612).
const ckHid=s=>optHide&&s!==sh[0]&&s.tm!==0&&!!s.ck&&s.ck.mode==='on'&&!s.ck.lockBy&&!over;
const ckOn=s=>!!(s.ck&&s.ck.mode!=='off');
// [D6.2, D19.1, G13.51] Active fire control works (not cloaked, not passive).
const fcOk=s=>s.fc&&!ckOn(s)&&!s.pfc;
// [G13.36] Fade option (b): during a fade the ship's owner chose normal EW shifts instead of the chart (decided and announced when the fade began).
const ckFadeB=f=>!!(f.ck&&f.ck.mode!=='on'&&f.ck.mode!=='off'&&f.ck.fadeOpt==='b');
// [G13.62] Experience in tracking (option): the range penalty starts at 10 and drops by 1 for each earlier turn in which this firing ship scored direct-fire damage on the fully cloaked target, never below 3.
const ckTrk=(s,f)=>{if(!optCkExp)return 5;const n=((s.trkT||{})[f.tag]||[]).filter(t=>t<turn).length;return Math.max(3,10-n)};
// [G13.14, G13.15] Fade-in and fade-out penalty on the cloak chart.
const ckPen=(s,A)=>{const k=s.ck;if(!k||k.mode==='off')return 0;if(k.mode==='out')return Math.min(5,A-k.start+1);if(k.mode==='in')return Math.max(0,5-(A-k.start));return 5};
// [D6.123, D19.23] Effective range: doubled without lock-on or with passive fire control.
const effRange=(s,foe)=>{const r=dist(s,foe);let e=(s.lock===false||s.pfc)?2*r:r;
 if(ckOn(foe)){if(foe.ck.mode==='on'){if(!foe.ck.lockBy&&s.lock!==false)e=2*r;if(!(LNK&&LNK.by===s&&LNK.on===foe))e+=ckTrk(s,foe)}else e+=ckPen(foe,absI(imp+1))} // [G13.302, G13.43, G13.62] +5 hexes (more with the tracking-experience option); none for a ship that holds the cloaked one in its tractor beam
 return e+scanAdj(s)};
const smallNat=(s,foe,k)=>{if(foe.dr||!nimble(foe)||k==='pl')return 0;const r=effRange(s,foe);return r>=30?4:r>=15?2:0}; // E1.7: nimble ships count as small targets for direct fire
const ecmOf=s=>(s.ecm||0)+(typeof pwEcm==='function'?pwEcm(s):0)+(s.tum?4:0)+(typeof wwBenefit==='function'&&wwBenefit(s)?6:0)+((s.d&&s.d.ecmB&&!(s.dbl&&(s.dbl[0]||s.dbl[1])))?s.d.ecmB:0); // G15.8: Orion stealth bonus, lost while a warp engine is doubled (G15.82)
const ewShift0=(s,foe,k)=>ckOn(foe)&&!ckFadeB(foe)?0:foe.dr?(k==='ph'?0:sqrtShift(4-(s.eccm||0))):cqSh(ecmOf(foe)+Math.max(foe.emOn?emToEn(foe):0,smallNat(s,foe,k))+astN(s,foe)+hzEcm(s,foe)+planEcm(s,foe)+zEcm()+(NEB()?9:0)+(s.emOn?emOwn(s):0)+(cq(s)<0?3:0)-(cq(s)>0?3:0)-(s.eccm||0),s);
const ewShift=(s,foe,k)=>ewShift0(s,foe,k)+(optLand&&k==='ph'&&!ckOn(foe)?atmN(s,foe):0)-(hasRole(sh.includes(s)?s:null,'weapons')?1:0); // [G22.721] a legendary weapons officer improves every direct-fire die roll by one
// [E2.4] Phaser damage from the type table, by range column and die roll (a shift past 6 moves to the next column, E1.82).
function phDmg(T,re,d,sf){let d2=d+sf,ex=0;if(d2>6){ex=d2-6;d2=6}if(d2<1)d2=1;const c=Math.min(T.d[0].length-1,colOf(T,re)+ex);return T.d[d2-1][c]}
// [D6.5, D6.51] Is the UIM module available this impulse?
const uimOn=(s,w)=>s.uim>0&&s.lock!==false&&absI(imp+1)>=s.uimWait,uimHelps=(w,re,ov)=>ov?(re>=3&&re<=8):(re>=16&&re<=22);
// [E1.0, E3.22, E4.12, G5.31] Hit chance, damage and expected damage of a disruptor, photon, plasma bolt or probe shot at a range.
function shotInfo(kind,w,r,re,sf){re=re===undefined?r:re;sf=sf||0;if(ZR()&&r>25)return null; // [P15.6] static on the sensors: weapons reach 25 hexes at most in a radiation zone or ion storm
 const mk=(hs,dmg,ov)=>{const h=Math.min(6,hs-sf),pp=Math.max(0,h)/6;return{p:pp,h,dmg,exp:dmg*pp,ov:ov?1:undefined}};
 if(kind==='ph'){const T=w.T;if(re>T.max)return null;const row=[1,2,3,4,5,6].map(d=>phDmg(T,re,d,sf)),exp=row.reduce((a,b)=>a+b)/6;return exp>0||sf>0?{exp,row}:null}
 if(kind==='tu'){const ov=w&&w.ovl>0;if(w&&w.px&&!ov){if(r<9||re>PHO.max)return null;const hs=PHO.h[colOf(PHO,re)];return hs?mk(Math.min(6,hs+2),4):null}if(r<2&&!ov)return null;
  if(ov){if(r>8)return null;const hs=re<=8?(re<=1?6:re===2?5:re<=4?4:3):PHO.h[colOf(PHO,re)];if(!hs)return null;return mk(hs,[8,10,12,14,16][Math.min(4,w.ovl)],1)}
  if(re>PHO.max)return null;const hs=PHO.h[colOf(PHO,re)];return hs?mk(hs,PHO.dm):null}
 if(kind==='pr'){const need=Math.max(1,r+sf);if(r>6||need>6||(NEB()&&r>2))return null;const p=(7-need)/6; /* [P6.72] probes reach only two hexes in a nebula */ return{p,h:7-need,need,dmg:8,exp:8*p}}
 if(kind==='pb'){const hs=r<=5?4:r<=10?3:r<=20?2:r<=31?1:0;if(!hs||re>31)return null;const dmg=Math.floor(PLA[plEff(w)].t[PCOL(r)]/2);return dmg>0?mk(hs,dmg):null}
 const mx=w.max||DIS.max;
 if(w.ovl){if(r>8||re>mx)return null;const hs=re<=8?OVD.h[colOf(OVD,w.um&&re>=3?2:re)]:DIS.h[colOf(DIS,re)];return hs?mk(hs,OVD.dm[colOf(OVD,r)],1):null}
 if(r<1||re>mx)return null;const hs=DIS.h[colOf(DIS,(w.um&&re>=16&&re<=22)?15:(w.derf&&re>=23&&re<=30)?22:re)];return hs?mk(hs,DIS.dm[colOf(DIS,r)]):null}
// [G5.3] Probes can be fired as weapons only by a crippled ship (unless the option says otherwise).
const probeOK=s=>optProbe&&(probeAny||cripWhy(s).length>0||hasRole(s,'captain')); // [G22.221] a legendary captain may use the probe as a weapon on an undamaged ship
// [G5.33] Is the target on the straight line ahead of the ship (a probe must go straight)?
function inRow(s,foe){const n=dist(s,foe);let c=s.c,r=s.r;for(let k=0;k<n;k++){[c,r]=NB(c,r,s.f)}return c===foe.c&&r===foe.r}
// [E1.0] Every weapon the ship can fire this impulse.
function weapons(s){const o=[];s.ph.forEach((w,i)=>o.push({kind:'ph',w,id:'ph'+i}));s.tu.forEach((w,i)=>o.push({kind:'tu',w,id:'tu'+i}));s.di.forEach((w,i)=>o.push({kind:'di',w,id:'di'+i}));if(optBolt&&s===sh[0])s.pl.forEach((w,i)=>o.push({kind:'pb',w,id:'pb'+i}));if(optProbe&&s===sh[0])s.pr.forEach((w,i)=>{if(i<(s.sys.Probe||0))o.push({kind:'pr',w,id:'pr'+i})});return o}
// [D1.0, D2.0, E1.5, D6.0, G10.61] Can this weapon fire at this target now, and why not: arc, range, fire control, recharge, web.
function wStatus(s,x,foe){const w=x.w,r=dist(s,foe),a=rel(s,foe);{const dw=dockFireWhy(s,foe)||pwFireWhy(s,foe);if(dw)return{ok:false,why:dw}}
 if(!w.alive)return{ok:false,why:'Destroyed'};if(!mannedW(s,w))return{ok:false,why:'Undermanned: no crew unit free to operate it (G9.422)'};if(absI(imp+1)<=s.noFire)return{ok:false,why:'Post-breakdown: no weapons (C6.5471)'};if(w.fired)return{ok:false,why:'Fired this turn'};if(w.la!==undefined&&absI(imp+1)-w.la<8)return{ok:false,why:'Fired less than eight impulses ago (E1.5)'};if(!s.fc||ckOn(s))return{ok:false,why:ckOn(s)?'Cloaked: no fire control (G13.51)':'No fire control'};if(s.pfc&&s.emOn)return{ok:false,why:'Passive fire control does not work while erratic (D19.25)'};if(s.pfc&&r>5)return{ok:false,why:'Passive fire control: targets must be within 5 hexes (D19.23)'};if(!foe.dr&&TER.moon&&MOONB.has(moonKey(s,foe)))return{ok:false,why:'The moon has broken the lock-on (P2.3221)'};if(foe.neu==='eel'&&EEL&&(EEL.kind==='eel'||EEL.kind==='crusher')&&r>6)return{ok:false,why:EEL.kind==='crusher'?'The Planet Crusher cannot be hit from beyond six hexes (SM1.46)':'The Moray Eel cannot be hit from beyond six hexes (SM3.49)'};if(foe.dr&&foe.pl&&x.kind!=='ph')return{ok:false,why:'Only phasers can damage plasma (FP1.61)'};if(TBLK.size&&terLos(s,foe))return{ok:false,why:''+(hzLos(s,foe)||'A planet is in the line of fire (P2.211)')};
 if(x.kind==='ph'&&s.capCur<(x.lp?P3.cp:(w.T.cp||1))-1e-9) // [E2.251] a Ph-1/2/4 fired as a Ph-3 needs only half a point
 return{ok:false,why:'Capacitor empty'};
 if(x.kind==='tu'&&w.state!=='armed')return{ok:false,why:w.state==='half'?'Half armed':'Not armed'};
 if(x.kind==='di'&&!w.armed)return{ok:false,why:'No power'};
 if(x.kind==='pb'&&!(w.rdy||w.st===3))return{ok:false,why:'Not fully armed'};
 if(x.kind==='pr'){if(w.st!==2)return{ok:false,why:'Probe not armed (two turns of 2 warp energy)'};if(w.ammo<=0)return{ok:false,why:'No probes left'};if(!probeOK(s))return{ok:false,why:'Probes can only be fired as weapons by a crippled ship (G5.3)'};if(!inRow(s,foe))return{ok:false,why:'Probes can only be fired straight ahead (G5.33)'}}
 if(!w.arcs.some(t=>inTok(t,a)))return{ok:false,why:'Target not in arc'};
 if(optWeb&&webFire(s,foe,x.kind).block)return{ok:false,why:'A web hex lies in the line of fire (G10.61)'};
 if(x.kind==='di'&&w.lockTo&&absI(imp+1)<w.lockTo)return{ok:false,why:'Locked out after a UIM burnout (D6.541)'};
 if(x.kind==='di')w.um=uimOn(s,w);
 const re=effRange(s,foe),sf=ewShift(s,foe,x.kind),info=shotInfo(x.kind,w,r,re,sf);if(!info)return{ok:false,why:x.kind==='tu'&&r<2&&!w.ovl?'Too close (range 0–1)':re>r?`Out of range (effective range ${re})`:'Out of range'};
 return{ok:true,why:'Ready',info,r}}
