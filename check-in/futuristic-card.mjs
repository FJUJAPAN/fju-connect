// Compose original profile and church photos without background removal.
const portraits = new Map();
function deadline(promise, ms) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Portrait timeout')), ms); })]).finally(() => clearTimeout(timer));
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
async function makePortrait(url) { return { image: await loadPhoto(url) }; }
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
  const church = await loadPhoto('./' + encodeURIComponent(data.slug || '') + '.jpg');
  if (church) {
    const scale = Math.max(1080 / church.width, 1350 / church.height);
    x.drawImage(church, (1080 - church.width * scale) / 2, (1350 - church.height * scale) / 2, church.width * scale, church.height * scale);
  }
  const shade = x.createLinearGradient(0, 0, 0, 1350);
  shade.addColorStop(0, '#07132788'); shade.addColorStop(.55, '#07132744'); shade.addColorStop(.72, '#071327ed'); shade.addColorStop(1, '#071327fa');
  x.fillStyle = shade; x.fillRect(0, 0, 1080, 1350);
  const neon = (color, width = 4) => { x.strokeStyle = color; x.lineWidth = width; x.shadowColor = color; x.shadowBlur = 18; };
  x.save();
  x.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    neon(i === 1 ? '#ba42ff' : '#21e8ff', i === 1 ? 3 : 6);
    x.beginPath(); x.arc(540, 540, 300 + i * 14, .18 + i, 5.9 + i); x.stroke();
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
    const radius = 290, diameter = radius * 2;
    const scale = Math.max(diameter / person.image.width, diameter / person.image.height);
    x.save(); x.beginPath(); x.arc(540, 540, radius, 0, Math.PI * 2); x.clip();
    x.drawImage(person.image, 540 - person.image.width * scale / 2, 540 - person.image.height * scale / 2, person.image.width * scale, person.image.height * scale);
    x.restore();
  } else { text((data.name || 'FJU').slice(0, 1).toUpperCase(), 625, 200, '#9eeeff'); }
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
  c.dataset.portraitMode = person.image ? 'circle' : 'initial';
  return c;
}
