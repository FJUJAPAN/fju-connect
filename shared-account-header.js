/* FJU JAPAN — cabeçalho de conta compartilhado nas páginas públicas. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const header=document.querySelector('body > header');
if(header){
  const root=new URL('./',import.meta.url);
  const link=document.createElement('a');
  link.className='fju-shared-account';
  link.href=new URL('index.html#my-page',root).href;
  link.setAttribute('aria-label','Login / My Page');
  link.textContent='LOGIN';
  const anchor=header.querySelector('.header-side,.lang-wrap,.head-row,.header-in')||header;
  anchor.append(link);
  const style=document.createElement('style');
  style.textContent='.fju-shared-account{display:inline-flex;align-items:center;justify-content:center;flex:none;min-width:38px;min-height:38px;padding:5px 10px;border:1px solid #a37bd5;border-radius:20px;background:#281e42;color:white;text-decoration:none;font:700 11px system-ui,sans-serif}.fju-shared-account img{width:32px;height:32px;object-fit:cover;border-radius:50%;display:block}@media(max-width:740px){.fju-shared-account{padding:2px;min-width:38px;height:38px}.fju-shared-account:not(:has(img)){font-size:9px}}';
  document.head.append(style);
  const setUser=async user=>{
    link.replaceChildren();
    if(!user){link.textContent='LOGIN';return;}
    link.setAttribute('aria-label','My Page');
    const meta=user.user_metadata||{};
    let src=meta.avatar_url||meta.picture||meta.photo_url||'';
    if(!src){
      try{
        const {data:card}=await supabase.from('fju_coordenador_cards').select('foto_path').eq('usuario_id',user.id).maybeSingle();
        if(card?.foto_path){
          const {data:blob}=await supabase.storage.from('fju-coordenadores').download(card.foto_path);
          if(blob){src=URL.createObjectURL(blob);link.dataset.objectUrl=src;}
        }
      }catch(_){}
    }
    if(src){
      const img=document.createElement('img');img.alt='Minha foto';img.src=src;
      img.onerror=()=>{link.replaceChildren(document.createTextNode('MY PAGE'));};
      link.append(img);
    }else link.textContent='MY PAGE';
  };
  supabase.auth.getUser().then(({data})=>setUser(data?.user)).catch(()=>{});
  supabase.auth.onAuthStateChange((_event,session)=>{
    if(link.dataset.objectUrl){URL.revokeObjectURL(link.dataset.objectUrl);delete link.dataset.objectUrl;}
    void setUser(session?.user||null);
  });
}
