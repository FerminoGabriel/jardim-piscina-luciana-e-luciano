import * as THREE from 'three';
export function createArchitecture(parent,lightweight=true){
const layers={};function group(key){const g=new THREE.Group();g.name=key;layers[key]=g;parent.add(g);return g;}
let seed=73281;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function noiseTexture(base,range=12,cloud=false){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');const im=ctx.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;const n=(rand()-.5)*range+(cloud?(Math.sin(x*.03+y*.02)+Math.sin(x*.08-y*.04))*3:0);for(let k=0;k<3;k++)im.data[i+k]=base[k]+n;im.data[i+3]=255;}ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
const rough=noiseTexture([170,170,170],80),ceramic=noiseTexture([178,86,54],34),cement=noiseTexture([155,151,141],26),paintTex=noiseTexture([47,48,46],5),tileTex=noiseTexture([219,217,208],7,true);
function mat(color,map,bump=.001){return new THREE.MeshStandardMaterial({color,map,roughness:.93,bumpMap:rough,bumpScale:bump});}
const brickMat=mat(0xffffff,ceramic,.0012),mortarMat=mat(0xffffff,cement,.001),renderMat=mat(0xc6bfb0,cement,.0012),skimMat=mat(0xf3f0e6,null,.0002),waterMat=mat(0x75766b,null,.0006),paintMat=mat(0xffffff,paintTex,.00015),rearMat=mat(0xe4e0d6,null,.0006);
function box(g,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;}
const bricks=group('bricks'),mortar=group('mortar'),scratch=group('scratch'),render=group('render'),waterproof=group('waterproof'),skim=group('skim'),paint=group('paint'),back=group('back');
const zones=[[0,1.5,3.99],[1.5,6.75,4.05],[6.75,8.5,3.15]];
function masonryInstances(g,mat,data,variation=false){const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,data.length),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();data.forEach(([a,b,c,d,e,f],i)=>{matrix.compose(new THREE.Vector3((a+b)/2,(c+d)/2,(e+f)/2),q,new THREE.Vector3(b-a,d-c,f-e));inst.setMatrixAt(i,matrix);if(variation)inst.setColorAt(i,new THREE.Color().setRGB(.88+rand()*.12,.87+rand()*.13,.87+rand()*.13));});g.add(inst);}
const mortarData=zones.map(([a,b,h])=>[a,b,0,h,-.198,-.064]);masonryInstances(mortar,mortarMat,mortarData);
const bdata=[];for(let row=0;row<21;row++){const y0=row*.2;const shift=row%2?-.15:0;for(let i=0;i<30;i++){const x0=Math.max(0,shift+i*.3),x1=Math.min(8.5,shift+(i+1)*.3);if(x1-x0<.012)continue;for(const [a,b,h] of zones){const l=Math.max(a,x0+.005),r=Math.min(b,x1-.005),top=Math.min(y0+.195,h-.005);if(r>l&&top>y0+.005)bdata.push([l,r,y0+.005,top,-.201,-.061]);}}}masonryInstances(bricks,brickMat,bdata,true);
const paintRelief=lightweight?null:paintMicrotexture();
for(const [a,b,h] of zones){const x=(a+b)/2,w=b-a;
box(scratch,w,h,.005,x,h/2,-.0585,mat(0xa7a18f,cement,.0025));
box(render,w,h,.050,x,h/2,-.031,renderMat);
box(waterproof,w,h,.002,x,h/2,-.005,waterMat);
box(skim,w,h,.003,x,h/2,-.0025,skimMat);
const face=box(paint,w,h,.001,x,h/2,-.0005,paintMat);if(paintRelief)applyTexturedPaint(face,paintRelief,0x292927,.0014);
box(back,w,h,.030,x,h/2,-.216,rearMat);}
return layers;}
function paintMicrotexture(){
 const size=256,data=new Uint8Array(size*size*4);
 let seed=6157;
 const tau=2*Math.PI;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*tau,v=y/size*tau;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=seed/4294967296-.5;
  const stipple=Math.sin(29*u+Math.sin(13*v))*Math.sin(23*v+Math.sin(17*u));
  const plaster=Math.sin(5*u+3*v)*Math.sin(4*v-2*u);
  const index=(y*size+x)*4;
  data[index]=Math.round(128+27*stipple+10*plaster+32*grain);
  data[index+1]=Math.round(229+14*stipple+6*plaster);
  data[index+2]=255;
  data[index+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;
 texture.anisotropy=8;
 texture.needsUpdate=true;
 return texture;
}

function applyTexturedPaint(mesh,texture,color,bumpScale){
 const uv=mesh.geometry.attributes.uv;
 const {width,height,depth}=mesh.geometry.parameters;
 const tileSize=.42;
 // Keep the grain the same size on the broad faces and on the painted returns.
 const dimensions=[[depth,height],[depth,height],[width,depth],[width,depth],[width,height],[width,height]];
 dimensions.forEach(([u,v],face)=>{
  for(let i=face*4;i<face*4+4;i++)uv.setXY(i,uv.getX(i)*u/tileSize,uv.getY(i)*v/tileSize);
 });
 uv.needsUpdate=true;
 mesh.material=new THREE.MeshStandardMaterial({
  color,bumpMap:texture,bumpScale,roughnessMap:texture,roughness:1
 });
}
