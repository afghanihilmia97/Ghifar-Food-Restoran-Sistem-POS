import {uid} from './core.js';
const key=name=>String(name||'').trim().toLocaleLowerCase('id-ID');
export function normalizeCategories(d){
 if(!Array.isArray(d.categories)){const names=['Makanan','Minuman','Snack','Paket',...d.menus.map(m=>m.category).filter(Boolean)];const seen=new Set();d.categories=names.filter(name=>{const k=key(name);if(seen.has(k))return false;seen.add(k);return true}).map(name=>({id:'legacy-category-'+encodeURIComponent(key(name)),name:String(name).trim()}))}
 for(const m of d.menus){const name=String(m.category||'').trim();if(!name)continue;let c=d.categories.find(c=>key(c.name)===key(name));if(!c){c={id:'legacy-category-'+encodeURIComponent(key(name)),name};d.categories.push(c)}m.category=c.name}
 return d;
}
export function applyCategory(d,type,p,actor,role){
 if(!['Owner','Manager'].includes(role))throw Error('Role tidak diizinkan mengelola kategori');
 normalizeCategories(d);
 if(type==='category-save'){
  const name=String(p.name||'').trim().replace(/\s+/g,' ');if(!name||name.length>60)throw Error('Nama kategori wajib diisi, maksimal 60 karakter');
  if(d.categories.some(c=>c.id!==p.id&&key(c.name)===key(name)))throw Error('Nama kategori sudah digunakan');
  if(p.id){const c=d.categories.find(c=>c.id===p.id);if(!c)throw Error('Kategori tidak ditemukan');for(const m of d.menus)if(key(m.category)===key(c.name))m.category=name;c.name=name;return c}
  const c={id:uid(),name};d.categories.push(c);return c;
 }
 if(type==='category-delete'){
  const c=d.categories.find(c=>c.id===p.id);if(!c)throw Error('Kategori tidak ditemukan');const menus=d.menus.filter(m=>key(m.category)===key(c.name)),replacement=d.categories.find(c=>c.id===p.replacementId&&c.id!==p.id);
  if(menus.length&&!replacement)throw Error('Pilih kategori pengganti untuk '+menus.length+' menu yang masih menggunakan kategori ini');
  for(const m of menus)m.category=replacement.name;d.categories=d.categories.filter(x=>x.id!==c.id);return {id:c.id,name:c.name,moved:menus.length,replacement:replacement?.name||''};
 }
 throw Error('Aksi kategori tidak dikenal');
}
