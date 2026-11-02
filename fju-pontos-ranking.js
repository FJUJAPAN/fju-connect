import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const style=document.createElement('style');style.textContent=`
#fju-ranking{background:#151423;color:#fff;padding:72px 18px;scroll-margin-top:80px}
#fju-ranking .inner{max-width:980px;margin:auto}
#fju-ranking h2{font-size:clamp(28px,5vw,44px);margin:8px 0 12px}
#fju-ranking .muted{color:#c8bfd6;font-size:14px;line-height:1.6}
#fju-ranking .tabs{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}
#fju-ranking button,#fju-ranking select{border-radius:10px;border:1px solid #78567e;padding:12px 16px;background:#26243d;color:white;font:700 14px system-ui;cursor:pointer}
#fju-ranking button[aria-pressed=true]{background:#c42148}
#fju-ranking ol{list-style:none;padding:0;display:grid;gap:8px}
#fju-ranking li{padding:14px 16px;background:#ffffff10;border:1px solid #ffffff25;border-radius:12px;display:flex;gap:12px;align-items:center}
#fju-ranking li .place{font-size:22px;color:#ff95b8;font-weight:900;min-width:42px}
#fju-ranking li .name{flex:1;font-weight:800;overflow-wrap:anywhere}
#fju-ranking li small{display:block;font-size:12px;color:#b2c0d2;font-weight:400}
#fju-ranking li .points{font-weight:900;white-space:nowrap}
#fju-my-points{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 0 17px;padding:16px;border-radius:16px;background:linear-gradient(120deg,#661741,#ba2450);border:1px solid #efa0bd;color:#fff}
#fju-my-points strong{font-size:30px;display:block}#fju-my-points span{font-size:13px}
`;document.head.append(style);
const fmt=n=>Number(n||0).toLocaleString('pt-BR');
const tokyoDate=()=>{const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=k=>p.find(x=>x.type===k).value;return part('year')+'-'+part('month')+'-'+part('day')};
const monthStart=()=>tokyoDate().slice(0,7)+'-01';
function weekStart(){const date=new Date(tokyoDate()+'T12:00:00+09:00');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const part=k=>p.find(x=>x.type===k).value;return part('year')+'-'+part('month')+'-'+part('day')}
function rank(){
 const main=document.querySelector('main');if(!main)return;
 const section=document.createElement('section');section.id='fju-ranking';
 section.innerHTML='<div class="inner"><span style="color:#ec79a1;font-weight:900">🏆 FJU CONNECT JAPAN</span><h2>Ranking de participação</h2><p class="muted">Check-in, comentários, matérias publicadas e compartilhamentos declarados no Facebook.</p><div class="tabs"><button type="button" data-period="semanal" aria-pressed="true">Semanal</button><button type="button" data-period="mensal" aria-pressed="false">Mensal e histórico</button></div><label for="fju-rank-month" id="fju-month-label" hidden>Escolha o mês: </label><select id="fju-rank-month" hidden></select><p id="fju-rank-meta" class="muted" aria-live="polite">Carregando ranking…</p><ol id="fju-rank-list"></ol><p class="muted">Atualização diária às <b>07:00 (horário do Japão)</b>. Fechamento mensal às <b>22:00 do último dia</b>, com histórico preservado. Os nomes são abreviados.</p></div>';
 main.append(section);
 let period='semanal',request=0;
 const buttons=section.querySelectorAll('[data-period]'),select=section.querySelector('select'),label=section.querySelector('#fju-month-label'),meta=section.querySelector('#fju-rank-meta'),list=section.querySelector('ol');
 async function months(){
  const {data,error}=await db.from('fju_ranking_ciclos').select('periodo_inicio,fechado').eq('periodo','mensal').order('periodo_inicio',{ascending:false}).limit(36);
  if(error)throw error;
  const map=new Map([[monthStart(),false]]);(data||[]).forEach(x=>map.set(x.periodo_inicio,x.fechado));
  select.replaceChildren();for(const [key,closed] of map){const op=document.createElement('option');op.value=key;op.textContent=new Date(key+'T12:00:00+09:00').toLocaleDateString('pt-BR',{timeZone:'Asia/Tokyo',month:'long',year:'numeric'})+(closed?' • encerrado':'');select.append(op);}
 }
 async function load(){
  const stamp=++request;meta.textContent='Carregando ranking…';list.replaceChildren();
  try{
   if(period==='mensal'&&!select.options.length)await months();
   const key=period==='semanal'?weekStart():(select.value||monthStart());
   const [score,cycle]=await Promise.all([
    db.from('fju_ranking_snapshots').select('posicao,apelido,polo,pontos').eq('periodo',period).eq('periodo_inicio',key).order('posicao').order('apelido').limit(30),
    db.from('fju_ranking_ciclos').select('atualizado_em,fechado').eq('periodo',period).eq('periodo_inicio',key).maybeSingle()
   ]);
   if(stamp!==request)return;if(score.error)throw score.error;if(cycle.error)throw cycle.error;
   const last=cycle.data?.atualizado_em?new Date(cycle.data.atualizado_em).toLocaleString('pt-BR',{timeZone:'Asia/Tokyo'}):'—';
   meta.textContent=(period==='semanal'?'Semana de ':'Mês de ')+key.slice(8)+'/'+key.slice(5,7)+'/'+key.slice(0,4)+(cycle.data?.fechado?' • Fechado':'')+' • Atualizado: '+last+' JST';
   if(!score.data?.length){const item=document.createElement('li');item.textContent='Ainda não há pontos registrados para este período.';list.append(item);return;}
   for(const item of score.data){
    const li=document.createElement('li'),place=document.createElement('span'),name=document.createElement('span'),points=document.createElement('span');
    place.className='place';place.textContent=item.posicao+'º';name.className='name';name.textContent=item.apelido;
    if(item.polo){const small=document.createElement('small');small.textContent='FJU '+item.polo;name.append(small);}
    points.className='points';points.textContent=fmt(item.pontos)+' pts';li.append(place,name,points);list.append(li);
   }
  }catch(e){if(stamp===request)meta.textContent='Não foi possível carregar o ranking. Tente atualizar a página.';}
 }
 buttons.forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period;buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));select.hidden=period!=='mensal';label.hidden=select.hidden;void load();}));
 select.addEventListener('change',()=>void load());void load();setInterval(()=>{if(!document.hidden)void load()},300000);
}
function myPoints(){
 const home=document.getElementById('fju-youth-dashboard'),page=document.getElementById('fju-account-my-page'),dialog=document.getElementById('fju-account-dialog');
 if(!home||!page||!dialog)return;
 const box=document.createElement('aside');box.id='fju-my-points';box.hidden=true;
 box.innerHTML='<div><span>⭐ Meus pontos</span><strong id="myp-total">—</strong><span>Total acumulado</span></div><div style="text-align:right"><span>Semana: <b id="myp-week">—</b></span><br><span>Mês: <b id="myp-month">—</b></span></div>';
 home.prepend(box);let busy=false,last=0;
 async function refresh(){if(!dialog.open||page.hidden||busy||Date.now()-last<10000)return;busy=true;last=Date.now();
  try{const {data:{user}}=await db.auth.getUser();if(!user){box.hidden=true;return;}
   const {data,error}=await db.rpc('fju_meus_pontos');if(error)throw error;const s=Array.isArray(data)?data[0]:data;
   if(s){document.getElementById('myp-total').textContent=fmt(s.total);document.getElementById('myp-week').textContent=fmt(s.semanal);document.getElementById('myp-month').textContent=fmt(s.mensal);box.hidden=false;}
  }catch(e){box.hidden=true;}finally{busy=false;}
 }
 new MutationObserver(()=>{if(!page.hidden)void refresh()}).observe(page,{attributes:true,attributeFilter:['hidden']});
 dialog.addEventListener('click',()=>{if(!page.hidden)void refresh()});
 db.auth.onAuthStateChange(()=>{last=0;setTimeout(refresh,200)});
}
const boot=()=>{rank();myPoints()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
