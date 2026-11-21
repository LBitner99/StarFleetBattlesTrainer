/* ================= D22 energy balance due to damage (optional) ================= */
// [D22.0] Apply energy balance after damage to every ship (option).
function d22All(i){if(!optD22)return;sh.forEach(s=>{try{d22(s,i)}catch(e){}})}
// [D22.0, C2.3] Energy balance: power still needed against power left after damage; slows the ship if short.
function d22(s,i){const c=s.c0;if(!c||over||s.boom||phase!=='run')return;const P=pw(s),cur=P.warp+P.imp+P.apr,lost=(s.pw0||0)-cur;if(lost<=(s.d22seen||0))return;s.d22seen=lost;
 const mc=s.d.mc,hid=isFoe(s)&&!openInfo&&!over,say=t=>LS(t+RL('D22.1, D22.3, D22.4'),hid);
 const um=sp=>{let n=0;for(let j=i+1;j<=32;j++)if(moves(sp,j))n++;return n};
 const O=c.ls+c.fc+c.tuO+c.sh+c.gen+c.spec+c.dcE+c.ew+c.clkE+(c.trE||0)+(c.wbE||0)+(s.emOn?c.emE:0);
 const emA=s.emPaid&&!s.emBegun?c.emE:0,A=um(s.sp)*mc+s.hetAvail*hetC(s)+emA+(s.tacLeft||0)*mc;
 const E=Math.max(0,c.total-O-A),req=O+A+Math.max(0,E-lost),rem0=cur+(c.bd||0);let sh0=Math.ceil(req-rem0-1e-9);
 say(`Impulse ${i}: ${s.tag} has lost ${lost} power box${lost===1?'':'es'} this turn (${cur} left). Energy balance: ${fmt(Math.round(req*100)/100)} still needed against ${rem0} available${sh0>0?`, a shortage of ${sh0}`:', so there is no shortage (power already spent is taken to have come from the destroyed boxes)'}.`);
 if(sh0<=0)return;
 if(c.ls>0&&!s.els&&isCrip(s)){s.els=true;sh0-=c.ls;say(`  ${s.tag} is crippled and goes on emergency life support, which costs no power (D22.431, B3.1).`);if(sh0<=0)return} // [D22.431] step 1
 const u=Math.min(s.bat,sh0);if(u>0){spendBat(s,u);sh0-=u;say(`  ${s.tag} discharges ${u} ${u>1?'batteries':'battery'} as reserve power to cover it.`)}
 if(sh0>0&&s.hetAvail>0){const n=Math.min(s.hetAvail,Math.ceil(sh0/hetC(s)));s.hetAvail-=n;sh0-=hetC(s)*n;say(`  ${n} unused high energy turn${n>1?'s are':' is'} cancelled.`)}
 if(sh0>0&&emA>0){s.emPaid=false;sh0-=emA;say(`  The unused erratic maneuvering is cancelled.`)}
 else if(sh0>0&&s.emOn){s.emOn=false;s.emBegun=true;sh0-=c.emE;say(`  Erratic maneuvering stops at once.`)}
 if(sh0>0&&(s.tacLeft||0)>0){sh0-=s.tacLeft*mc;s.tacLeft=0;s.tacReady=false;say(`  The unused tactical maneuvers are cancelled.`)}
 if(sh0>0&&s.sp>0){const old=s.sp;let nw=old;
  if(s.disPlan){const mx=maxSpd(s,s.plan);nw=Math.min(old,mx);if(nw<old)say(`  ${s.tag} is trying to disengage, so it only drops to its new maximum speed ${nw} (D22.433).`)}
  else{const dm=Math.floor(old/2);let d=1;for(;d<=dm;d++){if((um(old)-um(old-d))*mc>=sh0)break}if(d>dm){d=dm;say(`  Slowing by half is not enough, so other energy is also given up (D22.434).`);for(;d<old;d++){if((um(old)-um(old-d))*mc>=sh0)break}}nw=old-Math.min(d,old);
   const fr=(um(old)-um(nw))*mc;sh0-=fr;say(`  ${s.tag} slows from speed ${old} to ${nw}.`);s.disOk=false}
  s.sp=nw;if(nw===0){s.st=0}}
 if(sh0>0&&s.ck&&(s.ck.mode==='on'||s.ck.mode==='out')&&c.clkE>0){sh0-=c.clkE;ckLose(s,i,'there is not enough power left to run it (D22.0)','G13.118');say(`  The cloaking device is shut down for lack of power.`)} // [G13.118]
 if(sh0>0)say(`  ${s.tag} is down to life support and shields (D22.435).`)}
function revealAll(){revealed=true;try{if(phase==='run'&&sh[1].plan&&(!TURNS.length||TURNS[TURNS.length-1].t!==turn))snapTurn()}catch(e){}
 L('The game is over: both ships\' records are now open to the other player.'+RL('B3.5'));
 TURNS.forEach(t=>L(`Turn ${t.t} records: you flew at speed ${t.a.sp} (${t.a.plan}); the ${sh[1].tag} flew at speed ${t.b.sp} (${t.b.plan}).`+RL('B3.5')+((t.x||[]).map(q=>` The ${q.tag} flew at speed ${q.sp} (${q.plan}).`).join(''))));
 SEC.forEach(x=>L(x));if(SEC.length)L('Opponent-side details that were private during play (damage allocation, shield boxes, repairs):');SEC=[];
 try{const d=deb();L('Battle debrief: '+d.head);d.f.forEach(f=>L(' - '+f.h+'. '+f.d));d.tips.forEach(t=>L(' Try next time: '+t))}catch(e){}}
function copyLog(){copyText(logHeader()+plainLog())}
async function getDB(){if(DBTRIED)return DBH;DBTRIED=true;try{DBH=(window.claude&&await window.claude.use('db'))||null}catch(e){DBH=null}return DBH}
function matchSummary(){const g=summ(SHOTS),ai=sh[1];
 const res=over?(over.win?(ai.conceded?'win-conceded':'win'):(/conceded/.test(over.text)?'conceded':'loss')):'unfinished';
 return {ts:Date.now(),a:selA,b:selB,x:XE.map(q=>q.k),f:XF.map(q=>q.k),rfA:(rfA||[]).slice(),rfB:(rfB||[]).slice(),lvl:level,open:!!openInfo,turns:turn,res,end:over?over.text:'',
  pw:[power(sh[0]),power(sh[1])],p0:[sh[0].p0||0,sh[1].p0||0],sh0:sh[0].sh.slice(),sh1:sh[1].sh.slice(),
  you:g[0],foe:g[1],yourDmg:g[0]?Object.values(g[0]).reduce((a,x)=>a+x.dm,0):0,foeDmg:g[1]?Object.values(g[1]).reduce((a,x)=>a+x.dm,0):0,
  rngEnd:TURNS.length?TURNS[TURNS.length-1].rng:0,coach:Object.assign({},deb(),{sc:over&&over.sc||null}),ver:29}}
async function saveMatch(){saved=true;let M;try{M=matchSummary()}catch(e){return}
 try{const k='sfbHist';const a=JSON.parse(localStorage.getItem(k)||'[]');a.push(M);localStorage.setItem(k,JSON.stringify(a.slice(-100)))}catch(e){}
 const db=await getDB();if(!db)return;
 try{const id=gid;await db.doc('matches/'+id).set(M);
  let txt=logHeader()+plainLog();if(txt.length>180000)txt=txt.slice(0,180000)+'\n[truncated]';
  await db.doc('matchlogs/'+id).set({ts:M.ts,text:txt,shots:SHOTS.slice(0,1500),turns:TURNS});toast('Match saved to history.')}catch(e){console.warn('save failed',e&&e.code)}}
async function showHist(){const w=document.createElement('div');w.id='histw';w.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);overflow:auto;padding:16px';
 w.innerHTML='<div class="card" style="max-width:980px;margin:0 auto"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Match history</h2><button id="hx">Close</button></div><div id="hb" class="mu">Loading…</div></div>';
 document.body.appendChild(w);w.querySelector('#hx').onclick=()=>w.remove();
 let rows=[],src='this browser only';const db=await getDB();
 if(db){try{const q=await Promise.race([db.collection('matches').orderBy('ts','desc').limit(500).get(),new Promise((_,rj)=>setTimeout(()=>rj('t'),10000))]);rows=q.docs.map(d=>({id:d.id,...d.data()}));src='saved database'}catch(e){db&&0}}
 if(!rows.length){try{rows=JSON.parse(localStorage.getItem('sfbHist')||'[]').reverse()}catch(e){rows=[]}}
 histDocs=rows;$('#hb').className='';$('#hb').innerHTML=histHTML(rows,src)}
function pct(h,n){return n?Math.round(100*h/n)+'%':'-'}
function histHTML(rows,src){if(!rows.length)return '<p class="mu">No games recorded yet. Finish a duel and it appears here.</p>';
 const fin=rows.filter(r=>r.res!=='unfinished'),W=fin.filter(r=>/^win/.test(r.res)).length;
 const agg={},by={};fin.forEach(r=>{const key=`${r.a}${(r.rfA||[]).length?'+':''} vs ${r.b}${(r.rfB||[]).length?'+':''}${(r.x||[]).length?' +'+r.x.length:''}`;const b=by[key]=by[key]||{n:0,w:0,t:0};b.n++;b.t+=r.turns;if(/^win/.test(r.res))b.w++;
  ['you','foe'].forEach(sd=>{Object.entries(r[sd]||{}).forEach(([k,v])=>{const g=(agg[sd]=agg[sd]||{})[k]=agg[sd][k]||{n:0,h:0,dm:0};g.n+=v.n;g.h+=v.h;g.dm+=v.dm})})});
 let h=`<p class="mu">${rows.length} game${rows.length>1?'s':''} (${src}). Record: <b>${W}</b> wins, <b>${fin.length-W}</b> losses or concessions${fin.length?` (${pct(W,fin.length)})`:''}.</p>`;
 h+='<h3>Record by matchup (+ means refits)</h3><div class="scroll"><table><tr><th>Matchup</th><th>Games</th><th>Wins</th><th>Avg turns</th></tr>'+Object.entries(by).map(([k,b])=>`<tr><td class="l">${k}</td><td>${b.n}</td><td>${b.w} (${pct(b.w,b.n)})</td><td>${(b.t/b.n).toFixed(1)}</td></tr>`).join('')+'</table></div>';
 h+='<h3>Weapon accuracy, all games (fired / hit / hit rate / damage rolled)</h3><div class="scroll"><table><tr><th>Weapon</th><th colspan="4">You</th><th colspan="4">Opponent</th></tr>';
 const ks=[...new Set([...Object.keys(agg.you||{}),...Object.keys(agg.foe||{})])];
 ks.forEach(k=>{const a=(agg.you||{})[k]||{n:0,h:0,dm:0},f=(agg.foe||{})[k]||{n:0,h:0,dm:0};h+=`<tr><td class="l">${k}</td><td>${a.n}</td><td>${a.h}</td><td>${pct(a.h,a.n)}</td><td>${a.dm}</td><td>${f.n}</td><td>${f.h}</td><td>${pct(f.h,f.n)}</td><td>${f.dm}</td></tr>`});h+='</table></div>';
 h+='<h3>Recent games</h3><div class="scroll"><table><tr><th>When</th><th>Matchup</th><th>Level</th><th>Info</th><th>Turns</th><th>Result</th><th>Dmg you / foe</th><th></th></tr>'+rows.slice(0,60).map((r,i)=>`<tr><td class="l">${new Date(r.ts).toLocaleString()}</td><td class="l">${r.a}${(r.rfA||[]).length?' ['+r.rfA.join(',')+']':''} vs ${r.b}${(r.rfB||[]).length?' ['+r.rfB.join(',')+']':''}</td><td>${r.lvl}</td><td>${r.open===false?'private':'open'}</td><td>${r.turns}</td><td class="${/^win/.test(r.res)?'ok':'bad'}">${r.res}</td><td>${r.yourDmg??'-'} / ${r.foeDmg??'-'}</td><td><button onclick="var e=document.getElementById('dbr${i}');e.style.display=e.style.display==='none'?'':'none'">Debrief</button> ${r.id?`<button onclick="copyHist('${r.id}')">Copy log</button>`:''}</td></tr><tr id="dbr${i}" style="display:none"><td colspan="8" class="l">${r.coach?debHtml(r.coach):'<span class="mu">No debrief was stored for this older game.</span>'}</td></tr>`).join('')+'</table></div>';
 return h}
async function copyHist(id){const db=await getDB();if(!db)return;try{const d=await db.doc('matchlogs/'+id).get();if(d.exists)copyText(d.data().text);else toast('No log stored for that game.')}catch(e){toast('Could not load that log.')}}

