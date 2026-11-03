/* Avatares circulares no ranking, respeitando o acesso privado por polo. */
const seen=new Map();
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const css=document.createElement('style');
css.textContent=`
.fju-rank-avatar{width:40px;height:40px;min-width:40px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:#e4e8f0;border:2px solid #fff;box-shadow:0 1px 4px #00000018;vertical-align:middle}
.fju-rank-avatar img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}
.fju-rank-avatar-fallback{font-size:21px;line-height:1;opacity:.8}
@media(max-width:440px){.fju-rank-avatar{width:35px;height:35px;min-width:35px}}
`;
document.head.append(css);

async function urlPrivada(db,bucket,path){
 const key=bucket+':'+path, existing=seen.get(key);
 if(existing&&existing.validUntil>Date.now())return existing.promise;
 const promise=db.storage.from(bucket).createSignedUrl(path,300).then(({data,error})=>error?'':data?.signedUrl||'').catch(()=>'');
 seen.set(key,{promise,validUntil:Date.now()+240000});
 return promise;
}
function verificaImagem(url,wrap){
 return new Promise(resolve=>{
  const img=new Image();
  img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';
  img.onload=()=>{if(wrap.isConnected){wrap.replaceChildren(img);}resolve(true)};
  img.onerror=()=>resolve(false);
  img.src=url;
 });
}
export function criarAvatarRanking(db,usuarioId,{jovemId=null,privado=false,fotoUrl=''}={}){
 const wrap=document.createElement('span');
 wrap.className='fju-rank-avatar';
 wrap.setAttribute('aria-hidden','true');
 const fallback=document.createElement('span');
 fallback.className='fju-rank-avatar-fallback';
 fallback.textContent='👤';
 wrap.append(fallback);
 if(fotoUrl){void verificaImagem(fotoUrl,wrap);return wrap;}
 if(!idPattern.test(String(usuarioId||'')))return wrap;
 let started=false;
 const carrega=async()=>{
  if(started)return;started=true;
  if(privado){
   const caminhos=[['fju-inscricoes-fotos',usuarioId+'/perfil.jpg']];
   if(idPattern.test(String(jovemId||'')))caminhos.push(['fju-fotos',jovemId+'/perfil.jpg']);
   for(const [bucket,path] of caminhos){
    const url=await urlPrivada(db,bucket,path);
    if(url&&await verificaImagem(url,wrap))return;
   }
  }
  const publicUrl=db.storage.from('fju-comentarios-avatars').getPublicUrl(usuarioId+'/perfil.jpg').data?.publicUrl;
  if(publicUrl)await verificaImagem(publicUrl,wrap);
 };
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){observer.disconnect();void carrega()}
  },{rootMargin:'180px'});
  observer.observe(wrap);
 }else void carrega();
 return wrap;
}
