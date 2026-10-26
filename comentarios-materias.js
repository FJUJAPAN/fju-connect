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
 pt:{title:'Comentários',subtitle:'Converse sobre esta matéria com a comunidade FJU.',loading:'Carregando comentários…',empty:'Seja o primeiro a comentar!',signin:'Para comentar, entre com sua conta FJU JAPAN.',login:'Entrar na My Page',registration:'Complete seu cadastro na FJU JAPAN para comentar.',photoMissing:'Cadastre uma foto no seu perfil antes de comentar.',photoError:'Não foi possível carregar sua foto do perfil.',preview:'Seu nome e sua foto serão exibidos publicamente.',placeholder:'Escreva seu comentário…',send:'Publicar comentário',sending:'Publicando…',more:'Ver mais comentários',failed:'Não foi possível carregar os comentários.',sendError:'Não foi possível publicar: ',nameLabel:'Você está comentando como',delete:'Excluir',confirmDelete:'Excluir este comentário?',deleted:'Comentário excluído.',count:'caracteres restantes',date:'Publicado em',photoAlt:'Foto de perfil de',check:'Consultando seu perfil…',limit:'Até 600 caracteres.',profile:'Abrir My Page',noPhoto:'Foto indisponível',unknown:'Perfil indisponível'},
 ja:{title:'コメント',subtitle:'FJUの仲間と記事について話しましょう。',loading:'コメントを読み込み中…',empty:'最初のコメントを投稿しましょう！',signin:'コメントにはFJU JAPANアカウントでログインしてください。',login:'My Pageでログイン',registration:'コメントするにはFJU JAPANの登録を完了してください。',photoMissing:'コメントするにはプロフィール写真を登録してください。',photoError:'プロフィール写真を読み込めませんでした。',preview:'投稿すると、名前とプロフィール写真が公開されます。',placeholder:'コメントを入力…',send:'コメントを投稿',sending:'投稿中…',more:'もっと見る',failed:'コメントを読み込めませんでした。',sendError:'投稿できませんでした: ',nameLabel:'投稿者',delete:'削除',confirmDelete:'このコメントを削除しますか？',deleted:'コメントを削除しました。',count:'残り文字数',date:'投稿日',photoAlt:'プロフィール写真：',check:'プロフィールを確認中…',limit:'600文字以内で入力してください。',profile:'My Pageを開く',noPhoto:'写真なし',unknown:'プロフィールが見つかりません'},
 en:{title:'Comments',subtitle:'Join the FJU community conversation.',loading:'Loading comments…',empty:'Be the first to comment!',signin:'Sign in with your FJU JAPAN account to comment.',login:'Sign in to My Page',registration:'Complete your FJU JAPAN registration to comment.',photoMissing:'Add a profile photo before commenting.',photoError:'Could not load your profile photo.',preview:'Your name and profile photo will be shown publicly.',placeholder:'Write a comment…',send:'Post comment',sending:'Posting…',more:'Show more comments',failed:'Could not load comments.',sendError:'Could not post: ',nameLabel:'Commenting as',delete:'Delete',confirmDelete:'Delete this comment?',deleted:'Comment deleted.',count:'characters remaining',date:'Posted',photoAlt:'Profile photo of',check:'Checking your profile…',limit:'Up to 600 characters.',profile:'Open My Page',noPhoto:'Photo unavailable',unknown:'Profile unavailable'}
};
const t=()=>labels[lang()]||labels.pt;
const element=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const status=(area,text,error=false)=>{area.textContent=text;area.classList.toggle('is-error',error)};
const prettyTime=(value)=>{try{return new Intl.DateTimeFormat(lang()==='ja'?'ja-JP':lang()==='en'?'en-US':'pt-BR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date(value));}catch(_){return ''}};
const publicAvatar=(path)=>db.storage.from('fju-comentarios-avatars').getPublicUrl(path).data.publicUrl;
const profileLink=()=>{const a=element('a','fju-comments-login',t().login);a.href='./#my-page';return a};
let currentUser=null,allowedName='',roleNational=false,profileBlob=null,previewUrl=null,moreOffset=0,hasMore=false,busy=false,loadVersion=0;
function clearPreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}profileBlob=null}
function renderComment(row){
 const item=element('article','fju-comment');
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
 body.append(head,element('p','fju-comment-text',row.texto));item.append(avatar,body);return item;
}
async function appendPage(reset=false){
 const ver=++loadVersion;
 if(reset){moreOffset=0;hasMore=false;list.replaceChildren();status(message,t().loading)}
 more.disabled=true;
 const {data,error}=await db.rpc('fju_listar_comentarios_materia',{p_materia_id:articleId,p_limite:20,p_offset:moreOffset});
 if(ver!==loadVersion)return;
 if(error){status(message,t().failed+' '+error.message,true);more.hidden=true;return}
 status(message,'');
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
window.addEventListener('fju:article-ready',()=>void start());
void start();
db.auth.onAuthStateChange(()=>{if(initialized)queueMicrotask(()=>{void loadCommenter();void refreshComments()})});
window.addEventListener('pageshow',()=>{if(initialized)void loadCommenter()});
