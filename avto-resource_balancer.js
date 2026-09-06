(function(){
    if (typeof game_data === 'undefined') {
        alert("Ошибка: скрипт запущен вне игры!");
        return;
    }

    let loadVal = (k, def) => {
        try { return localStorage.getItem('tw_snipe_'+k) !== null ? localStorage.getItem('tw_snipe_'+k) : def; } catch(e) { return def; }
    };
    let saveVal = (k, v) => {
        try { localStorage.setItem('tw_snipe_'+k, v); } catch(e) {}
    };

    let screen = game_data.screen;
    let isAutoActive = localStorage.getItem('tw_snipe_autorun') === 'true';

    // 0. АВТО-ИНЪЕКЦИЯ НА ПЛОЩАДИ ПРИ ВКЛЮЧЕННОМ ПУСКЕ
    if (screen === 'place' && isAutoActive && !window.tw_snipe_auto_inited) {
        window.tw_snipe_auto_inited = true;
        runPlaceAutomation();
    }

    // 1. ЕСЛИ МЫ НА ЭКРАНЕ ПОДТВЕРЖДЕНИЯ АТАКИ
    let btnConfirm = document.getElementById('troop_confirm_submit') || document.getElementById('btn_submit');
    if (btnConfirm) {
        let targetTimeMs = parseInt(localStorage.getItem('tw_snipe_active_target_time') || '0', 10);
        
        function waitAndClickConfirm(){
            let now = new Date().getTime();
            let diff = targetTimeMs - now;
            if (diff <= 50) {
                let savedList = JSON.parse(localStorage.getItem('tw_snipe_plan_list') || '[]');
                if (savedList.length > 0) {
                    savedList.shift();
                    localStorage.setItem('tw_snipe_plan_list', JSON.stringify(savedList));
                }
                localStorage.removeItem('tw_snipe_active_target_time');
                btnConfirm.click();
            } else {
                setTimeout(waitAndClickConfirm, 5);
            }
        }
        
        if (targetTimeMs > 0) {
            waitAndClickConfirm();
        } else {
            btnConfirm.click();
        }
        return;
    }

    // Функция автоматизации на площади
    function runPlaceAutomation() {
        let urlParams = new URLSearchParams(window.location.search);
        let targetX = urlParams.get('x');
        let targetY = urlParams.get('y');

        if (targetX && targetY) {
            let attempts = 0;
            let fillInterval = setInterval(function(){
                attempts++;
                let xInput = document.querySelector('input[name="x"]');
                if (xInput || attempts > 100) {
                    clearInterval(fillInterval);
                    ['x', 'y'].forEach(coordName => {
                        let inp = document.querySelector('input[name="' + coordName + '"]');
                        if (inp && typeof window.jQuery !== 'undefined') {
                            window.jQuery(inp).val(coordName === 'x' ? targetX : targetY).trigger('change').trigger('input').trigger('blur');
                        } else if (inp) {
                            inp.value = coordName === 'x' ? targetX : targetY;
                        }
                    });

                    let unitsList = ['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','knight','snob'];
                    unitsList.forEach(u => {
                        let val = urlParams.get('u_'+u);
                        if (val && val !== '0') {
                            let inputEl = document.getElementById('unit_input_' + u);
                            if (inputEl) {
                                if (typeof window.jQuery !== 'undefined') {
                                    window.jQuery(inputEl).val(val).trigger('input').trigger('change').trigger('keyup');
                                } else {
                                    inputEl.value = val;
                                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                                    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            }
                        }
                    });

                    let sdParam = urlParams.get('target_time');
                    if (sdParam) {
                        localStorage.setItem('tw_snipe_active_target_time', sdParam);
                    }

                    setTimeout(() => {
                        let btnAttack = document.querySelector('#target_attack') || document.querySelector('#btn_attack') || document.querySelector('input.btn-attack');
                        if (btnAttack) {
                            btnAttack.click();
                        }
                    }, 250);
                }
            }, 30);
        }
    }

    // 2. ЕСЛИ МЫ НА СТРАНИЦЕ ПЛОЩАДИ (Обычный запуск или ручной переход)
    if (screen === 'place') {
        runPlaceAutomation();

        // Авто-фоновый цикл переходов к следующей деревне из списка
        if (isAutoActive) {
            let autoInterval = setInterval(function(){
                let savedList = JSON.parse(localStorage.getItem('tw_snipe_plan_list') || '[]');
                let now = new Date().getTime();
                
                savedList = savedList.filter(item => (new Date(item.sendDate).getTime() - now) >= -5000);
                localStorage.setItem('tw_snipe_plan_list', JSON.stringify(savedList));

                if (savedList.length === 0) {
                    localStorage.setItem('tw_snipe_autorun', 'false');
                    clearInterval(autoInterval);
                    return;
                }

                let nextItem = savedList[0];
                let sd = new Date(nextItem.sendDate).getTime();
                let diffSec = Math.floor((sd - now) / 1000);

                if (diffSec <= 20 && diffSec >= -2) {
                    let currentVillageId = game_data.village.id;
                    if (String(currentVillageId) !== String(nextItem.village.id)) {
                        clearInterval(autoInterval);
                        let placeParams = [];
                        if (typeof game_data.player.sitter !== 'undefined' && game_data.player.sitter > 0) placeParams.push('t=' + game_data.player.id);
                        placeParams.push('village=' + nextItem.village.id);
                        placeParams.push('screen=place');
                        placeParams.push('x=' + nextItem.target.x);
                        placeParams.push('y=' + nextItem.target.y);
                        placeParams.push('target_time=' + sd);
                        
                        Object.keys(nextItem.units).forEach(u => {
                            if (nextItem.units[u] > 0) placeParams.push('u_' + u + '=' + nextItem.units[u]);
                        });

                        window.location.href = 'game.php?' + placeParams.join('&');
                    }
                }
            }, 500);
        }
    }

    // 3. ПАНЕЛЬ УПРАВЛЕНИЯ
    let p = document.getElementById('twSnipe');
    if (p) {
        p.style.display = p.style.display === 'none' ? 'block' : 'none';
        return;
    }

    let srvDate = document.getElementById('serverDate') ? document.getElementById('serverDate').innerText : '06.09.2026';
    let container = document.createElement('div');
    container.id = 'twSnipe';
    container.style.cssText = 'position:fixed; top:60px; right:20px; z-index:999999; background:#f4ebd0; border:3px solid #804000; border-radius:8px; padding:10px; width:440px; max-height:90vh; overflow-y:auto; font-family:Arial; color:#333;';
    
    container.innerHTML = 
        '<h4 style="margin:0 0 8px 0;color:#804000;text-align:center;font-size:14px;font-weight:bold;">Масс-Снайп (Панель управления)</h4>'+
        '<div style="margin-bottom:6px;"><b style="font-size:11px;">Координаты целей (массив):</b><br>'+
        '<textarea id="snipeCoord" placeholder="500|400 501|401" style="width:100%;height:45px;box-sizing:border-box;font-size:11px;padding:2px;">'+loadVal('coord','')+'</textarea></div>'+
        
        '<div style="display:flex;gap:6px;margin-bottom:6px;">'+
            '<div style="flex:1;"><span style="font-size:10px;font-weight:bold;">Атак на 1 цель:</span><br><input type="number" id="attacksPerTarget" value="'+loadVal('attacksPerTarget',1)+'" min="1" style="width:100%;font-size:11px;text-align:center;"></div>'+
            '<div style="flex:1;"><span style="font-size:10px;font-weight:bold;">Атак с 1 источника:</span><br><input type="number" id="attacksPerSource" value="'+loadVal('attacksPerSource',1)+'" min="1" style="width:100%;font-size:11px;text-align:center;"></div>'+
        '</div>'+

        '<div style="margin-bottom:6px;background:#fae1bc;padding:6px;border-radius:4px;border:1px solid #dfcca6;">'+
            '<label style="font-size:11px;font-weight:bold;cursor:pointer;"><input type="checkbox" id="useRange" '+(loadVal('useRange','false')==='true'?'checked':'')+'> Искать в диапазоне времени</label>'+
            '<div style="display:flex;justify-content:space-between;margin-top:4px;">'+
                '<div style="width:48%;"><span style="font-size:10px;">С (От):</span><br><input type="text" id="snipeTimeFrom" value="'+loadVal('timeFrom','14:55:00')+'" style="width:100%;font-size:11px;text-align:center;"></div>'+
                '<div style="width:48%;"><span style="font-size:10px;">По (До):</span><br><input type="text" id="snipeTimeTo" value="'+loadVal('timeTo','15:05:00')+'" style="width:100%;font-size:11px;text-align:center;"></div>'+
            '</div>'+
            '<div style="margin-top:4px;"><span style="font-size:10px;">Точное время / Базовое:</span><br><input type="text" id="snipeTime" value="'+loadVal('time','15:00:00')+'" style="width:100%;font-size:11px;text-align:center;"></div>'+
        '</div>'+
        
        '<div style="margin-bottom:6px;"><b style="font-size:11px;">Дата (ДД.ММ.ГГГГ):</b><br><input type="text" id="snipeDate" value="'+loadVal('date',srvDate)+'" style="width:100%;font-size:11px;text-align:center;"></div>'+
        '<div style="margin-bottom:6px;"><b style="font-size:11px;">Основной юнит (самый медленный):</b><br><select id="snipeUnit" style="width:100%;font-size:11px;"><option value="ram">Таран (30 мин/клетка)</option><option value="catapult">Катапульта (30 мин/клетка)</option><option value="snob">Дворянин (35 мин/клетка)</option><option value="light">ЛК (10 мин/клетка)</option><option value="axe">Топор/Меч/Копье (18 мин/клетка)</option></select></div>'+
        
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px;font-size:10px;text-align:center;">'+
        '<div>Коп: <input type="number" id="uSpear" value="'+loadVal('u_spear',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Меч: <input type="number" id="uSword" value="'+loadVal('u_sword',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Топор: <input type="number" id="uAxe" value="'+loadVal('u_axe',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Лук: <input type="number" id="uArcher" value="'+loadVal('u_archer',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Разв: <input type="number" id="uSpy" value="'+loadVal('u_spy',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>ЛК: <input type="number" id="uLight" value="'+loadVal('u_light',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>ЛКум: <input type="number" id="uMarcher" value="'+loadVal('u_marcher',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>ТК: <input type="number" id="uHeavy" value="'+loadVal('u_heavy',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Таран: <input type="number" id="uRam" value="'+loadVal('u_ram',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Ката: <input type="number" id="uCatapult" value="'+loadVal('u_catapult',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Паладин: <input type="number" id="uKnight" value="'+loadVal('u_knight',0)+'" style="width:100%;text-align:center;"></div>'+
        '<div>Дворянин: <input type="number" id="uSnob" value="'+loadVal('u_snob',0)+'" style="width:100%;text-align:center;"></div>'+
        '</div>'+
        
        '<div style="display:flex;gap:4px;margin-bottom:4px;">'+
            '<button id="snipeCalc" style="flex:2;background:#804000;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;">Рассчитать план</button>'+
            '<button id="snipeToggleAuto" style="flex:1;background:#008000;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;">ПУСК</button>'+
            '<button id="snipeClearPlan" style="background:#b22222;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;">Очистить</button>'+
        '</div>'+
        '<b style="font-size:11px;color:#804000;">План маршрутов (<span id="snipeCount">0</span>):</b>'+
        '<div id="snipeSt" style="font-size:11px;background:#fff;padding:5px;border:1px solid #dfcca6;min-height:70px;max-height:180px;overflow-y:auto;margin-top:2px;">'+
            '<div id="snipeRowsContainer">Рассчитайте план для начала работы.</div>'+
        '</div>'+
        '<div style="text-align:right;margin-top:6px;"><span id="snipeClose" style="cursor:pointer;color:#804000;font-size:11px;font-weight:bold;">[ Закрыть панель ]</span></div>';

    document.body.appendChild(container);
    document.getElementById('snipeUnit').value = loadVal('unit', 'ram');

    document.getElementById('snipeClose').onclick = function() {
        container.remove();
    };

    let num = s => parseInt(String(s).replace(/\D/g,''), 10) || 0;
    let speeds = {spear:18, sword:22, axe:18, archer:18, spy:9, light:10, marcher:10, heavy:11, ram:30, catapult:30, knight:10, snob:35};

    function saveInputs(){
        saveVal('coord', document.getElementById('snipeCoord').value.trim());
        saveVal('attacksPerTarget', document.getElementById('attacksPerTarget').value);
        saveVal('attacksPerSource', document.getElementById('attacksPerSource').value);
        saveVal('useRange', document.getElementById('useRange').checked);
        saveVal('timeFrom', document.getElementById('snipeTimeFrom').value.trim());
        saveVal('timeTo', document.getElementById('snipeTimeTo').value.trim());
        saveVal('time', document.getElementById('snipeTime').value.trim());
        saveVal('date', document.getElementById('snipeDate').value.trim());
        saveVal('unit', document.getElementById('snipeUnit').value);
        ['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','knight','snob'].forEach(u => {
            let fieldId = 'u' + u.charAt(0).toUpperCase() + u.slice(1);
            let el = document.getElementById(fieldId);
            if (el) saveVal('u_' + u, num(el.value));
        });
    }

    function updateRunButtonState(){
        let isRunning = localStorage.getItem('tw_snipe_autorun') === 'true';
        let autoBtn = document.getElementById('snipeToggleAuto');
        if (autoBtn) {
            if (isRunning) {
                autoBtn.innerText = 'СТОП';
                autoBtn.style.background = '#b22222';
            } else {
                autoBtn.innerText = 'ПУСК';
                autoBtn.style.background = '#008000';
            }
        }
    }
    updateRunButtonState();

    document.getElementById('snipeClearPlan').onclick = function(){
        localStorage.removeItem('tw_snipe_plan_list');
        localStorage.setItem('tw_snipe_autorun', 'false');
        localStorage.removeItem('tw_snipe_active_target_time');
        updateRunButtonState();
        let rowsCont = document.getElementById('snipeRowsContainer');
        if (rowsCont) rowsCont.innerHTML = '<span style="color:red;">План полностью очищен.</span>';
        let cntEl = document.getElementById('snipeCount');
        if (cntEl) cntEl.innerText = '0';
    };

    document.getElementById('snipeToggleAuto').onclick = function(){
        let isRunning = localStorage.getItem('tw_snipe_autorun') === 'true';
        if (isRunning) {
            localStorage.setItem('tw_snipe_autorun', 'false');
        } else {
            let savedList = JSON.parse(localStorage.getItem('tw_snipe_plan_list') || '[]');
            if (savedList.length === 0) {
                alert("Сначала рассчитайте план маршрутов!");
                return;
            }
            localStorage.setItem('tw_snipe_autorun', 'true');
        }
        updateRunButtonState();
    };

    document.getElementById('snipeCalc').onclick = function(){
        saveInputs();
        let template = {};
        ['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','knight','snob'].forEach(u => {
            let fieldId = 'u' + u.charAt(0).toUpperCase() + u.slice(1);
            template[u] = num(document.getElementById(fieldId).value);
        });

        let rowsCont = document.getElementById('snipeRowsContainer');
        let rawCoords = document.getElementById('snipeCoord').value.trim();
        let tDateStr = document.getElementById('snipeDate').value.trim();
        let useRange = document.getElementById('useRange').checked;
        let maxPerTarget = parseInt(document.getElementById('attacksPerTarget').value, 10) || 1;
        let maxPerSource = parseInt(document.getElementById('attacksPerSource').value, 10) || 1;
        
        let coordMatches = rawCoords.match(/\d{3}\|\d{3}/g);
        if (!coordMatches || coordMatches.length === 0) {
            rowsCont.innerHTML = '<span style="color:red;">Введите корректные координаты целей!</span>';
            return;
        }

        let targets = coordMatches.map(cStr => {
            let parts = cStr.split('|');
            return { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10), coord: cStr };
        });
        
        let dateParts = tDateStr.split(/[\.\/\-\s]+/);
        let td = parseInt(dateParts[0], 10), tm = parseInt(dateParts[1], 10), ty = parseInt(dateParts[2], 10);
        if (ty < 100) ty += 2000;

        let targetDates = [];
        if (useRange) {
            let tFromStr = document.getElementById('snipeTimeFrom').value.trim();
            let tToStr = document.getElementById('snipeTimeTo').value.trim();
            let [fh, fmin, fs] = tFromStr.split(':').map(Number);
            let [th, tmin, ts] = tToStr.split(':').map(Number);
            let dFrom = new Date(ty, tm-1, td, fh||0, fmin||0, fs||0).getTime();
            let dTo = new Date(ty, tm-1, td, th||0, tmin||0, ts||0).getTime();
            targetDates = [dFrom, dTo];
        } else {
            let tTimeStr = document.getElementById('snipeTime').value.trim();
            let [th, tmin, ts] = tTimeStr.split(':').map(Number);
            let targetDate = new Date(ty, tm-1, td, th||0, tmin||0, ts||0).getTime();
            targetDates = [targetDate, targetDate];
        }

        let unitKey = document.getElementById('snipeUnit').value;
        let speedMin = speeds[unitKey] || 30;

        let sfx = (typeof game_data.player.sitter !== 'undefined' && game_data.player.sitter > 0) ? 'game.php?t=' + game_data.player.id + '&' : 'game.php?';
        rowsCont.innerHTML = 'Сбор данных о войсках с обзора войск...';

        fetch(sfx + 'screen=overview_villages&mode=units&page=-1')
            .then(res => res.text())
            .then(page => {
                let parser = new DOMParser();
                let doc = parser.parseFromString(page, 'text/html');
                let table = doc.getElementById('units_table') || doc.querySelector('.overview_table');
                if (!table) { rowsCont.innerHTML = '<span style="color:red;">Таблица войск не найдена! Откройте обзор войск для расчетов.</span>'; return; }

                let unitMap = {};
                let ths = table.querySelectorAll('tr')[0].querySelectorAll('th');
                ths.forEach((th, idx) => {
                    let img = th.querySelector('img');
                    if (img) {
                        let src = img.src;
                        for (let u of Object.keys(speeds)) { if (src.indexOf('unit_' + u) !== -1) { unitMap[u] = idx; break; } }
                        if (src.indexOf('unit_knight') !== -1 || src.indexOf('statue') !== -1) unitMap['knight'] = idx;
                        if (src.indexOf('unit_snob') !== -1) unitMap['snob'] = idx;
                    }
                });

                let rows = Array.from(table.querySelectorAll('tr')).slice(1);
                let villages = [];
                rows.forEach(row => {
                    let vn = row.querySelector('.quickedit-vn');
                    if (!vn) return;
                    let name = vn.innerText.trim();
                    let vLink = vn.querySelector('a') ? vn.querySelector('a').href : '';
                    let vIdMatch = vLink.match(/village=(\d+)/);
                    let vId = vIdMatch ? vIdMatch[1] : null;
                    let vCoordsMatch = row.innerText.match(/\d{3}\|\d{3}/);
                    if (!vCoordsMatch || !vId) return;
                    let cParts = vCoordsMatch[0].split('|');
                    let vX = parseInt(cParts[0], 10), vY = parseInt(cParts[1], 10);
                    let tds = row.querySelectorAll('td');
                    let uData = {};
                    Object.keys(template).forEach(k => {
                        let colIdx = unitMap[k];
                        uData[k] = (colIdx !== undefined && tds[colIdx]) ? num(tds[colIdx].innerText) : 0;
                    });
                    villages.push({id: vId, name: name, x: vX, y: vY, units: uData});
                });

                if (!villages.length) { rowsCont.innerHTML = '<span style="color:red;">Деревни не найдены!</span>'; return; }

                let rawOptions = [];
                targets.forEach(t => {
                    villages.forEach(v => {
                        let hasE = true;
                        for (let u in template) { if (template[u] > 0 && v.units[u] < template[u]) { hasE = false; break; } }
                        if (!hasE) return;

                        let dist = Math.sqrt(Math.pow(v.x - t.x, 2) + Math.pow(v.y - t.y, 2));
                        let durationMs = dist * speedMin * 60 * 1000;
                        let targetBest = (targetDates[0] + targetDates[1]) / 2;
                        let sendTimeMs = targetBest - durationMs;

                        rawOptions.push({
                            village: v,
                            target: t,
                            dist: dist,
                            sendDate: new Date(sendTimeMs).getTime(),
                            units: template
                        });
                    });
                });

                if (!rawOptions.length) { rowsCont.innerHTML = '<span style="color:red;">Нет доступных деревень под шаблон!</span>'; return; }

                rawOptions.sort((a, b) => a.sendDate - b.sendDate);

                let targetCounts = {};
                let sourceCounts = {};
                let calculatedList = [];

                rawOptions.forEach(opt => {
                    let tKey = opt.target.coord;
                    let sKey = opt.village.id;

                    targetCounts[tKey] = targetCounts[tKey] || 0;
                    sourceCounts[sKey] = sourceCounts[sKey] || 0;

                    if (targetCounts[tKey] < maxPerTarget && sourceCounts[sKey] < maxPerSource) {
                        targetCounts[tKey]++;
                        sourceCounts[sKey]++;
                        calculatedList.push(opt);
                    }
                });

                if (!calculatedList.length) { rowsCont.innerHTML = '<span style="color:red;">Лимиты исчерпали все варианты.</span>'; return; }

                localStorage.setItem('tw_snipe_plan_list', JSON.stringify(calculatedList));
                rowsCont.innerHTML = '<span style="color:green;font-weight:bold;">План успешно рассчитан и сохранен (' + calculatedList.length + ' атак)!</span>';
            })
            .catch(err => {
                rowsCont.innerHTML = '<span style="color:red;">Ошибка загрузки данных войск!</span>';
            });
    };

    function renderListInPanel(){
        let rowsContainer = document.getElementById('snipeRowsContainer');
        let countEl = document.getElementById('snipeCount');
        if (!rowsContainer) return;
        
        let savedList = JSON.parse(localStorage.getItem('tw_snipe_plan_list') || '[]');
        let now = new Date().getTime();

        if (countEl) countEl.innerText = savedList.length;

        if (savedList.length === 0) {
            if (rowsContainer.innerHTML.indexOf('успешно') === -1 && rowsContainer.innerHTML.indexOf('очищен') === -1) {
                rowsContainer.innerHTML = 'План пустой или все приказы отправлены.';
            }
            return;
        }

        rowsContainer.innerHTML = '';
        let cnt = 0;
        
        savedList.forEach(item => {
            cnt++;
            if (cnt > 20) return;

            let sDate = new Date(item.sendDate);
            let diff = Math.floor((sDate.getTime() - now) / 1000);
            let timeStr = ('0' + sDate.getHours()).slice(-2) + ':' + ('0' + sDate.getMinutes()).slice(-2) + ':' + ('0' + sDate.getSeconds()).slice(-2);
            let dateStr = ('0' + sDate.getDate()).slice(-2) + '.' + ('0' + (sDate.getMonth() + 1)).slice(-2);
            
            let timerText = "";
            let timerColor = "#006600";
            if (diff < 0) {
                timerText = "Отправка...";
                timerColor = "#b22222";
            } else {
                let h = Math.floor(diff / 3600);
                let m = Math.floor((diff % 3600) / 60);
                let s = diff % 60;
                timerText = (h > 0 ? h + ':' : '') + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
            }

            let placeParams = [];
            if (typeof game_data.player.sitter !== 'undefined' && game_data.player.sitter > 0) placeParams.push('t=' + game_data.player.id);
            placeParams.push('village=' + item.village.id);
            placeParams.push('screen=place');
            placeParams.push('x=' + item.target.x);
            placeParams.push('y=' + item.target.y);
            placeParams.push('target_time=' + sDate.getTime());
            
            Object.keys(item.units).forEach(u => {
                if (item.units[u] > 0) placeParams.push('u_' + u + '=' + item.units[u]);
            });
            let placeUrl = 'game.php?' + placeParams.join('&');

            let rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'border-bottom:1px solid #dfcca6;padding:3px 0;font-size:10px;display:flex;justify-content:space-between;align-items:center;';
            
            let infoSpan = document.createElement('span');
            infoSpan.innerHTML = '<b>' + item.village.name + '</b> ➔ <b>' + item.target.coord + '</b><br>' +
                '<b style="color:#b22222;">Отпр: ' + dateStr + ' ' + timeStr + '</b> | <span style="font-weight:bold;color:' + timerColor + ';">' + timerText + '</span>';
            
            let btnGo = document.createElement('button');
            btnGo.innerText = 'Перейти';
            btnGo.style.cssText = 'background:#804000;color:#fff;border:none;padding:3px 6px;border-radius:3px;font-weight:bold;font-size:9px;cursor:pointer;';
            btnGo.onclick = function() {
                window.location.href = placeUrl;
            };

            rowDiv.appendChild(infoSpan);
            rowDiv.appendChild(btnGo);
            rowsContainer.appendChild(rowDiv);
        });
    }

    setInterval(renderListInPanel, 1000);
})();
