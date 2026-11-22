// [S3.2] Commander's Option Items - bought with up to 20% of the ship's Effective Adjusted Combat BPV (S3.211). Only when the option is on.
// Built: extra boarding parties (0.5 each, up to 10), extra type-I drones (1.0 each, needs a drone rack, S3.212), extra ADD rounds (0.25 each, needs an ADD).
// Purchases are stored as pseudo refit ids 'co:bp:N', 'co:dr:N', 'co:ad:N' in the ship's refit list. The computer buys nothing.
const COITEMS=[{k:'bp',n:'Extra boarding parties',c:0.5,max:10,t:'Annex #6: 0.5 BPV each, up to 10. They add to the crew and can be used for boarding actions (D7, G8) when boarding is on.'},{k:'dr',n:'Extra type-I drones',c:1.0,max:12,t:'Annex #6: 1.0 BPV each. Needs a drone rack to begin with (S3.212); the drones are carried as rack reloads.'},{k:'ad',n:'Extra ADD rounds',c:0.25,max:12,t:'Annex #6: 0.25 BPV per extra anti-drone round. Needs an ADD launcher.'}];
let optCO=false;
const isCO=i=>/^co:/.test(i);
function coGet(ids){const c={bp:0,dr:0,ad:0};(ids||[]).forEach(i=>{const m=/^co:(bp|dr|ad):(\d+)$/.exec(i);if(m)c[m[1]]=+m[2]});return c}
const coCost=c=>c.bp*0.5+c.dr*1.0+c.ad*0.25;
function coAvail(key,k){const b=DEFS[key];if(k==='dr')return(b.sys.Drone||0)>0&&!(b.gad);if(k==='ad')return(b.sys.Add||0)>0;return !b.sb&&!b.fighter}
const _rdCO=refitDef;
refitDef=function(key,ids){const d=_rdCO(key,ids);if(!optCO||!(ids||[]).some(isCO))return d;const c=coGet(ids);d.coC={...c};d.coPv=coCost(c);d.pv+=d.coPv;return d};
const _mkCO=mkShip;
mkShip=function(key,c,r,f,col,tag,rf){const s=_mkCO(key,c,r,f,col,tag,rf);const o=s.d.coC;if(!o)return s;
 s.bp+=o.bp; // [S3.2] extra boarding parties are extra crew units on top of the standard crew
 for(let i=0;i<o.dr&&s.rk.length;i++)s.rk[i%s.rk.length].ammo++; // extra drones are carried as rack reloads
 for(let i=0;i<o.ad&&s.ad.length;i++)s.ad[i%s.ad.length].ammo++;
 return s};
function coBase(key,ids){return _rdCO(key,(ids||[]).filter(i=>!isCO(i))).pv}
function coStep(who,k,dl){const t=curTab(who),key=slotK(who,t),ids=slotRf(who,t),c=coGet(ids),it=COITEMS.find(x=>x.k===k),lim=0.2*coBase(key,ids);
 let n=c[k]+dl;if(n<0||n>it.max||(dl>0&&!coAvail(key,k)))return;const nc={...c,[k]:n};if(coCost(nc)>lim+1e-9)return;
 const rest=ids.filter(i=>!isCO(i));['bp','dr','ad'].forEach(x=>{if(nc[x])rest.push('co:'+x+':'+nc[x])});setSlot(who,t,key,rest);drawSel()}
function coUI(who){if(!optCO||who!==0)return'';const t=curTab(who),key=slotK(who,t),ids=slotRf(who,t),c=coGet(ids),lim=0.2*coBase(key,ids),used=coCost(c);
 return`<div class="rfs" title="S3.211: no more than 20% of the ship's Effective Adjusted Combat BPV. The cost counts as BPV for victory points (SG1.431)."><small><b>Commander's options (S3.2)</b> - spent ${used} of ${lim.toFixed(1)} BPV</small>`+COITEMS.filter(it=>coAvail(key,it.k)).map(it=>`<label class="rf" title="${it.t}"><button class="lc-b" onclick="coStep(${who},'${it.k}',-1)">-</button> <b>${c[it.k]}</b> <button class="lc-b" onclick="coStep(${who},'${it.k}',1)">+</button> ${it.n} <span class="bp">${it.c} BPV each</span></label>`).join('')+'</div>'}
