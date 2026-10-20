/* FJU JAPAN — Notícias recentes da Igreja Universal. © 2026 FJU JAPAN */
(() => {
  const root=document.getElementById('fju-universal-news');
  if(!root)return;
  const image=root.querySelector('[data-news-image]'),title=root.querySelector('[data-news-title]'),link=root.querySelector('[data-news-link]'),status=root.querySelector('[data-news-status]');
  const endpoint='https://universaljp.org/wp-json/wp/v2/posts?per_page=3&_embed=1';
  let posts=[],index=0,timer;
  const clean=html=>{const el=document.createElement('div');el.innerHTML=html||'';return (el.textContent||'').trim()};
  const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]]}return items};
  const show=()=>{const p=posts[index];if(!p)return;title.textContent=p.title;link.href=p.url;image.hidden=!p.image;if(p.image){image.src=p.image;image.alt=p.title;}else image.removeAttribute('src');status.textContent='';index=(index+1)%posts.length};
  const load=async()=>{try{const response=await fetch(endpoint,{headers:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw Error('Not available');const data=await response.json();if(!Array.isArray(data))throw Error('Invalid data');const recent=data.slice(0,3).map(p=>({title:clean(p.title?.rendered),url:p.link,image:p._embedded?.['wp:featuredmedia']?.[0]?.source_url||''})).filter(p=>p.title&&/^https:\/\/(www\.)?universaljp\.org\//i.test(p.url));if(!recent.length)throw Error('Empty feed');posts=shuffle(recent);index=0;show();clearInterval(timer);if(posts.length>1)timer=setInterval(show,7500)}catch(e){if(!posts.length){status.textContent='Confira as últimas notícias no site da Igreja Universal.';link.href='https://universaljp.org/';title.textContent='Notícias da Igreja Universal';image.hidden=true;}}};
  load();setInterval(load,15*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
})();
