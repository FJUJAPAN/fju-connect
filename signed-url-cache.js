/* FJU JAPAN — links de fotos privadas reaproveitados no aparelho.
   Antes, cada exibição gerava um link novo (válido 5–30 min), e o celular baixava a
   mesma foto de novo toda vez, estourando o limite de tráfego (egress) do Supabase.
   Agora o link vale 7 dias e fica guardado no aparelho por 6 dias: o navegador
   reaproveita a foto que já baixou. Uso: fjuSignedUrl(cliente, bucket, caminho)
   devolve {data:{signedUrl}, error} (mesmo formato do Supabase). */
(function(){
 if(window.fjuSignedUrl)return;
 var VALIDADE=7*24*3600, GUARDA=6*24*3600*1000, PREFIXO='fju-surl:';
 var memoria=new Map();
 function chave(bucket,caminho){return PREFIXO+bucket+':'+caminho;}
 function ler(k){
  var m=memoria.get(k); if(m&&m.e>Date.now())return m.u;
  try{var c=JSON.parse(localStorage.getItem(k)||'null');if(c&&c.u&&c.e>Date.now()){memoria.set(k,c);return c.u;}}catch(e){}
  return '';
 }
 function gravar(k,u){var c={u:u,e:Date.now()+GUARDA};memoria.set(k,c);try{localStorage.setItem(k,JSON.stringify(c));}catch(e){}}
 window.fjuSignedUrl=function(cliente,bucket,caminho){
  if(!caminho)return Promise.resolve({data:null,error:new Error('sem caminho')});
  var k=chave(bucket,caminho), pronto=ler(k);
  if(pronto)return Promise.resolve({data:{signedUrl:pronto},error:null});
  return cliente.storage.from(bucket).createSignedUrl(caminho,VALIDADE).then(function(r){
   if(r&&!r.error&&r.data&&r.data.signedUrl)gravar(k,r.data.signedUrl);
   return r;
  });
 };
 window.fjuSignedUrlGuardar=function(id,url){if(url)gravar(PREFIXO+'id:'+id,url);};
 window.fjuSignedUrlLer=function(id){return ler(PREFIXO+'id:'+id);};
 window.fjuSignedUrlEsquecer=function(bucket,caminho){var k=caminho==null?PREFIXO+'id:'+bucket:chave(bucket,caminho);memoria.delete(k);try{localStorage.removeItem(k);}catch(e){}};
})();
