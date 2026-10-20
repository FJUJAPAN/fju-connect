/* FJU JAPAN — Destaques da Igreja Universal. Public WordPress posts only. */
(() => {
 const root=document.getElementById('fju-universal-news');
 if(!root)return;
 const photo=root.querySelector('[data-universal-photo]');
 const title=root.querySelector('[data-universal-title]');
 const link=root.querySelector('[data-universal-link]');
 const status=root.querySelector('[data-universal-status]');
 const dots=root.querySelector('[data-universal-dots]');
 const translations={
  pt:{more:'Clique aqui e saiba mais',loading:'Carregando notícias...',unavailable:'Confira as últimas notícias da Igreja Universal',label:'Destaques da Igreja Universal'},
  ja:{more:'詳しくはこちら',loading:'ニュースを読み込み中...',unavailable:'世界平和統一ではなく、ユニバーサル教会の最新ニュースを見る',label:'ユニバーサル教会の最新情報'},
  en:{more:'Click here to learn more',loading:'Loading news...',unavailable:'See the latest Universal Church news',label:'Universal Church highlights'}
 };
 // Only the three newest public posts; shuffle display order without repetition per cycle.
 const locale=()=>translations[document.getElementById('language')?.value]||translations.pt;
 let posts=[],queue=[],current=-1,timer=null;
 const shuffle=()=>{queue=posts.map((_,i)=>i);for(let i=queue.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}if(queue.length>1&&queue[0]===current)[queue.push(queue.shift())];};
 const plain=html=>{const el=document.createElement('div');el.innerHTML=html||'';return el.textContent?.trim()||'';};
 const draw=()=>{
  const t=locale();root.querySelector('[data-universal-heading]').textContent=t.label;
  link.textContent=t.more;
  if(!posts.length){title.textContent=t.unavailable;link.href='https://universaljp.org/';photo.hidden=true;status.hidden=false;status.textContent='universaljp.org';dots.replaceChildren();return;}
  if(!queue.length)shuffle();
  current=queue.shift();const p=posts[current];title.textContent=p.title;link.href=p.url;
  if(p.image){photo.src=p.image;photo.alt=p.title;photo.hidden=false;}else{photo.removeAttribute('src');photo.hidden=true;}
  status.hidden=true;dots.replaceChildren();
  posts.forEach((_,i)=>{const dot=document.createElement('span');dot.className='fju-universal-dot'+(i===current?' is-active':'');dots.append(dot);});
 };
 const load=async()=>{
  status.textContent=locale().loading;
  try{
   const response=await fetch('https://universaljp.org/wp-json/wp/v2/posts?per_page=3&orderby=date&order=desc&_embed=1',{headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('WordPress API unavailable');
   const data=await response.json();if(!Array.isArray(data)||!data.length)throw Error('No posts');
   posts=data.filter(p=>p?.link&&p?.title?.rendered).slice(0,3).map(p=>({
    title:plain(p.title.rendered),url:p.link,
    image:p._embedded?.['wp:featuredmedia']?.[0]?.source_url||p.jetpack_featured_media_url||''
   }));
   if(!posts.length)throw Error('No valid posts');
  }catch(e){console.warn('FJU Universal highlights: feed unavailable',e);posts=[];}
  queue=[];draw();
  if(timer)clearInterval(timer);
  if(posts.length>1)timer=setInterval(()=>{if(!document.hidden)draw();},7000);
 };
 document.getElementById('language')?.addEventListener('change',()=>{root.querySelector('[data-universal-heading]').textContent=locale().label;link.textContent=locale().more;if(!posts.length)title.textContent=locale().unavailable;});
 load();
})();
