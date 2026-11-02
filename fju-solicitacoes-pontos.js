import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const db=createClient('https://hmacroktklgwkofxsygv.supabase.co','sb_publishable_mdkfafhpqtthwzU8Hf7u9A_rErx3MFJ');
const lang=()=>{const v=(document.getElementById('language')?.value||localStorage.getItem('fju_lang')||document.documentElement.lang||'pt').toLowerCase();return v.startsWith('ja')?'ja':v.startsWith('en')?'en':'pt'};
const i18n={
pt:{title:'Solicitar pontos',explain:'Preencha sua atividade. Apenas seu coordenador poderá aprovar. Os pontos só entram no ranking depois da aprovação.',activity:'Atividade',date:'Dia da atividade',detail:'Detalhes para conferência (sem telefone ou dados pessoais de visitantes)',placeholder:'Descreva brevemente o que realizou. Para visitas repetidas, use a mesma referência da pessoa.',send:'Enviar para aprovação',sending:'Enviando…',sent:'Solicitação enviada ao coordenador. Aguardando aprovação.',history:'Minhas solicitações',none:'Nenhuma solicitação registrada.',failed:'Não foi possível carregar suas solicitações.',duplicate:'Essa solicitação já foi enviada.',error:'Não foi possível enviar. Confira os dados e tente novamente.',approved:'Aprovada',rejected:'Rejeitada',pending:'Pendente',points:'pontos',rejectedReason:'Observação:',personLabel:'Identificação da pessoa (use um código ou apelido, sem dados pessoais)',personPlaceholder:'Ex.: visitante A01',personIntro:'Use um código para cada pessoa. Para a 2ª e a 3ª visita, informe o código da primeira visita aprovada.',quantity:'Quantas pessoas novas ou afastadas trouxe?',personNth:'Identificação da pessoa',quantityInvalid:'Escolha de 1 a 50 pessoas.',codesDistinct:'Cada pessoa precisa ter seu próprio código, diferente dos demais.',multiSent:'Solicitações enviadas: ',partialSent:'Confira o histórico e solicite novamente apenas as pessoas restantes.',firstNeeded:'A primeira visita desta pessoa precisa estar aprovada e dentro do ciclo de um mês.',secondNeeded:'A segunda visita desta pessoa precisa estar aprovada antes da terceira.',labels:['Limpeza da igreja','Evangelização','Trouxe uma pessoa nova ou afastada (1ª vez)','Trouxe a mesma pessoa pela 2ª vez dentro de um mês da primeira visita','Trouxe a mesma pessoa pela 3ª vez dentro de um mês da primeira visita']},
ja:{title:'ポイント申請',explain:'活動を申請してください。所属教会の担当者が承認するとポイントがランキングに反映されます。',activity:'活動',date:'活動日',detail:'確認用メモ（訪問者の電話番号や個人情報は書かないでください）',placeholder:'活動内容を簡単に記入してください。再訪問は同じ識別名を使用してください。',send:'承認を申請',sending:'送信中…',sent:'申請を送信しました。承認待ちです。',history:'申請履歴',none:'申請履歴はありません。',failed:'申請履歴を読み込めませんでした。',duplicate:'同じ申請がすでに送信されています。',error:'送信できませんでした。入力内容をご確認ください。',approved:'承認済み',rejected:'却下',pending:'承認待ち',points:'点',rejectedReason:'備考:',personLabel:'来会者の識別名（個人情報は入力しないでください）',personPlaceholder:'例：来会者 A01',personIntro:'それぞれの来会者に異なるコードを使ってください。2回目・3回目は初回来会と同じコードを使います。',quantity:'新しい方・久しぶりに来た方を何人連れてきましたか？',personNth:'来会者コード',quantityInvalid:'1人から50人まで入力してください。',codesDistinct:'一人ずつ異なるコードを入力してください。',multiSent:'送信済み: ',partialSent:'申請履歴を確認し、未送信の方のみ再送信してください。',firstNeeded:'この人の初回来会が承認され、1か月以内である必要があります。',secondNeeded:'3回目の申請には、2回目の来会が先に承認されている必要があります。',labels:['教会の清掃','伝道活動','初めて来た人・戻ってきた人を連れてきた','初回来会から1か月以内に同じ人を2回目に連れてきた','初回来会から1か月以内に同じ人を3回目に連れてきた']},
en:{title:'Request points',explain:'Submit your activity. Only your church coordinator can approve it; points enter the rankings after approval.',activity:'Activity',date:'Activity date',detail:'Details for verification (no visitor phone numbers or personal information)',placeholder:'Briefly describe the activity. For repeat visits, use the same visitor reference.',send:'Send for approval',sending:'Sending…',sent:'Request submitted to your coordinator for approval.',history:'My requests',none:'No requests yet.',failed:'Could not load your requests.',duplicate:'This request has already been submitted.',error:'Unable to submit. Please check the details.',approved:'Approved',rejected:'Rejected',pending:'Pending',points:'points',rejectedReason:'Note:',personLabel:'Visitor identifier (use a code, not personal details)',personPlaceholder:'e.g. visitor A01',personIntro:'Use a unique code for each visitor. For second and third visits, reuse the original approved code.',quantity:'How many new or returning visitors did you bring?',personNth:'Visitor identifier',quantityInvalid:'Choose between 1 and 50 visitors.',codesDistinct:'Each visitor needs a different identifier.',multiSent:'Requests sent: ',partialSent:'Review history and submit only those not yet requested.',firstNeeded:'The first visit must already be approved and within the one-month cycle.',secondNeeded:'The second visit must be approved before requesting the third.',labels:['Church cleaning','Evangelization','Brought a new or returning visitor (first time)','Brought the same visitor a second time within one month of the first visit','Brought the same visitor a third time within one month of the first visit']}
};
const types=[['limpeza_igreja',10],['evangelizacao',20],['alma_primeira',30],['alma_segunda_mes',15],['alma_terceira_mes',15]];
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
 block.innerHTML=`<h3></h3><p class="fju-intro"></p><form><label class="fju-l-activity" for="fju-r-activity"></label><select id="fju-r-activity" required></select><label class="fju-l-date" for="fju-r-date"></label><input id="fju-r-date" type="date" required><div class="fju-person-fields" hidden><div class="fju-person-count" hidden><label class="fju-l-count" for="fju-r-count"></label><input id="fju-r-count" type="number" min="1" max="50" step="1" value="1" inputmode="numeric"></div><label class="fju-l-person" for="fju-r-person"></label><input id="fju-r-person" type="text" minlength="2" maxlength="50" autocomplete="off"><p class="fju-person-hint"></p><div class="fju-extra-persons"></div></div><label class="fju-l-detail" for="fju-r-detail"></label><textarea id="fju-r-detail" minlength="3" maxlength="220" required></textarea><button type="submit"></button><p class="fju-r-message" role="status" aria-live="polite"></p></form><h3 class="fju-hist-title"></h3><ul></ul>`;
 host.prepend(block);
 const title=block.querySelector('h3'),intro=block.querySelector('.fju-intro'),form=block.querySelector('form'),select=block.querySelector('select'),date=block.querySelector('input'),details=block.querySelector('textarea'),button=block.querySelector('button'),msg=block.querySelector('.fju-r-message'),historyTitle=block.querySelector('.fju-hist-title'),list=block.querySelector('ul');
 const personFields=block.querySelector('.fju-person-fields'),person=block.querySelector('#fju-r-person'),personHint=block.querySelector('.fju-person-hint'),countBox=block.querySelector('.fju-person-count'),countInput=block.querySelector('#fju-r-count'),extraPersons=block.querySelector('.fju-extra-persons');
 let approvedVisits=[];
 const oneMonthLater=(dateText)=>{const [y,m,d]=dateText.split('-').map(Number);const last=new Date(y,m+1,0).getDate();const next=new Date(y,m,Math.min(d,last));return [next.getFullYear(),String(next.getMonth()+1).padStart(2,'0'),String(next.getDate()).padStart(2,'0')].join('-')};
 const approvedFirst=()=>{const key=person.value.trim().toLocaleLowerCase();return key?approvedVisits.find(v=>String(v.referencia_pessoa||'').trim().toLocaleLowerCase()===key&&v.primeira_data<=date.value&&date.value<oneMonthLater(v.primeira_data)):null};
 function updatePerson(){const choice=select.value,visitor=choice.startsWith('alma_');personFields.hidden=!visitor;person.required=visitor;personFields.querySelector('.fju-l-person').textContent=tr('personLabel');person.placeholder=tr('personPlaceholder');personHint.textContent=tr('personIntro');const first=approvedFirst();const second=select.querySelector('option[value="alma_segunda_mes"]'),third=select.querySelector('option[value="alma_terceira_mes"]');if(second)second.disabled=!first;if(third)third.disabled=!(first&&first.segunda_data&&first.segunda_data<=date.value)}
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 date.max=today();date.value=today();
 function labels(){
  title.textContent=tr('title');intro.textContent=tr('explain');block.querySelector('.fju-l-activity').textContent=tr('activity');block.querySelector('.fju-l-date').textContent=tr('date');block.querySelector('.fju-l-detail').textContent=tr('detail');details.placeholder=tr('placeholder');button.textContent=tr('send');historyTitle.textContent=tr('history');
  const previous=select.value;select.replaceChildren();types.forEach(([key,score],idx)=>{const op=document.createElement('option');op.value=key;op.textContent=i18n[lang()].labels[idx]+' — +'+score;select.append(op)});if(previous)select.value=previous;updatePerson();
 }
 labels();
 select.addEventListener('change',updatePerson);person.addEventListener('input',updatePerson);date.addEventListener('change',updatePerson);
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
   const {data:visits,error:visitsError}=await db.rpc('fju_pontos_minhas_visitas');if(!visitsError){approvedVisits=visits||[];updatePerson()}
   list.replaceChildren();if(!data?.length){const li=document.createElement('li');li.textContent=tr('none');list.append(li)}else data.forEach(s=>list.append(row(s)));
  }catch(e){list.replaceChildren();const li=document.createElement('li');li.textContent=tr('failed');list.append(li)}finally{loading=false}
 }
 form.addEventListener('submit',async e=>{e.preventDefault();button.disabled=true;button.textContent=tr('sending');msg.textContent='';
  try{const isVisit=select.value.startsWith('alma_'),first=approvedFirst();if(isVisit&&select.value!=='alma_primeira'&&!first){msg.textContent=tr('firstNeeded');return}if(select.value==='alma_terceira_mes'&&(!first?.segunda_data||first.segunda_data>date.value)){msg.textContent=tr('secondNeeded');return}
   const {error}=await db.rpc('fju_pontos_solicitar',{p_atividade:select.value,p_data_atividade:date.value,p_detalhe:details.value.trim(),p_referencia_pessoa:isVisit?person.value.trim():null});
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
