import * as THREE from 'three';
export function createPoolInstallations(assembly,mobileMode=false,fixtureShadows=false){
const plastic=new THREE.MeshStandardMaterial({color:0x222725,roughness:.72,metalness:.03,side:THREE.DoubleSide});const rimMat=new THREE.MeshStandardMaterial({color:0x303633,roughness:.65});const black=new THREE.MeshStandardMaterial({color:0x171b19,roughness:.48,metalness:.42});const recess=new THREE.MeshStandardMaterial({color:0x080b09,roughness:.9});const diffuser=new THREE.MeshStandardMaterial({color:0xf4e3be,roughness:.5,emissive:0xffc777,emissiveIntensity:0});const wallMat=new THREE.MeshStandardMaterial({color:0xe5dfcf,roughness:.96});
function mesh(g,m,parent,pos){const o=new THREE.Mesh(g,m);if(pos)o.position.set(...pos);parent.add(o);return o;}
function box(parent,w,h,d,x,y,z,mat=plastic){return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,[x,y,z]);}
function rod(parent,a,b,r,mat){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),mat,parent,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function extrudeProfile(parent,points,x,depth,mat=plastic){const sh=new THREE.Shape();sh.moveTo(...points[0]);for(const v of points.slice(1))sh.lineTo(...v);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:24});g.rotateY(-Math.PI/2);g.translate(x+depth,0,0);return mesh(g,mat,parent);}

function lampModel(){
 const g=new THREE.Group();g.name='GreenUP Light-up LJVGD1';
 const head=new THREE.Vector3(0,0,.57), direction=new THREE.Vector3(0,1.36,-.27).normalize();
 if(!mobileMode){
  const powderCoat=new THREE.MeshStandardMaterial({color:0x1e211f,metalness:.42,roughness:.67});
  const anodized=new THREE.MeshStandardMaterial({color:0x111311,metalness:.67,roughness:.43});
  const lens=new THREE.MeshPhysicalMaterial({color:0xb7ab8f,roughness:.24,clearcoat:.64});
  function axial(profile,material,center,axis){
   const geometry=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48);
   const part=mesh(geometry,material,g,center.toArray());
   part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
   return part;
  }
  const plate=new THREE.Shape();
  const w=.0225,h=.030,r=.004;
  plate.moveTo(-w+r,-h);plate.lineTo(w-r,-h);plate.quadraticCurveTo(w,-h,w,-h+r);
  plate.lineTo(w,h-r);plate.quadraticCurveTo(w,h,w-r,h);plate.lineTo(-w+r,h);
  plate.quadraticCurveTo(-w,h,-w,h-r);plate.lineTo(-w,-h+r);plate.quadraticCurveTo(-w,-h,-w+r,-h);
  mesh(new THREE.ExtrudeGeometry(plate,{depth:.008,bevelThickness:.001,bevelSize:.001,bevelSegments:2,curveSegments:6}),powderCoat,g,[0,0,.001]);
  const forward=new THREE.Vector3(0,0,1);
  for(const y of [-.019,.019]){
   axial([[0,0],[.0027,0],[.0027,.001],[.0021,.0017],[0,.0017]],anodized,new THREE.Vector3(0,y,.01),forward);
   box(g,.0032,.00065,.00035,0,y,.01175,recess);
  }
  axial([[0,0],[.009,0],[.009,.011],[.007,.018],[.006,.019],[.006,.565],[.009,.567],[.009,.574],[0,.574]],powderCoat,new THREE.Vector3(0,0,.008),forward);
  axial([[0,-.035],[.021,-.035],[.025,-.032],[.027,-.027],[.027,.018],[.026,.022],[.023,.022],[.023,.025],[0,.025]],powderCoat,head,direction);
  axial([[.023,.020],[.027,.020],[.028,.022],[.028,.025],[.026,.028],[.022,.028]],anodized,head,direction);
  axial([[0,.025],[.020,.025],[.022,.026],[.022,.027],[.016,.028],[0,.0285]],lens,head,direction);
  axial([[0,.0285],[.014,.0285],[.0135,.029],[0,.029]],diffuser,head,direction);
  return g;
 }
 const end=(distance)=>head.clone().addScaledVector(direction,distance).toArray();
 box(g,.045,.06,.01,0,0,.005,black);
 rod(g,[0,0,.01],head.toArray(),.006,black);
 rod(g,end(-.035),end(.025),.027,black);
 rod(g,end(.025),end(.028),.022,diffuser);
 return g;
}

const lamps=new THREE.Group();lamps.name='Luminárias GreenUP Light-up';assembly.add(lamps);const lampProto=lampModel();
const projectedLights=[];
function addEmission(lamp){
 const direction=new THREE.Vector3(0,1.36,-.27).normalize();
 const spot=new THREE.SpotLight(mobileMode?0xffc990:0xffb870,0,4,mobileMode?Math.PI/12:THREE.MathUtils.degToRad(46),mobileMode?.45:.72,2);
 spot.position.set(0,0,.57);spot.position.addScaledVector(direction,.029);
 const target=new THREE.Object3D();target.position.set(0,1.36,.30);
 lamp.add(target,spot);spot.target=target;spot.visible=false;projectedLights.push(spot);
 if(fixtureShadows){
  spot.castShadow=true;
  spot.shadow.mapSize.set(256,256);
  spot.shadow.camera.near=.04;
  spot.shadow.focus=.70;
  spot.shadow.bias=-.00025;
  spot.shadow.normalBias=.003;
 }
}
const lampRows=[{y:.15,xs:Array.from({length:10},(_,i)=>.65+i*.8)},{y:3.885,xs:Array.from({length:8},(_,i)=>.65+i*.8)}];const lampPositions=[];let lampNumber=0;
for(const [row,{y,xs}] of lampRows.entries())for(const x of xs){const lamp=lampProto.clone();lamp.position.set(x,y,0);if(row===1)lamp.rotation.z=Math.PI;lamp.userData.label='L'+String(++lampNumber).padStart(2,'0')+' · GreenUP Light-up';addEmission(lamp);lamps.add(lamp);lampPositions.push({x,y,row});}
const electrical=new THREE.Group();electrical.name='Elétrica · estudo de percurso';assembly.add(electrical);
const conduitMat=new THREE.MeshStandardMaterial({color:0xff9b24,emissive:0xb84606,emissiveIntensity:.4,roughness:.65,depthTest:true,depthWrite:true});
const boxMat=new THREE.MeshStandardMaterial({color:0x347c9c,emissive:0x16435a,emissiveIntensity:.45,roughness:.65,depthTest:true,depthWrite:true});
const pointMat=new THREE.MeshStandardMaterial({color:0x171b19,roughness:.58,metalness:.25});
const pointScrewMat=new THREE.MeshStandardMaterial({color:0x747c7a,roughness:.35,metalness:.8});
const lidMat=new THREE.MeshStandardMaterial({color:0x87c5db,transparent:true,opacity:.58,depthTest:true,depthWrite:true});
let conduitLength=0;
function conduit(a,b){conduitLength+=new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b));const o=rod(electrical,a,b,.01,conduitMat);o.renderOrder=30;}
function electricalBox(x,y,name,junction=false){const w=.05,h=.10,d=.045;const g=new THREE.Group();
g.position.set(x,y,0);
g.userData.label=name;electrical.add(g);
for(const dx of [-w/2+.0015,w/2-.0015]){const o=box(g,.003,h,d,dx,0,-d/2,boxMat);o.renderOrder=31;}
for(const dy of [-h/2+.0015,h/2-.0015]){const o=box(g,w,.003,d,0,dy,-d/2,boxMat);o.renderOrder=31;}
const rear=box(g,w,h,.002,0,0,-.044,boxMat);rear.renderOrder=31;const lid=box(g,w-.006,h-.006,.002,0,0,.001,lidMat);lid.renderOrder=32;
if(!junction){

 box(g,.05,.10,.008,0,0,.006,pointMat);
 for(const dy of [-.035,.035])rod(g,[0,dy,.010],[0,dy,.012],.0022,pointScrewMat);
}

}

const riserX=.15,zConduit=-.035,feedHeight=3.96;conduit([0,feedHeight,zConduit],[riserX,feedHeight,zConduit]);conduit([riserX,feedHeight,zConduit],[riserX,.15,zConduit]);
for(const [row,{y,xs}] of lampRows.entries()){electricalBox(riserX,y,'Derivação · faixa '+(row+1),true);conduit([riserX,y,zConduit],[row===0?8.42:6.70,y,zConduit]);for(const [column,x] of xs.entries())electricalBox(x+.09,y,'Caixa embutida · L'+String((row===0?0:10)+column+1).padStart(2,'0'));}
const plumbing=new THREE.Group();plumbing.name='Água · uso e irrigação';assembly.add(plumbing);
const waterPipeMat=new THREE.MeshStandardMaterial({color:0x1977ba,roughness:.6});const brassMat=new THREE.MeshStandardMaterial({color:0xb99b54,roughness:.45,metalness:.65});
function waterPipe(a,b,r=.0125){return rod(plumbing,a,b,r,waterPipeMat);}
const pz=-.035;

waterPipe([0,.40,pz],[.04,.40,pz]);waterPipe([.04,.40,pz],[.04,.85,pz]);
const tapMat=new THREE.MeshStandardMaterial({color:0x111614,roughness:.48,metalness:.55});const tapPositions=[];
for(const [tapY,name] of [[.55,'Torneira preta · uso'],[.85,'Torneira preta · irrigação do jardim']]){const x=.07;waterPipe([.04,tapY,pz],[x,tapY,pz]);tapPositions.push({x,y:tapY});
 const tap=new THREE.Group();tap.userData.label=name;plumbing.add(tap);tap.position.y=tapY-.55;
 // Concealed supply to the finished wall, followed by a local sealed extension through the vessel.
 rod(tap,[x,.55,pz],[x,.55,0],.0125,brassMat);
 rod(tap,[x,.55,0],[x,.55,.257],.0125,tapMat);
 rod(tap,[x,.55,.200],[x,.55,.208],.028,tapMat);
 // Garden tap body, downward spout, threaded hose connection and cross handle.
 rod(tap,[x,.55,.250],[x,.55,.291],.019,tapMat);
 rod(tap,[x,.55,.288],[x,.522,.327],.013,tapMat);
 rod(tap,[x,.522,.327],[x,.475,.327],.013,tapMat);
 rod(tap,[x,.479,.327],[x,.466,.327],.016,tapMat);
 for(let i=0;i<4;i++){const ring=mesh(new THREE.TorusGeometry(.0152,.001,6,24),tapMat,tap,[x,.469+i*.003,.327]);ring.rotation.x=Math.PI/2;}
 rod(tap,[x,.55,.272],[x,.603,.272],.008,tapMat);
 rod(tap,[x-.033,.607,.272],[x+.033,.607,.272],.005,tapMat);
 rod(tap,[x,.607,.245],[x,.607,.299],.005,tapMat);
 mesh(new THREE.SphereGeometry(.008,12,8),tapMat,tap,[x,.607,.272]);
 const opening=mesh(new THREE.CircleGeometry(.010,24),recess,tap,[x,.4655,.327]);opening.rotation.x=Math.PI/2;
}
return {inspectLamp:()=>lampProto.clone(),lamps,electrical,plumbing,conduitLength,lampPositions,tapPositions,setGlow(on){diffuser.emissiveIntensity=on?7:0;projectedLights.forEach(l=>{l.visible=on&&!mobileMode;l.intensity=on?16:0;});}};}