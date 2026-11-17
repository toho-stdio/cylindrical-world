import { clamp, smoothstep } from './math.js';
import { MATERIAL } from './scene-contract.js';
import { MeshBuilder, normalize } from './geometry.js';

export const WORLD = Object.freeze({ radius: 140, length: 480, seed: 731942 });
export const AQUEDUCT = Object.freeze({ x: 22, span: .92, archCount: 3, openingRatio: .90, deckInset: 12.3, springInset: 2.5, crownInset: 10.6 });
const TAU = Math.PI * 2;
const hash = (x, z) => { const n = Math.sin(x * 127.1 + z * 311.7 + WORLD.seed) * 43758.5453; return n - Math.floor(n); };
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function noise(x, z) { const ix=Math.floor(x), iz=Math.floor(z), fx=x-ix, fz=z-iz, u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz); const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u, b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u; return a*(1-v)+b*v; }
function wrappedNoise(x, theta, scale, lobes) { let p=((theta+Math.PI)/TAU*lobes)%lobes; if(p<0)p+=lobes; const i=Math.floor(p),f=p-i,u=f*f*(3-2*f); return noise(x*scale,i)*(1-u)+noise(x*scale,(i+1)%lobes)*u; }
export function terrainHeight(x, theta) {
  return (wrappedNoise(x,theta,.021,48)-.5)*4.5 + (wrappedNoise(x,theta,.067,120)-.5)*1.1 + (wrappedNoise(x,theta,.19,240)-.5)*.22 + Math.sin(x*.009+theta*2)*.7 + Math.sin(theta*3)*.35;
}
export function daylightAt(x) { return clamp(1-smoothstep(-220,240,x),0,1); }

const palettes = { terrain:[[.27,.36,.25],[.29,.37,.26],[.32,.39,.27],[.27,.36,.28]], stone:[[.47,.40,.30],[.57,.49,.37],[.66,.57,.43]], wood:[[.23,.15,.095],[.35,.23,.14],[.47,.31,.19]], leaves:[[.12,.27,.15],[.19,.36,.19],[.28,.43,.22],[.37,.43,.23]],
  roof:[[.29,.13,.095],[.35,.16,.12],[.41,.21,.15]] };
export function createWorld() {
  const mesh=new MeshBuilder(180_000), rand=rng(WORLD.seed);
  const surface=(x,t,offset=0)=>{ const r=WORLD.radius-terrainHeight(x,t)-offset; return [x,Math.cos(t)*r,Math.sin(t)*r]; };
  const normalAt=(x,t)=>{ const e=.025, px=surface(x+e,t),mx=surface(x-e,t),pt=surface(x,t+e),mt=surface(x,t-e); const a=px.map((v,i)=>v-mx[i]),b=pt.map((v,i)=>v-mt[i]); let n=normalize([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]); if(n[1]*Math.cos(t)+n[2]*Math.sin(t)>0)n=n.map(v=>-v); return n; };
  const surfaceQuad=(x0,t0,x1,t1,color,material,offset=0)=>mesh.quad(surface(x0,t0,offset),surface(x1,t0,offset),surface(x1,t1,offset),surface(x0,t1,offset),color,material,{normals:[normalAt(x0,t0),normalAt(x1,t0),normalAt(x1,t1),normalAt(x0,t1)]});
  const point=(x,t,a,b,c)=>{ const r=WORLD.radius-terrainHeight(x,t)-a, ang=t+c/(WORLD.radius-terrainHeight(x,t)); return [x+b,Math.cos(ang)*r,Math.sin(ang)*r]; };
  const worldNormal=(x,t,n)=>normalize([n[0],-Math.cos(t)*n[1]-Math.sin(t)*n[2],-Math.sin(t)*n[1]+Math.cos(t)*n[2]]);
  const flat=(p,q,r,color,mat,wind=0,phase=0)=>mesh.tri(p,q,r,color,mat,{wind,phase});
  const quad=(p,q,r,s,color,mat)=>mesh.quad(p,q,r,s,color,mat);
  const addBox=(x,t,dx,up,dz,color,mat=MATERIAL.WOOD,offset=.06)=>{
    const p=(a,b,c)=>point(x,t,offset+b,a,c);
    const a=p(-dx/2,0,-dz/2),b=p(dx/2,0,-dz/2),c=p(dx/2,up,-dz/2),d=p(-dx/2,up,-dz/2),e=p(-dx/2,0,dz/2),f=p(dx/2,0,dz/2),g=p(dx/2,up,dz/2),h=p(-dx/2,up,dz/2);
    quad(a,b,c,d,color,mat);quad(f,e,h,g,color,mat);quad(a,e,f,b,color,mat);quad(d,c,g,h,color,mat);quad(a,d,h,e,color,mat);quad(b,f,g,c,color,mat);
  };
  const cylinder=(x,t,height,radius,color,mat,segments=8,offset=.08)=>{
    for(let k=0;k<segments;k++){const a=k*TAU/segments,b=(k+1)*TAU/segments;
      const p=(h,ang)=>point(x,t,offset+h,Math.cos(ang)*radius,Math.sin(ang)*radius);
      const lo=p(0,a),lo2=p(0,b),hi=p(height,a),hi2=p(height,b);
      const na=worldNormal(x,t,[Math.cos(a),0,Math.sin(a)]),nb=worldNormal(x,t,[Math.cos(b),0,Math.sin(b)]);
      mesh.quad(lo,lo2,hi2,hi,color,mat,{normals:[na,nb,nb,na]}); }
  };
  const ellipsoid=(x,t,cx,cy,cz,rx,ry,rz,color,mat,wind=0,phase=rand())=>{
    const lat=mat===MATERIAL.LEAF?5:6,lon=mat===MATERIAL.LEAF?8:10;
    const v=(i,j)=>{const ph=-Math.PI/2+Math.PI*i/lat,th=TAU*j/lon,rough=mat===MATERIAL.LEAF?1+.12*Math.sin(th*3+phase*7)*Math.cos(ph*4)+.045*Math.sin(th*5-phase*9):1;const n=[Math.cos(ph)*Math.cos(th)/rx,Math.sin(ph)/ry,Math.cos(ph)*Math.sin(th)/rz];return {p:point(x,t,cy+Math.sin(ph)*ry*rough,cx+Math.cos(ph)*Math.cos(th)*rx*rough,cz+Math.cos(ph)*Math.sin(th)*rz*rough),n:worldNormal(x,t,normalize(n))};};
    for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=v(i,j),b=v(i,j+1),c=v(i+1,j+1),d=v(i+1,j); mesh.tri(a.p,b.p,c.p,color,mat,{normals:[a.n,b.n,c.n],wind,phase});mesh.tri(a.p,c.p,d.p,color,mat,{normals:[a.n,c.n,d.n],wind,phase});}
  };
  // Coherent macro relief and broad meadow/woodland color regions, sampled on a closed cylinder.
  const nx=260,nt=112,dx=WORLD.length/nx,dt=TAU/nt;
  for(let i=0;i<nx;i++)for(let j=0;j<nt;j++){
    const x=-WORLD.length/2+i*dx,t=-Math.PI+j*dt,x2=x+dx,t2=t+dt;
    const tint=(xx,tt)=>{
      const region=wrappedNoise(xx*.38,tt,.023,48),detail=(wrappedNoise(xx,tt,.15,144)-.5)*.025;
      let lo=0,hi=1,q;
      if(region<.30){lo=0;hi=1;q=smoothstep(0,.30,region);}
      else if(region<.68){lo=1;hi=2;q=smoothstep(.30,.68,region);}
      else if(region<.86){lo=2;hi=3;q=smoothstep(.68,.86,region);}
      else {lo=3;hi=0;q=smoothstep(.86,1,region);}
      const base=palettes.terrain[lo].map((v,k)=>v*(1-q)+palettes.terrain[hi][k]*q);
      const h=terrainHeight(xx,tt),slope=(Math.abs(terrainHeight(xx+.3,tt)-terrainHeight(xx-.3,tt))+.25)*.12,meadow=Math.max(0,Math.cos(tt));
      return [base[0]+detail+slope*.08,base[1]+detail+meadow*.035-slope*.1,base[2]+detail+slope*.035];
    };
    const ca=tint(x,t),cb=tint(x2,t),cc=tint(x2,t2),cd=tint(x,t2);
    mesh.quad(surface(x,t),surface(x2,t),surface(x2,t2),surface(x,t2),ca,MATERIAL.TERRAIN,{colors:[ca,cb,cc,cd],normals:[normalAt(x,t),normalAt(x2,t),normalAt(x2,t2),normalAt(x,t2)]});
  }
  const riverCenter=x=>.03+Math.sin(x*.016)*.105+Math.sin(x*.047+1.2)*.025;
  // Earthen banks, dark river bed and low-gloss water ribbon. Tighter center strip avoids broad neon carpet.
  const riverWidth=x=>.033+.009*(.5+.5*Math.sin(x*.031));
  for(let i=0;i<320;i++){const x=-225+i*1.42,x2=x+1.42,t=riverCenter(x),t2=riverCenter(x2),w=riverWidth(x),w2=riverWidth(x2);
    surfaceQuad(x,t-w*1.5,x2,t2-w2*1.5,[.29,.30,.20],MATERIAL.PATH,.22);
    // Shared endpoint widths keep adjacent ribbons edge-matched (no terrain leaks at segment joints).
    mesh.quad(surface(x,t-w,.34),surface(x2,t2-w2,.34),surface(x2,t2+w2,.34),surface(x,t+w,.34),[.055,.19,.22],MATERIAL.WATER,{normals:[normalAt(x,t),normalAt(x2,t2),normalAt(x2,t2),normalAt(x,t)] ,phase:i/320});
  }
  // Continuous narrow footpaths linking homes and clearings; endpoint widths are shared across segments.
  const pathCenter=(x,side)=>riverCenter(x)+side*(.095+.018*Math.sin(x*.09));
  const pathWidth=(x,side)=>.0065+.002*(.5+.5*Math.sin(x*.14+side));
  const pathRoutes=[[-192,-144,1],[-125,-72,-1],[-65,-32,1],[72,115,-1],[130,177,1]];
  for(const [start,end,side] of pathRoutes)for(let x=start;x<end;x+=1.1){
    const x2=x+1.1,t0=pathCenter(x,side),t1=pathCenter(x2,side),w0=pathWidth(x,side),w1=pathWidth(x2,side);
    mesh.quad(surface(x,t0-w0,.09),surface(x2,t1-w1,.09),surface(x2,t1+w1,.09),surface(x,t0+w0,.09),[.40,.34,.24],MATERIAL.PATH,{normals:[normalAt(x,t0),normalAt(x2,t1),normalAt(x2,t1),normalAt(x,t0)]});
  }
  // Winding stone bridge with deck laid across the river and masonry abutments.
  const bridgeX=-140,bt=riverCenter(bridgeX);for(let k=0;k<13;k++){const x=bridgeX-7.2+k*1.2, rise=.28+.35*Math.sin(k/12*Math.PI);addBox(x,bt,1.25,rise,6.4,[.43,.36,.26],MATERIAL.STONE,.2);}
  for(const s of [-1,1])addBox(bridgeX,bt+s*.29,15,.42,.3,[.55,.43,.29],MATERIAL.STONE,.52);
  // High-quality clustered trees: tapered trunks, angled boughs and overlapping smooth crowns.
  const limb=(x,t,from,to,r0,r1,color)=>{
    const d=normalize([to[0]-from[0],to[1]-from[1],to[2]-from[2]]), side=normalize([0,-d[2],d[1]]), other=normalize([d[1]*side[2]-d[2]*side[1],d[2]*side[0]-d[0]*side[2],d[0]*side[1]-d[1]*side[0]]), n=7;
    const ring=(p,r,k)=>{const a=k*TAU/n,local=side.map((v,i)=>v*Math.cos(a)*r+other[i]*Math.sin(a)*r);return {p:point(x,t,.1+p[1],p[0]+local[0],p[2]+local[2]),n:worldNormal(x,t,normalize(local))};};
    for(let k=0;k<n;k++){const a=ring(from,r0,k),b=ring(from,r0,k+1),c=ring(to,r1,k+1),e=ring(to,r1,k);mesh.quad(a.p,b.p,c.p,e.p,color,MATERIAL.WOOD,{normals:[a.n,b.n,c.n,e.n]});}
  };
  const leafShell=(x,t,cx,cy,cz,rx,ry,rz,color,seed,wind=.42,sides=12,levels=6,lobes=4)=>{
    // One connected, vertically asymmetric crown with a broken perimeter (not a stack of spheres).
    const profile=[.34,.58,.79,.94,1,.96,.83,.63,.34],vertices=[];
    for(let j=0;j<=levels;j++){
      const v=-1+2*j/levels,band=profile[j],ring=[];
      for(let k=0;k<sides;k++){
        const a=TAU*k/sides,warp=1+.12*Math.sin(a*lobes+seed*TAU+v*1.7)+.065*Math.sin(a*(lobes+2)-seed*8+v*2.4)+.035*Math.cos(a*7+seed*5);
        const lift=.10*ry*Math.sin(a*lobes+seed*7)*Math.sin((v+1)*Math.PI/2);
        const side=band*warp,localX=cx+rx*side*Math.cos(a),localZ=cz+rz*side*Math.sin(a);
        const normal=worldNormal(x,t,normalize([Math.cos(a)/rx,(v+.08*Math.cos(a*lobes+seed*7))/ry,Math.sin(a)/rz]));
        ring.push({p:point(x,t,cy+ry*v+lift,localX,localZ),n:normal});
      }
      vertices.push(ring);
    }
    for(let j=0;j<levels;j++)for(let k=0;k<sides;k++){
      const k2=(k+1)%sides,q=.90+.16*hash(k+seed*13,j+seed*17),tone=color.map(c=>c*q),w=wind*(.25+.75*j/levels);
      const a=vertices[j][k],b=vertices[j][k2],c=vertices[j+1][k2],d=vertices[j+1][k];
      mesh.quad(a.p,b.p,c.p,d.p,tone,MATERIAL.LEAF,{normals:[a.n,b.n,c.n,d.n],wind:w,phase:seed});
    }
    const bottom=point(x,t,cy-ry,cx,cz),top=point(x,t,cy+ry,cx,cz);
    const bottomNormal=worldNormal(x,t,[0,-1,0]),topNormal=worldNormal(x,t,[0,1,0]);
    for(let k=0;k<sides;k++){const k2=(k+1)%sides;mesh.tri(bottom,vertices[0][k].p,vertices[0][k2].p,color,MATERIAL.LEAF,{normals:[bottomNormal,bottomNormal,bottomNormal],wind,phase:seed});mesh.tri(top,vertices[levels][k2].p,vertices[levels][k].p,color,MATERIAL.LEAF,{normals:[topNormal,topNormal,topNormal],wind,phase:seed});}
  };
  const coniferShell=(x,t,height,radius,color,seed)=>{
    // A single tapered, irregular branch envelope; angular whorls scallop one continuous crown.
    const rings=8,sides=12,points=[];
    for(let j=0;j<=rings;j++){
      const q=j/rings,r=radius*(.025+.975*Math.pow(1-q,.80))*(.96+.025*Math.sin(q*TAU*5+seed*9)),ring=[];
      for(let k=0;k<sides;k++){
        const a=TAU*k/sides,whorl=1+.14*Math.sin(a*5+q*9+seed*5)+.07*Math.cos(a*3-q*7-seed*8)+.035*Math.sin(a*7+q*19);
        ring.push(point(x,t,height*(.24+.75*q),Math.cos(a)*r*whorl,Math.sin(a)*r*whorl));
      }
      points.push(ring);
    }
    for(let j=0;j<rings;j++)for(let k=0;k<sides;k++){
      const k2=(k+1)%sides,q=.84+.20*hash(j+seed*11,k+seed*23),tone=color.map(c=>c*q);
      mesh.quad(points[j][k],points[j][k2],points[j+1][k2],points[j+1][k],tone,MATERIAL.LEAF,{wind:.26,phase:seed});
    }
    const base=point(x,t,height*.24,0,0);for(let k=0;k<sides;k++)mesh.tri(base,points[0][(k+1)%sides],points[0][k],color,MATERIAL.LEAF,{wind:.16,phase:seed});
  };
  const plantTuft=(x,t,s,color,count=7)=>{
    const seed=rand();
    for(let i=0;i<count;i++){
      const a=TAU*i/count+seed*.7,len=s*(.48+rand()*.43),height=s*(.62+rand()*.62),width=s*(.075+rand()*.045),dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx;
      const base=point(x,t,.08,0,0),mid=point(x,t,.08+height*.62,dx*len*.42,dz*len*.42),tip=point(x,t,.08+height,dx*len,dz*len),left=point(x,t,.08+height*.62,dx*len*.42+px*width,dz*len*.42+pz*width),right=point(x,t,.08+height*.62,dx*len*.42-px*width,dz*len*.42-pz*width);
      const tint=.82+.32*rand(),blade=color.map(c=>c*tint);
      mesh.tri(base,left,tip,blade,MATERIAL.GRASS,{wind:.85,phase:seed});mesh.tri(base,tip,right,blade,MATERIAL.GRASS,{wind:.85,phase:seed});mesh.tri(left,mid,tip,blade,MATERIAL.GRASS,{wind:.85,phase:seed});mesh.tri(mid,right,tip,blade,MATERIAL.GRASS,{wind:.85,phase:seed});
    }
  };
  const leaf=(x,t,root,axis,length,width,color,phase)=>{
    const d=normalize(axis),side=normalize([d[2],.18,-d[0]]),fold=normalize([side[0]*.32+d[0]*.16,.92,side[2]*.32+d[2]*.16]);
    const at=(u,v,raise)=>point(x,t,root[1]+d[1]*u+side[1]*v+raise,root[0]+d[0]*u+side[0]*v,root[2]+d[2]*u+side[2]*v);
    const base=at(0,0,0),tip=at(length,0,0),left=at(length*.48,width,0),right=at(length*.48,-width,0),ridge=at(length*.49,0,width*.24);
    const n1=worldNormal(x,t,fold),n2=worldNormal(x,t,fold.map(v=>-v));
    mesh.tri(base,left,ridge,color,MATERIAL.LEAF,{normals:[n1,n1,n1],wind:.62,phase});mesh.tri(left,tip,ridge,color,MATERIAL.LEAF,{normals:[n1,n1,n1],wind:.62,phase});
    mesh.tri(base,ridge,right,color,MATERIAL.LEAF,{normals:[n2,n2,n2],wind:.62,phase});mesh.tri(right,ridge,tip,color,MATERIAL.LEAF,{normals:[n2,n2,n2],wind:.62,phase});
  };
  const tree=(x,t,s=1,kind='broadleaf')=>{
    const height=s*(kind==='pine'?7.1:5.4),crown=(kind==='pine'?s*1.4:s*2.25)*(.82+rand()*.38),seed=rand();
    const detailed=kind!=='pine'&&((x>-174&&x<-160)||(x>74&&x<115&&(t>.60&&t<.70||t>.83&&t<.91))||(x>77&&x<89&&t>.40&&t<.49));
    cylinder(x,t,height*(kind==='pine'?.67:.56),s*.15,[.28,.18,.105],MATERIAL.WOOD,9,.1);
    if(kind==='pine'){
      coniferShell(x,t,height,crown,[.12,.29,.16],seed);
    } else {
      const colors=kind==='blossom'?[[.38,.26,.21],[.57,.38,.35],[.72,.53,.45]]:kind==='fruit'?[[.13,.27,.14],[.22,.38,.18],[.34,.43,.23]]:palettes.leaves;
      const crownY=height*(.55+rand()*.06);
      if(detailed){
        // Selected hero trees use a high, full-width branching scaffold. Shell crowns
        // remain the distance LOD; each open scaffold carries leaves through its canopy
        // volume instead of leaving only a sparse lower ring of pruned twigs.
        const limbs=8;
        for(let b=0;b<limbs;b++){
          const a=TAU*b/limbs+seed*.7,y=height*(.36+(b%4)*.10),reach=s*(1.34+.38*rand());
          const end=[Math.cos(a)*reach,y+s*(.62+.42*rand()),Math.sin(a)*reach];
          limb(x,t,[0,y,0],end,s*.14,s*.032,[.29,.19,.10]);
          for(let twig=0;twig<3;twig++){
            const u=.24+twig*.29,root=[end[0]*u,y+(end[1]-y)*u,end[2]*u],side=(twig%2?1:-1),twigReach=s*(.52+.20*rand()),twigEnd=[root[0]+Math.cos(a+side*.9)*twigReach,root[1]+s*(.42+.30*rand()),root[2]+Math.sin(a+side*.9)*twigReach];
            limb(x,t,root,twigEnd,s*.045,s*.011,[.34,.22,.12]);
            const axis=[twigEnd[0]-root[0],twigEnd[1]-root[1],twigEnd[2]-root[2]];
            for(let j=0;j<17;j++){
              const q=.08+j*.058,anchor=root.map((v,k)=>v+axis[k]*q),sign=(j+twig+b)%2?1:-1,angle=a+sign*(.55+.35*rand()),len=s*(.42+.22*rand()),tone=colors[Math.floor(rand()*colors.length)].map(c=>c*(.84+rand()*.36));
              leaf(x,t,anchor,[Math.cos(angle)*.8,.28+rand()*.72,Math.sin(angle)*.8],len,len*.32,tone,rand());
            }
          }
        }
      }else{
        for(let b=0;b<5;b++){const y=height*(.30+b*.09),a=TAU*b/5+seed,reach=s*(1.25+.55*rand());limb(x,t,[0,y,0],[Math.cos(a)*reach,y+s*(.34+.20*rand()),Math.sin(a)*reach],s*.115,s*.028,[.32,.20,.11]);}
        const crownY=height*(.55+rand()*.06),shape=.86+rand()*.34,rx=crown*(kind==='fruit'?.98:1.12)*shape,ry=s*(kind==='fruit'?1.12:1.24)*(.84+rand()*.34),rz=crown*(kind==='fruit'?.90:1.02)*(.86+rand()*.28),lobes=3+Math.floor(rand()*4);
        leafShell(x,t,0,crownY,0,rx,ry,rz,colors[1],seed,.38,12,6,kind==='blossom'?5:lobes);
      }
      if(kind==='fruit')for(let k=0;k<7;k++){const a=TAU*k/7+seed,r=crown*.66,yy=crownY+s*(rand()-.5);ellipsoid(x,t,Math.cos(a)*r,yy,Math.sin(a)*r,.09*s,.11*s,.09*s,k%2?[.72,.29,.13]:[.85,.62,.20],MATERIAL.FLOWER,.08,rand());}
      if(kind==='blossom')for(let i=0;i<12;i++){const a=rand()*TAU,r=rand()*crown*.72,yy=crownY+(rand()-.5)*s*1.4;ellipsoid(x,t,Math.cos(a)*r,yy,Math.sin(a)*r,.11*s,.10*s,.11*s,[.95,.73,.64],MATERIAL.FLOWER,.32,rand());}
    }
  };
  // Forests are deliberately in lobed clumps; preserve view corridors across river and bridge.
  const groves=[[-211,-.70,17],[-192,.77,18],[-136,-.67,16],[-120,.78,19],[-85,.75,18],[-62,-.72,17],[-12,.78,20],[51,-.78,16],[76,.79,22],[112,-.76,18],[144,.72,18],[187,-.76,17],[211,.70,17]];
  for(const [cx,ct,n] of groves)for(let i=0;i<n;i++){const x=cx+(rand()-.5)*22,t=ct+(rand()-.5)*.25;if(Math.abs(x+167)<11&&Math.abs(t-.6)<.2)continue;const kind=rand()<.24?'pine':Math.abs(x-92)<24&&rand()<.26?'blossom':rand()<.16?'fruit':'broadleaf';tree(x,t,.72+rand()*.62,kind);}
  // Orchard rows at the named stop, fruit trees spaced intentionally with flower underplanting.
  for(let row=0;row<3;row++)for(let col=0;col<9;col++){const x=75+col*4.7+(rand()-.5)*.8,t=.44+row*.21+(rand()-.5)*.035,kind=(row+col)%7===0?'blossom':(row+col)%4===0?'broadleaf':'fruit';tree(x,t,.62+rand()*.48,kind);}
  // Young edge trees and a few upright conifers break the orchard's parallel rows and fill its gaps.
  for(const [x,t,s,kind] of [[70,.34,.52,'pine'],[80,.97,.53,'fruit'],[88,.28,.58,'broadleaf'],[97,.96,.50,'blossom'],[106,.31,.56,'pine'],[114,.98,.52,'fruit'],[121,.62,.48,'broadleaf'],[91,.77,.45,'pine']])tree(x,t,s,kind);
  // Mixed-height grasses and fern-like blades break the orchard floor into planted pockets.
  for(let i=0;i<56;i++){const x=70+rand()*53,t=.29+rand()*.72;plantTuft(x,t,.48+rand()*.42,rand()<.5?[.20,.36,.15]:[.28,.40,.18],6+Math.floor(rand()*4));}
  // Home geometry: grounded plaster/stone cottages, thick tiled roofs, exposed rafters, windows, porch and chimney.
  const lights=[];
  const cottage=(x,t,s=1,style=0)=>{
    const w=4.3*s,d=3.2*s,e=2.25*s,r=3.55*s, base=.08;
    // Gable volume on two long walls plus end triangles.
    const p=(a,b,c)=>point(x,t,base+b*s,a*s,c*s), plaster=style?[.64,.53,.37]:[.73,.64,.48], stone=[.39,.33,.25];
    const a=p(-w,0,-d),b=p(w,0,-d),c=p(w,e,-d),dd=p(-w,e,-d),E=p(-w,0,d),f=p(w,0,d),g=p(w,e,d),h=p(-w,e,d),rf=p(0,r,-d),rb=p(0,r,d);
    quad(a,b,c,dd,plaster,MATERIAL.TERRAIN);quad(f,E,h,g,plaster,MATERIAL.TERRAIN);quad(a,E,h,dd,plaster,MATERIAL.TERRAIN);quad(b,c,g,f,plaster,MATERIAL.TERRAIN);
    mesh.tri(dd,c,rf,plaster,MATERIAL.TERRAIN);mesh.tri(h,rb,g,plaster,MATERIAL.TERRAIN);
    // Roof slab has underside, broad eaves, overhang, and raised standing-seam/tile courses.
    const roof=palettes.roof[style%3], over=d+.42*s, ea=p(-w-.42*s,e,-over),eb=p(w+.42*s,e,-over),ec=p(0,r+.10*s,-over),fa=p(-w-.42*s,e,over),fb=p(w+.42*s,e,over),fc=p(0,r+.10*s,over);
    quad(ea,ec,fc,fa,roof,MATERIAL.ROOF);quad(ec,eb,fb,fc,[roof[0]*.82,roof[1]*.82,roof[2]*.82],MATERIAL.ROOF);
    for(const side of [-1,1])for(let row=1;row<=5;row++){
      const q=row/6,xedge=side*(w+.42*s)*(1-q),y=e+(r+.1-e)*q+.035*s,z0=-over,z1=over;
      const a=p(xedge,y,z0),b=p(xedge+side*.12,y,z0),c=p(xedge+side*.12,y,z1),d=p(xedge,y,z1);
      quad(a,b,c,d,[roof[0]*1.14,roof[1]*1.13,roof[2]*1.08],MATERIAL.ROOF);
    }
    // Eave fascia, ridge cap and timber framing.
    addBox(x,t,w*2*s,.16*s,.18*s,[.24,.16,.10],MATERIAL.WOOD,base+e*s);
    // Front door, framed divided windows, shutters, porch columns and steps.
    const panel=(cx,cy,ww,hh,color,mat=MATERIAL.WOOD,proud=0)=>{const z=-d-.035-(mat===MATERIAL.GLASS?.018:0)-proud;quad(p(cx-ww/2,cy,z),p(cx+ww/2,cy,z),p(cx+ww/2,cy+hh,z),p(cx-ww/2,cy+hh,z),color,mat);};
    panel(-.28*s,.02*s,.9*s,1.8*s,[.25,.16,.10]);
    for(const wx of [-2.45,2.45]){panel(wx*s,1.02*s,1.4*s,.97*s,[.24,.16,.10]);panel(wx*s,1.11*s,1.08*s,.79*s,[.22,.44,.48],MATERIAL.GLASS);panel(wx*s,1.11*s,.065*s,.79*s,[.35,.25,.15],MATERIAL.WOOD,.035);panel(wx*s,1.48*s,1.08*s,.065*s,[.35,.25,.15],MATERIAL.WOOD,.035);addBox(x,t,.12*s,1*s,.12*s,[.27,.19,.12],MATERIAL.WOOD,base+1*s);}
    // The axial-facing elevation is the one the opening river view encounters first.
    const sidePanel=(cz,cy,ww,hh,color,mat=MATERIAL.WOOD,proud=0)=>{const faceX=-w-.045-(mat===MATERIAL.GLASS?.018:0)-proud;quad(p(faceX,cy,cz-ww/2),p(faceX,cy,cz+ww/2),p(faceX,cy+hh,cz+ww/2),p(faceX,cy+hh,cz-ww/2),color,mat);};
    sidePanel(0,.02*s,1.12*s,1.82*s,[.25,.16,.10]);
    for(const wz of [-2.25,2.25]){sidePanel(wz,1.04*s,1.38*s,.98*s,[.25,.16,.10]);sidePanel(wz,1.13*s,1.08*s,.79*s,[.23,.45,.48],MATERIAL.GLASS);sidePanel(wz,1.13*s,.065*s,.79*s,[.35,.25,.15],MATERIAL.WOOD,.035);sidePanel(wz,1.50*s,1.08*s,.065*s,[.35,.25,.15],MATERIAL.WOOD,.035);}
    addBox(x-w*s-.48*s,t,1.3*s,.2*s,1.65*s,[.48,.39,.28],MATERIAL.STONE,base-.01);
    // A second glazed elevation and porch face the +theta bank, visible from the river approach.
    const bankPanel=(cx,cy,ww,hh,color,mat=MATERIAL.WOOD,proud=0)=>{const faceZ=d+.045+(mat===MATERIAL.GLASS?.018:0)+proud;quad(p(cx-ww/2,cy,faceZ),p(cx+ww/2,cy,faceZ),p(cx+ww/2,cy+hh,faceZ),p(cx-ww/2,cy+hh,faceZ),color,mat);};
    bankPanel(0,.02*s,1.12*s,1.82*s,[.25,.16,.10]);
    for(const wx of [-2.25,2.25]){bankPanel(wx*s,1.04*s,1.38*s,.98*s,[.25,.16,.10]);bankPanel(wx*s,1.13*s,1.08*s,.79*s,[.23,.45,.48],MATERIAL.GLASS);bankPanel(wx*s,1.13*s,.065*s,.79*s,[.35,.25,.15],MATERIAL.WOOD,.035);bankPanel(wx*s,1.50*s,1.08*s,.065*s,[.35,.25,.15],MATERIAL.WOOD,.035);}
    const porchTheta=t+(d+.78)*s/WORLD.radius;
    // Porch roof slab, exposed posts and threshold land directly beyond that elevation.
    addBox(x,porchTheta,3.4*s,.15*s,1.7*s,[.48,.31,.17],MATERIAL.ROOF,base+2.35*s);
    for(const xx of [-1.55,1.55])addBox(x+xx*s,porchTheta,.14*s,2.3*s,.14*s,[.30,.20,.12],MATERIAL.WOOD,base);
    addBox(x,porchTheta,3.5*s,.14*s,.16*s,[.30,.20,.12],MATERIAL.WOOD,base+2.2*s);
    addBox(x,porchTheta,2.1*s,.22*s,1.1*s,[.46,.39,.30],MATERIAL.STONE,base-.01);
    // Chimney with projecting cap and terracotta pot.
    const chx=2.25*s,chz=.45*s;cylinder(x,t,1.65*s,.36*s,[.39,.31,.23],MATERIAL.STONE,8,base+2.55*s);addBox(x,t,.95*s,.16*s,.95*s,[.28,.23,.18],MATERIAL.STONE,base+4.1*s);
    // Warm inset lamp beside entry; local emitters coincide with real glazing and porch fixtures.
    ellipsoid(x,t,-.95*s,1.85*s,-d-.07,.12*s,.18*s,.08*s,[1,.57,.23],MATERIAL.EMISSIVE,0,rand());
    const warm=[1,.45,.16];
    // Put the point sources outside the facade plane, on the same scene-facing
    // side as their lamp/window geometry (the old near-surface positions were behind it).
    lights.push({position:point(x,t,base+1.85*s,-.95*s,-d-.55*s),color:warm,intensity:3.4,radius:12*s});
    lights.push({position:point(x,t,base+1.53*s,-2.45*s,-d-.55*s),color:warm,intensity:2.2,radius:9*s});
  };
  cottage(-163,.03,1.0,1); cottage(-43,-.15,.84,0); cottage(99,.23,.74,2); cottage(160,-.1,.78,1);
  // Low cottage-garden edging and raised herb beds make the threshold feel planted, not assembled on bare turf.
  for(const side of [-1,1]){
    const fenceT=.03+side*.145;
    for(let post=0;post<5;post++)addBox(-171.5+post*4.2,fenceT,.13,.72,.13,[.29,.20,.12],MATERIAL.WOOD,.04);
    addBox(-163.1,fenceT,17.0,.09,.10,[.38,.27,.16],MATERIAL.WOOD,.47);
    addBox(-163.1,fenceT,17.0,.09,.10,[.38,.27,.16],MATERIAL.WOOD,.68);
  }
  for(const side of [-1,1]){
    const bedT=.03+side*.22;
    addBox(-161.8,bedT,4.6,.16,1.15,[.40,.29,.18],MATERIAL.WOOD,.05);
    for(let i=0;i<14;i++){
      const xx=-163.8+i*.31,tt=bedT+(rand()-.5)*.045;
      plantTuft(xx,tt,.16+rand()*.10,rand()<.5?[.18,.33,.14]:[.31,.43,.19],3);
    }
    for(let i=0;i<6;i++)plantTuft(-163.3+i*.54,bedT+side*.012,.20+rand()*.12,rand()<.5?[.24,.38,.17]:[.38,.43,.20],4);
  }
  for(let i=0;i<110;i++){
    const x=-179+rand()*30,t=-.19+rand()*.47;
    if(Math.abs(t-.03)<.085||Math.abs(x+163)<5)continue;
    plantTuft(x,t,.18+rand()*.24,rand()<.55?[.18,.32,.14]:[.29,.40,.18],3+Math.floor(rand()*2));
  }
  // Near-bank canopy frames the opening from both sides without covering the cottage or river axis.
  tree(-168,-.015,.82,'broadleaf'); tree(-167,.12,.82,'pine'); tree(-171,.23,.70,'broadleaf');
  // Low, irregular understory drifts bring foreground scale and soften the path/house transition.
  for(let i=0;i<28;i++){
    const cluster=Math.floor(i/7),x=-181+cluster*5.2+(rand()-.5)*4, t=(cluster%2?.045:.14)+(rand()-.5)*.055;
    plantTuft(x,t,.68+rand()*.50,rand()<.55?[.15,.29,.14]:[.23,.36,.17],7+Math.floor(rand()*4));
  }
  const reed=(x,t,s)=>{const h=s*(1.4+rand()*1.6),lean=(rand()-.5)*.9; cylinder(x,t,h,.035,[.29,.37,.17],MATERIAL.GRASS,5,.14); const top=point(x,t,.14+h,lean,.04);const base=point(x,t,.14,0,0);flat(base,point(x,t,.14+h*.55,lean*.3,.02),top,[.42,.47,.20],MATERIAL.GRASS,.9,rand());ellipsoid(x,t,lean,h+.08,.03,.08,.4,.07,[.56,.48,.24],MATERIAL.GRASS,.9,rand());};
  for(let i=0;i<150;i++){const x=-181+rand()*42;if(x>-171&&x<-154)continue;const t=riverCenter(x)-.065+(rand()-.5)*.025;reed(x,t,.65+rand()*.65);}
  const flower=(x,t,s,color)=>{const h=.35*s;cylinder(x,t,h,.035,[.23,.38,.18],MATERIAL.GRASS,5,.08);ellipsoid(x,t,0,h,.01,.16*s,.13*s,.16*s,color,MATERIAL.FLOWER,.35,rand());for(let k=0;k<4;k++){const a=k*TAU/4;ellipsoid(x,t,Math.cos(a)*.15*s,h,Math.sin(a)*.15*s,.12*s,.08*s,.1*s,color,MATERIAL.FLOWER,.35,rand());}};
  for(let i=0;i<120;i++){const x=-184+rand()*42,t=rand()<.5?-.38+rand()*.05:.47+rand()*.05;flower(x,t,.5+rand()*.8,rand()<.5?[.82,.46,.32]:[.91,.72,.35]);}
  for(let i=0;i<20;i++){const x=-181+rand()*20,t=(i%2?-.075:.235)+(rand()-.5)*.06;flower(x,t,.45+rand()*.35,rand()<.5?[.83,.47,.29]:[.91,.70,.32]);}
  // Orchard-edge buttercups and clover gather in loose, irregular drifts rather than a uniform carpet.
  for(let i=0;i<70;i++){const x=55+rand()*24,t=.27+rand()*.50;flower(x,t,.48+rand()*.66,rand()<.55?[.88,.66,.26]:[.78,.39,.30]);}
  for(let i=0;i<8;i++){const x=-180+rand()*10,t=-.25+rand()*.08;flower(x,t,.55+rand()*.35,rand()<.5?[.87,.62,.25]:[.82,.40,.31]);}
  for(let i=0;i<10;i++){const x=-181+rand()*11,t=.12+rand()*.10;flower(x,t,.58+rand()*.42,rand()<.5?[.90,.69,.29]:[.82,.43,.31]);}
  // Meadow grasses in curated patches, short blades plus scattered smooth rocks.
  const patches=[[-188,-178,.05],[-181,-170,.14],[-153,-145,.42],[-34,-22,-.4],[60,73,.48],[175,190,-.48]];
  for(const [lo,hi,t0] of patches)for(let i=0;i<80;i++){const x=lo+rand()*(hi-lo),t=t0+(rand()-.5)*.16,base=point(x,t,.04,0,0);for(let j=0;j<3;j++){const a=rand()*TAU,h=.25+rand()*.55,w=.06,tip=point(x,t,.04+h,Math.cos(a)*w,Math.sin(a)*w);flat(base,point(x,t,.04+h*.55,Math.cos(a)*w*.4,Math.sin(a)*w*.4),tip,[.27,.38,.16],MATERIAL.GRASS,.8,rand());}}
  const cottageSites=[[-163,.03],[-43,-.15],[99,.23],[160,-.1]];
  for(let i=0;i<75;i++){
    const x=-210+rand()*420,t=riverCenter(x)+(rand()-.5)*.2;
    const blocksEntry=cottageSites.some(([hx,ht])=>Math.abs(x-hx)<8&&Math.abs(Math.atan2(Math.sin(t-ht),Math.cos(t-ht))*WORLD.radius)<7);
    const blocksTrail=pathRoutes.some(([start,end,side])=>x>=start-1&&x<=end+1&&Math.abs(Math.atan2(Math.sin(t-pathCenter(x,side)),Math.cos(t-pathCenter(x,side)))*WORLD.radius)<1.9);
    if(blocksEntry||blocksTrail)continue;
    const r=.25+rand()*.6;ellipsoid(x,t,0,r*.35,0,r,r*.45,r*.75,rand()<.5?[.34,.34,.28]:[.47,.43,.34],MATERIAL.STONE,0,rand());
  }
  // Aqueduct: continuous deck, four grounded piers, arch-ring voussoirs, spandrel panels and masonry courses.
  const ax=AQUEDUCT.x,at=riverCenter(ax),span=AQUEDUCT.span,open=span/AQUEDUCT.archCount*AQUEDUCT.openingRatio,step=span/AQUEDUCT.archCount,stone=palettes.stone;
  const archPoint=(u,offset,xoff=0)=>point(ax,at,offset, xoff, u*WORLD.radius);
  const spring=AQUEDUCT.springInset, crown=AQUEDUCT.crownInset, deck=AQUEDUCT.deckInset;
  // Full-section supports rise from broad footings into the deck; arch spring points overlap them.
  for(let i=0;i<=AQUEDUCT.archCount;i++){
    const u=-span/2+i*step,t=at+u,baseColor=stone[(i+1)%stone.length];
    addBox(ax,t,5.8,deck+.35,4.6,baseColor,MATERIAL.STONE,.08);
    addBox(ax,t,7.0,.72,5.8,[.49,.42,.32],MATERIAL.STONE,.08);
  }
  for(let ai=0;ai<AQUEDUCT.archCount;ai++){
    const center=-span/2+(ai+.5)*step,half=open/2,segments=28;
    const profile=(q)=>spring+(crown-spring)*Math.sin(Math.PI*q);
    // Each voussoir has front/back faces, intrados, extrados, and closed radial end faces.
    // Spandrel masonry fills only the area above the arch curve up to the deck, never its opening.
    for(let k=0;k<segments;k++){
      const q0=k/segments,q1=(k+1)/segments,u0=center-half+2*half*q0,u1=center-half+2*half*q1;
      const outer0=profile(q0)+1.35,outer1=profile(q1)+1.35,inner0=profile(q0),inner1=profile(q1),col=stone[(k+ai)%stone.length];
      for(const face of [-1,1]){
        const xo=face*2.35;
        quad(archPoint(u0,outer0,xo),archPoint(u1,outer1,xo),archPoint(u1,inner1,xo),archPoint(u0,inner0,xo),col,MATERIAL.STONE);
        quad(archPoint(u0,outer0,xo),archPoint(u1,outer1,xo),archPoint(u1,deck,xo),archPoint(u0,deck,xo),stone[(k+ai+1)%stone.length],MATERIAL.STONE);
      }
      quad(archPoint(u0,inner0,-2.35),archPoint(u0,inner0,2.35),archPoint(u1,inner1,2.35),archPoint(u1,inner1,-2.35),stone[(k+1)%stone.length],MATERIAL.STONE);
      quad(archPoint(u0,outer0,-2.35),archPoint(u0,outer0,2.35),archPoint(u1,outer1,2.35),archPoint(u1,outer1,-2.35),stone[(k+2)%stone.length],MATERIAL.STONE);
      for(const u of [u0,u1])quad(archPoint(u,inner0,-2.35),archPoint(u,outer0,-2.35),archPoint(u,outer0,2.35),archPoint(u,inner0,2.35),col,MATERIAL.STONE);
    }
  }
  // Deck slab has visible thickness; segmented parapet blocks sit directly on its top face.
  const d0=-span/2-.08,d1=span/2+.08;
  quad(archPoint(d0,deck,-2.9),archPoint(d0,deck,2.9),archPoint(d1,deck,2.9),archPoint(d1,deck,-2.9),[.57,.49,.37],MATERIAL.STONE);
  for(const xo of [-2.9,2.9])quad(archPoint(d0,deck,-xo),archPoint(d0,deck+.72,-xo),archPoint(d1,deck+.72,-xo),archPoint(d1,deck,-xo),[.48,.41,.32],MATERIAL.STONE);
  for(const side of [-1,1])for(let i=0;i<26;i++){
    const u=d0+(i+.5)*(d1-d0)/26,t=at+u;
    addBox(ax+side*2.35,t,.72,.88,(d1-d0)*WORLD.radius/26+.12,stone[i%stone.length],MATERIAL.STONE,deck);
  }
  // Water-crossing stone stepping slabs and sparse lanterns on aqueduct approaches.
  for(const side of [-1,1]){addBox(ax,at+side*.53,5.4,.55,2.3,[.46,.39,.30],MATERIAL.STONE,.12);}
  // Distant night stars remain at the unlit inner crown, low-density and explicit material-tagged.
  for(let i=0;i<230;i++){const x=-230+rand()*460,t=(rand()<.5?-1:1)*(1.58+rand()*1.45),size=.08+rand()*.10,p=surface(x,t,.3),du=[size,0,0],dt=[0,-Math.sin(t)*size,Math.cos(t)*size],gold=[.78,.82,.91];mesh.tri(p,p.map((v,k)=>v+du[k]),p.map((v,k)=>v+dt[k]),gold,MATERIAL.STAR);}
  const vertices=mesh.finish();
  const landmarks=[{name:'The Ring Aqueduct',x:AQUEDUCT.x,arches:AQUEDUCT.archCount,span:AQUEDUCT.span,openingWidth:open*WORLD.radius,springInset:spring,crownInset:crown,deckInset:deck,grounded:true},{name:'Willowmere',x:-43},{name:'The Long Orchard',x:92},{name:'Riverbend Cottage',x:-163,theta:.03},{name:'Blossom Bank',x:-172,theta:-.015}];
  return {vertices,seed:WORLD.seed,vertexCount:vertices.length/12,triangleCount:mesh.triangleCount,landmarks,lights,terrainHeight,daylightAt,metadata:{vertexStride:48,maxBytes:64*1024*1024,hero:{x:-163,theta:.03},aqueduct:{x:ax,theta:at},materials:MATERIAL}};
}
