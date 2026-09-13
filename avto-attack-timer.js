(function(){
    if(document.getElementById("tw-visual-panel")) return;

    // --- АКТИВНЫЙ ПОТОК ДЛЯ ПРЕДОТВРАЩЕНИЯ ЗАСЫПАНИЯ ---
    try {
        if (!window.__twAudioCtx) {
            window.__twAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = window.__twAudioCtx.createOscillator();
            const gain = window.__twAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 30;
            gain.gain.value = 0.01;
            osc.connect(gain);
            gain.connect(window.__twAudioCtx.destination);
            osc.start();
        }
        if (window.__twAudioCtx.state === 'suspended') {
            window.__twAudioCtx.resume();
        }
    } catch(e) {}

    const btn = document.getElementById("troop_confirm_submit") || 
                document.getElementById("troop_confirm_go") || 
                document.querySelector(".btn-attack") || 
                document.querySelector(".btn-confirm-yes");

    if (!btn) { alert("Кнопка не найдена! Проверь, находишься ли ты на странице подтверждения атаки."); return; }

    const formElement = document.getElementById("command-data-form") || document.body;
    const durationMatch = formElement.innerText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!durationMatch) { alert("Не найдено время в пути."); return; }
    
    const travelMs = ((parseInt(durationMatch[1], 10) * 3600) + (parseInt(durationMatch[2], 10) * 60) + parseInt(durationMatch[3], 10)) * 1000;

    const p = document.createElement("div");
    p.id = "tw-visual-panel";
    p.style = "position:fixed;top:100px;left:20px;z-index:999999;background:#f4ebd0;padding:15px;border:2px solid #804000;border-radius:5px;width:240px;font-family:Arial;";
    p.innerHTML = `
        <div style="font-weight:bold;margin-bottom:5px;text-align:center;color:#804000;">Кликер (Фоновый режим)</div>
        <div style="font-size:10px;margin-bottom:2px;text-align:center;color:#555;">Время сервера:</div>
        <div id="server-clock" style="font-size:14px;font-weight:bold;text-align:center;background:#fff;padding:2px;margin-bottom:5px;font-family:monospace;">00:00:00.000</div>
        
        <div style="font-size:11px;margin-bottom:2px;">Время ПРИХОДА (чч:мм:сс.мс):</div>
        <input type="text" id="target-arrival" value="00:32:55.000" style="width:100%;text-align:center;font-weight:bold;">
        
        <button id="start-clicker" style="width:100%;margin-top:8px;cursor:pointer;font-weight:bold;padding:4px;">ВКЛЮЧИТЬ</button>
        <div id="status" style="margin-top:8px;color:#333;font-size:12px;text-align:center;font-weight:bold;">Ожидание...</div>
    `;
    document.body.appendChild(p);

    let enabled = false;
    let cachedClientX = 0;
    let cachedClientY = 0;
    const startBtn = document.getElementById("start-clicker");
    
    function getServerTimeMs() {
        if (typeof Timing !== 'undefined' && typeof Timing.getCurrentServerTime === 'function') {
            return Timing.getCurrentServerTime();
        }
        return Date.now();
    }

    // Функция точного клика с использованием кэшированных координат
    function executeClick() {
        try {
            btn.removeAttribute('disabled');
            btn.classList.remove('btn-disabled');
        } catch(e) {}

        const clientX = cachedClientX || 100;
        const clientY = cachedClientY || 100;

        ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            const evt = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: clientX,
                clientY: clientY,
                button: 0
            });
            btn.dispatchEvent(evt);
        });

        if (window.jQuery) {
            try { window.jQuery(btn).trigger('click'); } catch(e) {}
        }
        try { btn.click(); } catch(e) {}

        // Страховка отправки формы
        setTimeout(() => {
            const form = document.getElementById("command-data-form") || btn.closest('form');
            if (form && typeof form.submit === 'function') {
                form.submit();
            }
        }, 80);
    }

    startBtn.onclick = () => {
        enabled = !enabled;
        if (enabled) {
            // Кэшируем координаты кнопки прямо в момент включения, пока окно активно!
            const rect = btn.getBoundingClientRect();
            cachedClientX = rect.left + (rect.width / 2 || 10);
            cachedClientY = rect.top + (rect.height / 2 || 10);

            startBtn.innerText = "ВЫКЛЮЧИТЬ";
            startBtn.style.background = "#28a745";
            startBtn.style.color = "#fff";
            document.getElementById("status").innerText = "Жду тайма...";
            document.getElementById("status").style.color = "#000";
        } else {
            startBtn.innerText = "ВКЛЮЧИТЬ";
            startBtn.style.background = "";
            startBtn.style.color = "#000";
            document.getElementById("status").innerText = "Ожидание...";
            document.getElementById("status").style.color = "#333";
        }
    };

    function loop() {
        if (document.getElementById("tw-visual-panel")) {
            const nowMs = getServerTimeMs();
            const now = new Date(nowMs);

            const hoursStr = String(now.getHours()).padStart(2, '0');
            const minsStr = String(now.getMinutes()).padStart(2, '0');
            const secsStr = String(now.getSeconds()).padStart(2, '0');
            const msStr = String(now.getMilliseconds()).padStart(3, '0');
            
            const clockEl = document.getElementById("server-clock");
            if(clockEl) clockEl.innerText = `${hoursStr}:${minsStr}:${secsStr}.${msStr}`;

            const arrivalVal = document.getElementById("target-arrival").value.trim();
            const parts = arrivalVal.split(/[:.]/).map(item => parseInt(item, 10) || 0);
            
            let arrivalDate = new Date(now);
            arrivalDate.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] || 0);

            let arrivalTimeMs = arrivalDate.getTime();
            if (arrivalTimeMs < nowMs - 2000) {
                arrivalTimeMs += 24 * 3600 * 1000;
            }

            const targetSendMs = arrivalTimeMs - travelMs;
            const diff = targetSendMs - nowMs;

            const statusEl = document.getElementById("status");

            if (enabled) {
                if(statusEl) {
                    statusEl.innerText = "До клика: " + Math.round(diff) + " мс";
                    statusEl.style.color = "#000";
                }

                if (diff <= 50 && diff >= -500) {
                    enabled = false;
                    executeClick();

                    startBtn.innerText = "ВКЛЮЧИТЬ";
                    startBtn.style.background = "";
                    startBtn.style.color = "#000";
                    if(statusEl) {
                        statusEl.innerText = "КЛИКНУТО!";
                        statusEl.style.color = "green";
                    }
                }
            } else {
                if(statusEl) statusEl.innerText = "До отправки: " + Math.round(diff / 1000) + " сек";
            }
        }
    }

    // Запускаем через requestAnimationFrame для плавности и setInterval для надежности в фоне
    requestAnimationFrame(function animLoop() {
        loop();
        requestAnimationFrame(animLoop);
    });
    setInterval(loop, 25);
})();
