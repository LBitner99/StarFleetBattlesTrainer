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
 $('#grid').innerHTML=g}
function setupMap(){buildGrid();const st=document.createElement('style');st.textContent='#grid .hl{display:none}#grid.lab .hl{display:inline}';document.head.appendChild(st);
 const mb=$('#mapbox');mb.addEventListener('wheel',e=>{e.preventDefault();const p=svgPt(e);zoomBy(e.deltaY<0?.8:1.25,p.x,p.y)},{passive:false});
 let drag=null;const ptr=new Map();let pd=0;mb.addEventListener('pointerdown',e=>{if(e.target.closest('.zc'))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){drag=null;const [a,c]=[...ptr.values()];pd=Math.hypot(a.x-c.x,a.y-c.y)}else drag={x:e.clientX,y:e.clientY,vx:vbx,vy:vby};mb.classList.add('drag');try{mb.setPointerCapture(e.pointerId)}catch(_){}});
 mb.addEventListener('pointermove',e=>{if(ptr.has(e.pointerId))ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});if(ptr.size===2){const [a,c]=[...ptr.values()],d=Math.hypot(a.x-c.x,a.y-c.y);if(pd>0&&d>0){const p=svgPt({clientX:(a.x+c.x)/2,clientY:(a.y+c.y)/2});zoomBy(pd/d,p.x,p.y)}pd=d;return}if(!drag)return;const b=box(),k=vbw/b.w;vbx=drag.vx-(e.clientX-drag.x)*k;vby=drag.vy-(e.clientY-drag.y)*k;applyVB()});
 const up=e=>{if(e&&e.pointerId!==undefined)ptr.delete(e.pointerId);pd=0;drag=null;if(!ptr.size)mb.classList.remove('drag')};mb.addEventListener('pointerup',up);mb.addEventListener('pointercancel',up);window.addEventListener('resize',applyVB)}
