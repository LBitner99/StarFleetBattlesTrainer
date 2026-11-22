/* ===== Game year (S3.1, Master Ship Chart "Year in Service", R-section refit dates) ===== */
// optYear: 0 = no limit (default), -1 = the scenario's own year, otherwise the year (for example 168 for Y168). A ship cannot be chosen before its year in service and a refit cannot be fitted before it was available. The computer's fixed scenario fleets are not changed; a warning is shown instead.
let optYear=0;
const SCYR={sh1:161,sh2:173,sh3:160,sh4:158,sh5:166}; // the year printed in each scenario's title
const SHIPYR={QFS:130,QFL:130,DD:130,SC:130,TUG:135,CL:120,CA:130,CC:143,BT:145,DN:148, // Master Ship Chart, Year in Service column (Basic Set, page 248)
 QKS:130,QKL:130,E4:121,F5:135,D6:122,D7:135,C8:167,C9:167, WB:140,K5R:160,WE:162,KR:160, QGS:130,QGL:130,GDD:120,GDF:175,GCL:121,GCA:121,
 KFF:122,EFF:168,KCL:122,KCS:125,CV:166,KBC:160,KCC:147, TPC:83,TPP:98, CR:127, FS:120,FL:120, SBF:140,SBK:140,SBZ:140,SBG:140,SBR:140,BATS:130,BS:120};
// refit first-available years by race, from the R-section refit rules (R2.R1 to R8.R6); a refit with no year listed here has no limit
const RFYR={fed:{car:160,plus:165,awr:170,y175:175,y165:165},kli:{b:165,k:169,uim1:165,uim2:165,y175:175},rom:{b:170,rear:171},kzi:{c10:166,c12:166,uim1:166,uim2:166,y175:175},gor:{plus:170,f:175},ori:{plus:169,cloak:155,oak:127},bas:{y170:170,y175:175}};
const effYear=()=>optYear===-1?(SCYR[scnX]||0):optYear;
const shipYr=k=>SHIPYR[k]||0;
const refitYr=(k,id)=>{const s=SHIPS[k];return s&&RFYR[s.side]&&RFYR[s.side][id]||0};
const yrOk=k=>{const y=effYear();return !y||shipYr(k)<=y};
const yrRfOk=(k,id)=>{const y=effYear();return !y||refitYr(k,id)<=y};
const yrTag=k=>shipYr(k)?`<span class="bp" title="Year in service (Master Ship Chart)">Y${shipYr(k)}</span> `:'';
function setYear(v){optYear=v;drawSel()}
function yearSel(){const ys=[120,130,140,150,160,165,168,170,175,180],y=effYear();
 return`<label class="om" title="S3.1: ships and refits that did not exist yet in the chosen year cannot be picked. 'No limit' allows everything. 'Scenario year' uses the year printed in the scenario (only some scenarios have one).">Game year <select onchange="setYear(+this.value)"><option value="0" ${optYear===0?'selected':''}>No limit</option><option value="-1" ${optYear===-1?'selected':''}>Scenario year${scnX&&SCYR[scnX]?' (Y'+SCYR[scnX]+')':' (none for this scenario)'}</option>${ys.map(v=>`<option value="${v}" ${optYear===v?'selected':''}>Y${v}</option>`).join('')}</select></label>${yrWarn()}`}
function yrWarn(){const y=effYear();if(!y)return'';const bad=[];[...ownList(),...enemyList()].forEach(x=>{if(!yrOk(x.k))bad.push(`${SHIPS[x.k].short} (Y${shipYr(x.k)})`);(x.rf||[]).forEach(id=>{if(!yrRfOk(x.k,id))bad.push(`${SHIPS[x.k].short} ${id} refit (Y${refitYr(x.k,id)})`)})});
 return bad.length?`<span class="mu" style="color:var(--rd,#ff4a3a)"> Not yet in service in Y${y}: ${bad.join(', ')}</span>`:''}
