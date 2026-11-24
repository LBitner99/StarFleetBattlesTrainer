/* [S2.27, S2.274] Stalemate. If, over ten consecutive turns, no ship has taken internal damage or crew casualties (and no manned shuttle was destroyed), a stalemate exists: the scenario is over and neither player loses.
   Internal damage is tracked as a new low in each ship's undamaged boxes plus crew units and boarding parties; repairs do not count as progress. Mine damage counts, terrain does not (terrain damage is mostly shield and hull in this game).
   Simplification: Case 2 (a runner deemed to have disengaged, S2.272) and Case 3 (a fixed target, S2.273) are also scored as a stalemate. */
let stalT=0;
const stalMeasure=s=>Object.values(s.sys||{}).reduce((a,v)=>a+(typeof v==='number'?v:0),0)+(s.gc||0)+(s.bp||0);
function stalEnd(){if(over||scr())return;let ev=false;sh.forEach(s=>{if(s.neu||(s.d&&s.d.base&&!s.tm))return;const m=stalMeasure(s)+(s.out?-1:0);if(s.stalLow===undefined||m<s.stalLow){if(s.stalLow!==undefined)ev=true;s.stalLow=m}});
 if(turn<=1||ev||sh.some(s=>s.tm===0&&s.out&&!s.neu)){stalT=turn;return}
 if(turn-stalT>=10){over={win:false,text:`Stalemate: no internal damage or crew casualties in ten consecutive turns. The scenario is over and neither player loses.`};L(over.text+RL('S2.27, S2.274'))}}
