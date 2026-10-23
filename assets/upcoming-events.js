/* FJU JAPAN — exibe apenas eventos futuros já aprovados. */
import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const host=document.getElementById('inicio');
if(host){
 host.classList.add('fju-events-hero');
 const wrap=document.createElement('div');wrap.className='fju-upcoming';
 wrap.innerHTML='<p class="fju-upcoming-label">PRÓXIMOS EVENTOS</p><div id="fju-upcoming-content" aria-live="polite"><p>Carregando eventos…</p></div><div class="fju-upcoming-controls" id="fju-upcoming-controls" hidden><button type="button" id="fju-upcoming-prev" aria-label="Evento anterior">←</button><span id="fju-upcoming-count"></span><button type="button" id="fju-upcoming-next" aria-label="Próximo evento">→</button></div>';
 host.appendChild(wrap);
 const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
 const content=document.getElementById('fju-upcoming-content'),controls=document.getElementById('fju-upcoming-controls'),count=document.getElementById('fju-upcoming-count');
 let events=[],pos=0;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 function title(a){return a.titulo_pt||a.titulo_ja||a.titulo_en||'Evento FJU'}
 async function show(){const a=events[pos];if(!a)return;content.replaceChildren();const card=document.createElement('article');card.className='fju-upcoming-card';const img=document.createElement('img');img.className='fju-upcoming-photo';img.alt=title(a);img.loading='eager';if(a.foto1){const{data}=await db.storage.from('fju-materias').createSignedUrl(a.foto1,1800);if(data?.signedUrl)img.src=data.signedUrl}card.append(img);const copy=document.createElement('div');copy.className='fju-upcoming-copy';const date=document.createElement('p');date.textContent=a.data_materia||'';const h=document.createElement('h2');h.textContent=title(a);const link=document.createElement('a');link.href='materia.html?id='+encodeURIComponent(a.id);link.textContent='SAIBA MAIS ↗';copy.append(date,h,link);card.append(copy);content.append(card);count.textContent=(pos+1)+' / '+events.length;controls.hidden=events.length<2}
 document.getElementById('fju-upcoming-prev').onclick=()=>{pos=(pos-1+events.length)%events.length;show()};
 document.getElementById('fju-upcoming-next').onclick=()=>{pos=(pos+1)%events.length;show()};
 try{const{data,error}=await db.from('fju_materias').select('id,data_materia,titulo_pt,titulo_ja,titulo_en,foto1').eq('status','publicada').eq('secao_publicacao','proximos_eventos').gte('data_materia',today).order('data_materia',{ascending:true}).limit(15);if(error)throw error;events=data||[];if(events.length)await show();else content.innerHTML='<p>Em breve, novos eventos da FJU JAPAN. Acompanhe nossas novidades!</p>'}catch(e){content.innerHTML='<p>Os próximos eventos estarão disponíveis em breve.</p>';console.warn('Próximos eventos:',e.message)}
}
