export function cardTheme(rank) {
  const key = String(rank || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const group = {eventual:'blue',normal:'blue',inconstante:'blue',firme:'green',cpo:'red',colaborador:'red',voluntario:'red',obreiro:'gold',coordenador:'gold'}[key] || 'neutral';
  return {key:group, ...{
    blue:{accent:'#29b6f6',dark:'#061d38',banner:'#f4f8ff',ink:'#061d38'},
    green:{accent:'#00bd47',dark:'#07140e',banner:'#009b39',ink:'#ffffff'},
    red:{accent:'#ec1836',dark:'#16090d',banner:'#cf1230',ink:'#ffffff'},
    gold:{accent:'#eab747',dark:'#191309',banner:'#b98523',ink:'#ffffff'},
    neutral:{accent:'#b8c4d5',dark:'#101723',banner:'#344255',ink:'#ffffff'}
  }[group]};
}
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
  const theme = cardTheme(data.rank);
  const c = canvas(1080, 1350), x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, theme.dark); bg.addColorStop(1, '#050609');
  x.fillStyle = bg; x.fillRect(0, 0, 1080, 1350);
  const church = await loadPhoto('./' + encodeURIComponent(data.slug || '') + '.jpg');
  if (church) {
    const scale = Math.max(1080 / church.width, 1350 / church.height);
    x.drawImage(church, (1080 - church.width * scale) / 2, (1350 - church.height * scale) / 2, church.width * scale, church.height * scale);
  }
  const shade = x.createLinearGradient(0, 0, 0, 1350);
  shade.addColorStop(0, theme.dark + 'd9'); shade.addColorStop(.40, theme.dark + '22'); shade.addColorStop(.65, theme.dark + 'dd'); shade.addColorStop(1, theme.dark);
  x.fillStyle = shade; x.fillRect(0, 0, 1080, 1350);
  x.save();
  x.strokeStyle=theme.accent; x.lineWidth=12; x.beginPath(); x.roundRect(20,20,1040,1310,16); x.stroke();
  x.fillStyle=theme.accent;
  for (const points of [[[26,26],[180,26],[26,180]],[[1054,1324],[900,1324],[1054,1170]]]) {
    x.beginPath(); points.forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py));x.closePath();x.fill();
  }
  x.strokeStyle='#ffffff';x.lineWidth=8;x.beginPath();x.arc(540,540,296,0,Math.PI*2);x.stroke();
  x.restore();
  const text = (value, y, size, color = '#fff', max = 920) => {
    x.fillStyle = color; x.textAlign = 'center'; x.font = `900 ${size}px system-ui, sans-serif`;
    x.fillText(String(value || ''), 540, y, max);
  };
  text('FJU CONNECT', 120, 70); text('J A P A N', 168, 25, theme.accent);
  const person = await portrait(data.avatar || '');
  if (person.image) {
    const radius = 290, diameter = radius * 2;
    const scale = Math.max(diameter / person.image.width, diameter / person.image.height);
    x.save(); x.beginPath(); x.arc(540, 540, radius, 0, Math.PI * 2); x.clip();
    x.drawImage(person.image, 540 - person.image.width * scale / 2, 540 - person.image.height * scale / 2, person.image.width * scale, person.image.height * scale);
    x.restore();
  } else { text((data.name || 'FJU').slice(0, 1).toUpperCase(), 625, 200, theme.accent); }
  text(data.name, 920, 45); text(data.church, 963, 29, '#bfcbeb');
  const label = {pt: 'CHECK-IN CONFIRMADO', ja: 'チェックイン完了', en: 'CHECK-IN CONFIRMED'}[data.lng] || 'CHECK-IN CONFIRMADO';
  x.fillStyle=theme.banner;x.beginPath();x.moveTo(110,995);x.lineTo(990,995);x.lineTo(950,1080);x.lineTo(70,1080);x.closePath();x.fill();
  text('✓ ' + label, 1050, data.lng === 'ja' ? 52 : 47, theme.ink, 820);
  text('MULTIPLICANDO TALENTO', 1100, 23, '#ffffff');
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
