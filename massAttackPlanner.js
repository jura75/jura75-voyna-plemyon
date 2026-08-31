/*
 * Script Name: Планировщик Масс-Атак (С кнопками копирования и очистки)
 * Version: v1.1.21-ru
 * Last Updated: 2026-08-31
 */

var scriptData = {
    name: 'Планировщик Масс-Атак',
    version: 'v1.1.21-ru',
    helpLink: 'https://forum.tribalwars.net/index.php?threads/mass-attack-planner.285331/',
};

if (typeof DEBUG !== 'boolean') DEBUG = false;

var LS_PREFIX = `ra_massAttackPlanner_`;
var TIME_INTERVAL = 60 * 60 * 1000 * 24 * 30;
var LAST_UPDATED_TIME = localStorage.getItem(`${LS_PREFIX}_last_updated`) ?? 0;

var unitInfo;
var playerVillagesMap = {};

initDebug();

(function () {
    fetchAllPlayerVillages();

    if (LAST_UPDATED_TIME !== null) {
        if (Date.parse(new Date()) >= LAST_UPDATED_TIME + TIME_INTERVAL) {
            fetchUnitInfo();
        } else {
            unitInfo = JSON.parse(localStorage.getItem(`${LS_PREFIX}_unit_info`));
            init(unitInfo);
        }
    } else {
        fetchUnitInfo();
    }
})();

function fetchAllPlayerVillages() {
    if (typeof game_data !== 'undefined' && game_data.village) {
        playerVillagesMap[`${game_data.village.x}|${game_data.village.y}`] = game_data.village.id;
    }

    if (typeof game_data !== 'undefined' && game_data.player && game_data.player.id) {
        jQuery.ajax({
            url: `/map/index.php?player=${game_data.player.id}`,
            dataType: 'json',
            success: function(data) {
                if (data && data.villages) {
                    data.villages.forEach(v => {
                        let id = v[0];
                        let x = v[2];
                        let y = v[3];
                        let owner = v[4];
                        if (owner == game_data.player.id) {
                            playerVillagesMap[`${x}|${y}`] = id;
                        }
                    });
                }
            },
            error: function() {
                jQuery.ajax({
                    url: '/interface.php?func=get_villages',
                    success: function(response) {
                        $(response).find('village').each(function() {
                            let id = $(this).find('id').text();
                            let x = $(this).find('x').text();
                            let y = $(this).find('y').text();
                            playerVillagesMap[`${x}|${y}`] = id;
                        });
                    }
                });
            }
        });
    }

    $('#select_village option, .quickedit-label').each(function() {
        let text = $(this).text() || $(this).attr('data-text') || '';
        let match = text.match(/\((\d+\|\d+)\)/);
        if (match) {
            let coords = match[1];
            let href = $(this).val() || $(this).closest('a').attr('href') || window.location.href;
            let vMatch = href.match(/village=(\d+)/);
            if (vMatch) {
                playerVillagesMap[coords] = vMatch[1];
            }
        }
    });
}

function init(unitInfo) {
    var currentDateTime = getCurrentDateTime();

    let knightSpeed = 0;
    const worldUnits = game_data.units;
    if (worldUnits.includes('knight')) {
        knightSpeed = unitInfo?.config['knight'].speed || 0;
    } else {
        jQuery('#support_unit option[data-option-unit="knight"]').attr('disabled', 'disabled');
    }

    const content = `
		<div id="ra_attack_planner_container">
			<div class="ra-mb15">
				<label for="arrival_time">Время прибытия</label>
				<input id="arrival_time" type="text" placeholder="гггг-мм-дд чч:мм:сс" value="${currentDateTime}">
			</div>
			<input type="hidden" id="nobleSpeed" value="${unitInfo.config['snob'].speed}" />
			<div class="ra-flex">
				<div class="ra-flex-6">
					<div class="ra-mb15">
						<label for="nuke_unit">Медленный юнит атаки (Офф)</label>
						<select id="nuke_unit">
							<option value="${unitInfo.config['axe'].speed}">Топор</option>
							<option value="${unitInfo.config['light'].speed}">ЛК / Тяж.лучник / Паладин</option>
							<option value="${unitInfo.config['heavy'].speed}">ТК (Тяжёлая кавалерия)</option>
							<option value="${unitInfo.config['ram'].speed}" selected="selected">Таран / Катапульта</option>
						</select>
					</div>
				</div>
				<div class="ra-flex-6">
					<div class="ra-mb15">
						<label for="support_unit">Медленный юнит подкрепления (Дефф)</label>
						<select id="support_unit">
							<option value="${unitInfo.config['spear'].speed}">Копейщик / Лучник</option>
							<option value="${unitInfo.config['sword'].speed}" selected="selected">Мечник</option>
							<option value="${unitInfo.config['spy'].speed}">Разведчик</option>
							<option value="${knightSpeed}" data-option-unit="knight">Паладин</option>
							<option value="${unitInfo.config['heavy'].speed}">ТК</option>
							<option value="${unitInfo.config['catapult'].speed}">Катапульта</option>
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
					<a id="submit_btn" class="button">Сгенерировать план!</a>
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
				<textarea id="results" placeholder="Здесь появится готовый план атак..."></textarea>
			</div>
		</div>
	`;

    openUI(content);
}

function openUI(bodyContent) {
    $('#ra_attack_planner_window').remove();

    const windowStyle = `
		<style>
			#ra_attack_planner_window { position: fixed; top: 80px; left: 100px; z-index: 99999; background: #fff8eb; border: 2px solid #7d510f; border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.4); width: 560px; font-family: Verdana, Arial, sans-serif; font-size: 12px; }
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

    // Новые обработчики для кнопок управления результатами
    $('#copy_results_btn').on('click', function() {
        const resultsText = $('#results').val();
        if (!resultsText) {
            UI.ErrorMessage("Поле результатов пусто!");
            return;
        }
        navigator.clipboard.writeText(resultsText).then(() => {
            UI.SuccessMessage("План успешно скопирован в буфер обмена!");
        }).catch(() => {
            // Запасной метод копирования для старых браузеров
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
    const arrivalTimeStr = $('#arrival_time').val().trim();
    const targetCoordsInput = $('#target_coords').val().trim();
    const nukeCoordsInput = $('#nuke_coords').val().trim();
    const unitSpeed = parseFloat($('#nuke_unit').val());
    
    if (!targetCoordsInput || !nukeCoordsInput || !arrivalTimeStr) {
        UI.ErrorMessage("Пожалуйста, заполните время прибытия, цели и координаты офа!");
        return;
    }

    let arrivalDate = parseDateTime(arrivalTimeStr);
    if (!arrivalDate || isNaN(arrivalDate.getTime())) {
        UI.ErrorMessage("Неверный формат времени прибытия! Используйте: гггг-мм-дд чч:мм:сс");
        return;
    }

    const targets = targetCoordsInput.split(/\s+/).filter(Boolean);
    const attackers = nukeCoordsInput.split(/\s+/).filter(Boolean);
    const playerName = game_data.player.name;
    const worldBaseUrl = window.location.origin + window.location.pathname;

    let output = "[table]\n";
    output += "[**]ID[||]Ник[||]Тип атаки[||]вид[||]откуда[||]куда[||]время в пути[||]время отправки[||]время прихода[||]ссылка[/**]\n";

    let counter = 1;

    targets.forEach((targetCoordRaw, targetIndex) => {
        let atkCoordRaw = attackers[targetIndex % attackers.length];

        let coords1 = parseCoords(atkCoordRaw);
        let coords2 = parseCoords(targetCoordRaw);

        if (coords1 && coords2) {
            let dist = Math.hypot(coords1.x - coords2.x, coords1.y - coords2.y);
            let travelTimeMs = dist * unitSpeed * 1000;
            
            let sendDate = new Date(arrivalDate.getTime() - travelTimeMs);

            let durationFormatted = formatDuration(travelTimeMs);
            let sendFormatted = formatDate(sendDate);
            let arrivalFormatted = formatDate(arrivalDate);

            let cleanSourceCoord = `${coords1.x}|${coords1.y}`;
            let cleanTargetCoord = `${coords2.x}|${coords2.y}`;

            let sourceVillageId = playerVillagesMap[cleanSourceCoord] || game_data.village.id;
            let rallyPointLink = `${worldBaseUrl}?village=${sourceVillageId}&screen=place&x=${coords2.x}&y=${coords2.y}`;

            output += `[*][*]${counter}[|]${playerName}[|]Атака[|][unit]catapult[/unit][|][coord]${cleanSourceCoord}[/coord][|][coord]${cleanTargetCoord}[/coord][|]${durationFormatted}[|][b]${sendFormatted}[/b][|]${arrivalFormatted}[|][url=${rallyPointLink}]Rally point[/url][/*]\n`;
            counter++;
        }
    });

    output += "[/table]";
    
    $('#results').val(output);
    localStorage.setItem('ra_form_results', output);
    UI.SuccessMessage("Таблица плана атак успешно сгенерирована!");
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
