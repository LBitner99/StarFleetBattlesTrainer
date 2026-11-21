/* ================= energy cost / plan ================= */
// [C7.11] Warp engine boxes the ship started with.
const warp0=s=>(s.d.sys['Left W En']||0)+(s.d.sys['Right W En']||0)+(s.d.sys['Center W En']||0);
const disNeed=s=>Math.min(Math.ceil(warp0(s)/2),15); // C7.11
function maxSpd(s,p){ // highest speed the warp engines can pay for after life support, shields and fire control (C7.11, C7.124); the acceleration limit does not count (C7.121)
 const P=pw(s),ls=isCrip(s)?0:s.d.ls,fc=p.fc?1:0,sh=p.sh===0?0:p.sh===1?s.d.shc[0]:s.d.shc[0]+s.d.shc[1];
 for(let v=s.d.dbl?30:31;v>=1;v--){const mE=Math.ceil(v*s.d.mc-1e-9),imp=(mE>=1&&P.imp>=1&&!p.stac&&!(optRI&&p.ifree))?1:0,wm=mE-imp,nonW=(P.imp-imp)+P.apr,ex=Math.max(0,ls+fc+sh-nonW);if(wm+ex<=P.warp)return v}return 0}
function cost(s,p){s.dbl=(s.d.dbl&&p.dbl&&(p.dbl[0]||p.dbl[1]||p.dbl[2]))?[p.dbl[0]?1:0,p.dbl[1]?1:0,p.dbl[2]?1:0]:null; // [G15.21, G15.23] each engine doubles individually, impulse included
if(!optHet)p.het=0;if(!optTac){p.tac=0;p.stac=0}if(!optOvl){p.tuo=(p.tuo||[]).map(()=>0);p.di=p.di.map(v=>v===2?1:v)}if(!optRev){p.rev=undefined;p.brk=undefined}if(!optChg)p.chg=[];const P=pw(s),e=[],ls=isCrip(s)?0:s.d.ls,fc=p.fc?1:0,grE=planPlot(s,p,e);const wsd=!!(p.wsd&&p.clk&&s.d.clk&&s.d.clk[1]!==undefined);if(wsd){P.warp=0;if(p.spd>0)e.push('With the warp engines shut down the ship has no warp power to move with (G13.22): set the speed to 0');if(s.dbl&&(s.dbl[0]||s.dbl[1]))e.push('A ship cannot double a warp engine it has shut down (G13.22)')} // [G13.22] warp engines not used: the cloak costs its (lower) shutdown figure
 const room=Math.max(0,capMax(s)-s.capCur);if(p.ph>room)e.push(`Phasers can take only ${room} more point${room===1?'':'s'} (capacitor, H6.21)`);
 let tuW=0,tuO=0,tuX=0;
 s.tu.forEach((t,i)=>{if(!t.alive)return;const a=p.tu[i],x=(p.tuo&&p.tuo[i])||0;
  if(x>0){if(a!=='arm'&&a!=='hold')e.push(`${t.name}: overload energy needs the torpedo to be arming or held (E4.411)`);else if((t.ovl||0)+x>4)e.push(`${t.name} can take at most ${4-(t.ovl||0)} more overload energy (E4.41)`);else tuX+=x}
  if(a==='arm'){if(t.state==='armed')e.push(`${t.name} is already armed: hold it or fire it`);else tuW+=2}
  else if(a==='hold'){if(t.state!=='armed')e.push(`${t.name} cannot be held until it is fully armed (E4.22)`);else tuO+=(t.ovl>0?2:1)}});
 let dis=0;s.di.forEach((d,i)=>{const v=p.di[i];if(v){if(!d.alive)e.push(`${d.name} is destroyed`);else dis+=v===2?4:2}});
 const bd=p.bd||0,br=p.br||0,brw=p.brw||0,bri=optRI?Math.max(0,p.bri|0):0,capB=s.sys.Battery||0; // [H7.47] bri = recharge with impulse power (reserve impulse)
 if(bd>s.bat)e.push(`Only ${s.bat} battery(ies) are charged (H5.0)`);
 if(br+brw+bri>Math.max(0,capB-(s.bat-bd)))e.push(`Only ${Math.max(0,capB-(s.bat-bd))} battery(ies) can be recharged after discharging (H5.3, H7.43)`);
 const sh=p.sh===0?0:p.sh===1?s.d.shc[0]:s.d.shc[0]+s.d.shc[1];
 const gen=p.gen,spec=p.spec.reduce((a,b)=>a+b,0),dsb=p.dsh.reduce((a,b)=>a+b,0),dcE=2*dsb,rate=dcRating(s);
 if(dcE>rate)e.push(`Damage control can take at most ${rate} energy (your rating, D9.21); you allocated ${dcE}`);
 p.dsh.forEach((v,k)=>{if(v>missing(s,k))e.push(`Shield #${k+1} has only ${missing(s,k)} destroyed box${missing(s,k)===1?'':'es'} to repair (D9.22: only boxes lost in earlier turns)`)});
 if((gen>0||spec>0)&&p.sh<1)e.push('Reinforcement needs the shields turned on (D3.34)');
 p.spec.forEach((v,k)=>{if(v>0&&s.sh[k]<=0)e.push(`Shield #${k+1} is down and cannot be reinforced (D3.343)`)});
 const lim=accLim(s,p);
 if(p.spd>lim)e.push(`Speed ${p.spd} is above your limit of ${lim} (C2.21: previous speed plus 10, or double, whichever is more)`);
 const bkE=brkPaid(s,p),mE0=Math.ceil(plotHexes(p)*s.d.mc-1e-9),mE=mE0+bkE,stac=p.stac?1:0,imp=(mE>=1&&P.imp>=1&&!stac&&!(optRI&&p.ifree))?1:0,wm=Math.max(0,mE-imp); // [C2.111, C12.25] with the impulse engines kept out of movement (optRI) all movement is paid with warp power and the impulse point can become reserve impulse
 if(needBrk(s,p)){const full=brkFull(s);if(p.dis)e.push('A ship cannot reverse and disengage by acceleration in the same turn');if(bkE<full){const lh=Math.max(s.lastHet||-99,s.lastQr||-99);if(absI(1)-lh<8)e.push('A quick reverse cannot be made within 1/4 turn of an HET or another quick reverse (C3.62)')}}
 {const ch=(optChg&&p.chg||[]).slice().sort((x,y)=>x.e-y.e);if(ch.length){if(ch.length>4)e.push('At most four speed changes a turn (C12.311)');if(p.dis)e.push('A ship cannot change speed in mid-turn and disengage by acceleration');if(p.stac)e.push('Sublight tactical maneuvers cannot be combined with mid-turn speed changes in this game (C5.5, C5.531)');
  const a=spdPlot(p);let cur=p.spd,pe=-99;ch.forEach((c,ix)=>{const n=ix+1;if(!(c.e>=4&&c.e<=28))e.push(`Speed change ${n}: it must take effect between impulse 4 and 28 (C12.313)`);if(ix&&c.e-pe<8)e.push(`Speed change ${n}: at least eight impulses after the one before (C12.312)`);if(c.rev){if(cur!==0)e.push(`Speed change ${n}: to switch to reverse the ship must first be at speed zero (C12.37)`);else if(!ix&&c.e<(nimble(s)?7:9))e.push(`Speed change ${n}: a ship stopped from impulse 1 may accelerate in reverse from impulse ${nimble(s)?7:9} (C12.37)`);if(c.v<=0)e.push(`Speed change ${n}: choose a speed above zero to move in reverse (C12.37)`)}if(c.v<0||c.v>31)e.push(`Speed change ${n}: speed must be 0 to 31`);
   const dec=cur>=8?Math.ceil(cur/2):4;if(c.v<cur&&cur-c.v>dec)e.push(`Speed change ${n}: from speed ${cur} you can slow by at most ${dec} (C12.32)`);
   let low=99;for(let k=c.e;k<=32;k++){const ls=s.lastSph&&s.lastSph[k]!==undefined?s.lastSph[k]:(s.prev||0);low=Math.min(low,ls)}for(let k=1;k<c.e;k++)low=Math.min(low,a[k]);
   let mx=low+Math.max(low,10);if(optFly)mx=Math.max(mx,lim);if(c.v>mx)e.push(`Speed change ${n}: the lowest speed in the previous 32 impulses was ${low}, so you can reach at most ${Math.min(31,mx)} (C12.33)`);cur=c.v;pe=c.e})}}
 const hetE=hetC(s)*p.het;if(p.het>4)e.push('At most four HETs a turn (C6.36)');
 const tac=p.tac||0,tacE=Math.ceil(tac*s.d.mc-1e-9);if(tac>(cq(s)<0?2:cq(s)>0?6:4))e.push(`At most ${cq(s)<0?2:cq(s)>0?6:4} warp tactical maneuvers a turn (C5.22${cq(s)?', G21.124, G21.224':''})`);if(tac>0&&p.spd>0&&!(optChg&&(p.chg||[]).length))e.push('Tactical maneuvers are for a ship that stays in its hex: set the speed to 0 (C5.21), or plot a stop in mid-turn (C5.52)');if(tac>0&&optChg&&(p.chg||[]).length){const o=tacOpp(p);if(tac>o)e.push(`Only ${o} tactical maneuver${o===1?'':'s'} can be made in the stops you plotted: one on impulse 8, 16 or 24 after four impulses at speed zero (C5.52, C5.532)`)};
 if(p.dis&&noDis(s))e.push('No unit can disengage within ten hexes of a black hole or pulsar, or with it in the forward arc (P4.28, P5.351)');
 if(p.dis&&s.d.noDA)e.push('This ship cannot disengage by acceleration (R1.5, R1.6)');
 if(p.dis){const mx=maxSpd(s,p);if(p.spd!==mx)e.push(`To disengage by acceleration you must fly the whole turn at the highest speed your warp power allows, which is ${mx} (C7.11)`);if(warp0(s)<=0)e.push('A ship without warp engines cannot disengage by acceleration (C7.11)');if(pw(s).warp<disNeed(s))e.push(`Disengaging by acceleration needs at least ${disNeed(s)} warp power now (half the original, at most 15, C7.11)`)}
 if(NEB()){if(p.sh>1)e.push('Shields work only at minimum strength inside a nebula (P6.3)');if(Math.floor(p.gen/2)>5)e.push('General reinforcement is limited to 5 points in a nebula (P6.3)');if(p.spec.some(v=>v>5))e.push('Specific reinforcement is limited to 5 points per shield in a nebula (P6.3)');if(p.clk)e.push('Cloaking devices do not work in a nebula (P6.6)');if((p.trac|0)>0||(p.ntrac|0)>0)e.push('Tractor beams do not work in a nebula (P6.6)');if((p.trn|0)>0)e.push('Transporters do not work in a nebula (P6.6)');if((p.wb|0)>0)e.push('Webs do not work in a nebula (P6.6)')}
 const ew=(p.ecm||0)+(p.eccm||0),rt=sensorRate(s);if(ew>rt)e.push(`ECM plus ECCM is limited to your sensor rating, ${rt} (D6.310)`);
 let plE=0;s.pl.forEach((t,i)=>{if(!t.alive)return;const a=(p.pl||[])[i],ef=plDL(t,p,i),T=PLA[ef];
  if(p.rd&&p.rd[i]&&!(optPF&&a==='arm'&&t.st===2))p.rd[i]=0;if(p.rd&&p.rd[i]){if(p.ept)p.ept[i]=0;if(p.sg)p.sg[i]=0} // [FP1.221] rolling delay: only on the third turn of arming, and not together with an enveloping or shotgun finish
  if(p.ept&&p.ept[i]&&!(optEPT&&a==='arm'&&t.st===2&&ef!=='F'))p.ept[i]=0;if(p.sg&&p.sg[i]&&!(optSG&&a==='arm'&&t.st===2&&ef!=='F'))p.sg[i]=0;if(p.sg&&p.sg[i]&&p.ept&&p.ept[i])e.push(`${t.name} cannot be completed as both a shotgun and an enveloping torpedo (FP7.31)`); // [FP7.31, FP7.32, FP7.33]
  if(a==='arm'){if(t.st>=3)e.push(`${t.name} is already armed: hold it or fire it`);else plE+=(p.rd&&p.rd[i]?(ef==='F'?1:2):T.c[t.st]+(p.ept&&p.ept[i]?T.c[2]:0)+(p.sg&&p.sg[i]?T.c[2]:0))} // [FP1.221] rolling delay pays only 2 (1 for a type-F) on the third turn // [FP7.32] the last turn of a shotgun costs double
  else if(a==='hold'){if(t.sg)e.push(`${t.name} is loaded as a shotgun and cannot be held (FP7.41)`);else if(t.ept)e.push(`${t.name} is armed as an enveloping torpedo and cannot be held (FP5.22)`);else if(t.st<3)e.push(`${t.name} is not fully armed yet (FP1.24)`);else if(T.h===null)e.push(`${t.name}: a plasma-R cannot be held on a ship (FP2.12)`);else if(t.noHold)e.push(`${t.name} was raised with reserve power while held and cannot be held again (FP1.961)`);else plE+=plHoldC(t)}});
 const wbE=optWeb&&webOk(s)?Math.max(0,p.wb|0):0; // [G10.211, G10.2121] web energy is allocated at the start of the turn
 const trE=optTrac?Math.max(0,Math.min(p.trac|0,s.sys.Tractor||0))+((p.trac|0)>0?Math.max(0,p.trx|0):0)+Math.max(0,p.ntrac|0):0;if(optTrac&&(p.trac|0)>(s.sys.Tractor||0))e.push(`You only have ${s.sys.Tractor||0} tractor beam${(s.sys.Tractor||0)===1?'':'s'} (G7.11)`);
 const clkE=p.clk&&s.d.clk?wsd?s.d.clk[1]:Math.ceil(s.d.clk[0]*(s.d.dbl&&s.dbl?(s.dbl[0]&&s.dbl[1]?2:(s.dbl[0]||s.dbl[1])?1.5:1):1)-1e-9):0; // [G15.32] doubled warp engines double the cloak cost; one of two engines adds 50%; doubled impulse adds nothing
 if(p.clk&&!s.d.clk)e.push('This ship has no cloaking device');if(p.clk&&s.ckDead)e.push('The cloaking device was destroyed by a hit-and-run raid (G13.161)');
 const emE=p.em&&optEM?emCost(s):0,stE=stac?1:0;
 if(p.em&&!optEM)e.push('Erratic maneuvering is not switched on for this game (start screen)');
 if(p.em&&hasCrit(s,'man'))e.push('Maneuver critical hit: no erratic maneuvering until it is repaired (D8.2)');
 if(hasCrit(s,'bat')&&(br+brw+bri)>0)e.push('Battery failure (critical hit): batteries cannot be recharged until it is repaired (D8.2)');
 if(p.het>0&&hasCrit(s,'man'))e.push('Maneuver critical hit: no high energy turns until it is repaired (D8.2)');
 if(p.em&&p.clk)e.push('Erratic maneuvering cannot be used while cloaked (G13.59)');
 if(stac){if(p.spd>0)e.push('A sublight tactical maneuver is for a ship that stays in its hex: set the speed to 0 (C5.11)');if(P.imp<1)e.push('A sublight tactical maneuver costs one point of impulse power (C5.12)')}
 if(!optProbe)p.prb=[];let prE=0;s.pr.forEach((w,i)=>{if(i>=(s.sys.Probe||0)||!(p.prb&&p.prb[i]))return;if(!probeOK(s)){e.push('Probes can only be armed as weapons by a crippled ship (G5.3)');return}if(w.ammo<=0){e.push(`${w.name} has no probes left`);return}prE+=2});
 const trnE=optBoard?Math.max(0,Math.min(p.trn|0,Math.ceil((s.sys.Trans||0)/5))):0;
 const warpOnly=tuW+tuX+wm+hetE+brw+tacE+prE,other=ls+fc+p.ph+tuO+dis+sh+gen+spec+dcE+br+ew+plE+clkE+emE+stE+trE+trnE+wbE+bri+grE;
 if(bri>0&&imp>0)e.push('Reserve impulse power exists only if no impulse power is used for movement: tick "pay all movement with warp" (C5.531, H7.47)');else if(bri>0&&bri>Math.max(0,P.imp-imp))e.push(`Reserve impulse power can only come from the impulse engines: ${Math.max(0,P.imp-imp)} point${P.imp-imp===1?'':'s'} left after movement (H7.47)`);
 if(s.awr&&wm+hetE+tacE>P.warp)e.push(`Movement and HETs need ${wm+hetE+tacE} warp power but only ${P.warp} remains (H4.3: power from warp reactors cannot be used for movement or HETs)`);
 else if(warpOnly>P.warp+(s.awr?P.apr:0))e.push(`Warp-only uses (movement, HETs and photon arming) need ${warpOnly} but only ${P.warp} warp power remains`);
 const free=(P.warp-warpOnly)+(P.imp-imp)+P.apr+bd;
 if(other>free)e.push(`You have allocated ${other} to other items but only ${Math.max(0,free)} is left over`);
 if(emE>0&&emE>(P.warp-warpOnly)+(P.imp-imp-stE))e.push('Erratic maneuvering must be paid with warp or impulse engine power, not APR or reactor power (C10.111)');
 return{bkE,emE,stE,tacE,ls,fc,tuW,tuO,dis,sh,gen,spec,dcE,rate,hetE,imp,wm,warpOnly,other,free,left:free-other,P,lim,errors:e,total:warpOnly+other+imp,avail:P.warp+P.imp+P.apr+bd,tuX,bd,br,ew,rt,plE,clkE,trE,prE,trnE,wbE}}
// [B3.0, H1.0] Trim an over-allocated plan until power fits (used for the computer ship and Auto).
function fit(s,p){for(let g=0;g<300;g++){
 if(p.dis){const mx=maxSpd(s,p),lm=accLim(s);if(s.d.noDA||mx>lm||mx<1)p.dis=0;else p.spd=mx}
 const c=cost(s,p);if(!c.errors.length)return;
 if(p.gen>0){p.gen=Math.max(0,p.gen-1);continue}
 if((p.ecm||0)+(p.eccm||0)>0){if(p.eccm>0)p.eccm--;else p.ecm--;continue}
 if(p.br>0){p.br=Math.max(0,p.br-1);continue}
 if(p.bri>0){p.bri=Math.max(0,p.bri-1);continue}if(p.brw>0){p.brw=Math.max(0,p.brw-1);continue}
 {const q=(p.tuo||[]).findIndex(v=>v>0);if(q>=0){p.tuo[q]=Math.max(0,p.tuo[q]-1);continue}}
 if(p.spec.some(v=>v>0)){const k=p.spec.findIndex(v=>v>0);p.spec[k]=Math.max(0,p.spec[k]-1);continue}
 if(p.dsh.some(v=>v>0)){const k=p.dsh.findIndex(v=>v>0);p.dsh[k]=Math.max(0,p.dsh[k]-1);continue}
 if(p.em){p.em=0;continue}
 if(p.stac){p.stac=0;continue}
 if(p.tac>0){p.tac--;continue}
 if(p.het>0){p.het--;continue}
 if(p.spd>8&&!p.dis){p.spd--;continue}
 let di=-1;p.di.forEach((v,i)=>{if(v)di=i});if(di>=0){p.di[di]=p.di[di]===2?1:0;continue}
 const tu=p.tu.lastIndexOf('arm');if(tu>=0){p.tu[tu]='none';continue}
 {const pa=(p.pl||[]).lastIndexOf('arm');if(pa>=0){p.pl[pa]='none';continue}}
 if(p.ph>0){p.ph--;continue}
 if(p.spd>0&&!p.dis){p.spd--;continue}
 if(p.sh>0&&!p.dis){p.sh--;continue}
 const tl=p.tu.lastIndexOf('hold');if(tl>=0){p.tu[tl]='none';continue}
 {const pl2=(p.pl||[]).lastIndexOf('hold');if(pl2>=0){p.pl[pl2]='none';continue}}
 if(p.clk){p.clk=0;continue}
 if(p.fc&&!p.dis){p.fc=0;continue}
 if(p.dis){p.dis=0;continue}
 break}}
// [B3.1] Automatic energy allocation for the computer ship and the human "Auto" button.
function autoPlan(s,foe,lv,human){const p={het:0,fc:1,ph:0,tu:s.tu.map(()=> 'none'),di:s.di.map(()=>0),tuo:s.tu.map(()=>0),bd:0,br:0,brw:0,ecm:0,eccm:0,sh:NEB()?1:2,gen:0,spec:[0,0,0,0,0,0],dsh:[0,0,0,0,0,0],spd:0};
 p.pl=s.pl.map(()=> 'none');p.clk=0;
 if(!human&&!s.neu&&s.d.dbl&&(turn<=2||s.retreat)){const a=(s.sys['Left W En']||0)>0?1:0,b=(s.sys['Right W En']||0)>0?1:0;if(a||b){p.dbl=[a,b,optAI2&&(s.sys.Impulse||0)>0?1:0];s.dbl=p.dbl.slice()}} // G15.2: the raider doubles its engines for a first strike or to run
 const range=dist(s,foe),lim=accLim(s);
 let want=range>24?20:range>12?14:10;if(!human&&AICFG.matchSpd&&lv!=='easy'&&!s.retreat&&range<=12)want=Math.max(want,Math.min(AICFG.matchSpd,foe.prev));if(s.retreat)want=31;if(lv==='easy')want+=Math.round((Math.random()-.5)*4);
 if(!human&&s.goal)want=s.spcap||4;else if(!human&&s.merch)want=range>16?6:12; // SG4.2: the convoy plods along at speed 6 and runs when the pirate gets close
 if(!human&&TER.bh&&dist(s,TER.bh)<=34)want=Math.min(want,10); // the computer slows down near a black hole so that it has room to steer around it (P4.1)
 if(!human&&MN.size&&MINEZ.size){let md=99;MINEZ.forEach(k=>{const[c,r]=k.split(',').map(Number);md=Math.min(md,dist(s,{c,r}))});if(md<=22)want=Math.min(want,md<=8?4:8)} // the computer slows down near the minefield so that it can steer round it (M2.40)
 if(!human&&TBLK.size&&!s.retreat){let md=99;TBLK.forEach(k=>{const[c,r]=k.split(',').map(Number);md=Math.min(md,dist(s,{c,r}))});if(md<=18)want=Math.min(want,md<=8?6:9)} // slower near a planet so there is room to turn away (P2.812)
 p.spd=Math.max(0,Math.min(lim,want));
 const engage=range-(p.spd+foe.prev)<=20,ovR=lv!=='easy'&&!s.retreat&&range<=(lv==='hard'?AICFG.ovH:AICFG.ovN);
 s.tu.forEach((t,i)=>{if(!t.alive)return;p.tu[i]=t.state==='armed'?(engage?'hold':'none'):'arm';if(lv==='hard'&&ovR&&p.tu[i]!=='none')p.tuo[i]=Math.max(0,2-(t.ovl||0))});
 s.di.forEach((d,i)=>{p.di[i]=d.alive&&engage?(ovR?2:1):0});
 s.pl.forEach((t,i)=>{if(!t.alive)return;if(t.st<3)p.pl[i]='arm';else if(t.T==='F')p.pl[i]='none';else if(PLA[t.T].h!==null&&!t.ept&&!t.sg)p.pl[i]='hold'});
 p.ph=Math.max(0,capMax(s)-s.capCur);
 if(!human&&lv!=='easy'&&s.sp>=0&&!s.retreat){const rg=range;if(lv==='hard')p.het=rg<=15?2:rg<=30?1:0;else p.het=rg<=25?1:0}
 if(s.d.clk){if(human)p.clk=(s.ck.mode==='on'||s.ck.mode==='out')?1:0;else p.clk=0}
 fit(s,p);
 if(s.d.clk&&!human&&lv!=='easy')aiCloak(s,foe,lv,p);
 if(s.d.clk&&!human&&s.ckEnter&&turn===1&&s.ck.mode==='on'&&!p.clk){const q=JSON.parse(JSON.stringify(p));q.clk=1;fit(s,q);if(q.clk&&!cost(s,q).errors.length)Object.assign(p,q)} // [G13.63] a ship that starts cloaked pays for it on turn 1 or it would fade in at once (G13.116)
 if(lv!=='easy'){let c=cost(s,p);if(c.left>=2&&c.rate>=2){let cap=Math.floor(c.rate/2),lf=Math.floor(c.left/2);const ord=[0,1,2,3,4,5].filter(k=>missing(s,k)>0).sort((a,b)=>missing(s,b)-missing(s,a));for(const k of ord){const n=Math.min(cap,lf,missing(s,k));p.dsh[k]+=n;cap-=n;lf-=n}}}
 if(lv!=='easy'){const c=cost(s,p),rt=sensorRate(s),n=Math.min(Math.max(0,Math.floor(c.left)),lv==='hard'?4:2,rt);if(n>0&&!c.errors.length){p.ecm=lv==='hard'?Math.ceil(n/2):n;p.eccm=n-p.ecm;fit(s,p)}}
 if(lv!=='easy'){const c=cost(s,p),cb=s.sys.Battery||0;if(c.left>0&&s.bat<cb&&!c.errors.length){p.br=Math.min(c.left,cb-s.bat,3);fit(s,p)}}
 if(lv!=='easy'){const c=cost(s,p);if(c.left>0&&p.sh>0){const k=shieldFor(s,foe).k;if(lv==='hard'){p.spec[k]+=Math.min(c.left,Math.max(0,s.sh[k]>0?c.left:0))}else p.gen+=c.left;fit(s,p)}}
if(!human&&s.retreat&&!s.d.noDA){const mx=maxSpd(s,p);if(mx>0&&mx<=lim&&pw(s).warp>=disNeed(s)){p.dis=1;p.spd=mx;fit(s,p)}}
 if(!human&&optEM&&lv==='hard'&&!s.retreat&&!p.clk&&range<=15&&!s.rk.length&&!s.pl.length){p.em=1;if(cost(s,p).errors.length)p.em=0}
 if(!human&&optTrac){let n=0;if(LNK&&LNK.on===s)n=Math.min(8,LNK.P);else if(dist(s,foe)<=4&&(foe.sys.Tractor||0)>0)n=1;
  if(n){const snap=JSON.stringify(p);for(let q=0;q<n;q++){if(p.gen>0)p.gen--;else if(p.ecm>0)p.ecm--;else if(p.eccm>0)p.eccm--;else{const k=p.spec.findIndex(v=>v>0);if(k>=0)p.spec[k]--;else if(p.ph>0)p.ph--;else break}}p.ntrac=n;if(cost(s,p).errors.length){Object.assign(p,JSON.parse(snap));p.ntrac=0}}}
 return p}
// [G13.2, G13.23] Computer decision to cloak while reloading plasma.
function aiCloak(s,foe,lv,p){const will=s.pl.some((t,i)=>t.alive&&(p.pl[i]==='hold'||(p.pl[i]==='arm'&&t.st===2)||(t.T==='F'&&t.st===3)));
 const r=dist(s,foe),want=!will&&(r>=8||s.retreat)&&s.pl.some(t=>t.alive);if(!want)return;
 const q=JSON.parse(JSON.stringify(p));q.clk=1;fit(s,q);if(q.clk&&q.spd>=8&&!cost(s,q).errors.length)Object.assign(p,q)}
function lockIn(s,p){if(optLeg&&s.leg&&s.leg.t==='captain'&&p.lm&&p.lm!==s.leg.mode&&s.leg.st==='ok'){s.leg.mode=p.lm;s.leg.busy=turn;L(`${s.tag}'s legendary captain changes jobs to ${p.lm==='captain'?'captain':LEGN[p.lm].replace('Legendary ','')} and does nothing special this turn.`+RL('G22.23, G22.231'))}
 s.engPow=hasRole(s,'eng')?4:0;if(s.engPow)L(`${s.tag}'s legendary engineer doubles the output of four power boxes this turn (+4).`+RL('G22.43'));if(NEB()){p.sh=Math.min(p.sh,1);p.gen=Math.min(p.gen,10);p.spec=p.spec.map(v=>Math.min(v,5));p.clk=0} // [P6.3, P6.6] nebula limits
 s.dbl=(s.d.dbl&&p.dbl&&(p.dbl[0]||p.dbl[1]||p.dbl[2]))?[p.dbl[0]?1:0,p.dbl[1]?1:0,p.dbl[2]?1:0]:null; // [G15.21, G15.23] each engine doubles individually, impulse included
s.dir0=s.dir||0;s.dirSet=turn;s.dir=wantDir(s,p);s.qr=null;if(needBrk(s,p)){const full=brkFull(s),paid=brkPaid(s,p);s.brakeNote=`${s.tag} reverses direction and pays ${paid} of ${full} braking energy`;if(paid<full)s.qr={short:Math.ceil((full-paid)/s.d.mc-1e-9)}}else s.brakeNote=null;s.plotSp=p.spd;s.sph=[];s.usedChg=false;s.plan=JSON.parse(JSON.stringify(p));s.fc=!!p.fc;if(optD22){try{s.c0=cost(s,p)}catch(e){s.c0=null}s.pw0=power(s);s.d22seen=0}s.capCur+=p.ph;
 s.tu.forEach((t,i)=>{if(!t.alive)return;const a=p.tu[i];t.fired=false;const x=(p.tuo&&p.tuo[i])||0;if(a==='arm')t.state=t.state==='empty'?'half':'armed';else if(a==='hold'){}else{t.state='empty';t.ovl=0}if(a==='arm'||a==='hold')t.ovl=(t.ovl||0)+x;t.px=!!(optProx&&p.px&&p.px[i]&&t.state==='armed'&&!(t.ovl>0))});
 s.di.forEach((d,i)=>{d.fired=false;d.armed=!!(p.di[i]&&d.alive);d.ovl=p.di[i]===2&&d.alive});s.ph.forEach(w=>w.fired=false);
 s.pl.forEach((t,i)=>{if(!t.alive)return;t.fired=false;const a=(p.pl||[])[i];const was=t.st,ef=a==='arm'?plDL(t,p,i):plEff(t);t.n1=t.n2=t.n3=t.hl=false;t.noHold=false;t.rolled=false;if(a==='arm'){t.st=Math.min(3,t.st+1);t.A=ef!==t.T?ef:undefined;t.n1=was===0;t.n2=was===1&&t.st===2;t.n3=was===2&&t.st===3;if(optPF&&p.rd&&p.rd[i]&&was===2){t.st=2;t.n3=false;t.rolled=true;t.rdD=PLA[ef].c[2]-(ef==='F'?1:2)}}/* [FP1.221] rolling delay: first turn's energy lost, turns two and three restart the cycle, so the torpedo stays at two turns armed */else if(a==='hold'){t.hl=was===3}else if(!(t.T==='F'&&t.st===3)){t.st=0;t.A=undefined}t.ept=!!(optEPT&&a==='arm'&&was===2&&t.st===3&&p.ept&&p.ept[i]);t.sg=!!(optSG&&a==='arm'&&was===2&&t.st===3&&p.sg&&p.sg[i]&&!t.ept);t.rdy=t.st===3});
 s.tnLeft=optBoard?Math.min(s.sys.Trans||0,5*Math.max(0,p.trn|0)):0;s.guard={};if(optBoard&&p.gd){let k=0;for(const id of Object.keys(p.gd)){if(p.gd[id]&&k<gCap(s)&&guardAlive(s,id)){s.guard[id]=1;k++}}if(k)L(`${s.tag} posts ${k} boarding part${k===1?'y':'ies'} as guards (D7.83).`+RL('D7.83'))}s.bpBusy=0;s.dn=(s.dn||[]).map(v=>v>absI(1)?v:0);
 s.pr.forEach((w,i)=>{const was=w.st;w.fired=false;w.st=(optProbe&&i<(s.sys.Probe||0)&&p.prb&&p.prb[i])?(was===1?2:1):0});
 s.trN=optTrac?Math.min(p.trac|0,s.sys.Tractor||0):0;s.trx=optTrac&&s.trN>0?(p.trx|0):0;s.ntrac=optTrac?(p.ntrac|0):0;s.wbP=(optWeb&&webOk(s))?Math.max(0,p.wb|0):0;s.wm=(optWeb&&webOk(s))?(p.wm|0):0;s.trBurnt=0;DR.filter(d=>d.held===s).forEach((d,j)=>{if(j>=s.trN){d.held=null;L(`${s.tag} does not power a tractor beam for drone #${d.id}: it is released and moves again.`+RL('G7.124, G7.33'))}});
 s.ckPaid=!!p.clk;if(!s.ckPaid&&(s.ck.mode==='on'||s.ck.mode==='out')){s.ck.mode='in';s.ck.start=absI(1);L(`${s.tag} does not pay for its cloaking device, so it begins to fade in on impulse 1.`+RL('G13.116'))}
 s.shOn=p.sh;s.gen=Math.floor(p.gen/2);s.spec=p.spec.slice();if(p.sh<1){s.gen=0;s.spec=[0,0,0,0,0,0]}
 const bri0=optRI?Math.max(0,p.bri|0):0;s.bat=Math.max(0,s.bat-(p.bd||0))+Math.max(0,p.br||0)+Math.max(0,p.brw||0)+bri0;s.bw=Math.max(0,p.brw||0);s.bi=bri0;s.impMove=!(optRI&&p.ifree)&&(p.spd>0||!!p.stac); // [H7.47, C2.111] reserve impulse exists only if the ship did not use impulse power for movement
 s.ecm=p.ecm||0;s.eccm=s.pfc?0:(p.eccm||0);crewEW(s);s.legSn=0;s.legSc=0;if(hasRole(s,'weapons')&&!s.pfc&&s.d.trk&&s.d.trk.Sensor&&(trkVal(s,'Sensor')<s.d.trk.Sensor[0]&&(s.ecm||0)+(s.eccm||0)>=trkVal(s,'Sensor'))){s.legSn=1;L(`${s.tag}'s legendary weapons officer adds a point to the damaged sensor (rating ${sensorRate(s)}), so the ship can use its EW.`+RL('G22.71'))}else if(hasRole(s,'weapons')&&!s.pfc&&s.d.trk&&trkVal(s,'Scanner')>0){s.legSc=1;L(`${s.tag}'s legendary weapons officer takes a point off the damaged scanner (penalty ${scanAdj(s)}).`+RL('G22.71, G22.712'))}else if(hasRole(s,'weapons')&&!s.pfc){if((s.eccm||0)>=(s.ecm||0)&&(s.eccm||0)>0){s.eccm++;L(`${s.tag}'s legendary weapons officer adds one point of ECCM (now ${s.eccm}), outside the six-point limits.`+RL('G22.71, G22.711'))}else{s.ecm++;L(`${s.tag}'s legendary weapons officer adds one point of ECM (now ${s.ecm}), outside the six-point limits.`+RL('G22.71, G22.711'))}} // [G22.71, G22.711] one extra natural EW point; the computer picks the side that is already stronger (the sensor and scanner choices are not offered)
 if(hasCrit(s,'bat')){s.bat=0;s.bw=0;s.bi=0}s.pact=(optLand&&s.pst)?(p.pact||defAct(s)):undefined;s.hetAvail=p.het||0;s.sp=p.spd;s.tacLeft=p.tac||0;s.tacReady=false;s.edHalt=0;s.rtacN=0;s.rtacUsed=0;s.stacRUsed=false;s.freeTac=optTac&&p.spd===0&&!(p.tac>0)&&!p.stac;s.stacLeft=p.stac?1:0;s.emPaid=!!(p.em&&optEM);s.emOn=s.emPaid&&!!s.emCarry;s.emBegun=s.emOn;s.exitEdge=null;s.tacAt=s.stacAt=-1;s.disPlan=!!p.dis;s.disOk=!!p.dis;s.rep=(p.dsh||[0,0,0,0,0,0]).slice()}
function planText(s,p){const bits=[`speed ${p.spd}${(optChg&&p.chg||[]).slice().sort((a,b)=>a.e-b.e).map(c=>', then '+c.v+' from impulse '+c.e).join('')}${s.dir||p.rev?' (in reverse)':''}`,p.sh===2?'full shields':p.sh===1?'minimum shields':'shields off'];
 if(p.ph)bits.push(`${p.ph} to phasers`);{const pa=(p.pl||[]).filter(a=>a==='arm').length,ph2=(p.pl||[]).filter(a=>a==='hold').length;if(pa)bits.push(`${pa} plasma torpedo${pa>1?'es':''} arming`);if(ph2)bits.push(`${ph2} plasma held`);if(p.clk)bits.push('cloak paid for')}const arm=p.tu.filter(a=>a==='arm').length,hold=p.tu.filter(a=>a==='hold').length;if(arm)bits.push(`${arm} photon${arm>1?'s':''} arming`);if(hold)bits.push(`${hold} held`);
 const d=p.di.filter(Boolean).length;if(d)bits.push(`${d} disruptor${d>1?'s':''} charged${p.di.filter(v=>v===2).length?` (${p.di.filter(v=>v===2).length} overloaded)`:''}`);if(p.gen)bits.push(`${Math.floor(p.gen/2)} general reinforcement`);const sp=p.spec.reduce((a,b)=>a+b,0);if(sp)bits.push(`${sp} specific reinforcement`);if(p.het)bits.push(`${p.het} high energy turn${p.het>1?'s':''} paid for`);if(p.tac)bits.push(`${p.tac} tactical maneuver${p.tac>1?'s':''} paid for`);if(p.dis)bits.push('disengaging by acceleration');const rp=p.dsh.reduce((a,b)=>a+b,0);if(rp)bits.push(`repairing ${rp} shield box${rp>1?'es':''}`);const tx=(p.tuo||[]).reduce((a,b)=>a+b,0);if(tx)bits.push(`${tx} photon overload energy`);if(p.bd)bits.push(`${p.bd} batter${p.bd>1?'ies':'y'} discharged`);if(p.br)bits.push(`${p.br} batter${p.br>1?'ies':'y'} recharged`);if(p.ecm||p.eccm)bits.push(`ECM ${p.ecm||0} / ECCM ${p.eccm||0}`);if(p.brw)bits.push(`${p.brw} recharged with warp (reserve warp)`);return bits.join(', ')}
