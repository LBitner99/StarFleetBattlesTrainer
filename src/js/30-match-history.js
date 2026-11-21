/* ================= match recording, log copy, history ================= */
let VOL=[],ST={},DEB=null,SHOTS=[],TURNS=[],saved=false,gid='',histDocs=null,DBH=null,DBTRIED=false;
const KN={ph:'phaser',tu:'photon',di:'disruptor',pl:'plasma',pb:'plasma bolt',pr:'probe'};
function recShot(s,x,foe,r,re,d,dmg,ov){try{SHOTS.push({t:turn,i:imp,by:s===sh[0]?0:s.tm===1?1:2,k:KN[x.kind]||x.kind,w:x.w.name,dr:foe.dr?1:0,r:r,re:re,d:d,hit:dmg>0?1:0,dm:dmg,ov:ov?1:0})}catch(e){}}
function shSnap(s){return {pw:power(s),sh:s.sh.slice(),sp:(s.plan&&s.plan.spd)||0}}
function snapTurn(){try{TURNS.push({t:turn,rng:dist(sh[0],sh[1]),a:{...shSnap(sh[0]),plan:planText(sh[0],sh[0].plan)},b:{...shSnap(sh[1]),plan:planText(sh[1],sh[1].plan)},x:scr()?[]:sh.slice(2).filter(s=>s.plan&&s.tm===1).map(s=>({tag:s.tag,sp:shSnap(s).sp,plan:planText(s,s.plan)}))})}catch(e){}} // extra computer ships (second to fourth opponent) get their own records
function plainLog(){const tmp=document.createElement('div');return log.slice().reverse().map(l=>{tmp.innerHTML=l;return tmp.textContent}).join('\n')}
function logHeader(){const rA=(rfA||[]).join(','),rB=(rfB||[]).join(',');
 let h=`STAR FLEET BATTLES DUEL LOG\nYou: ${sh[0].n}${rA?' (refits: '+rA+')':''}  vs  ${sh[1].n}${rB?' (refits: '+rB+')':''}${scr()?'':sh.slice(2).filter(x=>x.tm===1).map(x=>' + '+x.n+((x.rf&&x.rf.length)?' (refits: '+x.rf.join(',')+')':'')).join('')}${sh.filter(x=>x.tm===0&&x!==sh[0]).length?'\nYour computer allies: '+sh.filter(x=>x.tm===0&&x!==sh[0]).map(x=>x.n+((x.rf&&x.rf.length)?' (refits: '+x.rf.join(',')+')':'')).join(', '):''}\nOpponent level: ${level}   Information: ${openInfo?'open (learning mode)':'rules-faithful (opponent records private)'}   Turns: ${turn}${over?'   Result: '+over.text:'   (game in progress)'}\n`;
 const all=TURNS.slice();h+='\nPER-TURN PLANS (range at end of turn, speeds, power left)\n';
 all.forEach(t=>{h+=(over||openInfo)?`T${t.t}: range ${t.rng}. YOU spd ${t.a.sp}, power ${t.a.pw}: ${t.a.plan}. FOE spd ${t.b.sp}, power ${t.b.pw}: ${t.b.plan}.\n`:`T${t.t}: range ${t.rng}. YOU spd ${t.a.sp}, power ${t.a.pw}: ${t.a.plan}. FOE spd ${t.b.sp} (its allocation is private until the game ends).\n`});
 const g=summ(SHOTS);h+='\nSHOTS (fired / hit / damage rolled)\n';
 ['you','foe'].forEach((who,k)=>{h+=who.toUpperCase()+': '+Object.keys(g[k]).map(kk=>`${kk} ${g[k][kk].n}/${g[k][kk].h}/${g[k][kk].dm}`).join(', ')+'\n'});
 return h+'\nFULL LOG (oldest first)\n'}
function summ(sh_){const o=[{},{}];sh_.forEach(x=>{if(x.dr)return;const g=o[x.by][x.k]=o[x.by][x.k]||{n:0,h:0,dm:0};g.n++;g.h+=x.hit;g.dm+=x.dm});return o}
function copyText(txt){
 const fallback=()=>{const w=document.createElement('div');w.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
  w.innerHTML='<div class="card" style="max-width:720px;width:100%;margin:0"><h2>Copy the log</h2><p class="mu">The browser blocked automatic copying. Select all (Ctrl/Cmd+A) in the box and copy it.</p><textarea style="width:100%;height:50vh;font:12px monospace;color:var(--tx);background:var(--card);border:1px solid var(--bd);border-radius:8px"></textarea><div class="row"><button class="pri" id="cpx">Close</button></div></div>';
  document.body.appendChild(w);const ta=w.querySelector('textarea');ta.value=txt;ta.focus();ta.select();w.querySelector('#cpx').onclick=()=>w.remove()};
 const legacy=()=>{try{const ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch(e){return false}};
 const done=()=>toast('Log copied to the clipboard.');
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,()=>{legacy()?done():fallback()});return}}catch(e){}
 legacy()?done():fallback()}
function toast(m){const t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:var(--ac);color:#fff;padding:8px 16px;border-radius:999px;font-size:.9rem';document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}

