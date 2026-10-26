/* FJU JAPAN · My Page estilo app. Não altera autenticação nem permissões. */
const $=id=>document.getElementById(id);
const i18n={
 pt:{hello:'Minha FJU',title:'Minha Página',profile:'Meu Perfil',profileHint:'Dados e cadastro',checkin:'Check-in',checkinHint:'Minha presença',interactions:'Interações',interactionsHint:'Comentários e respostas',events:'Eventos',eventsHint:'Agenda da FJU',saved:'Salvos',savedHint:'Ler mais tarde',settings:'Ajustes',settingsHint:'Idioma e conta',back:'Voltar ao painel',none:'Nenhuma matéria salva neste aparelho.',browse:'Explorar matérias',remove:'Remover matéria salva',local:'Salvos neste dispositivo e nesta conta.',menu:'Menu da Minha Página'},
 ja:{hello:'FJUマイページ',title:'マイページ',profile:'プロフィール',profileHint:'登録情報',checkin:'チェックイン',checkinHint:'出席を記録',interactions:'交流',interactionsHint:'コメント・返信',events:'イベント',eventsHint:'イベント情報',saved:'保存済み',savedHint:'あとで読む',settings:'設定',settingsHint:'言語とアカウント',back:'メニューに戻る',none:'この端末には保存済みの記事がありません。',browse:'記事を見る',remove:'保存済み記事を削除',local:'この端末・アカウント内の保存です。',menu:'マイページメニュー'},
 en:{hello:'My FJU account',title:'My Page',profile:'My Profile',profileHint:'Your account',checkin:'Check-in',checkinHint:'Attendance',interactions:'Interactions',interactionsHint:'Comments and replies',events:'Events',eventsHint:'FJU calendar',saved:'Saved',savedHint:'Read later',settings:'Settings',settingsHint:'Language and account',back:'Back to menu',none:'No saved articles on this device.',browse:'Browse articles',remove:'Remove saved article',local:'Saved on this device for this account.',menu:'My Page menu'}
};
const paths={
 profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 checkin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><path d="m9 10 2 2 4-4"/>',
 interactions:'<path d="M21 11a8 8 0 0 1-8 8c-1.4 0-2.8-.4-4-1l-5 2 1.8-5A8 8 0 1 1 21 11z"/><path d="M8 10h8m-8 4h5"/>',
 events:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
 saved:'<path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4z"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>'
};
const text=(tag,value,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e};
const icon=key=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.innerHTML=paths[key];return svg};
let userId='',locale='pt',screen='home';
const words=()=>i18n[locale]||i18n.pt;
function readSaved(){
 if(!userId)return[];
 try{const records=JSON.parse(localStorage.getItem('fju_saved_articles_v1_'+userId)||'[]');
  return Array.isArray(records)?records.filter(x=>x&&/^[0-9a-f-]{36}$/i.test(x.id)&&typeof x.title==='string').slice(0,100):[]}catch(_){return[]}
}
function saveRecords(records){if(userId)localStorage.setItem('fju_saved_articles_v1_'+userId,JSON.stringify(records))}
function renderSaved(){
 const area=$('fju-dash-saved');if(!area)return;
 const w=words(),records=readSaved();area.replaceChildren();
 if(!records.length)area.append(text('p',w.none,'fju-dash-empty'));
 for(const entry of records){
  const row=text('div',undefined,'fju-dash-saved-row');
  const a=text('a',entry.title.slice(0,150));a.href='./materia.html?id='+encodeURIComponent(entry.id);
  const remove=text('button','×');remove.type='button';remove.setAttribute('aria-label',w.remove);
  remove.addEventListener('click',()=>{saveRecords(readSaved().filter(item=>item.id!==entry.id));renderSaved()});
  row.append(a,remove);area.append(row);
 }
 const note=text('p',w.local,'fju-dash-note');
 const browse=text('a',w.browse,'fju-dash-browse');browse.href='./materias.html';
 area.append(note,browse);
}
function showScreen(tab){
 screen=tab;
 const home=$('fju-dash-home'),detail=$('fju-dash-detail');
 if(!home||!detail)return;
 home.hidden=tab!=='home';detail.hidden=tab==='home';
 for(const pane of detail.querySelectorAll('[data-my-page-pane]'))pane.hidden=pane.dataset.myPagePane!==tab;
 if(tab!=='home')$('fju-dash-detail-title').textContent=words()[tab];
 if(tab==='saved')renderSaved();
 $('fju-account-dialog').scrollTop=0;
}
function localize(){
 if(!$('fju-dash-root'))return;
 const w=words();
 $('fju-dash-kicker').textContent=w.hello;
 $('fju-dash-home-title').textContent=w.title;
 $('fju-dash-back').textContent='‹ '+w.back;
 $('fju-dash-grid').setAttribute('aria-label',w.menu);
 for(const tile of $('fju-dash-grid').children){
  const name=tile.dataset.fjuTile;
  tile.querySelector('strong').textContent=w[name];
  tile.querySelector('small').textContent=w[name+'Hint'];
 }
 if(screen!=='home')$('fju-dash-detail-title').textContent=w[screen];
 if(screen==='saved')renderSaved();
}
function make(){
 const root=text('div',undefined,'fju-dash-root');root.id='fju-dash-root';
 const home=text('section');home.id='fju-dash-home';
 const summary=text('div',undefined,'fju-dash-summary');
 const avatar=text('img');avatar.id='fju-dash-picture';avatar.alt='';avatar.hidden=true;
 const fallback=text('span','FJU','fju-dash-fallback');
 const header=text('div',undefined,'fju-dash-identity');
 const kicker=text('small');kicker.id='fju-dash-kicker';
 const name=text('h3');name.id='fju-dash-person';
 const polo=text('p');polo.id='fju-dash-place';
 const rank=text('span',undefined,'fju-dash-rank');rank.id='fju-dash-patent';
 header.append(kicker,name,polo,rank);summary.append(avatar,fallback,header);
 const title=text('h3',undefined,'fju-dash-section-heading');title.id='fju-dash-home-title';
 const grid=text('nav',undefined,'fju-dash-grid');grid.id='fju-dash-grid';
 for(const key of ['profile','checkin','interactions','events','saved','settings']){
  const href={checkin:'./check-in/',interactions:'./materias.html',events:'./eventos/'}[key];
  const tile=text(href?'a':'button',undefined,'fju-dash-tile');tile.dataset.fjuTile=key;
  if(href)tile.href=href;else{tile.type='button';tile.addEventListener('click',()=>showScreen(key))}
  const picture=text('span',undefined,'fju-dash-tile-icon '+key);picture.append(icon(key));
  tile.append(picture,text('strong'),text('small'));grid.append(tile);
 }
 home.append(summary,title,grid);
 const detail=text('section');detail.id='fju-dash-detail';detail.hidden=true;
 const back=text('button',undefined,'fju-dash-back');back.type='button';back.id='fju-dash-back';
 back.addEventListener('click',()=>showScreen('home'));
 const heading=text('h3',undefined,'fju-dash-section-heading');heading.id='fju-dash-detail-title';
 detail.append(back,heading);
 const profile=text('div');profile.dataset.myPagePane='profile';profile.id='fju-dash-profile';
 const saved=text('div');saved.dataset.myPagePane='saved';saved.id='fju-dash-saved';
 const settings=text('div');settings.dataset.myPagePane='settings';settings.id='fju-dash-settings';
 detail.append(profile,saved,settings);root.append(home,detail);
 const page=$('fju-account-my-page');
 for(const node of [$('fju-member-collectible'),page.querySelector('.fju-account-identity'),$('fju-account-member-note'),$('fju-youth-signup')]){
  if(node)profile.append(node);
 }
 for(const node of [$('fju-preferred-language-settings'),$('fju-account-admin-access'),$('fju-account-logout')]){
  if(node)settings.append(node);
 }
 page.append(root);
}
export function mountFjuMyPage(id,language){
 userId=id;locale=i18n[language]?language:'pt';
 if(!$('fju-dash-root'))make();
 const photo=$('fju-member-card-photo'),picture=$('fju-dash-picture');
 const src=photo&&!photo.hidden?photo.src:'';
 if(src){picture.src=src;picture.hidden=false}else{picture.removeAttribute('src');picture.hidden=true}
 $('fju-dash-root').querySelector('.fju-dash-fallback').hidden=!!src;
 $('fju-dash-person').textContent=$('fju-member-card-name')?.textContent||'FJU JAPAN';
 $('fju-dash-place').textContent=$('fju-member-card-polo')?.textContent||'';
 $('fju-dash-patent').textContent=$('fju-member-card-rank')?.textContent||'';
 if($('fju-account-member-note'))$('fju-account-member-note').hidden=true;
 localize();showScreen('home');
 if($('fju-youth-signup')?.querySelector('form'))showScreen('profile');
}
export function setFjuMyPageLanguage(language){locale=i18n[language]?language:'pt';localize()}
export function clearFjuMyPage(){userId='';showScreen('home')}
