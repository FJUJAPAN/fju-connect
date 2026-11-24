/* FJU JAPAN — aviso quando o servidor (Supabase) bloquear por limite de tráfego.
   O Supabase responde 402 quando o plano grátis passa do limite mensal. Em vez de telas
   quebradas, mostramos um aviso claro. Precisa carregar ANTES do Supabase (script comum no <head>). */
(function(){
 if(window.__fjuAvisoLimite)return; window.__fjuAvisoLimite=true;
 var TEXTOS={
  pt:{t:'Em breve novidades!!',m:'Aguarde',f:'Fechar'},
  ja:{t:'近日、新しいお知らせ！！',m:'お待ちください',f:'閉じる'},
  en:{t:'Exciting news coming soon!!',m:'Please wait',f:'Close'}
 };
 function idioma(){try{var v=(localStorage.getItem('fju_lang')||localStorage.getItem('fju_language')||document.documentElement.lang||'pt').toLowerCase();return v.indexOf('ja')===0?'ja':v.indexOf('en')===0?'en':'pt';}catch(e){return 'pt';}}
 var mostrado=false;
 function mostrar(){
  if(mostrado)return; mostrado=true;
  try{if(sessionStorage.getItem('fju-aviso-limite-fechado'))return;}catch(e){}
  var go=function(){
   var x=TEXTOS[idioma()];
   var box=document.createElement('div'); box.id='fju-aviso-limite'; box.setAttribute('role','status');
   box.style.cssText='position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:2147483000;max-width:520px;margin:0 auto;background:linear-gradient(135deg,#0b2a4f,#572551);color:#fff;border:1px solid #ffffff33;border-radius:18px;padding:18px 48px 18px 20px;text-align:center;box-shadow:0 14px 44px #0007;font:15px/1.5 system-ui,-apple-system,"Noto Sans JP",sans-serif';
   var t=document.createElement('strong'); t.textContent='✨ '+x.t+' ✨'; t.style.cssText='display:block;font-size:20px;font-weight:900;letter-spacing:.02em;margin-bottom:4px';
   var m=document.createElement('span'); m.textContent=x.m; m.style.cssText='display:block;color:#f8c6da;font-weight:700;letter-spacing:.08em';
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
