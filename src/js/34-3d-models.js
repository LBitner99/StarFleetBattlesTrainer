/* ================= 3D reference models: own small software renderer, no libraries ================= */
const V3={cache:{},run:false,st:{}};
const v3h=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function Mesh(){this.f=[]}
Mesh.prototype.poly=function(vs,col,c,em){let nx=0,ny=0,nz=0,fx=0,fy=0,fz=0;
 for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];nx+=(a[1]-b[1])*(a[2]+b[2]);ny+=(a[2]-b[2])*(a[0]+b[0]);nz+=(a[0]-b[0])*(a[1]+b[1]);fx+=a[0];fy+=a[1];fz+=a[2]}
 const l=Math.hypot(nx,ny,nz);if(l<1e-9)return;let n=[nx/l,ny/l,nz/l];fx/=vs.length;fy/=vs.length;fz/=vs.length;
 if(c&&n[0]*(fx-c[0])+n[1]*(fy-c[1])+n[2]*(fz-c[2])<0){n=[-n[0],-n[1],-n[2]];vs=vs.slice().reverse()}
 this.f.push({v:vs,n:n,c:v3h(col),e:!!em})};
Mesh.prototype.disc=function(cx,R,pr,top,bot,N){N=N||40;const c=[cx,0,0],P=(r,z,k)=>{const t=k/N*Math.PI*2;return[cx+R*r*Math.cos(t),R*r*Math.sin(t),z]}; // [S-FED] smooth lens-shaped saucer: pr=[radius fraction, top z, bottom z] from centre out; no stepped layers, so no coplanar faces to clip
 for(let i=0;i<pr.length-1;i++)for(let k=0;k<N;k++){this.poly([P(pr[i][0],pr[i][1],k),P(pr[i+1][0],pr[i+1][1],k),P(pr[i+1][0],pr[i+1][1],k+1),P(pr[i][0],pr[i][1],k+1)],top,c);this.poly([P(pr[i][0],pr[i][2],k),P(pr[i+1][0],pr[i+1][2],k),P(pr[i+1][0],pr[i+1][2],k+1),P(pr[i][0],pr[i][2],k+1)],bot,c)}
 const e=pr[pr.length-1];for(let k=0;k<N;k++)this.poly([P(e[0],e[1],k),P(e[0],e[1],k+1),P(e[0],e[2],k+1),P(e[0],e[2],k)],top,c)};
Mesh.prototype.ell=function(c,r,col,em,nu,nv){nu=nu||14;nv=nv||9;const P=(i,j)=>{const u=i/nu*Math.PI*2,v=j/nv*Math.PI;return[c[0]+r[0]*Math.cos(v),c[1]+r[1]*Math.sin(v)*Math.cos(u),c[2]+r[2]*Math.sin(v)*Math.sin(u)]};
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const q=[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)];this.poly(j===0?[q[0],q[2],q[3]]:j===nv-1?[q[0],q[1],q[2]]:q,col,c,em)}};
Mesh.prototype.cyl=function(p0,p1,r0,r1,col,n,capCol,em){n=n||12;const a=[p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]],l=Math.hypot(...a),ax=a.map(x=>x/l);
 let t=Math.abs(ax[2])<.9?[0,0,1]:[0,1,0];let u=[ax[1]*t[2]-ax[2]*t[1],ax[2]*t[0]-ax[0]*t[2],ax[0]*t[1]-ax[1]*t[0]];const ul=Math.hypot(...u);u=u.map(x=>x/ul);
 const w=[ax[1]*u[2]-ax[2]*u[1],ax[2]*u[0]-ax[0]*u[2],ax[0]*u[1]-ax[1]*u[0]],c=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2,(p0[2]+p1[2])/2];
 const R=(p,r,k)=>{const th=k/n*Math.PI*2+(this._rot||0),cs=Math.cos(th)*r,sn=Math.sin(th)*r;return[p[0]+u[0]*cs+w[0]*sn,p[1]+u[1]*cs+w[1]*sn,p[2]+u[2]*cs+w[2]*sn]};
 const A=[],B=[];for(let k=0;k<n;k++){A.push(R(p0,r0,k));B.push(R(p1,r1,k))}
 for(let k=0;k<n;k++){const k2=(k+1)%n;this.poly([A[k],A[k2],B[k2],B[k]],col,c)}
 if(!this._nocap){if(r0>0)this.poly(A,capCol||col,c,em===1||em===3);if(r1>0)this.poly(B,capCol||col,c,em===2||em===3)}};
Mesh.prototype.ring=function(c,rin,rout,col,n){const cc=[c[0]+1,c[1],c[2]],P=(r,k)=>[c[0],c[1]+r*Math.cos(k/n*Math.PI*2),c[2]+r*Math.sin(k/n*Math.PI*2)];for(let k=0;k<n;k++)this.poly([P(rin,k),P(rout,k),P(rout,k+1),P(rin,k+1)],col,cc)};
Mesh.prototype.nac=function(y,z,nx,nl,nr,col,dark){const rear=nx-nl;this.cyl([rear+.2,y,z],[nx,y,z],nr,nr,col,12,GL.blue,1);this._nocap=true;this.cyl([rear,y,z],[rear+.2,y,z],nr,nr,col,12);this._nocap=false;this.ring([rear,y,z],nr*.8,nr,dark,12);this.ell([nx+.02,y,z],[.3,nr*.96,nr*.96],GL.red,1,12,7)};
Mesh.prototype.beam=function(p0,p1,w,col){this._rot=Math.PI/4;this.cyl(p0,p1,w,w,col,4);this._rot=0};
Mesh.prototype.box=function(c,s,col){const x=s[0]/2,y=s[1]/2,z=s[2]/2,V=[];for(const a of[-1,1])for(const b of[-1,1])for(const d of[-1,1])V.push([c[0]+a*x,c[1]+b*y,c[2]+d*z]);
 [[0,1,3,2],[4,6,7,5],[0,4,5,1],[2,3,7,6],[0,2,6,4],[1,5,7,3]].forEach(q=>this.poly(q.map(i=>V[i]),col,c))};
Mesh.prototype.ext=function(pts,z0,z1,col){const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length,c=[cx,cy,(z0+z1)/2];
 this.poly(pts.map(p=>[p[0],p[1],z1]),col,c);this.poly(pts.map(p=>[p[0],p[1],z0]),col,c);
 pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];this.poly([[p[0],p[1],z0],[q[0],q[1],z0],[q[0],q[1],z1],[p[0],p[1],z1]],col,c)})};
Mesh.prototype.extY=function(pts,y0,y1,col){const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length,c=[cx,(y0+y1)/2,cz];
 this.poly(pts.map(p=>[p[0],y1,p[1]]),col,c);this.poly(pts.map(p=>[p[0],y0,p[1]]),col,c);
 pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];this.poly([[p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]]],col,c)})};
Mesh.prototype.extX=function(pts,x0,x1,col,em){const cy=pts.reduce((a,p)=>a+p[0],0)/pts.length,cz=pts.reduce((a,p)=>a+p[1],0)/pts.length,c=[(x0+x1)/2,cy,cz]; // [S-KLI] extrude a y/z outline along x (nacelle and rail sections)
 this.poly(pts.map(p=>[x1,p[0],p[1]]),col,c,em);this.poly(pts.map(p=>[x0,p[0],p[1]]),col,c,em);
 pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];this.poly([[x0,p[0],p[1]],[x0,q[0],q[1]],[x1,q[0],q[1]],[x1,p[0],p[1]]],col,c,em)})};
Mesh.prototype.slab=function(pts,zf,th,col){const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length,c=[cx,cy,zf(cy)-th/2],T=pts.map(p=>[p[0],p[1],zf(p[1])]),B=pts.map(p=>[p[0],p[1],zf(p[1])-th]);
 this.poly(T,col,c);this.poly(B,col,c);pts.forEach((p,i)=>{const k=(i+1)%pts.length;this.poly([B[i],B[k],T[k],T[i]],col,c)})};
Mesh.prototype.sym=function(fn){fn(1);fn(-1)};
const GL={red:'#ff6a55',blue:'#7cc4ff',org:'#ffb347',grn:'#9dffb0',yel:'#ffe27a'};
function fedModel(o){const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',sx=o.sx||2.4,hx1=sx-1.1,hx0=hx1-o.hl;
 m.ell([sx,0,.9],[o.sr,o.sr,o.sr*.17],H,0,20,11);m.ell([sx+.1,0,1.15],[o.sr*.22,o.sr*.22,.3],D,0,12,7);
 if(o.ring)m.ell([sx,0,.88],[o.sr*1.02,o.sr*1.02,o.sr*.07],D,0,20,6);
 m.box([sx-1.5,0,.3],[1.2,.45,1.0],H);
 m.cyl([hx0,0,-.25],[hx1,0,-.25],o.hr*.85,o.hr,H,14);m.ell([hx0,0,-.25],[.5,o.hr*.85,o.hr*.85],H,0,12,6);
 m.ell([hx1+.05,0,-.25],[.22,o.hr*.7,o.hr*.7],GL.blue,1,12,6);
 m.sym(s=>{const ax=o.nx-o.nl*.45;m.beam([hx0+.7,s*.2,-.15],[ax,s*o.ny,o.nz-.02],.16,D);m.beam([hx0+1.3,s*.2,-.15],[ax+.5,s*o.ny,o.nz-.02],.12,D);
  m.nac(s*o.ny,o.nz,o.nx,o.nl,o.nr,N,D);
  if(o.fin)m.ext([[hx0+.6,s*.3],[hx0-.6,s*1.4],[hx0-1.2,s*1.4],[hx0-.4,s*.3]],-.3,-.15,D)});
 if(o.n3){const z3=o.nz+1.1,x3=o.nx-o.nl*.42;m.beam([x3,0,.4],[x3,0,z3],.17,D);m.nac(0,z3,o.nx,o.nl,o.nr,N,D)}
 return m}
function fedDD(){ // [S-FED] R2.6 Federation destroyer from the user's 2D plans (side/top/front): the CA's saucer at ~0.9 scale, with ONE long nacelle-hull carried under the saucer on a single swept pylon, small deflector bulb under the saucer front. x fwd, y lateral, z up.
 const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',L='#eef0f8',R=2.4,hz=-1.15,hr=.35;
 const circ=r=>{const p=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;p.push([r*Math.cos(t),r*Math.sin(t)])}return p};
 m.disc(0,R,[[0,.27,-.32],[.22,.24,-.3],[.45,.19,-.24],[.7,.12,-.18],[.9,.07,-.13],[.98,.045,-.115],[1,.03,-.1]],H,D);
 m.ell([0,0,.27],[.56,.56,.27],H,0,16,7);m.ell([0,0,.45],[.22,.22,.13],L,0,10,5);m.ell([0,0,-.38],[.4,.4,.2],D,0,12,6); // dome, bridge cap, underside bulb
 [0,60,120,180,240,300].forEach(a=>{const t=a*Math.PI/180;m.ell([R*.92*Math.cos(t),R*.92*Math.sin(t),.12],[.06,.06,.06],D,0,6,4)}); // rim lights
 m.cyl([.2,0,-.3],[.2,0,-.72],.06,.06,D,6);m.ell([.2,0,-.84],[.09,.24,.24],GL.blue,0,10,5); // small deflector hanging under the saucer
 m.extY([[-.75,-.2],[-2.4,-.2],[-3.07,-.95],[-2.1,-.95]],-.2,.2,H); // wide neck sloping down and rearward from the saucer underside to the hull top, as in the side view
 m.box([-2.3,0,.12],[.5,.7,.14],N); // small block at the saucer rear
 m.cyl([-6.1,0,hz],[-.95,0,hz],hr,hr,H,18,H);m.ell([-.95,0,hz],[.2,.38,.38],GL.red,1,14,8); // long nacelle-hull behind the saucer centre, flat red front dome
 m.cyl([-1.15,0,hz],[-1.3,0,hz],hr+.03,hr+.03,D,18);m.cyl([-6.1,0,hz],[-6.25,0,hz],hr+.03,hr+.03,D,18);
 m.cyl([-6.25,0,hz],[-6.75,0,hz],hr,hr*.7,N,14,GL.blue,2); // rear end, blue exhaust
 m.box([-3.9,0,hz+hr],[1.2,.18,.05],D);
 return m}
function fedDDold(){const m=new Mesh(),H='#dfe2ee',D='#9aa1bd',RD='#a93a30',R=2.5,xf=-.9,xr=-5.7,hr=.46;
 m.ell([0,0,1.15],[R,R,.36],H,0,24,12);m.ell([0,0,1.38],[R*.34,R*.34,.26],H,0,16,8);m.ell([.1,0,1.62],[.3,.3,.18],D,0,10,6);
 for(let k=0;k<6;k++){const t=k/6*Math.PI*2+.5;m.ell([Math.cos(t)*R*.86,Math.sin(t)*R*.86,1.4],[.09,.09,.06],'#ffe27a',1,6,4)}
 m.ell([.55,0,.5],[.4,.4,.4],'#4b5068',0,12,8);m.cyl([.55,0,.8],[.55,0,.95],.08,.08,D,6);
 m.extY([[-1.0,.95],[-2.2,.95],[-2.9,.5],[-2.3,.1],[-1.7,.45]],-.15,.15,H);
 m.cyl([xr+.2,0,0],[xf,0,0],hr,hr,H,16,GL.blue,1);m._nocap=true;m.cyl([xr,0,0],[xr+.2,0,0],hr,hr,H,16);m._nocap=false;m.ring([xr,0,0],hr*.78,hr,D,16);
 m.cyl([xf-.28,0,0],[xf-.06,0,0],hr*1.08,hr*1.08,D,16);
 {const nu=16,nv=6,c=[xf,0,0],rx=.62,ry=hr,P=(i,j)=>{const u=i/nu*Math.PI*2,v=j/nv*Math.PI/2;return[c[0]+rx*Math.cos(v),ry*Math.sin(v)*Math.cos(u),ry*Math.sin(v)*Math.sin(u)]};
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++)m.poly(j===0?[P(i,j),P(i+1,j+1),P(i,j+1)]:[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)],i%2?'#ffc247':'#e8801f',[xf-.3,0,0],1)}
 m.sym(s=>{m.box([-2.6,s*hr,.14],[3.4,.05,.09],RD);m.box([-5.0,s*.12,hr+.08],[.55,.08,.2],D)});
 return m}
function fedCL(){const m=new Mesh(),H='#d3d8e3',D='#8a92a8',RD='#c93a2e',R=3.0,zt=r=>.9+.32*Math.sqrt(Math.max(0,1-(r/R)*(r/R)));
 m.ell([0,0,.9],[R,R,.32],H,0,28,12);m.ell([0,0,.9],[R*1.0,R*1.0,.12],'#bfc5d4',0,28,6);
 [1.95,2.3].forEach(r=>{const a0=-2.6,a1=2.6,n=18;for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n+Math.PI,t1=a0+(a1-a0)*(i+1)/n+Math.PI,z=zt(r)+.04;
  m.poly([[Math.cos(t0)*r,Math.sin(t0)*r,z],[Math.cos(t1)*r,Math.sin(t1)*r,z],[Math.cos(t1)*(r+.05),Math.sin(t1)*(r+.05),z],[Math.cos(t0)*(r+.05),Math.sin(t0)*(r+.05),z]].reverse(),RD,[0,0,0],0)}});
 m.ell([.9,0,1.18],[1.15,1.15,.24],H,0,20,8);m.ell([.95,0,1.4],[.5,.5,.2],H,0,14,7);m.ell([1.0,0,1.58],[.22,.22,.14],'#f4ecc4',1,10,6);
 m.ext([[.5,.45],[-.6,.95],[-3.0,1.05],[-3.0,-1.05],[-.6,-.95],[.5,-.45]],1.0,1.5,H);
 m.ext([[.2,.4],[-.8,.7],[-2.8,.8],[-2.8,-.8],[-.8,-.7],[.2,-.4]],1.5,1.78,'#b9c0d0');m.box([-1.4,0,1.8],[1.5,.5,.06],D);
 m.ext([[0,.6],[-.7,2.0],[-2.8,2.3],[-2.8,-2.3],[-.7,-2.0],[0,-.6]],1.32,1.58,H);
 m.sym(s=>{m.cyl([-3.6,s*2.25,1.75],[-.6,s*2.25,1.75],.46,.46,H,14,'#8a92a8',0);m.ell([-.6,s*2.25,1.75],[.34,.46,.46],'#ff9a3c',1,14,8);
  m.ell([-.8,s*2.25,1.75],[.1,.34,.34],'#ffd08a',1,10,5);m.box([-2.0,s*2.25,2.2],[1.6,.1,.07],RD)});
 m.ell([-.5,2.55,.98],[.1,.1,.06],'#7dff8f',1,6,4);m.ell([-.5,-2.55,.98],[.1,.1,.06],'#ff6a55',1,6,4);
 [[1.9,1.2],[1.9,-1.2],[-2.0,0]].forEach(q=>m.box([q[0],q[1],zt(Math.hypot(q[0],q[1]))+.02],[.32,.18,.04],'#f2e08a'));
 return m}
// [S-KLI] Klingon ships rebuilt from the user's reference renders (E4, F5, D6, D7 views + D7/F5 plan-view size comparison).
// Layout: fan-shaped command head on a sphere, long boom, bat-wing hull with drooping outer panels, rail-box superstructure, two rolled rounded-box nacelles (red front, blue exhaust).
const KSH={
 d7:{hR:3.1,bl:5.7,c0:.31,c1:.67,dx:.62,dz:.85,dr:[.9,.7,.4],sx:1.3,sr:[1.1,1.05,.65],sz:-.35,by0:.43,bz0:.2,by1:.6,bz1:.33,
  pl:[[0,0],[-.6,4.1],[-6.2,5.95],[-4.9,1.9],[-5.1,0]],z0:.75,s1:.153,ky:4.9,s2:1.3,th:.45,nf:-3.0,nl:5.7,nw:1.1,nh:1.26,ncy:5.95,ncz:-2.1,
  ss:{x:-4.5,lx:2.4,ly:2.0,ry:1.5,rw:.85,rl:3.7,q:1.55,slots:15},lou:0},
 f5:{hR:2.0,bl:4.6,c0:.65,c1:1.05,dx:.62,dz:1.05,dr:[1.0,.8,.42],sx:1.0,sr:[1.0,1.0,.95],sz:0,by0:.3,bz0:.25,by1:.42,bz1:.36,
  pl:[[0,0],[-.35,2.4],[-3.2,3.5],[-2.6,1.1],[-2.7,0]],z0:.58,s1:.2,ky:2.9,s2:1.1,th:.4,nf:.3,nl:4.4,nw:.72,nh:1.1,ncy:3.5,ncz:-.94,
  ss:{x:-1.9,lx:1.5,ly:1.0,ry:.95,rw:.6,rl:2.0,q:1,slots:7},lou:12}};
KSH.c8=Object.assign({},KSH.d7,{hR:2.5,c0:.65,c1:1.07,dz:1.3,dr:[.8,.65,.4],sr:[.98,.98,.7],sz:-.4,by0:.5,bz0:.3,by1:.8,bz1:.45,th:.7,h2:1,lens:1,pod:1,nf:-2.0,n3:{nf:4.0,nl:5.6}}); // [S-KLI] C8/C9: double collar, heavier boom/hull, third nacelle slung under the boom
function kliModel(o,pal){pal=pal||{h:'#8d9c88',d:'#56664f',n:'#a8b4a2',l:'#b4c0ae'};
 const m=new Mesh(),C=KSH[o.c||'d7'],S=o.S||1,H=pal.h,D=pal.d,L=pal.l,N=pal.n,K=C.hR/2,bl=C.bl,hR=C.hR;
 const rr=(w,h,r)=>{const p=[];[[w/2-r,h/2-r,0],[-w/2+r,h/2-r,90],[-w/2+r,-h/2+r,180],[w/2-r,-h/2+r,270]].forEach(c=>{for(let k=0;k<=3;k++){const t=(c[2]+k*30)*Math.PI/180;p.push([c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)])}});return p};
 const loft=(x0,x1,ry0,rz0,ry1,rz1,col)=>{const n=12,P=(x,ry,rz,k)=>{const t=k/n*Math.PI*2;return[x,ry*Math.cos(t),rz*Math.sin(t)]},c=[(x0+x1)/2,0,0];for(let k=0;k<n;k++)m.poly([P(x0,ry0,rz0,k),P(x0,ry0,rz0,k+1),P(x1,ry1,rz1,k+1),P(x1,ry1,rz1,k)],col,c)};
 // head: fan-shaped plate, dome, sphere underneath, nose ring
 const fan=[[bl,0]];for(let i=0;i<=14;i++){const t=(-42+i*6)*Math.PI/180;fan.push([bl+hR*Math.cos(t),hR*Math.sin(t)])}
 m.ext(fan,C.c0,C.c1,H);if(C.h2)m.ext(fan.map(p=>[bl+(p[0]-bl)*.9,p[1]*.9]),C.c0-.34,C.c0,H); // second collar plate (C8/C9)
 m.ext(fan.map(p=>[bl+(p[0]-bl)*.9,p[1]*.9]),C.c1,C.c1+.04*K,D);
 const hx=bl+hR*C.dx;m.ell([hx,0,C.dz],C.dr,L,0,14,7);[-1,1].forEach(sd=>m.ell([hx+.15*K,sd*.45*K,C.dz+C.dr[2]*.85],[.08*K,.08*K,.08*K],D,0,6,4));
 m.cyl([bl+.55*hR*.5,0,C.c1],[bl+.55*hR*.5,0,C.c1+.45*K],.28*K,.28*K,L,10,D); // raised bump behind the dome
 const sxp=bl+hR-C.sx;m.ell([sxp,0,C.sz],C.sr,H,0,16,9);
 m.cyl([sxp+C.sr[0]*.8,0,C.sz-C.sr[2]*.25],[sxp+C.sr[0]*.8+.4*K,0,C.sz-C.sr[2]*.25],.2*K,.2*K,D,10,'#1d2a1f');
 // boom (flattened elliptical, tapering toward the hull) and its joint collars
 loft(bl,0,C.by0,C.bz0,C.by1,C.bz1,H);loft(0,-.8,C.by1,C.bz1,C.by1,C.bz1,H);loft(1.3,.8,C.by1*1.2,C.bz1*1.3,C.by1*1.2,C.bz1*1.3,D);
 // hull: swept bat-wing planform with a gentle roof slope and a steep outer drop to each nacelle
 const ky=C.ky,z1=y=>C.z0-C.s1*Math.abs(y),zo=y=>C.z0-C.s1*ky-C.s2*(Math.abs(y)-ky);
 const clip=(pts,k,low)=>{const out=[];pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length],pi=low?p[1]<=k:p[1]>=k,qi=low?q[1]<=k:q[1]>=k;if(pi)out.push(p);if(pi!==qi){const t=(k-p[1])/(q[1]-p[1]);out.push([p[0]+(q[0]-p[0])*t,k])}});return out};
 const ss=C.ss,q=ss.q,zt=C.z0;
 const nac=(sd,cy,al,xf,nl)=>{const xr=xf-nl,roll=pts=>pts.map(p=>[sd*(cy+p[0]*Math.cos(al)-p[1]*Math.sin(al)),C.ncz+p[0]*Math.sin(al)+p[1]*Math.cos(al)]),sec=f=>roll(rr(C.nw*f,C.nh*f,C.nw*.28*f));
  m.extX(sec(1),xr+.9*K,xf-.35*K,N);m.extX(sec(.78),xf-.35*K,xf,N);m.extX(sec(.55),xf,xf+.1,GL.red,1);
  m.extX(sec(.82),xr,xr+.9*K,D);m.extX(sec(.55),xr-.12,xr,GL.blue,1);
  m.box([xf-nl*.5,sd*(cy-C.nw*.42),C.ncz+C.nh*.05],[nl*.55,.05,C.nh*.26],D)}; // dark intake strip on the inner side
 m.sym(sd=>{const sg=a=>a.map(p=>[p[0],sd*p[1]]);
  m.slab(sg(clip(C.pl,ky,true)),z1,C.th,H);m.slab(sg(clip(C.pl,ky,false)),zo,C.th*.8,D);
  // louvres across the wing tops
  for(let i=0;i<C.lou;i++){const x=-.55-i*.16,y0=ss.ry+.5,y1=Math.min(ky-.2,2.2+.386*(-x-.35)-.1);if(y1<=y0)continue;
   m.poly([[x-.03,sd*y0,z1(y0)+.012],[x+.03,sd*y0,z1(y0)+.012],[x+.03,sd*y1,z1(y1)+.012],[x-.03,sd*y1,z1(y1)+.012]],D,[x,sd*(y0+y1)/2,z1(y0)-1]);}
  // nacelle: rounded box rolled with the wing droop; red front, blue exhaust
  nac(sd,C.ncy,.42,C.nf,C.nl);
  // rail box on the superstructure, rolled outward
  const rs=rr(ss.rw,.75*q,.2*q).map(p=>[sd*(ss.ry+p[0]*Math.cos(.35)+p[1]*Math.sin(.35)),zt+.45*q-p[0]*Math.sin(.35)+p[1]*Math.cos(.35)]);
  m.extX(rs,ss.x-ss.rl/2,ss.x+ss.rl/2,L);
  m.ell([ss.x+ss.rl/2,sd*ss.ry,zt+.5*q],[.12*q,.12*q,.12*q],D,0,6,4);
  // pill lights on the front of the hull
  m.box([-.3,sd*(C.pl[1][1]*.45),zt-.35],[.12,.9*q,.26*q],L)});
 if(C.n3){nac(1,0,0,C.n3.nf,C.n3.nl);m.extY([[3.1,-.3],[1.5,-.3],[1.9,-1.7],[3.0,-1.7]],-.18,.18,H)} // C8/C9 third nacelle on a chevron pylon under the boom
 if(C.lens)m.ell([-2.4,0,-.5],[3.4,2.8,.5],H,0,18,8); // C8/C9 deep lens-shaped hull belly
 if(C.pod)m.box([2.0,0,C.bz1+.15],[1.5,.7,.35],L);
 // superstructure centre block, bolts and front slot row
 m.box([ss.x,0,zt+.22*q],[ss.lx,ss.ly*.75,.5*q],H);m.box([ss.x-ss.lx*.2,0,zt+.55*q],[ss.lx*.5,ss.ly*.4,.22*q],L);
 [-.3,0,.3].forEach(y=>m.ell([ss.x-ss.lx*.5,y*q,zt+.7*q],[.09*q,.09*q,.09*q],D,0,6,4));
 for(let i=0;i<ss.slots;i++){const y=(i-(ss.slots-1)/2)*(ss.ly*.9/ss.slots);m.box([ss.x+ss.lx/2+.02,y,zt+.02],[.08,.12*q*.6,.4*q],D)}
 if(o.dorsal)m.box([ss.x-ss.lx*.5,0,zt+.95*q],[ss.lx*.6,.7*q,.35*q],D);
 // scale to class size (shared vertices scaled once)
 if(S!==1){const seen=new Set();m.f.forEach(f=>f.v.forEach(p=>{if(!seen.has(p)){seen.add(p);p[0]*=S;p[1]*=S;p[2]*=S}}))}
 return m}
function romModel(o){ // War Eagle traced from the top-down photo of the miniatures: round front, sides tapering over a hull three radii long to a notched tail, a U-shaped platform with a thin blade, parallelogram wings swept forward to long nacelles level with the front of the hull
 const m=new Mesh(),W='#dde1e6',D='#9aa1ad',OR='#f08a24',R=3.0,x0=0,xt=-6.0,wt=2.3,ny=5.6,nf=3.1,nr=-3.6;
 const hull=(k)=>{const pts=[];for(let a=-90;a<=90;a+=10){const t=a*Math.PI/180;pts.push([x0+Math.cos(t)*R*k,Math.sin(t)*R*k])}
  const tx=x0+(xt-x0)*k;pts.push([tx,wt*k]);for(let q=1;q<6;q++){const u=q/6;pts.push([tx+.6*Math.sin(Math.PI*u)*k,wt*k*(1-2*u)])}pts.push([tx,-wt*k]);return pts};
 m.ext(hull(1),-.1,.07,W);m.ext(hull(.96),.07,.12,'#cfd4da');m.ext(hull(.84),.12,.16,W); // hull plate, bevel and raised crown
 const pf=-.6,pw=1.4,U=[];for(let a=-90;a<=90;a+=15){const t=a*Math.PI/180;U.push([pf+Math.cos(t)*pw,Math.sin(t)*pw])}U.push([-3.0,pw],[-3.0,-pw]);
 m.ext(U,.16,.3,'#c4c9d1'); // the raised U-shaped platform
 m.ell([pf-.1,0,.3],[1.0,.85,.12],W,0,14,6);
 for(let a=-95;a<=95;a+=7){const t=a*Math.PI/180;m.ell([pf+Math.cos(t)*(pw+.45),Math.sin(t)*(pw+.45),.17],[.05,.05,.04],GL.yel,1,5,3)} // lights round the platform
 for(let a=-100;a<=100;a+=9){const t=a*Math.PI/180;m.ell([pf+Math.cos(t)*(pw+.95),Math.sin(t)*(pw+.95),.14],[.04,.04,.03],GL.yel,1,4,3)}
 m.extY([[-.6,.28],[-5.2,.28],[-5.2,.85],[-3.2,.55]],-.04,.04,W); // thin dorsal blade along the centreline, taller at the rear
 m.box([-3.4,0,.3],[1.0,.6,.14],D); // block on the centreline behind the platform
 m.sym(sd=>{
  const P0=[-.2,sd*R],F=[.9,sd*(ny-.25)],Tp=[-1.2,sd*(ny-.25)],P1=[-3.6,sd*(wt+.3)];
  m.ext([P0,F,Tp,P1],-.05,.05,W); // parallelogram wing: root along the hull side, tip forward at the nacelle
  const bd=(A,B,w,z0,z1,c)=>{const dx=B[0]-A[0],dy=B[1]-A[1],l=Math.hypot(dx,dy);let nx=-dy/l,ny2=dx/l;const mx=(P0[0]+F[0]+Tp[0]+P1[0])/4-(A[0]+B[0])/2,my=(P0[1]+F[1]+Tp[1]+P1[1])/4-(A[1]+B[1])/2;if(nx*mx+ny2*my<0){nx=-nx;ny2=-ny2}
   m.ext([A,B,[B[0]+nx*w,B[1]+ny2*w],[A[0]+nx*w,A[1]+ny2*w]],z0,z1,c);return{nx,ny:ny2,l,dx,dy}};
  const e=bd(Tp,P1,.34,.05,.075,OR); // orange band along the rear edge of the wing
  const n=6;for(let k=0;k<n;k++){const t=(k+.5)/n,cx=Tp[0]+e.dx*t+e.nx*.34,cy=Tp[1]+e.dy*t+e.ny*.34;m.ell([cx,cy,.075],[.18,.18,.02],W,0,10,3)}
  m.ext([[-1.5,sd*(ny-.6)],[1.1,sd*(ny-.6)],[1.1,sd*(ny+.1)],[-1.5,sd*(ny+.1)]],-.1,.1,W); // the wing tip is fused to the nacelle
  m.cyl([nr,sd*ny,0],[nf,sd*ny,0],.36,.36,W,14,W,0);m.ell([nf+.05,sd*ny,0],[.3,.36,.36],GL.red,1,12,6); // long nacelle: reddish front, blue exhaust at the back
  m.ring([-1.6,sd*ny,0],.28,.36,D,12);m.ring([nf-.5,sd*ny,0],.3,.36,D,12);m.cyl([nr,sd*ny,0],[nr-.3,sd*ny,0],.36,.26,D,12);m.ell([nr-.32,sd*ny,0],[.16,.27,.27],GL.blue,1,10,5)});
 return m}
function kzModel(o){ // [S-KZI] Kzinti FF / CL rebuilt from the user's reference renders: sloped bow, spine, wing bars with end pods, rear nacelles on struts. x fwd, y lateral, z up.
 const m=new Mesh(),H='#c6aa78',D='#7d6a45',L='#dcc592',bc=o.k==='bc',cl=o.k==='cl'||bc; // bc = battlecruiser: taller hex spine, hex engine face, raised dorsal nacelle
 const rr=(w,h,r)=>{const p=[];[[w/2-r,h/2-r,0],[-w/2+r,h/2-r,90],[-w/2+r,-h/2+r,180],[w/2-r,-h/2+r,270]].forEach(c=>{for(let k=0;k<=3;k++){const t=(c[2]+k*30)*Math.PI/180;p.push([c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)])}});return p};
 const F=cl?5.5:4.75,E=-F; // bow tip and stern
 // bow
 if(cl){const xT=F,xS=F-3.0,xR=F-4.9,tri=(q,c)=>m.poly(q,H,c),c=[(xT+xR)/2,0,.9];
  m.extX([[-2.25,.28],[2.25,.28],[.73,1.71],[-.73,1.71]],xR,xS,H); // shoulder box: sloping sides, flat roof
  [-1,1].forEach(sd=>{ // front wedge loft: base width 1.3 at the tip to 4.5 at the shoulder, roof climbing from the tip
   tri([[xT,sd*.65,.28],[xT,sd*.2,.28],[xS,sd*.73,1.71],[xS,sd*2.25,.28]],c);
   tri([[xT,sd*.65,.28],[xS,sd*2.25,.28],[xS,0,.28],[xT,0,.28]],c);
   tri([[xT,sd*.2,.28],[xS,sd*.73,1.71],[xS,0,1.71],[xT,0,.28]],c)});
  m.box([xT-.7,0,.35],[.8,.9,.06],L); // front panel
  [-1,1].forEach(sd=>{const dy=bc?1.42:1.3,dz=bc?1.1:1.5;m.cyl([xS-1.2,sd*dy,dz],[xS-1.05,sd*dy,dz],.3,.3,L,14,D);m.beam([xS-1.2,sd*(dy-.3),dz-.05],[xS-1.2,sd*dy,dz],.07,D)}); // dish turrets
 }else{
  m.extY([[F,-.35],[F-1.0,1.5],[F-2.5,1.5],[F-2.5,-.35]],-1.1,1.1,H); // sloped-front bow block
  m.extY([[F-.45,-.3],[F-2.35,-.3],[F-2.35,-.65],[F-1.15,-.65]],-.8,.8,D); // lower wedge
  m.sym(sd=>{m.box([F-1.6,sd*1.2,.75],[1.8,.3,.9],D);m.box([F-1.6,sd*1.2,.1],[1.8,.3,.5],L)}); // stepped side panels
  m.cyl([F-1.7,0,1.85],[F-1.25,0,1.85],.33,.33,L,12,D);m.cyl([F-1.25,0,1.85],[F-.8,0,1.85],.33,.05,D,12);m.box([F-1.7,0,1.65],[.8,.7,.3],D)} // dorsal turret on a block
 // spine
 const sx0=cl?F-4.6:F-2.4;
 const sw=bc?1.12:.62;
 if(bc){const hx=[[-.75,1.4],[.75,1.4],[1.1,.25],[.75,-.94],[-.75,-.94],[-1.1,.25]],se=E+.9;
  m.extX(hx,se,sx0,H);m.extX(hx.map(p=>[p[0]*.8,p[1]*.8+.05]),se-.05,se,D); // hexagonal spine with a slotted engine face
  m.cyl([se-.05,0,.25],[se-.7,0,.25],.38,.3,D,12,'#20241f');for(let i=0;i<7;i++)m.box([se-.06,(i-3)*.18,.25],[.04,.07,.9],'#2a2f26')}
 else if(cl)m.extX([[-.7,0],[-.45,.6],[.45,.6],[.7,0],[.45,-.6],[-.45,-.6]],E,sx0,H);
 else m.extY([[sx0,-.55],[sx0,.7],[E,.55],[E,-.45]],-.7,.7,H);
 m.box([sx0-.2,0,bc?1.6:cl?.75:1.0],[1.0,.9,.4],L);
 [0,1,2].forEach(i=>[-1,1].forEach(sd=>m.box([sx0-1.6-i*1.5,sd*sw,bc?.5:.15],[.7,.05,bc?.5:.3],D))); // window panels along the spine
 // wing bars and end pods
 const wx=cl?-.9:F-4.4,wc=cl?1.0:.7,wy0=bc?1.1:.7,wy1=cl?2.3:2.55,py1=cl?2.95:3.7;
 m.sym(sd=>{m.box([wx,sd*(wy0+wy1)/2,-.05],[wc,wy1-wy0,.17],H);
  const rn=.37,pts=[[wy1,-rn],[py1-rn,-rn]];for(let k=1;k<6;k++){const t=-Math.PI/2+k*Math.PI/6;pts.push([py1-rn+rn*Math.cos(t),rn*Math.sin(t)])}pts.push([py1-rn,rn],[wy1,rn]);
  m.extX(pts.map(p=>[sd*p[0],p[1]-.05]),wx-wc*.75,wx+wc*.75,L);
  [-.14,.14].forEach(z=>m.cyl([wx+wc*.75,sd*(wy1+.25),z-.05],[wx+wc*.75+.16,sd*(wy1+.25),z-.05],.1,.1,D,8))});
 // nacelles on diagonal struts (red front, blue exhaust); CL also carries an upper pair on masts
 const nl=bc?2.8:cl?2.1:2.65,nx0=E+nl,nz=bc?-.65:cl?-.73:-.75,ny=bc?1.3:cl?1.1:1.15;
 m.sym(sd=>{const al=.7,roll=p=>[sd*(ny+p[0]*Math.cos(al)+p[1]*Math.sin(al)),nz-p[0]*Math.sin(al)+p[1]*Math.cos(al)],sec=f=>rr(.75*f,.4*f,.12*f).map(roll);
  m.extX(sec(1),E+.25,nx0-.15,H);m.extX(sec(.8),nx0-.15,nx0,H);m.extX(sec(.55),nx0,nx0+.1,GL.red,1);m.extX(sec(.8),E,E+.25,D);m.extX(sec(.55),E-.1,E,GL.blue,1);
  [E+.7,nx0-.6].forEach(x=>m.beam([x,sd*(bc?.8:.5),bc?-.6:-.35],[x,sd*ny,nz],.07,D));
  });
 // dorsal nacelle: one box on a mast above the spine (CL and BC)
 if(cl){const uz=bc?1.95:1.1,mz=bc?1.4:.6,dl=bc?2.8:2.1,dw=bc?.5:.45,x1=E+dl,u=pp=>rr(dw*pp,dw*.9*pp,.1*pp).map(p=>[p[0],uz+p[1]]);
  m.extX(u(1),E+.25,x1-.15,H);m.extX(u(.8),x1-.15,x1,H);m.extX(u(.55),x1,x1+.1,GL.red,1);m.extX(u(.8),E,E+.25,D);m.extX(u(.55),E-.1,E,GL.blue,1);
  m.box([E+dl*.5,0,(mz+uz)/2-.1],[1.0,.12,uz-mz-.15],L);for(let i=0;i<8;i++)m.box([E+.5+i*.2*dl/2.1*.9,0,uz+dw*.45+.01],[.07,dw*.6,.03],D)}
 if(o.dorsal)m.box([sx0-.4,0,cl?1.0:1.25],[1.4,.7,.35],D);
 return m}
function gorModel(o){ // [S-GORN] Gorn DD/DDF traced from the user's three reference views (top-front, underside, side). x fwd, y lateral, z up.
  const m=new Mesh(),H='#879e78',D='#4f654a',L='#a6bb97',cx=3.0,cl=!!o.cl,bx=cl?-2.1:-1.8,nl=cl?-4.4:-3.9; // [S-GORN] cl = CL/CA variant: longer boom and nacelles, bridge knob, no underside bulb
  // egg-shaped saucer: fuller at the front, flatter where it meets the boom
  const hull=k=>{const p=[];for(let i=0;i<28;i++){const t=i/28*Math.PI*2,c=Math.cos(t);p.push([cx+1.55*k*c*(c>0?1:.9),1.45*k*Math.sin(t)])}return p};
  m.ext(hull(.9),-.30,-.20,D);m.ext(hull(1),-.20,.06,H);m.ext(hull(.94),.06,.16,H);m.ext(hull(.78),.16,.25,L);m.ext(hull(.5),.25,.29,H);
  m.ext(hull(.64),.25,.265,D);m.ext(hull(.86),.16,.175,D); // concentric grooves on top
  m.ell([cx,0,.28],[.5,.5,.07],D,0,14,5); // central dome
  if(cl){m.cyl([1.25,0,.3],[1.25,0,.42],.22,.22,L,12,D);m.ell([1.25,0,.42],[.14,.14,.1],D,0,8,4)} // CL dorsal bridge knob on the boom
  else m.ell([2.8,0,-.3],[.3,.3,.22],L,0,12,6); // DD underside sensor bulb
  // long boom (half-pipe trunk) running aft from the saucer
  m.extY([[1.5,-.24],[1.55,.1],[1.35,.3],[-1.6,.3],[bx,.1],[bx,-.25]],-.55,.55,H);
  m.ext([[1.3,-.4],[1.3,.4],[bx+.3,.4],[bx+.3,-.4]],.3,.33,D);
  // vent block (pylon) joining the two nacelles, one above, one below
  m.box([cl?-.9:-.83,0,0],[cl?1.65:1.45,.9,1.1],L);
  (cl?[-.4,-1.3]:[-.45,-1.2]).forEach(x=>[-1,1].forEach(sy=>[-1,1].forEach(sz=>[0,1,2].forEach(k=>m.box([x+(k-1)*.17,sy*.46,sz*.34],[.1,.05,.22],D)))));
  // two nacelles stacked above and below the boom
  [-1,1].forEach(sz=>{const z=sz*.72;
   m.ell([0,0,z],[.65,.21,.21],H,0,14,8);m.ell([.62,0,z],[.1,.1,.1],GL.red,1,8,5); // teardrop nose, red front
   m.cyl([-.3,0,z],[nl,0,z],.2,.14,H,12);
   m.cyl([nl,0,z],[nl-.3,0,z],.2,.2,L,12,L);m.cyl([nl-.3,0,z],[nl-.6,0,z],.1,.1,D,10,GL.blue,2)}); // end ring and blue exhaust
  // swept wings with gear discs, pods and pipes
  m.sym(s=>{m.ext([[1.0,s*.5],[.55,s*1.85],[-.35,s*1.85],[-.3,s*.5]],.0,.07,H);
   m.cyl([.6,s*1.95,-.07],[.6,s*1.95,.1],.2,.2,L,14,D);
   [.05,-.3].forEach(x=>{m.cyl([x,s*1.3,.07],[x,s*1.3,.15],.17,.17,L,12,D);m.beam([.3,s*.85,.12],[x,s*1.3,.12],.04,D)});
   m.box([.3,s*.8,.12],[.5,.3,.1],D);m.ell([-.3,s*1.75,.1],[.06,.06,.06],D,0,6,4)});
  return m}
 function gorCA(){ // [S-GORN] Gorn CA from the user's references: twin saucers on a boom, wings amidships, two stacked nacelles passing over the rear saucer.
  const m=new Mesh(),H='#879e78',D='#4f654a',L='#a6bb97';
  const hull=(cx,rx,ry,k)=>{const p=[];for(let i=0;i<28;i++){const t=i/28*Math.PI*2,c=Math.cos(t);p.push([cx+rx*k*c*(c>0?1:.92),ry*k*Math.sin(t)])}return p};
  const sau=(cx,rx,ry)=>{ // deep egg-shaped saucer with C-ring and grooves on top, rounded underside
   m.ell([cx,0,-.05],[rx*.97,ry*.97,.5],H,0,20,8);
   m.ext(hull(cx,rx,ry,1),-.1,.1,H);m.ext(hull(cx,rx,ry,.95),.1,.24,H);m.ext(hull(cx,rx,ry,.8),.24,.34,L);m.ext(hull(cx,rx,ry,.55),.34,.4,H);
   m.ext(hull(cx,rx,ry,.7),.34,.355,D);m.ext(hull(cx,rx,ry,.9),.24,.255,D);m.ext(hull(cx,rx,ry,.36),.4,.42,D);m.ell([cx,0,.42],[.28,.28,.06],L,0,10,4)};
  sau(3.4,1.5,1.4);sau(-1.9,1.25,1.2);
  m.box([3.4,0,-.55],[.7,.45,.22],D); // wedge pod under the forward saucer
  // boom joining the saucers, with a dorsal rail and vent slots
  m.extY([[3.2,-.25],[3.2,.3],[-2.6,.3],[-2.6,-.25]],-.5,.5,H);
  m.ext([[3.4,-.15],[3.4,.15],[-1.0,.15],[-1.0,-.15]],.3,.38,L);
  [-.1,-.3,-.5,-.7].forEach(x=>m.box([x,0,.4],[.08,.34,.08],D));
  // vent block between the nacelles
  m.box([-.25,0,0],[1.3,.9,1.1],L);
  [.1,-.6].forEach(x=>[-1,1].forEach(sy=>[-1,1].forEach(sz=>[0,1,2].forEach(k=>m.box([x+(k-1)*.17,sy*.46,sz*.34],[.1,.05,.22],D)))));
  // stacked nacelles above and below the boom, tubes running aft past the rear saucer
  [-1,1].forEach(sz=>{const z=sz*.78;
   m.ell([.2,0,z],[.65,.21,.21],H,0,14,8);m.ell([.82,0,z],[.1,.1,.1],GL.red,1,8,5);
   m.cyl([-.1,0,z],[-4.9,0,z],.2,.14,H,12);
   m.cyl([-4.9,0,z],[-5.2,0,z],.2,.2,L,12,L);m.cyl([-5.2,0,z],[-5.5,0,z],.1,.1,D,10,GL.blue,2)});
  // swept wings amidships with gear discs and pods
  m.sym(s=>{m.ext([[1.4,s*.5],[.95,s*1.85],[.05,s*1.85],[.1,s*.5]],.0,.07,H);
   m.cyl([1.0,s*1.95,-.07],[1.0,s*1.95,.1],.2,.2,L,14,D);
   [.45,.1].forEach(x=>{m.cyl([x,s*1.3,.07],[x,s*1.3,.15],.17,.17,L,12,D);m.beam([.7,s*.85,.12],[x,s*1.3,.12],.04,D)});
   m.box([.7,s*.8,.12],[.5,.3,.1],D)});
  return m}
 function thoModel(o){ // [S-THO] Tholian PC from the user's references: hexagonal core with four tip spheres and three wedge-shaped fins 120 degrees apart; each fin widens from the tip to a blunt end carrying a grid of recesses, with slot rows along its outer edge. Tip forward (+x).
 const m=new Mesh(),L=o.plus?10.5:9,R=o.plus?3.5:3.0,t=.82,rh=.75,fl=rh*.866,xt=L/2,xb=-L/2,P=['#d8642c','#f0a04a','#e8873a','#7a2e12','#b84a20'];
 const hx=[0,1,2,3,4,5].map(i=>[rh*Math.cos(i*Math.PI/3),rh*Math.sin(i*Math.PI/3)]);
 m.extX(hx,xb+.3,xt,P[2]);m.extX(hx.map(p=>[p[0]*.78,p[1]*.78]),xt,xt+.06,P[3]);
 [[.2,0],[-.2,0],[0,.2],[0,-.2]].forEach(p=>m.ell([xt+.12,p[0],p[1]],[.12,.12,.12],GL.yel,1,8,5)); // four tip spheres
 [90,210,330].forEach(deg=>{const th=deg*Math.PI/180,u=[Math.cos(th),Math.sin(th)],v=[-Math.sin(th),Math.cos(th)],W=(x,r,tt)=>[x,u[0]*r+v[0]*tt,u[1]*r+v[1]*tt],ri=fl*.9,rt=fl+.05,c=[0,u[0]*.3,u[1]*.3];
  [-1,1].forEach(sg=>m.poly([W(xt,ri,sg*t/2),W(xt,rt,sg*t/2),W(xb,R,sg*t/2),W(xb,ri,sg*t/2)],P[sg>0?0:4],c)); // flat side faces
  m.poly([W(xt,rt,-t/2),W(xt,rt,t/2),W(xb,R,t/2),W(xb,R,-t/2)],P[1],c); // sloping outer face
  m.poly([W(xb,ri,-t/2),W(xb,ri,t/2),W(xb,R,t/2),W(xb,R,-t/2)],P[2],[xb+1,0,0]); // blunt end
  const cw=(t-.2)/4,rw=(R-ri-.24)/11;
  for(let i=0;i<4;i++)for(let j=0;j<11;j++){const t0=-t/2+.1+i*cw,r0=ri+.12+j*rw;m.poly([W(xb-.012,r0,t0),W(xb-.012,r0,t0+cw*.62),W(xb-.012,r0+rw*.62,t0+cw*.62),W(xb-.012,r0+rw*.62,t0)],P[3],[xb+1,0,0])} // grid of recesses on the blunt end
  for(let k=1;k<44;k++){const f=k/45,x0=xt+(xb-xt)*f,x1=x0-.09,r0=rt+(R-rt)*f+.012,r1=rt+(R-rt)*(f+.09/L*1)+.012;m.poly([W(x0,r0,-t/2+.15),W(x0,r0,t/2-.15),W(x1,r1,t/2-.15),W(x1,r1,-t/2+.15)],P[3],c)} // slot row along the outer edge
 });
 return m}
const FED={CA:{sr:2.4,hl:3.6,hr:.7,nl:4.2,nr:.34,nx:-.6,ny:2.2,nz:1.4},CC:{sr:2.55,hl:3.8,hr:.72,nl:4.4,nr:.36,nx:-.5,ny:2.3,nz:1.5,ring:1},
 DN:{sr:2.9,hl:4.4,hr:.9,nl:5.0,nr:.42,nx:-.5,ny:2.6,nz:1.7,ring:1,fin:1,n3:1},DD:{sr:1.9,hl:3.0,hr:.55,nl:3.2,nr:.28,nx:-.9,ny:1.8,nz:1.2},
 CL:{sr:2.05,hl:4.2,hr:.55,nl:3.8,nr:.28,nx:-.8,ny:1.9,nz:.5}};
const KLI={D7:{c:'d7'},D6:{c:'d7',S:.92},F5:{c:'f5'},E4:{c:'f5',S:.9},C8:{c:'c8',S:1.08,dorsal:1},C9:{c:'c8',S:1.12,dorsal:1}};
const KD7=()=>{if(!KD7.v){let a=1e9,b=-1e9;kliModel(KLI.D7).f.forEach(f=>f.v.forEach(p=>{a=Math.min(a,p[0]);b=Math.max(b,p[0])}));KD7.v=b-a}return KD7.v}; // [S-KLI] D7 length, so every Klingon is drawn at its true size ratio
const ROMG={h:'#6f9b78',d:'#3c5c45',n:'#8ab592',l:'#9cc5a5'};
function fedCC(o){o=o||{};const wp=o.wp||.65,px0=-1.38-wp/2,px1=-1.38+wp/2; // wp = pylon chord: CC broad (.9), CA narrow (.46)
 // [S-FED] Federation CC/CA from the user's detailed reference: thin stepped saucer with dome and bulb, slanted neck, secondary hull with deflector, long nacelles with big front domes on V pylons. x fwd (saucer front), y lateral, z up.
 const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',L='#eef0f8',cx=3.35,R=2.65,zH=-1.5,nz=.62,ny=2.1;
 const circ=r=>{const p=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;p.push([cx+r*Math.cos(t),r*Math.sin(t)])}return p};
 m.disc(cx,R,[[0,.3,-.36],[.22,.27,-.34],[.45,.21,-.27],[.7,.14,-.2],[.9,.08,-.15],[.98,.05,-.13],[1,.03,-.11]],H,D); // saucer sloping smoothly out to the rim
 m.ell([cx,0,.3],[.62,.62,.3],H,0,16,7);m.ell([cx,0,.5],[.24,.24,.14],L,0,10,5);m.ell([cx,0,-.42],[.5,.5,.26],D,0,12,6); // top dome, bridge cap, underside bulb
 [-1,1].forEach(sd=>[22,29,36,43].forEach(a=>{const t=a*Math.PI/180;m.box([cx+R*Math.cos(t)*1.0,sd*R*Math.sin(t),-.04],[.05,.12,.12],'#3a4056')})); // rim windows
 [0,60,120,180,240,300].forEach(a=>{const t=a*Math.PI/180;m.ell([cx+R*.92*Math.cos(t),R*.92*Math.sin(t),.14],[.07,.07,.07],D,0,6,4)}); // rim lights
 m.box([cx-1.95,0,.3],[1.3,1.0,.18],N);m.box([cx-2.1,0,.42],[.9,.6,.14],H); // dorsal block at the saucer rear
 m.extY([[2.1,.08],[2.15,-.35],[-.1,-1.2],[-.35,-.9]],-.5,.5,H); // slanted neck
 m.cyl([-2.2,0,zH],[2.05,0,zH],.63,.63,H,20,N);m.cyl([-2.75,0,zH],[-2.2,0,zH],.5,.63,H,20,D); // secondary hull
 m.cyl([2.05,0,zH],[2.2,0,zH],.56,.56,L,20,D);m.ell([2.2,0,zH],[.12,.3,.3],GL.blue,1,10,5); // deflector dish
 [[0,.62],[0,-.62],[.62,0],[-.62,0]].forEach(p=>m.box([2.12,p[0],zH+p[1]],[.12,p[0]?.22:.2,p[1]?.22:.2],N));
 m.sym(sd=>{
  m.extX([[sd*.35,zH+.55],[sd*.85,zH+.55],[sd*(ny+.15),nz-.2],[sd*(ny-.3),nz-.2]],px0,px1,H); // V pylon
  m.ell([-.05,sd*ny,nz],[.2,.32,.32],GL.red,1,14,8); // red front dome
  m.cyl([-.05,sd*ny,nz],[-5.3,sd*ny,nz],.3,.3,H,16,H);m.cyl([-.4,sd*ny,nz],[-.55,sd*ny,nz],.33,.33,D,16);
  m.cyl([-5.3,sd*ny,nz],[-5.95,sd*ny,nz],.3,.2,N,12,GL.blue,2); // tapered rear with blue exhaust
  m.box([-1.6,sd*ny,nz+.31],[1.0,.2,.06],D)});
 return m}
 function fedOldCL(){ // [S-FED] R2.5 Federation old-type light cruiser from the user's references: wedge head under a wide crescent bar with bridge dome, tapered neck, broad rear hull carrying two long nacelles, two small forward pods. x fwd, y lateral, z up.
 const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',L='#eef0f8';
 m.ext([[5.0,.55],[4.6,.95],[3.2,1.15],[2.4,1.15],[2.4,-1.15],[3.2,-1.15],[4.6,-.95],[5.0,-.55]],-.45,.3,H); // head block
 m.ext([[4.6,.4],[3.4,.9],[2.5,.9],[2.5,-.9],[3.4,-.9],[4.6,-.4]],.3,.42,N); // pitched roof
 const bar=[],bar2=[];for(let i=0;i<=8;i++){const y=-1.9+3.8*i/8,k=(y/1.9)**2;bar.push([2.85-.6*k,y]);bar2.push([2.0-.6*k,y])}
 m.ext(bar.concat(bar2.reverse()),-.15,.32,N); // crescent bar across the head
 m.ell([2.45,0,.32],[.34,.34,.3],L,0,12,6);m.ell([2.2,.3,.45],[.08,.08,.08],D,0,6,4);
 m.ext([[3.0,.7],[1.1,.7],[-.1,1.5],[-.1,-1.5],[1.1,-.7],[3.0,-.7]],-.4,.12,H); // tapered neck, running forward into the head so the two are joined
 m.ext([[-.1,1.5],[-2.7,1.5],[-2.7,-1.5],[-.1,-1.5]],-.5,.3,H);m.ext([[-.4,1.2],[-2.4,1.2],[-2.4,-1.2],[-.4,-1.2]],.3,.36,N); // rear hull
 for(let i=0;i<8;i++)m.box([-2.72,-1.2+i*.34,-.1],[.06,.2,.3],D); // rear vents
 m.sym(sd=>{const y=sd*.64,z=.56;
  m.ell([.52,y,z],[.16,.28,.28],GL.red,1,14,8);m.cyl([.5,y,z],[.35,y,z],.31,.31,D,16);m.cyl([.5,y,z],[-4.0,y,z],.26,.26,H,16,H);
  m.box([-3.2,y,z+.2],[1.2,.2,.1],N);m.cyl([-4.0,y,z],[-4.2,y,z],.3,.3,D,16);m.cyl([-4.2,y,z],[-4.9,y,z],.26,.15,N,12,GL.blue,2); // front dome red, rear exhaust blue
  m.cyl([4.3,sd*1.45,-.05],[2.8,sd*1.45,-.05],.11,.11,H,10,GL.red,1);m.cyl([2.8,sd*1.45,-.05],[2.6,sd*1.45,-.05],.13,.13,D,10,GL.blue,2)}); // forward pods
 return m}
 function fedNewCL(){ // [S-FED] Federation "new" light cruiser from the user's references: no secondary hull; broad saucer with a stepped central tower, nacelles on boxy mounts at the saucer's rear edge with their domes over the rear deck. x fwd, y lateral, z up.
 const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',L='#eef0f8',cx=2.3,R=2.5,ny=1.2,nz=.66;
 const circ=r=>{const p=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;p.push([cx+r*Math.cos(t),r*Math.sin(t)])}return p};
 [[1,-.13,.1,H],[.97,.1,.15,H],[.85,.15,.2,N],[.9,-.22,-.13,D],[.65,-.3,-.22,D],[.4,-.34,-.3,N]].forEach(l=>m.ext(circ(R*l[0]),l[1],l[2],l[3])); // saucer: rim, shallow top, stepped underside
 m.ext(circ(.94),.2,.3,H);m.ext(circ(.55),.3,.5,N);m.ell([cx,0,.5],[.25,.25,.22],L,0,12,6);m.ell([cx,0,.62],[.1,.1,.08],D,0,8,4); // central tower: two tiers, dome, cap
 for(let i=0;i<10;i++){const t=i/10*Math.PI*2;m.ell([cx+R*.93*Math.cos(t),R*.93*Math.sin(t),.14],[.07,.07,.07],D,0,6,4)} // rim lights
 m.cyl([cx,0,-.34],[cx,0,-.5],.08,.08,D,8);m.cyl([cx-.04,0,-.55],[cx+.06,0,-.55],.2,.2,L,16,D); // small deflector disc under the saucer
 // rear deck, nacelle mounts and nacelles
 m.ext([[cx-1.2,-.9],[cx-1.2,.9],[-.9,1.7],[-.9,-1.7]],.12,.22,N);
 m.extY([[1.1,.2],[-.9,.2],[-.9,.5],[.2,.32]],-.45,.45,H);
 m.sym(sd=>{m.box([-.1,sd*ny,.27],[1.1,.8,.3],D);m.box([-.1,sd*ny,.27],[1.0,.72,.34],N); // nacelle mount box
  m.ell([1.0-.3,sd*ny,nz],[.16,.31,.31],GL.red,1,14,8);m.cyl([.7,sd*ny,nz],[.62,sd*ny,nz],.36,.36,D,16); // red front dome and ring
  m.cyl([.7,sd*ny,nz],[-3.6,sd*ny,nz],.3,.3,H,16,H);m.cyl([-3.6,sd*ny,nz],[-3.75,sd*ny,nz],.35,.35,D,16);
  m.cyl([-3.75,sd*ny,nz],[-4.1,sd*ny,nz],.3,.17,N,12,GL.blue,2); // tapered rear, blue exhaust
  m.box([-2.0,sd*ny,nz+.3],[1.0,.2,.05],D)});
 return m}
 function fedDN(){ // [S-FED] Federation DN from the user's references: conical saucer, slanted neck, secondary hull, one dorsal nacelle on a short pylon and two nacelles on flat horizontal pylons at the secondary hull's sides.
 const m=new Mesh(),H='#d9deee',D='#8c94b3',N='#c9cfe2',L='#eef0f8',cx=3.75,R=2.25,zH=-1.4;
 const circ=r=>{const p=[];for(let i=0;i<32;i++){const t=i/32*Math.PI*2;p.push([cx+r*Math.cos(t),r*Math.sin(t)])}return p};
 m.disc(cx,R,[[0,.58,-.58],[.3,.56,-.52],[.45,.5,-.47],[.6,.4,-.4],[.75,.3,-.32],[.9,.2,-.22],[1,.1,-.12]],H,D); // conical saucer, smooth slope

 m.ell([cx,0,.56],[.3,.3,.18],L,0,12,6);m.ell([cx,0,-.55],[.28,.28,.16],D,0,10,5);
 for(let i=0;i<8;i++){const t=i/8*Math.PI*2;m.ell([cx+R*.93*Math.cos(t),R*.93*Math.sin(t),.12],[.07,.07,.07],D,0,6,4)}
 m.extY([[1.7,-.2],[.5,-.2],[-.5,-.95],[.55,-1.0]],-.45,.45,H); // slanted neck
 m.cyl([-2.3,0,zH],[1.3,0,zH],.56,.56,H,20,N);m.cyl([-3.85,0,zH+.1],[-2.3,0,zH],.3,.56,H,20,D); // secondary hull with tapering tail
 m.cyl([1.3,0,zH],[1.45,0,zH],.5,.5,L,20,D);m.ell([1.45,0,zH],[.11,.27,.27],GL.blue,1,10,5); // deflector dish
 const nac=(xf,y,z,xr)=>{m.ell([xf-.3,y,z],[.16,.28,.28],GL.red,1,14,8);m.cyl([xf-.3,y,z],[xr+.7,y,z],.27,.27,H,16,H);m.cyl([xf-.45,y,z],[xf-.58,y,z],.31,.31,D,16);m.cyl([xr+.7,y,z],[xr+.55,y,z],.31,.31,D,16);m.cyl([xr+.55,y,z],[xr,y,z],.27,.16,N,12,GL.blue,2);m.box([xf-1.8,y,z+.28],[1.0,.18,.05],D)}; // red front dome, ringed tube, tapered blue-exhaust rear
 nac(2.07,0,.9,-3.56);m.extY([[1.5,.1],[.9,.1],[.35,.65],[.8,.65]],-.22,.22,H); // dorsal nacelle and its short pylon
 m.sym(sd=>{nac(-.26,sd*1.68,-1.1,-5.98);m.box([-1.4,sd*1.1,-1.1],[1.4,1.2,.2],N);m.box([-1.4,sd*1.1,-1.0],[1.2,1.0,.05],D)}); // lower nacelles on flat pylons
 return m}
 function oriModel(){const m=new Mesh(),C=['#9a6a3a','#c08a4e','#7d5530'];m.ext([[4.6,0],[1.3,1.0],[-1.8,1.0],[-3.4,.7],[-3.4,-.7],[-1.8,-1.0],[1.3,-1.0]],-.35,.4,C[0]);m.sym(s=>{m.ext([[1.4,s*1.0],[-.4,s*3.1],[-2.8,s*3.1],[-2.8,s*1.0]],-.12,.12,C[1]);m.ext([[-1.2,s*3.1],[-1.8,s*3.4],[-3.2,s*3.4],[-3.2,s*3.1]],-.2,.2,C[2])});return m}
function civModel(big){const m=new Mesh(),C=['#8b95a1','#a9b3bf','#6f7883'];const w=big?1.5:1.1,L=big?4.2:3.2;m.ext([[L,0],[L-.9,w*.8],[L-1.6,w*.8],[-L,w],[-L,-w],[L-1.6,-w*.8],[L-.9,-w*.8]],-.5,.5,C[0]);m.ext([[L-.4,0],[L-1.2,w*.55],[L-1.2,-w*.55]],.5,.9,C[1]);m.sym(s=>{m.ext([[-L+.3,s*w],[-L+.3,s*(w+.5)],[-L-1.2,s*(w+.5)],[-L-1.2,s*w]],-.25,.25,C[2])});return m}
function baseModel(){const m=new Mesh(),C=['#8d7fb0','#b9a3e3','#6a5d8a'];const hx=(r)=>[0,1,2,3,4,5].map(i=>[r*Math.cos(i*Math.PI/3),r*Math.sin(i*Math.PI/3)]);m.ext(hx(1.9),-.6,.6,C[0]);m.ext(hx(.9),.6,1.4,C[1]);[0,2,4].forEach(i=>{const a=i*Math.PI/3+Math.PI/6,cx=Math.cos(a)*2.6,cy=Math.sin(a)*2.6;m.ext(hx(.8).map(p=>[p[0]+cx,p[1]+cy]),-.4,.4,C[2])});return m}
function buildShip(k){const sd=SHIPS[k].side;let m;
 if(DEFS[k].q)m=civModel(/L$/.test(k));else if(sd==='fed')m=(k==='DD'||k==='SC')?fedDD():(k==='DN'||k==='BT')?fedDN():k==='CL'?fedOldCL():k==='CA'?fedCC({wp:.46}):k==='CC'?fedCC({wp:.9}):fedModel(FED[k]||FED.CA);
 else if(sd==='kli')m=kliModel(KLI[k]||KLI.D7);
 else if(sd==='rom')m=(k==='WE'||k==='WB')?romModel({w:4.3}):kliModel(k==='KR'?KLI.D6:KLI.F5,ROMG);
 else if(sd==='kzi')m=kzModel({k:(k==='KFF'||k==='EFF')?'ff':(k==='KBC'||k==='KCC'||k==='CV')?'bc':'cl'}) // [S-KZI] CC reference matches the BC hull;
 else if(sd==='gor')m=k==='GCA'?gorCA():gorModel({cl:k==='GCL'});
 else if(sd==='ori')m=oriModel();
 else if(sd==='civ')m=civModel(k==='FL');
 else if(sd==='bas')m=baseModel();
 else m=thoModel({plus:k==='TPP'});
 let sc={KFF:.8,EFF:.8,KCL:.95,KBC:1.1,KCC:1.12,GDD:.82,GDF:.9,GCL:.95}[k]||1;
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];m.f.forEach(f=>f.v.forEach(p=>{for(let i=0;i<3;i++){if(p[i]<mn[i])mn[i]=p[i];if(p[i]>mx[i])mx[i]=p[i]}}));
 if(sd==='fed'&&(k==='DD'||k==='SC'))sc=(mx[0]-mn[0])/11.95; // [S-FED] DD drawn at its real length relative to the CA
 if(sd==='kli'||(sd==='rom'&&k!=='WE'&&k!=='WB'))sc=(mx[0]-mn[0])/KD7(); // [S-KLI] drawn size follows the model's real length
  m.o=[0,1,2].map(i=>(mn[i]+mx[i])/2);m.R=Math.max(mx[0]-mn[0],mx[1]-mn[1],(mx[2]-mn[2])*1.6)/2/sc;m.floor=mn[2];m.Rv=(.8*(mx[1]-mn[1])/2+.6*(mx[2]-mn[2])/2)/sc;return m}
const V3STARS=Array.from({length:36},(_,i)=>[(i*73%97)/97,(i*41%89)/89,.4+((i*17)%5)/8]);
function v3draw(cv,m,yaw,pitch){const x=cv.getContext('2d'),W=cv.width,H=cv.height;
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a0e27');g.addColorStop(1,'#1b2252');x.fillStyle=g;x.fillRect(0,0,W,H);
 V3STARS.forEach(s=>{x.fillStyle='rgba(255,255,255,'+s[2]+')';x.fillRect(s[0]*W,s[1]*H,1.4,1.4)});
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),D=m.R*4.2,k=Math.min(Math.min(W,H*1.7)*.42/m.R,H*.4/(m.Rv||m.R)),o=m.o;
 const T=p=>{const X=p[0]-o[0],Y=p[1]-o[1],Z=p[2]-o[2],x1=X*cy-Y*sy,y1=X*sy+Y*cy,y2=y1*cp-Z*sp,z2=y1*sp+Z*cp,f=D/(D+y2);return[W/2+x1*f*k,H*.52-z2*f*k,y2]};
 x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(W/2,H*.52+m.R*k*.55*Math.cos(pitch)+ (1-Math.cos(pitch))*0,m.R*k*.8,m.R*k*.16*(.4+Math.sin(pitch)),0,0,7);x.fill();
 const Lv=[-.35,-.6,.72],out=[];
 m.f.forEach(f=>{const nx=f.n[0]*cy-f.n[1]*sy,ny0=f.n[0]*sy+f.n[1]*cy,ny=ny0*cp-f.n[2]*sp,nz=ny0*sp+f.n[2]*cp;if(ny>.02&&!f.e)return;
  const P=f.v.map(T);let d=0;P.forEach(p=>d+=p[2]);d/=P.length;const lt=Math.max(0,nx*Lv[0]+ny*Lv[1]+nz*Lv[2]);out.push({P,d,lt,f,ny})});
 out.sort((a,b)=>b.d-a.d);
 out.forEach(q=>{const f=q.f,sh=f.e?1.15:.32+.78*q.lt,c=f.c.map(v=>Math.min(255,Math.round(v*sh)));const s='rgb('+c[0]+','+c[1]+','+c[2]+')';
  x.beginPath();q.P.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle=s;x.fill();x.strokeStyle=s;x.lineWidth=.8;x.stroke()})}
function mount3d(){const cs=[...document.querySelectorAll('canvas.v3d')];
 cs.forEach(cv=>{const k=cv.dataset.k,who=cv.dataset.who,st=V3.st[who]=V3.st[who]||{yaw:-.7,pitch:.42,drag:0};cv._st=st;
  try{V3.cache[k]=V3.cache[k]||buildShip(k)}catch(e){return}cv._m=V3.cache[k];
  const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(60,Math.round(r.width*dpr));cv.height=Math.max(40,Math.round(r.height*dpr));
  cv.style.touchAction='none';
  cv.onpointerdown=e=>{st.drag=1;st.lx=e.clientX;st.ly=e.clientY;try{cv.setPointerCapture(e.pointerId)}catch(_){}};
  cv.onpointermove=e=>{if(!st.drag)return;st.yaw+=(e.clientX-st.lx)*.012;st.pitch=Math.max(-.2,Math.min(1.0,st.pitch+(e.clientY-st.ly)*.01));st.lx=e.clientX;st.ly=e.clientY;v3draw(cv,cv._m,st.yaw,st.pitch)};
  cv.onpointerup=cv.onpointercancel=()=>{st.drag=0};
  v3draw(cv,cv._m,st.yaw,st.pitch)});
 if(cs.length&&!V3.run){V3.run=true;requestAnimationFrame(v3loop)}}
function v3loop(){const cs=[...document.querySelectorAll('canvas.v3d')].filter(c=>c._m&&c.isConnected);if(started||!cs.length){V3.run=false;return}
 const still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 cs.forEach(cv=>{const st=cv._st;if(!st.drag&&!still)st.yaw+=.007;v3draw(cv,cv._m,st.yaw,st.pitch)});requestAnimationFrame(v3loop)}

{const d0=drawSel;drawSel=function(){d0();try{mount3d()}catch(e){}}}
setupMap();draw();
