// FJU CONNECT JAPAN — Área de Projetos.
// A tela só mostra o que o banco libera: o acesso vem de fju_projetos_acesso()
// (projeto marcado na ficha do jovem; Nacional vê todos). Conteúdos futuros de
// cada projeto devem ser protegidos no banco com fju_tem_projeto().
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');

// value = nome gravado na ficha (fju_jovens.projetos)
// emConstrucao: true mostra a faixa "Em construção" e o cadeado "Em breve" para todos.
// Para liberar um projeto, troque para false.
export const PROJECTS=[
 {slug:'midia',value:'Mídia',short:'MID',mark:'mark-media',emConstrucao:true,
  name:{pt:'Mídia',ja:'メディア',en:'Media'},
  desc:{pt:'Criatividade, fotografia, vídeo e comunicação.',ja:'写真、映像、デザイン、発信。',en:'Creativity, photography, video and communication.'}},
 {slug:'esporte',value:'Esporte',short:'ESP',mark:'mark-sport',emConstrucao:true,
  name:{pt:'Esporte',ja:'スポーツ',en:'Sports'},
  desc:{pt:'Movimento, amizade e novos desafios.',ja:'体を動かし、仲間と新しい挑戦へ。',en:'Movement, friendship and new challenges.'}},
 {slug:'cultura',value:'Cultura',short:'CUL',mark:'mark-culture',emConstrucao:true,
  name:{pt:'Cultura',ja:'カルチャー',en:'Culture'},
  desc:{pt:'Expressão, música, arte e talento.',ja:'音楽、アート、表現、才能。',en:'Expression, music, art and talent.'}},
 {slug:'help',value:'HELP',short:'HELP',mark:'mark-help',emConstrucao:true,
  name:{pt:'HELP',ja:'HELP',en:'HELP'},
  desc:{pt:'Ação social: servir e ajudar quem precisa.',ja:'社会貢献：困っている人を支える活動。',en:'Social action: serving and helping people in need.'}},
 {slug:'jiu-jitsu',value:'FJU BJJ',short:'BJJ',mark:'mark-bjj',emConstrucao:true,
  name:{pt:'Jiu-jitsu',ja:'柔術',en:'Jiu-jitsu'},
  desc:{pt:'Disciplina, amizade e superação no tatame.',ja:'畳の上で、規律・友情・成長。',en:'Discipline, friendship and growth on the mat.'}},
 {slug:'uniforca',value:'Uniforça',short:'UNI',mark:'mark-uniforca',emConstrucao:true,
  name:{pt:'Uniforça',ja:'ユニフォルサ',en:'Uniforça'},
  desc:{pt:'Projeto Uniforça da FJU.',ja:'FJUのユニフォルサ・プロジェクト。',en:'The FJU Uniforça project.'}}
];

const T={
 pt:{navHome:'Início',navEvents:'Eventos',navProjects:'Projetos',title:'Projetos',lead:'Cada projeto tem uma área exclusiva para os seus membros.',listTitle:'Todos os projetos',footer:'Projetos',
  loading:'Verificando seus projetos…',login:'Entre na sua conta pela My Page para acessar a área dos seus projetos.',none:'Sua ficha ainda não tem nenhum projeto. Fale com o coordenador do seu polo.',error:'Não foi possível verificar seus projetos. Tente novamente.',
  member:'Seu projeto · Entrar ↗',locked:'🔒 Somente membros',signin:'🔒 Faça login',back:'‹ Todos os projetos',
  welcome:'Bem-vindo à área do projeto',soonTitle:'Conteúdos em breve',soonText:'Esta área já está liberada para você. Os conteúdos do projeto serão publicados aqui.',
  deniedTitle:'Área exclusiva',deniedText:'Esta área é somente para os membros deste projeto. Se você participa, peça ao coordenador do seu polo para incluir o projeto na sua ficha.',
  loginTitle:'Faça login',loginText:'Entre na sua conta pela My Page para continuar.',notFound:'Projeto não encontrado.',ribbon:'EM CONSTRUÇÃO',soon:'Em breve',buildTitle:'Em construção',buildText:'Estamos preparando esta área. Em breve ela estará disponível para os membros do projeto.'},
 ja:{navHome:'ホーム',navEvents:'イベント',navProjects:'プロジェクト',title:'プロジェクト',lead:'各プロジェクトには、メンバー専用のエリアがあります。',listTitle:'すべてのプロジェクト',footer:'プロジェクト',
  loading:'プロジェクトを確認しています…',login:'自分のプロジェクトのエリアを見るには、マイページからログインしてください。',none:'あなたのプロフィールにはまだプロジェクトがありません。教会のコーディネーターに相談してください。',error:'プロジェクトを確認できませんでした。もう一度お試しください。',
  member:'参加中 · 入る ↗',locked:'🔒 メンバー限定',signin:'🔒 ログイン',back:'‹ すべてのプロジェクト',
  welcome:'プロジェクトエリアへようこそ',soonTitle:'コンテンツは準備中です',soonText:'このエリアはすでに利用できます。プロジェクトのコンテンツはここに掲載されます。',
  deniedTitle:'メンバー専用エリア',deniedText:'このエリアはプロジェクトのメンバー専用です。参加している場合は、教会のコーディネーターにプロフィールへの追加を依頼してください。',
  loginTitle:'ログインしてください',loginText:'続けるには、マイページからログインしてください。',notFound:'プロジェクトが見つかりません。',ribbon:'準備中',soon:'近日公開',buildTitle:'準備中',buildText:'このエリアは現在準備中です。まもなくプロジェクトメンバーに公開されます。'},
 en:{navHome:'Home',navEvents:'Events',navProjects:'Projects',title:'Projects',lead:'Each project has an area just for its members.',listTitle:'All projects',footer:'Projects',
  loading:'Checking your projects…',login:'Sign in through My Page to open your project areas.',none:'Your profile has no projects yet. Talk to your church coordinator.',error:'Could not check your projects. Please try again.',
  member:'Your project · Enter ↗',locked:'🔒 Members only',signin:'🔒 Sign in',back:'‹ All projects',
  welcome:'Welcome to the project area',soonTitle:'Content coming soon',soonText:'This area is already open for you. The project content will be published here.',
  deniedTitle:'Members only',deniedText:'This area is only for members of this project. If you take part, ask your church coordinator to add the project to your profile.',
  loginTitle:'Please sign in',loginText:'Sign in through My Page to continue.',notFound:'Project not found.',ribbon:'UNDER CONSTRUCTION',soon:'Coming soon',buildTitle:'Under construction',buildText:'We are preparing this area. It will be available to project members soon.'}
};

const $=id=>document.getElementById(id);
const sel=$('language');
let lang=(()=>{try{const v=(localStorage.getItem('fju_lang')||localStorage.getItem('fju_language')||'pt').toLowerCase();return v.startsWith('ja')?'ja':v.startsWith('en')?'en':'pt';}catch{return 'pt';}})();
let state='loading'; // loading | anon | ready | error
let access=new Map(); // value -> boolean

const t=k=>(T[lang]||T.pt)[k]||T.pt[k]||'';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const currentSlug=()=>new URLSearchParams(location.search).get('p')||'';

function mark(p){const m=el('span','proj-mark '+p.mark,p.short);m.setAttribute('aria-hidden','true');return m;}

function renderList(){
 const grid=$('proj-grid');grid.replaceChildren();
 for(const p of PROJECTS){
  const top=el('div','proj-card-top');top.append(mark(p),el('h3',null,p.name[lang]||p.name.pt));
  if(p.emConstrucao){
   const card=el('a','proj-card is-soon');card.href='?p='+encodeURIComponent(p.slug);
   const ribbon=el('span','proj-ribbon',t('ribbon'));ribbon.setAttribute('aria-hidden','true');
   card.append(ribbon,top,el('p',null,p.desc[lang]||p.desc.pt),el('span','proj-badge','🔒 '+t('soon')));
   card.setAttribute('aria-label',(p.name[lang]||p.name.pt)+' — '+t('buildTitle'));
   grid.append(card);continue;
  }
  const member=state==='ready'&&access.get(p.value)===true;
  const card=el(member?'a':'div','proj-card '+(member?'is-member':'is-locked'));
  if(member)card.href='?p='+encodeURIComponent(p.slug);
  const badge=el('span','proj-badge',state==='loading'?'…':member?t('member'):state==='anon'?t('signin'):t('locked'));
  card.append(top,el('p',null,p.desc[lang]||p.desc.pt),badge);
  grid.append(card);
 }
 const status=$('proj-status');
 const anyOpen=PROJECTS.some(p=>!p.emConstrucao);
 const msg=!anyOpen?'':state==='loading'?t('loading'):state==='anon'?t('login'):state==='error'?t('error'):(state==='ready'&&![...access.values()].some(Boolean))?t('none'):'';
 status.textContent=msg;status.hidden=!msg;
}

function renderArea(slug){
 const area=$('proj-area');area.replaceChildren();
 const back=el('a','proj-back',t('back'));back.href='./';area.append(back);
 const p=PROJECTS.find(x=>x.slug===slug);
 if(!p){area.append(el('p',null,t('notFound')));return;}
 const head=el('div','proj-area-head');
 const titles=el('div');titles.append(el('p','kicker',t('welcome')),el('h2',null,p.name[lang]||p.name.pt));
 head.append(mark(p),titles);area.append(head);
 if(p.emConstrucao){
  const panel=el('div','proj-panel proj-building');
  const lock=el('div','proj-lock','🔒');lock.setAttribute('aria-hidden','true');
  panel.append(el('span','proj-ribbon proj-ribbon-wide',t('ribbon')),lock,el('h3',null,t('buildTitle')),el('p','proj-soon-label',t('soon')),el('p',null,t('buildText')));
  area.append(panel);return;
 }
 if(state==='loading'){area.append(el('p',null,t('loading')));return;}
 const panel=el('div','proj-panel');
 if(state==='anon'){panel.classList.add('locked');panel.append(el('h3',null,t('loginTitle')),el('p',null,t('loginText')));}
 else if(state==='error'){panel.classList.add('locked');panel.append(el('p',null,t('error')));}
 else if(access.get(p.value)===true){panel.append(el('h3',null,t('soonTitle')),el('p',null,t('soonText')));}
 else{panel.classList.add('locked');panel.append(el('h3',null,t('deniedTitle')),el('p',null,t('deniedText')));}
 area.append(panel);
}

function render(){
 document.documentElement.lang=lang==='ja'?'ja':lang==='en'?'en':'pt-BR';
 sel.value=lang;
 document.querySelectorAll('[data-t]').forEach(n=>{const v=t(n.dataset.t);if(v)n.textContent=v;});
 const slug=currentSlug();
 $('proj-list').hidden=!!slug;$('proj-area').hidden=!slug;
 if(slug)renderArea(slug);else renderList();
}

async function load(){
 try{
  const {data:{session}}=await db.auth.getSession();
  if(!session){state='anon';render();return;}
  const {data,error}=await db.rpc('fju_projetos_acesso');
  if(error)throw error;
  access=new Map((data||[]).map(r=>[r.projeto,r.acesso===true]));
  state='ready';
 }catch(e){console.warn('[projetos]',e);state='error';}
 render();
}

sel.addEventListener('change',()=>{lang=sel.value;try{localStorage.setItem('fju_lang',lang);}catch{}render();});
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')load();});
render();
load();
