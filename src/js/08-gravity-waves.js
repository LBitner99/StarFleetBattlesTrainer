/* ================= Gravity waves (P9.0, option) ================= */
// [P9.0] A gravity wave is a moving line (or, from a black hole, an expanding ring) of destruction that moves one hex per impulse. Option GWM: 'bh' = the black hole of S5.2 result 2 sends a 100-point ring every 10th turn from turn 5 (P9.4, P9.41); 'l20' / 'l50' = a straight 20- or 50-point wave crossing the map from one side every third turn starting on turn 3 (the book leaves the waves of a Duel to the scenario; P9.1, P9.12), east on turns 3, 9, 15 and west on turns 6, 12, 18.
let GWM='off',GWL=null; // GWL: the straight wave now crossing the map {dir, n (hexes moved), off (map shift), str}
const GWF=[0,100,90,81,73,66,59,53,48,43,39,35,31,28,25,23,21,19,17,15,14,12,11,10,9,8,7,6,5,4,3,2,1]; // [P9.42] force of a black hole's wave by radius = impulse number
const GWN={off:'None',bh:'Black hole waves (P9.4)',l20:'Straight wave, 20 points (P9.12)',l50:'Straight wave, 50 points (P9.12)'};
// [P9.41, P9.43] Where a unit sits on the ring of radius r round the hole: on a corner (straight out along one hex direction) or on a side between two corners.
function gwRing(B,r,u){for(let c=0;c<6;c++){let h=[B.c,B.r];for(let k=0;k<r;k++)h=NB(h[0],h[1],c);for(let j=0;j<r;j++){if(h[0]===u.c&&h[1]===u.r)return{kind:'ring',c,corner:j===0};h=NB(h[0],h[1],(c+2)%6)}}return null}
// [P9.3] The effect on one unit. Ships: the strength is split evenly between the two shields that face the wave (P9.31); a ring corner spreads it over the three facing shields and does not turn the ship (P9.43); otherwise the ship is turned 60 degrees to face along the wave (P9.32, not bases or monsters). Plasma torpedoes are not hurt but count the strength as range travelled (P9.312); other seeking weapons take it as damage.
function gwHit(u,str,g,i){
 if(u.dr){if(u.pl){u.trav=(u.trav||0)+str;L(`Impulse ${i}: a gravity wave hits plasma torpedo #${u.id}: it counts ${str} hexes of range as travelled.`+RL('P9.312'));if(plStr(u)<=0){rmDr(u);L(`Plasma torpedo #${u.id} has run out of range and is lost.`+RL('P9.312'))}}
  else{u.hp-=str;L(`Impulse ${i}: a gravity wave hits drone #${u.id} for ${str} damage.`+RL('P9.3'));if(u.hp<=0){rmDr(u);L(`Drone #${u.id} is destroyed by the gravity wave.`+RL('P9.3'))}}return}
 let ks,par=null;
 if(g.kind==='ring'&&g.corner){const k=(((g.c+3-u.f)%6)+6)%6;ks=[(k+5)%6,k,(k+1)%6]} // [P9.43] only one shield faces the wave on a corner: spread it over the three facing shields, no turn
 else{let a,b;if(g.kind==='ring'){a=(g.c+3)%6;b=(g.c+4)%6;par=[(g.c+2)%6,(g.c+5)%6]}else if(g.dir>0){a=4;b=5;par=[0,3]}else{a=1;b=2;par=[0,3]}
  ks=[(((a-u.f)%6)+6)%6,(((b-u.f)%6)+6)%6]} // [P9.31] the two shields that face the wave
 const n=ks.length,base=Math.floor(str/n),dm={};let rem=str-base*n;ks.forEach(k=>dm[k]=base);ks.slice().sort((x,y)=>(u.sh[y]||0)-(u.sh[x]||0)).forEach(k=>{if(rem>0){dm[k]++;rem--}}); // [P9.31] odd points go where the owner wants: the strongest shield
 L(`Impulse ${i}: a ${str}-point gravity wave hits ${u.tag}: ${ks.map(k=>dm[k]+' on shield #'+(k+1)).join(', ')}.`+RL(g.kind==='ring'&&g.corner?'P9.3, P9.31, P9.43':'P9.3, P9.31'));
 ks.forEach(k=>{if(dm[k]>0&&!u.out&&!u.boom)applyVolley(u,k,dm[k],u,'',`${u.tag} takes ${dm[k]} gravity wave damage on shield #${k+1}.`,'P9.31')});
 ckVoid(u,'it was struck by a gravity wave','G13.48');
 if(par&&!u.out&&!u.boom&&!u.neu&&!(u.d&&u.d.base)&&!par.includes(u.f)){const t=par.find(p=>{const d=((p-u.f)%6+6)%6;return d===1||d===5});if(t!==undefined){u.f=t;L(`${u.tag} is turned to face ${FL[t]}, along the wave.`+RL('P9.32'))}}}
// [P9.21] Waves move in the involuntary stage; a unit that moves into a wave hex is hit once everyone has moved. Here both are settled together after movement: a unit is hit when it is in a wave hex and was not in a wave hex on the last impulse.
function gwStep(i){if(GWM==='off'||over)return;
 const live=()=>sh.filter(u=>!u.out&&!u.boom&&!u.exitEdge&&u.pst!=='L').concat(DR); // [P9.331] units landed on a planet are unaffected
 let inW,str;
 if(GWM==='bh'){const B=TER.bh;if(!B||turn<5||(turn-5)%10!==0||i>32){live().forEach(u=>u.gwIn=false);return}
  if(i===1)L(`Turn ${turn}: the black hole in ${hexNo(B.c,B.r)} sends out a 100-point gravity wave. It spreads one hex an impulse and weakens as it goes (${GWF[1]} at 1 hex, ${GWF[10]} at 10, ${GWF[20]} at 20, ${GWF[32]} at 32).`+RL('P9.4, P9.41, P9.42'));
  str=GWF[i];inW=u=>dist(u,B)===i?gwRing(B,i,u):null}
 else{if(i===1&&turn>=3&&turn%3===0&&!GWL){GWL={dir:(turn/3)%2===1?1:-1,n:0,off:0,str:GWM==='l50'?50:20};L(`Turn ${turn}: a ${GWL.str}-point gravity wave enters from the ${GWL.dir>0?'west':'east'} edge and sweeps across the map, one column an impulse.`+RL('P9.1, P9.12, P9.2'))}
  if(!GWL){live().forEach(u=>u.gwIn=false);return}
  GWL.n++;const col=(GWL.dir>0?GWL.n:COLS+1-GWL.n)+GWL.off;if(GWL.dir>0?col>COLS:col<1){GWL=null;live().forEach(u=>u.gwIn=false);L(`Impulse ${i}: the gravity wave has crossed the map.`+RL('P9.2'));return}
  str=GWL.str;const dir=GWL.dir;inW=u=>u.c===col?{kind:'line',dir}:null}
 const hits=[];live().forEach(u=>{const g=inW(u);if(g){if(!u.gwIn){u.gwIn=true;hits.push([u,g])}}else u.gwIn=false});
 hits.forEach(([u,g])=>gwHit(u,str,g,i));if(hits.length)checkEnd()}
function gwIntro(){if(GWM==='off')return;L(GWM==='bh'?(TER.bh?`Gravity waves (P9.4): the black hole in ${hexNo(TER.bh.c,TER.bh.r)} sends out a 100-point ring every tenth turn, starting on turn 5. A unit it reaches takes the strength on the two shields facing the hole and is turned to face along the wave (a unit straight out from the hole takes it on three shields and is not turned).`+RL('P9.4, P9.41, P9.43'):'Gravity waves from a black hole were chosen, but this map has no black hole (S5.2 result 2), so there are none.'):`Gravity waves (P9.12): a ${GWM==='l50'?50:20}-point straight wave crosses the map every third turn starting on turn 3, east first and then west, one column an impulse. A unit it reaches takes the strength on the two shields facing the wave and is turned to face along it.`+RL('P9.0, P9.12, P9.3'))}

