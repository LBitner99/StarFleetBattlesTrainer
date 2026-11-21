/* ================= Tholian web (G10, option) ================= */
let optWeb=false,WEBS=[],WMAP=new Map(),WN=0; // [G10.0] a web is a chain of hexes with an energy total; WMAP maps a hex to its web
const isTho=s=>!!s&&!s.dr&&!!s.d&&s.d.side==='tho'; // [G10.53] Tholian units pass through webs freely
const webOk=s=>isTho(s)&&(s.sys.Web||0)>0&&!s.out;
// [G10.0] Rebuild the hex-to-web lookup.
function webRebuild(){WMAP=new Map();WEBS.forEach(w=>w.hx.forEach(h=>WMAP.set(h[0]+','+h[1],w)))}
// [G10.0] The web (if any) in a hex.
const webAt=(c,r)=>optWeb?(WMAP.get(c+','+r)||null):null;
const webStr=w=>Math.min(35,Math.floor(w.en/w.hx.length+1e-9)); // [G10.3, G10.31] energy divided by hexes, fractions kept in the total; 35 is the most per hex
const webStrAt=(c,r)=>{const w=webAt(c,r);return w?webStr(w):0};
function lineKeys(a,b){ // [D1.4] hexes along the line of fire from a to b, both ends included
 const A=cube(a.c,a.r),B=cube(b.c,b.r),n=Math.max(1,dist(a,b)),out=[];
 for(let i=0;i<=n;i++){const t=i/n,f=[0,1,2].map(j=>A[j]+(B[j]-A[j])*t+1e-6*(j-1));let rx=Math.round(f[0]),ry=Math.round(f[1]),rz=Math.round(f[2]);const dx=Math.abs(rx-f[0]),dy=Math.abs(ry-f[1]),dz=Math.abs(rz-f[2]);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;
  out.push([rx+1,ry+(rx-(rx&1))/2+1])}return out}
function webFire(s,foe,kind){ // [G10.61, G10.62] a web hex strictly between the two units blocks direct fire; a Tholian phaser shoots through its own web with one point off per hex out to the farthest web hex
 if(!optWeb||!WEBS.length)return{block:false,red:0};const ks=lineKeys(s,foe);let far=0;
 for(let i=1;i<ks.length-1;i++)if(webStrAt(ks[i][0],ks[i][1])>0)far=i;
 if(!far)return{block:false,red:0};if(isTho(s)&&kind==='ph')return{block:false,red:far};return{block:true,red:0}}
function webThrough(a,b){ // [G10.71] tractors and transporters cannot work through a web hex
 if(!optWeb||!WEBS.length)return false;const ks=lineKeys(a,b);for(let i=1;i<ks.length-1;i++)if(webAt(ks[i][0],ks[i][1]))return true;return false}
function webPay(s,n){ // [G10.211] six energy "from any source": the energy allocated to the web first, then reserve power
 if((s.wbP||0)+Math.max(0,s.bat||0)<n)return false;const a=Math.min(s.wbP||0,n);s.wbP=(s.wbP||0)-a;if(n-a>0)spendBat(s,n-a);return true}
// [G10.113] A web dissolves.
function webDissolve(w,why,rc){
 WEBS=WEBS.filter(x=>x!==w);webRebuild();sh.forEach(t=>{if(t.trap&&t.trap.w===w)t.trap=null;if(t.wl===w)t.wl=null});DR.forEach(d=>{if(d.trap&&d.trap.w===w)d.trap=null});
 L(`A web of ${w.hx.length} hex${w.hx.length===1?'':'es'} dissolves: ${why}.`+RL(rc||'G10.113'))}
function webLayWhy(s,w,c,r){ // [G10.22, G10.224, G10.232] where a hex of web may be laid
 if(s.emOn)return'a unit using erratic maneuvering cannot lay web (C10.513)';
 if(webAt(c,r))return'webs may not cross or connect';
 const last=w.hx[w.hx.length-1];
 for(const x of WEBS)for(const h of x.hx){if(h===last)continue;if(dist({c,r},{c:h[0],r:h[1]})===1)return'the new hex would touch another web hex (a web cannot bend back on itself)'}
 if(w.hx.length>=30)return'a web cannot be more than 30 hexes long (G10.232)';return''}
function webAfter(s,i,pc,pr){ // called after a ship moved from (pc,pr): laying, anchoring and being caught
 if(!optWeb||s.out)return;
 if(webOk(s)&&(s.c!==pc||s.r!==pr)){
  if(s.wm&&!s.wl&&inAst(pc,pr)&&!inAst(s.c,s.r)&&!webAt(pc,pr)&&!(WEBS.some(x=>x.hx.some(h=>dist({c:pc,r:pr},{c:h[0],r:h[1]})<=1)))){ // [G10.111, G10.112] a web starts in an asteroid hex, which is the first anchor
   if(webPay(s,6)){const w={id:++WN,hx:[[pc,pr]],en:0,z:0};WEBS.push(w);webRebuild();s.wl=w;L(`Impulse ${i}: ${s.tag} lays a web hex in asteroid hex ${hexNo(pc,pr)}, which anchors it, for 6 energy (zero strength at first).`+RL('G10.112, G10.211, G10.1314'))}
   else L(`Impulse ${i}: ${s.tag} has no six points of energy to start a web in ${hexNo(pc,pr)}.`+RL('G10.211'))}
  if(s.wl){const w=s.wl;
   if(!WEBS.includes(w))s.wl=null;
   else if(!s.wm)webDissolve(w,`${s.tag} moved on without laying web, so it gave up its anchor`,'G10.1162, G10.113');
   else{const why=webLayWhy(s,w,s.c,s.r);
    if(why)webDissolve(w,`${s.tag} could not lay web in ${hexNo(s.c,s.r)}: ${why}`,'G10.113, G10.22');
    else if(!webPay(s,6))webDissolve(w,`${s.tag} has no six points of energy left for the next hex, so the web is not anchored at that end`,'G10.211, G10.113');
    else{w.hx.push([s.c,s.r]);webRebuild();let t=`Impulse ${i}: ${s.tag} lays web in ${hexNo(s.c,s.r)} for 6 energy (the web is ${w.hx.length} hexes long, strength ${webStr(w)}).`;
     if(inAst(s.c,s.r)&&w.hx.some(h=>!inAst(h[0],h[1]))){s.wl=null;t+=` The ship is in an asteroid hex, so the web is anchored at both ends.`}
     L(t+RL('G10.211, G10.111'+(s.wl?'':', G10.1314')))}}}}
 webEnter(s,i,pc,pr)}
function webEnter(s,i,pc,pr){ // [G10.51, G10.59] a non-Tholian ship entering a web hex of strength above zero stops there
 if(isTho(s))return;const w=webAt(s.c,s.r);if(!w||webStr(w)<=0)return;if(s.c===pc&&s.r===pr)return;
 const str=webStr(w),was=webAt(pc,pr),sp=s.sp;s.trap={w,pts:[]};s.disOk=false;
 let t=`Impulse ${i}: ${s.tag} flies into a web hex of strength ${str} and is caught: to get out it must spend ${str} movement point${str===1?'':'s'} within 32 impulses.`;
 const lost=Math.min(sp,str);
 if(!(was&&webStr(was)>0)&&lost>=12){const dm=lost-12,first=nimble(s)?(s.hetN||0)<2:!(s.hetN),adj=first&&!isCrip(s)?2:0,d=d6(),net=d-adj;s.hetN=(s.hetN||0)+1;
  t+=` It loses ${lost} points of speed on impact.`;L(t+RL('G10.51, G10.511, G10.59, G10.591'));
  if(dm>0){const k=shieldFor(s,{c:pc,r:pr}).k;applyVolley(s,k,dm,s,'',`${s.tag} takes ${dm} damage on shield #${k+1} from the impact (each point of speed lost beyond twelve).`,'G10.592')}
  const bt=`  Breakdown roll for ${s.tag}: ${d}${adj?' − 2 (first HET bonus, C6.52)':''} = ${net} against a breakdown rating of ${s.bd}–6`;
  if(net>=s.bd){L(bt+' → BREAKDOWN!'+RL('G10.591, C6.51'));breakdown(s,i)}else L(bt+' → safe'+RL('G10.591, C6.51'));return}
 L(t+RL('G10.51, G10.511'))}
function webHold(s,i,tk,het){ // [G10.511] returns 0 not caught, 1 held, 2 breaks free this impulse
 if(!optWeb||isTho(s))return 0;let t=s.trap;const w=webAt(s.c,s.r);
 if(!w||webStr(w)<=0){s.trap=null;return 0}
 if(!t||t.w!==w){t=s.trap={w,pts:[]};L(`Impulse ${i}: ${s.tag} is in a web hex of strength ${webStr(w)} and is held by it.`+RL('G10.51, G10.55'))}
 s.disOk=false;const A=absI(i),str=webStr(w);t.pts=t.pts.filter(x=>x>A-32);t.pts.push(A);
 if(t.pts.length>=str){s.trap=null;L(`Impulse ${i}: ${s.tag} has spent ${str} movement point${str===1?'':'s'} in the web and pulls free.`+RL('G10.511'));return 2}
 if(!het&&tk!==0&&Math.abs(tk)!==2&&elig(s)){s.f=(s.f+tk+6)%6;s.st=0;L(`Impulse ${i}: ${s.tag} turns ${tk>0?'right':'left'} to facing ${FL[s.f]} without leaving the hex (${t.pts.length} of ${str} movement points spent).`+RL('G10.57, G10.511'))}
 return 1}
function dWebHold(d,A){ // [G10.52] drones and plasma torpedoes are caught the same way
 const w=webAt(d.c,d.r);if(!w||webStr(w)<=0){d.trap=null;return false}
 let t=d.trap;if(!t||t.w!==w)t=d.trap={w,pts:[]};const str=webStr(w);t.pts=t.pts.filter(x=>x>A-32);t.pts.push(A);
 if(t.pts.length>=str){d.trap=null;return false}if(d.pl)d.trav++;return true}
function dWebEnter(d,tg,A){ // [G10.52, G10.593] a seeking weapon in its target's hex strikes at once; otherwise it is caught and a fast drone may be hurt
 const w=webAt(d.c,d.r);if(!w||webStr(w)<=0||(d.c===tg.c&&d.r===tg.r))return false;const str=webStr(w);d.trap={w,pts:[]};
 if(!d.pl){const dm=Math.max(0,Math.min(d.spd,str)-20);if(dm>=d.hp){rmDr(d);L(`Drone #${d.id} of ${d.own.tag} hits a web of strength ${str} at speed ${d.spd} and is destroyed.`+RL('G10.593'));return true}}
 L(`${d.pl?'Plasma torpedo':'Drone'} #${d.id} of ${d.own.tag} is caught in a web hex of strength ${str}.`+RL('G10.52'));return false}
function webReinforce(i){ // [G10.212, G10.2121, G10.2122] each Tholian ship in or beside a web adds up to four allocated energy points per impulse
 if(!optWeb||!WEBS.length)return;
 sh.forEach(s=>{if(!webOk(s)||(s.wbP||0)<=0)return;
  const c=WEBS.filter(w=>w.en<35*w.hx.length-1e-9&&w.hx.some(h=>dist(s,{c:h[0],r:h[1]})<=1));if(!c.length)return;
  const trapd=w=>sh.some(t=>t.trap&&t.trap.w===w)||DR.some(d=>d.trap&&d.trap.w===w);
  c.sort((a,b)=>(trapd(b)-trapd(a))||(webStr(a)-webStr(b)));const w=c[0],add=Math.min(4,s.wbP,35*w.hx.length-w.en),a0=webStr(w);if(add<=0)return;
  w.en+=add;s.wbP-=add;const a1=webStr(w);if(a1!==a0)L(`Impulse ${i}: ${s.tag} reinforces the web with ${add} energy (strength ${a0} → ${a1}, ${Math.floor(s.wbP)} web energy left this turn).`+RL('G10.212, G10.2121, G10.31'))})}
function webEndTurn(){ // [G10.41, G10.43] each hex loses one point of energy a turn; a web at zero for seven turns falls apart
 if(!optWeb||!WEBS.length)return;
 WEBS.slice().forEach(w=>{const e0=w.en,s0=webStr(w);w.en=Math.max(0,w.en-w.hx.length);const s1=webStr(w);
  if(s1<=0)w.z=(w.z||0)+1;else w.z=0;
  L(`Web of ${w.hx.length} hexes: ${Math.round(e0)} energy points, strength ${s0}; after deterioration (${w.hx.length}) ${Math.round(w.en)} points, strength ${s1}.`+RL('G10.41, G10.31')+(s1<=0?` It has been at zero ${w.z} turn${w.z===1?'':'s'}.`+RL('G10.43'):''));
  if(w.z>=7)webDissolve(w,'it has been at strength zero for seven turns','G10.43')})}
// [G10.0] Draw web hexes with their strength.
function webSvg(){if(!optWeb||!WEBS.length)return'';const pts=(c,r)=>[0,1,2,3,4,5].map(i=>(cx(c)+R*Math.cos(i*Math.PI/3)).toFixed(1)+','+(cy(c,r)+R*Math.sin(i*Math.PI/3)).toFixed(1)).join(' ');
 return WEBS.map(w=>{const st=webStr(w);return w.hx.map(([c,r])=>`<polygon points="${pts(c,r)}" fill="#7fe3ff" fill-opacity="${st?Math.min(.5,.14+st*.02):.06}" stroke="#7fe3ff" stroke-opacity=".85" stroke-width="1.6"${st?'':' stroke-dasharray="3 3"'}/><text x="${cx(c)}" y="${cy(c,r)+3}" fill="#d9f6ff" font-size="9" text-anchor="middle" style="pointer-events:none">${st}</text>`).join('')}).join('')}
// [P3.1] Draw asteroids.

