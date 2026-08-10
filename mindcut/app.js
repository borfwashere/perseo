(function () {
    'use strict';

    var $ = function (id) { return document.getElementById(id); };

    var els = {
        upload: $('upload'),
        cut: $('cut'),
        slicesDown: $('slices-down'),
        slicesUp: $('slices-up'),
        slicesInput: $('slices-input'),
        copies2: $('copies-2'),
        copies4: $('copies-4'),
        effect: $('effect'),
        save: $('save'),
        sourceWrap: $('source-wrap'),
        resultWrap: $('result-wrap')
    };

    var sourceImage = null;
    var resultCanvas = null;
    var copiesData = [];
    var copies = 2;

    function clampSlices(n) {
        return Math.max(2, Math.min(60, n));
    }

    function setSlices(n) {
        els.slicesInput.value = clampSlices(n);
    }

    function setCopies(n) {
        copies = n;
        els.copies2.classList.toggle('active', n === 2);
        els.copies4.classList.toggle('active', n === 4);
    }

    function loadImage(file) {
        if (!file || !file.type.match(/^image\//)) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                sourceImage = img;
                drawSource();
                els.cut.disabled = false;
                els.save.disabled = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function drawSource() {
        var wrap = els.sourceWrap;
        wrap.classList.remove('empty');
        wrap.innerHTML = '';
        var canvas = document.createElement('canvas');
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        canvas.getContext('2d').drawImage(sourceImage, 0, 0);
        wrap.appendChild(canvas);
    }

    function drawStrips(source, axis, numSlices) {
        var W = source.width, H = source.height;
        var odd = [], even = [];
        for (var i = 0; i < numSlices; i++) {
            if (i % 2 === 0) odd.push(i); else even.push(i);
        }
        function build(group) {
            var canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            var ctx = canvas.getContext('2d');
            var count = group.length;
            if (axis === 'horizontal') {
                var stripH = H / numSlices;
                var slotH = H / count;
                group.forEach(function (idx, j) {
                    ctx.drawImage(source, 0, idx * stripH, W, stripH, 0, j * slotH, W, slotH);
                });
            } else {
                var stripW = W / numSlices;
                var slotW = W / count;
                group.forEach(function (idx, j) {
                    ctx.drawImage(source, idx * stripW, 0, stripW, H, j * slotW, 0, slotW, H);
                });
            }
            return canvas;
        }
        return [build(odd), build(even)];
    }

    function topBreeder(numCopies) {
        var slices = clampSlices(parseInt(els.slicesInput.value, 10) || 10);
        var pair = drawStrips(sourceImage, 'horizontal', slices);
        if (numCopies === 2) return pair;
        var a = drawStrips(pair[0], 'vertical', slices);
        var b = drawStrips(pair[1], 'vertical', slices);
        return [a[0], a[1], b[0], b[1]];
    }

    function applyDither(canvas) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var w = canvas.width;
        var matrix = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ];
        for (var y = 0; y < canvas.height; y++) {
            for (var x = 0; x < w; x++) {
                var i = (y * w + x) * 4;
                var lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                var threshold = (matrix[y % 4][x % 4] / 16) * 255;
                var v = lum > threshold ? 255 : 0;
                data[i] = v; data[i + 1] = v; data[i + 2] = v;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applyEffect(canvas, effect) {
        var ctx = canvas.getContext('2d');
        if (effect === 'bw') {
            ctx.filter = 'grayscale(1)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
        } else if (effect === 'invert') {
            ctx.filter = 'invert(1)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
        } else if (effect === 'threshold') {
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                var v = lum > 128 ? 255 : 0;
                data[i] = v; data[i + 1] = v; data[i + 2] = v;
            }
            ctx.putImageData(imageData, 0, 0);
        } else if (effect === 'dither') {
            applyDither(canvas);
        }
    }

    function render() {
        if (!sourceImage) return;
        var result;
        var rawCopies;
        if (copies === 2) {
            var pair = topBreeder(2);
            rawCopies = pair;
            var W = sourceImage.width, H = sourceImage.height;
            var canvas = document.createElement('canvas');
            canvas.width = W * 2;
            canvas.height = H;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(pair[0], 0, 0);
            ctx.drawImage(pair[1], W, 0);
            result = canvas;
        } else {
            var copies4 = topBreeder(4);
            rawCopies = copies4;
            var W = sourceImage.width, H = sourceImage.height;
            var canvas = document.createElement('canvas');
            canvas.width = W * 2;
            canvas.height = H * 2;
            var ctx = canvas.getContext('2d');
            copies4.forEach(function (c, i) {
                ctx.drawImage(c, (i % 2) * W, Math.floor(i / 2) * H);
            });
            result = canvas;
        }
        applyEffect(result, els.effect.value);
        resultCanvas = result;
        copiesData = rawCopies.map(function (c) { return c.toDataURL('image/png'); });
        var wrap = els.resultWrap;
        wrap.classList.remove('empty');
        wrap.innerHTML = '';
        wrap.appendChild(result);
        buildDownloadButtons();
    }

    function save() {
        if (!resultCanvas) return;
        var link = document.createElement('a');
        link.download = 'mindcut-result.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    }

    function buildDownloadButtons() {
        var container = $('downloads');
        container.innerHTML = '';
        copiesData.forEach(function (dataUrl, i) {
            var btn = document.createElement('button');
            btn.className = 'dl-btn';
            btn.textContent = 'save ' + (i + 1);
            btn.addEventListener('click', function () {
                var link = document.createElement('a');
                link.download = 'mindcut-' + (i + 1) + '.png';
                link.href = dataUrl;
                link.click();
            });
            container.appendChild(btn);
        });
    }

    els.upload.addEventListener('change', function () {
        loadImage(this.files[0]);
    });

    els.cut.addEventListener('click', function () { render(); });

    els.slicesDown.addEventListener('click', function () {
        setSlices(clampSlices(parseInt(els.slicesInput.value, 10) || 10) - 1);
    });
    els.slicesUp.addEventListener('click', function () {
        setSlices(clampSlices(parseInt(els.slicesInput.value, 10) || 10) + 1);
    });
    els.slicesInput.addEventListener('change', function () {
        setSlices(parseInt(this.value, 10) || 10);
    });

    els.copies2.addEventListener('click', function () { setCopies(2); });
    els.copies4.addEventListener('click', function () { setCopies(4); });

    els.save.addEventListener('click', save);

    var dragDepth = 0;
    els.sourceWrap.addEventListener('dragenter', function (e) {
        e.preventDefault();
        dragDepth++;
        this.classList.add('dragover');
    });
    els.sourceWrap.addEventListener('dragover', function (e) {
        e.preventDefault();
    });
    els.sourceWrap.addEventListener('dragleave', function (e) {
        e.preventDefault();
        dragDepth--;
        if (dragDepth <= 0) {
            dragDepth = 0;
            this.classList.remove('dragover');
        }
    });
els.sourceWrap.addEventListener('drop', function (e) {
        e.preventDefault();
        dragDepth = 0;
        this.classList.remove('dragover');
        var files = e.dataTransfer.files;
        if (files && files.length) loadImage(files[0]);
    });
})();
