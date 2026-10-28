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
const profilePasswordForm=byId('fju-profile-password-form');
const profilePasswordToggle=byId('fju-profile-password-toggle');
const profilePasswordStatus=byId('fju-profile-password-status');
const languageSettingsText={
 pt:{title:'Idioma preferido',description:'Escolha o idioma padrão da sua conta FJU Connect.',saved:'Idioma salvo no seu perfil.',failed:'Não foi possível salvar o idioma no perfil.'},
 ja:{title:'表示言語',description:'FJU Connectアカウントの表示言語を選択してください。',saved:'プロフィールに言語を保存しました。',failed:'言語を保存できませんでした。'},
 en:{title:'Preferred language',description:'Choose the default language for your FJU Connect account.',saved:'Language saved to your profile.',failed:'Could not save language to your profile.'}
};
let preferredLanguageUser=null;
function normalizedLanguage(value){const v=String(value||'').toLowerCase();return v.startsWith('ja')||v==='jp'?'ja':v.startsWith('en')?'en':'pt';}
function preferredLanguageUI(){
 let section=byId('fju-preferred-language-settings');
 if(!section){section=document.createElement('section');section.id='fju-preferred-language-settings';section.style.cssText='margin:20px 0;padding:18px;border:1px solid #ffffff30;border-radius:16px;background:#ffffff08';
 const heading=document.createElement('h3');heading.id='fju-preferred-language-title';heading.style.margin='0 0 8px';
 const desc=document.createElement('p');desc.id='fju-preferred-language-description';desc.style.margin='0 0 12px';
 const select=document.createElement('select');select.id='fju-preferred-language-select';select.style.cssText='width:100%;min-height:46px;border-radius:10px;padding:10px;background:#182641;color:white;border:1px solid #ffffff55';
 [['pt','Português'],['ja','日本語'],['en','English']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);});
 const feedback=document.createElement('p');feedback.id='fju-preferred-language-feedback';feedback.setAttribute('role','status');feedback.style.margin='8px 0 0';
 section.append(heading,desc,select,feedback);
 byId('fju-account-logout')?.insertAdjacentElement('beforebegin',section);
 select.addEventListener('change',async()=>{if(!preferredLanguageUser)return;const value=select.value;select.disabled=true;feedback.textContent='';try{const {data,error}=await client.auth.updateUser({data:{preferred_language:value}});if(error)throw error;preferredLanguageUser=data?.user||{...preferredLanguageUser,user_metadata:{...(preferredLanguageUser.user_metadata||{}),preferred_language:value}};localStorage.setItem('fju_lang',value);localStorage.setItem('fju_language',value);localStorage.setItem('fju-connect-lang',value);if(localeSelect){localeSelect.value=value;localeSelect.dispatchEvent(new Event('change'));}feedback.textContent=languageSettingsText[value].saved;}catch(err){feedback.textContent=languageSettingsText[lang()].failed;select.value=normalizedLanguage(preferredLanguageUser.user_metadata?.preferred_language||lang());}finally{select.disabled=false;}});
 }
 const l=lang(),words=languageSettingsText[l];byId('fju-preferred-language-title').textContent=words.title;byId('fju-preferred-language-description').textContent=words.description;
 byId('fju-preferred-language-select').value=normalizedLanguage(preferredLanguageUser?.user_metadata?.preferred_language||localeSelect?.value||'pt');
 section.hidden=!preferredLanguageUser;
}



const youthPaneLabels={
 pt:{profile:'Meu Perfil',interactions:'Interações',saved:'Salvos',churchAccount:'Conta da igreja'},
 ja:{profile:'マイプロフィール',interactions:'交流',saved:'保存済み',churchAccount:'教会アカウント'},
 en:{profile:'My Profile',interactions:'Interactions',saved:'Saved',churchAccount:'Church account'}
};
let activeYouthPane='';
function showYouthPane(target=''){
 const valid=['profile','interactions','saved'];
 activeYouthPane=valid.includes(target)?target:'';
 const home=byId('fju-youth-dashboard'),head=byId('fju-youth-subpage-head');
 if(home)home.hidden=!!activeYouthPane;
 if(head)head.hidden=!activeYouthPane;
 for(const pane of valid){
  const node=byId('fju-youth-'+pane+'-pane');
  if(node)node.hidden=activeYouthPane!==pane;
 }
 if(activeYouthPane){
  byId('fju-youth-subpage-title').textContent=youthPaneLabels[lang()][activeYouthPane];
 }
 if(dialog?.open)dialog.scrollTop=0;
}
function syncYouthHero(isAdmin=false,churchGroup=null){
 const profileName=byId('fju-member-card-name')?.textContent?.trim()||userEmail.split('@')[0]||'FJU JAPAN';
 const profileChurch=byId('fju-member-card-polo')?.textContent?.trim()||'FJU JAPAN';
 const src=byId('fju-member-card-photo');
 byId('fju-youth-hero-name').textContent=profileName;
 byId('fju-youth-hero-polo').textContent=churchGroup||profileChurch;
 const pic=byId('fju-youth-hero-photo'),fallback=byId('fju-youth-hero-fallback');
 const photoSrc=src&&!src.hidden?src.getAttribute('src'):'';
 if(photoSrc){pic.src=photoSrc;pic.hidden=false;fallback.hidden=true;}
 else{pic.removeAttribute('src');pic.hidden=true;fallback.hidden=false;fallback.textContent=profileName.charAt(0).toUpperCase()||'F';}
 const rank=byId('fju-youth-hero-rank');
 const rawRank=byId('fju-member-card-rank')?.textContent?.trim()||'';
 const rankText=isAdmin?t(lastRole):churchGroup?'':rawRank;
 rank.hidden=!rankText||/Patente definida|rank will be assigned/i.test(rankText);
 if(!rank.hidden)rank.textContent=rankText;
 if(churchGroup){
  byId('fju-member-card-polo').textContent=churchGroup;
  byId('fju-member-card-project').textContent='FJU CONNECT JAPAN';
  byId('fju-member-card-rank').textContent=youthPaneLabels[lang()].churchAccount;
 }
}

const translations={
  pt:{
    loginHeader:'LOGIN',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'Sua conta FJU Connect JAPAN, sem sair do site oficial.',
    youthOverline:'MINHA PÁGINA',youthMenuHeading:'Acesso rápido',youthProfile:'Meu Perfil',youthInteractions:'Interações',youthEvents:'Eventos',youthSaved:'Salvos',youthAdmin:'Painel',youthMenuCaption:'Sua área FJU Connect, em um só lugar.',youthBack:'‹ Voltar',youthInteractionsTitle:'Faça parte da conversa',youthInteractionsText:'Participe das matérias da FJU com seu perfil.',youthOpenArticles:'Abrir matérias',youthSavedTitle:'Seus conteúdos favoritos',youthSavedText:'Esta função está em preparação.',
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
    profileSecurityTitle:'Segurança da conta',profileChangePassword:'Alterar senha',profilePasswordSaved:'Senha atualizada com sucesso.',profilePasswordFailed:'Não foi possível alterar a senha. Entre novamente e tente outra vez.',
    close:'Fechar'
  },
  ja:{
    loginHeader:'ログイン',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'FJU公式サイトから離れずにログインできます。',
    youthOverline:'マイページ',youthMenuHeading:'クイックアクセス',youthProfile:'マイプロフィール',youthInteractions:'交流',youthEvents:'イベント',youthSaved:'保存済み',youthAdmin:'管理パネル',youthMenuCaption:'FJU Connectの機能をここから利用できます。',youthBack:'‹ 戻る',youthInteractionsTitle:'交流に参加しよう',youthInteractionsText:'プロフィールを使ってFJUの記事にコメントできます。',youthOpenArticles:'記事を見る',youthSavedTitle:'保存したコンテンツ',youthSavedText:'準備中の機能です。',
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
    profileSecurityTitle:'アカウントのセキュリティ',profileChangePassword:'パスワードを変更',profilePasswordSaved:'パスワードを更新しました。',profilePasswordFailed:'パスワードを更新できませんでした。再度ログインしてお試しください。',
    close:'閉じる'
  },
  en:{
    loginHeader:'LOGIN',pageHeader:'MY PAGE',title:'MY PAGE',
    subtitle:'Sign in without leaving the official FJU site.',
    youthOverline:'MY PAGE',youthMenuHeading:'Quick access',youthProfile:'My Profile',youthInteractions:'Interactions',youthEvents:'Events',youthSaved:'Saved',youthAdmin:'Dashboard',youthMenuCaption:'Your FJU Connect space, all in one place.',youthBack:'‹ Back',youthInteractionsTitle:'Join the conversation',youthInteractionsText:'Join the discussion on FJU articles with your profile.',youthOpenArticles:'Open articles',youthSavedTitle:'Your saved content',youthSavedText:'This feature is coming soon.',
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
    profileSecurityTitle:'Account security',profileChangePassword:'Change password',profilePasswordSaved:'Password updated successfully.',profilePasswordFailed:'Could not change your password. Please sign in again and retry.',
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
  if(activeYouthPane)byId('fju-youth-subpage-title').textContent=youthPaneLabels[lang()][activeYouthPane];
  byId('fju-youth-hero-edit')?.setAttribute('aria-label',t('youthProfile'));
}
const signupLabels={
 pt:{create:'Criar minha conta',title:'Criar conta de jovem',name:'Nome completo',email:'E-mail',password:'Senha (mínimo 8 caracteres)',confirm:'Confirmar senha',submit:'Criar conta',back:'Voltar ao login',pending:'Conta criada! Confira seu e-mail para confirmar o cadastro. Depois entre na My Page e escolha seu polo e projetos.',active:'Conta criada! Vamos abrir sua My Page.',duplicate:'Este e-mail já está cadastrado. Entre com sua conta ou utilize outro e-mail.',error:'Não foi possível criar a conta: '},
 ja:{create:'新規登録',title:'青年アカウント作成',name:'氏名',email:'メールアドレス',password:'パスワード（8文字以上）',confirm:'パスワード確認',submit:'アカウント作成',back:'ログインに戻る',pending:'登録しました。確認メールのリンクを開いてからログインし、所属教会とプロジェクトを選択してください。',active:'登録完了！MY PAGEを開きます。',duplicate:'このメールアドレスは登録済みです。ログインするか別のメールアドレスを使用してください。',error:'登録できませんでした: '},
 en:{create:'Create my account',title:'Create youth account',name:'Full name',email:'Email',password:'Password (8+ characters)',confirm:'Confirm password',submit:'Create account',back:'Back to login',pending:'Account created. Confirm your email, then sign in and choose your church and projects.',active:'Account created! Opening My Page.',duplicate:'This email is already registered. Sign in or use another email address.',error:'Could not create account: '}
};
const signupText=()=>signupLabels[lang()]||signupLabels.pt;
// FJU JAPAN — dados pessoais enviados somente à inscrição privada.
let signupInProgress=false;
const detailLabels={
 pt:{birth:'Data de nascimento',phone:'Telefone',nationality:'Nacionalidade',photo:'Foto de perfil',choose:'Selecione',rank:'A patente inicial será definida pela liderança na aprovação.',photoHelp:'Escolha uma foto. Ela será reduzida e guardada de forma privada.'},
 ja:{birth:'生年月日',phone:'電話番号',nationality:'国籍',photo:'プロフィール写真',choose:'選択してください',rank:'初期ランクは承認時にリーダーが設定します。',photoHelp:'写真を選択してください。縮小して非公開で保存します。'},
 en:{birth:'Date of birth',phone:'Phone',nationality:'Nationality',photo:'Profile photo',choose:'Select',rank:'Leadership assigns the initial rank on approval.',photoHelp:'Choose a photo. It will be resized and stored privately.'}
};
function createSignupDetails(){
 const root=document.createElement('div');root.style.cssText='display:grid;gap:12px;min-width:0';
 const fields={},labels={};
 for(const key of ['photo','birth','phone','nationality']){
  const label=document.createElement('label');label.style.cssText='display:grid;gap:7px;margin:0;color:inherit';
  const caption=document.createElement('span');
  const input=document.createElement(key==='nationality'?'select':'input');input.required=true;
  input.style.cssText='width:100%;min-width:0;max-width:100%;padding:10px;border:1px solid #8394b5;border-radius:10px;font-size:16px';
  if(key==='birth'){input.type='date';input.min='1900-01-01';const now=new Date();input.max=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');input.autocomplete='bday';}
  if(key==='phone'){input.type='tel';input.minLength=5;input.maxLength=30;input.autocomplete='tel';}
  if(key==='photo'){input.type='file';input.accept='image/*';input.style.height='auto';}
  label.append(caption,input);root.append(label);fields[key]=input;labels[key]=caption;
 }
 const help=document.createElement('small'),rank=document.createElement('p');
 help.style.cssText='line-height:1.5';rank.style.cssText='margin:0;font-size:13px;line-height:1.5';root.append(help,rank);
 // ISO 3166-1 alpha-2 codes, including the nationalities represented in Japan.
 const codes='AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
 function localize(){
  const tr=detailLabels[lang()];for(const key in labels)labels[key].textContent=tr[key];
  help.textContent=tr.photoHelp;rank.textContent=tr.rank;
  const value=fields.nationality.value;
  const names=new Intl.DisplayNames([lang()],{type:'region'});
  fields.nationality.replaceChildren(new Option(tr.choose,''));
  for(const code of ['JP','BR',...codes.filter(c=>!['JP','BR'].includes(c)).sort((a,b)=>names.of(a).localeCompare(names.of(b),lang()))])fields.nationality.add(new Option(names.of(code),code));
  fields.nationality.value=value;
 }
 localize();
 return {root,fields,rank,localize,values:()=>({birth:fields.birth.value,phone:fields.phone.value.trim(),nationality:fields.nationality.value})};
}
async function prepareSignupPhoto(file){
 if(!file)throw new Error('Selecione sua foto de perfil.');
 if(file.size>20*1024*1024)throw new Error('Escolha uma foto de até 20 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');
  const scale=Math.min(1,640/Math.max(image.naturalWidth,image.naturalHeight));
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.85,.7,.5,.35]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
   if(blob&&blob.size<=307200)return blob;
  }
  throw new Error('Não foi possível reduzir a foto. Escolha outra imagem.');
 }finally{URL.revokeObjectURL(url);}
}
async function sendCoordinatorSignup(user,details,photo){
 const {error:photoError}=await client.storage.from('fju-inscricoes-fotos').upload(user.id+'/perfil.jpg',photo,{contentType:'image/jpeg',upsert:true});
 if(photoError)throw photoError;
 const {error}=await client.rpc('fju_solicitar_cadastro_coordenador',{p_polo_id:details.polo,p_nome:details.name});
 if(error)throw error;
 sessionStorage.removeItem('fju-coordinator-pending-signup');
}
async function sendDetailedSignup(user,details,photo){
 const {error:photoError}=await client.storage.from('fju-inscricoes-fotos').upload(user.id+'/perfil.jpg',photo,{contentType:'image/jpeg',upsert:true});
 if(photoError)throw photoError;
 const {error}=await client.rpc('fju_enviar_inscricao_jovem_detalhada',{
  p_polo_id:details.polo,p_nome:details.name,p_projetos:details.projects,
  p_nascimento:details.birth,p_telefone:details.phone,p_nacionalidade_iso2:details.nationality
 });
 if(error)throw error;
 sessionStorage.removeItem('fju-youth-pending-signup');
}
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
 check.addEventListener('change',()=>{if(signupProjects.querySelectorAll('input:checked').length>4){check.checked=false;signupFeedback('Máximo de 4 projetos.',true);}});
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
const signupDetails=createSignupDetails();
const signupGroup=document.createElement('select');signupGroup.id='fju-signup-group';
signupGroup.style.cssText='padding:12px;border-radius:10px;background:white;color:#172033';
for(const [value,label] of [['FJU','FJU (jovem)'],['FTU','FTU'],['Calebe','Calebe'],['EVG','EVG'],['Obreiros','Obreiros'],['Membros','Membros da igreja']])signupGroup.add(new Option(label,value));
const isCoordinatorSignup=()=>new URLSearchParams(window.location.search).get('cadastro')==='1'&&new URLSearchParams(window.location.search).get('tipo')==='coordenador';
const isYouthSignup=()=>signupGroup.value==='FJU'||isCoordinatorSignup();
function syncSignupGroup(){
 const youth=isYouthSignup();
 // A foto é obrigatória tanto para jovens quanto para os demais grupos.
 // Só os dados da ficha (nascimento, telefone e nacionalidade) são exclusivos da FJU.
 signupDetails.root.hidden=false;
 for(const [key,field] of Object.entries(signupDetails.fields)){
  field.required=key==='photo'||youth;
  if(key!=='photo')field.closest('label').style.display=youth?'grid':'none';
 }
 signupDetails.rank.hidden=!youth;
 signupPolo.hidden=!(youth||isCoordinatorSignup());signupProjects.hidden=!youth||isCoordinatorSignup();
 signupPolo.required=youth||isCoordinatorSignup();
 if(!youth&&!signupInProgress)signupSubmit.disabled=false;
 signupTitle.textContent=isCoordinatorSignup()?({pt:'Cadastro de Coordenador FJU',ja:'FJUコーディネーター登録',en:'FJU Coordinator Registration'}[lang()]):youth?signupText().title:({pt:'Criar conta da igreja',ja:'教会アカウント登録',en:'Create church account'}[lang()]);
}
signupGroup.addEventListener('change',syncSignupGroup);
async function finishChurchGroupSignup(user,details,photo){
 const {error:photoError}=await client.storage.from('fju-inscricoes-fotos').upload(user.id+'/perfil.jpg',photo,{contentType:'image/jpeg',upsert:true});
 if(photoError)throw photoError;
 const {error}=await client.rpc('fju_cadastrar_grupo_igreja',{p_nome:details.name,p_grupo:details.group});
 if(error)throw error;
 sessionStorage.removeItem('fju-church-pending-signup');
}
signupForm.append(signupTitle,signupGroup,signupName,signupDetails.root,signupEmail,signupPassword,signupConfirm,signupPolo,signupProjects,signupNotice,signupSubmit,signupBack);
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
 signupDetails.localize();syncSignupGroup();
}
signupOpen.addEventListener('click',()=>{signupFeedback();showView('signup');loadSignupPolos();});
signupBack.addEventListener('click',()=>{setFeedback();showView('login');});
signupForm.addEventListener('submit',async event=>{
 event.preventDefault();
 if(signupPassword.value!==signupConfirm.value){signupFeedback(t('passwordMismatch'),true);return;}
 const details={email:signupEmail.value.trim().toLowerCase(),name:signupName.value.trim(),group:isCoordinatorSignup()?'FJU':signupGroup.value,requested_role:isCoordinatorSignup()?'coordenador':null,polo:signupPolo.value,projects:[...signupProjects.querySelectorAll('input:checked')].map(x=>x.value),...signupDetails.values()};
 signupSubmit.disabled=true;signupInProgress=true;signupFeedback('');
 let created=false;
 try{
  const photo=await prepareSignupPhoto(signupDetails.fields.photo.files[0]);
  const {data,error}=await client.auth.signUp({
   email:details.email,password:signupPassword.value,
   options:{data:{full_name:details.name,signup_group:details.group,requested_role:details.requested_role||'membro',requested_polo_id:isCoordinatorSignup()?details.polo:null},emailRedirectTo:window.location.origin+window.location.pathname}
  });
  if(error)throw error;
  if(data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0){signupFeedback(signupText().duplicate,true);return;}
  created=true;
  sessionStorage.setItem(isCoordinatorSignup()?'fju-coordinator-pending-signup':isYouthSignup()?'fju-youth-pending-signup':'fju-church-pending-signup',JSON.stringify(details));
  if(data.session){
   if(isCoordinatorSignup())await sendCoordinatorSignup(data.user,details,photo);
   else if(isYouthSignup())await sendDetailedSignup(data.user,details,photo);
   else await finishChurchGroupSignup(data.user,details,photo);
   signupForm.reset();syncSignupGroup();await loadAccount();setFeedback(isYouthSignup()?'Conta e inscrição enviadas ao coordenador!':'Conta da igreja criada!');
  }else{
   signupForm.reset();syncSignupGroup();showView('login');setFeedback('Conta criada! Confirme seu e-mail e entre na My Page para concluir o cadastro.');
  }
 }catch(error){
  if(created){
   await loadAccount();setFeedback('Conta criada. Conclua sua inscrição na My Page: '+error.message,true);
  }else{
   const duplicate=error.code==='user_already_exists'||error.code==='email_exists'||/already registered|already exists|already been registered/i.test(error.message||'');
   signupFeedback(duplicate?signupText().duplicate:signupText().error+error.message,true);
  }
 }finally{signupSubmit.disabled=false;signupInProgress=false;}
});

function showView(view){
  dialog.dataset.fjuView=view;
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
  if(isAdmin)return null;
  const title=document.createElement('h3');title.textContent='Cadastro na FJU';title.style.margin='0 0 8px';
  const status=document.createElement('p');status.setAttribute('role','status');status.style.fontSize='14px';
  container.append(title,status);
  const {data:groups,error:groupError}=await client.rpc('fju_meu_grupo_igreja');
  if(current!==updateSequence||passwordRecovery)return;
  const group=Array.isArray(groups)?groups[0]:groups;
  const churchGroups=['FTU','Calebe','EVG','Obreiros','Membros'];
  const requestedChurchGroup=churchGroups.includes(user.user_metadata?.signup_group)?user.user_metadata.signup_group:null;
  if(group){
    sessionStorage.removeItem('fju-church-pending-signup');
    title.textContent=({pt:'Minha conta da igreja',ja:'教会アカウント',en:'My church account'}[lang()]);
    status.textContent=group.grupo+' · '+({pt:'Conta ativa para comentários e check-in.',ja:'コメントとチェックインをご利用いただけます。',en:'Account active for comments and check-in.'}[lang()]);
    byId('fju-member-card-name').textContent=group.nome;
    byId('fju-member-card-polo').textContent=group.grupo;
    byId('fju-member-card-project').textContent='FJU CONNECT JAPAN';
    byId('fju-member-card-rank').textContent=({pt:'Conta da igreja',ja:'教会アカウント',en:'Church account'}[lang()]);
    return group.grupo;
  }
  if(groupError&&requestedChurchGroup){
    title.textContent=({pt:'Cadastro da igreja',ja:'教会アカウント登録',en:'Church registration'}[lang()]);
    status.textContent=({pt:'O cadastro dos grupos está temporariamente indisponível. Avise a administração da igreja.',ja:'現在、グループ登録をご利用いただけません。教会の管理者にお問い合わせください。',en:'Church group registration is currently unavailable. Please contact the church administrator.'}[lang()]);
    return requestedChurchGroup;
  }
  let pendingGroup=null;
  try{pendingGroup=JSON.parse(sessionStorage.getItem('fju-church-pending-signup')||'null');}catch(_){}
  // A escolha do grupo fica também no Supabase Auth para concluir em outro aparelho.
  // Nunca usamos o metadado para conceder privilégios: o servidor valida o cadastro.
  if(!pendingGroup&&requestedChurchGroup)pendingGroup={email:user.email,name:user.user_metadata?.full_name||'',group:requestedChurchGroup};
  if(pendingGroup?.email?.toLowerCase()===user.email?.toLowerCase()){
    title.textContent='Concluir conta da igreja';
    const form=document.createElement('form');
    const photo=document.createElement('input');photo.type='file';photo.accept='image/*';photo.required=true;
    const button=document.createElement('button');button.textContent='Concluir cadastro';
    form.append(photo,button);container.append(form);
    form.addEventListener('submit',async e=>{
      e.preventDefault();button.disabled=true;
      try{
        await finishChurchGroupSignup(user,pendingGroup,await prepareSignupPhoto(photo.files[0]));
        form.remove();status.textContent='Cadastro concluído. Comentários e check-in liberados.';
        await loadAccount();
      }catch(err){status.textContent=err.message;button.disabled=false;}
    });
    return pendingGroup.group;
  }
  // Contas do link exclusivo nunca devem cair na inscrição de jovens.
  if(user.user_metadata?.requested_role==='coordenador'){
    let pendingCoordinator=null;
    try{pendingCoordinator=JSON.parse(sessionStorage.getItem('fju-coordinator-pending-signup')||'null');}catch(_){}
    if(pendingCoordinator?.email?.toLowerCase()!==user.email?.toLowerCase())pendingCoordinator=null;
    const poloId=pendingCoordinator?.polo||user.user_metadata?.requested_polo_id;
    title.textContent='Cadastro de coordenador FJU';
    const {data:requests,error:requestError}=await client.from('fju_cadastros_coordenadores').select('status').eq('usuario_id',user.id).limit(1);
    // A tabela é restrita por RLS; não confundir ausência de leitura com ausência de pedido.
    if(requestError){status.textContent='Aguardando análise do Nacional. Caso ainda não tenha enviado o pedido, conclua abaixo.';}
    else if(requests?.length){status.textContent='Pedido registrado. Aguarde aprovação do Nacional.';return;}
    if(!poloId){status.textContent='Não encontramos o polo escolhido. Entre novamente pelo link exclusivo de coordenadores para selecionar seu polo.';return;}
    status.textContent='Confirme o envio do seu pedido de coordenador para o Nacional.';
    const form=document.createElement('form');form.style.display='grid';form.style.gap='10px';
    const photo=document.createElement('input');photo.type='file';photo.accept='image/*';photo.required=true;
    const button=document.createElement('button');button.type='submit';button.textContent='Enviar pedido ao Nacional';
    form.append(photo,button);container.append(form);
    form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;try{
      await sendCoordinatorSignup(user,{polo:poloId,name:pendingCoordinator?.name||user.user_metadata?.full_name||user.email},await prepareSignupPhoto(photo.files[0]));
      form.remove();status.textContent='Pedido de coordenador enviado. Aguarde aprovação do Nacional.';
    }catch(err){status.textContent='Não foi possível enviar: '+err.message;button.disabled=false;}});
    return;
  }
  const {data:existing,error:existingError}=await client.rpc('fju_consultar_minha_inscricao');
  if(current!==updateSequence||passwordRecovery)return;
  // RETURNS TABLE RPC yields [] when no inscription exists. An empty array is truthy.
  const currentSignup=Array.isArray(existing)?existing[0]:existing;
  let pending=null;
  try{pending=JSON.parse(sessionStorage.getItem('fju-youth-pending-signup')||'null');}catch(_){}
  if(pending?.email?.toLowerCase()!==user.email?.toLowerCase())pending=null;
  if(!existingError&&currentSignup){
    status.textContent=currentSignup.status==='aprovado'?'Cadastro aprovado pelo coordenador.':currentSignup.status==='rejeitado'?'Sua inscrição não foi aprovada. Fale com o coordenador do seu polo.':'Sua inscrição foi recebida. Aguarde a análise do coordenador do seu polo.';
    return;
  }
  if(existingError){status.textContent='Não foi possível verificar seu cadastro: '+existingError.message;return;}
  const {data:polos,error:poloError}=await client.rpc('fju_listar_polos_cadastro');
  if(current!==updateSequence||passwordRecovery)return;
  if(poloError){status.textContent='Não foi possível carregar os polos: '+poloError.message;return;}
  status.textContent='Complete seus dados, selecione a foto e escolha seu polo e projetos. O coordenador verificará sua inscrição.';
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
    check.addEventListener('change',()=>{const selected=projects.querySelectorAll('input:checked');if(selected.length>4){check.checked=false;status.textContent='Você pode solicitar no máximo quatro projetos.';}});
    label.append(check,document.createTextNode(project));projects.append(label);
  }
  const button=document.createElement('button');button.type='submit';button.textContent='Enviar solicitação';button.style.cssText='padding:12px;border:0;border-radius:10px;background:#253b75;color:white;font-weight:700';
  const details=createSignupDetails();
  name.value=pending?.name||user.user_metadata?.full_name||'';
  polo.value=pending?.polo||'';
  details.fields.birth.value=pending?.birth||'';
  details.fields.phone.value=pending?.phone||'';
  details.fields.nationality.value=pending?.nationality||'';
  for(const check of projects.querySelectorAll('input'))check.checked=(pending?.projects||[]).includes(check.value);
  form.append(name,details.root,polo,projects,button);container.append(form);
  form.addEventListener('submit',async event=>{
    event.preventDefault();button.disabled=true;status.textContent='Enviando inscrição…';
    const selected=[...projects.querySelectorAll('input:checked')].map(x=>x.value);
    try{
     const photo=await prepareSignupPhoto(details.fields.photo.files[0]);
     await sendDetailedSignup(user,{name:name.value.trim(),polo:polo.value,projects:selected,...details.values()},photo);
     form.remove();status.textContent='Inscrição enviada! Aguarde a aprovação do coordenador do seu polo.';
    }catch(error){status.textContent='Não foi possível enviar: '+error.message;button.disabled=false;}

  });
}


// Coordinator My Page: the verified leadership dashboard lives inside My Page.
// Both GitHub Pages paths share one origin and the same Supabase Auth storage key.
// The admin application still checks fju_perfis and Supabase RLS independently.
function renderUnifiedCoordinatorPage(enabled){
 let section=byId('fju-coordinator-unified');
 if(!section){
  section=document.createElement('section');
  section.id='fju-coordinator-unified';
  section.style.cssText='width:100%;min-width:0;margin:0 auto';
  const bar=document.createElement('div');
  bar.style.cssText='display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 8px';
  const title=document.createElement('strong');title.id='fju-coordinator-unified-title';title.textContent='Painel de Controle';
  const profile=document.createElement('button');profile.type='button';profile.textContent='Meu perfil';profile.style.cssText='padding:9px 14px;border-radius:12px;border:1px solid #d6dce8;background:#fff;color:#15213d';
  profile.addEventListener('click',()=>{
   section.style.setProperty('display','none','important');
   showYouthPane('profile');
  });
  bar.append(title,profile);
  const frame=document.createElement('iframe');
  frame.id='fju-coordinator-unified-frame';frame.title='Painel de Controle FJU';frame.loading='eager';
  frame.style.cssText='display:block;width:100%;height:420px;min-height:0;border:0;border-radius:16px;background:#f4f6f9';
  // Same-origin admin page: compact its chrome when embedded in My Page.
  frame.addEventListener('load',()=>{
   try{
    const doc=frame.contentDocument;
    if(!doc||!doc.head)return;
    if(!doc.getElementById('fju-my-page-embedded-style')){
     const style=doc.createElement('style');
     style.id='fju-my-page-embedded-style';
     style.textContent=`
       html,body{background:#f4f6fa!important;overflow-x:hidden!important;overflow-y:hidden!important;height:auto!important;min-height:0!important}
       body>header,body>footer,.fju-session-bar,.fju-validation-notice,
       #fju-coord-personal-area a.fju-coord-personal-link[href='#fju-coord-personal-detail']:has([data-personal-key='journey']),
       #fju-coord-personal-area a.fju-coord-personal-link:has([data-personal-key='projects']){display:none!important}
       #fju-my-page,#fju-admin-language-settings,.fju-content-toolbar,
       .fju-overview-intro,.fju-actions-title{display:none!important}
       #app,.fju-admin-workspace,.fju-admin-content{margin-top:0!important;padding-top:0!important}
       .fju-admin-workspace,.fju-admin-content,#app,#inicio{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
       .fju-admin-content{padding:8px!important}
       /* Compact dashboard icons: avoid stretched grid rows and empty vertical bands. */
       #inicio .fju-dashboard-actions,
       #inicio .fju-personal-actions,
       #inicio .fju-my-area-grid,
       #inicio .fju-app-grid{
         display:grid!important;
         grid-template-columns:repeat(3,minmax(0,1fr))!important;
         grid-auto-rows:max-content!important;
         align-content:start!important;
         align-items:start!important;
         gap:14px 8px!important;
         min-height:0!important;
         height:auto!important;
         margin:12px 0 22px!important;
       }
       #inicio .fju-dashboard-actions>*,
       #inicio .fju-personal-actions>*,
       #inicio .fju-my-area-grid>*,
       #inicio .fju-app-grid>*{
         align-self:start!important;
         min-height:0!important;
         height:auto!important;
         margin:0!important;
       }
       #inicio .fju-dashboard-actions .fju-action-card{
         padding:10px 4px!important;
         gap:5px!important;
       }
       #inicio .fju-dashboard-actions .fju-action-card .fju-action-icon{
         width:58px!important;height:58px!important;
         margin:0 auto 4px!important;
       }
       #inicio .fju-dashboard-actions .fju-action-card>span:not(.fju-action-icon),
       #inicio .fju-dashboard-actions .fju-action-arrow{display:none!important}
       #inicio .fju-dashboard-actions .fju-action-card strong{
         font-size:12px!important;line-height:1.25!important;
         text-align:center!important;overflow-wrap:anywhere!important
       }
       #inicio .fju-dashboard-actions .fju-action-card{box-shadow:none!important}
       #inicio .fju-dashboard-actions+*{margin-top:12px!important}
       #inicio{margin-top:0!important}
       @media(max-width:700px){.fju-admin-content{padding:4px!important}}
     `;
     doc.head.append(style);
    }
    // Remove stale personal shortcuts even when Safari reuses an old admin script.
    const cleanLegacyShortcuts=()=>{
     for(const key of ['journey','projects']){
      doc.querySelectorAll('[data-personal-key="'+key+'"]').forEach(label=>{
       const tile=label.closest('.fju-coord-personal-link');
       if(tile)tile.remove();
      });
     }
    };
    cleanLegacyShortcuts();
    // Expand the frame to its document, so the iPhone has only one scrolling area.
    const fit=()=>{
     if(!frame.isConnected||section.dataset.enabled!=='1')return;
     // The admin document can have a tall min-height even when its actual
     // content is short. Measure the bottom of the visible active panel instead.
     const visiblePanel=[...doc.querySelectorAll('#app .panel')].find(el=>{
      const css=doc.defaultView.getComputedStyle(el);
      return !el.classList.contains('hidden')&&!el.hidden&&css.display!=='none';
     });
     const shell=doc.getElementById('fju-coord-app-shell');
     // Measure actual visible children, never the stretched parent panel.
     // A flex/grid parent may occupy an entire viewport despite empty content.
     const root=visiblePanel?.id==='inicio'&&shell?shell:visiblePanel||shell;
     if(!root)return;
     const visible=el=>{
      if(el.hidden||el.closest('[hidden],.hidden'))return false;
      const cs=doc.defaultView.getComputedStyle(el);
      return cs.display!=='none'&&cs.visibility!=='hidden'&&cs.position!=='fixed'&&cs.position!=='absolute';
     };
     const children=[...root.children].filter(visible);
     const bottoms=children.map(el=>el.getBoundingClientRect().bottom).filter(Number.isFinite);
     if(!bottoms.length)return;
     const measured=Math.ceil(Math.max(...bottoms)+(doc.defaultView?.scrollY||0)+12);
     const height=Math.max(180,Math.min(measured,16000));
     if(Math.abs(frame.offsetHeight-height)>4)frame.style.height=height+'px';
    };
    fit();
    // Observe structural changes only. Watching style changes causes a resize loop
    // because fit() itself writes the iframe height.
    frame._fjuMutationObserver?.disconnect();
    const observer=new MutationObserver(()=>{cleanLegacyShortcuts();requestAnimationFrame(fit);});
    observer.observe(doc.body,{subtree:true,childList:true,characterData:true});
    frame._fjuMutationObserver=observer;
    frame._fjuResizeObserver?.disconnect();
    if(typeof ResizeObserver!=='undefined'){
     frame._fjuResizeObserver=new ResizeObserver(()=>requestAnimationFrame(fit));
     frame._fjuResizeObserver.observe(doc.body);
    }
    doc.defaultView?.addEventListener('resize',fit,{passive:true});

   }catch(error){console.warn('Painel integrado: ajuste visual indisponível',error);}
  });
  section.append(bar,frame);
  byId('fju-youth-dashboard').insertAdjacentElement('afterend',section);
  byId('fju-youth-back')?.addEventListener('click',()=>{
   if(section.dataset.enabled!=='1')return;
   section.style.removeProperty('display');
   section.hidden=false;
   byId('fju-youth-dashboard')?.style.setProperty('display','none','important');
  });
 }
 section.dataset.enabled=enabled?'1':'0';
 section.hidden=!enabled;
 const home=byId('fju-youth-dashboard');
 const access=byId('fju-account-admin-access');
 const adminTile=byId('fju-youth-admin-tile');
 if(enabled){
  // CSS grid styles override the HTML hidden attribute in some mobile browsers.
  // Force the old menu offscreen: coordinator sees their dashboard immediately.
  home?.style.setProperty('display','none','important');
  access?.style.setProperty('display','none','important');
  adminTile?.style.setProperty('display','none','important');
  section.style.removeProperty('display');
  section.style.setProperty('display','block','important');
  const frame=byId('fju-coordinator-unified-frame');
  if(!frame.getAttribute('src'))frame.src='https://fjujapan.github.io/fju-connect-admin/?embed=1&ui=20261028-no-journey-252';
  const l=lang();
  byId('fju-coordinator-unified-title').textContent=l==='ja'?'管理パネル':l==='en'?'Control Panel':'Painel de Controle';
  const profileLabel=section.querySelector('button');
  profileLabel.textContent=l==='ja'?'マイプロフィール':l==='en'?'My profile':'Meu perfil';
  dialog.style.setProperty('width','calc(100vw - 12px)','important');
  dialog.style.setProperty('max-width','1200px','important');
 }else{
  home?.style.removeProperty('display');
  access?.style.removeProperty('display');
  adminTile?.style.removeProperty('display');
  section.style.removeProperty('display');
  dialog.style.removeProperty('width');
  dialog.style.removeProperty('max-width');
  const frame=byId('fju-coordinator-unified-frame');
  if(frame?.getAttribute('src'))frame.removeAttribute('src');
 }
}

async function loadAccount({keepAccountVisible=false}={}){
  const current=++updateSequence;
  if(!passwordRecovery&&!keepAccountVisible&&!(authenticated&&dialog.dataset.fjuView==='account'))showView('loading');
  try{
    const {data:{user},error}=await client.auth.getUser();
    if(current!==updateSequence||passwordRecovery)return;
    if(error||!user){
      authenticated=false;userEmail='';lastRole='';preferredLanguageUser=null;
      renderHeaderAccount(null);
      showView('login');
      return;
    }
    authenticated=true;userEmail=user.email||'';preferredLanguageUser=user;const savedLanguage=user.user_metadata?.preferred_language;if(['pt','ja','en'].includes(savedLanguage)){localStorage.setItem('fju_lang',savedLanguage);localStorage.setItem('fju_language',savedLanguage);localStorage.setItem('fju-connect-lang',savedLanguage);if(localeSelect&&localeSelect.value!==savedLanguage){localeSelect.value=savedLanguage;localeSelect.dispatchEvent(new Event('change'));}}
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
    if(!verifiedAdmin){
      const {data:cards}=await client.rpc('fju_consultar_meu_cartao_jovem');
      if(current!==updateSequence||passwordRecovery)return;
      const card=Array.isArray(cards)?cards[0]:cards;
      if(card){
        byId('fju-member-card-name').textContent=card.nome_completo;
        byId('fju-member-card-polo').textContent='FJU '+card.polo_nome;
        byId('fju-member-card-project').textContent=(card.projetos||[]).join(' · ')||'FJU JAPAN';
        byId('fju-member-card-rank').textContent=card.patente|| (card.categoria==='firme'?'Firme':'Inconstante');
      }
      const {data:photo}=await client.storage.from('fju-inscricoes-fotos').download(user.id+'/perfil.jpg');
      if(current!==updateSequence||passwordRecovery)return;
      if(photo){
        clearHeaderAvatarObjectUrl();headerAvatarObjectUrl=URL.createObjectURL(photo);
        if(headerAvatar){headerAvatar.src=headerAvatarObjectUrl;headerAvatar.hidden=false;}
        if(headerGuest)headerGuest.hidden=true;
        if(cardPhoto){cardPhoto.src=headerAvatarObjectUrl;cardPhoto.hidden=false;}
      }
    }
    const churchGroup=await renderYouthSignup(user,verifiedAdmin,current);
    if(current!==updateSequence||passwordRecovery)return;
    // Coordenadores autenticados recebem o acesso administrativo somente após validação de papel e polo.
    // Show administrative entry only after verified fju_perfis roles.
    const adminTile=byId('fju-youth-admin-tile');
    if(adminTile){
      adminTile.hidden=!verifiedAdmin;
      if(verifiedAdmin)adminTile.href=adminButton?.href||'https://fjujapan.github.io/fju-connect-admin/';
    }
    // Do not advertise unimplemented saved articles.
    const savedTile=dialog.querySelector('[data-fju-youth-panel="saved"]');
    if(savedTile)savedTile.hidden=true;
    accountAccess.hidden=!verifiedAdmin;
    byId('fju-account-member-note').hidden=true;
    const church=byId('fju-account-church');
    church.hidden=!churchName;
    if(churchName)byId('fju-account-church-name').textContent='FJU '+churchName;
    showView('account');
    localize();
    preferredLanguageUI();
    syncYouthHero(verifiedAdmin,churchGroup);
    showYouthPane();
    renderUnifiedCoordinatorPage(verifiedAdmin);
  }catch(e){
    if(current!==updateSequence||passwordRecovery)return;
    authenticated=false;lastRole='';preferredLanguageUser=null;
    renderHeaderAccount(null);
    showView('login');
    setFeedback(t('sessionError'),true);
  }
}
async function openAccount(){
  setFeedback();
  if(passwordRecovery){showDialog();showView('reset');return;}
  // Do not expose the verification screen while the account modal opens.
  // The auth session and role are still validated before privileged content.
  if(authenticated&&lastRole&&myPage&&!myPage.hidden){
    showView('account');
    showDialog();
    void loadAccount({keepAccountVisible:true});
    return;
  }
  // On a cold load, finish validation before displaying the modal.
  await loadAccount();
  showDialog();
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
for(const tile of dialog.querySelectorAll('[data-fju-youth-panel]')){
 tile.addEventListener('click',()=>showYouthPane(tile.dataset.fjuYouthPanel));
}
byId('fju-youth-back').addEventListener('click',()=>showYouthPane());
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
function resetProfilePassword(){
 profilePasswordForm?.reset();
 if(profilePasswordForm)profilePasswordForm.hidden=true;
 if(profilePasswordToggle)profilePasswordToggle.setAttribute('aria-expanded','false');
 if(profilePasswordStatus)profilePasswordStatus.textContent='';
}
profilePasswordToggle?.addEventListener('click',()=>{
 if(!profilePasswordForm)return;
 const willOpen=profilePasswordForm.hidden;
 profilePasswordForm.hidden=!willOpen;
 profilePasswordToggle.setAttribute('aria-expanded',String(willOpen));
 if(willOpen)byId('fju-profile-password-new')?.focus();
 else profilePasswordForm.reset();
 profilePasswordStatus.textContent='';
});
profilePasswordForm?.addEventListener('submit',async event=>{
 event.preventDefault();
 const newPassword=byId('fju-profile-password-new').value;
 const confirmPassword=byId('fju-profile-password-confirm').value;
 const saveButton=byId('fju-profile-password-save');
 if(newPassword.length<8||newPassword!==confirmPassword){
  profilePasswordStatus.textContent=t('passwordMismatch');
  return;
 }
 saveButton.disabled=true;
 profilePasswordStatus.textContent=t('updatingPassword');
 try{
  const {error}=await client.auth.updateUser({password:newPassword});
  if(error)throw error;
  resetProfilePassword();
  profilePasswordStatus.textContent=t('profilePasswordSaved');
 }catch(e){
  profilePasswordStatus.textContent=t('profilePasswordFailed');
 }finally{saveButton.disabled=false;}
});
byId('fju-account-logout').addEventListener('click',async()=>{
  resetProfilePassword();
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
    resetProfilePassword();
    passwordRecovery=false;
    updateSequence++;
    authenticated=false;userEmail='';lastRole='';
    renderHeaderAccount(null);
    showView('login');
    localize();
  }else if(event==='SIGNED_IN'&&!passwordRecovery&&!signupInProgress){
    // Agendar para depois que o SDK liberar o lock interno do auth.
    setTimeout(()=>{void loadAccount({keepAccountVisible:authenticated&&dialog.dataset.fjuView==='account'});},0);
  }
});
localeSelect?.addEventListener('change',()=>{localize();if(preferredLanguageUser)preferredLanguageUI();});
renderHeaderAccount(null);
localize();
// Evita duas verificações de sessão simultâneas e abre cadastro direto.
if(new URLSearchParams(window.location.search).get('cadastro')==='1'){
  void (async()=>{
    showDialog();
    await loadAccount();
    if(!authenticated && !passwordRecovery){
      if(new URLSearchParams(window.location.search).get('tipo')==='coordenador'){signupGroup.value='FJU';signupGroup.closest('label')?.setAttribute('hidden','');signupGroup.style.display='none';}
      signupFeedback();
      showView('signup');
      await loadSignupPolos();
    }
  })();
}else{
  void loadAccount();
}
