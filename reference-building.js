import * as THREE from './vendor/three.module.js';
// Reference-inspired architecture; not a measured or as-built property model.
export function referenceBuilding(){
 const root=new THREE.Group();
 const white=new THREE.MeshStandardMaterial({color:'#f4efe2',roughness:.65}),wood=new THREE.MeshStandardMaterial({color:'#87472b',roughness:.72}),dark=new THREE.MeshStandardMaterial({color:'#39484b',roughness:.45,metalness:.35}),glass=new THREE.MeshStandardMaterial({color:'#8db6c5',roughness:.17,metalness:.55}),green=new THREE.MeshStandardMaterial({color:'#47714b',roughness:1});
 const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m};
 // Narrow central volume, with alternating projecting balconies and vertical cladding.
 box(19,19,13,0,9.5,-1.8,white);
 for(let level=0;level<5;level++){const y=level*3.8;
  for(const x of [-5.3,5.3]){
   box(7.8,2.8,.25,x,y+1.65,4.85,dark);box(7.4,2.5,.3,x,y+1.65,5.04,glass);
   for(const dx of [-2.4,0,2.4])box(.07,2.5,.08,x+dx,y+1.65,5.25,dark);
   const z=level%2===0?6.2:5.9;
   box(9,.32,4.2,x,y+.18,z,white);box(9,.32,4.2,x,y+3.55,z,white);
   box(9,.65,.25,x,y+.65,z+2,white);
   for(const dx of [-4.3,0,4.3])box(.08,1.15,.08,x+dx,y+1.1,z+2,dark);
   box(8.7,.06,.08,x,y+1.65,z+2,dark);box(8.7,.06,.08,x,y+1.15,z+2,dark);
   box(1.8,.5,1,x+(x<0?-3:3),y+.8,z+1.25,white);box(1.6,.45,.8,x+(x<0?-3:3),y+1.18,z+1.25,green);
  }
  for(const x of [-9.6,9.6])for(const z of [-5,0]){box(.18,2.4,3.3,x,y+1.8,z,glass);box(.28,.12,3.5,x,y+.55,z,white)}
 }
 for(const x of [-8.7,-1.2,8.7])box(1.35,20.5,1.3,x,10.25,6.5,wood);
 box(6.5,20,1.2,2.6,10,5.65,wood);
 // Roof pergola, recessed penthouse and entrance porch.
 box(14,2.6,8,0,20.2,-2,white);box(21,.4,15,0,19.2,-.3,white);
 for(const x of [-8,8])box(.4,3.4,.4,x,20.8,5.8,white);
 for(const z of [-1,2,5,8])box(21,.3,.5,0,22.4,z,white);
 box(8,.35,6,0,3.2,9.5,white);for(const x of [-3.5,3.5])box(.35,3.2,.35,x,1.6,11,wood);
 box(4.8,2.7,.2,0,1.35,5.1,glass);
 for(let i=0;i<3;i++)box(8+i*1.4,.2,2,0,.5-i*.2,12+i*1.4,white);
 return root;
}
