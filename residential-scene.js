import {referenceBuilding} from './reference-building.js?v=25';
import * as THREE from './vendor/three.module.js';



// Genuine WebGL scene: geometry, camera orbit, ray picking and world-space labels.

export async function createResidentialScene(host, getState, selectUnit) {

  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene=new THREE.Scene();scene.background=new THREE.Color('#e5ede9');

  scene.fog=new THREE.Fog('#e5ede9',190,380);

  const camera=new THREE.PerspectiveCamera(40,1,.5,500);

  const renderer=new THREE.WebGLRenderer({antialias:true});

  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));

  renderer.outputColorSpace=THREE.SRGBColorSpace;

  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;

  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const canvas=renderer.domElement;canvas.setAttribute('aria-label','Interactive 3D apartment campus. Drag to rotate, pinch or scroll to zoom. Use floor and apartment buttons to select a home.');canvas.tabIndex=0;host.append(canvas);

  scene.add(new THREE.HemisphereLight('#fff9ec','#8b9579',2));

  const sun=new THREE.DirectionalLight('#fff0d2',2.4);sun.position.set(-45,80,55);sun.castShadow=true;

  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-80,right:80,top:70,bottom:-70,near:1,far:230});sun.shadow.bias=-.0004;sun.shadow.normalBias=.12;scene.add(sun);

  const solids=[];
  const stonePath=new THREE.MeshStandardMaterial({color:'#d7d3c6',roughness:.95});
  const path=new THREE.Mesh(new THREE.BoxGeometry(96,.12,8),stonePath);path.position.set(0,-.02,14);path.receiveShadow=true;scene.add(path);
  const foliage=new THREE.MeshStandardMaterial({color:'#42624c',roughness:1});
  for(const x of [-43,-16,16,43])for(const z of [-14,12]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,2.6,8),new THREE.MeshStandardMaterial({color:'#776656'}));trunk.position.set(x,1.3,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.3,2),foliage);crown.scale.y=1.35;crown.position.set(x,4,z);crown.castShadow=true;scene.add(crown)}

  for(const x of [-28,0,28]){const building=referenceBuilding();building.scale.set(1,1,1);building.position.x=x;scene.add(building);building.traverse(m=>{if(m.isMesh)solids.push(m)})}
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,140),new THREE.MeshStandardMaterial({color:'#b4bda8',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.18;ground.receiveShadow=true;scene.add(ground);
  const road=new THREE.Mesh(new THREE.BoxGeometry(160,.1,12),new THREE.MeshStandardMaterial({color:'#505956',roughness:.9}));road.position.set(0,-.08,24);road.receiveShadow=true;scene.add(road);
  for(let x=-70;x<75;x+=12){const dash=new THREE.Mesh(new THREE.BoxGeometry(5,.02,.15),new THREE.MeshBasicMaterial({color:'#eee9d9'}));dash.position.set(x,0,24);scene.add(dash)}
  const labelLayer=document.createElement('div');labelLayer.className='world-labels';host.append(labelLayer);

  const units=[],tags=[];

  for(let tower=0;tower<3;tower++){

    const button=document.createElement('button');button.className='world-tower';button.textContent='TOWER '+'ABC'[tower];button.onclick=()=>{angle=.12;target.set([-28,0,28][tower],11,0);radius=72;auto=false;updateOrbit()};labelLayer.append(button);tags.push({button,point:new THREE.Vector3([-28,0,28][tower],26,-6)});

    for(let floor=1;floor<=5;floor++)for(let side=0;side<2;side++){

      const slot=tower*2+side+1,x=[-28,0,28][tower]+(side===0?-5.1:5.1),y=1.8+(floor-1)*3.8;

      const material=new THREE.MeshBasicMaterial({color:'#76b47b',transparent:true,opacity:.18,depthWrite:false});

      const mesh=new THREE.Mesh(new THREE.BoxGeometry(8,2.9,.16),material);mesh.position.set(x,y,8.5);scene.add(mesh);

      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:'#659467',transparent:true,opacity:.6}));edges.position.copy(mesh.position);scene.add(edges);

      const button=document.createElement('button');button.className='world-unit';labelLayer.append(button);

      const unit={slot,floor,mesh,edges,button,point:new THREE.Vector3(x,y,8.7)};mesh.userData.unit=unit;button.onclick=()=>pick(unit);units.push(unit);tags.push(unit);

    }

  }

  const target=new THREE.Vector3(0,8,0);let angle=.28,elevation=.46,radius=135,auto=false,dirty=true,last=0,visible=true,tourIndex=-1;const stops=[{name:"Entrance",p:[0,2,32],look:[0,3,0]},{name:"Tower A approach",p:[-28,2,17],look:[-28,7,0]},{name:"Garden walk",p:[-12,2,13],look:[0,6,-4]},{name:"Pool court",p:[23,2,18],look:[12,2,8]},{name:"Tower C entrance",p:[28,2,8],look:[28,8,-4]}];

  const orbitButton=document.querySelector('#orbit-campus');
  const studio=document.createElement('section');studio.className='residence-studio';studio.setAttribute('aria-label','Residence viewing controls');
  studio.innerHTML=`<div class="studio-heading"><span>THE RESIDENCE COLLECTION</span><h2>Find your perspective.</h2><p>Explore the architecture. Choose your home.</p></div><div class="studio-towers" aria-label="Focus tower"><button data-tower="0">Tower A</button><button data-tower="1">Tower B</button><button data-tower="2">Tower C</button><button data-tower="all">All towers</button></div><div class="studio-settings"><button id="studio-light" aria-pressed="false">Evening lighting</button><button id="studio-labels" aria-pressed="true">Labels on</button></div><div class="studio-units" aria-label="Apartments on selected floor"></div><p class="studio-note">Illustrative architecture · Demo availability</p>`;
  host.parentElement.append(studio);let labelsOn=true;
  studio.querySelectorAll('[data-tower]').forEach(b=>b.onclick=()=>{if(b.dataset.tower==='all')home();else{tourIndex=-1;target.set([-28,0,28][Number(b.dataset.tower)],10,0);radius=host.clientWidth<600?64:58;angle=.2;elevation=.24;auto=false;updateOrbit()}studio.querySelectorAll('[data-tower]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
  studio.querySelector('#studio-light').onclick=e=>{const night=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(night));e.currentTarget.textContent=night?'Daylight':'Evening lighting';scene.background.set(night?'#263945':'#e5ede9');scene.fog.color.copy(scene.background);sun.intensity=night?.65:2.4;renderer.toneMappingExposure=night?.8:1.05;dirty=true};
  studio.querySelector('#studio-labels').onclick=e=>{labelsOn=!labelsOn;labelLayer.hidden=!labelsOn;e.currentTarget.setAttribute('aria-pressed',String(labelsOn));e.currentTarget.textContent=labelsOn?'Labels on':'Labels off'};


  function updateOrbit(){orbitButton?.setAttribute('aria-pressed',String(auto));dirty=true;}

  function pick(u){const p=getState().units.find(p=>p.floor===u.floor&&p.slot===u.slot);if(p){auto=false;updateOrbit();selectUnit(p);sync();}}

  function sync(){const state=getState();for(const u of units){const p=state.units.find(p=>p.floor===u.floor&&p.slot===u.slot);if(!p)continue;const chosen=p.id===state.selected?.id,match=state.matches(p),active=u.floor===state.floor;

    const color=chosen?'#e4bb51':p.status==='Sold'?'#c78173':'#78a374';u.mesh.material.color.set(color);u.mesh.material.opacity=match?(chosen?.6:active?.3:.08):.015;u.edges.material.color.set(color);u.edges.material.opacity=match?(active?.95:.22):0;

    u.button.textContent=p.id.split('-')[1];u.button.className='world-unit '+p.status.toLowerCase()+(chosen?' picked':'');u.button.setAttribute('aria-label',`Tower ${'ABC'[Math.floor((u.slot-1)/2)]}, Flat ${p.id}, ${p.status}`);u.eligible=match&&(active||chosen);

  }
  const unitList=studio.querySelector('.studio-units');unitList.replaceChildren();
  for(const u of units.filter(u=>u.floor===state.floor)){const p=state.units.find(p=>p.floor===u.floor&&p.slot===u.slot);if(!p||!state.matches(p))continue;const b=document.createElement('button');b.className='studio-unit '+p.status.toLowerCase();b.innerHTML=`<b>${p.id.split('-')[1]}</b><span>${p.bhk} BHK · ${p.area.toLocaleString()} sq ft</span><small>${p.status}</small>`;b.onclick=()=>pick(u);unitList.append(b)}dirty=true;}

  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;}

  new ResizeObserver(resize).observe(host);

  function home(){tourIndex=-1;target.set(0,10,0);angle=.32;elevation=.19;radius=host.clientWidth<600?75:88;auto=false;updateOrbit();}

  home();resize();sync();

  function position(){if(tourIndex>=0){camera.position.fromArray(stops[tourIndex].p);camera.lookAt(camera.position.x+Math.sin(angle)*Math.cos(elevation),camera.position.y+Math.sin(elevation),camera.position.z+Math.cos(angle)*Math.cos(elevation));camera.updateMatrixWorld();return;}camera.position.set(target.x+radius*Math.sin(angle)*Math.cos(elevation),target.y+radius*Math.sin(elevation),target.z+radius*Math.cos(angle)*Math.cos(elevation));camera.lookAt(target);camera.updateMatrixWorld();}

  const pointers=new Map();let moved=0,previousDistance=0;

  canvas.style.touchAction='none';canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;auto=false;updateOrbit();};

  canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId),dx=e.clientX-prev.x,dy=e.clientY-prev.y;moved+=Math.abs(dx)+Math.abs(dy);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

    if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(previousDistance)radius=Math.max(48,Math.min(240,radius*previousDistance/d));previousDistance=d;}else{angle-=dx*.006;elevation=Math.max(tourIndex>=0?-1.2:.12,Math.min(1.2,elevation+dy*.004));}dirty=true;};

  canvas.onpointerup=e=>{if(moved<6&&pointers.size===1){position();const r=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const hit=ray.intersectObjects([...units.map(u=>u.mesh),...solids],false)[0];if(hit?.object.userData.unit)pick(hit.object.userData.unit);}pointers.delete(e.pointerId);previousDistance=0;};

  canvas.onpointercancel=e=>{pointers.delete(e.pointerId);previousDistance=0;};

  function zoom(delta){radius=Math.max(48,Math.min(240,radius+delta));dirty=true;}

  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY*.07)},{passive:false});

  canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')home();else if(e.key==='+'||e.key==='-')zoom(e.key==='+'?-10:10);else if(e.key==='ArrowLeft'||e.key==='ArrowRight')angle+=e.key==='ArrowLeft'?-.15:.15;else elevation=Math.max(.12,Math.min(1.2,elevation+(e.key==='ArrowUp'?.08:-.08)));dirty=true;};

  function frame(time){requestAnimationFrame(frame);visible=!host.closest('[hidden]')&&!document.hidden;if(!visible){last=time;return;}if(auto){angle+=Math.min(time-last,50)*.00016;dirty=true;}last=time;if(!dirty)return;position();renderer.render(scene,camera);

    for(const t of tags){const v=t.point.clone().project(camera);t.button.style.left=(v.x*.5+.5)*host.clientWidth+'px';t.button.style.top=(.5-v.y*.5)*host.clientHeight+'px';t.button.hidden=v.z>1||v.x<-1||v.x>1||v.y<-1||v.y>1||(t.mesh&&(!t.eligible||Math.cos(angle)<.25));}dirty=false;

  }requestAnimationFrame(frame);

  function tour(step=0){tourIndex=(tourIndex+step+stops.length)%stops.length;const stop=stops[tourIndex];angle=Math.atan2(stop.look[0]-stop.p[0],stop.look[2]-stop.p[2]);elevation=.12;auto=false;dirty=true;document.querySelector('#tour-stop').textContent=`${tourIndex+1} / ${stops.length} · ${stop.name}`;}

  return {sync,zoom,home,tour,rotate:delta=>{angle+=delta;auto=false;updateOrbit();},orbit:()=>{if(reduced){angle+=Math.PI/4;dirty=true;}else auto=!auto;updateOrbit();},resize};

}



