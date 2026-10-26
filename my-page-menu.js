/* FJU JAPAN — My Page clean: navegação sem alterar autenticação ou tabelas. */
const $=id=>document.getElementById(id);
const root=$('fju-account-my-page');
const words={
 pt:{intro:'Minha Página',desc:'Seu espaço na FJU JAPAN',quick:'ACESSOS RÁPIDOS',profile:'Meu Perfil',profileSub:'Conta e cadastro',checkin:'Check-in',checkinSub:'Registrar presença',interactions:'Interações',interactionsSub:'Conversas da FJU',events:'Eventos',eventsSub:'Galeria e novidades',saved:'Salvos',savedSub:'Minha biblioteca',admin:'Painel administrativo',adminSub:'Acesso da liderança',back:'Voltar ao menu',interactionsText:'Leia as matérias e participe das conversas com sua conta FJU. Comentários e respostas estão disponíveis em cada matéria.',interactionsGo:'Ver matérias e comentários',savedText:'A função de salvar matérias ainda não está disponível. Esta área está preparada para uma atualização futura.',savedGo:'Explorar matérias'},
 ja:{intro:'マイページ',desc:'FJU JAPANのあなた専用ページ',quick:'クイックアクセス',profile:'プロフィール',profileSub:'アカウントと登録',checkin:'チェックイン',checkinSub:'出席を記録',interactions:'交流',interactionsSub:'FJUのコメント',events:'イベント',eventsSub:'写真とお知らせ',saved:'保存済み',savedSub:'マイライブラリ',admin:'管理パネル',adminSub:'リーダー専用',back:'メニューに戻る',interactionsText:'FJUの記事でコメントや返信に参加できます。投稿は各記事でご覧ください。',interactionsGo:'記事とコメントを見る',savedText:'記事の保存機能は現在準備中です。まだ利用できません。',savedGo:'記事を見る'},
 en:{intro:'My Page',desc:'Your space at FJU JAPAN',quick:'QUICK ACCESS',profile:'My Profile',profileSub:'Account and registration',checkin:'Check-in',checkinSub:'Record attendance',interactions:'Interactions',interactionsSub:'FJU conversations',events:'Events',eventsSub:'Gallery and updates',saved:'Saved',savedSub:'My library',admin:'Admin panel',adminSub:'Leadership access',back:'Back to menu',interactionsText:'Read FJU articles and join conversations. Comments and replies remain available in each article.',interactionsGo:'Browse articles and comments',savedText:'Saving articles is not yet available. This area is reserved for a future update.',savedGo:'Explore articles'}
};
const pictograms={
 profile:[['circle',{cx:12,cy:8,r:4}],['path',{d:'M4 21a8 8 0 0 1 16 0'}]],
 checkin:[['path',{d:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z'}],['path',{d:'m9 10 2 2 4-4'}]],
 interactions:[['path',{d:'M20 11.5A7.5 7.5 0 0 1 12.5 19H7l-4 3V11.5A7.5 7.5 0 0 1 10.5 4h2A7.5 7.5 0 0 1 20 11.5Z'}],['path',{d:'M8 12h8M8 15h5'}]],
 events:[['rect',{x:3,y:5,width:18,height:16,rx:2}],['path',{d:'M7 3v4M17 3v4M3 10h18m6 5 2 2 4-4'}]],
 saved:[['path',{d:'M6 3h12a1 1 0 0 1 1 1v17l-7-5-7 5V4a1 1 0 0 1 1-1Z'}]],
 admin:[['rect',{x:4,y:4,width:16,height:16,rx:3}],['path',{d:'M8 9h8M8 13h8M8 17h5'}]]
};
const make=(tag,cls='',txt='')=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el};
const copy=(tag,key,cls='')=>{const e=make(tag,cls);e.dataset.mypageText=key;return e};
function icon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [k,v] of Object.entries({viewBox:'0 0 24 24',width:'25',height:'25',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(k,v);
 for(const [tag,attrs] of pictograms[name]){
  const shape=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs))shape.setAttribute(k,String(v));
  svg.append(shape);
 }
 return svg;
}
const screens=new Map();let home=null,details=null,last='home';
function language(){const l=$('language')?.value;return words[l]||words.pt}
function localize(){
 if(!root)return;
 const tr=language();
 root.querySelectorAll('[data-mypage-text]').forEach(node=>node.textContent=tr[node.dataset.mypageText]||'');
}
function navigate(key='home',focus=false){
 if(!home)return;
 last=screens.has(key)?key:'home';
 home.hidden=last!=='home';details.hidden=last==='home';
 for(const [name,node] of screens)node.hidden=name!==last;
 if(last!=='home'){
  const heading=details.querySelector('.fju-mypage-panel-heading');
  heading.dataset.mypageText=last;
 }
 localize();
 if(focus)(last==='home'?home.querySelector('.fju-mypage-tile'):details.querySelector('.fju-mypage-back'))?.focus({preventScroll:true});
 $('fju-account-dialog')?.scrollTo?.({top:0,behavior:'instant'});
}
function mount(){
 if(!root||home)return;
 const card=$('fju-member-collectible');
 const identity=root.querySelector('.fju-account-identity');
 const access=$('fju-account-admin-access');
 const note=$('fju-account-member-note');
 const logout=$('fju-account-logout');
 if(!card||!identity||!access||!note||!logout)return;
 home=make('section','fju-mypage-home');home.id='fju-mypage-home';
 const intro=make('div','fju-mypage-intro');
 intro.append(copy('h3','intro'),copy('p','desc'));home.append(intro,card,copy('p','quick','fju-mypage-eyebrow'));
 const grid=make('nav','fju-mypage-grid');grid.setAttribute('aria-label','My Page');
 function tile(name,url){
  const node=make(url?'a':'button','fju-mypage-tile fju-mypage-tile-'+name);
  if(url)node.href=url;else node.type='button';
  const pict=make('span','fju-mypage-icon');pict.append(icon(name));
  const label=make('span','fju-mypage-label');label.append(copy('strong',name),copy('small',name+'Sub'));
  node.append(pict,label);
  if(!url)node.addEventListener('click',()=>navigate(name,true));
  grid.append(node);return node;
 }
 tile('profile');tile('checkin','./check-in/');tile('interactions');
 tile('events','./eventos/');tile('saved');
 const admin=tile('admin','https://fjujapan.github.io/fju-connect-admin/');
 admin.id='fju-mypage-admin-tile';admin.hidden=true;
 home.append(grid);
 details=make('section','fju-mypage-details');details.hidden=true;
 const back=make('button','fju-mypage-back');back.type='button';
 back.append(make('span','fju-mypage-chevron','‹'),copy('span','back'));
 back.addEventListener('click',()=>navigate('home',true));
 const heading=copy('h3','profile','fju-mypage-panel-heading');
 details.append(back,heading);
 const createScreen=name=>{const s=make('section','fju-mypage-screen');s.id='fju-mypage-'+name;s.hidden=true;screens.set(name,s);details.append(s);return s};
 const profile=createScreen('profile');
 profile.append(identity,access,note,logout);
 const interactions=createScreen('interactions');
 interactions.append(copy('p','interactionsText','fju-mypage-explainer'));
 const go=make('a','fju-mypage-cta');go.href='./materias.html';go.append(copy('span','interactionsGo'));interactions.append(go);
 const saved=createScreen('saved');
 saved.append(copy('p','savedText','fju-mypage-explainer'));
 const explore=make('a','fju-mypage-cta');explore.href='./materias.html';explore.append(copy('span','savedGo'));saved.append(explore);
 root.append(home,details);navigate();localize();
}
mount();
window.FjuMyPageUI={navigate,localize};
