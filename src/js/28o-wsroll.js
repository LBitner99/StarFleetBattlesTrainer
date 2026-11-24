/* [S4.2] Determining weapons status by die roll (optional: players "may roll"; the Duel fixes WS-II, SG1.2).
   One die per side, modified ship by ship (S4.22, S4.23), net modifier limited to +/-2, then WS-0 below 3, I on 3-4, II on 5-6, III on 7+ (S4.25).
   Only the free Duel is rolled: scripted scenarios set their own status (S4.34). Not built: the war-zone and scout-function modifiers (neither exists in the game); S4.32 free photon overloads at WS-III. */
let optWSRoll=false;
function wsRoll(){if(!optWSRoll||scr())return;
 [0,1].forEach(t=>{const g=sh.filter(x=>x.tm===t&&!x.d.base&&!x.neu);if(!g.length)return;const die=d6();
  const out=g.map(s=>{let m=cq(s)>0?1:cq(s)<0?-1:0;if(hasRole(s,'captain')||hasRole(s,'nav'))m++;if(isOri(s))m++;if(sensorRate(s)<6)m--;
   m=Math.max(-2,Math.min(2,m));const n=die+m,w=n<3?'0':n<=4?'I':n<=6?'II':'III';setWS(s,w);return`${s.tag} ${die}${m?(m>0?'+':'')+m:''} = WS-${w}`});
  L(`Weapons status roll (${t===0?'your side':'the opponent'}, die ${die}): ${out.join('; ')}.`+RL('S4.2, S4.21, S4.25'))})}
