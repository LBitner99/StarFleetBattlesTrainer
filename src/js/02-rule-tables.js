/* ================= rules data ================= */
const P1={b:[0,1,2,3,4,5,6,9,16,26,51],d:[[9,8,7,6,5,5,4,3,2,1,1],[8,7,6,5,5,4,3,2,1,1,0],[7,5,5,4,4,4,3,1,0,0,0],[6,4,4,4,4,3,2,0,0,0,0],[5,4,4,4,3,3,1,0,0,0,0],[4,4,3,3,2,2,0,0,0,0,0]],max:75};
const P2={b:[0,1,2,3,4,9,16,31],d:[[6,5,5,4,3,2,1,1],[6,5,4,4,2,1,1,0],[6,4,4,4,1,1,0,0],[5,4,4,3,1,0,0,0],[5,4,3,3,0,0,0,0],[5,3,3,3,0,0,0,0]],max:50};
const P3={b:[0,1,2,3,4,9],d:[[4,4,4,3,1,1],[4,4,4,2,1,0],[4,4,4,1,0,0],[4,4,3,0,0,0],[4,3,2,0,0,0],[3,3,1,0,0,0]],max:15,cp:.5};
const DIS={b:[0,1,2,3,5,9,16,23,31],h:[0,5,5,4,4,4,3,2,2],dm:[0,5,4,4,3,3,2,2,1],max:30};
const PHO={b:[0,2,3,5,9,13],h:[0,5,4,3,2,1],dm:8,max:30};
// [H7.54] Spend battery power; reserve warp is used last because it is the part held for movement.
const spendBat=(s,n)=>{const bi=s.bi||0,o=Math.max(0,s.bat-s.bw-bi),f=Math.min(n,o),r=Math.max(0,n-f),ri=Math.min(r,bi);s.bi=bi-ri;s.bw-=Math.max(0,r-ri);s.bat-=n}; // [H7.4, H7.47] ordinary charge goes first, then reserve impulse (non-warp), then reserve warp (the most flexible)
const OVD={b:[0,1,2,3,5],h:[6,5,5,4,4],dm:[10,10,8,8,6]},FB=[];
const PLA={R:{c:[2,2,5],h:null,t:[50,50,35,35,35,25,25,25,20,20,20,10,5,1]},S:{c:[2,2,4],h:2,t:[30,30,22,22,22,15,15,15,10,5,1,0,0,0]},G:{c:[2,2,3],h:1,t:[20,20,15,15,15,10,5,1,0,0,0,0,0,0]},F:{c:[1,1,3],h:0,t:[20,15,10,5,1,0,0,0,0,0,0,0,0,0]}};
const PCOL=n=>n<=5?0:n<=10?1:n<=12?2:n<=14?3:n===15?4:n<=18?5:n===19?6:n===20?7:n<=23?8:n===24?9:n===25?10:n<=28?11:n===29?12:13;
// [FP1.5, FP1.51, FP1.52] Plasma warhead strength by distance travelled (type table), doubled by enveloping.
// [FP1.13, FP1.131, FP2.41, FP1.9] Plasma launchers can arm a smaller torpedo (option optPF); t.A is the type being armed when it differs from the launcher's type.
const PRK={F:1,G:2,S:3,R:4},plEff=t=>t.A||t.T,plHoldC=t=>{const e=plEff(t);return e==='F'&&t.T!=='F'?1:PLA[e].h}; // an F armed in a larger launcher costs 1 to hold (FP2.41)
function plDL(t,p,i){const e0=plEff(t),dl=optPF&&(p.pl||[])[i]==='arm'&&(p.pd||[])[i];if(!dl||dl===e0)return e0;if(t.st===0&&PRK[dl]<=PRK[t.T])return dl;if(t.st===2&&dl!=='F'&&e0!=='F'&&PRK[dl]<=PRK[e0])return dl;return e0} // F only from scratch; a launcher with two turns of 2+2 can finish as any non-F type up to its own
const plBase=d=>{const t=Math.max(0,d.trav+(d.own?(cq(d.own)<0?3:cq(d.own)>0?-3:0):0)); // [G21.114, G21.214] poor crews add three to the range, outstanding crews take three off
 return t>30?0:(d.ept?2:1)*PLA[d.T].t[PCOL(t)]};
// [FP1.611] Plasma strength left after phaser damage (each two damage points remove one).
const plStr=d=>Math.max(0,Math.ceil(plBase(d)-(d.dmg||0)/2-1e-9));
const colOf=(T,r)=>{let i=0;T.b.forEach((v,j)=>{if(r>=v)i=j});return i};
const DAC={2:['Bridge*','Flag Bridge*','Sensor*','Damage Control*','A Hull*','Left W En','Trans','Tractor','Shuttle','Lab','F Hull','Right W En'],3:['Drone*','Phaser*','Impulse','Left W En','Right W En','A Hull','Shuttle','Damage Control*','Center W En','Lab','Battery','Phaser'],4:['Phaser*','Trans*','Right W En','Impulse','F Hull','A Hull','Left W En','APR','Lab','Trans','Probe','Center W En'],5:['Right W En*','A Hull','Cargo','Battery','Shuttle','Torp*','Left W En','Impulse','Right W En','Tractor','Probe','Any Weapon'],6:['F Hull','Impulse','Lab','Left W En','Sensor*','Tractor','Shuttle','Right W En','Phaser','Trans','Battery','Any Weapon'],7:['Cargo','F Hull','Battery','Center W En','Shuttle','APR','Lab','Phaser','Any W En','Probe','A Hull','Any Weapon'],8:['A Hull','APR','Shuttle','Right W En','Scanner*','Tractor','Lab','Left W En','Phaser','Trans','Battery','Any Weapon'],9:['Left W En*','F Hull','Cargo','Battery','Lab','Drone*','Right W En','Impulse','Left W En','Tractor','Probe','Any Weapon'],10:['Phaser*','Tractor*','Left W En','Impulse','A Hull','F Hull','Right W En','APR','Lab','Trans','Probe','Center W En'],11:['Torp*','Phaser*','Impulse','Right W En','Left W En','F Hull','Tractor','Damage Control*','Center W En','Lab','Battery','Phaser'],12:['Aux Control*','Emer Bridge*','Scanner*','Probe*','F Hull*','Right W En','Trans','Shuttle','Tractor','Lab','A Hull','Left W En']};
const TM={A:[[2,6],[7,12],[13,19],[20,26],[27]],B:[[2,5],[6,10],[11,15],[16,21],[22,28],[29]],C:[[2,4],[5,9],[10,14],[15,20],[21,27],[28]],D:[[2,4],[5,8],[9,12],[13,17],[18,24],[25]],E:[[2,3],[4,6],[7,10],[11,14],[15,20],[21,29],[30]]};
// [C3.1, C3.4] Turn mode: hexes that must be moved straight between turns, from the ship category chart and speed.
const tmFor=(cat,s)=>{if(s<=1)return 0;let t=0;TM[cat].forEach((x,i)=>{if(s>=x[0])t=i+1});return t};
const IMPCHART=null;
// [C1.2, C1.3] Impulse chart: a unit moving at speed s moves on impulse i when floor(s*i/32) rises.
const moves=(s,i)=>Math.floor(s*i/32)>Math.floor(s*(i-1)/32);
const d6=()=>1+Math.floor(Math.random()*6);
