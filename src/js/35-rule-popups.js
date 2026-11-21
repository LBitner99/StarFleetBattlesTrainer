function ridxOf(c){const sg=c.split('.');for(let i=sg.length;i>0;i--){const a=sg.slice(0,i).join('.');if(RIDX[a])return [a,RIDX[a]]}return null}
const RULE_SKIP=/^(SCRIPT|STYLE|SELECT|OPTION|TEXTAREA|BUTTON|INPUT|SVG|TEXT|TITLE)$/i;
const RULE_RE=/([\[(])((?:[A-Z]{1,2}\d+(?:\.\d+)*[a-z]?)(?:,\s*[A-Z]{1,2}\d+(?:\.\d+)*[a-z]?)*)([\])])/g;
/* A rule number written anywhere in the text (not only inside brackets) is a link too: "(the defender picks, D3.5)", "D6.1 to D6.6", "E3.52-E3.54", "SG1.0". The bracketed-list pass below runs first; whatever text is left is scanned here. */
const DOT_RE=/(?<![A-Za-z0-9.])[A-Z]{1,2}\d+(?:\.\d+)+[a-z]?(?![A-Za-z0-9.])/g;
function linkDot(n){const p=n.parentNode;if(!p||RULE_SKIP.test(p.nodeName)||(p.closest&&p.closest('.rl,.rn,svg,button,select')))return;const t=n.nodeValue;DOT_RE.lastIndex=0;let m,last=0,hit=false;const fr=document.createDocumentFragment();
 while((m=DOT_RE.exec(t))){hit=true;fr.appendChild(document.createTextNode(t.slice(last,m.index)));const e=document.createElement('span');e.textContent=m[0];e.className='rl';e.dataset.r=m[0];e.tabIndex=0;e.setAttribute('role','button');fr.appendChild(e);last=m.index+m[0].length}
 if(!hit)return;fr.appendChild(document.createTextNode(t.slice(last)));p.replaceChild(fr,n)}
function linkNode(n){if(n.nodeType===3){const p=n.parentNode;if(!p||RULE_SKIP.test(p.nodeName)||p.closest&&p.closest('.rl,.rn,svg,button,select'))return;
  const t=n.nodeValue;if(!/[\[(][A-Z]{1,2}\d/.test(t)){linkDot(n);return}RULE_RE.lastIndex=0;let m,last=0,hit=false;const fr=document.createDocumentFragment();
  while((m=RULE_RE.exec(t))){const cs=m[2].split(/,\s*/);hit=true;
   fr.appendChild(document.createTextNode(t.slice(last,m.index)+m[1]));
   cs.forEach((c,i)=>{if(i)fr.appendChild(document.createTextNode(', '));const e=document.createElement('span');e.textContent=c;e.className='rl';e.dataset.r=c;e.tabIndex=0;e.setAttribute('role','button');fr.appendChild(e)});
   fr.appendChild(document.createTextNode(m[3]));last=m.index+m[0].length}
  if(!hit){linkDot(n);return}fr.appendChild(document.createTextNode(t.slice(last)));const kids=Array.from(fr.childNodes).filter(x=>x.nodeType===3);p.replaceChild(fr,n);kids.forEach(linkDot)}
 else if(n.nodeType===1&&!RULE_SKIP.test(n.nodeName)&&!(n.classList&&(n.classList.contains('rl')||n.classList.contains('rn')))){Array.from(n.childNodes).forEach(linkNode)}}
let rulePin=null;
// [source labels] The pop-up names where each rule comes from: the Captain's Basic Set rulebook first; the Master Rulebook only where the Basic Set has no such rule, or where it revises the Basic Set rule (both are then shown).
const srcEsc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;');
function srcLbl(c,fb,r0){const S=RSRC[c],w=r0[4]===1?' The summary above is an excerpt, not a written summary.':'';if(fb||!S)return fb?'Reference only':'Summary of the rules';
 return{s:"Source: Captain's Basic Set rulebook. The Master Rulebook has the same rule.",b:"Source: Captain's Basic Set rulebook.",m:"Source: Master Rulebook only. This rule is not in the Captain's Basic Set. The game applies it only when its option is switched on.",r:"Revised rule: the Captain's Basic Set and the Master Rulebook differ. Both versions are shown."}[S[0]]+w}
function srcFold(c,r0){const S=RSRC[c];if(!S){return r0[3]?'<details><summary>Rulebook text</summary><div class="rt">'+srcEsc(r0[3])+'</div></details>':''}
 const d=(t,x,o)=>x?'<details '+(o?'open':'')+'><summary>'+t+'</summary><div class="rt">'+srcEsc(x)+'</div></details>':'';
 return S[0]==='r'?d("Captain's Basic Set text",S[1],1)+d("Master Rulebook text (revised)",S[2],1):S[0]==='m'?d("Master Rulebook text",S[2],0):d("Captain's Basic Set text",S[1],0)}
function ruleShow(el,pin){const c=el.dataset.r;let r0=RULES[c],fb=false;if(!r0){const q=ridxOf(c),sec=c.replace(/\..*$/,'');fb=true;r0=q?[q[1][0]||('Rule '+q[0]),(q[0]===c?'':'Part of rule '+q[0]+'. ')+'No summary has been written for this rule yet. It is in the Captain\'s Master Rulebook'+(q[1][1]?', page '+q[1][1]:'')+'.',[]]:['Section '+sec,'No summary has been written for this rule yet. Look it up in section '+sec+' of the Captain\'s Master Rulebook.',[]]}let b=document.getElementById('rulepop');if(!b){b=document.createElement('div');b.id='rulepop';document.body.appendChild(b)}
 const E=x=>x.replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const rel=(r0[2]||[]).filter(x=>RULES[x]).map(x=>'<span class="rl" data-r="'+x+'" tabindex="0" role="button">'+x+'</span>').join(', ');
 const MO=!fb&&RSRC[c]&&RSRC[c][0]==='m'?'<div style="margin:3px 0;padding:2px 6px;border-radius:4px;background:rgba(230,162,60,.22);font-size:.85em"><b>Master Rulebook only.</b> Not in the Captain\'s Basic Set; added to the game only when its option is switched on.</div>':'';
 b.innerHTML='<b>Rule '+c+' \u2014 '+E(r0[0])+'</b>'+MO+'<div>'+E(r0[1])+'</div>'+(rel?'<div class="rr">Related rules: '+rel+'</div>':'')+srcFold(c,r0)+'<small>'+srcLbl(c,fb,r0)+(pin?' (click elsewhere to close)':'')+'</small>';
 const inside=el.closest&&el.closest('#rulepop'),wasOpen=b.style.display==='block';b.style.display='block';
 if(!(inside&&wasOpen)){const r=el.getBoundingClientRect(),w=b.offsetWidth,h=b.offsetHeight;let x=Math.min(Math.max(8,r.left),innerWidth-w-8),y=r.bottom+6;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-6);b.style.left=x+'px';b.style.top=y+'px'}
 if(pin||inside)rulePin=inside?b:el}
function ruleHide(){const b=document.getElementById('rulepop');if(b)b.style.display='none';rulePin=null}
document.addEventListener('mouseover',e=>{const el=e.target.closest&&e.target.closest('.rl');if(el&&!rulePin)ruleShow(el,false)});
document.addEventListener('mouseout',e=>{const el=e.target.closest&&e.target.closest('.rl');if(el&&!rulePin)ruleHide()});
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('.rl');if(el){e.preventDefault();if(rulePin===el)ruleHide();else ruleShow(el,true)}else if(!e.target.closest('#rulepop'))ruleHide()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')ruleHide();else if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('rl')){e.preventDefault();ruleShow(e.target,true)}});
let ruleQ=false;const ruleMO=new MutationObserver(ms=>{if(ruleQ)return;ruleQ=true;setTimeout(()=>{ruleQ=false;ruleMO.disconnect();try{linkNode(document.body)}finally{ruleMO.observe(document.body,{childList:true,subtree:true})}},30)});
window.addEventListener('DOMContentLoaded',()=>{linkNode(document.body);ruleMO.observe(document.body,{childList:true,subtree:true})});
if(document.readyState!=='loading'){linkNode(document.body);ruleMO.observe(document.body,{childList:true,subtree:true})}

