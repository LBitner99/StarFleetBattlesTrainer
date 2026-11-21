/* ===== phone layout: tab bar, auto tab switching, number steppers ===== */
let mtab='act',mkey='',mWasStarted=false,mapFresh=true;const eaOpen=new Set(),mq=matchMedia('(max-width:760px)');
(function(){const bar=document.createElement('div');bar.id='mtab';bar.innerHTML=[['act','Orders'],['map','Map'],['ship','Ships'],['opt','Options']].map(t=>'<button type="button" data-t="'+t[0]+'">'+t[1]+'</button>').join('');document.body.appendChild(bar);
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;mtab=b.dataset.t;mobSync();if(mtab==='map')requestAnimationFrame(()=>{if(mapFresh){fitShips();mapFresh=false}else if(typeof vbx==='number')applyVB()})})})();
function mobSync(){try{const on=started&&mq.matches;if(started&&!mWasStarted){mapFresh=true;mtab='act';mkey=''}mWasStarted=!!started;
  document.body.classList.toggle('gm',!!on);['act','map','ship','opt'].forEach(t=>document.body.classList.toggle('t-'+t,mtab===t));
  document.querySelectorAll('#mtab button').forEach(b=>{b.classList.toggle('on',b.dataset.t===mtab);b.classList.toggle('dot',b.dataset.t==='act'&&mtab!=='act'&&!!$('#act').children.length)});
  if(!on)return;
  const a=$('#act'),k=(a.querySelector('h2')||{}).textContent||'';
  if(k!==mkey){mkey=k;if(k){if(mtab==='map'||mtab==='act'){mtab='act'}else if(!over)mtab='act'}else if(mtab==='act'&&!over){mtab='map';mapFresh=false;requestAnimationFrame(()=>{if(typeof vbx==='number')applyVB()})}
   ['act','map','ship','opt'].forEach(t=>document.body.classList.toggle('t-'+t,mtab===t));document.querySelectorAll('#mtab button').forEach(b=>b.classList.toggle('on',b.dataset.t===mtab))}
  document.querySelectorAll('.ea tr').forEach(r=>{const l=r.querySelector('td.l');if(l&&eaOpen.has(l.firstChild&&l.firstChild.textContent))r.classList.add('open')});
  a.querySelectorAll('input[type=number]').forEach(inp=>{if(inp.closest('.stp'))return;const st=+inp.step||1;inp.inputMode=st%1?'decimal':'numeric';
   const w=document.createElement('span');w.className='stp';inp.parentNode.insertBefore(w,inp);const mk=(t,d)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.setAttribute('aria-label',d<0?'decrease':'increase');b.onclick=ev=>{ev.preventDefault();let v=(+inp.value||0)+d*st;if(inp.min!=='')v=Math.max(+inp.min,v);if(inp.max!=='')v=Math.min(+inp.max,v);inp.value=v;inp.dispatchEvent(new Event('change',{bubbles:true}))};return b};w.append(mk('−',-1),inp,mk('+',1))})}catch(e){console.error(e)}}
document.addEventListener('click',e=>{const l=e.target.closest&&e.target.closest('.ea td.l');if(!l||e.target.closest('.rl'))return;const r=l.parentNode,k=l.firstChild&&l.firstChild.textContent;r.classList.toggle('open');if(r.classList.contains('open'))eaOpen.add(k);else eaOpen.delete(k)});
{const d0=draw;draw=function(){const r=d0.apply(this,arguments);mobSync();return r}}
mq.addEventListener&&mq.addEventListener('change',mobSync);mobSync();
