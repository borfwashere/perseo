(() => {
  'use strict';

  const COL_BG = '#0000f2';
  const COL_FG = '#111111';
  const COL_PURPLE = '#111111';

  const FORMATS = {
    free: { label: 'Free', ratio: null },
    '16:9': { label: '16:9', ratio: 9 / 16 },
    '4:5': { label: '4:5', ratio: 5 / 4 },
    '1:1': { label: '1:1', ratio: 1 },
    a4: { label: 'A4', ratio: Math.SQRT2 }
  };

  const SPEEDS = { slow: 25, normal: 50, fast: 75 };
  const BLEND_MAP = { normal: 'source-over', multiply: 'multiply', screen: 'screen' };

  class ScannerApp {
    constructor() {
      this.srcCanvas = document.getElementById('srcCanvas');
      this.outCanvas = document.getElementById('outCanvas');
      this.srcCtx = this.srcCanvas.getContext('2d');
      this.outCtx = this.outCanvas.getContext('2d');

      this.sourceImg = null;
      this.imgX = 0; this.imgY = 0; this.imgW = 0; this.imgH = 0;
      this.rotation = 0;
      this.dragging = false; this.rotating = false;
      this.dragOffX = 0; this.dragOffY = 0;
      this.rotateStart = 0; this.rotateStartRot = 0;
      this.pinchDist = 0; this.pinchW = 0; this.pinchH = 0;

      this.panelW = 400; this.panelH = 500;
      this.format = 'free';
      this.speed = 'normal';

      this.scanning = false;
      this.scanComplete = false;
      this.scanPos = 0;
      this.lastTime = 0;
      this.activeLayer = null;
      this.layers = [];

      this.activeEffect = 'none';
      this.effectedCanvas = null;
      this.effectedDirty = true;

      this.undoStack = [];
      this.recording = false;
      this.recArmed = false;
      this.mediaRecorder = null;
      this.recordedChunks = [];
      this.toastTimer = null;

      this.statusEl = document.getElementById('statusText');
      this.toastEl = document.getElementById('toast');
    }

    init() {
      this.computeLayout();
      this.bindEvents();
      this.lastTime = performance.now();
      requestAnimationFrame(() => this.render());
      const preset = document.getElementById('preset');
      const onPresetLoad = () => {
        const c = document.createElement('canvas');
        c.width = preset.naturalWidth;
        c.height = preset.naturalHeight;
        c.getContext('2d').drawImage(preset, 0, 0);
        c.toBlob((blob) => this.loadImage(new File([blob], 'perseo.png', { type: 'image/png' }), () => this.startScan()));
      };
      if (preset.complete && preset.naturalWidth > 0) onPresetLoad();
      else preset.addEventListener('load', onPresetLoad);
    }

    computeLayout() {
      const toolbarH = (document.querySelector('header').offsetHeight || 72);
      const pad = 24;
      const gap = 14;
      const availW = window.innerWidth - pad * 2;
      const availH = window.innerHeight - toolbarH - pad * 2;
      const fmt = FORMATS[this.format];
      let panelW = Math.floor((availW - gap) / 2);
      let panelH;
      if (fmt.ratio) {
        panelH = Math.floor(panelW * fmt.ratio);
        if (panelH > availH) {
          panelH = availH;
          panelW = Math.floor(panelH / fmt.ratio);
        }
      } else {
        panelH = availH;
      }
      this.panelW = Math.max(120, panelW);
      this.panelH = Math.max(120, panelH);
      this.srcCanvas.width = this.panelW;
      this.srcCanvas.height = this.panelH;
      this.outCanvas.width = this.panelW;
      this.outCanvas.height = this.panelH;
    }

    bindEvents() {
      document.getElementById('btnLoad').addEventListener('click', () => document.getElementById('fileInput').click());
      document.getElementById('fileInput').addEventListener('change', e => {
        if (e.target.files[0]) this.loadImage(e.target.files[0]);
        e.target.value = '';
      });
      document.getElementById('btnScan').addEventListener('click', () => this.startScan());
      document.getElementById('btnStop').addEventListener('click', () => this.stopScan());
      document.getElementById('btnUndo').addEventListener('click', () => this.undo());
      document.getElementById('effect').addEventListener('change', e => {
        this.activeEffect = e.target.value;
        this.effectedDirty = true;
        this.drawResult();
      });
      document.getElementById('btnSavePng').addEventListener('click', () => this.exportPNG());
      document.getElementById('btnSaveWebM').addEventListener('click', () => this.exportWebM());
      document.getElementById('selFormat').addEventListener('change', e => this.setFormat(e.target.value));
      document.getElementById('selSpeed').addEventListener('change', e => this.setSpeed(e.target.value));
      document.getElementById('btnRec').addEventListener('click', () => {
        this.recArmed = !this.recArmed;
        document.getElementById('btnRec').classList.toggle('armed', this.recArmed);
        this.setStatus(this.recArmed ? 'Recording armed — Start Scan to begin' : 'Recording disabled');
      });

      this.srcCanvas.addEventListener('mousedown', e => this.mouseDown(e));
      window.addEventListener('mousemove', e => this.mouseMove(e));
      window.addEventListener('mouseup', () => this.mouseUp());
      this.srcCanvas.addEventListener('wheel', e => this.wheel(e), { passive: false });
      this.srcCanvas.addEventListener('contextmenu', e => e.preventDefault());

      this.srcCanvas.addEventListener('touchstart', e => this.touchStart(e), { passive: false });
      this.srcCanvas.addEventListener('touchmove', e => this.touchMove(e), { passive: false });
      this.srcCanvas.addEventListener('touchend', e => this.touchEnd(e));

      window.addEventListener('dragover', e => e.preventDefault());
      window.addEventListener('drop', e => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('image/')) this.loadImage(f);
      });

      window.addEventListener('resize', () => this.resize());
    }

    loadImage(file, done) {
      if (!file) return;
      const apply = img => {
        this.sourceImg = img;
        this.fitImage();
        this.layers = [];
        this.activeLayer = null;
        this.scanning = false;
        this.scanComplete = false;
        this.scanPos = 0;
        this.rotation = 0;
        this.undoStack = [];
        this.effectedDirty = true;
        this.setStatus('Drag to move, right-click to rotate');
        this.toast('Image loaded');
        if (done) done();
      };
      if (file instanceof HTMLImageElement && file.complete) {
        apply(file);
        return;
      }
      if (!file.type || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => apply(img);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    fitImage() {
      const s = Math.min(this.panelW / this.sourceImg.width, this.panelH / this.sourceImg.height);
      this.imgW = Math.round(this.sourceImg.width * s);
      this.imgH = Math.round(this.sourceImg.height * s);
      this.imgX = (this.panelW - this.imgW) / 2;
      this.imgY = (this.panelH - this.imgH) / 2;
    }

    startScan() {
      if (!this.sourceImg) { this.toast('Load an image first'); return; }
      if (this.scanning) return;
      this.commitActiveLayer();
      this.pushUndo();
      this.activeLayer = document.createElement('canvas');
      this.activeLayer.width = this.panelW;
      this.activeLayer.height = this.panelH;
      this.scanPos = 0;
      this.scanning = true;
      this.scanComplete = false;
      this.lastTime = performance.now();
      if (this.recArmed) this.startRecording();
      this.setStatus('Scanning...');
    }

    stopScan() {
      if (!this.scanning) return;
      this.scanning = false;
      this.commitActiveLayer();
      this.stopRecording();
      this.setStatus('Scan stopped');
    }

    commitActiveLayer() {
      if (!this.activeLayer) return;
      this.layers.push({ canvas: this.activeLayer, blend: this.currentBlend() });
      this.activeLayer = null;
      this.effectedDirty = true;
    }

    currentBlend() {
      return document.getElementById('selLayerBlend').value;
    }

    scanStep(dt) {
      const speed = SPEEDS[this.speed];
      const prev = Math.floor(this.scanPos);
      this.scanPos = Math.min(this.panelW, this.scanPos + speed * dt);
      const cur = Math.floor(this.scanPos);
      if (cur > prev && this.activeLayer) {
        const act = this.activeLayer.getContext('2d');
        act.drawImage(this.srcCanvas, prev, 0, cur - prev, this.panelH, prev, 0, cur - prev, this.panelH);
      }
      if (this.scanPos >= this.panelW) {
        this.scanning = false;
        this.scanComplete = true;
        this.commitActiveLayer();
        this.stopRecording();
        this.setStatus('Scan complete');
        this.toast('Scan complete');
      } else {
        this.setStatus('Scanning: ' + Math.round(this.scanPos / this.panelW * 100) + '%');
      }
    }

    render() {
      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.drawSource();
      if (this.scanning) this.scanStep(dt);
      this.drawResult();
      this.drawScanLine();

      requestAnimationFrame(() => this.render());
    }

    drawSource() {
      const ctx = this.srcCtx;
      ctx.clearRect(0, 0, this.panelW, this.panelH);
      ctx.fillStyle = COL_BG;
      ctx.fillRect(0, 0, this.panelW, this.panelH);
      if (this.sourceImg) {
        ctx.save();
        ctx.translate(this.imgX + this.imgW / 2, this.imgY + this.imgH / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.sourceImg, -this.imgW / 2, -this.imgH / 2, this.imgW, this.imgH);
        ctx.restore();
      }
    }

    drawResult() {
      const ctx = this.outCtx;
      ctx.clearRect(0, 0, this.panelW, this.panelH);
      ctx.fillStyle = COL_BG;
      ctx.fillRect(0, 0, this.panelW, this.panelH);

      for (const layer of this.layers) {
        ctx.globalCompositeOperation = BLEND_MAP[layer.blend] || 'source-over';
        ctx.drawImage(layer.canvas, 0, 0, this.panelW, this.panelH);
      }
      if (this.activeLayer) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.activeLayer, 0, 0, this.panelW, this.panelH);
      }
      ctx.globalCompositeOperation = 'source-over';

      if (this.activeEffect !== 'none') {
        if (this.effectedDirty || this.scanning) this.renderEffected();
        ctx.drawImage(this.effectedCanvas, 0, 0);
      }
    }

    renderEffected() {
      if (!this.effectedCanvas) {
        this.effectedCanvas = document.createElement('canvas');
        this.effectedCanvas.width = this.panelW;
        this.effectedCanvas.height = this.panelH;
      }
      const ectx = this.effectedCanvas.getContext('2d');
      ectx.clearRect(0, 0, this.panelW, this.panelH);
      ectx.drawImage(this.outCanvas, 0, 0);
      const imageData = ectx.getImageData(0, 0, this.panelW, this.panelH);
      this.applyEffect(this.activeEffect, imageData);
      ectx.putImageData(imageData, 0, 0);
      this.effectedDirty = false;
    }

    drawScanLine() {
      if (!this.scanning) return;
      const ctx = this.srcCtx;
      ctx.fillStyle = 'rgba(17, 17, 17, 0.15)';
      ctx.fillRect(this.scanPos - 5, 0, 10, this.panelH);
      ctx.fillStyle = COL_PURPLE;
      ctx.fillRect(this.scanPos - 1, 0, 2, this.panelH);
    }

    applyEffect(effectName, imageData) {
      const d = imageData.data;

      if (effectName === 'bw') {
        for (let i = 0; i < d.length; i += 4) {
          const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          d[i] = d[i + 1] = d[i + 2] = gray;
        }
      } else if (effectName === 'threshold') {
        for (let i = 0; i < d.length; i += 4) {
          const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          const v = gray > 128 ? 255 : 0;
          d[i] = d[i + 1] = d[i + 2] = v;
        }
      } else if (effectName === 'invert') {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i + 1] = 255 - d[i + 1];
          d[i + 2] = 255 - d[i + 2];
        }
      } else if (effectName === 'posterize') {
        const step = 255 / 7;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.round(d[i] / step) * step;
          d[i + 1] = Math.round(d[i + 1] / step) * step;
          d[i + 2] = Math.round(d[i + 2] / step) * step;
        }
      } else if (effectName === 'dither') {
        this.floydSteinbergDither(imageData);
      }
    }

    floydSteinbergDither(imageData) {
      const d = imageData.data;
      const w = imageData.width, h = imageData.height;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          const newVal = gray > 128 ? 255 : 0;
          const err = gray - newVal;
          d[i] = d[i + 1] = d[i + 2] = newVal;
          const apply = (idx, f) => {
            if (idx >= 0 && idx < d.length) {
              const v = d[idx] + err * f;
              d[idx] = d[idx + 1] = d[idx + 2] = Math.max(0, Math.min(255, v));
            }
          };
          apply(i + 4, 7 / 16);
          apply(i + w * 4 - 4, 3 / 16);
          apply(i + w * 4, 5 / 16);
          apply(i + w * 4 + 4, 1 / 16);
        }
      }
    }

    mouseDown(e) {
      if (!this.sourceImg) return;
      const rect = this.srcCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.panelW / rect.width);
      const my = (e.clientY - rect.top) * (this.panelH / rect.height);
      if (mx < 0 || mx > this.panelW || my < 0 || my > this.panelH) return;
      if (e.button === 2) {
        this.rotating = true;
        this.rotateStart = Math.atan2(my - (this.imgY + this.imgH / 2), mx - (this.imgX + this.imgW / 2));
        this.rotateStartRot = this.rotation;
      } else {
        this.dragging = true;
        this.dragOffX = mx - this.imgX;
        this.dragOffY = my - this.imgY;
      }
    }

    mouseMove(e) {
      const rect = this.srcCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.panelW / rect.width);
      const my = (e.clientY - rect.top) * (this.panelH / rect.height);
      if (this.rotating) {
        const cx = this.imgX + this.imgW / 2, cy = this.imgY + this.imgH / 2;
        const a = Math.atan2(my - cy, mx - cx);
        this.rotation = this.rotateStartRot + (a - this.rotateStart);
        return;
      }
      if (this.dragging) {
        this.imgX = mx - this.dragOffX;
        this.imgY = my - this.dragOffY;
      }
    }

    mouseUp() {
      this.dragging = false;
      this.rotating = false;
    }

    wheel(e) {
      e.preventDefault();
      if (!this.sourceImg) return;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const cx = this.imgX + this.imgW / 2, cy = this.imgY + this.imgH / 2;
      this.imgW = Math.max(10, this.imgW * factor);
      this.imgH = Math.max(10, this.imgH * factor);
      this.imgX = cx - this.imgW / 2;
      this.imgY = cy - this.imgH / 2;
    }

    touchStart(e) {
      e.preventDefault();
      if (!this.sourceImg) return;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const rect = this.srcCanvas.getBoundingClientRect();
        const mx = (t.clientX - rect.left) * (this.panelW / rect.width), my = (t.clientY - rect.top) * (this.panelH / rect.height);
        this.dragging = true;
        this.dragOffX = mx - this.imgX;
        this.dragOffY = my - this.imgY;
      } else if (e.touches.length === 2) {
        this.pinchDist = this.dist(e.touches[0], e.touches[1]);
        this.pinchW = this.imgW;
        this.pinchH = this.imgH;
      }
    }

    touchMove(e) {
      e.preventDefault();
      if (e.touches.length === 1 && this.dragging) {
        const t = e.touches[0];
        const rect = this.srcCanvas.getBoundingClientRect();
        const mx = (t.clientX - rect.left) * (this.panelW / rect.width), my = (t.clientY - rect.top) * (this.panelH / rect.height);
        this.imgX = mx - this.dragOffX;
        this.imgY = my - this.dragOffY;
      } else if (e.touches.length === 2 && this.pinchDist) {
        const d = this.dist(e.touches[0], e.touches[1]);
        const f = d / this.pinchDist;
        const cx = this.imgX + this.imgW / 2, cy = this.imgY + this.imgH / 2;
        this.imgW = Math.max(10, this.pinchW * f);
        this.imgH = Math.max(10, this.pinchH * f);
        this.imgX = cx - this.imgW / 2;
        this.imgY = cy - this.imgH / 2;
      }
    }

    touchEnd() {
      this.dragging = false;
      this.pinchDist = 0;
    }

    dist(a, b) {
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }

    pushUndo() {
      const snapshot = this.layers.map(l => {
        const c = document.createElement('canvas');
        c.width = l.canvas.width;
        c.height = l.canvas.height;
        c.getContext('2d').drawImage(l.canvas, 0, 0);
        return { canvas: c, blend: l.blend };
      });
      this.undoStack.push(snapshot);
      if (this.undoStack.length > 20) this.undoStack.shift();
    }

    undo() {
      if (this.undoStack.length === 0) { this.toast('Nothing to undo'); return; }
      this.layers = this.undoStack.pop();
      this.activeLayer = null;
      this.scanning = false;
      this.scanPos = 0;
      this.effectedDirty = true;
      this.setStatus('Undo');
    }

    startRecording() {
      if (this.recording) return;
      try {
        const stream = this.outCanvas.captureStream(30);
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        this.recordedChunks = [];
        this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
        this.mediaRecorder.onstop = () => this.downloadWebM();
        this.mediaRecorder.start(250);
        this.recording = true;
        document.getElementById('btnRec').classList.add('recording');
        this.toast('Recording started');
      } catch (err) {
        console.error('Recording error:', err);
        this.toast('Recording not supported');
        document.getElementById('btnRec').classList.remove('armed');
        this.recArmed = false;
      }
    }

    stopRecording() {
      if (!this.recording) return;
      this.mediaRecorder.stop();
      this.recording = false;
      document.getElementById('btnRec').classList.remove('recording');
      this.toast('Recording saved');
    }

    downloadWebM() {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scan-recording.webm';
      a.click();
      URL.revokeObjectURL(url);
    }

    exportPNG() {
      if (!this.hasResult()) { this.toast('Nothing to export'); return; }
      const a = document.createElement('a');
      a.href = this.outCanvas.toDataURL('image/png');
      a.download = 'scan-result.png';
      a.click();
    }

    exportWebM() {
      if (this.recordedChunks.length === 0) { this.toast('No recording yet'); return; }
      this.downloadWebM();
    }

    hasResult() {
      return this.layers.length > 0 || (this.activeLayer && this.scanPos > 0);
    }

    setFormat(f) {
      this.format = f;
      this.resize();
    }

    setSpeed(s) {
      this.speed = s;
    }

    resize() {
      this.computeLayout();
      if (this.sourceImg) this.fitImage();
    }

    setStatus(text) {
      this.statusEl.textContent = text;
    }

    toast(msg) {
      this.toastEl.textContent = msg;
      this.toastEl.classList.add('show');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 2000);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const app = new ScannerApp();
    app.init();
    window.__scannerApp = app;
  });
})();