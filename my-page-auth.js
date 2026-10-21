/* FJU CONNECT JAPAN — acesso no site oficial, sem redirecionar após login.
   Compartilha o Supabase Auth com /fju-connect-admin/ na mesma origem GitHub Pages.
   Não autoriza funções administrativas: isso depende de perfis + RLS no Supabase. */
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const client=createClient(
  'https://hmacroktklgwkofxsygv.supabase.co',
  'sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ'
);
const byId=id=>document.getElementById(id);
const dialog=byId('fju-account-dialog');
const feedback=byId('fju-account-feedback');
const loginForm=byId('fju-account-login-form');
const forgotForm=byId('fju-account-forgot-form');
const resetForm=byId('fju-account-reset-form');
const myPage=byId('fju-account-my-page');
const loading=byId('fju-account-loading');
const accountAccess=byId('fju-account-admin-access');
const adminButton=byId('fju-account-admin-link');
const localeSelect=byId('language');

const translations={
  pt:{
    loginHeader:'LOGIN',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'Sua conta FJU Connect JAPAN, sem sair do site oficial.',
    loading:'Verificando sua conta...',
    email:'E-mail',password:'Senha',loginButton:'Entrar',
    forgotLink:'Esqueci minha senha',forgotTitle:'Recuperar acesso',
    forgotSubtitle:'Enviaremos as instruções para seu e-mail cadastrado.',
    sendRecovery:'Enviar recuperação',backLogin:'Voltar ao login',
    resetTitle:'Criar nova senha',newPassword:'Nova senha',confirmPassword:'Confirmar senha',
    savePassword:'Salvar nova senha',
    loggedIn:'Você está conectado',account:'Conta',
    roleLabel:'Acesso',national:'Administrador Nacional',coordinator:'Coordenador',member:'Membro',
    church:'Igreja',adminTitle:'Área administrativa',
    adminDescription:'Acesse as fichas, os relatórios e as autorizações de sua responsabilidade.',
    openAdmin:'Entrar no painel administrativo',
    memberDescription:'Sua MY PAGE de jovem está em preparação. Você pode continuar usando o site da FJU normalmente.',
    loginError:'Não foi possível entrar. Confira seu e-mail e senha.',
    sessionError:'Não foi possível verificar sua sessão. Tente novamente.',
    profileError:'Não foi possível verificar suas permissões. Acesso administrativo indisponível neste momento.',
    loggingIn:'Entrando...',loggedInStatus:'Login realizado! Você continua no site oficial.',
    signedOut:'Você saiu da conta.',logout:'Sair da conta',
    recovering:'Enviando instruções...',recoverySent:'Se o e-mail estiver cadastrado, você receberá instruções para recuperar sua senha.',
    recoveryError:'Não foi possível solicitar a recuperação. Tente novamente.',
    passwordMismatch:'As senhas precisam ser iguais e ter pelo menos 8 caracteres.',
    updatingPassword:'Atualizando senha...',passwordUpdated:'Senha alterada. Entre novamente.',
    passwordUpdateError:'Não foi possível alterar a senha.',
    close:'Fechar'
  },
  ja:{
    loginHeader:'ログイン',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'FJU公式サイトから離れずにログインできます。',
    loading:'アカウントを確認しています...',
    email:'メールアドレス',password:'パスワード',loginButton:'ログイン',
    forgotLink:'パスワードを忘れた方',forgotTitle:'パスワードの再設定',
    forgotSubtitle:'登録メールアドレスに案内を送信します。',
    sendRecovery:'再設定メールを送信',backLogin:'ログインに戻る',
    resetTitle:'新しいパスワード',newPassword:'新しいパスワード',confirmPassword:'パスワードの確認',
    savePassword:'パスワードを保存',
    loggedIn:'ログイン中',account:'アカウント',
    roleLabel:'権限',national:'全国管理者',coordinator:'コーディネーター',member:'メンバー',
    church:'教会',adminTitle:'管理者ページ',
    adminDescription:'担当する登録カード、報告、承認を確認できます。',
    openAdmin:'管理パネルを開く',
    memberDescription:'青年用MY PAGEは現在準備中です。FJU公式サイトは引き続きご利用いただけます。',
    loginError:'ログインできませんでした。メールアドレスとパスワードをご確認ください。',
    sessionError:'セッションを確認できませんでした。もう一度お試しください。',
    profileError:'権限を確認できませんでした。現在、管理パネルにはアクセスできません。',
    loggingIn:'ログインしています...',loggedInStatus:'ログインしました。公式サイトにそのまま滞在できます。',
    signedOut:'ログアウトしました。',logout:'ログアウト',
    recovering:'送信しています...',recoverySent:'登録されたメールアドレスには再設定の案内が届きます。',
    recoveryError:'再設定メールを送信できませんでした。',
    passwordMismatch:'8文字以上の同じパスワードを2回入力してください。',
    updatingPassword:'保存しています...',passwordUpdated:'パスワードを変更しました。再度ログインしてください。',
    passwordUpdateError:'パスワードを変更できませんでした。',
    close:'閉じる'
  },
  en:{
    loginHeader:'LOGIN',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'Sign in without leaving the official FJU site.',
    loading:'Checking your account...',
    email:'Email',password:'Password',loginButton:'Sign in',
    forgotLink:'Forgot password?',forgotTitle:'Recover access',
    forgotSubtitle:'We will send instructions to your registered email address.',
    sendRecovery:'Send recovery email',backLogin:'Back to login',
    resetTitle:'Set a new password',newPassword:'New password',confirmPassword:'Confirm password',
    savePassword:'Save new password',
    loggedIn:'You are signed in',account:'Account',
    roleLabel:'Access',national:'National Administrator',coordinator:'Coordinator',member:'Member',
    church:'Church',adminTitle:'Administrative area',
    adminDescription:'Open the youth records, weekly reports, and approvals you manage.',
    openAdmin:'Open administrative panel',
    memberDescription:'The youth MY PAGE is being prepared. You can keep browsing the FJU website.',
    loginError:'Could not sign in. Check your email and password.',
    sessionError:'Could not verify the current session. Please try again.',
    profileError:'Could not verify permissions. Administrative access is unavailable right now.',
    loggingIn:'Signing in...',loggedInStatus:'Signed in! You are still on the official website.',
    signedOut:'You have signed out.',logout:'Sign out',
    recovering:'Sending instructions...',recoverySent:'If your email is registered, you will receive instructions to reset your password.',
    recoveryError:'Could not send recovery instructions.',
    passwordMismatch:'Enter matching passwords of at least 8 characters.',
    updatingPassword:'Saving password...',passwordUpdated:'Password updated. Please sign in again.',
    passwordUpdateError:'Could not update the password.',
    close:'Close'
  }
};

let authenticated=false;
let userEmail='';
let lastRole='';
let passwordRecovery=false;
const headerAvatar=byId('fju-header-avatar');
const headerGuest=document.querySelector('.fju-profile-guest');
const headerNotify=byId('fju-notification-toggle');
let headerAvatarObjectUrl='';
function clearHeaderAvatarObjectUrl(){
  if(headerAvatarObjectUrl){
    URL.revokeObjectURL(headerAvatarObjectUrl);
    headerAvatarObjectUrl='';
  }
}
function setHeaderAvatarSource(src=''){
  if(!headerAvatar)return;
  clearHeaderAvatarObjectUrl();
  if(src){
    headerAvatar.src=src;
    headerAvatar.hidden=false;
    if(headerGuest)headerGuest.hidden=true;
  }else{
    headerAvatar.removeAttribute('src');
    headerAvatar.hidden=true;
    if(headerGuest)headerGuest.hidden=false;
  }
}
async function loadStoredHeaderAvatar(user,current){
  if(!user||!headerAvatar)return;
  try{
    const {data:card,error:cardError}=await client
      .from('fju_coordenador_cards')
      .select('foto_path,nome_exibicao')
      .eq('usuario_id',user.id)
      .maybeSingle();
    if(cardError||current!==updateSequence||passwordRecovery)return;
    if(card?.nome_exibicao?.trim())byId('fju-member-card-name').textContent=card.nome_exibicao.trim();
    if(!card?.foto_path)return;
    const {data:blob,error:photoError}=await client.storage
      .from('fju-coordenadores')
      .download(card.foto_path);
    if(photoError||!blob||current!==updateSequence||passwordRecovery)return;
    clearHeaderAvatarObjectUrl();
    headerAvatarObjectUrl=URL.createObjectURL(blob);
    headerAvatar.src=headerAvatarObjectUrl;
    headerAvatar.hidden=false;
    if(headerGuest)headerGuest.hidden=true;
  }catch(_){}
}
async function loadYouthPreviewPhoto(user,current){
 try{
  const {data:blob,error}=await client.storage.from('fju-inscricoes-fotos').download(user.id+'/perfil.jpg');
  if(error||!blob||current!==updateSequence||passwordRecovery)return;
  clearHeaderAvatarObjectUrl();
  headerAvatarObjectUrl=URL.createObjectURL(blob);
  if(headerAvatar){headerAvatar.src=headerAvatarObjectUrl;headerAvatar.hidden=false;}
  if(headerGuest)headerGuest.hidden=true;
  const img=byId('fju-member-card-photo');
  if(img){img.src=headerAvatarObjectUrl;img.hidden=false;}
 }catch(_){}
}
function renderHeaderAccount(user=null){
  const signedIn=Boolean(user);
  document.documentElement.dataset.fjuAuthenticated=String(signedIn);
  if(headerNotify)headerNotify.hidden=!signedIn;
  const meta=user?.user_metadata||{};
  const avatar=meta.avatar_url||meta.picture||meta.photo_url||'';
  if(signedIn&&avatar)setHeaderAvatarSource(avatar);
  else setHeaderAvatarSource('');
}
let updateSequence=0;
function lang(){return ['ja','en','pt'].includes(localeSelect?.value)?localeSelect.value:'pt';}
function t(key){return translations[lang()][key]||translations.pt[key]||key;}
function setFeedback(message='',error=false){
  feedback.textContent=message;
  feedback.classList.toggle('error',error);
  feedback.classList.toggle('success',!error&&!!message);
}
function localize(){
  dialog.querySelectorAll('[data-fju-auth-i18n]').forEach(node=>{
    node.textContent=t(node.dataset.fjuAuthI18n);
  });
  byId('fju-header-login-label').textContent=authenticated?t('pageHeader'):t('loginHeader');
  byId('fju-account-close').setAttribute('aria-label',t('close'));
  byId('fju-account-role-label').textContent=t('roleLabel');
  byId('fju-account-role-value').textContent=t(lastRole||'member');
  localizeSignup();
}
const signupLabels={
 pt:{create:'Criar minha conta',title:'Criar conta de jovem',name:'Nome completo',email:'E-mail',password:'Senha (mínimo 8 caracteres)',confirm:'Confirmar senha',submit:'Criar conta',back:'Voltar ao login',pending:'Conta criada! Confira seu e-mail para confirmar o cadastro. Depois entre na My Page e escolha seu polo e projetos.',active:'Conta criada! Vamos abrir sua My Page.',duplicate:'Este e-mail já está cadastrado. Entre com sua conta ou utilize outro e-mail.',error:'Não foi possível criar a conta: '},
 ja:{create:'新規登録',title:'青年アカウント作成',name:'氏名',email:'メールアドレス',password:'パスワード（8文字以上）',confirm:'パスワード確認',submit:'アカウント作成',back:'ログインに戻る',pending:'登録しました。確認メールのリンクを開いてからログインし、所属教会とプロジェクトを選択してください。',active:'登録完了！MY PAGEを開きます。',duplicate:'このメールアドレスは登録済みです。ログインするか別のメールアドレスを使用してください。',error:'登録できませんでした: '},
 en:{create:'Create my account',title:'Create youth account',name:'Full name',email:'Email',password:'Password (8+ characters)',confirm:'Confirm password',submit:'Create account',back:'Back to login',pending:'Account created. Confirm your email, then sign in and choose your church and projects.',active:'Account created! Opening My Page.',duplicate:'This email is already registered. Sign in or use another email address.',error:'Could not create account: '}
};
const signupText=()=>signupLabels[lang()]||signupLabels.pt;
const signupOpen=document.createElement('button');
signupOpen.type='button';signupOpen.id='fju-account-signup-open';
signupOpen.style.cssText='display:block;margin:14px auto 0;padding:12px 20px;border:1px solid #8394b5;border-radius:10px;background:#eef2fb;color:#19264b;font-weight:700;cursor:pointer';
loginForm.insertAdjacentElement('afterend',signupOpen);
const signupForm=document.createElement('form');signupForm.id='fju-account-signup-form';signupForm.hidden=true;
signupForm.style.cssText='display:grid;gap:12px;margin:16px 0';
const signupTitle=document.createElement('h3');
const signupName=document.createElement('input');signupName.required=true;signupName.minLength=2;signupName.maxLength=120;signupName.autocomplete='name';
const signupEmail=document.createElement('input');signupEmail.required=true;signupEmail.type='email';signupEmail.autocomplete='email';
const signupPassword=document.createElement('input');signupPassword.required=true;signupPassword.type='password';signupPassword.minLength=8;signupPassword.autocomplete='new-password';
const signupConfirm=document.createElement('input');signupConfirm.required=true;signupConfirm.type='password';signupConfirm.minLength=8;signupConfirm.autocomplete='new-password';
const signupSubmit=document.createElement('button');signupSubmit.type='submit';signupSubmit.style.cssText='padding:13px;border-radius:10px;background:#253b75;color:white;font-weight:700';
const signupBack=document.createElement('button');signupBack.type='button';signupBack.style.cssText='padding:10px;border:0;background:transparent;color:#253b75;text-decoration:underline';
const signupNotice=document.createElement('p');
signupNotice.setAttribute('role','alert');signupNotice.setAttribute('aria-live','assertive');
signupNotice.style.cssText='display:none;margin:0;padding:12px;border-radius:9px;background:#fff0f0;color:#9b1c1c;font-weight:700;line-height:1.5';
const signupPolo=document.createElement('select');signupPolo.required=true;signupPolo.style.cssText='padding:12px;border-radius:10px;background:white;color:#172033';
const signupProjects=document.createElement('div');signupProjects.setAttribute('role','group');signupProjects.style.cssText='box-sizing:border-box;min-width:0;width:100%;border:1px solid #9daecb;border-radius:10px;padding:12px;background:#f8faff;color:#172033';
const signupLegend=document.createElement('div');signupLegend.textContent='Projetos em que atua';signupLegend.style.cssText='font-size:15px;font-weight:700;line-height:1.5;white-space:normal;overflow-wrap:anywhere;margin-bottom:8px;width:100%';signupProjects.append(signupLegend);
for(const project of ['Esporte','Cultura','Mídia','Banda']){
 const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:10px;padding:7px;color:#172033';
 const check=document.createElement('input');check.type='checkbox';check.value=project;check.style.cssText='appearance:auto;-webkit-appearance:checkbox;width:22px;height:22px;min-width:22px;min-height:22px;accent-color:#253b75;opacity:1;cursor:pointer';
 check.addEventListener('change',()=>{if(signupProjects.querySelectorAll('input:checked').length>5){check.checked=false;signupFeedback('Máximo de 5 projetos.',true);}});
 label.append(check,document.createTextNode(project));signupProjects.append(label);
}
async function loadSignupPolos(){
 signupPolo.replaceChildren();
 const empty=document.createElement('option');empty.value='';empty.textContent='Selecione seu polo';signupPolo.append(empty);
 const {data,error}=await client.rpc('fju_listar_polos_cadastro');
 if(error){signupFeedback('Erro ao carregar polos: '+error.message,true);signupSubmit.disabled=true;return;}
 signupSubmit.disabled=false;
 for(const item of data||[]){const option=document.createElement('option');option.value=item.id;option.textContent='FJU '+item.nome;signupPolo.append(option);}
}
// Campos completos do cadastro inicial, compartilhados com a conclusão de cadastro na My Page.
function createYouthDetails(prefix){
 const root=document.createElement('div');root.style.cssText='display:grid;gap:12px;min-width:0';
 const makeLabel=(value,control)=>{
  const label=document.createElement('label');label.style.cssText='display:grid;gap:6px;min-width:0;color:#172033;font-weight:600;font-size:14px';
  const text=document.createElement('span');text.textContent=value;label.append(text,control);return label;
 };
 const photo=document.createElement('input');photo.type='file';photo.accept='image/*';photo.required=true;photo.setAttribute('aria-label','Foto de perfil do jovem');
 photo.style.cssText='width:100%;max-width:100%;box-sizing:border-box;font-size:14px';
 const preview=document.createElement('img');preview.alt='Prévia da foto selecionada';preview.hidden=true;preview.style.cssText='width:95px;height:115px;object-fit:cover;border-radius:12px;border:1px solid #b7c5dd';
 let photoUrl=null;
 photo.addEventListener('change',()=>{
  if(photoUrl){URL.revokeObjectURL(photoUrl);photoUrl=null;}
  const file=photo.files?.[0];preview.hidden=!file;
  if(file){photoUrl=URL.createObjectURL(file);preview.src=photoUrl;}
 });
 const photoHolder=document.createElement('div');photoHolder.style.cssText='display:grid;gap:6px';
 photoHolder.append(makeLabel('Foto de perfil',photo),preview);
 const dateHolder=document.createElement('div');dateHolder.style.cssText='display:grid;gap:6px';
 const dateLabel=document.createElement('label');dateLabel.textContent='Data de nascimento';dateLabel.style.cssText='color:#172033;font-weight:600;font-size:14px';
 const parts=document.createElement('div');parts.style.cssText='display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:7px;min-width:0';
 function makeSelect(placeholder){
  const element=document.createElement('select');element.required=true;element.setAttribute('aria-label',placeholder);
  element.style.cssText='min-width:0;width:100%;box-sizing:border-box;padding:9px 5px;border-radius:8px;background:white;color:#172033;font-size:16px';
  const blank=document.createElement('option');blank.value='';blank.textContent=placeholder;element.append(blank);
  return element;
 }
 const day=makeSelect('Dia'),month=makeSelect('Mês'),year=makeSelect('Ano');
 for(let d=1;d<=31;d++){const o=document.createElement('option');o.value=String(d);o.textContent=String(d).padStart(2,'0');day.append(o);}
 for(let m=1;m<=12;m++){const o=document.createElement('option');o.value=String(m);o.textContent=String(m).padStart(2,'0');month.append(o);}
 for(let y=new Date().getFullYear();y>=1900;y--){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);year.append(o);}
 parts.append(day,month,year);dateHolder.append(dateLabel,parts);
 const phone=document.createElement('input');phone.type='tel';phone.required=true;phone.maxLength=30;phone.autocomplete='tel';phone.placeholder='Ex.: 090-1234-5678';phone.style.cssText='min-width:0;width:100%;box-sizing:border-box';
 const nationality=makeSelect('Selecione a nacionalidade');
 const countries=[['BR','🇧🇷 Brasil'],['JP','🇯🇵 Japão'],['PH','🇵🇭 Filipinas'],['PE','🇵🇪 Peru'],['BO','🇧🇴 Bolívia'],['PY','🇵🇾 Paraguai'],['AR','🇦🇷 Argentina'],['CO','🇨🇴 Colômbia'],['VE','🇻🇪 Venezuela'],['US','🇺🇸 Estados Unidos'],['CN','🇨🇳 China'],['KR','🇰🇷 Coreia do Sul'],['VN','🇻🇳 Vietnã'],['ID','🇮🇩 Indonésia'],['NP','🇳🇵 Nepal'],['IN','🇮🇳 Índia'],['LK','🇱🇰 Sri Lanka'],['MM','🇲🇲 Mianmar'],['TH','🇹🇭 Tailândia'],['PK','🇵🇰 Paquistão'],['BD','🇧🇩 Bangladesh'],['GB','🇬🇧 Reino Unido'],['DE','🇩🇪 Alemanha'],['PT','🇵🇹 Portugal'],['MX','🇲🇽 México'],['CL','🇨🇱 Chile'],['UY','🇺🇾 Uruguai'],['EC','🇪🇨 Equador'],['IT','🇮🇹 Itália'],['FR','🇫🇷 França'],['CA','🇨🇦 Canadá'],['AU','🇦🇺 Austrália']];
 for(const [code,name] of countries){const o=document.createElement('option');o.value=code;o.textContent=name;nationality.append(o);}
 const rank=document.createElement('p');rank.style.cssText='margin:0;padding:10px;border-radius:8px;background:#e9effb;color:#172033;font-size:14px;line-height:1.4';
 rank.textContent='Patente do jovem: será definida pelo coordenador ao aprovar a inscrição.';
 root.append(photoHolder,dateHolder,makeLabel('Telefone',phone),makeLabel('Nacionalidade',nationality),rank);
 return {root,photo,day,month,year,phone,nationality};
}
function birthDateFrom(fields){
 const y=Number(fields.year.value),m=Number(fields.month.value),d=Number(fields.day.value);
 if(!y||!m||!d)throw Error('Preencha a data de nascimento.');
 const date=new Date(Date.UTC(y,m-1,d));
 if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw Error('Data de nascimento inválida.');
 return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function fillYouthDetails(fields,details){
 if(details?.birth){const parts=details.birth.split('-');if(parts.length===3){fields.year.value=String(Number(parts[0]));fields.month.value=String(Number(parts[1]));fields.day.value=String(Number(parts[2]));}}
 if(details?.phone)fields.phone.value=details.phone;
 if(details?.nationality)fields.nationality.value=details.nationality;
}
async function compressYouthPhoto(file){
 if(!file||!file.type.startsWith('image/')||file.size>8*1024*1024)throw Error('Selecione uma foto de até 8 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  for(const size of [900,750,600,480,360,280,200,140]){
   const scale=Math.min(1,size/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Não foi possível processar a foto.');
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [0.82,0.7,0.58,0.45,0.3,0.18,0.08]){
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
    if(blob&&blob.size<=100*1024)return blob;
   }
  }
  throw Error('Não foi possível reduzir a foto para 100 KB.');
 }finally{bitmap.close();}
}
async function sendYouthDetails(userId,info,blob){
 const upload=await client.storage.from('fju-inscricoes-fotos').upload(userId+'/perfil.jpg',blob,{contentType:'image/jpeg',upsert:true});
 if(upload.error)throw Error('Não foi possível enviar a foto: '+upload.error.message);
 const {error}=await client.rpc('fju_enviar_inscricao_jovem_detalhada',{
  p_polo_id:info.polo,p_nome:info.name,p_projetos:info.projects,
  p_nascimento:info.birth,p_telefone:info.phone,p_nacionalidade_iso2:info.nationality
 });
 if(error)throw Error('Não foi possível enviar a inscrição: '+error.message);
}
const signupExtra=createYouthDetails('signup');
signupForm.append(signupTitle,signupName,signupExtra.root,signupPolo,signupProjects,signupEmail,signupPassword,signupConfirm,signupNotice,signupSubmit,signupBack);
function signupFeedback(message='',error=false){
 signupNotice.textContent=message;signupNotice.style.display=message?'block':'none';
 signupNotice.style.background=error?'#fff0f0':'#eaf7ef';signupNotice.style.color=error?'#9b1c1c':'#176339';
 setFeedback(message,error);
}
loginForm.insertAdjacentElement('afterend',signupForm);
function localizeSignup(){
 const t=signupText();signupOpen.textContent=t.create;signupTitle.textContent=t.title;
 for(const [input,label] of [[signupName,t.name],[signupEmail,t.email],[signupPassword,t.password],[signupConfirm,t.confirm]]){input.placeholder=label;input.setAttribute('aria-label',label);}
 signupSubmit.textContent=t.submit;signupBack.textContent=t.back;
}
signupOpen.addEventListener('click',()=>{signupFeedback();showView('signup');loadSignupPolos();});
signupBack.addEventListener('click',()=>{setFeedback();showView('login');});
signupForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(signupPassword.value!==signupConfirm.value){signupFeedback(t('passwordMismatch'),true);return;}
 const info={
  email:signupEmail.value.trim(),name:signupName.value.trim(),polo:signupPolo.value,
  projects:[...signupProjects.querySelectorAll('input:checked')].map(x=>x.value),
  phone:signupExtra.phone.value.trim(),nationality:signupExtra.nationality.value
 };
 signupSubmit.disabled=true;signupFeedback('');
 let accountCreated=false;
 try{
  info.birth=birthDateFrom(signupExtra);
  // Validação da foto ANTES de abrir a conta no Supabase.
  const photoBlob=await compressYouthPhoto(signupExtra.photo.files?.[0]);
  const {data,error}=await client.auth.signUp({
   email:info.email,password:signupPassword.value,
   options:{data:{full_name:info.name},emailRedirectTo:window.location.origin+window.location.pathname}
  });
  if(error)throw error;
  if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){
   signupFeedback(signupText().duplicate,true);return;
  }
  accountCreated=true;
  // Não guardar senha nem foto no armazenamento do navegador.
  sessionStorage.setItem('fju-youth-pending-signup',JSON.stringify(info));
  if(data.session&&data.user?.id){
   await sendYouthDetails(data.user.id,info,photoBlob);
   sessionStorage.removeItem('fju-youth-pending-signup');
   signupForm.reset();
   await loadAccount();
   setFeedback('Cadastro completo enviado ao coordenador do seu polo!');
  }else{
   signupForm.reset();showView('login');
   setFeedback('Confirme seu e-mail e entre na My Page. Por segurança, será preciso selecionar sua foto novamente para concluir a inscrição.');
  }
 }catch(error){
  const duplicate=error.code==='user_already_exists'||error.code==='email_exists'||/already registered|already exists|already been registered/i.test(error.message||'');
  const msg=duplicate?signupText().duplicate:signupText().error+error.message;
  signupFeedback(accountCreated?msg+' A conta já foi criada: entre na My Page para concluir a inscrição.':msg,true);
 }finally{signupSubmit.disabled=false;}
});

function showView(view){
  const forms=[
    ['login',loginForm],
    ['signup',signupForm],
    ['account',myPage],
    ['forgot',forgotForm],
    ['reset',resetForm],
    ['loading',loading]
  ];
  for(const [id,node] of forms)node.hidden=view!==id;
  signupOpen.hidden=view!=='login';
  byId('fju-account-title').textContent=
    view==='forgot'?t('forgotTitle'):view==='reset'?t('resetTitle'):t('title');
  byId('fju-account-subtitle').textContent=
    view==='forgot'?t('forgotSubtitle'):t('subtitle');
  localize();
}
function showDialog(){
  if(!dialog.open)dialog.showModal();
}

async function renderYouthSignup(user,isAdmin,current){
  let container=byId('fju-youth-signup');
  if(!container){
    container=document.createElement('section');
    container.id='fju-youth-signup';
    container.style.cssText='margin:16px 0;padding:16px;border:1px solid #dce2ed;border-radius:14px;background:#f8faff;color:#172033';
    byId('fju-account-member-note')?.insertAdjacentElement('afterend',container);
  }
  container.replaceChildren();
  container.hidden=isAdmin;
  if(isAdmin)return;
  const title=document.createElement('h3');title.textContent='Cadastro na FJU';title.style.margin='0 0 8px';
  const status=document.createElement('p');status.setAttribute('role','status');status.style.fontSize='14px';
  container.append(title,status);
  const {data:existing,error:existingError}=await client.rpc('fju_consultar_minha_inscricao');
  if(current!==updateSequence||passwordRecovery)return;
  // RETURNS TABLE RPC yields [] when no inscription exists. An empty array is truthy.
  const currentSignup=Array.isArray(existing)?existing[0]:existing;
  // Se houve confirmação por e-mail, recuperar as escolhas deste navegador.
  // A foto nunca é guardada em sessionStorage: deve ser selecionada novamente.
  let pending=null;
  try{pending=JSON.parse(sessionStorage.getItem('fju-youth-pending-signup')||'null');}catch(_){}
  if(pending?.email?.toLowerCase()!==user.email?.toLowerCase())pending=null;
  if(!existingError&&currentSignup){
    status.textContent='Sua inscrição foi recebida. Situação: '+currentSignup.status+'. Aguarde a análise do coordenador.';
    return;
  }
  if(existingError){status.textContent='Não foi possível verificar seu cadastro: '+existingError.message;return;}
  const {data:polos,error:poloError}=await client.rpc('fju_listar_polos_cadastro');
  if(current!==updateSequence||passwordRecovery)return;
  if(poloError){status.textContent='Não foi possível carregar os polos: '+poloError.message;return;}
  status.textContent='Preencha todos os dados e envie a foto. O coordenador verificará sua inscrição e definirá a patente.';
  const form=document.createElement('form');form.style.display='grid';form.style.gap='10px';
  const name=document.createElement('input');name.required=true;name.maxLength=120;name.minLength=2;name.placeholder='Nome completo';name.setAttribute('aria-label','Nome completo');
  const polo=document.createElement('select');polo.required=true;polo.setAttribute('aria-label','Selecione seu polo');
  const empty=document.createElement('option');empty.value='';empty.textContent='Selecione seu polo';polo.append(empty);
  for(const item of polos||[]){const option=document.createElement('option');option.value=item.id;option.textContent='FJU '+item.nome;polo.append(option);}
  const projects=document.createElement('fieldset');projects.style.cssText='border:1px solid #dce2ed;border-radius:10px';
  const legend=document.createElement('legend');legend.textContent='Projetos';projects.append(legend);
  for(const project of ['Esporte','Cultura','Mídia','Banda']){
    const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;padding:5px 0';
    const check=document.createElement('input');check.type='checkbox';check.value=project;check.style.cssText='appearance:auto;-webkit-appearance:checkbox;width:22px;height:22px;min-width:22px;min-height:22px;accent-color:#253b75;opacity:1';
    check.addEventListener('change',()=>{const selected=projects.querySelectorAll('input:checked');if(selected.length>5){check.checked=false;status.textContent='Você pode solicitar no máximo cinco projetos.';}});
    label.append(check,document.createTextNode(project));projects.append(label);
  }
  const button=document.createElement('button');button.type='submit';button.textContent='Enviar solicitação';button.style.cssText='padding:12px;border:0;border-radius:10px;background:#253b75;color:white;font-weight:700';
  const details=createYouthDetails('logged-in');
  name.value=pending?.name||user.user_metadata?.full_name||'';
  if(pending?.polo)polo.value=pending.polo;
  fillYouthDetails(details,pending);
  for(const input of projects.querySelectorAll('input[type=checkbox]')){
    input.checked=Array.isArray(pending?.projects)&&pending.projects.includes(input.value);
  }
  form.append(name,details.root,polo,projects,button);container.append(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;status.textContent='Enviando foto e inscrição…';
    try{
      const info={
       name:name.value.trim(),polo:polo.value,birth:birthDateFrom(details),
       phone:details.phone.value.trim(),nationality:details.nationality.value,
       projects:[...projects.querySelectorAll('input:checked')].map(x=>x.value)
      };
      const blob=await compressYouthPhoto(details.photo.files?.[0]);
      await sendYouthDetails(user.id,info,blob);
      sessionStorage.removeItem('fju-youth-pending-signup');
      form.remove();status.textContent='Inscrição completa enviada! Aguarde a análise do coordenador do seu polo.';
      await loadYouthPreviewPhoto(user,current);
    }catch(error){status.textContent=error.message||'Não foi possível enviar a inscrição.';}
    finally{button.disabled=false;}
  });
}

async function loadAccount(){
  const current=++updateSequence;
  if(!passwordRecovery)showView('loading');
  try{
    const {data:{user},error}=await client.auth.getUser();
    if(current!==updateSequence||passwordRecovery)return;
    if(error||!user){
      authenticated=false;userEmail='';lastRole='';
      renderHeaderAccount(null);
      showView('login');
      return;
    }
    authenticated=true;userEmail=user.email||'';
    renderHeaderAccount(user);
    byId('fju-account-email').textContent=userEmail;
    const memberCard=byId('fju-member-collectible');
    if(memberCard){
      const meta=user.user_metadata||{};
      byId('fju-member-card-name').textContent=meta.full_name||meta.name||meta.nome||userEmail.split('@')[0]||'FJU JAPAN';
      const img=byId('fju-member-card-photo');
      const photo=meta.avatar_url||meta.picture||meta.photo_url||'';
      if(photo){img.src=photo;img.hidden=false;}else{img.hidden=true;img.removeAttribute('src');}
      byId('fju-member-card-polo').textContent=meta.polo_nome||'Polo a confirmar';
      byId('fju-member-card-project').textContent=meta.projeto_nome||'Projeto a confirmar';
      byId('fju-member-card-rank').textContent='Patente definida pela liderança';
      memberCard.hidden=false;
    }
    lastRole='member';
    let verifiedAdmin=false;
    let churchName='';
    const {data:profile,error:profileError}=await client
      .from('fju_perfis')
      .select('papel,polo_id,ativo')
      .eq('usuario_id',user.id)
      .maybeSingle();
    if(current!==updateSequence||passwordRecovery)return;
    await loadStoredHeaderAvatar(user,current);
    if(current!==updateSequence||passwordRecovery)return;
    if(!profile?.ativo||!['nacional','coordenador'].includes(profile.papel))await loadYouthPreviewPhoto(user,current);
    if(current!==updateSequence||passwordRecovery)return;
    const cardPhoto=byId('fju-member-card-photo');
    if(cardPhoto&&headerAvatar?.src&&!headerAvatar.hidden){cardPhoto.src=headerAvatar.src;cardPhoto.hidden=false;}
    if(profileError){
      setFeedback(t('profileError'),true);
    }else if(profile?.ativo&&['nacional','coordenador'].includes(profile.papel)&&(profile.papel!=='coordenador'||Boolean(profile.polo_id))){
      lastRole=profile.papel==='nacional'?'national':'coordinator';
      verifiedAdmin=true;
      if(profile.papel==='coordenador'&&profile.polo_id){
        const {data:polo}=await client.from('fju_polos').select('nome')
          .eq('id',profile.polo_id).maybeSingle();
        if(current!==updateSequence||passwordRecovery)return;
        churchName=polo?.nome||'';
      }
    }
    if(churchName&&byId('fju-member-card-polo'))byId('fju-member-card-polo').textContent='FJU '+churchName;
    await renderYouthSignup(user,verifiedAdmin,current);
    if(current!==updateSequence||passwordRecovery)return;
    accountAccess.hidden=!verifiedAdmin;
    byId('fju-account-member-note').hidden=verifiedAdmin;
    const church=byId('fju-account-church');
    church.hidden=!churchName;
    if(churchName)byId('fju-account-church-name').textContent='FJU '+churchName;
    showView('account');
    localize();
  }catch(e){
    if(current!==updateSequence||passwordRecovery)return;
    authenticated=false;lastRole='';
    renderHeaderAccount(null);
    showView('login');
    setFeedback(t('sessionError'),true);
  }
}
async function openAccount(){
  showDialog();
  setFeedback();
  if(passwordRecovery){showView('reset');return;}
  await loadAccount();
}
for(const trigger of document.querySelectorAll('[data-fju-account-open]')){
  trigger.addEventListener('click',event=>{event.preventDefault();void openAccount();});
}
document.addEventListener('click',event=>{
  const target=event.target.closest('a[href="#my-page"]');
  if(!target)return;
  event.preventDefault();
  void openAccount();
});
byId('fju-account-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{
  if(event.target===dialog)dialog.close();
});
loginForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const submit=byId('fju-account-login-button');
  submit.disabled=true;
  setFeedback(t('loggingIn'));
  try{
    const {error}=await client.auth.signInWithPassword({
      email:byId('fju-account-login-email').value.trim(),
      password:byId('fju-account-login-password').value
    });
    if(error)throw error;
    loginForm.reset();
    await loadAccount();
    setFeedback(t('loggedInStatus'));
  }catch(e){
    showView('login');
    setFeedback(t('loginError'),true);
  }finally{submit.disabled=false;}
});
byId('fju-account-forgot-open').addEventListener('click',()=>{
  setFeedback();
  byId('fju-account-forgot-email').value=byId('fju-account-login-email').value;
  showView('forgot');
});
byId('fju-account-back-login').addEventListener('click',()=>{setFeedback();showView('login');});
forgotForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=byId('fju-account-forgot-button');
  button.disabled=true;
  setFeedback(t('recovering'));
  try{
    const {error}=await client.auth.resetPasswordForEmail(
      byId('fju-account-forgot-email').value.trim(),
      {redirectTo:window.location.origin+window.location.pathname}
    );
    if(error)throw error;
    setFeedback(t('recoverySent'));
  }catch(e){setFeedback(t('recoveryError'),true);}
  finally{button.disabled=false;}
});
resetForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=byId('fju-account-reset-button');
  const pwd=byId('fju-account-new-password').value;
  if(pwd.length<8||pwd!==byId('fju-account-confirm-password').value){
    setFeedback(t('passwordMismatch'),true);return;
  }
  button.disabled=true;
  setFeedback(t('updatingPassword'));
  try{
    const {error}=await client.auth.updateUser({password:pwd});
    if(error)throw error;
    passwordRecovery=false;
    resetForm.reset();
    await client.auth.signOut();
    authenticated=false;userEmail='';lastRole='';
    renderHeaderAccount(null);
    showView('login');
    setFeedback(t('passwordUpdated'));
  }catch(e){setFeedback(t('passwordUpdateError'),true);}
  finally{button.disabled=false;}
});
byId('fju-account-logout').addEventListener('click',async()=>{
  try{
    await client.auth.signOut();
    authenticated=false;userEmail='';lastRole='';
    renderHeaderAccount(null);
    showView('login');
    setFeedback(t('signedOut'));
  }catch(e){setFeedback(t('sessionError'),true);}
});
client.auth.onAuthStateChange(event=>{
  if(event==='PASSWORD_RECOVERY'){
    passwordRecovery=true;
    showDialog();
    showView('reset');
    return;
  }
  if(event==='SIGNED_OUT'){
    passwordRecovery=false;
    updateSequence++;
    authenticated=false;userEmail='';lastRole='';
    renderHeaderAccount(null);
    showView('login');
    localize();
  }else if(event==='SIGNED_IN'&&!passwordRecovery){
    // Agendar para depois que o SDK liberar o lock interno do auth.
    setTimeout(()=>{void loadAccount();},0);
  }
});
localeSelect?.addEventListener('change',localize);
renderHeaderAccount(null);
localize();
void loadAccount();
