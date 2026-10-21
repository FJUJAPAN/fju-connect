/* FJU JAPAN: shared authenticated avatar in public subpage headers. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const client=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const link=document.querySelector('.fju-subpage-my-page');
if(link){
 const css=document.createElement('style');
 css.textContent='.fju-subpage-my-page.fju-has-avatar{padding:2px;min-width:38px;width:38px;height:38px;border-radius:50%}.fju-subpage-my-page img{width:32px;height:32px;object-fit:cover;border-radius:50%;display:block}';
 document.head.append(css);
 let generation=0;
 let objectUrl='';
 async function render(user){
  const current=++generation;
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}
  link.classList.remove('fju-has-avatar');
  link.replaceChildren(document.createTextNode(user?'MY PAGE':'LOGIN'));
  if(!user)return;
  const meta=user.user_metadata||{};
  let src=meta.avatar_url||meta.picture||meta.photo_url||'';
  if(!src){
   try{
    const {data:card}=await client.from('fju_coordenador_cards').select('foto_path').eq('usuario_id',user.id).maybeSingle();
    if(card?.foto_path){
     const {data:blob}=await client.storage.from('fju-coordenadores').download(card.foto_path);
     if(blob){src=URL.createObjectURL(blob);objectUrl=src;}
    }
   }catch(_){}
  }
  if(current!==generation)return;
  if(src){
   const img=document.createElement('img');
   img.alt='Minha foto';
   img.src=src;
   img.onerror=()=>{if(current===generation){link.classList.remove('fju-has-avatar');link.textContent='MY PAGE';}};
   link.replaceChildren(img);
   link.classList.add('fju-has-avatar');
  }
 }
 client.auth.getUser().then(({data})=>render(data?.user||null)).catch(()=>{});
 client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>{void render(session?.user||null);},0);});
}
