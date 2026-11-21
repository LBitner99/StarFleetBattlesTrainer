/* ================= Local conditions & planets (S5.0 / P2.0) ================= */
// [S5.1] LC.mode: 'off' | 'roll' (2d6 on the chart each game) | 'choose' (the player picks). man = the manual picks.
let LC={mode:'off',man:{ast:false,plan:false,gas:false,gasR:3,rings:true,bh:false,neb:false,pul:false,mine:false,pir:false,eel:false},astSave:undefined,last:''},TER={plan:null,gas:null,bh:null,neb:false,pul:null},PUL={next:1,imp:null},TBLK=new Set(),RGH=new Set(),optQuietNeb=false;
const NEB=()=>!!TER.neb; // [P6.0] the whole map is inside a nebula
const LCN={2:'Black hole',3:'Nebula',4:'Planet and moon',5:'Wandering monster',6:'Asteroid belt',7:'Empty space',8:'Old minefield',9:'Pirate',10:'Gas giant',11:'Variable pulsar'};
const LCB=[2,3,4,5,6,7,8,9,10,11]; // the results this game can build: black hole, nebula, planet, moon, asteroid belt, empty space, gas giant
const lcOn=()=>LC.mode!=='off'&&!scn4&&!scn6; // [S5.31] a scenario with its own terrain (SG4, SG6) does not use the local conditions
// [S5.1, S5.2] Roll 2d6. A result this game cannot build yet is rolled again (the log says so). A 12 means two further results, with the S5.2 exclusions.
function lcRoll(){const notes=[],one=()=>{let n=0,x;do{x=d6()+d6();if(x===12)continue;if(!LCB.includes(x)&&x!==7){notes.push(`${x} (${LCN[x]}) is not built in this game, rolled again`)}else n=x}while(!n);return n};
 let a=d6()+d6(),res=[];if(a===12){notes.push('12: roll again, twice');res=[one(),one()]}else if(LCB.includes(a)||a===7)res=[a];else{notes.push(`${a} (${LCN[a]}) is not built in this game, rolled again`);res=[one()]}
 let s=new Set(res);if(s.has(2)&&s.size>1){s=new Set([2]);notes.push('S5.2: with a black hole the other result is ignored')}else if(s.has(11)&&s.size>1){s=new Set([11]);notes.push('S5.2: with a pulsar the other result is ignored')}if(s.has(4)&&s.has(10))s.delete(4);if(s.has(6)&&(s.has(4)||s.has(10)))s.delete(6); // [S5.2] 4+10 ignore 4; 6 with 4 or 10 ignore 6
 const set=[...s],gasR=Math.max(3,d6()); // [S5.2 #10] radius by one die, 1 or 2 counts as 3
 return{set,notes,man:{ast:s.has(6),plan:s.has(4),gas:s.has(10),gasR,rings:s.has(10)&&true,bh:s.has(2),neb:s.has(3),pul:s.has(11),mine:s.has(8),pir:s.has(9),eel:s.has(5),mon:s.has(5)?([d=>0,'crusher','amoeba','eel','cloud','eel','eel'][d6()]):undefined}}} // [S5.2 #5] monster die: 1 crusher (SM1.0), 2 amoeba, 3 eel, 4 cloud, 5-6 Advanced Missions monsters (the Eel is used, as the chart says)
// [P2.21, P2.22, P2.223] Build the blocked hexes and the ring hexes from the picks.
function terBuild(){TBLK=new Set();RGH=new Set();const near=(c0,r0,n,f)=>{for(let c=Math.max(1,c0-n);c<=Math.min(COLS,c0+n);c++)for(let r=Math.max(1,r0-n);r<=Math.min(ROWS,r0+n);r++)f(c,r,dist({c,r},{c:c0,r:r0}))};
 if(TER.plan)TBLK.add(TER.plan.c+','+TER.plan.r);
 if(TER.gas){const g=TER.gas;near(g.c,g.r,g.R+3,(c,r,d)=>{if(d<=g.R)TBLK.add(c+','+r);else if(g.rings&&d>=g.R+2&&d<=g.R+3)RGH.add(c+','+r)})}} // [P2.223] a one-hex gap, then rings two hexes wide
const terBlk=(c,r)=>TBLK.has(c+','+r),inRing=(c,r)=>RGH.has(c+','+r);
