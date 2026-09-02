javascript:(function() {
    let existing = document.getElementById('tw-custom-hub-panel');
    if (existing) {
        existing.remove();
        return;
    }

    let panel = document.createElement('div');
    panel.id = 'tw-custom-hub-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 300px;
        background: #2b1d0c;
        border: 3px solid #7d510f;
        box-shadow: 0 6px 20px rgba(0,0,0,0.8);
        z-index: 99999;
        font-family: Verdana, Arial, sans-serif;
        color: #f4e4bc;
        border-radius: 4px;
        overflow: hidden;
    `;

    panel.innerHTML = `
        <div style="background: #1a1006; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7d510f;">
            <b style="font-size: 12px; color: #f4e4bc;">🛠️ Проект Хаб</b>
            <span id="tw-hub-close" style="cursor: pointer; color: #a63a3a; font-weight: bold; font-size: 14px; padding: 0 4px;">✕</span>
        </div>
        
        <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <button class="tw-hub-btn" data-action="manager" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                📋 <span>Менеджер приказов-планировщик</span>
            </button>
            <button class="tw-hub-btn" data-action="1" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                ⚡ <span>Мульти-Планировщик</span>
            </button>
            <button class="tw-hub-btn" data-action="2" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                🛡️ <span>Тактический Хаб</span>
            </button>
            <button class="tw-hub-btn" data-action="3" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                🌾 <span>Калькулятор ресурсов</span>
            </button>
            <button class="tw-hub-btn" data-action="4" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                ⚖️ <span>Авто-балансёр</span>
            </button>
            <button class="tw-hub-btn" data-action="5" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                🗺️ <span>Маркер карты</span>
            </button>
            <button class="tw-hub-btn" data-action="6" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                👁️ <span>Смотр атак</span>
            </button>
            <button class="tw-hub-btn" data-action="7" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                🎯 <span>Сбор координат</span>
            </button>
            <button class="tw-hub-btn" data-action="8" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                ⏱️ <span>Авто-тайм (Атака)</span>
            </button>
            <button class="tw-hub-btn" data-action="9" style="background: #3b2812; border: 1px solid #7d510f; color: #f4e4bc; padding: 7px; text-align: left; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 3px; display: flex; align-items: center; gap: 6px;">
                📋 <span>Простой планер</span>
            </button>
        </div>

        <div style="background: #1a1006; padding: 5px 12px; font-size: 9px; color: #a98a5c; border-top: 1px solid #7d510f; text-align: right;">
            Статус: Панель активна
        </div>
    `;

    document.body.appendChild(panel);

    // Закрытие по крестику
    document.getElementById('tw-hub-close').onclick = () => panel.remove();

    // Реакция на нажатие кнопок
    panel.querySelectorAll('.tw-hub-btn').forEach(btn => {
        btn.onmouseover = () => { btn.style.background = '#5a3b0c'; btn.style.color = '#fff'; };
        btn.onmouseout = () => { btn.style.background = '#3b2812'; btn.style.color = '#f4e4bc'; };
        
        btn.onclick = function() {
            let actionId = this.getAttribute('data-action');
            panel.remove(); // Закрываем меню перед запуском скрипта

            if (actionId === 'manager') {
                const s = document.createElement('script');
                s.src = 'https://raw.githack.com/jura75/jura75-voyna-plemyon/main/Manager-orders-planner.js';
                document.head.appendChild(s);
            } else if (actionId === '1') {
                $.getScript('https://raw.githack.com/jura75/jura75-voyna-plemyon.js/main/tw-snipe-planner.js');
            } else if (actionId === '2') {
                $.getScript('https://raw.githack.com/jura75/jura75-voyna-plemyon.js/main/tw-tactical-hub.js');
            } else if (actionId === '3') {
                $.getScript('https://raw.githack.com/jura75/resource_balancer.js/main/balancer.js');
            } else if (actionId === '4') {
                if (typeof game_data === 'undefined' || game_data.screen !== 'overview_villages') {
                    alert("Откройте 'Обзор деревень'");
                    return;
                }
                const id = 'twRS';
                if ($('#' + id).length) {
                    $('#' + id).toggle();
                    return;
                }
                const s = document.createElement('script');
                s.src = 'https://raw.githack.com/jura75/avto-resource_balancer.js/main/avto-resource_balancer.js?_=' + Date.now();
                document.head.appendChild(s);
            } else if (actionId === '5') {
                $.getScript('https://raw.githack.com/jura75/tw-pro-toolkit/refs/heads/main/notes-parser.js?_=' + Date.now());
            } else if (actionId === '6') {
                fetch('https://raw.githack.com/jura75/tw-attack-timer.js/main/tw-attack-timer.js?_=' + Date.now())
                    .then(r => r.text())
                    .then(eval)
                    .catch(err => alert('Ошибка загрузки скрипта: ' + err));
            } else if (actionId === '7') {
                fetch('https://raw.githack.com/jura75/voyna-plemyon-map-scanner/main/voyna-plemyon-map-scanner.js?_=' + Date.now())
                    .then(r => r.text())
                    .then(eval)
                    .catch(err => alert('Ошибка загрузки скрипта: ' + err));
            } else if (actionId === '8') {
                const s = document.createElement('script');
                s.src = 'https://raw.githack.com/jura75/jura75-voyna-plemyon/main/avto-attack-timer.js?_=' + Date.now();
                document.head.appendChild(s);
            } else if (actionId === '9') {
                $.getScript('https://raw.githack.com/jura75/massAttackPlanner/main/massAttackPlanner.js');
            } else {
                alert('Этот скрипт пока не добавлен!');
            }
        };
    });
})();void(0);
