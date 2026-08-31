javascript:(function(){
if(document.getElementById('twProPainterPanel')) document.getElementById('twProPainterPanel').remove();

const sOff='tw_painted_off_v32', 
      sOffDead='tw_painted_off_dead_v32', 
      sDef='tw_painted_def_v32', 
      sDefDead='tw_painted_def_dead_v32', 
      sTower='tw_painted_tower_v32',
      sUnknown='tw_painted_unknown_v32', 
      sCache='tw_painted_cache_v32';

function getStored(k){try{const d=localStorage.getItem(k);return d?JSON.parse(d):{};}catch(e){return{};}}
function saveStored(k,d){try{localStorage.setItem(k,JSON.stringify(d));}catch(e){}}

const p=document.createElement('div');
p.id='twProPainterPanel';
p.style.cssText='position:fixed;top:60px;right:10px;z-index:999999;background:#f4e4bc;border:3px solid #7d510f;border-radius:6px;padding:8px;width:340px;font-family:Verdana,Arial;font-size:11px;color:#333;box-shadow:0 4px 15px rgba(0,0,0,0.5);max-height:90vh;overflow-y:auto;';
p.innerHTML='<h3 style="margin:0 0 6px 0;color:#7d510f;text-align:center;font-size:12px;border-bottom:1px solid #bc9a63;padding-bottom:4px;font-weight:bold;">⚔️ TW Pro: Менеджер карты</h3>'+
'<div style="display:flex; background:#dcc293; border:1px solid #7d510f; margin-bottom:8px; border-radius:3px;">'+
    '<button id="tab-p-painter" style="flex:1; padding:5px; background:#f4e4bc; border:none; font-weight:bold; cursor:pointer; font-size:10px; border-right:1px solid #bc9a63;">🎨 Покраска</button>'+
    '<button id="tab-p-scanner" style="flex:1; padding:5px; background:#dcc293; border:none; font-weight:bold; cursor:pointer; font-size:10px; color:#555;">🔍 Сканер</button>'+
'</div>'+
'<div id="pane-painter" style="display:flex; flex-direction:column; gap:6px;">'+
    '<div style="background:#fffbe8;padding:6px;border:1px solid #e2d4b7;border-radius:4px;">'+
      '<div style="display:flex;gap:4px;margin-bottom:4px;"><button id="twPaintNowBtn" style="flex:1;padding:5px;background:#5b3511;color:#fff;border:1px solid #3c2007;border-radius:3px;font-weight:bold;cursor:pointer;font-size:11px;">🎨 Обновить покраску карты</button></div>'+
      '<div style="display:flex;gap:4px;"><button id="twClearCacheBtn" style="flex:1;padding:3px;background:#b7950b;color:#fff;border:1px solid #000;border-radius:3px;font-weight:bold;cursor:pointer;font-size:10px;">Очистить кэш</button><button id="twClearBtn" style="padding:3px 6px;background:#a93226;color:#fff;border:1px solid #000;border-radius:3px;font-weight:bold;cursor:pointer;font-size:10px;">Сброс</button></div>'+
    '</div>'+
    '<div style="border:1px solid #ff8a80;background:#ffe5e5;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#8e1b1b;font-size:10px;">🔴 Офф (<span id="twCountOff">0</span>):</label><textarea id="twCoordsListOff" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border:1px solid #fbc02d;background:#fffde7;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#f57f17;font-size:10px;">🟡 Офф слит (<span id="twCountOffDead">0</span>):</label><textarea id="twCoordsListOffDead" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border:1px solid #81c784;background:#e6f4ea;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#2e7d32;font-size:10px;">🟢 Дефф (<span id="twCountDef">0</span>):</label><textarea id="twCoordsListDef" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border:1px solid #00e676;background:#e8f5e9;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#00c853;font-size:10px;">🟢 Дефф слит (<span id="twCountDefDead">0</span>):</label><textarea id="twCoordsListDefDead" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border:1px solid #ffb74d;background:#fff3e0;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#e65100;font-size:10px;">🟠 Башня (<span id="twCountTower">0</span>):</label><textarea id="twCoordsListTower" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border:1px solid #90caf9;background:#e3f2fd;padding:4px;border-radius:3px;"><label style="font-weight:bold;color:#1565c0;font-size:10px;">❓ Неизвестные / Другое (<span id="twCountUnknown">0</span>):</label><textarea id="twCoordsListUnknown" style="width:100%;height:22px;font-size:9px;"></textarea></div>'+
    '<div style="border-top:1px dashed #7d510f;padding-top:4px;">'+
      '<button id="collect-all-notes-btn" style="width:100%;padding:5px;background:#5b3511;color:white;border:1px solid #3c2007;border-radius:3px;font-weight:bold;cursor:pointer;margin-bottom:4px;font-size:10px;">📥 Снять со ВСЕХ страниц заметок</button>'+
      '<select id="player-select" size="2" style="width:100%;padding:2px;border:1px solid #bc9a63;font-size:9px;background:#fff;margin-bottom:3px;"><option value="">Выберите игрока...</option></select>'+
      '<div style="display:flex;gap:4px;"><input type="text" id="manual-player-id" placeholder="ID" style="width:50px;padding:2px;font-size:9px;border:1px solid #bc9a63;"><button type="button" id="copy-notes-btn" style="flex:1;padding:3px;background:#7d510f;color:white;border:none;border-radius:3px;cursor:pointer;font-weight:bold;font-size:9px;">📥 Загрузить чужие заметки</button></div>'+
      '<div id="copy-status" style="font-size:9px;margin-top:2px;text-align:center;font-weight:bold;color:#5b3511;">Готов к работе</div>'+
    '</div>'+
'</div>'+
'<div id="pane-scanner" style="display:none; flex-direction:column; gap:6px;">'+
    '<div style="background:#e8d3a2; padding:6px; border:1px solid #bc9a63; border-radius:4px; font-size:10px;">'+
        '<div style="display:flex; gap:4px; margin-bottom:4px; align-items:center;">'+
            'Рамка: <select id="sc-size" style="padding:2px; font-size:10px;"><option value="10">10x10</option><option value="20" selected>20x20</option><option value="30">30x30</option></select>'+
            '<button id="sc-run" style="flex:1; background:#5b3511; color:#fff; border:none; padding:4px; font-weight:bold; cursor:pointer; border-radius:3px;">Сканировать</button>'+
        '</div>'+
        '<div style="display:flex; gap:4px;"><button id="sc-copy" style="flex:1; background:#5b3511; color:#fff; border:none; padding:4px; font-weight:bold; cursor:pointer; font-size:9px; border-radius:3px;">Копировать</button><button id="sc-csv" style="flex:1; background:#2e6b35; color:#fff; border:none; padding:4px; font-weight:bold; cursor:pointer; font-size:9px; border-radius:3px;">CSV</button></div>'+
        '<div id="sc-count" style="margin-top:4px; font-weight:bold; text-align:center;">Найдено: 0</div>'+
    '</div>'+
    '<div style="max-height:150px; overflow-y:auto; background:#fff; border:1px solid #bc9a63; border-radius:3px;"><table id="sc-table" style="width:100%; border-collapse:collapse; font-size:9px;"><tbody id="sc-tbody"><tr><td style="text-align:center; padding:10px;">Пусто</td></tr></tbody></table></div>'+
'</div>'+
'<div style="text-align:right; margin-top:6px; border-top:1px solid #bc9a63; padding-top:4px;"><span id="twClosePanel" style="cursor:pointer;color:#a93226;font-size:10px;text-decoration:underline;font-weight:bold;">Закрыть панель</span></div>';
document.body.appendChild(p);

document.getElementById('tab-p-painter').onclick = function(){
    document.getElementById('pane-painter').style.display='flex';
    document.getElementById('pane-scanner').style.display='none';
};
document.getElementById('tab-p-scanner').onclick = function(){
    document.getElementById('pane-painter').style.display='none';
    document.getElementById('pane-scanner').style.display='flex';
};
document.getElementById('twClosePanel').onclick = () => p.remove();

function updateAreas(){
    const o = getStored(sOff), od = getStored(sOffDead), d = getStored(sDef), dd = getStored(sDefDead), t = getStored(sTower), un = getStored(sUnknown);
    document.getElementById('twCoordsListOff').value = Object.keys(o).join(' ');
    document.getElementById('twCountOff').textContent = Object.keys(o).length;
    document.getElementById('twCoordsListOffDead').value = Object.keys(od).join(' ');
    document.getElementById('twCountOffDead').textContent = Object.keys(od).length;
    document.getElementById('twCoordsListDef').value = Object.keys(d).join(' ');
    document.getElementById('twCountDef').textContent = Object.keys(d).length;
    document.getElementById('twCoordsListDefDead').value = Object.keys(dd).join(' ');
    document.getElementById('twCountDefDead').textContent = Object.keys(dd).length;
    document.getElementById('twCoordsListTower').value = Object.keys(t).join(' ');
    document.getElementById('twCountTower').textContent = Object.keys(t).length;
    document.getElementById('twCoordsListUnknown').value = Object.keys(un).join(' ');
    document.getElementById('twCountUnknown').textContent = Object.keys(un).length;
}
updateAreas();

document.getElementById('twClearBtn').onclick = () => {
    if(confirm('Очистить базы данных?')){
        localStorage.removeItem(sOff); localStorage.removeItem(sOffDead);
        localStorage.removeItem(sDef); localStorage.removeItem(sDefDead);
        localStorage.removeItem(sTower); localStorage.removeItem(sUnknown);
        localStorage.removeItem(sCache);
        updateAreas();
    }
};

document.getElementById('twClearCacheBtn').onclick = () => {
    localStorage.removeItem(sCache);
    if(/screen=map/i.test(document.URL)) paintMap();
    alert('Кэш очищен!');
};

function parseCoord(text) {
    const m = text.match(/(\d{3}\|\d{3})/);
    return m ? m[1] : null;
}

function parseNotesFromDocument(doc, offObj, offDeadObj, defObj, defDeadObj, towerObj, unknownObj) {
    const rows = Array.from(doc.querySelectorAll('table.overview_table tbody tr'));
    rows.forEach(row => {
        const villageCell = row.querySelector('td:nth-child(1)');
        const noteBody = row.querySelector('.village-note-body');
        if (!villageCell || !noteBody) return;
        const coord = parseCoord(villageCell.textContent.trim());
        if (!coord) return;
        const noteBB = (noteBody.getAttribute('data-note-bb') || noteBody.textContent || '').toUpperCase().trim();

        delete offObj[coord]; delete offDeadObj[coord];
        delete defObj[coord]; delete defDeadObj[coord];
        delete towerObj[coord]; delete unknownObj[coord];

        if (!noteBB) return; // Пустые заметки пропускаем

        const isDead = noteBB.includes('СЛИТ') || noteBB.includes('ПОГИБ') || noteBB.includes('УБИТ') || noteBB.includes('МИНУС');
        const isTower = noteBB.includes('БАШНЯ') || noteBB.includes('TOWER');
        const isOff = noteBB.includes('ОФФ') || noteBB.includes('ОФ') || noteBB.includes('OFF');
        const isDef = noteBB.includes('ДЕФФ') || noteBB.includes('ДЕФ') || noteBB.includes('DEF');

        if (isTower) towerObj[coord] = '#ffa500';
        else if (isOff && isDead) offDeadObj[coord] = '#ffeb3b';
        else if (isOff) offObj[coord] = '#ff0000';
        else if (isDef && isDead) defDeadObj[coord] = '#00e676';
        else if (isDef) defObj[coord] = '#008000';
        else unknownObj[coord] = '#2196f3'; // Неизвестные/другие заметки попадают сюда
    });
}

async function fetchPage(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    const text = await res.text();
    return new DOMParser().parseFromString(text, 'text/html');
}

async function collectAllNotes() {
    const startUrl = window.location.href;
    const visited = new Set([startUrl]);
    const o = getStored(sOff), od = getStored(sOffDead), d = getStored(sDef), dd = getStored(sDefDead), t = getStored(sTower), un = getStored(sUnknown);
    parseNotesFromDocument(document, o, od, d, dd, t, un);

    const queue = [];
    document.querySelectorAll('a.paged-nav-item').forEach(a => {
        const href = a.getAttribute('href');
        if(href) {
            const fullUrl = new URL(href, window.location.origin).toString();
            if(!visited.has(fullUrl)) { visited.add(fullUrl); queue.push(fullUrl); }
        }
    });

    let donePages = 1, totalPages = queue.length + 1;
    for(let url of queue) {
        const st = document.getElementById('copy-status');
        if(st) st.textContent = `Сбор: ${++donePages}/${totalPages}`;
        try {
            const doc = await fetchPage(url);
            parseNotesFromDocument(doc, o, od, d, dd, t, un);
        } catch(e) {}
    }
    saveStored(sOff, o); saveStored(sOffDead, od); saveStored(sDef, d); saveStored(sDefDead, dd); saveStored(sTower, t); saveStored(sUnknown, un);
    updateAreas();
}

document.getElementById('collect-all-notes-btn').onclick = async function() {
    if(!/screen=notes/i.test(document.URL)){ alert('Перейдите на страницу заметок!'); return; }
    this.disabled = true; this.textContent = '⏳ Сбор...';
    try {
        await collectAllNotes();
        document.getElementById('copy-status').textContent = 'Готово!';
        alert('Все заметки собраны!');
        if(/screen=map/i.test(document.URL)) paintMap();
    } finally {
        this.disabled = false; this.textContent = '📥 Снять со ВСЕХ страниц заметок';
    }
};

async function loadList(){
    const sel = document.getElementById('player-select');
    if(!sel) return;
    try {
        const vId = window.game_data ? window.game_data.village.id : '1';
        const res = await fetch(`/game.php?village=${vId}&screen=notes&mode=ally`, {credentials: 'same-origin'});
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const fs = doc.querySelector('#friend-change-select');
        if(fs){
            sel.innerHTML = '<option value="">Выберите игрока...</option>';
            fs.querySelectorAll('option').forEach(o => {
                if(o.value && o.value !== '0'){
                    const opt = document.createElement('option');
                    opt.value = o.value;
                    opt.textContent = o.textContent;
                    sel.appendChild(opt);
                }
            });
        }
    } catch(e) {}
}
setTimeout(loadList, 300);

document.getElementById('player-select').onchange = function(){
    if(this.value) document.getElementById('manual-player-id').value = this.value;
};

// Загрузка чужих заметок со ВСЕХ страниц игрока
document.getElementById('copy-notes-btn').onclick = async function(){
    const mId = document.getElementById('manual-player-id').value.trim() || document.getElementById('player-select').value;
    if(!mId){ alert('Укажите ID игрока!'); return; }
    const st = document.getElementById('copy-status');
    st.textContent = '⏳ Загрузка 1-й стр...';
    try {
        const vId = window.game_data ? window.game_data.village.id : '1';
        const firstUrl = window.location.origin + `/game.php?village=${vId}&screen=notes&mode=ally&player=${mId}`;
        const firstDoc = await fetchPage(firstUrl);
        
        const o = getStored(sOff), od = getStored(sOffDead), d = getStored(sDef), dd = getStored(sDefDead), t = getStored(sTower), un = getStored(sUnknown);
        parseNotesFromDocument(firstDoc, o, od, d, dd, t, un);

        const visited = new Set([firstUrl]);
        const queue = [];
        firstDoc.querySelectorAll('a.paged-nav-item').forEach(a => {
            const href = a.getAttribute('href');
            if(href) {
                const fullUrl = new URL(href, window.location.origin).toString();
                if(!visited.has(fullUrl)) { visited.add(fullUrl); queue.push(fullUrl); }
            }
        });

        let donePages = 1, totalPages = queue.length + 1;
        for(let url of queue) {
            st.textContent = `Страницы: ${++donePages}/${totalPages}`;
            try {
                const doc = await fetchPage(url);
                parseNotesFromDocument(doc, o, od, d, dd, t, un);
            } catch(e) {}
        }

        saveStored(sOff, o); saveStored(sOffDead, od); saveStored(sDef, d); saveStored(sDefDead, dd); saveStored(sTower, t); saveStored(sUnknown, un);
        updateAreas();
        st.textContent = '✅ Загружено!';
        if(/screen=map/i.test(document.URL)) paintMap();
        alert(`Заметки игрока успешно загружены со всех страниц (${totalPages} шт.)!`);
    } catch(e){
        st.textContent = '❌ Ошибка';
        alert('Ошибка при загрузке страниц игрока.');
    }
};

function paintMap(){
    if(!/screen=map/i.test(document.URL)) return;
    if(typeof MapSdk === 'undefined'){
        $.getScript('https://shinko-to-kuma.com/scripts/mapSdk.js', function(){ setTimeout(paintMap, 300); });
        return;
    }
    MapSdk.init();
    MapSdk.circles = [];
    const o = getStored(sOff), od = getStored(sOffDead), d = getStored(sDef), dd = getStored(sDefDead), t = getStored(sTower), un = getStored(sUnknown), cache = getStored(sCache);
    
    for(let c in o) cache[c] = '#ff0000';
    for(let c in od) cache[c] = '#ffeb3b';
    for(let c in d) cache[c] = '#008000';
    for(let c in dd) cache[c] = '#00e676';
    for(let c in t) cache[c] = '#ffa500';
    for(let c in un) cache[c] = '#2196f3';
    saveStored(sCache, cache);

    for(let coord in cache){
        const [x, y] = coord.split('|');
        const color = cache[coord];
        let fill = color === '#ffeb3b' ? 'rgba(255, 235, 59, 0.75)' : (color === '#008000' ? 'rgba(0, 128, 0, 0.75)' : (color === '#00e676' ? 'rgba(0, 230, 118, 0.75)' : (color === '#ffa500' ? 'rgba(255, 165, 0, 0.85)' : (color === '#2196f3' ? 'rgba(33, 150, 243, 0.75)' : 'rgba(255, 0, 0, 0.75)'))));
        MapSdk.circles.push({
            x: x, y: y, radius: 0.3,
            styling: { main: { strokeStyle: '#000', lineWidth: 1, fillStyle: fill }, mini: { strokeStyle: '#000', lineWidth: 1, fillStyle: fill } },
            drawOnMini: true, drawOnMap: true, markCircleOrigin: false
        });
    }
    if(MapSdk.mapOverlay && typeof MapSdk.mapOverlay.reload === 'function') MapSdk.mapOverlay.reload();
}

document.getElementById('twPaintNowBtn').onclick = () => paintMap();
if(/screen=map/i.test(document.URL)){
    $.getScript('https://shinko-to-kuma.com/scripts/mapSdk.js', function(){ setTimeout(paintMap, 400); });
}

let scannedData = [];
document.getElementById('sc-run').onclick = function(){
    if(!/screen=map/i.test(document.URL)){ alert('Откройте карту!'); return; }
    scannedData = [];
    if(typeof TWMap !== 'undefined' && TWMap.villages && TWMap.map){
        let w = $('#map_container, #map').width() || 750, h = $('#map_container, #map').height() || 500;
        let cCoord = TWMap.map.coordByPixel ? TWMap.map.coordByPixel(TWMap.map.pos[0] + w/2, TWMap.map.pos[1] + h/2) : null;
        if(!cCoord) return;
        let half = Math.floor((parseInt(document.getElementById('sc-size').value) || 20)/2);
        let temp = {};
        for(let x=cCoord[0]-half; x<=cCoord[0]+half; x++){
            for(let y=cCoord[1]-half; y<=cCoord[1]+half; y++){
                let v = TWMap.villages[x+''+y] || TWMap.villages[''+x+(y<100?(y<10?'00'+y:'0'+y):y)];
                if(v){
                    let coord = x+'|'+y;
                    if(!temp[coord]){
                        temp[coord]=true;
                        scannedData.push({coords: coord, points: parseInt(v.points || v.punt)||0, player: (v.owner && TWMap.players && TWMap.players[v.owner]) ? TWMap.players[v.owner].name : 'Барбарка'});
                    }
                }
            }
        }
    }
    let tbody = document.getElementById('sc-tbody');
    tbody.innerHTML = scannedData.length ? scannedData.map(i=>`<tr><td style="border:1px solid #ddd;padding:2px;"><b>${i.coords}</b></td><td style="border:1px solid #ddd;padding:2px;">${i.points}</td><td style="border:1px solid #ddd;padding:2px;">${i.player}</td></tr>`).join('') : '<tr><td style="text-align:center;padding:10px;">Ничего не найдено</td></tr>';
    document.getElementById('sc-count').textContent = 'Найдено: ' + scannedData.length;
};
document.getElementById('sc-copy').onclick = () => { if(scannedData.length) navigator.clipboard.writeText(scannedData.map(i=>i.coords).join(' ')).then(()=>alert('Скопировано!')); };
document.getElementById('sc-csv').onclick = () => {
    if(!scannedData.length) return;
    let blob = new Blob(["\uFEFFКоординаты;Очки;Игрок\n" + scannedData.map(i=>`${i.coords};${i.points};${i.player}`).join('\n')], { type: 'text/csv;charset=utf-8;' });
    let a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'map.csv'; a.click();
};
})();
