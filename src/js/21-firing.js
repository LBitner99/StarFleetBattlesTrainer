/* ================= firing ================= */
const AICFG={phN:3.3,phH:2.6,late:1,lateAt:24,matchSpd:0,skipN:0,ovN:9,ovH:18,concE:.55,concN:.45,concH:.35};
function aiFire(s,foe,i){const out=[];if(s.conceded)return out;const used=aiDefend(s,out);
 if(level==='hard'&&optOvl)s.di.forEach(d=>{const r0=dist(s,foe);if(s.bat>=2&&d.alive&&d.armed&&!d.ovl&&!d.fired&&r0>=1&&r0<=8&&wStatus(s,{kind:'di',w:d},foe).ok){spendBat(s,2);d.ovl=true;L(`${s.tag} uses reserve power to overload ${d.name}.`+RL('H7.54, E3.55'))}});
 weapons(s).forEach(x=>{if(used.has(x.id))return;x.lp=false;
  if(optAI2&&level!=='easy'&&x.kind==='ph'&&x.w.T!==P3&&x.w.T!==P4&&x.w.alive&&effRange(s,foe)<=15){ // [E2.251, E2.252] the computer captain fires a Ph-1/2 as a Ph-3 when that does at least three quarters of the damage at this range (a Ph-3 never does more, but costs half), or when the capacitor cannot pay for a full shot
   const re0=effRange(s,foe),sf0=ewShift(s,foe,'ph'),av=T=>[1,2,3,4,5,6].reduce((a,d)=>a+phDmg(T,re0,d,sf0),0)/6;x.lpx=av(P3);if(x.lpx>=.75*av(x.w.T)||s.capCur<(x.w.T.cp||1)-1e-9)x.lp=true}
  const st=wStatus(s,x,foe);if(!st.ok)return;const r=st.r,inf=st.info;let go=false;
  if(x.kind==='ph'){const thr=(level==='easy'?4.6:level==='hard'?AICFG.phH:AICFG.phN)*(i>=AICFG.lateAt&&level!=='easy'?AICFG.late:1);go=(x.lp?x.lpx:inf.exp)>=thr;if(level==='easy'&&Math.random()<.25)go=false;if(level==='normal'&&Math.random()<AICFG.skipN)go=false}
  else{const last=i>=29;go=r<=(level==='easy'?5:8)||(last&&inf.p>0&&level!=='easy')||(level==='hard'&&inf.p>=4/6&&r<=15)}
  if(go&&(x.kind==='ph'||inf.p>0))out.push(x)});return out}
// [D6.0, E1.0, E2.0, E3.0, E4.0, E1.82] Resolve one weapon shot: die roll, ECM shift, damage, overload, cloak.
function fireOne(s,x,foe,sdie){if(x.kind==='di')w0um(s,x.w);const r=dist(s,foe),w=x.w,d=(sdie&&sdie.d!==undefined)?sdie.d:d6(),ov=w.ovl,re=effRange(s,foe),sf=ewShift(s,foe,x.kind);if(sdie){sdie.n=(sdie.n||0)+1;sdie.d=d}let dmg=0,m=`${s.tag} ${w.name} fires${foe.dr?' at drone #'+foe.id:''} at range ${r}${re!==r?` (effective ${re})`:''}: rolled ${d}${sdie&&sdie.n>1?' (narrow salvo: same roll as the first weapon)':''}${sf?` +${sf} ECM shift`:''}`;
 if(x.kind==='ph'){const T=x.lp?P3:w.T;dmg=phDmg(T,re,d,sf);const wr=optWeb?webFire(s,foe,'ph').red:0;if(wr)dmg=Math.max(0,dmg-wr);s.capCur=Math.max(0,s.capCur-(T.cp||1));w.fired=true;w.la=absI(imp+1);m+=` → ${dmg} damage`+(wr?` (${wr} less for firing through its own web)`+RL('G10.62'):'')+(x.lp?' (fired as a Ph-3 for ½ energy)'+RL('E2.251, E2.13'):'')+RL((T.cp?'E2.13':T===P2?'E2.12':'E2.11')+', E2.4, E2.22');}
 else{const inf=shotInfo(x.kind,w,r,re,sf);if(x.kind==='di'&&w.um&&uimHelps(w,re,ov)){(s.uimU=s.uimU||[]).push(w);m+=' with UIM'+RL('D6.51, D6.55')}else if(x.kind==='di'&&w.derf&&re>=23&&re<=30)m+=' with DERFACS'+RL('E3.62');if(x.kind==='pr'){w.st=0;w.fired=true;w.ammo--;m+=' as an anti-matter probe'}else if(x.kind==='pb'){w.rdy=false;w.fired=true;w.st=0;w.ept=false;if(w.sg){w.sg=false;m+=' (a shotgun load fuses back into one torpedo of the full size and the extra energy is lost, FP7.24)'};m+=' as a plasma bolt'}else if(x.kind==='tu'){w.state='empty';w.fired=true;w.ovl=0}else{w.armed=false;w.fired=true;w.ovl=false}w.la=absI(imp+1);
  const nd=x.kind==='pr'?`${inf.need} or more`:`${inf.h} or less`;if(x.kind==='pr'?d>=inf.need:d<=inf.h){dmg=inf.dmg;const _a=optLand&&(x.kind==='tu'||x.kind==='di'||x.kind==='pb')?atmN(s,foe):0;if(_a&&dmg>0){const _o=dmg;dmg=x.kind==='di'?Math.max(0,dmg-_a):Math.max(0,_o-Math.floor(_o*.25*Math.min(4,_a)));m+=` The atmosphere cuts it from ${_o} to ${dmg} (P2.542, P2.543).`;}m+=` → HIT (needed ${nd}) for ${dmg}${ov?' (overloaded)':''}`;if(ov){const fb=x.kind==='tu'?(r<=1?Math.min(4,ov):0):(r===0?2:0);if(fb){m+=` Feedback: ${fb} damage on its own shield.`;FB.push({s,fb})}}}else m+=` → miss (needed ${nd})`;m+=RL(x.kind==='pr'?'G5.31, G5.34, G5.35':ov?(x.kind==='tu'?'E4.4, E4.42, E4.43':'E3.5, E3.52-E3.54'):x.kind==='pb'?'FP8.3, FP8.32, FP8.42, FP8.43':x.kind==='tu'?'E4.12, E4.13':'E3.22, E3.4');if(x.kind==='pb'&&r===0){const fb=Math.floor(PLA[w.T].t[0]/4);if(fb){m+=` Feedback: ${fb} damage on its own shield (FP8.36).`;FB.push({s,fb})}}}
 if(!foe.dr&&ckOn(foe)&&dmg>0){const cf=ckChart(foe,s);dmg=Math.round(dmg*cf.f);if(foe.ck.mode==='on'&&dmg>0){const T=(s.trkT=s.trkT||{})[foe.tag]=(s.trkT[foe.tag]||[]);if(!T.includes(turn))T.push(turn)}m+=` Cloak: ${cf.txt}; ${dmg} damage gets through.`+RL('G13.303, G13.37')}
 recShot(s,x,foe,r,re,d,dmg,ov);L(m+((sf||re!==r)?RL('D6.123, D6.21, D6.34, E1.82'):''));return dmg}
const w0um=(s,w)=>{w.um=uimOn(s,w)};
function uimCheck(){sh.forEach(s=>{if(!s.uimU||!s.uimU.length)return;const A=absI(imp+1),roll=d6();
  if(roll<=(cq(s)<0?3:cq(s)>0?1:2)){s.uim--;s.uimWait=A+8;s.uimU.forEach(w=>w.lockTo=A+32);L(`${s.tag}'s UIM was used this impulse: rolled ${roll}, it BURNS OUT. The disruptors fired under it are locked out for 32 impulses and ${s.uim>0?'a spare module comes on line in 8 impulses':'it has no spare module'}.`+RL('D6.52, D6.54'))}
  else L(`${s.tag}'s UIM was used this impulse: rolled ${roll}, it holds (breakdown on 1${cq(s)<0?' to 3, poor crew':cq(s)>0?' only, outstanding crew':' or 2'}).`+RL(cq(s)?'D6.521, G21.113, G21.213':'D6.521'));s.uimU=null})}
// [D6.0, D4.0] Resolve all shots of an impulse together (D6.0 simultaneous fire), then apply volleys to shields.
function resolveFire(humanSel,aiSels){const vol={},DD={},sd={};
 if(humanSel.length&&TG().tm===0)L(`Impulse ${imp+1}: friendly fire: ${sh[0].tag} fires on the ${TG().tag}, allowed under ${ffRule(TG())}.`+RL('D1.5, '+ffRule(TG())));
 const groups=[{s:sh[0],foe:TG(),list:humanSel}].concat(aiSels.map(a=>({s:a.s,foe:a.foe||sh[0],list:a.list})));
 groups.forEach(({s,foe,list})=>{const k=sh.indexOf(s),ti=sh.indexOf(foe);if(s.qh&&list.some(x=>!x.dt&&!qStd(s,x)))qReveal(s,'fires a weapon no freighter carries');list.forEach(x=>{if(x.dt){const dd=fireOne(s,x,x.dt);if(dd>0)DD[x.dt.id]=(DD[x.dt.id]||0)+dd;return}const d=fireOne(s,x,foe,x.ns?(sd[k+x.kind+(x.w.px?'p':'')]=sd[k+x.kind+(x.w.px?'p':'')]||{}):null);if(d>0){const sk=shieldFor(foe,s);const key=ti+'|'+sk.k;(vol[key]=vol[key]||{t:ti,k:sk.k,d:0,src:k,note:sk.note}).d+=d}})});
 Object.keys(DD).forEach(id=>{const d=DR.find(z=>z.id==id);if(!d)return;if(d.pl){d.dmg=(d.dmg||0)+DD[id];const st=plStr(d);if(st<=0){rmDr(d);L(`Plasma torpedo #${d.id} takes ${DD[id]} damage and is destroyed.`+RL('FP1.61, FP1.611'))}else L(`Plasma torpedo #${d.id} takes ${DD[id]} phaser damage: its warhead falls to ${st} (it has ${d.dmg} damage in all).`+RL('FP1.611'))}else if(d.ft){ftHit(d,DD[id])}else if(DD[id]>=d.hp){rmDr(d);L(`Drone #${d.id} takes ${DD[id]} damage (${d.hp} needed) and is destroyed.`+RL('FD1.54'))}else L(`Drone #${d.id} takes ${DD[id]} damage but needs ${d.hp}: it survives.`+RL('FD1.54'))});
 Object.values(vol).forEach(v=>applyVolley(sh[v.t],v.k,v.d,sh[v.src],v.note));uimCheck();
 FB.splice(0).forEach(f=>{const k=shieldFor(f.s,foeOf(f.s)).k;applyVolley(f.s,k,f.fb,f.s,'',`${f.s.tag}'s overload feedback of ${f.fb} hits its own shield #${k+1}.`)})}
// [D8.1] Track damage per shield per impulse for critical hits (20 or more).
function critTrack(tgt,k,dmg){if(!optD8||over)return;const key=turn+':'+imp;if(!tgt.cd||tgt.cd.key!==key)tgt.cd={key,v:[0,0,0,0,0,0]};tgt.cd.v[k]+=dmg;if(tgt.cd.v[k]>=20&&tgt.critRolled!==turn){tgt.critRolled=turn;critRoll(tgt,k)}}
// [D8.1, D8.2] Critical hit roll and effect.
function critRoll(s,k){const r=d6()+d6(),hid=isFoe(s)&&!openInfo;const say=(t,rc)=>LS(`${s.tag}: critical hit roll for 20 or more damage on shield #${k+1}: ${r}. ${t}`+RL(rc||'D8.1, D8.2'),hid);
 if(r>=6&&r<=8){say('No critical hit.');return}
 const add=(kk,t,rc)=>{s.crit=s.crit||[];if(s.crit.some(c=>c.k===kk)){say('Already suffering this critical hit, so nothing more happens.');return}s.crit.push({k:kk,att:0});say(t,rc)};
 if(r===2){add('fc','Active fire control fails: the ship drops to passive fire control (no lock-on so ranges double, targets within 5 hexes, no ECCM, no seeking weapons) until repaired.','D8.2, D19.1, D19.23');s.pfc=true;s.eccm=0}
 else if(r===3){add('bat','Battery failure: all batteries lose their power and cannot hold any until repaired.','D8.2');s.bat=0;s.bw=0;s.bi=0}
 else if(r===4)add('tr','Transporter failure: transporters cannot be used (no beaming boarding parties) until repaired. Parties already aboard an enemy ship stay there.','D8.2');
 else if(r===5)add('lab','Power failure in the labs (labs and emergency damage repair are not used in a Duel, so this has no effect).','D8.2');
 else if(r===9){add('tow','Tractor beam breakdown: no tractor beam can be used until repaired. Any link or held drone is released.','D8.2');if(LNK&&LNK.by===s)breakLink('its tractor beam broke down','D8.2');DR.forEach(d=>{if(d.held===s)d.held=null})}
 else if(r===10)add('shl','Shuttle launch controls jammed on one bay (no shuttles are used in a Duel, so this has no effect).','D8.2, D8.24');
 else if(r===11){add('man','Maneuver restricted: speed at most 8, no HET or EM, and turn mode one higher until repaired.','D8.2');if(s.sp>8){s.sp=8}if(s.emOn)stopEM(s);s.hetAvail=0}
 else if(r===12){add('warp','Warp engine controls damaged: the ship stops moving at once and cannot use warp energy for movement. Half of the warp output (rounded down) is usable for other purposes, the rest is lost until repaired.','D8.2, D8.23');s.sp=0;s.hetAvail=0;if(s.emOn)stopEM(s)}}
// [D8.3, D8.31] Damage control tries to repair a critical hit.
function critRepair(s){if(!(s.crit||[]).length)return;const c=s.crit[0],m=c.att===0?0:c.att===1?1:2,d=d6(),ok=d-m<=4;LS(`${s.tag} damage control tries to repair the ${({fc:'fire control',bat:'battery',tr:'transporter',lab:'lab',tow:'tractor',shl:'shuttle bay',man:'maneuver',warp:'warp controls'})[c.k]} critical hit: die ${d}${m?` minus ${m}`:''} (1-4 repairs it): ${ok?'repaired':'not repaired'}.`+RL('D8.3, D8.31'),isFoe(s)&&!openInfo);if(ok){s.crit.shift();if(c.k==='fc')s.pfc=false}else c.att++}
let VCOL=null;
// [D3.3, D3.4, D4.1, D4.11] Apply a volley: general and specific reinforcement, shield boxes, then internal damage.
function applyVolley(tgt,k,dmg,src,note,lbl,rc){if(PIR&&tgt===PIR.s&&PIR.at&&dmg>0&&(absI(imp+1)+':'+turn)!==PIR.at.k)PIR.late=true; // [S5.2 #9] only damage in the first impulse counts as a surprise blow
 if(tgt.qh&&src&&src!==tgt&&dmg>0&&(tgt!==sh[0]||qAuto))qReveal(tgt,'is hit by weapons fire'); /* R1.7B: shields go to full strength before the damage is resolved */{const mo=EEL&&MONS.find(m=>m.s===tgt);if(mo){withMon(mo,()=>eelHit(dmg,src));return}}if(PIR&&tgt===PIR.s&&src&&src!==tgt&&dmg>0)pirAttack(tgt,src);critTrack(tgt,k,dmg);if(tgt===sh[0]&&src!==tgt)VOL.push({t:turn,k:k,d:dmg,s:lbl?1:0});const hid=isFoe(tgt)&&!over&&!openInfo;let d=dmg,m=lbl?lbl+RL(rc||'E4.431, E3.54'):`${src.tag} volley of ${dmg} hits ${tgt.tag} shield #${k+1}${note}.`+RL(note?'D4.11, D3.41':'D4.11, D3.4');const m0=m;if(hid)m='  Detail: ';
 const g=Math.min(tgt.gen,d);if(g){tgt.gen-=g;d-=g;m+=` General reinforcement absorbs ${g}.`+RL('D3.3411')}
 const dnk=tgt.dn&&tgt.dn[k]&&absI(imp+1)<tgt.dn[k];const sp=dnk?0:Math.min(tgt.spec[k],d);if(sp){tgt.spec[k]-=sp;d-=sp;m+=` Specific reinforcement absorbs ${sp}.`+RL('D3.342')}
 const act0=dnk?0:tgt.shOn===2?tgt.sh[k]:tgt.shOn===1?Math.min(5,tgt.sh[k]):0,act=tgt.qh?Math.min(act0,tgt.d.fk==='FL'?8:5):act0,ab=Math.min(act,d); // R1.7B: a hidden Q-ship's shields are only freighter strong
 
 if(tgt.shOn===0&&d>0)m+=' Shields were off.'+RL('D3.13');
 let lkd=0;if(ab){if(optLeak){tgt.lk=(tgt.lk||0)+ab;lkd=Math.floor(tgt.lk/optLeak)-Math.floor((tgt.lk-ab)/optLeak)}tgt.sh[k]-=(ab-lkd);d-=ab;m+=` Shield boxes absorb ${ab-lkd} (${tgt.sh[k]} left).`+(lkd?` ${lkd} point${lkd>1?'s':''} leak${lkd>1?'':'s'} through as internal damage.`+RL('D3.6, D3.61'):'')+RL(tgt.shOn===1?'D3.21, D3.33':'D3.21')}
 if(d>0&&tgt.shOn>0&&tgt.bat>=2&&(tgt===sh[0]?autoRes:true)){const rr=Math.min(Math.floor(tgt.bat/2),d);spendBat(tgt,2*rr);d-=rr;m+=` Reserve power: ${2*rr} batteries discharge into ${rr} point${rr>1?'s':''} of general reinforcement (${tgt.bat} left).`+RL('H7.134, D3.341')}
 if(d>0&&(tgt.sys.Armor||0)>0){const a=Math.min(tgt.sys.Armor,d);tgt.sys.Armor-=a;d-=a;m+=` Armor absorbs ${a} (${tgt.sys.Armor} left).`+RL('D4.12')}
 d+=lkd;if(hid){L(m0+' (the effect on the target is private until the game ends, B3.5)');LS(m0+m,1)}else L(m);if(d>0){if(VCOL){VCOL.d+=d;return}LS(`${d} point${d>1?'s':''} of internal damage on ${tgt.tag}:`+RL('D4.13, D4.22'),hid);const used=new Set();for(let i=0;i<d;i++)dac(tgt,src,used)}}
// [FP5.0] Enveloping plasma torpedo: damage is done over several shields.
function envelop(t,W,from,d){const lb=`Enveloping plasma torpedo #${d.id} implodes on ${t.tag} (warhead ${W}):`;
 if(t.shOn===0){applyVolley(t,0,W,from,'',lb+' shields were down, so the full warhead is one volley.','FP5.34');return}
 const g=Math.min(t.gen,W);if(g){t.gen-=g;W-=g;L(`General reinforcement takes ${g} of the enveloping warhead first.`+RL('FP5.35'))}
 const base=Math.floor(W/6),rem=W-base*6,order=[0,1,2,3,4,5].sort((a,b)=>(t.sh[b]+(t.spec[b]||0))-(t.sh[a]+(t.spec[a]||0))),ex=[0,0,0,0,0,0];order.slice(0,rem).forEach(k=>ex[k]=1);
 L(`${lb} ${base} on every shield${rem?`, plus 1 more on ${rem} shield${rem>1?'s':''} (the defender's choice, made here in the defender's favour)`:''}.`+RL('FP5.3, FP5.31'));
 VCOL={d:0};for(let k=0;k<6;k++){const dm=base+ex[k];if(dm>0)applyVolley(t,k,dm,from,'',`Shield #${k+1} takes ${dm}`,'FP5.31')}
 const tot=VCOL.d;VCOL=null;if(tot>0){const hid=isFoe(t)&&!over&&!openInfo;LS(`${tot} point${tot>1?'s':''} of internal damage on ${t.tag} from all six shields, resolved as a single volley:`+RL('FP5.32, D4.13'),hid);const used=new Set();for(let i=0;i<tot;i++)dac(t,from,used)}}
// [D4.3] Excess damage boxes on the SSD.
const exdOf=k=>{const g=((GEO[k]&&GEO[k].g)||[]).find(x=>x[1]==='Excess Damage');return g?g[3].length:0};
const WCOL='ABCDEFGHIJKLM';
// [D4.2, D4.3] Damage allocation chart: roll 2d6, destroy the box listed, or take the excess damage when it is empty.
function dac(tgt,src,used){crewTick(tgt);used=used||new Set();const hid=isFoe(tgt);const r=d6()+d6(),row=DAC[r];
 const out=(j,txt,rc)=>LS(`  roll ${r}, column ${WCOL[j]}: ${txt}`+RL(rc),hid);
 const kill=c=>{c.alive=false;if('state' in c)c.state='empty';else if('st' in c){c.st=0;c.rdy=false}else if('armed' in c)c.armed=false;tgt.capCur=Math.min(tgt.capCur,capMax(tgt))};
 for(let j=0;j<12;j++){let n=row[j];const bold=n.endsWith('*');if(bold)n=n.slice(0,-1);const key=r+'|'+j;
  if(bold&&used.has(key))continue;
  const done=()=>{if(bold)used.add(key)};
  if((n==='Torp'||n==='Phaser')&&(tgt.sys[n==='Torp'?'SS-A':'SS-B']||0)>0){const q=n==='Torp'?'SS-A':'SS-B';tgt.sys[q]--;done();out(j,`a special sensor (${n==='Torp'?'#1-#4':'#5-#8'}) is destroyed by the ${n==='Torp'?'torpedo':'phaser'} damage point`,'R2.7, D4.326');return} // [R2.7, D4.326] a scout's special sensors #1-#4 take the torpedo hits and #5-#8 the phaser hits
  if(n==='Phaser'){const a=src?rel(tgt,src):null,c=tgt.ph.find(w=>w.alive&&w.arcs.some(t=>inTok(t,a)));if(c){kill(c);done();out(j,`${c.name} destroyed`,'D4.321');return}continue}
  if(n==='Torp'){const c=tgt.tu.find(w=>w.alive)||tgt.pl.find(w=>w.alive)||tgt.di.find(w=>w.alive);if(c){kill(c);done();out(j,`${c.name} destroyed`,'D4.323');return}continue}
  if(n==='Any Weapon'){const ph=tgt.ph.filter(w=>w.alive).sort((x,y)=>((x.T.cp?0:x.T===P2?1:2)-(y.T.cp?0:y.T===P2?1:2)));const c=ph[0]||tgt.di.find(w=>w.alive)||tgt.tu.find(w=>w.alive)||tgt.pl.find(w=>w.alive);if(c){kill(c);done();out(j,`${c.name} destroyed (any weapon hit, the owner picks)`,'D4.324');return}continue}
  if(n==='Any W En'){const e=['Center W En','Left W En','Right W En'].filter(x=>(tgt.sys[x]||0)>0).sort((x,y)=>tgt.sys[y]-tgt.sys[x])[0];if(e){tgt.sys[e]--;done();out(j,`${e} box destroyed (the owner picks)`,'D4.221');return}continue}
  let nn=n;if(n==='A Hull'&&!((tgt.sys['A Hull']||0)>0)&&(tgt.sys.Cargo||0)>0)nn='Cargo'; // [G14.11, R2.8] aft hull damage points go to a cargo pod's boxes
  if(n==='Drone'&&!((tgt.sys.Drone||0)>0)&&(tgt.sys.Add||0)>0)nn='Add';if((n==='F Hull'||n==='A Hull')&&!((tgt.sys[n]||0)>0)&&(tgt.sys['C Hull']||0)>0)nn='C Hull';
  if((nn==='Sensor'||nn==='Scanner'||nn==='Damage Control')&&(tgt.sys[nn]||0)<=1)continue; // D4.33: the last box of these tracks is never destroyed
  if((tgt.sys[nn]||0)>0){tgt.sys[nn]--;done();out(j,`${nn} box destroyed`,nn!==n?'D4.351':'D4.221, D4.222');if(nn==='Battery'&&tgt.bat>tgt.sys.Battery){tgt.bat=tgt.sys.Battery;tgt.bw=Math.min(tgt.bw,tgt.bat);tgt.bi=Math.min(tgt.bi||0,Math.max(0,tgt.bat-tgt.bw));LS('  The destroyed battery takes its stored energy with it.'+RL('H7.38'),hid)}return}}
 if(tgt.exd===undefined)tgt.exd=exdOf(tgt.d.key);
 if(tgt.exd>0){tgt.exd--;out(12,`Excess Damage box destroyed (${tgt.exd} left)`,'D4.4')}else{tgt.boom=true;out(12,'an Excess Damage hit with no Excess Damage boxes left: the ship is destroyed','D4.4')}}
