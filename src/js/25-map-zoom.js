/* ================= map + zoom ================= */
let vbx,vby,vbw;
function box(){const b=$('#mapbox');return{w:b.clientWidth||800,h:b.clientHeight||400}}
function setVB(x,y,w){const b=box();w=Math.max(260,Math.min(w,Math.max(MAPW,MAPH*b.w/b.h)*1.15));vbw=w;vbx=x;vby=y;applyVB()}
function applyVB(){if(typeof vbx!=='number')return;const b=box(),h=vbw*b.h/b.w;$('#map').setAttribute('viewBox',`${vbx} ${vby} ${vbw} ${h}`);const g=$('#grid');if(g)g.setAttribute('class',vbw<950?'lab':'')}
function zoomBy(f,px,py){const b=box(),h=vbw*b.h/b.w,mx=px===undefined?vbx+vbw/2:px,my=py===undefined?vby+h/2:py,nw=Math.max(260,Math.min(vbw*f,Math.max(MAPW,MAPH*b.w/b.h)*1.15)),k=nw/vbw;vbx=mx-(mx-vbx)*k;vby=my-(my-vby)*k;vbw=nw;applyVB()}
function fitShips(){const L2=sh.filter(s=>!s.out||s===sh[0]),b0=box(),xs=L2.map(s=>cx(s.c)),ys=L2.map(s=>cy(s.c,s.r)),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),m=150;
 const w=Math.max(520,x1-x0+2*m,(y1-y0+2*m)*b0.w/b0.h);setVB((x0+x1)/2-w/2,(y0+y1)/2-w*b0.h/b0.w/2,w)}
function fitMap(){const b=box(),w=Math.max(MAPW,MAPH*b.w/b.h);setVB(MAPW/2-w/2,MAPH/2-w*b.h/b.w/2,w)}
function svgPt(e){const s=$('#map'),p=s.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(s.getScreenCTM().inverse())}
function buildGrid(){let g='';for(let c=1;c<=COLS;c++)for(let r=1;r<=ROWS;r++){const x=cx(c),y=cy(c,r),p=[0,1,2,3,4,5].map(k=>(x+R*Math.cos(Math.PI/3*k)).toFixed(1)+','+(y+R*Math.sin(Math.PI/3*k)).toFixed(1)).join(' ');g+=`<polygon points="${p}" fill="none" stroke="var(--hx)" stroke-width="1"/><text class="hl" x="${x}" y="${y-R*0.45}" font-size="7" text-anchor="middle" fill="var(--mu)">${hexNo(c,r)}</text>`}
 $('#grid').innerHTML=starField()+g}
// Star field behind the hexes: a fixed random sky (same every time) of tiny stars in several sizes and tints, a few brighter ones with a soft glow, and a faint band of haze.
function starField(){let s=20241124;const rnd=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const W=cx(COLS+1),H=cy(1,ROWS+1),x0=-600,y0=-600,w=W+1200,h=H+1200,tint=['#ffffff','#ffffff','#ffffff','#cfe3ff','#9fc4ff','#ffe9c4','#ffd2a1','#ffb8a8'];let o='<defs><radialGradient id="sfG"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="sfH" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5a6fd8" stop-opacity=".22"/><stop offset="1" stop-color="#5a6fd8" stop-opacity="0"/></radialGradient><filter id="sfB"><feGaussianBlur stdDeviation="22"/></filter></defs>';
 o+=`<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#02030a"/>`;
 // haze: a diagonal band of soft blobs
 for(let i=0;i<14;i++){const f=i/13,x=-100+(W+200)*f+(rnd()-.5)*120,y=H*(.9-.8*f)+(rnd()-.5)*140,r=90+rnd()*120;o+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(r*1.6).toFixed(0)}" ry="${r.toFixed(0)}" fill="${i%3?'#4a5bc4':'#8a5ac8'}" opacity="${(.04+rnd()*.05).toFixed(3)}" filter="url(#sfB)"/>`}
 const n=Math.round(w*h/2600);
 for(let i=0;i<n;i++){const x=x0+rnd()*w,y=y0+rnd()*h,k=rnd(),r=k<.7?.6+rnd()*.4:k<.93?1+rnd()*.5:1.5+rnd()*.8,op=k<.7?.4+rnd()*.4:.7+rnd()*.3,c=tint[Math.floor(rnd()*tint.length)];
  if(k>.965)o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r*3.2).toFixed(1)}" fill="${c}" opacity=".10"/>`;
  o+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${c}" opacity="${op.toFixed(2)}"/>`}
 return `<g id="stars" pointer-events="none">${o}</g>`}
function setupMap(){buildGrid();const st=document.createElement('style');st.textContent='#grid .hl{display:none}#grid.lab .hl{display:inline}';document.head.appendChild(st);
 const mb=$('#mapbox');mb.addEventListener('wheel',e=>{e.preventDefault();const p=svgPt(e);zoomBy(e.deltaY<0?.8:1.25,p.x,p.y)},{passive:false});
 let drag=null;const ptr=new Map();let pd=0;mb.addEventListener('pointerdown',e=>{if(e.target.closest('.zc'))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){drag=null;const [a,c]=[...ptr.values()];pd=Math.hypot(a.x-c.x,a.y-c.y)}else drag={x:e.clientX,y:e.clientY,vx:vbx,vy:vby};mb.classList.add('drag');try{mb.setPointerCapture(e.pointerId)}catch(_){}});
 mb.addEventListener('pointermove',e=>{if(ptr.has(e.pointerId))ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){const [a,c]=[...ptr.values()],d=Math.hypot(a.x-c.x,a.y-c.y);if(pd>0&&d>0){const p=svgPt({clientX:(a.x+c.x)/2,clientY:(a.y+c.y)/2});zoomBy(pd/d,p.x,p.y)}pd=d;return}if(!drag)return;const b=box(),k=vbw/b.w;vbx=drag.vx-(e.clientX-drag.x)*k;vby=drag.vy-(e.clientY-drag.y)*k;applyVB()});
 const up=e=>{if(e&&e.pointerId!==undefined)ptr.delete(e.pointerId);pd=0;drag=null;if(!ptr.size)mb.classList.remove('drag')};mb.addEventListener('pointerup',up);mb.addEventListener('pointercancel',up);window.addEventListener('resize',applyVB)}
