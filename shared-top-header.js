/* FJU JAPAN: shared subpage app header; bottom navigation is not modified. */
const $=id=>document.getElementById(id);
const nativeLang=$('lang');
const flag=$('fju-sub-flag'),flagMenu=$('fju-sub-flags');
const flags={pt:'🇧🇷',ja:'🇯🇵',en:'🇺🇸'};
const panels=[
  [$('fju-sub-search'),$('fju-sub-search-panel')],
  [$('fju-sub-bell'),$('fju-sub-notify-panel')],
  [$('fju-sub-menu'),$('fju-sub-menu-panel')],
  [flag,flagMenu]
];
function closePanels(except=null){
  for(const [button,panel] of panels){
    if(!panel||panel===except)continue;
    panel.hidden=true;
    button?.setAttribute('aria-expanded','false');
  }
}
for(const [button,panel] of panels){
  button?.addEventListener('click',()=>{
    const open=panel.hidden;
    closePanels();
    panel.hidden=!open;
    button.setAttribute('aria-expanded',String(open));
    if(open&&panel.id==='fju-sub-search-panel')$('fju-sub-search-input')?.focus();
  });
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.fju-unified-header'))closePanels();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels();});
function syncFlag(){
  const lang=nativeLang?.value||'pt';
  flag.textContent=flags[lang]||flags.pt;
  flagMenu.querySelectorAll('[data-lang]').forEach(button=>{
    button.hidden=button.dataset.lang===lang;
  });
}
flagMenu.querySelectorAll('[data-lang]').forEach(button=>{
  button.addEventListener('click',()=>{
    if(nativeLang){
      nativeLang.value=button.dataset.lang;
      nativeLang.dispatchEvent(new Event('change',{bubbles:true}));
    }
    syncFlag();closePanels();
  });
});
nativeLang?.addEventListener('change',syncFlag);
syncFlag();
// The page's existing search box provides real search/filtering.
const localSearch=$('search');
const quickSearch=$('fju-sub-search-input');
quickSearch?.addEventListener('input',()=>{
  if(!localSearch)return;
  localSearch.value=quickSearch.value;
  localSearch.dispatchEvent(new Event('input',{bubbles:true}));
  localSearch.dispatchEvent(new Event('change',{bubbles:true}));
});
$('fju-sub-profile')?.addEventListener('click',()=>{window.location.href='../#my-page';});
// Auth state and profile photo use the same private data as the Home header.
try{
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
  let requestId=0,objectUrl='';
  const avatar=$('fju-sub-avatar'),guest=$('fju-sub-guest'),bell=$('fju-sub-bell');
  function setAvatar(url=''){
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}
    avatar.hidden=!url;
    guest.hidden=!!url;
    if(url)avatar.src=url;
    else avatar.removeAttribute('src');
  }
  async function updateHeader(user){
    const request=++requestId;
    bell.hidden=!user;
    if(!user){setAvatar();return;}
    const meta=user.user_metadata||{};
    setAvatar(meta.avatar_url||meta.picture||meta.photo_url||'');
    try{
      const {data,error}=await supabase.from('fju_coordenador_cards').select('foto_path').eq('usuario_id',user.id).maybeSingle();
      if(error||!data?.foto_path||request!==requestId)return;
      const {data:blob,error:downloadError}=await supabase.storage.from('fju-coordenadores').download(data.foto_path);
      if(downloadError||!blob||request!==requestId)return;
      const url=URL.createObjectURL(blob);
      if(request!==requestId){URL.revokeObjectURL(url);return;}
      setAvatar();
      objectUrl=url;avatar.src=url;avatar.hidden=false;guest.hidden=true;
    }catch(_){}
  }
  const {data:{session}}=await supabase.auth.getSession();
  await updateHeader(session?.user||null);
  supabase.auth.onAuthStateChange((_event,session)=>{void updateHeader(session?.user||null);});
}catch(_){}
