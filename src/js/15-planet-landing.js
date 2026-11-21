/* ===== Planet landing and atmospheric flight (option optLand; P2.4, P2.5, P2.8) =====
   Only the one-hex class-M planet (S5.2 result 4) can be landed on. A human ship that enters its hex at speed 1 or less is in the atmosphere (state 'A', P2.411 steps 1-2);
   from there each turn it flies (P2.80), descends and lands on impulse 32 (P2.4113), or leaves by normal movement (P2.4123). A landed ship (state 'L') stays or takes off (P2.412).
   Hex sides, two-layer atmospheres, bases and shuttles are not modelled. Annex #7B (which ships have which landing system) is not in the rulebook text: Orion ships get the aerodynamic and gravity landing systems the book's own example gives them (P2.51 landing example), every other ship that uses the gravity system is wrecked (P2.4324). */
const mHexOK=(c,r)=>!!(TER.moon&&TER.moon.c===c&&TER.moon.r===r),onMoon=s=>!!(s.pst&&TER.moon&&s.c===TER.moon.c&&s.r===TER.moon.r); // [P2.421] the small moon is an airless planet: the landing rules apply without the climbing and descending turn and without any atmosphere
const pHexOK=(c,r)=>!!(TER.plan&&!TER.gas&&TER.plan.c===c&&TER.plan.r===r),isOri=s=>!!(s.d&&s.d.side==='ori'),defAct=s=>s.pst==='L'?'stay':s.clb?'climb':'fly';
function pActs(s){if(!optLand||!s.pst)return[];const A=[],o=isOri(s);
 if(s.pst==='L'){A.push(['stay','Stay landed (P2.451)'],['takeoff','Take off: 1 hex of movement power, leaves the surface on impulse 32 (P2.4121)']);return A}
 if(s.clb){A.push(['climb','Climb to flight level: 1 hex of movement power (P2.4122)']);return A}
 A.push(['fly','Atmospheric flight: 1 hex of movement power; may turn to any facing on impulse 32 (P2.80, P2.863)']);
 if(o&&!onMoon(s))A.push(['desc-aero','Descend by aerodynamic landing: no power, lands on impulse 32 (P2.433)']);
 if(o&&onMoon(s))A.push(['desc-pow','Powered landing: 1 hex of movement power, lands on impulse 32, works without an atmosphere (P2.434, P2.4342)']);
 if((s.sys.Tractor||0)>0)A.push(['desc-grav',`Descend with the gravity landing system: tractor power for five hexes of movement (${Math.round(5*s.d.mc*100)/100})${o?'':'; this ship is not built for it and would be wrecked (P2.4324)'} (P2.432)`]);
 A.push(['leave','Leave by normal movement in the direction the ship faces; the first hex must be open space (P2.4123)'],['desc-crash','Descend with no landing system: a crash landing (P2.431)']);return A}
function planPlot(s,p,e){if(!optLand||!s.pst)return 0;const A=pActs(s);if(!A.some(a=>a[0]===p.pact))p.pact=defAct(s);const a=p.pact;
 if(a==='fly'||a==='climb'||a==='takeoff'||a==='desc-pow')p.spd=1;else if(a!=='leave')p.spd=0;else if(p.spd<1)e.push('Leaving the atmosphere needs a speed of at least 1 (P2.4123)');
 p.stac=0;p.tac=0;p.het=0;p.em=0;return a==='desc-grav'?5*s.d.mc:0} // [P2.4322] gravity landing: power equal to five hexes of movement, applied to a tractor
function planEcm(s,f){if(!optLand||!(s.pst||f.pst))return 0;const at=(s.pst&&!onMoon(s))||(f.pst&&!onMoon(f));return(at?1:0)+(f.pst==='L'?2:0)+(s.pst==='L'?2:0)} // [P2.51, P2.52, P2.53] one point of ECM for the atmosphere hex, two for the ground clutter of a landed target or firer
const atmN=(s,f)=>((s.pst&&!onMoon(s))||(f.pst&&!onMoon(f)))?1:0; // [P2.54, P2.541] a phaser shot into or out of the atmosphere adds one to the die roll
function plCrashDie(s,txt,safe){const n=Math.max(1,Math.round(s.d.cr||s.gc0||4)),lim=Math.max(0,Math.min(6,(isOri(s)?5:3)+(cq(s)>0?1:cq(s)<0?-1:0))); // [P2.4313, G21.128, G21.228]
 let k=0;const lg=hasRole(s,'nav')?1:0;for(let j=0;j<n;j++)if(Math.floor(Math.random()*6)+1-lg<=lim)k++; // [G22.85] a legendary navigator shifts each crew unit's die roll by one in the favourable direction
 return safe?`${txt} The crew gets down safely.`:`${txt} ${k} of ${n} crew units survive on the planet (die roll 1-${lim} each, P2.4311).`}
function planetEnd(){if(!optLand)return;sh.forEach(s=>{if(!s.pst||s.out||s.boom||!s.pact)return;const a=s.pact,pf=s.plan&&s.plan.pface;
 if(a==='fly'||a==='climb'){if(a==='climb'){s.clb=0;L(`Impulse 32: ${s.tag} finishes climbing to the atmospheric flight level.`+RL('P2.4122'))}else{if(pf!==undefined&&pf!==null&&pf!==s.f){s.f=pf;L(`Impulse 32: ${s.tag} turns to face ${FL[s.f]} in atmospheric flight.`+RL('P2.80, P2.863'))}}}
 else if(a==='takeoff'){s.pst='A';const mo=onMoon(s);s.clb=mo?0:1;L(`Impulse 32: ${s.tag} lifts off the surface and ${mo?'hovers over the moon in '+hexNo(s.c,s.r)+' (no climbing turn without an atmosphere, P2.421)':'hovers in the atmosphere of '+hexNo(s.c,s.r)}.`+RL(mo?'P2.4121, P2.421':'P2.4121'))}
 else if(a==='desc-aero'||a==='desc-pow'||(a==='desc-grav'&&isOri(s))){s.pst='L';L(`Impulse 32: ${s.tag} lands safely on the ${onMoon(s)?'moon':'planet'} in ${hexNo(s.c,s.r)} (${a==='desc-aero'?'aerodynamic landing, no power':a==='desc-pow'?'powered landing':'gravity landing system'}). It cannot move until it takes off, and fire at it gets two points of ground clutter ECM${onMoon(s)?'':' plus the atmosphere'}.`+RL(a==='desc-aero'?'P2.433, P2.4113, P2.45, P2.52':a==='desc-pow'?'P2.434, P2.4341, P2.421, P2.45, P2.52':'P2.432, P2.4321, P2.45, P2.52'))}
 else if(a==='desc-grav'){s.boom=true;s.exploded=true;s.killTxt=`${s.n} lowers itself to the planet with its tractors, but it is not designed to land and is wrecked.`;L(`Impulse 32: ${s.tag} uses the gravity landing system though it is not designed to land: ${plCrashDie(s,'The ship is wrecked (no explosion).',true)}`+RL('P2.4324, P2.4321'));checkEnd()}
 else if(a==='desc-crash'){s.boom=true;s.exploded=true;s.killTxt=`${s.n} descends with no landing system and crashes.`;L(`Impulse 32: ${s.tag} descends with no landing system and crashes. ${plCrashDie(s,'The ship is wrecked (no explosion).',false)}`+RL('P2.431, P2.4311, P2.4312'));checkEnd()}
 })}
