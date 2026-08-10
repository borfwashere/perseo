const upload = document.getElementById('upload');
const cutBtn = document.getElementById('cut');
const cutsInput = document.getElementById('cuts-input');
const cutsDown = document.getElementById('cuts-down');
const cutsUp = document.getElementById('cuts-up');
const rotateBtn = document.getElementById('rotate-btn');
const awareBtn = document.getElementById('aware-btn');
const arBtn = document.getElementById('ar-btn');
const cropBtn = document.getElementById('crop-btn');
const effectSel = document.getElementById('effect');
const bgColorInput = document.getElementById('bg-color');
const padSlider = document.getElementById('pad-slider');
const padVal = document.getElementById('pad-val');
const titleSlider = document.getElementById('title-slider');
const titleVal = document.getElementById('title-val');
const strokeBtn = document.getElementById('stroke');
const gridBtn = document.getElementById('grid-btn');
const sheetBtn = document.getElementById('sheet');
const downloadBtn = document.getElementById('download');
const srcSaveBtn = document.getElementById('src-save');
const sheetSaveBtn = document.getElementById('sheet-save');
const seedInput = document.getElementById('seed-input');
const sourceWrap = document.getElementById('source-wrap');
const resultWrap = document.getElementById('result-wrap');
const modal = document.getElementById('modal');
const modalBg = document.querySelector('#modal .modal-bg');
const modalClose = document.getElementById('modal-close');
const sheetContent = document.getElementById('sheet-content');
const sheetInfo = document.getElementById('sheet-info');
const previewModal = document.getElementById('preview-modal');
const previewImg = document.getElementById('preview-img');
const previewSaveBtn = document.getElementById('preview-save');
const previewCloseBtn = document.getElementById('preview-close');
const previewBg = previewModal.querySelector('.modal-bg');
const toast = document.getElementById('toast');
const tabBtns = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const tabTools = document.querySelectorAll('.tab-tools');
function setTab(name) {
  tabBtns.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  tabTools.forEach((tt) => tt.classList.toggle('active', tt.dataset.for === name));
}

tabBtns.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
setTab('source');

function fitCanvases() {
  const bar = document.querySelector('.tab-bar');
  if (!bar) return;
  const tabBottom = bar.getBoundingClientRect().bottom;
  const available = Math.max(120, window.innerHeight - tabBottom - 24);
  document.documentElement.style.setProperty('--canvas-max-h', available + 'px');
}
fitCanvases();
window.addEventListener('resize', fitCanvases);
new ResizeObserver(fitCanvases).observe(document.querySelector('header'));

let image = null;
let cells = [];
let srcCanvas = null;
let effectCanvas = null;
let effectName = 'none';
let srcW = 0;
let srcH = 0;
let lastResult = null;
let resultState = null;
let resultStroke = true;
let gridOn = true;
let rotateOn = false;
let awareOn = false;
let aspectRatio = '4:5';
let cropOn = false;
let paddingPct = parseInt(padSlider.value, 10);
let titlePct = parseInt(titleSlider.value, 10);
let paperBg = bgColorInput.value;
let currentSeed = makeSeed();
let previewSource = null;
upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    image = img;
    cutBtn.disabled = false;
    sheetBtn.disabled = false;
    strokeBtn.disabled = false;
    gridBtn.disabled = false;
    srcSaveBtn.disabled = false;
    rebuild(false);
  };
  img.src = URL.createObjectURL(file);
});

cutBtn.addEventListener('click', () => {
  rebuild(true);
  setTab('result');
});

function bumpCuts(delta) {
  const min = +cutsInput.min || 2;
  const max = +cutsInput.max || 200;
  const next = Math.min(max, Math.max(min, (+cutsInput.value || 20) + delta));
  if (next === +cutsInput.value) return;
  cutsInput.value = next;
  if (image) rebuild(false);
}

cutsDown.addEventListener('click', () => bumpCuts(-1));
cutsUp.addEventListener('click', () => bumpCuts(1));
cutsInput.addEventListener('change', () => {
  const min = +cutsInput.min || 2;
  const max = +cutsInput.max || 200;
  let v = parseInt(cutsInput.value, 10);
  if (isNaN(v)) v = 20;
  v = Math.min(max, Math.max(min, v));
  cutsInput.value = v;
  if (image) rebuild(false);
});

strokeBtn.addEventListener('click', () => {
  resultStroke = !resultStroke;
  strokeBtn.textContent = 'stroke: ' + (resultStroke ? 'on' : 'off');
  strokeBtn.classList.toggle('active', resultStroke);
  drawResultCanvas();
});
strokeBtn.classList.add('active');

gridBtn.addEventListener('click', () => {
  gridOn = !gridOn;
  gridBtn.textContent = 'grid: ' + (gridOn ? 'on' : 'off');
  gridBtn.classList.toggle('active', gridOn);
  drawResultCanvas();
});

bindToggle(rotateBtn, () => rotateOn, (v) => { rotateOn = v; }, 'rotate', () => { if (image) rebuild(false); });
bindToggle(awareBtn, () => awareOn, (v) => { awareOn = v; }, 'aware', () => { if (image) rebuild(false); });
bindToggle(cropBtn, () => cropOn, (v) => { cropOn = v; }, 'crop', () => {});

const AR_CYCLE = ['none', 'a4', '4:5'];
function arLabel(v) { return v === 'none' ? 'off' : v; }
arBtn.textContent = 'ar: ' + arLabel(aspectRatio);
arBtn.classList.toggle('active', aspectRatio !== 'none');
arBtn.addEventListener('click', () => {
  const i = AR_CYCLE.indexOf(aspectRatio);
  aspectRatio = AR_CYCLE[(i + 1) % AR_CYCLE.length];
  arBtn.textContent = 'ar: ' + arLabel(aspectRatio);
  arBtn.classList.toggle('active', aspectRatio !== 'none');
  if (image) drawResultCanvas();
});
function bindToggle(btn, get, set, name, onChange) {
  btn.textContent = name + ': ' + (get() ? 'on' : 'off');
  btn.classList.toggle('active', get());
  btn.addEventListener('click', () => {
    set(!get());
    btn.textContent = name + ': ' + (get() ? 'on' : 'off');
    btn.classList.toggle('active', get());
    onChange();
  });
}

effectSel.addEventListener('change', () => {
  effectName = effectSel.value;
  if (!image) return;
  applyEffect();
  renderSource();
  drawResultCanvas();
});

bgColorInput.addEventListener('input', () => {
  paperBg = bgColorInput.value;
  if (image) drawResultCanvas();
  sheetContent.style.background = paperBg;
});

padSlider.addEventListener('input', () => {
  paddingPct = parseInt(padSlider.value, 10);
  padVal.textContent = paddingPct + '%';
  if (image) drawResultCanvas(true);
});

titleSlider.addEventListener('input', () => {
  titlePct = parseInt(titleSlider.value, 10);
  titleVal.textContent = titlePct + '%';
  if (image) drawResultCanvas(true);
});

padVal.textContent = paddingPct + '%';
titleVal.textContent = titlePct + '%';

sheetBtn.addEventListener('click', openSheet);
modalClose.addEventListener('click', closeSheet);
modalBg.addEventListener('click', closeSheet);

sourceWrap.addEventListener('click', () => {
  if (!image || !srcCanvas || sourceWrap.classList.contains('empty')) return;
  openPreview('source', composeSource());
});
resultWrap.addEventListener('click', () => {
  if (!lastResult || resultWrap.classList.contains('empty')) return;
  openPreview('result', cropOn ? composeWithCropMarks(lastResult) : lastResult);
});
previewCloseBtn.addEventListener('click', closePreview);
previewBg.addEventListener('click', closePreview);
previewSaveBtn.addEventListener('click', () => {
  if (!previewSource) return;
  downloadCanvas(previewSource.canvas, fileName(previewSource.type));
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!previewModal.classList.contains('hidden')) closePreview();
  else if (!modal.classList.contains('hidden')) closeSheet();
});

downloadBtn.addEventListener('click', () => {
  if (!lastResult) return;
  const out = cropOn ? composeWithCropMarks(lastResult) : lastResult;
  downloadCanvas(out, fileName('result'));
});

srcSaveBtn.addEventListener('click', () => {
  if (!srcCanvas) return;
  downloadCanvas(composeSource(), fileName('source'));
});

sheetSaveBtn.addEventListener('click', () => {
  if (!cells.length || !image) return;
  const sheet = composeSheet();
  const out = cropOn ? composeWithCropMarks(sheet, true) : sheet;
  downloadCanvas(out, fileName('sheet'));
});

seedInput.addEventListener('focus', () => seedInput.select());
seedInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') seedInput.blur();
});
seedInput.addEventListener('change', () => {
  const s = seedInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z0-9]{6}$/.test(s)) {
    if (s !== currentSeed) {
      currentSeed = s;
      if (image) rebuild(false);
    }
    updateSeedUi();
  } else {
    showToast('seed must be 6 letters/digits');
    updateSeedUi();
  }
});

function downloadCanvas(canvas, name) {
  const a = document.createElement('a');
  a.download = name;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function fileName(kind) {
  return 'cut-' + kind + '-' + makeSeed() + '.png';
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 1800);
}
function makeSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function seedToNum(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 36 + parseInt(s[i], 36)) >>> 0;
  return n || 1;
}

function rngFromSeed(s, salt) {
  return mulberry32(seedToNum(s) ^ salt);
}

function mulberry32(s) {
  let a = s >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad2(n) { return String(n).padStart(2, '0'); }

function rebuild(newSeed) {
  if (!image) return;
  if (newSeed) currentSeed = makeSeed();
  updateSeedUi();

  const srcTarget = 1000;
  const r = image.width / image.height;
  srcW = r >= 1 ? srcTarget : Math.round(srcTarget * r);
  srcH = r >= 1 ? Math.round(srcTarget / r) : srcTarget;

  srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  srcCanvas.getContext('2d').drawImage(image, 0, 0, srcW, srcH);
  applyEffect();

  const cutsTarget = Math.max(2, parseInt(cutsInput.value, 10) || 20);
  const gridRng = rngFromSeed(currentSeed, 0x1111);
  cells = generateGrid(srcW, srcH, cutsTarget, gridRng);
  cells.forEach((c, i) => (c.id = i));
  renderSource();
  computeResultState();
  drawResultCanvas();
}
function updateSeedUi() {
  seedInput.value = currentSeed;
}

function renderSource() {
  sourceWrap.classList.remove('empty');
  sourceWrap.innerHTML = '';
  sourceWrap.style.minHeight = '0';

  const frame = document.createElement('div');
  frame.className = 'frame';

  const canvas = document.createElement('canvas');
  canvas.width = srcW;
  canvas.height = srcH;
  canvas.getContext('2d').drawImage(effectCanvas || srcCanvas, 0, 0);
  frame.appendChild(canvas);

  const overlay = document.createElement('div');
  overlay.className = 'overlay source-overlay';
  for (const c of cells) {
    const div = document.createElement('div');
    div.className = 'cell';
    div.style.left = (c.x / srcW * 100) + '%';
    div.style.top = (c.y / srcH * 100) + '%';
    div.style.width = (c.w / srcW * 100) + '%';
    div.style.height = (c.h / srcH * 100) + '%';
    const lbl = document.createElement('div');
    lbl.className = 'cell-label';
    lbl.textContent = pad2(c.id + 1);
    div.appendChild(lbl);
    overlay.appendChild(div);
  }
  frame.appendChild(overlay);
  sourceWrap.appendChild(frame);
}

function computeResultState() {
  if (!image || !srcCanvas || cells.length === 0) return;
  const placeRng = rngFromSeed(currentSeed, 0x2222);
  const rotRng = rngFromSeed(currentSeed, 0x3333);

  const pool = shuffleSeeded([...cells], placeRng);
  const rotations = pool.map(() => Math.floor(rotRng() * 4) * 90);
  const placements = placeSpiralWithRotations(pool, rotations, placeRng);

  const minX = Math.min(...placements.map((pl) => pl.x));
  const minY = Math.min(...placements.map((pl) => pl.y));
  const maxX = Math.max(...placements.map((pl) => pl.x + pl.ew));
  const maxY = Math.max(...placements.map((pl) => pl.y + pl.eh));
  const bw = maxX - minX;
  const bh = maxY - minY;

  resultState = { placements, bw, bh, minX, minY };
}
function drawResultCanvas() {
  if (!resultState || !srcCanvas) return;
  const { placements, bw, bh, minX, minY } = resultState;

  let paperW, paperH, padding, titleBand, scale, ox, oy;

  if (aspectRatio !== 'none') {
    if (aspectRatio === 'a4') { paperW = 1240; paperH = 1754; }
    else if (aspectRatio === '4:5') { paperW = 1240; paperH = 1550; }
    padding = Math.max(20, Math.round(paperW * paddingPct / 100));
    titleBand = Math.max(40, Math.round(paperH * titlePct / 100));
    const contentW = paperW - padding * 2;
    const contentH = paperH - padding * 2 - titleBand;
    scale = Math.min(contentW / bw, contentH / bh);
    const scaledBw = bw * scale;
    const scaledBh = bh * scale;
    ox = padding + (contentW - scaledBw) / 2 - minX * scale;
    oy = padding + (contentH - scaledBh) / 2 - minY * scale;
  } else {
    const refDim = Math.max(bw, bh);
    padding = Math.max(40, Math.round(refDim * paddingPct / 100));
    titleBand = Math.max(60, Math.round(refDim * titlePct / 100));
    paperW = bw + padding * 2;
    paperH = bh + padding * 2 + titleBand;
    scale = 1;
    ox = -minX + padding;
    oy = -minY + padding;
  }

  const refDim = Math.max(paperW, paperH);

  const canvas = document.createElement('canvas');
  canvas.width = paperW;
  canvas.height = paperH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = paperBg;
  ctx.fillRect(0, 0, paperW, paperH);

  const drawn = placements.map((pl) => ({
    p: pl.p,
    rot: pl.rot,
    x: pl.x * scale + ox,
    y: pl.y * scale + oy,
    ew: pl.ew * scale,
    eh: pl.eh * scale,
  }));

  if (gridOn && drawn.length) {
    const innerL = padding;
    const innerT = padding;
    const innerR = paperW - padding;
    const innerB = aspectRatio !== 'none' ? paperH - padding - titleBand : padding + bh;

    const xs = new Set();
    const ys = new Set();
    for (const pl of drawn) {
      xs.add(pl.x);
      xs.add(pl.x + pl.ew);
      ys.add(pl.y);
      ys.add(pl.y + pl.eh);
    }
    ctx.save();
    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, Math.round(refDim * 0.0007));
    for (const x of xs) {
      if (x <= innerL || x >= innerR) continue;
      ctx.beginPath();
      ctx.moveTo(x, innerT);
      ctx.lineTo(x, innerB);
      ctx.stroke();
    }
    for (const y of ys) {
      if (y <= innerT || y >= innerB) continue;
      ctx.beginPath();
      ctx.moveTo(innerL, y);
      ctx.lineTo(innerR, y);
      ctx.stroke();
    }
    ctx.strokeRect(innerL, innerT, innerR - innerL, innerB - innerT);
    ctx.restore();
  }

  for (const pl of drawn) drawPiece(ctx, pl);

  if (resultStroke) {
    const sw = Math.max(1, Math.round(refDim * 0.0015));
    ctx.strokeStyle = '#000';
    ctx.lineWidth = sw;
    for (const pl of drawn) ctx.strokeRect(pl.x, pl.y, pl.ew, pl.eh);
  }

  resultWrap.classList.remove('empty');
  resultWrap.innerHTML = '';
  resultWrap.style.minHeight = '0';

  const frame = document.createElement('div');
  frame.className = 'frame';
  frame.appendChild(canvas);
  resultWrap.appendChild(frame);

  lastResult = canvas;
  downloadBtn.disabled = false;
}

function drawPiece(ctx, pl) {
  const { p, rot, x, y, ew, eh } = pl;
  const s = rot % 180 === 0 ? ew / p.w : ew / p.h;
  const dw = p.w * s;
  const dh = p.h * s;
  ctx.save();
  ctx.translate(x + ew / 2, y + eh / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(effectCanvas || srcCanvas, p.x, p.y, p.w, p.h, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function composeSource() {
  const c = document.createElement('canvas');
  c.width = srcW;
  c.height = srcH;
  const ctx = c.getContext('2d');
  ctx.drawImage(effectCanvas || srcCanvas, 0, 0);

  const refDim = Math.min(srcW, srcH);
  const sw = Math.max(1, Math.round(refDim * 0.0018));
  ctx.strokeStyle = '#000';
  ctx.lineWidth = sw;
  for (const cell of cells) ctx.strokeRect(cell.x, cell.y, cell.w, cell.h);

  return c;
}
function composeSheet() {
  const n = cells.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  const paperW = 1240;
  const paperH = 1754;
  const padding = Math.round(paperW * 0.05);
  const gap = Math.round(paperW * 0.012);

  const contentW = paperW - padding * 2;
  const contentH = paperH - padding * 2;
  const slotW = (contentW - gap * (cols - 1)) / cols;
  const slotH = (contentH - gap * (rows - 1)) / rows;

  const fontSize = Math.max(9, Math.round(slotW * 0.07));
  const captionGap = Math.round(fontSize * 0.5);
  const imgH = slotH - fontSize - captionGap;

  const c = document.createElement('canvas');
  c.width = paperW;
  c.height = paperH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = paperBg;
  ctx.fillRect(0, 0, paperW, paperH);

  ctx.font = `400 ${fontSize}px 'Inter', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';

  const origScale = image.width / srcW;

  cells.forEach((cell, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const slotX = padding + col * (slotW + gap);
    const slotY = padding + row * (slotH + gap);

    const aspect = cell.w / cell.h;
    let drawW = slotW;
    let drawH = drawW / aspect;
    if (drawH > imgH) {
      drawH = imgH;
      drawW = drawH * aspect;
    }
    ctx.drawImage(effectCanvas || srcCanvas, cell.x, cell.y, cell.w, cell.h, slotX, slotY, drawW, drawH);

    const origW = Math.round(cell.w * origScale);
    const origH = Math.round(cell.h * origScale);
    ctx.fillStyle = '#000';
    ctx.fillText(pad2(cell.id + 1) + '  ' + origW + '×' + origH, slotX, slotY + drawH + captionGap);
  });

  return c;
}
function composeWithCropMarks(source, sheet) {
  const sw = source.width;
  const sh = source.height;
  const bleed = Math.round(Math.max(sw, sh) * 0.035);
  const totalW = sw + bleed * 2;
  const totalH = sh + bleed * 2;

  const c = document.createElement('canvas');
  c.width = totalW;
  c.height = totalH;
  const ctx = c.getContext('2d');

  ctx.fillStyle = paperBg;
  ctx.fillRect(0, 0, totalW, totalH);
  ctx.drawImage(source, bleed, bleed);

  const markLen = Math.round(bleed * 0.6);
  const markGap = Math.round(bleed * 0.25);
  const markStroke = Math.max(1, Math.round(bleed * 0.04));
  ctx.strokeStyle = '#000';
  ctx.lineWidth = markStroke;

  const corners = [
    { x: bleed, y: bleed },
    { x: bleed + sw, y: bleed },
    { x: bleed, y: bleed + sh },
    { x: bleed + sw, y: bleed + sh },
  ];
  for (const cn of corners) {
    const dx = cn.x === bleed ? -1 : 1;
    const dy = cn.y === bleed ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cn.x + dx * markGap, cn.y);
    ctx.lineTo(cn.x + dx * (markGap + markLen), cn.y);
    ctx.moveTo(cn.x, cn.y + dy * markGap);
    ctx.lineTo(cn.x, cn.y + dy * (markGap + markLen));
    ctx.stroke();
  }

  return c;
}

function openPreview(type, canvas) {
  previewSource = { type, canvas };
  previewImg.src = canvas.toDataURL('image/png');
  previewModal.classList.remove('hidden');
}

function closePreview() {
  previewModal.classList.add('hidden');
  previewImg.removeAttribute('src');
  previewSource = null;
}
function openSheet() {
  if (!cells.length || !image) return;
  const n = cells.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);

  sheetContent.style.background = paperBg;
  sheetContent.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  sheetContent.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  sheetContent.innerHTML = '';

  const origScale = image.width / srcW;
  cells.forEach((c) => {
    const slot = document.createElement('div');
    slot.className = 'sheet-cell';
    const imgBox = document.createElement('div');
    imgBox.className = 'sheet-img';
    const canvas = document.createElement('canvas');
    canvas.width = c.w;
    canvas.height = c.h;
    canvas.getContext('2d').drawImage(effectCanvas || srcCanvas, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    imgBox.appendChild(canvas);
    const caption = document.createElement('div');
    caption.className = 'sheet-caption';
    const origW = Math.round(c.w * origScale);
    const origH = Math.round(c.h * origScale);
    caption.innerHTML = pad2(c.id + 1) + '<span class="res">' + origW + '×' + origH + '</span>';
    slot.appendChild(imgBox);
    slot.appendChild(caption);
    sheetContent.appendChild(slot);
  });

  sheetInfo.textContent = 'sheet — ' + n + ' cells / ' + cols + '×' + rows;
  modal.classList.remove('hidden');
}

function closeSheet() { modal.classList.add('hidden'); }
function placeSpiralWithRotations(pieces, rotations, rng) {
  const placed = [];
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    const rot = rotateOn ? rotations[i] : 0;
    const swap = rot % 180 !== 0;
    const ew = swap ? p.h : p.w;
    const eh = swap ? p.w : p.h;
    if (i === 0) {
      placed.push({ p, rot, x: -ew / 2, y: -eh / 2, ew, eh });
      continue;
    }
    const prev = placed[placed.length - 1];
    const dirs = ['right', 'down', 'left', 'up'];
    const opp = { right: 'left', left: 'right', up: 'down', down: 'up' };
    const choices = prev._dir ? dirs.filter((d) => d !== opp[prev._dir]) : dirs;
    const dir = choices[Math.floor(rng() * choices.length)];
    let x, y;
    if (dir === 'right') { x = prev.x + prev.ew; y = prev.y; }
    else if (dir === 'left') { x = prev.x - ew; y = prev.y; }
    else if (dir === 'down') { x = prev.x; y = prev.y + prev.eh; }
    else { x = prev.x; y = prev.y - eh; }
    placed.push({ p, rot, x, y, ew, eh, _dir: dir });
  }
  return placed;
}

function generateGrid(w, h, target, rng) {
  const minSize = Math.max(30, Math.min(w, h) * 0.04);
  const out = [{ x: 0, y: 0, w, h }];

  while (out.length < target) {
    let bestIdx = -1;
    let bestArea = 0;
    for (let i = 0; i < out.length; i++) {
      const c = out[i];
      if (c.w < minSize * 2 && c.h < minSize * 2) continue;
      const area = c.w * c.h;
      if (area > bestArea) { bestArea = area; bestIdx = i; }
    }
    if (bestIdx < 0) break;

    const c = out[bestIdx];
    const canV = c.w >= minSize * 2;
    const canH = c.h >= minSize * 2;

    let vertical;
    let pos;
    if (awareOn && srcCanvas) {
      const aware = findAwareSplit(c, canV, canH, rng);
      vertical = aware.vertical;
      pos = aware.pos;
    } else {
      if (canV && canH) vertical = rng() < c.w / (c.w + c.h);
      else vertical = canV;
      const t = 0.35 + rng() * 0.3;
      pos = vertical ? Math.round(c.w * t) : Math.round(c.h * t);
    }

    if (vertical) {
      pos = Math.max(minSize, Math.min(c.w - minSize, pos));
      out.splice(bestIdx, 1, { x: c.x, y: c.y, w: pos, h: c.h }, { x: c.x + pos, y: c.y, w: c.w - pos, h: c.h });
    } else {
      pos = Math.max(minSize, Math.min(c.h - minSize, pos));
      out.splice(bestIdx, 1, { x: c.x, y: c.y, w: c.w, h: pos }, { x: c.x, y: c.y + pos, w: c.w, h: c.h - pos });
    }
  }
  return out;
}
function findAwareSplit(cell, canV, canH, rng) {
  const ctx = srcCanvas.getContext('2d');
  let bestV = { score: -1, pos: Math.floor(cell.w / 2) };
  let bestH = { score: -1, pos: Math.floor(cell.h / 2) };

  const sampleW = Math.min(cell.w, 256);
  const sampleH = Math.min(cell.h, 256);
  const stepX = cell.w / sampleW;
  const stepY = cell.h / sampleH;

  if (canV) {
    const y = Math.floor(cell.y + cell.h / 2);
    const data = ctx.getImageData(cell.x, y, cell.w, 1).data;
    const minOff = Math.floor(cell.w * 0.25);
    const maxOff = cell.w - minOff;
    for (let i = minOff + 1; i < maxOff; i++) {
      const a = data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2];
      const b = data[(i - 1) * 4] + data[(i - 1) * 4 + 1] + data[(i - 1) * 4 + 2];
      const g = Math.abs(a - b);
      if (g > bestV.score) bestV = { score: g, pos: i };
    }
  }
  if (canH) {
    const x = Math.floor(cell.x + cell.w / 2);
    const data = ctx.getImageData(x, cell.y, 1, cell.h).data;
    const minOff = Math.floor(cell.h * 0.25);
    const maxOff = cell.h - minOff;
    for (let i = minOff + 1; i < maxOff; i++) {
      const a = data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2];
      const b = data[(i - 1) * 4] + data[(i - 1) * 4 + 1] + data[(i - 1) * 4 + 2];
      const g = Math.abs(a - b);
      if (g > bestH.score) bestH = { score: g, pos: i };
    }
  }

  let vertical;
  if (canV && canH) vertical = bestV.score > bestH.score;
  else vertical = canV;
  const pos = vertical ? bestV.pos : bestH.pos;
  return { vertical, pos };
}

function aspectStr(w, h) {
  const g = gcd(w, h);
  let aw = Math.round(w / g);
  let ah = Math.round(h / g);
  if (aw > 99 || ah > 99) {
    const target = w / h;
    let bestErr = Infinity;
    let bestA = 1;
    let bestB = 1;
    for (let b = 1; b <= 30; b++) {
      const a = Math.round(target * b);
      if (a < 1 || a > 99) continue;
      const err = Math.abs(target - a / b);
      if (err < bestErr) { bestErr = err; bestA = a; bestB = b; }
    }
    aw = bestA;
    ah = bestB;
  }
  return aw + ':' + ah;
}

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function applyEffect() {
  if (!srcCanvas) return;
  if (effectName === 'none') {
    effectCanvas = srcCanvas;
    return;
  }
  const c = document.createElement('canvas');
  c.width = srcW;
  c.height = srcH;
  const ctx = c.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, srcW, srcH);
  const data = imgData.data;

  if (effectName === 'bw') {
    for (let i = 0; i < data.length; i += 4) {
      const g = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) | 0;
      data[i] = data[i + 1] = data[i + 2] = g;
    }
  } else if (effectName === 'threshold') {
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const v = g > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  } else if (effectName === 'posterize') {
    const levels = 4;
    const step = 255 / (levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
    }
  } else if (effectName === 'dither') {
    const w = srcW;
    const h = srcH;
    const gs = new Float32Array(w * h);
    for (let i = 0; i < gs.length; i++) {
      const di = i * 4;
      gs[i] = 0.299 * data[di] + 0.587 * data[di + 1] + 0.114 * data[di + 2];
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const old = gs[idx];
        const nw = old < 128 ? 0 : 255;
        gs[idx] = nw;
        const err = old - nw;
        if (x + 1 < w) gs[idx + 1] += (err * 7) / 16;
        if (y + 1 < h) {
          if (x > 0) gs[idx + w - 1] += (err * 3) / 16;
          gs[idx + w] += (err * 5) / 16;
          if (x + 1 < w) gs[idx + w + 1] += (err * 1) / 16;
        }
      }
    }
    for (let i = 0; i < gs.length; i++) {
      const di = i * 4;
      const v = gs[i] < 128 ? 0 : 255;
      data[di] = data[di + 1] = data[di + 2] = v;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  effectCanvas = c;
}

function shuffleSeeded(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

updateSeedUi();
gridBtn.textContent = 'grid: ' + (gridOn ? 'on' : 'off');
gridBtn.classList.toggle('active', gridOn);

if (document.fonts && document.fonts.load) {
  Promise.all([300, 400, 500, 600, 700, 800, 900].map((w) =>
    document.fonts.load(w + ' 80px Inter')
  )).then(() => {
    if (image && resultState) drawResultCanvas();
  });
}