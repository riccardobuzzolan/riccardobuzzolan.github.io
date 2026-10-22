(() => {
  'use strict';
  const canvas = document.querySelector('canvas.shark-canvas');
  if (!canvas) return;
  const hero = canvas.closest('.hero') || canvas.parentElement;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  // Layer separato sopra la sfumatura bianca, sotto il testo: il rosso resta visibile su tutta la hero.
  const bloodCanvas=document.createElement('canvas');
  bloodCanvas.className='shark-blood-overlay';
  bloodCanvas.setAttribute('aria-hidden','true');
  Object.assign(bloodCanvas.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',zIndex:'2',pointerEvents:'none'});
  const bloodCtx=bloodCanvas.getContext('2d');
  if(bloodCtx){
    const foreground=hero.querySelector('.hero-copy, .stack-hero-grid');
    hero.insertBefore(bloodCanvas,foreground||null);
  }
  const TWO_PI=Math.PI*2, PI=Math.PI;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+(b-a)*Math.random();
  const hash=(x,y,k=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(k|0,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const glyphs=':;t%SX8#@', paleGlyphs=".,'`";
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer={x:-9999,y:-9999,active:false};
  let W=0,H=0,dpr=1,cw=9,ch=13,cols=0,rows=0;
  let creatures=[],fishes=[],water=null,clock=0,raf=0,last=0,acc=0;
  let bloodTrail=[],lastBloodPoint=null;
  let visible=!document.hidden,insideViewport=true;
  const fixed=1/60;
  const palette={
    hammerhead:[80,97,111],
    classic:[83,91,94]
  };

 function inTri(px,py,ax,ay,bx,by,cx,cy){const a=(px-ax)*(by-ay)-(py-ay)*(bx-ax),b=(px-bx)*(cy-by)-(py-by)*(cx-bx),c=(px-cx)*(ay-cy)-(py-cy)*(ax-cx);return (a>=0&&b>=0&&c>=0)||(a<=0&&b<=0&&c<=0)}
  function half(s,kind){
    if(kind==='thresher'){
      if(s<.09)return .07*Math.pow(Math.sin(Math.max(0,s)/.09*PI/2),.8);
      if(s<.22)return .078+(.012*ease(.09,.22,s));
      if(s<.48)return .012+.078*Math.pow(Math.max(0,1-(s-.22)/.26),1.3);
      const k=(s-.48)/.52;return Math.max(.002,.013*(1-k)+.005*Math.sin(k*PI));
    }
    if(kind==='mako'){
      if(s<.17)return .085*Math.pow(Math.sin(Math.max(0,s)/.17*PI/2),1.5);
      if(s<.33)return .085+.013*ease(.17,.33,s);
      if(s<.85)return .014+.084*Math.pow(1-(s-.33)/.52,1.45);
      return Math.max(.004,.014*(1-(s-.85)/.15));
    }
    if(kind==='hammerhead'){
      if(s<.05)return .047;
      if(s<.30)return .045+.061*ease(.05,.3,s);
    }
    if(s<.13)return .09*Math.pow(Math.sin(Math.max(0,s)/.13*PI/2),.95);
    if(s<.3)return .09+.016*ease(.13,.3,s);
    if(s<.84)return .019+.087*Math.pow(1-(s-.3)/.54,1.25);
    return Math.max(.004,.019*(1-(s-.84)/.16));
  }
  function shape(s,v,kind){
    if(s<-.08||s>1.13||Math.abs(v)>.38)return 0;
    const a=Math.abs(v);
    if(kind==='hammerhead' && s>=-.012 && s<.105 && a<.185 && (a<.062||s>.032||s>.007&&a>.12))return 1;
    if(s>=0 && s<=1 && a<half(s,kind))return 1;
    let root=.13, tipS=.55,tipV=.26, trailing=.42;
    if(kind==='thresher'){root=.12;tipS=.37;tipV=.20;trailing=.28}
    if(kind==='mako'){root=.17;tipS=.52;tipV=.22;trailing=.40}
    if(inTri(s,a,root,.060,tipS,tipV,trailing,.055)) return 2;
    if(inTri(s,a,.55,.025,.71,.09,.64,.025))return 2;
    if(kind==='thresher'){
      if(inTri(s,v,.94,0,1.055,.065,1.006,-.007)) return 2;
    } else {
      if(inTri(s,a,.925,.004,1.040,.11,1.015,.008))return 2;
    }
    return 0;
  }
  

  const angleDelta=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
  function makeShark(kind,id,ux,uy,angle,size,speed,depth,anchorX,anchorY,phase) {
    // Silhouette and articulated swimming unchanged from the preferred reference.
    // Only forward travel speed is increased slightly (+10%, instead of +18% in V2).
    return {kind,id,x:ux*W,y:uy*H,angle,L:size,speed:speed*1.10,depth,
      targetX:anchorX,targetY:anchorY,phase,angular:0,spine:[]};
  }
  function resetSpine(s){
    const f=Math.cos(s.angle),g=Math.sin(s.angle),n=23;
    s.spine=Array.from({length:n},(_,i)=>({x:s.x-f*s.L*i/(n-1),y:s.y-g*s.L*i/(n-1)}));
  }
  // Articulated spine: each section follows the previous one during turns.
  // Unlike a rigid rotated silhouette, the full body bends continuously.
  function advanceSpine(s){
    const joints=s.spine, gap=s.L/(joints.length-1);
    joints[0].x=s.x; joints[0].y=s.y;
    let direction=s.angle+PI;
    for(let i=1;i<joints.length;i++){
      const p=joints[i-1],q=joints[i];
      const former=Math.atan2(q.y-p.y,q.x-p.x);
      direction+=clamp(angleDelta(direction,former),-.19,.19);
      // Gentle caudal beat overlaid on actual motion through the water.
      // Its influence grows from the dorsal fin to the tail.
      const u=i/(joints.length-1);
      const wave=Math.sin(s.phase-u*5.5)*Math.pow(u,2.05)*.011;
      q.x=p.x+Math.cos(direction+wave)*gap;
      q.y=p.y+Math.sin(direction+wave)*gap;
    }
  }
  function seed(){
    const mobile=W<660;
    // Exactly two classic and two hammerhead sharks.
    // The layouts prevent the extra animals from completely overlapping.
    const base=clamp(Math.min(W,H)*(mobile?.52:.39),mobile?158:205,mobile?220:350);
    creatures=mobile?[
      makeShark('classic',0,.42,.18,-2.43,base*.88,24,.96,.43,.19,.3),
      makeShark('hammerhead',1,.63,.41,2.53,base*.94,22,.91,.58,.39,2.1),
      makeShark('classic',2,.41,.63,-2.49,base*.83,24,.87,.45,.62,4.1),
      makeShark('hammerhead',3,.63,.84,2.49,base*.88,21,.92,.57,.81,5.8)
    ]:[
      makeShark('classic',0,.32,.28,-2.45,base*1.00,28,.98,.32,.30,.2),
      makeShark('hammerhead',1,.73,.28,2.53,base*.91,25,.92,.70,.32,2.0),
      makeShark('classic',2,.30,.76,-2.31,base*.90,26,.88,.33,.72,4.2),
      makeShark('hammerhead',3,.75,.75,2.40,base*.98,23,.94,.72,.73,5.5)
    ];
    creatures.forEach(resetSpine);
    fishes=[];
    const fishCount=clamp(Math.round(W*H/8200),44,145);
    while(fishes.length<fishCount){
      const cx=rand(0,W),cy=rand(0,H),angle=rand(-.22,.22)+(Math.random()<.5?PI:0);
      const n=Math.min(Math.round(rand(8,15)),fishCount-fishes.length);
      for(let i=0;i<n;i++)fishes.push({
        x:cx+rand(-47,47),y:cy+rand(-24,24),
        vx:Math.cos(angle)*rand(14,29),vy:Math.sin(angle)*rand(14,29),
        alarm:0,lum:rand(.35,.95)
      });
    }
  }
  function makeWater(){
    water=document.createElement('canvas');water.width=Math.ceil(W*dpr);water.height=Math.ceil(H*dpr);
    const g=water.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
    const bg=g.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#ffffff');bg.addColorStop(.55,'#fcfdfd');bg.addColorStop(1,'#f5fafb');
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(75,84,87,.048)';g.lineWidth=.7;g.beginPath();
    for(let x=0;x<=W;x+=cw){const px=Math.floor(x)+.5;g.moveTo(px,0);g.lineTo(px,H)}
    for(let y=0;y<=H;y+=ch){const py=Math.floor(y)+.5;g.moveTo(0,py);g.lineTo(W,py)}
    g.stroke();
  }
  function resize(){
    const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;
    const oldW=W,oldH=H,wasMobile=W<660;
    W=Math.round(r.width);H=Math.round(r.height);
    dpr=Math.min(devicePixelRatio||1,1.8);
    cw=clamp(Math.round(W/180),5,8);ch=Math.round(cw*1.34);
    cols=Math.ceil(W/cw);rows=Math.ceil(H/ch);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    if(bloodCtx){bloodCanvas.width=canvas.width;bloodCanvas.height=canvas.height;}
    if(!creatures.length || (oldW>0&&wasMobile!==(W<660))){seed();}
    else{
      const sx=W/oldW,sy=H/oldH;
      for(const s of creatures){s.x*=sx;s.y*=sy;for(const p of s.spine){p.x*=sx;p.y*=sy}}
      for(const f of fishes){f.x*=sx;f.y*=sy;}
      for(const b of bloodTrail){b.x*=sx;b.y*=sy;}
      if(lastBloodPoint){lastBloodPoint.x*=sx;lastBloodPoint.y*=sy;}
    }
    makeWater();paint();
  }
  // Pixel isolati e distanziati: nessuna fascia rossa continua. Fade breve.
  function emitBlood(x,y) {
    const px=clamp(Math.floor(x/cw)*cw+cw*.5+rand(-cw*.42,cw*.42),0,W);
    const py=clamp(Math.floor(y/ch)*ch+ch*.5+rand(-ch*.30,ch*.30),0,H);
    bloodTrail.push({x:px,y:py,life:1,rate:rand(.75,1.02),shade:Math.random()});
    if(bloodTrail.length>48)bloodTrail.splice(0,bloodTrail.length-48);
  }
  function extendBlood(x,y) {
    const spacing=Math.max(14,cw*2.6);
    if(lastBloodPoint){
      const dx=x-lastBloodPoint.x,dy=y-lastBloodPoint.y;
      const distance=Math.hypot(dx,dy);
      if(distance<spacing)return;
      const n=Math.min(18,Math.max(1,Math.floor(distance/spacing)));
      for(let k=1;k<=n;k++){
        const t=k/n;
        // Piccole interruzioni volutamente irregolari, come pigmento disperso.
        if(k===n||Math.random()>.27)emitBlood(lastBloodPoint.x+dx*t,lastBloodPoint.y+dy*t);
      }
    }else emitBlood(x,y);
    lastBloodPoint={x,y};
  }
  function freshestBlood(){
    for(let k=bloodTrail.length-1;k>=0;k--)if(bloodTrail[k].life>.07)return bloodTrail[k];
    return null;
  }
  function step(dt){
    clock+=dt;
    for(let k=bloodTrail.length-1;k>=0;k--){
      bloodTrail[k].life-=dt*bloodTrail[k].rate;
      if(bloodTrail[k].life<=0)bloodTrail.splice(k,1);
    }
    const bloodTarget=freshestBlood();
    for(const s of creatures){
      const following=!!bloodTarget||pointer.active;
      const margin=Math.min(s.L*.23,W*.15,H*.15);
      const destination=bloodTarget ? {
        x:clamp(bloodTarget.x,margin,W-margin),
        y:clamp(bloodTarget.y,margin,H-margin)
      } : pointer.active ? {
        x:clamp(pointer.x,margin,W-margin),
        y:clamp(pointer.y,margin,H-margin)
      } : {
        x:W*s.targetX+Math.sin(clock*.16+s.phase*.38)*Math.min(W*.11,s.L*.38),
        y:H*s.targetY+Math.sin(clock*.11+s.phase*.43)*Math.min(H*.13,s.L*.35)
      };
      const dx=destination.x-s.x,dy=destination.y-s.y;
      const distance=Math.hypot(dx,dy);
      let desired=Math.atan2(dy,dx);
      if(s.x<margin*.75||s.x>W-margin*.75||s.y<margin*.75||s.y>H-margin*.75){
        const center=Math.atan2(H*.5-s.y,W*.5-s.x);
        desired+=angleDelta(desired,center)*.54;
      }
      const steering=following?(distance<s.L*.26?.31:.84):.56;
      const maxTurn=following?(distance<s.L*.26?.29:.57):.48;
      const targetAngular=clamp(angleDelta(s.angle,desired)*steering,-maxTurn,maxTurn);
      s.angular+=(targetAngular-s.angular)*(1-Math.exp(-dt*(following?2.15:1.18)));
      s.angle+=s.angular*dt;
      s.phase+=dt*(1.55+s.speed/31);
      s.x+=Math.cos(s.angle)*s.speed*dt;
      s.y+=Math.sin(s.angle)*s.speed*dt;
      const safe=s.L*.26;
      if(s.x<safe||s.x>W-safe||s.y<safe||s.y>H-safe){
        const back=Math.atan2(H*.5-s.y,W*.5-s.x);
        s.angle+=clamp(angleDelta(s.angle,back),-dt*.44,dt*.44);
      }
      advanceSpine(s);
    }
    for(const f of fishes){
      let ax=Math.sin(f.y*.011+clock*.31)*2.7;
      let ay=Math.cos(f.x*.014+clock*.27)*2.2;
      for(const s of creatures){
        const dx=f.x-s.x,dy=f.y-s.y,d=Math.hypot(dx,dy),range=s.L*.56;
        if(d<range&&d>1){const repel=(1-d/range)**2*180;ax+=dx/d*repel;ay+=dy/d*repel;f.alarm=1;}
      }
      if(pointer.active){
        const dx=f.x-pointer.x,dy=f.y-pointer.y,d=Math.hypot(dx,dy);
        if(d<148&&d>1){const repel=(1-d/148)**2*210;ax+=dx/d*repel;ay+=dy/d*repel;f.alarm=1;}
      }
      f.vx+=ax*dt;f.vy+=ay*dt;
      const v=Math.hypot(f.vx,f.vy)||1,max=f.alarm>.3?82:42;
      if(v>max){f.vx*=max/v;f.vy*=max/v;}
      f.x+=f.vx*dt;f.y+=f.vy*dt;f.alarm*=Math.exp(-dt*1.1);
      if(f.x<-25)f.x=W+20;else if(f.x>W+25)f.x=-20;
      if(f.y<-25)f.y=H+20;else if(f.y>H+25)f.y=-20;
    }
  }
  // Project every ASCII cell onto the closest segment of the moving spine.
  // This matches how the supplied portfolio paints and flexes each shark.
  function readSpine(sh,x,y){
    const joints=sh.spine;
    let best=Infinity,along=0,side=0;
    for(let i=0;i<joints.length-1;i++){
      const p=joints[i],q=joints[i+1];
      const dx=q.x-p.x,dy=q.y-p.y,len2=dx*dx+dy*dy;
      const u=clamp(((x-p.x)*dx+(y-p.y)*dy)/(len2||1),i===0?-1.12:0,i===joints.length-2?3.95:1);
      const qx=p.x+u*dx,qy=p.y+u*dy;
      const vx=x-qx,vy=y-qy,d2=vx*vx+vy*vy;
      if(d2<best){
        best=d2;
        along=(i+u)/(joints.length-1);
        side=(vx*dy-vy*dx)/Math.sqrt(len2||1)/sh.L;
      }
    }
    return {along,side,d2:best};
  }
  function drawOne(s){
    let l=W,r=0,top=H,bottom=0;
    for(const p of s.spine){l=Math.min(l,p.x);r=Math.max(r,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y)}
    const pad=s.L*.34+ch*2;
    const i0=clamp(Math.floor((l-pad)/cw),0,cols-1),i1=clamp(Math.ceil((r+pad)/cw),0,cols-1);
    const j0=clamp(Math.floor((top-pad)/ch),0,rows-1),j1=clamp(Math.ceil((bottom+pad)/ch),0,rows-1);
    ctx.font=`600 ${Math.round(ch*.82)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    const tint=([[143,116,139],[90,139,153],[152,140,102],[107,118,159]][s.id] || palette[s.kind]);
    const pal=[[151,122,143],[88,145,158],[156,138,104],[109,127,164]];
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
      const x=(i+.5)*cw,y=(j+.5)*ch;
      const pos=readSpine(s,x,y);
      if(pos.d2>(s.L*.31)**2)continue;
      const at=pos.along,v=pos.side;
      let piece=shape(at,v,s.kind),cover=piece?1:0;
      if(!cover){
        let hits=0;
        for(const [ox,oy] of [[-.30,-.30],[.30,-.30],[-.30,.30],[.30,.30]]){
          const p=readSpine(s,x+ox*cw,y+oy*ch);
          if(shape(p.along,p.side,s.kind))hits++;
        }
        cover=hits*.17;if(!cover)continue;piece=2;
      }
      const cell=hash(i,j,s.id*197+5),grain=hash(Math.floor(at*130),Math.floor(v*240),s.id+9);
      const width=Math.max(half(clamp(at,.008,.99),s.kind),.011);
      const dist=clamp(Math.abs(v)/width,0,1);
      const light=clamp(.68-.27*dist+.21*Math.sin(at*6+1.4)+.22*(cell-.5),.13,1);
      const a=clamp((.34+.67*light)*s.depth*cover*(piece===2?.85:1),.07,.92);
      const color=cell>.98&&piece===1?pal[Math.floor(grain*4)]:tint;
      ctx.fillStyle=`rgba(${color[0]},${color[1]},${color[2]},${a.toFixed(3)})`;
      ctx.fillRect(i*cw+.4,j*ch+.4,cw-.8,ch-.8);
      const index=clamp(Math.floor((1-light)*9+(cell-.5)*3),0,glyphs.length-1);
      let letter=piece===2&&cell>.78?paleGlyphs[Math.floor(grain*paleGlyphs.length)]:glyphs[index];
      if(piece===1&&at>.16&&at<.30&&Math.abs(v)>.07&&cell>.65)letter=';';
      ctx.fillStyle=`rgba(253,254,253,${clamp(.48+light*.37,.38,.93).toFixed(2)})`;
      ctx.fillText(letter,x,y+.4);
    }
  }
  function drawBlood(){
    if(!bloodCtx)return;
    bloodCtx.setTransform(dpr,0,0,dpr,0,0);
    bloodCtx.clearRect(0,0,W,H);
    if(!bloodTrail.length)return;
    const pixels=new Map();
    for(const b of bloodTrail){
      const col=Math.floor(b.x/cw),row=Math.floor(b.y/ch);
      if(col<0||row<0||col>=cols||row>=rows)continue;
      const key=row*cols+col;
      const current=pixels.get(key);
      if(!current||current.life<b.life)pixels.set(key,{col,row,life:b.life,shade:b.shade});
    }
    for(const b of pixels.values()){
      const tint=b.shade>.6?[141,56,66]:b.shade>.3?[163,77,85]:[178,103,110];
      // Calo progressivo: nella seconda meta' della vita il pixel diventa quasi invisibile.
      const alpha=.30*b.life*b.life;
      const size=Math.max(2,Math.min(cw*.54,ch*.44))*(.68+.30*b.shade);
      const x=(b.col+.5)*cw,y=(b.row+.5)*ch;
      bloodCtx.fillStyle=`rgba(${tint.join(',')},${alpha.toFixed(3)})`;
      bloodCtx.fillRect(Math.round(x-size/2),Math.round(y-size/2),size,size);
    }
  }
  function drawFish(){
    const occupied=new Set();ctx.font=`500 ${Math.round(ch*.65)}px ui-monospace, Consolas, monospace`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(const f of fishes){
      const col=Math.floor(f.x/cw),row=Math.floor(f.y/ch),key=row*cols+col;
      if(col<0||row<0||col>=cols||row>=rows||occupied.has(key))continue;
      occupied.add(key);
      const opacity=clamp(.20+f.lum*.30+f.alarm*.2,.15,.71);
      ctx.fillStyle=`rgba(70,89,91,${opacity.toFixed(2)})`;
      const mark=Math.abs(f.vy)>Math.abs(f.vx)*1.4?(f.vy>0?'\\':'/'):'-';
      ctx.fillText(mark,(col+.5)*cw,(row+.5)*ch);
    }
    // Static sparse plankton: no random texture flicker between frames.
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      if(hash(i,j,9)<.9935)continue;
      ctx.fillStyle=`rgba(100,140,148,${(.09+.15*hash(i,j,23)).toFixed(2)})`;
      ctx.fillRect((i+.5)*cw,(j+.5)*ch,1.2,1.2);
    }
  }
  function paint(){
    if(!water)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.drawImage(water,0,0,W,H);
    // Low-opacity currents stay behind the animals, avoiding a video-like overlay.
    ctx.lineWidth=.65;
    for(let k=0;k<3;k++){
      const y=H*(.22+.25*k);
      ctx.strokeStyle=`rgba(117,180,193,${(.012+.006*Math.sin(clock*.3+k)).toFixed(3)})`;
      ctx.beginPath();
      for(let x=0;x<=W+26;x+=26){const yy=y+4*Math.sin(clock*.35+x*.012+k);
        if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}
      ctx.stroke();
    }
    drawBlood();
    // Sorted far-to-near; fish are in front of the pale shapes.
    for(const s of [...creatures].sort((a,b)=>a.depth-b.depth))drawOne(s);
    drawFish();
  }
  const canAnimate=()=>visible&&!motion.matches&&insideViewport;
  function frame(now){
    if(!canAnimate()){raf=0;return;}
    if(!last)last=now;
    acc+=clamp((now-last)/1000,0,.05);last=now;
    let iter=0;
    while(acc>=fixed&&iter<3){step(fixed);acc-=fixed;iter++;}
    if(iter===3)acc=0;
    paint();raf=requestAnimationFrame(frame);
  }
  function schedule(){
    cancelAnimationFrame(raf);raf=0;last=0;acc=0;
    if(canAnimate())raf=requestAnimationFrame(frame);
    else paint();
  }
  hero.addEventListener('pointermove',e=>{
    // Mouse e penna: comportamento gia' esistente; gli eventi touch sono separati.
    if(e.pointerType==='touch')return;
    const rect=canvas.getBoundingClientRect();
    pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top;
    pointer.active=pointer.x>=0&&pointer.x<=W&&pointer.y>=0&&pointer.y<=H;
    if(pointer.active && !motion.matches){
      extendBlood(pointer.x,pointer.y);
    }else lastBloodPoint=null;
  },{passive:true});
  hero.addEventListener('pointerleave',e=>{
    if(e.pointerType==='touch')return;
    pointer.active=false;lastBloodPoint=null;
  });
  // Tap e swipe disegnano la stessa scia ASCII, senza bloccare lo scroll.
  let activeTouchId=null;
  function moveTouch(touch){
    if(motion.matches)return;
    const rect=canvas.getBoundingClientRect();
    const x=touch.clientX-rect.left,y=touch.clientY-rect.top;
    pointer.x=x;pointer.y=y;
    pointer.active=x>=0&&x<=W&&y>=0&&y<=H;
    if(pointer.active)extendBlood(x,y);
    else lastBloodPoint=null;
  }
  hero.addEventListener('touchstart',e=>{
    if(activeTouchId!==null||!e.changedTouches.length)return;
    const target=e.target;
    if(target instanceof Element && target.closest('a,button,input,textarea,select,[role="button"]'))return;
    const touch=e.changedTouches[0];
    activeTouchId=touch.identifier;
    lastBloodPoint=null;
    moveTouch(touch);
  },{passive:true});
  hero.addEventListener('touchmove',e=>{
    if(activeTouchId===null)return;
    const touch=Array.from(e.changedTouches).find(t=>t.identifier===activeTouchId);
    if(touch)moveTouch(touch);
  },{passive:true});
  function endTouch(e){
    if(activeTouchId===null)return;
    if(!Array.from(e.changedTouches).some(t=>t.identifier===activeTouchId))return;
    activeTouchId=null;pointer.active=false;lastBloodPoint=null;
  }
  hero.addEventListener('touchend',endTouch,{passive:true});
  hero.addEventListener('touchcancel',endTouch,{passive:true});
  window.addEventListener('blur',()=>{pointer.active=false;lastBloodPoint=null;activeTouchId=null;});
  hero.addEventListener('pointerdown',e=>{
    if(motion.matches)return;
    const rect=canvas.getBoundingClientRect();
    for(const f of fishes){
      const dx=f.x-(e.clientX-rect.left),dy=f.y-(e.clientY-rect.top),d=Math.hypot(dx,dy);
      if(d<190&&d>1){const impulse=(1-d/190)*105;f.vx+=dx/d*impulse;f.vy+=dy/d*impulse;f.alarm=1;}
    }
  },{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;schedule();});
  motion.addEventListener?.('change',schedule);
  if('IntersectionObserver'in window)new IntersectionObserver(([v])=>{insideViewport=v.isIntersecting;schedule();},{threshold:.01}).observe(canvas);
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize',resize,{passive:true});
  resize();
  if(motion.matches){for(let k=0;k<55;k++)step(fixed);paint();}
  schedule();
  // Nonvisual diagnostic access for browser tests.
  window.__asciiSharks={get count(){return creatures.length;},get kinds(){return creatures.map(s=>s.kind);},get coordinates(){return creatures.map(s=>({x:s.x,y:s.y,heading:s.angle,speed:s.speed}));},get running(){return canAnimate();},get blood(){return bloodTrail.map(b=>({x:b.x,y:b.y,life:b.life}));},get target(){return {...pointer};},get spine(){return creatures.map(s=>s.spine.map(p=>({x:p.x,y:p.y})));}};
})();