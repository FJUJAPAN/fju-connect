/* FJU JAPAN · Comentários das matérias.
   Leitura pública. Publicação somente de conta autenticada e cadastrada,
   usando automaticamente NOME + FOTO do perfil existente. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const root=document.getElementById('fju-materia-comments');
const articleId=new URLSearchParams(location.search).get('id');
const isUuid=/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(articleId||'');
const lang=()=>{const raw=document.documentElement.lang;return raw==='ja'?'ja':raw==='en'?'en':'pt'};
const labels={
 pt:{title:'Comentários',subtitle:'Converse sobre esta matéria com a comunidade FJU.',loading:'Carregando comentários…',empty:'Seja o primeiro a comentar!',signin:'Para comentar, entre com sua conta FJU JAPAN.',login:'Entrar na My Page',registration:'Complete seu cadastro na FJU JAPAN para comentar.',photoMissing:'Cadastre uma foto no seu perfil antes de comentar.',photoError:'Não foi possível carregar sua foto do perfil.',preview:'Seu nome e sua foto serão exibidos publicamente.',placeholder:'Escreva seu comentário…',send:'Publicar comentário',sending:'Publicando…',more:'Ver mais comentários',failed:'Não foi possível carregar os comentários.',sendError:'Não foi possível publicar: ',nameLabel:'Você está comentando como',delete:'Excluir',confirmDelete:'Excluir este comentário?',deleted:'Comentário excluído.',count:'caracteres restantes',date:'Publicado em',photoAlt:'Foto de perfil de',check:'Consultando seu perfil…',limit:'Até 600 caracteres.',profile:'Abrir My Page',noPhoto:'Foto indisponível',unknown:'Perfil indisponível',like:'Curtir',unlike:'Descurtir',reply:'Responder',replies:'Respostas',replyPlaceholder:'Escreva uma resposta…',postReply:'Enviar resposta',moreReplies:'Ver mais respostas',noReplies:'Nenhuma resposta ainda.',interactLogin:'Entre na FJU JAPAN para curtir ou responder.',featureUnavailable:'Curtidas e respostas estarão disponíveis após atualizar o Supabase.',replySent:'Resposta publicada!',likeFailed:'Não foi possível atualizar a curtida: '},
 ja:{title:'コメント',subtitle:'FJUの仲間と記事について話しましょう。',loading:'コメントを読み込み中…',empty:'最初のコメントを投稿しましょう！',signin:'コメントにはFJU JAPANアカウントでログインしてください。',login:'My Pageでログイン',registration:'コメントするにはFJU JAPANの登録を完了してください。',photoMissing:'コメントするにはプロフィール写真を登録してください。',photoError:'プロフィール写真を読み込めませんでした。',preview:'投稿すると、名前とプロフィール写真が公開されます。',placeholder:'コメントを入力…',send:'コメントを投稿',sending:'投稿中…',more:'もっと見る',failed:'コメントを読み込めませんでした。',sendError:'投稿できませんでした: ',nameLabel:'投稿者',delete:'削除',confirmDelete:'このコメントを削除しますか？',deleted:'コメントを削除しました。',count:'残り文字数',date:'投稿日',photoAlt:'プロフィール写真：',check:'プロフィールを確認中…',limit:'600文字以内で入力してください。',profile:'My Pageを開く',noPhoto:'写真なし',unknown:'プロフィールが見つかりません',like:'いいね',unlike:'いいねを取り消す',reply:'返信',replies:'返信',replyPlaceholder:'返信を書く…',postReply:'返信する',moreReplies:'返信をもっと見る',noReplies:'まだ返信はありません。',interactLogin:'いいね・返信にはFJU JAPANへのログインが必要です。',featureUnavailable:'Supabaseの更新後に「いいね」と返信が利用できます。',replySent:'返信を投稿しました！',likeFailed:'いいねを更新できません: '},
 en:{title:'Comments',subtitle:'Join the FJU community conversation.',loading:'Loading comments…',empty:'Be the first to comment!',signin:'Sign in with your FJU JAPAN account to comment.',login:'Sign in to My Page',registration:'Complete your FJU JAPAN registration to comment.',photoMissing:'Add a profile photo before commenting.',photoError:'Could not load your profile photo.',preview:'Your name and profile photo will be shown publicly.',placeholder:'Write a comment…',send:'Post comment',sending:'Posting…',more:'Show more comments',failed:'Could not load comments.',sendError:'Could not post: ',nameLabel:'Commenting as',delete:'Delete',confirmDelete:'Delete this comment?',deleted:'Comment deleted.',count:'characters remaining',date:'Posted',photoAlt:'Profile photo of',check:'Checking your profile…',limit:'Up to 600 characters.',profile:'Open My Page',noPhoto:'Photo unavailable',unknown:'Profile unavailable',like:'Like',unlike:'Unlike',reply:'Reply',replies:'Replies',replyPlaceholder:'Write a reply…',postReply:'Post reply',moreReplies:'More replies',noReplies:'No replies yet.',interactLogin:'Sign in to FJU JAPAN to like or reply.',featureUnavailable:'Likes and replies will be available after the Supabase update.',replySent:'Reply posted!',likeFailed:'Could not update like: '}
};
const t=()=>labels[lang()]||labels.pt;
const element=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const status=(area,text,error=false)=>{area.textContent=text;area.classList.toggle('is-error',error)};
const prettyTime=(value)=>{try{return new Intl.DateTimeFormat(lang()==='ja'?'ja-JP':lang()==='en'?'en-US':'pt-BR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date(value));}catch(_){return ''}};
const publicAvatar=(path)=>db.storage.from('fju-comentarios-avatars').getPublicUrl(path).data.publicUrl;
const profileLink=()=>{const a=element('a','fju-comments-login',t().login);a.href='./#my-page';return a};
let currentUser=null,allowedName='',roleNational=false,profileBlob=null,previewUrl=null,moreOffset=0,hasMore=false,busy=false,loadVersion=0,interactionEnabled=false,avatarReadyForSession=false;
function clearPreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}profileBlob=null;avatarReadyForSession=false}
function canInteract(){return !!(interactionEnabled&&currentUser&&allowedName&&profileBlob)}
function showInteractionError(box,error){
 const text=error?.message||String(error||t().interactLogin);
 status(box,text,true);
}
async function checkCommenter(){
 if(!canInteract())throw new Error(t().interactLogin);
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user||user.id!==currentUser?.id)throw new Error(t().interactLogin);
 // Garante que a foto da My Page usada no comentário/resposta
 // é a mesma do perfil, sem solicitação de novo upload ao usuário.
 if(!avatarReadyForSession){
  const upload=await db.storage.from('fju-comentarios-avatars')
   .upload(user.id+'/perfil.jpg',profileBlob,{upsert:true,contentType:'image/jpeg',cacheControl:'60'});
  if(upload.error)throw upload.error;
  avatarReadyForSession=true;
 }
 return user;
}
function renderComment(row,isReply=false){
 const item=element('article','fju-comment'+(isReply?' fju-comment-is-reply':''));
 const avatar=element('img','fju-comment-avatar');
 avatar.alt=t().photoAlt+' '+row.autor_nome;
 avatar.loading='lazy';avatar.decoding='async';
 avatar.src=publicAvatar(row.avatar_path||row.autor_id+'/perfil.jpg');
 avatar.addEventListener('error',()=>{avatar.classList.add('fju-comment-avatar-error');avatar.alt=t().noPhoto});
 const body=element('div','fju-comment-main');
 const head=element('div','fju-comment-head');
 head.append(element('strong','fju-comment-name',row.autor_nome));
 const time=element('time','fju-comment-time',prettyTime(row.criado_em));
 time.dateTime=row.criado_em;head.append(time);
 if(currentUser&&(currentUser.id===row.autor_id||roleNational)){
  const remove=element('button','fju-comment-delete',t().delete);remove.type='button';
  remove.addEventListener('click',async()=>{
   if(!confirm(t().confirmDelete))return;
   remove.disabled=true;
   const {error}=await db.rpc('fju_remover_comentario_materia',{p_comentario_id:row.id});
   if(error){alert(t().sendError+error.message);remove.disabled=false;return}
   await refreshComments();
  });head.append(remove);
 }
 body.append(head,element('p','fju-comment-text',row.texto));
 if(interactionEnabled){
  const actions=element('div','fju-comment-actions');
  let liked=Boolean(row.curtiu),count=Number(row.curtidas||0);
  const like=element('button','fju-comment-like',null);like.type='button';
  function updateLike(){
   like.replaceChildren(element('span','fju-comment-heart',liked?'♥':'♡'),document.createTextNode(' '+count));
   like.setAttribute('aria-label',(liked?t().unlike:t().like)+' · '+count);
   like.setAttribute('aria-pressed',String(liked));
   like.classList.toggle('is-liked',liked);
  }
  updateLike();
  const actionFeedback=element('span','fju-comment-feedback');actionFeedback.setAttribute('role','status');
  like.addEventListener('click',async()=>{
   like.disabled=true;status(actionFeedback,'');
   try{
    await checkCommenter();
    const {data,error}=await db.rpc('fju_alternar_curtida_comentario',{p_comentario_id:row.id});
    if(error)throw error;
    const previous=liked;liked=data===true;
    count=Math.max(0,count+(liked&&!previous?1:!liked&&previous?-1:0));
    updateLike();
   }catch(error){showInteractionError(actionFeedback,error)}
   finally{like.disabled=false}
  });
  actions.append(like);
  if(!isReply){
   let replyCount=Number(row.respostas||0);
   const replyBtn=element('button','fju-comment-reply-toggle',t().reply+' · '+replyCount);
   replyBtn.type='button';replyBtn.setAttribute('aria-expanded','false');
   const thread=element('section','fju-comment-thread');thread.hidden=true;
   const threadStatus=element('p','fju-comments-status');threadStatus.setAttribute('role','status');
   const threadList=element('div','fju-comment-replies');
   const threadMore=element('button','fju-comments-more',t().moreReplies);threadMore.type='button';threadMore.hidden=true;
   const threadForm=element('div','fju-comment-reply-form');
   let replyOffset=0,loadingReplies=false;
   async function loadReplies(reset){
    if(loadingReplies)return;
    loadingReplies=true;threadMore.disabled=true;
    if(reset){replyOffset=0;threadList.replaceChildren();status(threadStatus,t().loading)}
    try{
     const {data,error}=await db.rpc('fju_listar_respostas_comentario',{
      p_comentario_id:row.id,p_limite:20,p_offset:replyOffset
     });
     if(error)throw error;
     const rows=Array.isArray(data)?data:[];
     status(threadStatus,reset&&!rows.length?t().noReplies:'');
     for(const reply of rows)threadList.append(renderComment(reply,true));
     replyOffset+=rows.length;
     threadMore.hidden=rows.length<20;
    }catch(error){showInteractionError(threadStatus,error);threadMore.hidden=true}
    finally{loadingReplies=false;threadMore.disabled=false}
   }
   threadMore.addEventListener('click',()=>void loadReplies(false));
   function showReplyForm(){
    threadForm.replaceChildren();
    if(!canInteract()){
     threadForm.append(element('p','fju-comment-reply-hint',t().interactLogin),profileLink());
     return;
    }
    const who=element('div','fju-comment-reply-identity');
    const miniature=element('img','fju-comment-mini-avatar');miniature.src=previewUrl||'';miniature.alt=t().photoAlt+' '+allowedName;
    who.append(miniature,element('strong','',allowedName));
    const form=element('form','fju-comment-compose');
    const input=element('textarea','fju-comments-text');input.rows=2;input.maxLength=600;input.required=true;input.placeholder=t().replyPlaceholder;
    const send=element('button','fju-comments-submit',t().postReply);send.type='submit';
    const feedback=element('p','fju-comments-feedback');feedback.setAttribute('role','status');
    form.append(input,send,feedback);threadForm.append(who,form);
    let sending=false;
    form.addEventListener('submit',async e=>{
     e.preventDefault();const msg=input.value.trim();
     if(sending||msg.length<1||msg.length>600)return;
     sending=true;send.disabled=true;input.disabled=true;status(feedback,t().sending);
     try{
      await checkCommenter();
      const {error}=await db.rpc('fju_responder_comentario_materia',{
       p_comentario_id:row.id,p_texto:msg
      });
      if(error)throw error;
      input.value='';replyCount++;replyBtn.textContent=t().reply+' · '+replyCount;
      await loadReplies(true);
      status(feedback,t().replySent);
     }catch(error){showInteractionError(feedback,error)}
     finally{sending=false;send.disabled=false;input.disabled=false}
    });
   }
   thread.append(threadStatus,threadList,threadMore,threadForm);
   replyBtn.addEventListener('click',()=>{
    const opening=thread.hidden;
    thread.hidden=!opening;replyBtn.setAttribute('aria-expanded',String(opening));
    if(opening){showReplyForm();void loadReplies(true)}
   });
   actions.append(replyBtn);body.append(actions,actionFeedback,thread);
  }else{
   body.append(actions,actionFeedback);
  }
 }
 item.append(avatar,body);return item;
}
async function appendPage(reset=false){
 const ver=++loadVersion;
 if(reset){moreOffset=0;hasMore=false;list.replaceChildren();status(message,t().loading)}
 more.disabled=true;
 let {data,error}=await db.rpc('fju_listar_interacoes_materia',{
  p_materia_id:articleId,p_limite:20,p_offset:moreOffset
 });
 interactionEnabled=!error;
 if(error){
  // Antes da migração SQL, a listagem original segue funcionando.
  const old=await db.rpc('fju_listar_comentarios_materia',{
   p_materia_id:articleId,p_limite:20,p_offset:moreOffset
  });
  data=old.data;error=old.error;
  if(!error)status(message,t().featureUnavailable);
 }
 if(ver!==loadVersion)return;
 if(error){status(message,t().failed+' '+error.message,true);more.hidden=true;return}
 if(interactionEnabled)status(message,'');
 const rows=Array.isArray(data)?data:[];
 if(reset&&!rows.length)status(message,t().empty);
 for(const row of rows)list.append(renderComment(row));
 moreOffset+=rows.length;hasMore=rows.length===20;more.hidden=!hasMore;more.disabled=false;
}
const refreshComments=()=>appendPage(true);
async function sourceProfilePhoto(user){
 // As fotos originais permanecem privadas. Só a CÓPIA publicada com o comentário é aberta.
 for(const bucket of ['fju-coordenadores','fju-inscricoes-fotos']){
  try{
   const {data,error}=await db.storage.from(bucket).download(user.id+'/perfil.jpg');
   if(!error&&data&&data.size>0&&data.type==='image/jpeg'&&data.size<=350*1024)return data;
  }catch(_){}
 }
 return null;
}
async function loadCommenter(){
 const userVersion=++authVersion;
 loginArea.replaceChildren();formArea.replaceChildren();
 clearPreview();allowedName='';currentUser=null;roleNational=false;
 const {data:{user},error:authError}=await db.auth.getUser();
 if(userVersion!==authVersion)return;
 if(authError||!user){
  loginArea.append(element('p','',t().signin),profileLink());
  return;
 }
 currentUser=user;
 loginArea.append(element('p','fju-comments-check',t().check));
 const [meta,role]=await Promise.all([
  db.rpc('fju_meu_perfil_comentarios'),
  db.from('fju_perfis').select('papel,ativo').eq('usuario_id',user.id).maybeSingle()
 ]);
 if(userVersion!==authVersion)return;
 roleNational=!role.error&&role.data?.papel==='nacional'&&role.data?.ativo===true;
 if(meta.error){status(loginArea,t().registration+' '+meta.error.message,true);return}
 if(!meta.data?.habilitado||!meta.data?.nome){
  loginArea.replaceChildren(element('p','',t().registration),profileLink());return;
 }
 allowedName=meta.data.nome;
 const photo=await sourceProfilePhoto(user);
 if(userVersion!==authVersion)return;
 if(!photo){
  loginArea.replaceChildren(element('p','',t().photoMissing),profileLink());return;
 }
 profileBlob=photo;previewUrl=URL.createObjectURL(photo);
 loginArea.replaceChildren();
 const who=element('div','fju-comments-who');
 const avatar=element('img','fju-comments-own-avatar');avatar.src=previewUrl;avatar.alt=t().photoAlt+' '+allowedName;
 const identity=element('div','fju-comments-identity');identity.append(element('small','',t().nameLabel),element('strong','',allowedName));
 who.append(avatar,identity);loginArea.append(who);
 const form=element('form','fju-comments-form');
 const input=element('textarea','fju-comments-text');input.rows=3;input.maxLength=600;input.required=true;input.placeholder=t().placeholder;input.setAttribute('aria-label',t().placeholder);
 const counter=element('span','fju-comments-counter','600 '+t().count);
 input.addEventListener('input',()=>{counter.textContent=(600-input.value.length)+' '+t().count});
 const footer=element('div','fju-comments-form-actions');
 const button=element('button','fju-comments-submit',t().send);button.type='submit';
 footer.append(counter,button);form.append(input,element('p','fju-comments-public-notice',t().preview),footer);
 const feedback=element('p','fju-comments-feedback');feedback.setAttribute('role','status');
 form.append(feedback);formArea.append(form);
 void refreshComments();
 form.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const msg=input.value.trim();
  if(busy||!currentUser||!profileBlob||!allowedName||msg.length<1||msg.length>600)return;
  busy=true;button.disabled=true;input.disabled=true;status(feedback,t().sending);
  try{
   const{data:{user:validUser},error:userError}=await db.auth.getUser();
   if(userError||!validUser||validUser.id!==currentUser.id)throw new Error(t().signin);
   const {error:uploadError}=await db.storage.from('fju-comentarios-avatars')
     .upload(validUser.id+'/perfil.jpg',profileBlob,{upsert:true,contentType:'image/jpeg',cacheControl:'60'});
   if(uploadError)throw uploadError;
   avatarReadyForSession=true;
   const {error}=await db.rpc('fju_publicar_comentario_materia',{p_materia_id:articleId,p_texto:msg});
   if(error)throw error;
   input.value='';counter.textContent='600 '+t().count;status(feedback,'');
   await refreshComments();
  }catch(error){status(feedback,t().sendError+(error?.message||t().photoError),true)}
  finally{busy=false;button.disabled=false;input.disabled=false}
 });
}
let authVersion=0,initialized=false;
const h=element('div','fju-comments-title');
h.append(element('h2','',t().title),element('p','',t().subtitle));
const list=element('div','fju-comments-list');list.setAttribute('aria-live','polite');
const message=element('p','fju-comments-status');message.setAttribute('role','status');
const loginArea=element('div','fju-comments-login-area');
const formArea=element('div','fju-comments-form-area');
const more=element('button','fju-comments-more',t().more);more.type='button';more.hidden=true;
more.addEventListener('click',()=>void appendPage(false));
root.append(h,loginArea,formArea,message,list,more);
async function start(){
 if(!isUuid||root.hidden||initialized)return;
 initialized=true;
 void loadCommenter();
 void refreshComments();
}
window.addEventListener('fju:article-ready',()=>{
 if(!initialized){void start();return}
 h.querySelector('h2').textContent=t().title;
 h.querySelector('p').textContent=t().subtitle;
 more.textContent=t().more;
 void loadCommenter();
 void refreshComments();
});
void start();
db.auth.onAuthStateChange(()=>{if(initialized)queueMicrotask(()=>{void loadCommenter();void refreshComments()})});
window.addEventListener('pageshow',()=>{if(initialized)void loadCommenter()});
