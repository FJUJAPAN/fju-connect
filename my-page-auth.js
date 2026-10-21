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
      .select('foto_path')
      .eq('usuario_id',user.id)
      .maybeSingle();
    if(cardError||current!==updateSequence||passwordRecovery||!card?.foto_path)return;
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
}
function showView(view){
  const forms=[
    ['login',loginForm],
    ['account',myPage],
    ['forgot',forgotForm],
    ['reset',resetForm],
    ['loading',loading]
  ];
  for(const [id,node] of forms)node.hidden=view!==id;
  byId('fju-account-title').textContent=
    view==='forgot'?t('forgotTitle'):view==='reset'?t('resetTitle'):t('title');
  byId('fju-account-subtitle').textContent=
    view==='forgot'?t('forgotSubtitle'):t('subtitle');
  localize();
}
function showDialog(){
  if(!dialog.open)dialog.showModal();
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
// Open the same login/My Page dialog when arriving from Eventos or Polos.
if(window.location.hash==='#my-page'){
  void openAccount();
}
window.addEventListener('hashchange',()=>{
  if(window.location.hash==='#my-page')void openAccount();
});
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
