import * as THREE from 'three';
const plastic=new THREE.MeshStandardMaterial({color:0x222725,roughness:.72,metalness:.03,side:THREE.DoubleSide});const rimMat=new THREE.MeshStandardMaterial({color:0x303633,roughness:.65});const black=new THREE.MeshStandardMaterial({color:0x171b19,roughness:.48,metalness:.42});const recess=new THREE.MeshStandardMaterial({color:0x080b09,roughness:.9});const diffuser=new THREE.MeshStandardMaterial({color:0xf4e3be,roughness:.5,emissive:0xffc777,emissiveIntensity:0});const wallMat=new THREE.MeshStandardMaterial({color:0xe5dfcf,roughness:.96});
function mesh(g,m,parent,pos){const o=new THREE.Mesh(g,m);if(pos)o.position.set(...pos);parent.add(o);return o;}
function box(parent,w,h,d,x,y,z,mat=plastic){return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,[x,y,z]);}
function rod(parent,a,b,r,mat){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),12),mat,parent,av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
function extrudeProfile(parent,points,x,depth,mat=plastic){const sh=new THREE.Shape();sh.moveTo(...points[0]);for(const v of points.slice(1))sh.lineTo(...v);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:24});g.rotateY(-Math.PI/2);g.translate(x+depth,0,0);return mesh(g,mat,parent);}
// Model units: metres; module lower-left rear corner is (0,0,0).
// Overall dimensions are manufacturer dimensions; unquoted shell/rib details are visual approximations.
function moduleModel(){const g=new THREE.Group();g.name='Plastwall 12 L';
box(g,.5,.3,.0035,.25,.15,.00175);
box(g,.492,.004,.17,.25,.007,.088);
const side=new THREE.Shape();side.moveTo(0,.3);side.bezierCurveTo(.008,.17,.06,.119,.199,.113);side.lineTo(.199,.018);side.quadraticCurveTo(.199,0,.18,0);side.lineTo(.006,0);side.lineTo(0,.3);
const sg=new THREE.ExtrudeGeometry(side,{depth:.0035,bevelEnabled:false,curveSegments:28});sg.rotateY(-Math.PI/2);sg.translate(.0035,0,0);mesh(sg,plastic,g);const s2=mesh(sg,plastic,g);s2.position.x=.4965;
// Front lip: 113 mm high. Lower face subtly slopes inwards, matching the official product silhouette.
extrudeProfile(g,[[.178,0],[.192,.01],[.199,.025],[.199,.113],[.195,.113],[.195,.027],[.188,.014],[.178,.004]],.0035,.493);
box(g,.5,.0045,.006,.25,.111,.196,rimMat);box(g,.5,.005,.006,.25,.2975,.003,rimMat);
const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(0,.3,0),new THREE.Vector3(0,.17,.008),new THREE.Vector3(0,.119,.06),new THREE.Vector3(0,.113,.199));const tube=new THREE.TubeGeometry(curve,28,.0018,6,false);mesh(tube,rimMat,g,[.002,0,0]);mesh(tube,rimMat,g,[.498,0,0]);
// Ribs/recesses follow the photographs; these are not a drilling template.
for(const x of [.012,.085,.25,.415,.488]){const h=(x<.02||x>.48)?.023:.047;box(g,.007,h,.004,x,.3-h/2,.005,rimMat);const hole=mesh(new THREE.CircleGeometry(.0023,12),recess,g,[x,.3-h+.005,.0073]);}
for(const x of [.085,.25,.415]){box(g,.006,.059,.014,x,.039,.013,rimMat);box(g,.006,.005,.156,x,.011,.093,rimMat);box(g,.011,.009,.013,x,.004,.168,rimMat);rod(g,[x,.008,.145],[x,-.001,.145],.003,recess);}
return g;}

function batchRepeatedMeshes(group){group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+':'+o.material.uuid;if(!buckets.has(key))buckets.set(key,{geometry:o.geometry,material:o.material,matrices:[]});buckets.get(key).matrices.push(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));});group.clear();for(const b of buckets.values()){const inst=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.computeBoundingSphere();group.add(inst);}}

export {moduleModel};
export function createPoolModules(parent){const group=new THREE.Group();group.name='Módulos Plastwall 12 L';parent.add(group);const proto=moduleModel(),placements=[];for(let col=0;col<16;col++){const rows=col<13?12:9;for(let row=0;row<rows;row++){const x=.25+col*.5,y=.225+row*.3;const m=proto.clone();m.position.set(x,y,.0005);m.userData.label='Plastwall · coluna '+(col+1)+', fileira '+(row+1);group.add(m);placements.push({col,row,x,y,width:.5,height:.3});}}batchRepeatedMeshes(group);return {group,placements};}
