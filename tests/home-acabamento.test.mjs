import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const home=readFileSync(new URL('index.html',root),'utf8');

test('sem textos provisórios visíveis na home',()=>{
 assert.doesNotMatch(home,/class="project-note"/);
 assert.doesNotMatch(home,/id="editorToggle"/);
});

test('numeração das seções em sequência, sem repetir',()=>{
 const nums=[...home.matchAll(/<span class="kicker">(\d\d) \//g)].map(m=>m[1]);
 const visiveis=nums.slice(0,6);
 assert.deepEqual(visiveis,['01','02','03','04','05','06']);
});

test('todas as fontes têm reserva sans-serif',()=>{
 const semReserva=[...home.matchAll(/font(?:-family)?:[^;}"<>]*'(?:Space Grotesk|DM Sans|Noto Sans JP)'[^;}"<>]*/g)].map(m=>m[0]).filter(d=>!/serif/.test(d));
 assert.deepEqual(semReserva,[]);
});

test('prévia de compartilhamento completa',()=>{
 for(const p of ['og:title','og:description','og:image','og:url'])assert.match(home,new RegExp(`property="${p}"`));
 assert.ok(existsSync(new URL('assets/og-fju-japan.jpg',root)));
});

test('zoom travado de propósito, para a home funcionar como app',()=>{
 assert.match(home,/maximum-scale=1, user-scalable=no/);
});
