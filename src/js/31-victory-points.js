/* ================= S2 victory points and levels of victory ================= */
const LEVELS=[[500,'Astounding victory'],[300,'Decisive victory'],[200,'Substantive victory'],[150,'Tactical victory'],[110,'Marginal victory'],[91,'Draw'],[67,'Marginal defeat'],[50,'Tactical defeat'],[33,'Brutal defeat'],[20,'Crushing defeat'],[0,'Devastating defeat']];
const rnd5=x=>Math.floor(x+.5);
// [S2.3] Level of victory from the point ratio.
function levelOf(a,b){const p=Math.max(1,a)/Math.max(1,b)*100;return LEVELS.find(l=>p>=l[0])[1]}
// [S2.22, S2.24] Score category of a ship: captured, destroyed, crippled, forced to disengage.
function sCat(s){if(s.captured)return[100,'captured'];if(s.boom||s.exitDead)return[100,s.exitDead?'destroyed (left by an unauthorized edge, SG1.41)':'destroyed'];let b=[0,'no internal damage'];if(s.intTot>0)b=[10,'internal damage scored'];
 if(s.fled)b=[25,s.conc?'conceded (scored as a forced disengagement, the nearest rule)':'forced to disengage'];const c=cripWhy(s);if(c.length)b=[50,'crippled ('+c.join('; ')+')'];return b}
// [S2.2, S2.3] Score the battle by BPV and levels of victory.
function scoreMatch(){const A=sh[0],AI=sh.filter(x=>x.tm===1),OWN=sh.filter(x=>x.tm===0),pa=OWN.reduce((t,s)=>t+s.d.pv,0),pb=AI.reduce((t,s)=>t+s.d.pv,0),rows=[];let sa=0,sb=0; // [S2.2] with computer allies your side is you and them
 const loA=pa<pb,loB=pb<pa,d=Math.abs(pa-pb),ok=loA?!OWN.every(s=>s.fled&&s.fled<=2):loB?!AI.every(s=>s.fled&&s.fled<=2):true;
 if(loA||loB){rows.push({who:loA?0:1,pts:ok?d:0,t:ok?`BPV difference: ${Math.max(pa,pb)} against ${Math.min(pa,pb)} gives ${loA?'you':'the enemy'} (the smaller side) ${d} points`:`BPV difference of ${d} points lost: the smaller side left by the end of turn 2`,rc:'S2.20 A'});if(ok){if(loA)sa+=d;else sb+=d}}
 else rows.push({who:-1,pts:0,t:`Equal BPV (${pa}): no starting difference`,rc:'S2.20 A'});
 AI.forEach(foe=>{const[c,why]=sCat(foe),sur=PIR&&foe===PIR.s&&PIR.sur===0,p=sur?43:rnd5(foe.d.pv*c/100);rows.push({who:0,pts:p,t:sur?`You score 43 for crippling the pirate cruiser with a surprise blow (fixed figure of S5.2 #9)`:`You score ${p} for the ${foe.tag}: ${why} (${c}% of ${foe.d.pv})`,rc:sur?'S5.2':'S2.21'});sa+=p});
 if(scn4){const v=10*c4.nL+5*c4.nS-c4Pen();rows.push({who:1,pts:v,t:`The convoy player receives ${v} points for the convoy (10 per large and 5 per small freighter${c4Pen()?`, less ${c4Pen()} for the ${c4.esc&&c4Q()?'escort and the Q-ship':c4Q()?'Q-ship':'escort'}`:''})`,rc:'SG4.5'});sb+=v}
 OWN.forEach(A=>{const[c,why]=sCat(A),sur=PIR&&A===PIR.s&&PIR.sur===1,p=sur?43:rnd5(A.d.pv*c/100);rows.push({who:1,pts:p,t:sur?`The enemy score 43 for crippling the pirate cruiser with a surprise blow (fixed figure of S5.2 #9)`:`The enemy score ${p} for the ${A.tag}: ${why} (${c}% of ${A.d.pv})`,rc:sur?'S5.2':'S2.21'});sb+=p})
 return{a:sa,b:sb,rows,lv:levelOf(sa,sb),lvB:levelOf(sb,sa),pct:Math.round(Math.max(1,sa)/Math.max(1,sb)*100)}}
function scoreHtml(sc){if(!sc)return'';return`<p style="margin:4px 0"><b>Victory points (S2.2): you ${sc.a}, enemy ${sc.b}. ${sc.lv} (${sc.pct}%).</b></p><ul style="margin:4px 0 8px 18px;padding:0">${sc.rows.map(r=>`<li>${r.t}.</li>`).join('')}</ul>`}

