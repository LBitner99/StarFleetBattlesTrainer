/* [F4.0] Ballistic targeting (standard rule). A drone or plasma torpedo can be launched at an empty hex instead of a unit.
   [F4.11] It steers for that hex by the most direct route and, once in it (or after its second hex next to it), evades it on a course directly away.
   [F4.12] It is out of control at once and never counts against the launcher's control limit. [F4.13] One hex only. [F4.14] Same 35-hex range.
   [F4.21] It never explodes: only the minefield, asteroid and defensive fire effects of its flight apply, so it can detect mines, clear a path or draw fire.
   Not built: ballistic attacks on planet targets (F4.22), scatter-packs (F4.4), dragged off course (F4.5), type-IIIXX drones (F4.3); the computer never launches ballistic weapons. */
let balIn='';
const balHexOf=v=>{const m=String(v||'').trim().match(/^(\d\d)(\d\d)$/);if(!m)return null;const c=+m[1],r=+m[2];return c>=1&&c<=COLS&&r>=1&&r<=ROWS?{c,r}:null};
function balWhy(s){const h=balHexOf(balIn);if(!h)return'Type a hex number such as 2210 first (F4.11)';if(h.c===s.c&&h.r===s.r)return'That is the launching unit\'s own hex';if(dist(s,h)>35)return'Hex beyond 35 hexes (F4.14)';return''}
function balMake(d,h){d.bal={c:h.c,r:h.r,adj:0,ev:false};d.tgt={c:h.c,r:h.r,tag:'hex '+hexNo(h.c,h.r),hexT:true,path:[],tm:-1,d:{},sys:{},out:false};if(d.pl)d.free=true}
function balLaunch(k,pl){const s=sh[0],w=balWhy(s);if(w)return;const h=balHexOf(balIn),i=imp+1;
 if(pl){if(plWhy(s,i,s.pl[k]))return;launchPl(s,k,i)}else{if(launchWhy(s,k,i))return;launch(s,k,i)}
 const d=DR.filter(x=>x.own===s&&x.born===absI(i)).pop();if(!d)return;balMake(d,h);
 L(`  ${d.pl?'Plasma torpedo':'Drone'} #${d.id} was set on a ballistic course for hex ${hexNo(h.c,h.r)}, not at a unit: it needs no control channel, will evade the hex and will not explode.`+RL('F4.0, F4.11, F4.12, F4.13, F4.21'));draw()}
// [F4.11] Evasion starts when the weapon is in the hex or in its second hex next to it.
function balStep(d){const b=d.bal;if(!b||b.ev)return;if(d.c===b.c&&d.r===b.r)b.ev=true;else if(dist(d,b)<=1&&++b.adj>=2)b.ev=true}
const balUI=(me,i)=>`<span class="mu" style="margin-left:6px">Ballistic (F4): hex <input size="5" maxlength="4" value="${balIn}" oninput="balIn=this.value" onchange="draw()" style="width:56px"> ${(()=>{const w=balWhy(me);return `<span title="${w}">${w?'('+w+')':''}</span>`})()}</span>`;
