/* ================= Whole-map zones: heat zone P10, sunspots P11, dust cloud P13, ion storm P14, radiation zone P15 (option) ================= */
let ZONE='off',SUN={comm:false,noTx:false,jam:false}; // [P10.0, P13.0, P14.0, P15.0] one of these covers the entire map; ZONE is 'off'|'heat'|'dust'|'dust2'|'rad'|'sun'|'ion'
const ZR=()=>ZONE==='rad'||ZONE==='ion',ZD=()=>ZONE==='dust'||ZONE==='dust2';
const ZN={heat:'Heat zone (P10)',dust:'Dust cloud (P13)',dust2:'Intense dust cloud (P13.5)',rad:'Radiation zone (P15)',sun:'Sunspot activity (P11)',ion:'Ion storm (P14)'};
const zEcm=()=>(ZONE==='dust'?1:ZONE==='dust2'?2:0)+(SUN.jam?8:0); // [P13.4, P13.5] one point of natural ECM (two if intense); [P11.3] eight points of jamming
const DUSTT={5:[[13,18],[23,25],[29,99]],10:[[19,22],[26,99]],15:[[9,12],[23,99]],20:[[19,99]],25:[[13,18],[26,99]],30:[[19,99]]}; // [P13.1] speeds that take damage on each impulse divisible by five
const dustHit=(sp,i,em)=>i%5===0&&(em||(DUSTT[i]||[]).some(([a,b])=>sp>=a&&sp<=b));
// [P11.0, P14.3] Sunspots: roll after energy allocation each turn. 1 communications, 2 no transporters or tractors, 3 jamming, 4-6 all three.
function zoneTurn(){SUN={comm:false,noTx:false,jam:false};if(ZONE!=='sun'&&ZONE!=='ion')return;const d=d6();SUN.comm=d===1||d>=4;SUN.noTx=d===2||d>=4;SUN.jam=d===3||d>=4;
 L(`Turn ${turn}: sunspot roll ${d}: ${[SUN.comm&&'communications are disrupted (no effect in a solo game)',SUN.noTx&&'transporters and tractor beams do not work',SUN.jam&&'eight points of natural ECM jam everyone'].filter(Boolean).join('; ')}.`+RL(ZONE==='ion'?'P14.3, P11.1, P11.2, P11.3':'P11.0, P11.1, P11.2, P11.3'))}
function radKill(s,i){ // [P15.11, P15.12] one crew unit dies; the last unit leaves a contaminated derelict
 if(s.gc>1){s.gc--;s.cK=(s.cK||0)+1;L(`Impulse ${i}: radiation kills a crew unit aboard ${s.tag}.`+RL('P15.11')+crewNote(s))}
 else if(s.bp>=2){s.bp-=2;s.bK=(s.bK||0)+2;L(`Impulse ${i}: radiation kills a crew unit aboard ${s.tag} (two boarding parties).`+RL('P15.11')+crewNote(s))}
 else{const k=sh.indexOf(s);L(`Impulse ${i}: radiation kills the last crew unit aboard ${s.tag}; the ship is a contaminated derelict.`+RL('P15.11, P15.12'));endFor(k,s,`The last crew unit on ${s.tag} died of radiation (P15.12). It is a contaminated derelict.`,`The last crew unit of your ship died of radiation (P15.12). It is a contaminated derelict.`,'P15.12')}}
function zoneImp(i){if(ZONE==='off')return;
 const live=sh.filter(s=>!s.out&&!s.boom);
 if(ZD()){const dm=ZONE==='dust2'?2:1;live.forEach(s=>{const sp=spdOf(s);if(!dustHit(sp,i,s.emOn))return;const k=s.dir?3:0; // [P13.2] facing shield in the direction of movement (P3.21); erratic ships take the point on every listed impulse
  L(`Impulse ${i}: ${s.tag} flies through dust at speed ${sp} and takes ${dm} damage on shield #${k+1}.`+RL('P13.2, P13.1'+(ZONE==='dust2'?', P13.5':'')+(s.emOn?', C10.45':'')));applyVolley(s,k,dm,s,'',`${s.tag} takes ${dm} dust damage on shield #${k+1}.`,'P13.2')});
  DR.slice().forEach(d=>{if(d.pl)return;if(dustHit((d.spd||0)-10,i,false)){d.hp-=dm;L(`Impulse ${i}: dust hits drone #${d.id} (${dm} damage).`+RL('P13.3'));if(d.hp<=0){rmDr(d);L(`Drone #${d.id} is destroyed by the dust.`+RL('P13.3'))}}})} // [P13.3] drones: speed minus ten
 if((ZONE==='heat'||ZR())&&i%8===0)live.forEach(s=>{const dn=[0,1,2,3,4,5].filter(k=>(s.sh[k]||0)<=0||s.shOn===0||(s.dn&&s.dn[k]&&absI(i)<s.dn[k])); // a shield is down when it has no boxes left, or is dropped
  if(!dn.length)return;
  if(ZONE==='heat'){L(`Impulse ${i}: heat zone: ${s.tag} has ${dn.length} shield${dn.length===1?'':'s'} down and takes ${dn.length} internal damage point${dn.length===1?'':'s'} (armor does not help; the damage allocation chart is used as normal).`+RL('P10.1'));dn.forEach(()=>{if(!s.out&&!s.boom)dac(s,null,new Set())})}
  else radKill(s,i)});
 checkEnd()}


