
const $=s=>document.querySelector(s);
/* ================= geometry ================= */
let COLS=42,ROWS=30;const R=21,HH=Math.sqrt(3)*R,PAD=14; // [G13.63] COLS/ROWS are variable: the 'start cloaked' option widens the map (setMapSize)
// Map geometry: SVG pixel centre of a hex (columns offset, hex number = column+row).
const cx=c=>PAD+R+(c-1)*1.5*R,cy=(c,r)=>PAD+HH/2+(r-1)*HH+(c%2===0?HH/2:0);
let MAPW=PAD*2+2*R+(COLS-1)*1.5*R,MAPH=PAD*2+HH*(ROWS+.5);
// [G13.63] Resize the map; the hex grid is redrawn by buildGrid().
function setMapSize(c,r){if(c===COLS&&r===ROWS)return false;COLS=c;ROWS=r;MAPW=PAD*2+2*R+(COLS-1)*1.5*R;MAPH=PAD*2+HH*(ROWS+.5);return true}
// Map geometry: the neighbour hex in facing f (0 = A, the six facings A-F, C1.43 one hex per movement point).
const NB=(c,r,f)=>{const o=c%2===1,t=[[0,-1],[1,o?-1:0],[1,o?0:1],[0,1],[-1,o?0:1],[-1,o?-1:0]][f];return[c+t[0],r+t[1]]};
// Map geometry: offset hex coordinates to cube coordinates, used for range and line of fire.
const cube=(c,r)=>{const x=c-1,z=(r-1)-((x-(x&1))/2);return[x,z,-x-z]};
// [D1.3] Range is the number of hexes between two units (cube distance).
const dist=(a,b)=>{const A=cube(a.c,a.r),B=cube(b.c,b.r);return Math.max(Math.abs(A[0]-B[0]),Math.abs(A[1]-B[1]),Math.abs(A[2]-B[2]))};
const hexNo=(c,r)=>String(c).padStart(2,'0')+String(r).padStart(2,'0');
const FL='ABCDEF',EPS=.6;
// [D2.1, D3.2] Bearing of b from a unit a, in degrees clockwise from its facing; drives arcs and shield facing.
function rel(a,b){const dx=cx(b.c)-cx(a.c),dy=cy(b.c,b.r)-cy(a.c,a.r);if(Math.abs(dx)<1e-6&&Math.abs(dy)<1e-6)return null;
 let t=Math.atan2(dx,-dy)*180/Math.PI;return((t-60*a.f)%360+360)%360}
const ARC={RF:[0,60],R:[60,120],RR:[120,180],LR:[180,240],L:[240,300],LF:[300,360]};
// [D2.2] Is a bearing inside a firing-arc token (LF, RF, FA, L, R, RA and so on)?
function inTok(t,a){if(a===null||t==='ALL')return true;
 if(t==='FH')return a<=90+EPS||a>=270-EPS;if(t==='RH')return a>=90-EPS&&a<=270+EPS;
 if(t==='FA')return inTok('LF',a)||inTok('RF',a);if(t==='FX')return a<=120+EPS||a>=240-EPS;
 if(t==='REAR')return Math.abs(a-180)<EPS;
 const[lo,hi]=ARC[t];return(a>=lo-EPS&&a<=hi+EPS)||(t==='LF'&&a<=EPS)||(t==='RF'&&a>=360-EPS)}
// [D3.1, D4.11] Which of the six shields (#1-#6) a shot from src strikes on tgt; on a hex-side bearing the facing is rolled (the "note").
function shieldFor(tgt,src){const a=rel(tgt,src);if(a===null)return{k:0,note:''};const x=(a+30)%360,k=Math.floor(x/60)%6,m=x%60;
 if(m<EPS||m>60-EPS){const c=m<EPS?[(k+5)%6,k]:[k,(k+1)%6],pick=tgt.sh[c[0]]>=tgt.sh[c[1]]?c[0]:c[1];return{k:pick,note:` (on the line between shields #${c[0]+1} and #${c[1]+1}; the defender picks, D3.5)`}}
 return{k,note:''}}
