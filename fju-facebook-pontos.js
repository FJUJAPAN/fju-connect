import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const dateJP=d=>{const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);const f=k=>p.find(x=>x.type===k).value;return f('year')+'-'+f('month')+'-'+f('day')};
function showConfirm(type,container,resolveId){
 if(!container||container.querySelector('.fju-facebook-confirm'))return;
 const area=document.createElement('div');area.className='fju-facebook-confirm';
 area.style.cssText='padding:14px;margin:12px auto;max-width:760px;background:#ecf3ff;color:#153358;border:1px solid #a2c0ed;border-radius:12px;font:14px/1.6 system-ui';
 const note=document.createElement('p');note.textContent='⭐ +10 pontos pelo compartilhamento no Facebook. Confirme somente após publicar. A FJU registra sua declaração; o Facebook não informa ao site se a postagem foi concluída.';note.style.margin='0 0 10px';
 const button=document.createElement('button');button.type='button';button.textContent='✓ Já publiquei no Facebook (+10 pontos)';button.style.cssText='display:block;width:100%;border:0;border-radius:9px;background:#1877f2;color:white;font:800 14px system-ui;padding:13px;cursor:pointer;margin:0';
 const msg=document.createElement('p');msg.setAttribute('role','status');msg.style.margin='8px 0 0';area.append(note,button,msg);container.append(area);
 button.addEventListener('click',async()=>{
  if(!confirm('Você confirma que realmente publicou no Facebook? Esta ação vale pontos apenas uma vez para cada conteúdo.'))return;
  button.disabled=true;msg.textContent='Validando conta…';
  try{const {data:{user},error:authError}=await db.auth.getUser();if(authError||!user)throw new Error('Faça login na My Page.');
   const id=await resolveId(user);if(!id)throw new Error('Nenhum conteúdo válido foi encontrado nesta conta.');
   const {data,error}=await db.rpc('fju_registrar_compartilhamento_facebook',{p_tipo:type,p_referencia_id:id});
   if(error)throw error;
   msg.textContent=data?'✅ +10 pontos registrados!':'Esta publicação já recebeu pontos.';
   button.textContent='✓ Confirmado';
  }catch(e){msg.textContent=e?.message||'Não foi possível registrar.';button.disabled=false;}
 });
}
if(location.pathname.endsWith('/materia.html')){
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('.share-facebook');if(!link)return;
  const id=new URLSearchParams(location.search).get('id');
  if(!/^[a-f\d]{8}-[a-f\d-]{27,}$/i.test(id||''))return;
  const container=link.closest('.share')||link.parentElement?.parentElement;
  showConfirm('materia',container,async()=>id);
 });
}
if(location.pathname.includes('/check-in/')){
 const preview=document.getElementById('card-preview-wrap');
 const share=document.getElementById('share');
 if(preview&&share){
  function update(){
   if(preview.style.display==='none'||!preview.querySelector('img')?.getAttribute('src'))return;
   showConfirm('checkin',share.parentElement,async user=>{
    const {data,error}=await db.from('fju_checkin_presencas').select('id,registrado_em').eq('usuario_id',user.id).order('registrado_em',{ascending:false}).limit(1);
    if(error)throw error;const last=data?.[0];if(!last||dateJP(new Date(last.registrado_em))!==dateJP(new Date()))return null;return last.id;
   });
  }
  new MutationObserver(update).observe(preview,{attributes:true,attributeFilter:['style']});
  new MutationObserver(update).observe(preview.querySelector('img'),{attributes:true,attributeFilter:['src']});
  update();
 }
}
