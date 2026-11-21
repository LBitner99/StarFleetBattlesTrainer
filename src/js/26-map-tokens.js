function token(s){if(s.neu==='eel')return eelToken(s);const x=cx(s.c),y=cy(s.c,s.r),col=s.col,S=SIL[s.key],h0=32,w0=h0*S.w/S.h,kf=Math.min(1,38/Math.max(w0,h0)),h=h0*kf,w=w0*kf,id='mk'+sh.indexOf(s);
 return`<g transform="translate(${x} ${y})" opacity="${ckOn(s)?(s.ck.mode==='on'?.4:.65):1}"><circle r="21" fill="var(--card)" fill-opacity=".88" stroke="${col}" stroke-width="2"/><g transform="rotate(${60*s.f})"><mask id="${id}" maskUnits="userSpaceOnUse" x="-30" y="-30" width="60" height="60"><image href="${S.u}" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}"/></mask><rect x="-30" y="-30" width="60" height="60" fill="${col}" mask="url(#${id})"/></g></g><text x="${x}" y="${y+34}" font-size="12" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="3" paint-order="stroke">${s.tag}${ckOn(s)?' (cloak)':''}</text>`}
const pol=(r,a)=>{const t=a*Math.PI/180;return[(r*Math.sin(t)).toFixed(1),(-r*Math.cos(t)).toFixed(1)]};
function ringsSvg(s,foe,showNums){ // shield status around a ship: green, yellow, red, grey when down (D3.1, D3.21)
 if(!optRings)return'';const x=cx(s.c),y=cy(s.c,s.r),facing=shieldFor(s,foe).k;let g='';
 for(let k=0;k<6;k++){const mx=s.d.shields[k],cur=s.sh[k],fr=mx>0?cur/mx:0,a0=k*60-28,a1=k*60+28,r1=24,r2=30;
  const col=cur<=0?'#555':fr>=.67?'#2e9e4f':fr>=.34?'#e0a400':'#d23b3b';
  const p=(r,a)=>pol(r,a).join(' ');
  const d=`M${p(r1,a0)} A${r1} ${r1} 0 0 1 ${p(r1,a1)} L${p(r2,a1)} A${r2} ${r2} 0 0 0 ${p(r2,a0)} Z`;
  g+=`<path d="${d}" fill="${col}" fill-opacity="${cur<=0?.35:.92}" stroke="${k===facing?'var(--tx)':'var(--card)'}" stroke-width="${k===facing?2.2:.8}"/>`;
  if(showNums){const q=pol(36,k*60);g+=`<text x="${q[0]}" y="${(+q[1]+3).toFixed(1)}" font-size="9" font-weight="700" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="2.5" paint-order="stroke" transform="rotate(${-60*s.f} ${q[0]} ${q[1]})">${k+1}</text>`}}
 return`<g transform="translate(${x} ${y}) rotate(${60*s.f})"${s.shOn===0?' opacity=".5"':''}>${g}</g>`}
function setPrev(kind,d){prevArr=kind?{kind,d}:null;if(started&&!over&&optPrev)drawMap()}
function prevSvg(){if(!optPrev||!prevArr||over)return'';const me=sh[0],foe=TG(),x=cx(me.c),y=cy(me.c,me.r),pa=prevArr;
 let nf=me.f,txt='',dirF=me.f,col='var(--tx)';
 if(pa.kind==='turn'){nf=(me.f+pa.d+6)%6;dirF=nf;txt=`${pa.d<0?'Turn left':'Turn right'}: new facing ${FL[nf]}`}
 else if(pa.kind==='slip'){dirF=(me.f+Math.sign(pa.d)+6)%6;txt=`Sideslip ${pa.d<0?'left':'right'}: keeps facing ${FL[me.f]}`}
 else if(pa.kind==='face'){nf=pa.d;dirF=nf;txt=`Turn to facing ${FL[nf]}`}
 else txt=`Straight ahead (facing ${FL[me.f]})`;
 const old=me.f;me.f=nf;const k=shieldFor(me,foe).k;me.f=old;
 const lab=`${txt}. Your shield #${k+1} would face the enemy.`;
 const a=60*dirF,tip=pol(64,a),b0=pol(24,a),h1=pol(52,a-9),h2=pol(52,a+9);
 const cur=60*me.f,ctip=pol(50,cur),cb=pol(24,cur);
 return`<g transform="translate(${x} ${y})" pointer-events="none"><line x1="${cb[0]}" y1="${cb[1]}" x2="${ctip[0]}" y2="${ctip[1]}" stroke="var(--mu)" stroke-width="3" stroke-dasharray="4 4" stroke-opacity=".8"/><line x1="${b0[0]}" y1="${b0[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"/><polygon points="${tip[0]},${tip[1]} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]}" fill="${col}"/></g><text x="${x}" y="${y-48}" font-size="12" font-weight="700" text-anchor="middle" fill="var(--tx)" stroke="var(--bg)" stroke-width="4" paint-order="stroke" pointer-events="none">${lab}</text>`}
function drawMap(){const a=sh[0],b=TG(),dsh=(sh[0].col);
 const lines=sh.filter(s=>!ckHid(s)).map(s=>`<polyline points="${s.path.map(p=>cx(p[0])+','+cy(p[0],p[1])).join(' ')}" fill="none" stroke="${s.col}" stroke-width="2" stroke-opacity=".35"/>`).join('');
 const mx=(cx(a.c)+cx(b.c))/2,my=(cy(a.c,a.r)+cy(b.c,b.r))/2;
 const rl=ckHid(b)?'':`<line x1="${cx(a.c)}" y1="${cy(a.c,a.r)}" x2="${cx(b.c)}" y2="${cy(b.c,b.r)}" stroke="var(--mu)" stroke-dasharray="6 6" stroke-opacity=".6"/><text x="${mx}" y="${my-6}" font-size="14" font-weight="700" text-anchor="middle" fill="var(--tx)" stroke="var(--bg)" stroke-width="4" paint-order="stroke">range ${dist(a,b)}</text>`;
 const showFoe=openInfo||over;
 $('#dyn').innerHTML=astSvg()+terSvg()+nzSvg()+webSvg()+lines+rl+sh.filter(s=>!ckHid(s)).map(token).join('')+(ckHid(TG())?'':ringsSvg(sh[0],TG(),true))+(showFoe?sh.slice(1).filter(x=>!x.out&&!ckHid(x)).map(x=>ringsSvg(x,sh[0],true)).join(''):'')+drSvg()+metSvg()+prevSvg()}

