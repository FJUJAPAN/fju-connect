import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const lang=()=>{const v=(document.getElementById('language')?.value||localStorage.getItem('fju_lang')||document.documentElement.lang||'pt').toLowerCase();return v.startsWith('ja')?'ja':v.startsWith('en')?'en':'pt'};
const i18n={
pt:{title:'Solicitar pontos',explain:'Preencha sua atividade. Apenas seu coordenador poderá aprovar. Os pontos só entram no ranking depois da aprovação.',activity:'Atividade',date:'Dia da atividade',detail:'Detalhes para conferência (sem telefone ou dados pessoais de visitantes)',placeholder:'Descreva brevemente o que realizou. Para visitas repetidas, use a mesma referência da pessoa.',send:'Enviar para aprovação',sending:'Enviando…',sent:'Solicitação enviada ao coordenador. Aguardando aprovação.',history:'Minhas solicitações',none:'Nenhuma solicitação registrada.',failed:'Não foi possível carregar suas solicitações.',duplicate:'Essa solicitação já foi enviada.',error:'Não foi possível enviar. Confira os dados e tente novamente.',approved:'Aprovada',rejected:'Rejeitada',pending:'Pendente',points:'pontos',rejectedReason:'Observação:',labels:['Limpeza da igreja','Evangelização','Trouxe uma pessoa nova ou afastada (1ª vez)','Trouxe a mesma pessoa pela 2ª vez na semana','Trouxe a mesma pessoa pela 3ª vez no mês']},
ja:{title:'ポイント申請',explain:'活動を申請してください。所属教会の担当者が承認するとポイントがランキングに反映されます。',activity:'活動',date:'活動日',detail:'確認用メモ（訪問者の電話番号や個人情報は書かないでください）',placeholder:'活動内容を簡単に記入してください。再訪問は同じ識別名を使用してください。',send:'承認を申請',sending:'送信中…',sent:'申請を送信しました。承認待ちです。',history:'申請履歴',none:'申請履歴はありません。',failed:'申請履歴を読み込めませんでした。',duplicate:'同じ申請がすでに送信されています。',error:'送信できませんでした。入力内容をご確認ください。',approved:'承認済み',rejected:'却下',pending:'承認待ち',points:'点',rejectedReason:'備考:',labels:['教会の清掃','伝道活動','初めて来た人・戻ってきた人を連れてきた','同じ週に同じ人を2回目に連れてきた','同じ月に同じ人を3回目に連れてきた']},
en:{title:'Request points',explain:'Submit your activity. Only your church coordinator can approve it; points enter the rankings after approval.',activity:'Activity',date:'Activity date',detail:'Details for verification (no visitor phone numbers or personal information)',placeholder:'Briefly describe the activity. For repeat visits, use the same visitor reference.',send:'Send for approval',sending:'Sending…',sent:'Request submitted to your coordinator for approval.',history:'My requests',none:'No requests yet.',failed:'Could not load your requests.',duplicate:'This request has already been submitted.',error:'Unable to submit. Please check the details.',approved:'Approved',rejected:'Rejected',pending:'Pending',points:'points',rejectedReason:'Note:',labels:['Church cleaning','Evangelization','Brought a new or returning visitor (first time)','Brought the same visitor a second time that week','Brought the same visitor a third time that month']}
};
const types=[['limpeza_igreja',10],['evangelizacao',10],['alma_primeira',30],['alma_segunda_semana',15],['alma_terceira_mes',15]];
const tr=k=>i18n[lang()][k];
const style=document.createElement('style');style.textContent=`
#fju-requests-young[hidden]{display:none!important}
#fju-requests-young{margin:14px 0 22px;padding:20px;background:#fff;color:#233450;border:1px solid #d8e0ec;border-radius:18px;box-shadow:0 5px 18px #10214810}
#fju-requests-young h3{font-size:19px;margin:0 0 7px;color:#192d53}
#fju-requests-young p{font-size:13px;line-height:1.6;color:#53647e}
#fju-requests-young label{display:block;font-size:13px;font-weight:750;margin-top:10px}
#fju-requests-young select,#fju-requests-young input,#fju-requests-young textarea{font:inherit;display:block;width:100%;min-width:0;box-sizing:border-box;border:1px solid #bfcbdc;border-radius:9px;padding:12px;background:white;color:#1d3150;margin:6px 0}
#fju-requests-young textarea{min-height:82px;resize:vertical}
#fju-requests-young button{padding:11px 17px;border-radius:10px;border:0;background:#bd244b;color:white;font-weight:800;margin-top:10px}
#fju-requests-young button:disabled{opacity:.6}
#fju-requests-young ul{list-style:none;padding:0;margin:8px 0;display:grid;gap:8px;max-height:300px;overflow:auto}
#fju-requests-young li{padding:11px 12px;background:#f1f4fa;border-radius:10px;font-size:13px;overflow-wrap:anywhere}
#fju-requests-young .fju-req-top{display:flex;justify-content:space-between;gap:12px;font-weight:800}
#fju-requests-young .fju-req-meta{font-size:12px;color:#697791}
#fju-requests-young .fju-req-status{font-weight:850;color:#b12850}
`;document.head.appendChild(style);
function start(){
 const host=document.getElementById('fju-youth-dashboard');if(!host||document.getElementById('fju-requests-young'))return;
 const block=document.createElement('section');block.id='fju-requests-young';
 block.innerHTML=`<h3></h3><p class="fju-intro"></p><form><label class="fju-l-activity" for="fju-r-activity"></label><select id="fju-r-activity" required></select><label class="fju-l-date" for="fju-r-date"></label><input id="fju-r-date" type="date" required><label class="fju-l-detail" for="fju-r-detail"></label><textarea id="fju-r-detail" minlength="3" maxlength="220" required></textarea><button type="submit"></button><p class="fju-r-message" role="status" aria-live="polite"></p></form><h3 class="fju-hist-title"></h3><ul></ul>`;
 host.prepend(block);
 const title=block.querySelector('h3'),intro=block.querySelector('.fju-intro'),form=block.querySelector('form'),select=block.querySelector('select'),date=block.querySelector('input'),details=block.querySelector('textarea'),button=block.querySelector('button'),msg=block.querySelector('.fju-r-message'),historyTitle=block.querySelector('.fju-hist-title'),list=block.querySelector('ul');
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 date.max=today();date.value=today();
 function labels(){
  title.textContent=tr('title');intro.textContent=tr('explain');block.querySelector('.fju-l-activity').textContent=tr('activity');block.querySelector('.fju-l-date').textContent=tr('date');block.querySelector('.fju-l-detail').textContent=tr('detail');details.placeholder=tr('placeholder');button.textContent=tr('send');historyTitle.textContent=tr('history');
  const previous=select.value;select.replaceChildren();types.forEach(([key,score],idx)=>{const op=document.createElement('option');op.value=key;op.textContent=i18n[lang()].labels[idx]+' — +'+score;select.append(op)});if(previous)select.value=previous;
 }
 labels();
 const desc=(type)=>i18n[lang()].labels[Math.max(0,types.findIndex(x=>x[0]===type))]||type;
 function row(s){
  const li=document.createElement('li'),top=document.createElement('div'),activity=document.createElement('span'),state=document.createElement('span'),meta=document.createElement('div'),detailsLine=document.createElement('div');
  top.className='fju-req-top';activity.textContent=desc(s.atividade)+' · +'+s.pontos;state.className='fju-req-status';state.textContent=tr(s.status==='aprovada'?'approved':s.status==='rejeitada'?'rejected':'pending');top.append(activity,state);
  meta.className='fju-req-meta';meta.textContent=String(s.data_atividade||'');
  detailsLine.textContent=s.detalhe;li.append(top,meta,detailsLine);
  if(s.observacao_coordenador){const note=document.createElement('div');note.className='fju-req-meta';note.textContent=tr('rejectedReason')+' '+s.observacao_coordenador;li.append(note)}
  return li;
 }
 let loading=false;
 async function load(){if(loading)return;loading=true;
  try{const {data:{user}}=await db.auth.getUser();if(!user)return;
   const {data,error}=await db.rpc('fju_pontos_minhas_solicitacoes');if(error)throw error;
   list.replaceChildren();if(!data?.length){const li=document.createElement('li');li.textContent=tr('none');list.append(li)}else data.forEach(s=>list.append(row(s)));
  }catch(e){list.replaceChildren();const li=document.createElement('li');li.textContent=tr('failed');list.append(li)}finally{loading=false}
 }
 form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;button.textContent=tr('sending');msg.textContent='';
  try{const {error}=await db.rpc('fju_pontos_solicitar',{p_atividade:select.value,p_data_atividade:date.value,p_detalhe:details.value.trim()});
   if(error)throw error;msg.textContent=tr('sent');details.value='';await load();
  }catch(e){msg.textContent=e.message?.includes('solicitacao_duplicada')?tr('duplicate'):tr('error')}finally{button.disabled=false;button.textContent=tr('send')}
 });
 document.getElementById('language')?.addEventListener('change',()=>{labels();void load()});
 db.auth.onAuthStateChange(()=>setTimeout(()=>void load(),250));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load()});
 window.addEventListener('focus',()=>void load());
 setInterval(()=>{if(!document.hidden)void load()},20000);
 void load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
