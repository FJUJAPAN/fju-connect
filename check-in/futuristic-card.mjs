// Photo pixels stay on this device. MediaPipe supplies only an alpha mask.
const MODEL_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/';
let library;
const portraits = new Map();
function deadline(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Portrait timeout')), ms); })]).finally(() => clearTimeout(timer));
}
function loadLibrary() {
  return library ||= deadline(new Promise((resolve, reject) => {
    if (globalThis.SelfieSegmentation) return resolve();
    const script = document.createElement('script');
    script.src = MODEL_BASE + 'selfie_segmentation.js';
    script.crossOrigin = 'anonymous'; script.onload = resolve; script.onerror = reject;
    document.head.append(script);
  }), 12000);
}
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function fitInside(w, h, boxW, boxH) {
  const scale = Math.min(boxW / w, boxH / h);
  return { width: w * scale, height: h * scale };
}
export function loadPhoto(url) {
  if (!url) return Promise.resolve(null);
  return deadline(new Promise(resolve => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im); im.onerror = () => resolve(null); im.src = url;
  }), 10000).catch(() => null);
}
async function makePortrait(url) {
  const photo = await loadPhoto(url);
  if (!photo) return { image: null, cutout: false };
  let model;
  try {
    const probe = canvas(1, 1);
    const gl = probe.getContext('webgl2');
    if (!gl) throw Error('WebGL2 unavailable');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    await loadLibrary();
    const size = fitInside(photo.width, photo.height, 1000, 1000);
    const input = canvas(Math.max(1, Math.round(size.width)), Math.max(1, Math.round(size.height)));
    input.getContext('2d').drawImage(photo, 0, 0, input.width, input.height);
    model = new globalThis.SelfieSegmentation({ locateFile: file => MODEL_BASE + file });
    model.setOptions({ modelSelection: 0, selfieMode: false });
    let output;
    model.onResults(result => {
      const mask = canvas(input.width, input.height), ctx = mask.getContext('2d');
      ctx.drawImage(result.segmentationMask, 0, 0, mask.width, mask.height);
      const pixels = ctx.getImageData(0, 0, mask.width, mask.height);
      let count = 0;
      for (let i = 0; i < pixels.data.length; i += 4) {
        const confidence = pixels.data[i] / 255;
        const alpha = Math.max(0, Math.min(1, (confidence - .15) / .7));
        pixels.data[i + 3] = Math.round(alpha * 255);
        if (alpha > .5) count++;
      }
      // An empty mask must never replace the person's original photo.
      if (count < mask.width * mask.height * .025) throw Error('Empty portrait mask');
      ctx.putImageData(pixels, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(input, 0, 0);
      output = mask;
    });
    await deadline(model.send({ image: input }), 18000);
    if (!output) throw Error('No portrait result');
    return { image: output, cutout: true };
  } catch (_) {
    return { image: photo, cutout: false };
  } finally { if (model) { try { Promise.resolve(model.close()).catch(() => {}); } catch (_) {} } }
}
export function portrait(url) {
  if (!portraits.has(url)) {
    if (portraits.size >= 4) portraits.delete(portraits.keys().next().value);
    portraits.set(url, makePortrait(url));
  }
  return portraits.get(url);
}
export async function futuristicCard(data) {
  const c = canvas(1080, 1350), x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, '#091a36'); bg.addColorStop(.6, '#070c20'); bg.addColorStop(1, '#170b32');
  x.fillStyle = bg; x.fillRect(0, 0, 1080, 1350);
  const neon = (color, width = 4) => { x.strokeStyle = color; x.lineWidth = width; x.shadowColor = color; x.shadowBlur = 18; };
  x.save();
  for (let i = 0; i < 28; i++) {
    x.globalAlpha = .12; neon(i % 2 ? '#ab49ff' : '#26eaff', 1);
    x.beginPath(); x.moveTo(i * 65 - 700, 1100); x.lineTo(i * 65 + 500, 100); x.stroke();
  }
  x.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    neon(i === 1 ? '#ba42ff' : '#21e8ff', i === 1 ? 3 : 6);
    x.beginPath(); x.arc(540, 540, 330 + i * 22, .18 + i, 5.9 + i); x.stroke();
  }
  neon('#40eaff'); x.beginPath();
  x.moveTo(80, 24); x.lineTo(1000, 24); x.lineTo(1056, 80); x.lineTo(1056, 1270); x.lineTo(1000, 1326); x.lineTo(80, 1326); x.lineTo(24, 1270); x.lineTo(24, 80); x.closePath(); x.stroke();
  neon('#bb40ff', 3); x.strokeRect(38, 38, 1004, 1274); x.restore();
  const text = (value, y, size, color = '#fff', max = 920) => {
    x.fillStyle = color; x.textAlign = 'center'; x.font = `900 ${size}px system-ui, sans-serif`;
    x.fillText(String(value || ''), 540, y, max);
  };
  text('FJU CONNECT', 120, 70); text('J A P A N', 168, 25, '#9eeeff');
  const person = await portrait(data.avatar || '');
  if (person.image) {
    const size = fitInside(person.image.width, person.image.height, 900, 670);
    x.save(); x.beginPath(); x.roundRect(90, 205, 900, 680, 24); x.clip();
    x.drawImage(person.image, (1080 - size.width) / 2, 205 + (670 - size.height), size.width, size.height);
    x.restore();
  } else { text((data.name || 'FJU').slice(0, 1).toUpperCase(), 625, 200, '#9eeeff'); }
  const fade = x.createLinearGradient(0, 780, 0, 915); fade.addColorStop(0, '#080d2100'); fade.addColorStop(1, '#080d21');
  x.fillStyle = fade; x.fillRect(60, 780, 960, 135);
  text(data.name, 920, 45); text(data.church, 963, 29, '#bfcbeb');
  const label = {pt: 'CHECK-IN CONFIRMADO', ja: 'チェックイン完了', en: 'CHECK-IN CONFIRMED'}[data.lng] || 'CHECK-IN CONFIRMADO';
  text('✓ ' + label, 1048, data.lng === 'ja' ? 52 : 47, '#63efff');
  text('MULTIPLICANDO TALENTO', 1100, 23, '#e2bdff');
  if (data.verse) {
    text(data.verse[data.lng === 'ja' ? 2 : data.lng === 'en' ? 3 : 1], 1170, 24, '#d3dced');
    text(data.verse[0], 1206, 22, '#a7b7d4');
  }
  text(data.date, 1273, 23, '#c4d3ea');
  if (data.test) {
    x.save(); x.translate(540, 600); x.rotate(-.3);
    x.fillStyle = '#fa4264'; x.textAlign = 'center'; x.font = '900 85px system-ui'; x.fillText('MODO TESTE', 0, 0);
    x.font = 'bold 29px system-ui'; x.fillText('NÃO REGISTRA PRESENÇA', 0, 48); x.restore();
  }
  c.dataset.portraitMode = person.cutout ? 'cutout' : person.image ? 'original' : 'initial';
  return c;
}
