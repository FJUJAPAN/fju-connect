import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitInside, loadPhoto} from '../check-in/futuristic-card.mjs';
test('portrait framing preserves aspect ratio and fits both landscape couples and portraits', () => {
 for(const [w,h] of [[640,428],[480,640],[640,360],[640,640]]){
 const fit=fitInside(w,h,900,670);assert.ok(fit.width<=900);assert.ok(fit.height<=670);assert.ok(Math.abs(fit.width/fit.height-w/h)<1e-9);
 }
});
test('missing profile image resolves without loading the segmentation model', async()=>assert.equal(await loadPhoto(''),null));
test('visual integration preserves GPS validation and confirmed check-in flow',()=>{
 const s=readFileSync(new URL('../check-in/index.html',import.meta.url),'utf8');
 assert.match(s,/if\(!record\)throw Error\('Registro não confirmado'\)/);
 assert.match(s,/nearest.distance\+accuracy>100/);
 assert.match(s,/accuracy>50/);
 assert.match(s,/await profileReady;await setupNationalPreview/);
 assert.match(s,/if\(!cardData\)return null;return futuristicCard\(cardData\)/);
});
