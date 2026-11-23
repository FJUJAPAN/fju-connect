import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
// Fotos retiradas a pedido em 23/11/2026. Não devem voltar ao site.
const RETIRADAS=['assets/img/28b2270b2eb0.webp',...['02','03','05','06','07','08','09'].map(n=>`eventos/fotos/teatro-mega-help-2026/${n}.webp`)];
test('fotos retiradas não existem mais no site',()=>{
 for(const f of RETIRADAS)assert.ok(!existsSync(new URL(f,root)),f);
});
test('nenhuma página aponta para as fotos retiradas',()=>{
 const files=execSync('git ls-files "*.html" "*.js" "*.css" "*.json"',{cwd:new URL('.',root)}).toString().trim().split('\n');
 for(const p of files){
  const t=readFileSync(new URL(p,root),'utf8');
  assert.doesNotMatch(t,/28b2270b2eb0/,p);
  assert.doesNotMatch(t,/teatro-mega-help-2026\/0[2356789]\.webp/,p);
 }
 const ev=readFileSync(new URL('eventos/index.html',root),'utf8');
 assert.match(ev,/MEGA_HELP_FOTOS=\['01','04','10'\]/);
});

test('scripts das páginas alteradas sem erro de sintaxe',async()=>{
 const {writeFileSync,unlinkSync}=await import('node:fs');
 const os=await import('node:os');const path=await import('node:path');
 for(const p of ['index.html','eventos/index.html']){
  const s=readFileSync(new URL(p,root),'utf8');
  const re=/<script(?![^>]*\bsrc=)(?![^>]*type="application\/(?:json|ld\+json)")([^>]*)>([\s\S]*?)<\/script>/g;
  let m,k=0;
  while((m=re.exec(s))){
   const f=path.join(os.tmpdir(),`fju-check-${k++}${/module/.test(m[1])?'.mjs':'.js'}`);
   writeFileSync(f,m[2]);
   try{execSync(`node --check "${f}"`,{stdio:'pipe'});}catch(e){assert.fail(`${p} script ${k}: ${e.stderr}`);}finally{unlinkSync(f);}
  }
 }
});
