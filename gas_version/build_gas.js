const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
const css  = fs.readFileSync(path.join(root, 'style.css'), 'utf-8');
let   js   = fs.readFileSync(path.join(root, 'main.js'), 'utf-8');

// ── Separar imports ES-module del resto ──────────────────────────────────────
const importLines = [];
const otherLines  = [];
js.split('\n').forEach(line => {
    if (line.trim().startsWith('import ')) importLines.push(line);
    else otherLines.push(line);
});

// ── Lógica de Drive + Audio (se inyecta antes de initGlaymarApp) ─────────────
const driveLogic = [
'// --- GOOGLE DRIVE ASSET MANAGER ---',
'window.driveDictionary = {};',
'window.driveToken = "";',
'const FOLDER_ID = "1VoKFnxH9LQXVvInSHuSSKIGLkuZ-ulHP";',
'',
'// --- REPRODUCTOR: <audio> con data URI via Apps Script (evita bloqueos de Brave) ---',
'let currentAudioEl = null;',
'let audioIsPlaying  = false;',
'let loadGeneration  = 0;',
'',
'function updateProgress(msg) {',
'    const el = document.getElementById("loading-text");',
'    if (el) el.textContent = msg;',
'}',
'',
'function normalizePath(localPath) {',
'    if (localPath.startsWith("./")) localPath = localPath.substring(2);',
'    if (localPath.startsWith("/"))  localPath = localPath.substring(1);',
'    return localPath;',
'}',
'',
'function getDriveFileId(p) {',
'    const searchPath = normalizePath(p).toLowerCase();',
'    for (const key in window.driveDictionary) {',
'        if (key.toLowerCase() === searchPath) return window.driveDictionary[key];',
'    }',
'    return null;',
'}',
'',
'async function loadDriveAsset(localPath, onProgress) {',
'    const fileId = getDriveFileId(localPath);',
'    if (!fileId) throw new Error("Archivo no encontrado en Drive: " + localPath);',
'    return new Promise((resolve, reject) => {',
'        const xhr = new XMLHttpRequest();',
'        xhr.open("GET", "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media", true);',
'        xhr.setRequestHeader("Authorization", "Bearer " + window.driveToken);',
'        xhr.responseType = "arraybuffer";',
'        xhr.onprogress = e => { if (onProgress) onProgress(e); };',
'        xhr.onload  = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response); else reject(new Error("HTTP " + xhr.status)); };',
'        xhr.onerror = () => reject(new Error("Network Error"));',
'        xhr.send();',
'    });',
'}',
'',
'async function loadDriveAssetAsBlob(localPath, mimeType) {',
'    const ab = await loadDriveAsset(localPath);',
'    return URL.createObjectURL(new Blob([ab], { type: mimeType || "application/octet-stream" }));',
'}',
'',
'// Interceptar FBXLoader para usar Drive',
'const _origFBX = FBXLoader.prototype.load;',
'FBXLoader.prototype.load = function(url, onLoad, onProgress, onError) {',
'    if (url.startsWith("blob:")) { _origFBX.call(this, url, onLoad, onProgress, onError); return; }',
'    const mgr = this.manager;',
'    mgr.itemStart(url);',
'    loadDriveAssetAsBlob(url).then(blobUrl => {',
'        _origFBX.call(this, blobUrl,',
'            obj => { if (onLoad) onLoad(obj); mgr.itemEnd(url); },',
'            onProgress,',
'            err => { if (onError) onError(err); mgr.itemError(url); mgr.itemEnd(url); }',
'        );',
'    }).catch(err => { mgr.itemError(url); mgr.itemEnd(url); if (onError) onError(err); });',
'};',
'',
'// Interceptar TextureLoader para usar Drive',
'const _origTex = THREE.TextureLoader.prototype.load;',
'THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {',
'    if (url.startsWith("blob:") || url.startsWith("data:")) return _origTex.call(this, url, onLoad, onProgress, onError);',
'    const tex = new THREE.Texture();',
'    const mgr = this.manager;',
'    mgr.itemStart(url);',
'    loadDriveAssetAsBlob(url).then(blobUrl => {',
'        const loader = new THREE.ImageLoader(mgr);',
'        loader.load(blobUrl,',
'            img => { tex.image = img; tex.needsUpdate = true; if (onLoad) onLoad(tex); mgr.itemEnd(url); },',
'            onProgress,',
'            err => { if (onError) onError(err); mgr.itemError(url); mgr.itemEnd(url); }',
'        );',
'    }).catch(err => { mgr.itemError(url); mgr.itemEnd(url); if (onError) onError(err); });',
'    return tex;',
'};',
].join('\n');

// ── Construir JS principal ────────────────────────────────────────────────────
let newJs = importLines.join('\n') + '\n\n' + driveLogic + '\n\nasync function initGlaymarApp() {\n' + otherLines.join('\n') + '\n}\n\n';

// ── Boton ENTRAR (anti-doble-click) ─────────────────────────────────────────
newJs += [
'let _appStarted = false;',
'function btnStartClicked() {',
'    if (_appStarted) return;',
'    _appStarted = true;',
'    const btn = document.getElementById("btn-main-start");',
'    if (btn) btn.style.display = "none";',
'    const pbc = document.querySelector(".progress-bar-container");',
'    const ltx = document.getElementById("loading-text");',
'    const ltmr = document.getElementById("loading-timer");',
'    const ldisc = document.getElementById("loading-disclaimer");',
'    if (pbc) pbc.style.display = "block";',
'    if (ltx) ltx.style.display = "block";',
'    if (ltmr) ltmr.style.display = "block";',
'    if (ldisc) ldisc.style.display = "block";',
'    updateProgress("Conectando con Google Drive...");',
'    if (typeof google !== "undefined" && google.script) {',
'        google.script.run',
'            .withSuccessHandler(data => {',
'                window.driveDictionary = data.dictionary;',
'                window.driveToken      = data.token;',
'                updateProgress("Conectado. Descargando assets 3D...");',
'                initGlaymarApp();',
'            })',
'            .withFailureHandler(err => { updateProgress("Error: " + err); _appStarted = false; })',
'            .getDriveFolderDictionary(FOLDER_ID);',
'    } else {',
'        updateProgress("Error: Ejecuta este archivo en Google Apps Script.");',
'    }',
'}',
'const _sb = document.getElementById("btn-main-start");',
'if (_sb) _sb.addEventListener("click", btnStartClicked);',
'window.btnStartClicked = btnStartClicked;',
].join('\n');

// ── Reemplazar reproductor HTML5 por reproductor data-URI ────────────────────
const PLAYER_REGEX = /function loadTrack\(index\) \{[\s\S]*?(?=const btnAutoDance = document\.getElementById)/;

const NEW_PLAYER = [
'function stopCurrentAudio() {',
'        if (currentAudioEl) {',
'            currentAudioEl.onended = null;',
'            currentAudioEl.onerror = null;',
'            currentAudioEl.pause();',
'            currentAudioEl.src = "";',
'            currentAudioEl.load();',
'            currentAudioEl = null;',
'        }',
'        audioIsPlaying = false;',
'    }',
'',
'    function loadTrack(index) {',
'        const songPath = playlist[index];',
'        const baseName = songPath.replace(".mp3", "");',
'        if (trackNameEl) trackNameEl.textContent = baseName + " (Cargando...)";',
'        stopCurrentAudio();',
'        const myGen = ++loadGeneration;',
'        const fileId = getDriveFileId("Musica/" + songPath);',
'        if (!fileId) {',
'            console.error("Sin fileId para:", songPath);',
'            if (trackNameEl) trackNameEl.textContent = baseName + " (no encontrado)";',
'            return Promise.resolve();',
'        }',
'        return new Promise((resolve, reject) => {',
'            google.script.run',
'                .withSuccessHandler(dataUri => {',
'                    if (myGen !== loadGeneration) { console.log("Obsoleto:", baseName); return; }',
'                    const audio = new Audio(dataUri);',
'                    audio.volume = volSlider ? parseFloat(volSlider.value) : 0.5;',
'                    audio.onended = function() {',
'                        audioIsPlaying = false;',
'                        if (btnPlay) btnPlay.textContent = "\u25B6";',
'                        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;',
'                        loadTrack(currentTrackIndex).then(() => {',
'                            if (currentAudioEl) {',
'                                currentAudioEl.play()',
'                                    .then(() => { audioIsPlaying = true; if (btnPlay) btnPlay.textContent = "\u23F8"; })',
'                                    .catch(console.error);',
'                            }',
'                        });',
'                    };',
'                    audio.onerror = function() {',
'                        if (audio.src && audio.src.length > 10)',
'                            console.error("Error audio:", baseName, audio.error);',
'                    };',
'                    currentAudioEl = audio;',
'                    if (trackNameEl) trackNameEl.textContent = baseName;',
'                    console.log("Lista:", baseName);',
'                    resolve();',
'                })',
'                .withFailureHandler(err => {',
'                    if (myGen !== loadGeneration) return;',
'                    console.error("Error cargando audio:", err);',
'                    if (trackNameEl) trackNameEl.textContent = baseName + " ❌";',
'                    reject(err);',
'                })',
'                .getAudioAsBase64(fileId);',
'        });',
'    }',
'',
'    function togglePlay() {',
'        if (!currentAudioEl) {',
'            if (trackNameEl) trackNameEl.textContent = "Espera a que cargue...";',
'            return;',
'        }',
'        if (!currentAudioEl.paused) {',
'            currentAudioEl.pause();',
'            audioIsPlaying = false;',
'            if (btnPlay) btnPlay.textContent = "\u25B6";',
'        } else {',
'            currentAudioEl.play()',
'                .then(() => { audioIsPlaying = true; if (btnPlay) btnPlay.textContent = "\u23F8"; })',
'                .catch(err => console.error("play() rechazado:", err));',
'        }',
'    }',
'',
'    if (btnPlay)  btnPlay.addEventListener("click", togglePlay);',
'    if (btnNext)  btnNext.addEventListener("click", () => {',
'        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;',
'        loadTrack(currentTrackIndex).then(() => {',
'            if (currentAudioEl)',
'                currentAudioEl.play().then(() => { audioIsPlaying = true; if (btnPlay) btnPlay.textContent = "\u23F8"; }).catch(console.error);',
'        });',
'    });',
'    if (btnPrev)  btnPrev.addEventListener("click", () => {',
'        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;',
'        loadTrack(currentTrackIndex).then(() => {',
'            if (currentAudioEl)',
'                currentAudioEl.play().then(() => { audioIsPlaying = true; if (btnPlay) btnPlay.textContent = "\u23F8"; }).catch(console.error);',
'        });',
'    });',
'    if (volSlider) volSlider.addEventListener("input", e => { if (currentAudioEl) currentAudioEl.volume = parseFloat(e.target.value); });',
'',
'    loadTrack(currentTrackIndex);',
'',
'    ',
].join('\n');

if (PLAYER_REGEX.test(newJs)) {
    newJs = newJs.replace(PLAYER_REGEX, NEW_PLAYER);
    console.log('OK: Reproductor data-URI inyectado.');
} else {
    console.log('ERROR: Pattern del reproductor no encontrado.');
}

// ── Efectos visuales: usar audioIsPlaying en vez de bgAudio.paused ───────────
newJs = newJs.replace(
    /const bgAudio = document\.getElementById\('bg-audio'\);\s*\n\s*if \(bgAudio && !bgAudio\.paused\)/g,
    'if (audioIsPlaying)'
);

// ── FPS Counter: inyectar variables antes de animate() ───────────────────────
// animate() en main.js no tiene sangria, por eso buscamos sin espacios
newJs = newJs.replace(
    'animate();\n',
    'let _fpsCount = 0;\nlet _fpsLast = performance.now();\n\nanimate();\n'
);

// ── FPS Counter: inyectar update antes de composer.render() al final de animate
newJs = newJs.replace(
    '    composer.render();\n}',
    [
    '    // FPS update cada 500ms',
    '    _fpsCount++;',
    '    const _fpsNow = performance.now();',
    '    if (_fpsNow - _fpsLast >= 500) {',
    '        const _fpsEl = document.getElementById("fps-counter");',
    '        if (_fpsEl) _fpsEl.textContent = "FPS: " + Math.round(_fpsCount * 1000 / (_fpsNow - _fpsLast));',
    '        _fpsCount = 0; _fpsLast = _fpsNow;',
    '    }',
    '',
    '    composer.render();',
    '}',
    ].join('\n    ')
);

// ── Grabación con audio: capturar audio del <audio> activo ───────────────────
newJs = newJs.replace(
    'const stream = renderer.domElement.captureStream(60); // 60 FPS',
    [
    '// Stream de video del canvas 3D',
    '                const videoStream = renderer.domElement.captureStream(60);',
    '                // Combinar con audio del elemento activo si es posible',
    '                let stream = videoStream;',
    '                if (currentAudioEl && typeof currentAudioEl.captureStream === "function") {',
    '                    try {',
    '                        const aStream  = currentAudioEl.captureStream();',
    '                        const aTracks  = aStream.getAudioTracks();',
    '                        if (aTracks.length > 0) {',
    '                            stream = new MediaStream([...videoStream.getVideoTracks(), ...aTracks]);',
    '                            console.log("Grabando: video + audio");',
    '                        }',
    '                    } catch (e) { console.warn("Audio capture no disponible:", e.message); }',
    '                }',
    ].join('\n')
);

// ── Fotos desde Drive ────────────────────────────────────────────────────────
const mockPhotosFetch = [
'Promise.resolve({',
'    json: () => {',
'        const fotos = Object.keys(window.driveDictionary)',
'            .filter(p => p.toLowerCase().startsWith("fotos/"))',
'            .map(p => p.substring(6));',
'        return Promise.resolve(fotos);',
'    }',
'})',
].join('\n');

newJs = newJs.replace(/fetch\('\/api\/photos'\)/g, mockPhotosFetch);
newJs = newJs.replace(
    /currentBg\.style\.backgroundImage\s*=\s*`url\('\.\/Fotos\/\$\{photos\[idx\]\}'\)`/g,
    'loadDriveAssetAsBlob("Fotos/" + photos[idx]).then(url => { currentBg.style.backgroundImage = "url(\'" + url + "\')"; }).catch(console.error)'
);
newJs = newJs.replace(
    /nextBg\.style\.backgroundImage\s*=\s*`url\('\.\/Fotos\/\$\{photos\[nextIdx\]\}'\)`/g,
    'loadDriveAssetAsBlob("Fotos/" + photos[nextIdx]).then(url => { nextBg.style.backgroundImage = "url(\'" + url + "\')"; }).catch(console.error)'
);

// ── Ensamblar HTML final ─────────────────────────────────────────────────────
let finalHtml = html
    .replace(/<link[^>]*href="\.\/style\.css"[^>]*>/g, '')
    .replace(/<script[^>]*src="\.\/main\.js"[^>]*><\/script>/g, '');

// Mostrar fps-counter cuando la UI se revela (despues de loadingManager.onLoad)
newJs = newJs.replace(
    "uiMenu.style.display = 'block';",
    "uiMenu.style.display = 'block'; const _fpsDisplay=document.getElementById('fps-counter'); if(_fpsDisplay)_fpsDisplay.style.display='block';"
);

// Inyectar FPS div (fuera de loading-screen) y boton ENTRAR (SIN onclick para evitar doble disparo)
const FPS_DIV = '<div id="fps-counter" style="position:fixed;top:10px;left:10px;z-index:9999;background:rgba(0,0,0,0.6);color:#ffd700;font-family:monospace;font-size:14px;font-weight:bold;padding:4px 10px;border-radius:6px;pointer-events:none;display:none;text-shadow: 0 0 5px rgba(255,215,0,0.8);">FPS: --</div>';
const ENTER_BTN = '<button id="btn-main-start" style="margin-top:20px;padding:15px 50px;font-size:1.5rem;font-weight:bold;font-family:sans-serif;background:transparent;color:#ffd700;border:2px solid #ffd700;border-radius:30px;cursor:pointer;text-transform:uppercase;box-shadow:0 0 15px rgba(255,215,0,0.4);transition:all 0.3s ease;" onmouseover="this.style.background=\'#ffd700\';this.style.color=\'#3b0013\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'#ffd700\'">ENTRAR AL SIMULADOR</button>';

finalHtml = finalHtml.replace(
    '<body>',
    '<body>\n' + FPS_DIV
);
finalHtml = finalHtml.replace(
    '<div class="progress-bar-container">',
    ENTER_BTN + '\n<div class="progress-bar-container" style="display:none;">'
);
finalHtml = finalHtml.replace('<p id="loading-text">', `<p id="loading-text" style="display:none; margin-bottom: 5px;">`);
finalHtml = finalHtml.replace('Cargando la magia... 0%</p>', `Cargando la magia... 0%</p>
<p id="loading-timer" style="display:none; color: #ffeb3b; font-size: 1rem; margin-bottom: 10px; font-weight: bold; text-shadow: 1px 1px 2px #000;">Tiempo de carga: 0s</p>
<p id="loading-disclaimer" style="display:none; font-size: 0.8rem; color: #eee; max-width: 450px; margin: 0 auto; line-height: 1.4; text-shadow: 1px 1px 2px #000; text-align: center;">
La carga puede demorar dependiendo del peso de los recursos 3D y puede variar según la velocidad de su red y las configuraciones de su dispositivo.
</p>`);

// ── Importmap + CSS + JS ─────────────────────────────────────────────────────
const IMPORTMAP = [
'<script type="importmap">',
'  {',
'    "imports": {',
'      "three": "https://unpkg.com/three@0.185.1/build/three.module.js",',
'      "three/addons/": "https://unpkg.com/three@0.185.1/examples/jsm/",',
'      "three/examples/jsm/": "https://unpkg.com/three@0.185.1/examples/jsm/"',
'    }',
'  }',
'</script>',
'<style>',
css,
'</style>',
].join('\n');

const fullOutput = finalHtml
    .replace('</head>', IMPORTMAP + '\n</head>')
    .replace('</body>', '<script type="module">\n' + newJs + '\n</script>\n</body>');

fs.writeFileSync(path.join(__dirname, 'Index.html'), fullOutput);

// ── Verificar features ────────────────────────────────────────────────────────
console.log('');
[
    ['FPS counter HTML',         fullOutput.includes('fps-counter')],
    ['FPS vars in JS',           fullOutput.includes('let _fpsCount = 0')],
    ['FPS per-frame update',     fullOutput.includes('_fpsCount++')],
    ['Audio recording capture',  fullOutput.includes('videoStream.getVideoTracks()')],
    ['Audio data-URI player',    fullOutput.includes('getAudioAsBase64')],
    ['Anti-double-click guard',  fullOutput.includes('_appStarted')],
].forEach(([k, v]) => console.log((v ? 'OK' : 'FAIL') + ': ' + k));

console.log('\nBuild completo: Index.html con FPS counter + grabacion con audio.');

