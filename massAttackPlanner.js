/*
 * Script Name: Планировщик Масс-Атак (Синхронный сбор ID деревень)
 * Version: v1.2.3-ru
 * Last Updated: 2026-09-02
 */

var scriptData = {
    name: 'Планировщик Масс-Атак',
    version: 'v1.2.3-ru',
    helpLink: 'https://forum.tribalwars.net/index.php?threads/mass-attack-planner.285331/',
};

if (typeof DEBUG !== 'boolean') DEBUG = false;

var LS_PREFIX = `ra_massAttackPlanner_`;
var TIME_INTERVAL = 60 * 60 * 1000 * 24 * 30;
var LAST_UPDATED_TIME = localStorage.getItem(`${LS_PREFIX}_last_updated`) ?? 0;

var unitInfo;
var playerVillagesMap = {};
var worldVillagesCache = null; // Кэш для данных карты мира (village.txt)

initDebug();

(function () {
    fetchAllPlayerVillages();

    if (LAST_UPDATED_TIME !== null) {
        if (Date.parse(new Date()) >= Number(LAST_UPDATED_TIME) + TIME_INTERVAL) {
            fetchUnitInfo();
        } else {
            let cached = localStorage.getItem(`${LS_PREFIX}_unit_info`);
            unitInfo = cached ? JSON.parse(cached) : null;
            if (unitInfo) {
                init(unitInfo);
            } else {
                fetchUnitInfo();
            }
        }
    } else {
        fetchUnitInfo();
    }
})();

// Надежный сбор данных деревень с использованием village.txt с карты мира (как во втором скрипте)
function fetchAllPlayerVillages() {
    // 1. Текущая деревня из game_data
    if (typeof game_data !== 'undefined' && game_data.village) {
        playerVillagesMap[`${game_data.village.x}|${game_data.village.y}`] = game_data.village.id;
    }

    // 2. Сбор из выпадающего списка деревень на странице (#select_village)
    $('#select_village option').each(function() {
        let optText = $(this).text();
        let match = optText.match(/\((\d+\|\d+)\)/);
        let val = $(this).val();
        if (match && val) {
            playerVillagesMap[match[1]] = val;
        }
    });

    // 3. Загрузка данных из village.txt для гарантированного покрытия всех деревень игрока
    let mapBaseUrl = window.location.origin + '/map/';
    $.when(
        $.get(mapBaseUrl + 'player.txt').catch(() => ({responseText: ''})),
        $.get(mapBaseUrl + 'village.txt').catch(() => ({responseText: ''}))
    ).done(function(playerRes, villageRes) {
        let playerText = playerRes[0] || '';
        let villageText = villageRes[0] || '';

        let playersMap = {};
        if (playerText) {
            playerText.split('\n').forEach(line => {
                if(!line.trim()) return;
                let parts = line.split(',');
                if(parts.length >= 2) {
                    playersMap[parts[0].trim()] = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                }
            });
        }

        if (villageText) {
            worldVillagesCache = {};
            villageText.split('\n').forEach(line => {
                if(!line.trim()) return;
                let parts = line.split(',');
                if(parts.length >= 6) {
                    let vId = parts[0].trim();
                    let vName = decodeURIComponent(parts[1].replace(/\+/g, ' '));
                    let vX = parseInt(parts[2], 10);
                    let vY = parseInt(parts[3], 10);
                    let ownerId = parts[4].trim();
                    let coordKey = `${vX}|${vY}`;
                    
                    worldVillagesCache[coordKey] = { id: vId, ownerId: ownerId, villageName: vName };

                    // Если деревня принадлежит текущему игроку, заносим ее в общий маппинг
                    if (typeof game_data !== 'undefined' && game_data.player && ownerId == game_data.player.id) {
                        playerVillagesMap[coordKey] = vId;
                    }
                }
            });
        }
    });
}

function init(unitInfo) {
    var currentDateTime = getCurrentDateTime();

    const unitsConfig = unitInfo?.config || unitInfo || {};
    
    function getUnitSpeed(unitName, defaultSpeed) {
        if (unitsConfig[unitName] && unitsConfig[unitName].speed) {
            return parseFloat(unitsConfig[unitName].speed);
        }
        return defaultSpeed;
    }

    const speedSpear = getUnitSpeed('spear', 18);
    const speedSword = getUnitSpeed('sword', 22);
    const speedAxe = getUnitSpeed('axe', 18);
    const speedSpy = getUnitSpeed('spy', 9);
    const speedLight = getUnitSpeed('light', 10);
    const speedHeavy = getUnitSpeed('heavy', 11);
    const speedRam = getUnitSpeed('ram', 30);
    const speedCatapult = getUnitSpeed('catapult', 30);
    const speedKnight = getUnitSpeed('knight', 10);
    const speedSnob = getUnitSpeed('snob', 35);

    let knightSpeed = speedKnight;
    const worldUnits = game_data.units || [];
    if (!worldUnits.includes('knight')) {
        knightSpeed = 0;
    }

    const content = `
		<div id="ra_attack_planner_container">
			<div class="ra-mb15">
				<label for="arrival_time">Время прибытия</label>
				<input id="arrival_time" type="text" placeholder="гггг-мм-дд чч:мм:сс" value="${currentDateTime}">
			</div>
			<input type="hidden" id="nobleSpeed" value="${speedSnob}" />
			<div class="ra-flex">
				<div class="ra-flex-6">
					<div class="ra-mb15">
						<label for="nuke_unit">Медленный юнит атаки (Офф)</label>
						<select id="nuke_unit">
							<option value="${speedAxe}">Топор (${speedAxe} мин)</option>
							<option value="${speedLight}">ЛК / Тяж.лучник / Паладин (${speedLight} мин)</option>
							<option value="${speedHeavy}">ТК (Тяжёлая кавалерия) (${speedHeavy} мин)</option>
							<option value="${speedRam}" selected="selected">Таран / Катапульта (${speedRam} мин)</option>
						</select>
					</div>
				</div>
				<div class="ra-flex-6">
					<div class="ra-mb15">
						<label for="support_unit">Медленный юнит подкрепления (Дефф)</label>
						<select id="support_unit">
							<option value="${speedSpear}">Копейщик / Лучник (${speedSpear} мин)</option>
							<option value="${speedSword}" selected="selected">Мечник (${speedSword} мин)</option>
							<option value="${speedSpy}">Разведчик (${speedSpy} мин)</option>
							<option value="${knightSpeed}" data-option-unit="knight">Паладин (${speedKnight} мин)</option>
							<option value="${speedHeavy}">ТК (${speedHeavy} мин)</option>
							<option value="${speedCatapult}">Катапульта (${speedCatapult} мин)</option>
						</select>
					</div>
				</div>
			</div>
			<div class="ra-mb15">
				<label for="target_coords">Координаты целей</label>
				<textarea id="target_coords" placeholder="Вставьте координаты целей (например: 500|500 501|502)"></textarea>
			</div>
			<div class="ra-flex">
				<div class="ra-flex-4">
					<div class="ra-mb15">
						<label for="nobel_coords">Координаты дворян</label>
						<textarea id="nobel_coords" placeholder="Откуда идут дворы"></textarea>
					</div>
					<div class="ra-mb15">
						<label for="nobel_count">Дворян на цель</label>
						<input id="nobel_count" type="text" value="1">
					</div>
				</div>
				<div class="ra-flex-4">
					<div class="ra-mb15">
						<label for="nuke_coords">Координаты офа</label>
						<textarea id="nuke_coords" placeholder="Откуда идут офы"></textarea>
					</div>
					<div class="ra-mb15">
						<label for="nuke_count">Офов на цель</label>
						<input id="nuke_count" type="text" value="1">
					</div>
				</div>
				<div class="ra-flex-4">
					<div class="ra-mb15">
						<label for="support_coords">Координаты деффа</label>
						<textarea id="support_coords" placeholder="Откуда идёт дефф"></textarea>
					</div>
					<div class="ra-mb15">
						<label for="support_count">Подкреплений на цель</label>
						<input id="support_count" type="text" value="1">
					</div>
				</div>
			</div>
			<div class="ra-flex" style="justify-content: center; gap: 10px;">
				<div class="ra-mb15">
					<a id="submit_btn" class="button">Сгенерировать полный план!</a>
				</div>
				<div class="ra-mb15">
					<a id="reset_btn" class="button button-reset">Сброс</a>
				</div>
			</div>
			<div class="ra-mb15">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
					<label for="results" style="margin-bottom: 0;">Результаты (Таблица для форума)</label>
					<div style="display: flex; gap: 6px;">
						<a id="copy_results_btn" class="button" style="padding: 3px 8px; font-size: 10px;">Копировать план</a>
						<a id="clear_results_btn" class="button button-reset" style="padding: 3px 8px; font-size: 10px;">Очистить окно</a>
					</div>
				</div>
				<textarea id="results" placeholder="Здесь появится объединенный план атак и поддержки..."></textarea>
			</div>
		</div>
	`;

    openUI(content);
}

function openUI(bodyContent) {
    $('#ra_attack_planner_window').remove();

    const windowStyle = `
		<style>
			#ra_attack_planner_window { position: fixed; top: 80px; left: 100px; z-index: 99999; background: #fff8eb; border: 2px solid #7d510f; border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); width: 620px; font-family: Verdana, Arial, sans-serif; font-size: 12px; }
			#ra_attack_planner_header { background: #dfc184; padding: 8px 12px; font-weight: bold; color: #5b3511; font-size: 14px; cursor: move; border-bottom: 1px solid #c5a059; display: flex; justify-content: space-between; align-items: center; }
			#ra_attack_planner_close { cursor: pointer; font-weight: bold; font-size: 14px; color: #5b3511; background: none; border: none; }
			#ra_attack_planner_close:hover { color: #b84a32; }
			#ra_attack_planner_body { padding: 15px; max-height: 80vh; overflow-y: auto; }
			#ra_attack_planner_window a { font-weight: 700; text-decoration: none; color: #603000; }
			#ra_attack_planner_window a:hover { text-decoration: underline; }
			#ra_attack_planner_window input[type="text"], #ra_attack_planner_window select { display: block; width: 100%; height: 26px; line-height: 1.2; box-sizing: border-box; padding: 3px 6px; outline: none; border: 1px solid #c5a059; background: #fff; border-radius: 3px; font-size: 11px; }
			#ra_attack_planner_window input[type="text"]:focus, #ra_attack_planner_window select:focus { border-color: #603000; background-color: #fffdf9; box-shadow: 0 0 3px rgba(96,48,0,0.3); }
			#ra_attack_planner_window label { font-weight: bold; display: block; margin-bottom: 4px; font-size: 11px; color: #4a2c00; }
			#ra_attack_planner_window textarea { width: 100%; height: 85px; box-sizing: border-box; padding: 6px; resize: vertical; border: 1px solid #c5a059; border-radius: 3px; background: #fff; font-size: 11px; font-family: monospace; }
			#ra_attack_planner_window textarea:focus { border-color: #603000; background-color: #fffdf9; outline: none; box-shadow: 0 0 3px rgba(96,48,0,0.3); }
			.ra-mb15 { margin-bottom: 12px; }
			.ra-flex { display: flex; flex-flow: row wrap; justify-content: space-between; }
			.ra-flex-6 { flex: 0 0 48.5%; }
			.ra-flex-4 { flex: 0 0 31.5%; }
			.button { padding: 8px 20px; background: linear-gradient(to bottom, #f0ca7b 0%, #d89f42 100%); border: 1px solid #7d510f; font-weight: bold; color: #4a2c00; text-align: center; display: inline-block; cursor: pointer; text-transform: uppercase; border-radius: 3px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
			.button:hover { background: linear-gradient(to bottom, #f5d491, #e0a749); color: #2e1a00; border-color: #603000; text-decoration: none; }
			.button-reset { background: linear-gradient(to bottom, #e28773, #b84a32); color: #fff; border: 1px solid #7d220f; }
			.button-reset:hover { background: linear-gradient(to bottom, #ea9a86, #c6533a); color: #fff; }
		</style>
	`;

    const html = `
		<div id="ra_attack_planner_window">
			<div id="ra_attack_planner_header">
				<span>${scriptData.name} ${scriptData.version}</span>
				<button id="ra_attack_planner_close" title="Закрыть">×</button>
			</div>
			<div id="ra_attack_planner_body">
				${bodyContent}
			</div>
		</div>
	`;

    $('body').append(windowStyle + html);

    if (typeof jQuery.ui !== 'undefined' && typeof jQuery('#ra_attack_planner_window').draggable === 'function') {
        jQuery('#ra_attack_planner_window').draggable({
            handle: '#ra_attack_planner_header'
        });
    }

    $('#ra_attack_planner_close').on('click', function () {
        $('#ra_attack_planner_window').remove();
    });

    $('#submit_btn').on('click', function() {
        handleSubmit();
    });

    $('#reset_btn').on('click', function() {
        resetPlannerData();
    });

    $('#copy_results_btn').on('click', function() {
        const resultsText = $('#results').val();
        if (!resultsText) {
            UI.ErrorMessage("Поле результатов пусто!");
            return;
        }
        navigator.clipboard.writeText(resultsText).then(() => {
            UI.SuccessMessage("План успешно скопирован в буфер обмена!");
        }).catch(() => {
            $('#results').select();
            document.execCommand('copy');
            UI.SuccessMessage("План скопирован!");
        });
    });

    $('#clear_results_btn').on('click', function() {
        $('#results').val('');
        localStorage.removeItem('ra_form_results');
        UI.SuccessMessage("Окно плана очищено!");
    });

    restoreFormData();
    setupAutoSave();
}

function handleSubmit() {
    fetchAllPlayerVillages();

    const arrivalTimeStr = $('#arrival_time').val().trim();
    const targetCoordsInput = $('#target_coords').val().trim();
    
    if (!targetCoordsInput || !arrivalTimeStr) {
        UI.ErrorMessage("Пожалуйста, заполните время прибытия и координаты целей!");
        return;
    }

    let arrivalDate = parseDateTime(arrivalTimeStr);
    if (!arrivalDate || isNaN(arrivalDate.getTime())) {
        UI.ErrorMessage("Неверный формат времени прибытия! Используйте: гггг-мм-дд чч:мм:сс");
        return;
    }

    const targets = targetCoordsInput.split(/\s+/).filter(Boolean);
    if (targets.length === 0) {
        UI.ErrorMessage("Не указаны координаты целей!");
        return;
    }

    const playerName = game_data.player.name;
    const worldBaseUrl = window.location.origin + window.location.pathname;

    const nukeCoordsInput = $('#nuke_coords').val().trim();
    const nukeCount = parseInt($('#nuke_count').val()) || 1;
    const nukeSpeedMinutes = parseFloat($('#nuke_unit').val()) || 30;

    const nobelCoordsInput = $('#nobel_coords').val().trim();
    const nobelCount = parseInt($('#nobel_count').val()) || 1;
    const nobleSpeedMinutes = parseFloat($('#nobleSpeed').val()) || 35;

    const supportCoordsInput = $('#support_coords').val().trim();
    const supportCount = parseInt($('#support_count').val()) || 1;
    const supportSpeedMinutes = parseFloat($('#support_unit').val()) || 22;

    let allOrders = [];

    // 1. Оффы
    if (nukeCoordsInput) {
        const attackers = nukeCoordsInput.split(/\s+/).filter(Boolean);
        let atkIndex = 0;
        targets.forEach((targetCoordRaw) => {
            let coords2 = parseCoords(targetCoordRaw);
            if (!coords2) return;

            for (let i = 0; i < nukeCount; i++) {
                if (attackers.length === 0) break;
                let atkCoordRaw = attackers[atkIndex % attackers.length];
                let coords1 = parseCoords(atkCoordRaw);
                atkIndex++;

                if (coords1) {
                    let dist = Math.hypot(coords1.x - coords2.x, coords1.y - coords2.y);
                    let travelTimeMs = dist * nukeSpeedMinutes * 60 * 1000;
                    let sendDate = new Date(arrivalDate.getTime() - travelTimeMs);

                    allOrders.push({
                        sendDate: sendDate,
                        arrivalDate: arrivalDate,
                        travelTimeMs: travelTimeMs,
                        source: `${coords1.x}|${coords1.y}`,
                        target: `${coords2.x}|${coords2.y}`,
                        type: 'Атака',
                        unitTag: 'ram'
                    });
                }
            }
        });
    }

    // 2. Дворяне
    if (nobelCoordsInput) {
        const nobles = nobelCoordsInput.split(/\s+/).filter(Boolean);
        let nobIndex = 0;
        targets.forEach((targetCoordRaw) => {
            let coords2 = parseCoords(targetCoordRaw);
            if (!coords2) return;

            for (let i = 0; i < nobelCount; i++) {
                if (nobles.length === 0) break;
                let nobCoordRaw = nobles[nobIndex % nobles.length];
                let coords1 = parseCoords(nobCoordRaw);
                nobIndex++;

                if (coords1) {
                    let dist = Math.hypot(coords1.x - coords2.x, coords1.y - coords2.y);
                    let travelTimeMs = dist * nobleSpeedMinutes * 60 * 1000;
                    let sendDate = new Date(arrivalDate.getTime() - travelTimeMs);

                    allOrders.push({
                        sendDate: sendDate,
                        arrivalDate: arrivalDate,
                        travelTimeMs: travelTimeMs,
                        source: `${coords1.x}|${coords1.y}`,
                        target: `${coords2.x}|${coords2.y}`,
                        type: 'Дворянин',
                        unitTag: 'snob'
                    });
                }
            }
        });
    }

    // 3. Подкрепления
    if (supportCoordsInput) {
        const supports = supportCoordsInput.split(/\s+/).filter(Boolean);
        let supIndex = 0;
        targets.forEach((targetCoordRaw) => {
            let coords2 = parseCoords(targetCoordRaw);
            if (!coords2) return;

            for (let i = 0; i < supportCount; i++) {
                if (supports.length === 0) break;
                let supCoordRaw = supports[supIndex % supports.length];
                let coords1 = parseCoords(supCoordRaw);
                supIndex++;

                if (coords1) {
                    let dist = Math.hypot(coords1.x - coords2.x, coords1.y - coords2.y);
                    let travelTimeMs = dist * supportSpeedMinutes * 60 * 1000;
                    let sendDate = new Date(arrivalDate.getTime() - travelTimeMs);

                    allOrders.push({
                        sendDate: sendDate,
                        arrivalDate: arrivalDate,
                        travelTimeMs: travelTimeMs,
                        source: `${coords1.x}|${coords1.y}`,
                        target: `${coords2.x}|${coords2.y}`,
                        type: 'Подкрепление',
                        unitTag: 'sword'
                    });
                }
            }
        });
    }

    if (allOrders.length === 0) {
        UI.ErrorMessage("Не заполнено ни одно окно источников (Оффы, Дворы или Подкрепления)!");
        return;
    }

    allOrders.sort((a, b) => a.sendDate - b.sendDate);

    let output = "[table]\n";
    output += "[**]ID[||]Ник[||]Тип атаки[||]вид[||]откуда[||]куда[||]время в пути[||]время отправки[||]время прихода[||]ссылка[/**]\n";

    allOrders.forEach((order, index) => {
        let durationFormatted = formatDuration(order.travelTimeMs);
        let sendFormatted = formatDate(order.sendDate);
        let arrivalFormatted = formatDate(order.arrivalDate);

        // Надежный поиск ID деревни источника через локальный кэш, глобальную карту или выпадающий список
        let sourceVillageId = playerVillagesMap[order.source];
        
        if (!sourceVillageId && worldVillagesCache && worldVillagesCache[order.source]) {
            sourceVillageId = worldVillagesCache[order.source].id;
        }
        
        if (!sourceVillageId) {
            $(`#select_village option`).each(function() {
                let optText = $(this).text();
                if (optText.includes(order.source)) {
                    sourceVillageId = $(this).val();
                }
            });
        }

        if (!sourceVillageId) {
            sourceVillageId = game_data.village.id;
        }

        let coordsArr = order.target.split('|');
        
        // Формирование корректной ссылки с поддержкой ситтерства (параметр t), если оно используется
        let urlParams = new URLSearchParams(window.location.search);
        let sitterParam = urlParams.get('t') ? 't=' + urlParams.get('t') + '&' : '';
        let rallyPointLink = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'game.php?' + sitterParam + 'village=' + sourceVillageId + '&screen=place&x=' + coordsArr[0] + '&y=' + coordsArr[1];

        output += `[*][*]${index + 1}[|]${playerName}[|]${order.type}[|][unit]${order.unitTag}[/unit][|][coord]${order.source}[/coord][|][coord]${order.target}[/coord][|]${durationFormatted}[|][b]${sendFormatted}[/b][|]${arrivalFormatted}[|][url=${rallyPointLink}]Rally point[/url][/*]\n`;
    });

    output += "[/table]";
    
    $('#results').val(output);
    localStorage.setItem('ra_form_results', output);
    UI.SuccessMessage(`Успешно сгенерирован единый план: ${allOrders.length} приказов!`);
}

function parseDateTime(str) {
    let parts = str.split(/[- :]/);
    if (parts.length >= 5) {
        return new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2]),
            parseInt(parts[3] || 0),
            parseInt(parts[4] || 0),
            parseInt(parts[5] || 0)
        );
    }
    return new Date(str);
}

function parseCoords(coordStr) {
    if (!coordStr) return null;
    let clean = coordStr.replace(/[()]/g, '');
    let parts = clean.split('|');
    if (parts.length === 2) {
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
            return { x: x, y: y };
        }
    }
    return null;
}

function formatDuration(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    let minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    let seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatDate(date) {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function setupAutoSave() {
    const fields = ['arrival_time', 'nuke_unit', 'support_unit', 'target_coords', 'nobel_coords', 'nobel_count', 'nuke_coords', 'nuke_count', 'support_coords', 'support_count', 'results'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                localStorage.setItem('ra_form_' + id, el.value);
            });
            el.addEventListener('change', () => {
                localStorage.setItem('ra_form_' + id, el.value);
            });
        }
    });
}

function restoreFormData() {
    const fields = ['arrival_time', 'nuke_unit', 'support_unit', 'target_coords', 'nobel_coords', 'nobel_count', 'nuke_coords', 'nuke_count', 'support_coords', 'support_count', 'results'];
    fields.forEach(id => {
        const savedVal = localStorage.getItem('ra_form_' + id);
        if (savedVal !== null) {
            const el = document.getElementById(id);
            if (el) el.value = savedVal;
        }
    });
}

function resetPlannerData() {
    if (confirm("Вы уверены, что хотите сбросить все заполненные данные?")) {
        const fields = ['arrival_time', 'nuke_unit', 'support_unit', 'target_coords', 'nobel_coords', 'nobel_count', 'nuke_coords', 'nuke_count', 'support_coords', 'support_count', 'results'];
        fields.forEach(id => {
            localStorage.removeItem('ra_form_' + id);
            const el = document.getElementById(id);
            if (el) {
                if (id === 'nobel_count' || id === 'nuke_count' || id === 'support_count') {
                    el.value = '1';
                } else {
                    el.value = '';
                }
            }
        });
    }
}

function getCurrentDateTime() {
    let currentDateTime = new Date();
    var currentYear = currentDateTime.getFullYear();
    var currentMonth = String(currentDateTime.getMonth() + 1).padStart(2, '0');
    var currentDate = String(currentDateTime.getDate()).padStart(2, '0');
    var currentHours = String(currentDateTime.getHours()).padStart(2, '0');
    var currentMinutes = String(currentDateTime.getMinutes()).padStart(2, '0');
    var currentSeconds = String(currentDateTime.getSeconds()).padStart(2, '0');

    return `${currentYear}-${currentMonth}-${currentDate} ${currentHours}:${currentMinutes}:${currentSeconds}`;
}

function fetchUnitInfo() {
    jQuery.ajax({
        url: '/interface.php?func=get_unit_info',
    }).done(function (response) {
        unitInfo = xml2json($(response));
        localStorage.setItem(`${LS_PREFIX}_unit_info`, JSON.stringify(unitInfo));
        localStorage.setItem(`${LS_PREFIX}_last_updated`, Date.parse(new Date()));
        init(unitInfo);
    });
}

var xml2json = function ($xml) {
    var data = {};
    $.each($xml.children(), function (i) {
        var $this = $(this);
        if ($this.children().length > 0) {
            data[$this.prop('tagName')] = xml2json($this);
        } else {
            data[$this.prop('tagName')] = $.trim($this.text());
        }
    });
    return data;
};

function scriptInfo() {
    return `[${scriptData.name} ${scriptData.version}]`;
}

function initDebug() {
    console.debug(`${scriptInfo()} Всё работает 🚀!`);
    console.debug(`${scriptInfo()} Справка:`, scriptData.helpLink);
}
