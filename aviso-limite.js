/* FJU JAPAN — aviso quando o servidor (Supabase) bloquear por limite de tráfego.
   O Supabase responde 402 quando o plano grátis passa do limite mensal. Em vez de telas
   quebradas, mostramos um aviso claro. Precisa carregar ANTES do Supabase (script comum no <head>). */
(function(){
 if(window.__fjuAvisoLimite)return; window.__fjuAvisoLimite=true;
 var TEXTOS={
  pt:{t:'Sistema temporariamente indisponível',m:'O servidor da FJU atingiu o limite mensal de uso. Login, My Page, painel, ranking e fotos voltam automaticamente quando o novo ciclo começar (dia 15). O site público continua funcionando.',f:'Fechar aviso'},
  ja:{t:'システム一時停止中',m:'FJUサーバーの月間利用上限に達しました。ログイン、マイページ、管理画面、ランキング、写真は新しい利用期間の開始日（15日）に自動で再開します。公開サイトは引き続きご覧いただけます。',f:'閉じる'},
  en:{t:'System temporarily unavailable',m:'The FJU server reached its monthly usage limit. Login, My Page, the admin panel, ranking and photos come back automatically when the new cycle starts (on the 15th). The public site keeps working.',f:'Close notice'}
 };
 function idioma(){try{var v=(localStorage.getItem('fju_lang')||localStorage.getItem('fju_language')||document.documentElement.lang||'pt').toLowerCase();return v.indexOf('ja')===0?'ja':v.indexOf('en')===0?'en':'pt';}catch(e){return 'pt';}}
 var mostrado=false;
 function mostrar(){
  if(mostrado)return; mostrado=true;
  try{if(sessionStorage.getItem('fju-aviso-limite-fechado'))return;}catch(e){}
  var go=function(){
   var x=TEXTOS[idioma()];
   var box=document.createElement('div'); box.id='fju-aviso-limite'; box.setAttribute('role','alert');
   box.style.cssText='position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:2147483000;max-width:640px;margin:0 auto;background:#3b1219;color:#fff;border:1px solid #f0a33a;border-left:6px solid #f0a33a;border-radius:14px;padding:14px 44px 14px 16px;box-shadow:0 12px 40px #0008;font:14px/1.5 system-ui,-apple-system,"Noto Sans JP",sans-serif';
   var t=document.createElement('strong'); t.textContent='⚠️ '+x.t; t.style.cssText='display:block;font-size:15px;margin-bottom:4px';
   var m=document.createElement('span'); m.textContent=x.m;
   var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',x.f); b.textContent='×';
   b.style.cssText='position:absolute;top:8px;right:10px;width:30px;height:30px;border:0;border-radius:50%;background:#ffffff1f;color:#fff;font:700 18px/1 system-ui;cursor:pointer';
   b.onclick=function(){box.remove();try{sessionStorage.setItem('fju-aviso-limite-fechado','1');}catch(e){}};
   box.append(t,m,b); document.body.append(box);
  };
  if(document.body)go(); else document.addEventListener('DOMContentLoaded',go,{once:true});
 }
 window.fjuMostrarAvisoLimite=mostrar;
 var original=window.fetch;
 if(typeof original==='function'){
  window.fetch=function(entrada){
   var url=typeof entrada==='string'?entrada:(entrada&&entrada.url)||'';
   return original.apply(this,arguments).then(function(r){
    if(r&&r.status===402&&/\.supabase\.co\//.test(url))mostrar();
    return r;
   });
  };
 }
})();
