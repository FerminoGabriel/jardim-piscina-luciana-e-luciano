
import * as T from 'three';import {createVegetation} from 'pool-vegetation';import {createPoolInstallations} from 'pool-installations';import {createPoolModules,moduleModel} from 'pool-modules';import {createArchitecture} from 'pool-architecture';import {OrbitControls} from 'orbit-controls';
try{
const mobileMode=matchMedia('(pointer:coarse)').matches||innerWidth<800;
const canvas=document.querySelector('canvas'),renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new T.Scene();scene.background=new T.Color('#e9eae2');const camera=new T.OrthographicCamera(-6,6,4,-4,.01,100);const controls=new OrbitControls(camera,canvas);controls.target.set(4.25,2.025,0);controls.minZoom=.3;controls.maxZoom=30;
const ambient=new T.HemisphereLight(0xffffff,0x79806b,2.5);scene.add(ambient);const light=new T.DirectionalLight(0xfff6e3,3);light.position.set(-4,8,6);scene.add(light);const fill=new T.DirectionalLight(0xe4f2ff,1.5);fill.position.set(6,4,-2);scene.add(fill);
function makeDesktopEnvironment(){
 const width=256,height=128,data=new Uint16Array(width*height*4);
 const softbox=new T.Vector3(-.55,.63,.55).normalize();
 const direction=new T.Vector3();
 for(let y=0;y<height;y++){
  const latitude=((y+.5)/height-.5)*Math.PI;
  const elevation=Math.sin(latitude), horizontal=Math.cos(latitude);
  for(let x=0;x<width;x++){
   const longitude=((x+.5)/width-.5)*2*Math.PI;
   direction.set(Math.cos(longitude)*horizontal,elevation,Math.sin(longitude)*horizontal);
   const skylight=.16+.48*Math.max(0,elevation);
   const broadLight=2.8*Math.pow(Math.max(0,direction.dot(softbox)),18);
   const offset=(y*width+x)*4;
   data[offset]=T.DataUtils.toHalfFloat(skylight*.84+broadLight);
   data[offset+1]=T.DataUtils.toHalfFloat(skylight*.94+broadLight*.93);
   data[offset+2]=T.DataUtils.toHalfFloat(skylight*1.13+broadLight*.80);
   data[offset+3]=T.DataUtils.toHalfFloat(1);
  }
 }
 const environment=new T.DataTexture(data,width,height,T.RGBAFormat,T.HalfFloatType);
 environment.mapping=T.EquirectangularReflectionMapping;
 environment.minFilter=environment.magFilter=T.LinearFilter;
 environment.needsUpdate=true;
 return environment;
}

const gl=renderer.getContext();
const fixtureShadows=!mobileMode&&renderer.capabilities.maxTextures>=32
 &&gl.getParameter(gl.MAX_VARYING_VECTORS)>=30;
const desktopLampIntensity=16;
// Focus Industries MR16-7W-3000K-36D, averaged over the measured C-planes.
// Normalize intensity for this scene and rescale the half-peak width to GreenUP's nominal 30 degrees.
if(!mobileMode){
 const original='return smoothstep( coneCosine, penumbraCosine, angleCosine );';
 T.ShaderChunk.lights_pars_begin=T.ShaderChunk.lights_pars_begin.replace(original,`
 if(angleCosine>=0.9961947)return mix(0.922807,1.000000,smoothstep(0.9961947,1.0000000,angleCosine));
 if(angleCosine>=0.9848078)return mix(0.745278,0.922807,smoothstep(0.9848078,0.9961947,angleCosine));
 if(angleCosine>=0.9659258)return mix(0.500000,0.745278,smoothstep(0.9659258,0.9848078,angleCosine));
 if(angleCosine>=0.9396926)return mix(0.254015,0.500000,smoothstep(0.9396926,0.9659258,angleCosine));
 if(angleCosine>=0.9063078)return mix(0.092305,0.254015,smoothstep(0.9063078,0.9396926,angleCosine));
 if(angleCosine>=0.8660254)return mix(0.033225,0.092305,smoothstep(0.8660254,0.9063078,angleCosine));
 if(angleCosine>=0.8191520)return mix(0.018861,0.033225,smoothstep(0.8191520,0.8660254,angleCosine));
 if(angleCosine>=0.7660444)return mix(0.010833,0.018861,smoothstep(0.7660444,0.8191520,angleCosine));
 if(angleCosine>=0.7071068)return mix(0.004273,0.010833,smoothstep(0.7071068,0.7660444,angleCosine));
 if(angleCosine>=0.6427876)return mix(0.000475,0.004273,smoothstep(0.6427876,0.7071068,angleCosine));
 if(angleCosine>=0.5735764)return mix(0.000493,0.000475,smoothstep(0.5735764,0.6427876,angleCosine));
 if(angleCosine>=0.5000000)return mix(0.000166,0.000493,smoothstep(0.5000000,0.5735764,angleCosine));
 if(angleCosine>=0.4226183)return mix(0.000228,0.000166,smoothstep(0.4226183,0.5000000,angleCosine));
 if(angleCosine>=0.3420201)return mix(0.000000,0.000228,smoothstep(0.3420201,0.4226183,angleCosine));
 return 0.0;`);
}

let shadowState='';
function applyDesktopLight(on){
 renderer.toneMappingExposure=on?1.28:1.08;
 scene.environmentIntensity=on?.11:.58;
 scene.background.set(on?'#2b302f':'#e9eae2');
 ambient.intensity=on?.24:.62;
 light.intensity=on?.16:2.65;
 fill.intensity=on?.18:.55;
 light.castShadow=!on||!fixtureShadows;
}
if(!mobileMode){
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;
 scene.environment=makeDesktopEnvironment();
 ambient.groundColor.set(0xc2b3a0);
 light.target.position.set(4.25,2.025,.2);
 light.position.set(.4,7.8,4.7);
 scene.add(light.target);
 Object.assign(light.shadow.camera,{left:-6.7,right:6.7,top:4.8,bottom:-4.8,near:.1,far:22});
 light.shadow.camera.updateProjectionMatrix();
 const shadowSize=Math.min(4096,renderer.capabilities.maxTextureSize);
 light.shadow.mapSize.set(shadowSize,shadowSize);
 light.shadow.normalBias=.005;
 light.shadow.bias=-.00015;
 applyDesktopLight(false);
}

const wall=new T.Group();scene.add(wall);const contour=[[0,0],[8.5,0],[8.5,3.15],[6.75,3.15],[6.75,4.05],[1.5,4.05],[1.5,3.99],[0,3.99]];
function shape(){return new T.Shape(contour.map(p=>new T.Vector2(...p)));}
const architecture=createArchitecture(wall,innerWidth<800);const groups=Object.values(architecture);
for(const [id,keys] of Object.entries({finishLayer:['paint','skim','waterproof','render','scratch'],wall:['bricks','mortar','back']})){document.getElementById(id).onchange=e=>{keys.forEach(k=>architecture[k].visible=e.target.checked);draw();};}
const installations=createPoolInstallations(scene,mobileMode,fixtureShadows);document.querySelector('#electricalSummary').textContent='18 caixas de luminárias + 2 derivações · '+installations.conduitLength.toFixed(1).replace('.',',')+' m de percurso';document.querySelector('#installations').onchange=e=>{installations.electrical.visible=installations.plumbing.visible=e.target.checked;draw()};document.querySelector('#lamps').onchange=e=>{installations.lamps.visible=e.target.checked;draw()};document.querySelector('#glow').onchange=e=>{installations.setGlow(e.target.checked);if(!mobileMode)applyDesktopLight(e.target.checked);draw()};const vegetation=createVegetation(scene,matchMedia('(pointer:coarse)').matches||innerWidth<800);document.querySelector('#vegetation').onchange=e=>{vegetation.visible=e.target.checked;draw()};const {group:modules,placements}=createPoolModules(scene);document.querySelector('#modules').onchange=e=>{modules.visible=e.target.checked;draw()};function enableSurfaceShadows(group){
 group.traverse(object=>{
  if(!object.isMesh||object.material.transparent)return;
  object.castShadow=true;
  object.receiveShadow=true;
 });
}
if(!mobileMode){
 enableSurfaceShadows(wall);
 enableSurfaceShadows(modules);
 enableSurfaceShadows(vegetation);
 enableSurfaceShadows(installations.plumbing);
}


const fixingZones=[{id:'M01',x:0,y:3.225,w:.10,h:.30},{id:'M02',x:1.72,y:3.225,w:.10,h:.25},{id:'M03',x:3.43,y:3.225,w:.10,h:.25},{id:'M04',x:5.15,y:3.225,w:.10,h:.30}];
const fixingMarks=new T.Group();fixingMarks.name='Estrutura metálica · áreas de fixação';scene.add(fixingMarks);
for(const a of fixingZones){const outline=new T.LineLoop(new T.BufferGeometry().setFromPoints([[a.x,a.y],[a.x+a.w,a.y],[a.x+a.w,a.y+a.h],[a.x,a.y+a.h]].map(p=>new T.Vector3(...p,.002))),new T.LineBasicMaterial({color:0xff2020,depthTest:false,depthWrite:false}));outline.renderOrder=100;fixingMarks.add(outline);const fill=new T.Mesh(new T.PlaneGeometry(a.w,a.h),new T.MeshBasicMaterial({color:0xff2020,transparent:true,opacity:.20,depthTest:false,depthWrite:false,side:T.DoubleSide}));fill.position.set(a.x+a.w/2,a.y+a.h/2,.001);fill.renderOrder=99;fixingMarks.add(fill);}
document.querySelector('#fixingMarks').onchange=e=>{fixingMarks.visible=e.target.checked;draw()};

const detail=new T.Group();detail.add(moduleModel());detail.visible=false;scene.add(detail);
let current='perspective';function view(v){current=v;const isDetail=v==='module'||v==='lamp';fixingMarks.visible=!isDetail&&document.querySelector('#fixingMarks').checked;detail.clear();detail.add(v==='lamp'?installations.inspectLamp():moduleModel());camera.zoom=1;wall.visible=!isDetail;vegetation.visible=!isDetail&&document.querySelector('#vegetation').checked;installations.lamps.visible=!isDetail&&document.querySelector('#lamps').checked;installations.electrical.visible=installations.plumbing.visible=!isDetail&&document.querySelector('#installations').checked;modules.visible=!isDetail&&document.querySelector('#modules').checked;detail.visible=isDetail;controls.target.set(4.25,2.025,.15);camera.position.copy(controls.target).add(new T.Vector3(...(v==='front'?[0,0,15]:v==='side'?[15,0,0]:v==='top'?[0,15,.001]:[5.8,4.4,13.5])));camera.up.set(0,v==='top'?0:1,v==='top'?-1:0);if(v==='module'){controls.target.set(.25,.15,.09);camera.position.set(.85,.53,.85);}else if(v==='lamp'){controls.target.set(0,-.01,.25);camera.position.set(.65,.37,.78);}controls.update();resize();document.querySelector('#viewLabel').textContent=({front:'Elevação frontal · parede da piscina',perspective:'Perspectiva geral',side:'Perfil · parede de 231 mm',top:'Vista superior',module:'Plastwall 12 L · inspeção 3D',lamp:'GreenUP Light-up · inspeção 3D'})[v];document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));draw();}
function draw(){if(!mobileMode){const state=[current,...Array.from(document.querySelectorAll('aside input'),i=>i.checked)].join('|');if(state!==shadowState){renderer.shadowMap.needsUpdate=true;shadowState=state;}}renderer.render(scene,camera)}function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);const aspect=w/h,halfH=(current==='module'||current==='lamp')?Math.max(.35,.45/aspect):Math.max(2.65,4.7/aspect);camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();draw();}
controls.addEventListener('change',draw);new ResizeObserver(resize).observe(canvas);document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));document.querySelector('#fit').onclick=()=>view(current);if(!mobileMode){
 const photo=document.createElement('button');
 photo.type='button';
 photo.textContent='↗ Modo foto · até 4K';
 document.querySelector('.objects').append(photo);
 const dialog=document.createElement('dialog');
 dialog.className='photo-dialog';
 dialog.innerHTML='<h2>Modo foto</h2><p role="status"></p><img alt="Prévia do enquadramento renderizado"><div><a download="jardim-piscina.png" hidden>Baixar PNG</a><button type="button">Fechar</button></div>';
 document.body.append(dialog);
 const preview=dialog.querySelector('img');
 const status=dialog.querySelector('p');
 const download=dialog.querySelector('a');
 let previewUrl='',captureId=0;
 dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{
  captureId++;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl='';
  preview.removeAttribute('src');
  download.removeAttribute('href');
  download.hidden=true;
 });
 photo.onclick=()=>{
  const capture=++captureId;
  dialog.showModal();
  status.textContent='Renderizando o enquadramento atual…';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(capture!==captureId)return;
   const ratio=renderer.getPixelRatio();
   const width=canvas.clientWidth,height=canvas.clientHeight;
   const gl=renderer.getContext();const limit=gl.getParameter(gl.MAX_VIEWPORT_DIMS);
   const scale=Math.min(3840/Math.max(width,height),limit[0]/width,limit[1]/height);
   const outputWidth=Math.round(width*scale),outputHeight=Math.round(height*scale);
   try{
    draw();
    renderer.setPixelRatio(1);
    renderer.setSize(outputWidth,outputHeight,false);
    renderer.render(scene,camera);
    canvas.toBlob(blob=>{
     if(capture!==captureId)return;
     if(!blob){
      status.textContent='O navegador não conseguiu gerar a imagem.';
      return;
     }
     previewUrl=URL.createObjectURL(blob);
     preview.src=download.href=previewUrl;
     download.hidden=false;
     status.textContent=`${outputWidth} × ${outputHeight} px · PNG`;
    },'image/png');
   }catch(error){
    status.textContent='Não foi possível renderizar esta imagem.';
    console.error(error);
   }finally{
    renderer.setSize(width,height,false);
    renderer.setPixelRatio(ratio);
    draw();
   }
  }));
 };
}
resize();view('perspective');window.projectGeometry={width:850,heights:[399,405,315],segments:[150,525,175],area:32.76,thickness:23.1,modules:placements.length,lateralMargin:25,bottomMargin:22.5};
}catch(e){const el=document.querySelector('#error');el.hidden=false;el.textContent='Não foi possível iniciar o 3D: '+e.message;console.error(e)}
