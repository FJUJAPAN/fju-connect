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
 pt:{create:'Criar minha conta',title:'Criar conta de jovem',name:'Nome completo',email:'E-mail',password:'Senha (mínimo 8 caracteres)',confirm:'Confirmar senha',submit:'Criar conta',back:'Voltar ao login',pending:'Conta criada! Confira seu e-mail para confirmar o cadastro. Depois entre na My Page e escolha seu polo e projetos.',active:'Conta criada! Vamos abrir sua My Page.',error:'Não foi possível criar a conta: '},
 ja:{create:'新規登録',title:'青年アカウント作成',name:'氏名',email:'メールアドレス',password:'パスワード（8文字以上）',confirm:'パスワード確認',submit:'アカウント作成',back:'ログインに戻る',pending:'登録しました。確認メールのリンクを開いてからログインし、所属教会とプロジェクトを選択してください。',active:'登録完了！MY PAGEを開きます。',error:'登録できませんでした: '},
 en:{create:'Create my account',title:'Create youth account',name:'Full name',email:'Email',password:'Password (8+ characters)',confirm:'Confirm password',submit:'Create account',back:'Back to login',pending:'Account created. Confirm your email, then sign in and choose your church and projects.',active:'Account created! Opening My Page.',error:'Could not create account: '}
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
signupForm.append(signupTitle,signupName,signupEmail,signupPassword,signupConfirm,signupSubmit,signupBack);
loginForm.insertAdjacentElement('afterend',signupForm);
function localizeSignup(){
 const t=signupText();signupOpen.textContent=t.create;signupTitle.textContent=t.title;
 for(const [input,label] of [[signupName,t.name],[signupEmail,t.email],[signupPassword,t.password],[signupConfirm,t.confirm]]){input.placeholder=label;input.setAttribute('aria-label',label);}
 signupSubmit.textContent=t.submit;signupBack.textContent=t.back;
}
signupOpen.addEventListener('click',()=>{setFeedback();showView('signup');});
signupBack.addEventListener('click',()=>{setFeedback();showView('login');});
signupForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(signupPassword.value!==signupConfirm.value){setFeedback(t('passwordMismatch'),true);return;}
 signupSubmit.disabled=true;setFeedback('');
 try{
  const {data,error}=await client.auth.signUp({
   email:signupEmail.value.trim(),password:signupPassword.value,
   options:{data:{full_name:signupName.value.trim()},emailRedirectTo:window.location.origin+window.location.pathname}
  });
  if(error)throw error;
  if(data.session){signupForm.reset();setFeedback(signupText().active);await loadAccount();}
  else{signupForm.reset();showView('login');setFeedback(signupText().pending);}
 }catch(error){setFeedback(signupText().error+error.message,true);}
 finally{signupSubmit.disabled=false;}
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
  if(!existingError&&existing){
    status.textContent='Sua inscrição foi recebida. Situação: '+existing.status+'. Aguarde a análise do coordenador.';
    return;
  }
  if(existingError){status.textContent='Não foi possível verificar seu cadastro: '+existingError.message;return;}
  const {data:polos,error:poloError}=await client.from('fju_polos').select('id,nome').order('nome');
  if(current!==updateSequence||passwordRecovery)return;
  if(poloError){status.textContent='Não foi possível carregar os polos: '+poloError.message;return;}
  status.textContent='Escolha seu polo e até 5 projetos. O coordenador verificará seus dados.';
  const form=document.createElement('form');form.style.display='grid';form.style.gap='10px';
  const name=document.createElement('input');name.required=true;name.maxLength=120;name.minLength=2;name.placeholder='Nome completo';name.setAttribute('aria-label','Nome completo');
  const polo=document.createElement('select');polo.required=true;polo.setAttribute('aria-label','Selecione seu polo');
  const empty=document.createElement('option');empty.value='';empty.textContent='Selecione seu polo';polo.append(empty);
  for(const item of polos||[]){const option=document.createElement('option');option.value=item.id;option.textContent='FJU '+item.nome;polo.append(option);}
  const projects=document.createElement('fieldset');projects.style.cssText='border:1px solid #dce2ed;border-radius:10px';
  const legend=document.createElement('legend');legend.textContent='Projetos (até 5)';projects.append(legend);
  for(const project of ['Mídia','Esporte','Cultura','Banda','Help','Universitário','Arcanjos','Atalaia','Uniforça']){
    const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;padding:5px 0';
    const check=document.createElement('input');check.type='checkbox';check.value=project;check.style.width='auto';
    check.addEventListener('change',()=>{const selected=projects.querySelectorAll('input:checked');if(selected.length>5){check.checked=false;status.textContent='Você pode solicitar no máximo cinco projetos.';}});
    label.append(check,document.createTextNode(project));projects.append(label);
  }
  const button=document.createElement('button');button.type='submit';button.textContent='Enviar solicitação';button.style.cssText='padding:12px;border:0;border-radius:10px;background:#253b75;color:white;font-weight:700';
  form.append(name,polo,projects,button);container.append(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;status.textContent='Enviando inscrição…';
    const selected=[...projects.querySelectorAll('input:checked')].map(x=>x.value);
    const {error}=await client.rpc('fju_enviar_inscricao_jovem',{p_polo_id:polo.value,p_nome:name.value.trim(),p_projetos:selected});
    if(error){status.textContent='Não foi possível enviar: '+error.message;button.disabled=false;return;}
    form.remove();status.textContent='Inscrição enviada! Aguarde a aprovação do coordenador do seu polo.';
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
