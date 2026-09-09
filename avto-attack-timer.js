(function(){
    if(document.getElementById("tw-visual-panel")) return;

    // --- АКТИВНЫЙ ПОТОК ДЛЯ ПРЕДОТВРАЩЕНИЯ СОНА ---
    try {
        if (!window.__twAudioCtx) {
            window.__twAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = window.__twAudioCtx.createOscillator();
            const gain = window.__twAudioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 30; // Низкая частота
            gain.gain.value = 0.01;   // Тихий звук
            osc.connect(gain);
            gain.connect(window.__twAudioCtx.destination);
            osc.start();
        }
        if (window.__twAudioCtx.state === 'suspended') {
            window.__twAudioCtx.resume();
        }
    } catch(e) {
        console.log("AudioContext error:", e);
    }
    // ---------------------------------------------

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
        <div style="font-weight:bold;margin-bottom:5px;text-align:center;color:#804000;">Кликер (Отдельное окно)</div>
        <div style="font-size:10px;margin-bottom:2px;text-align:center;color:#555;">Время сервера (DOM):</div>
        <div id="server-clock" style="font-size:14px;font-weight:bold;text-align:center;background:#fff;padding:2px;margin-bottom:5px;font-family:monospace;">00:00:00.000</div>
        
        <div style="font-size:11px;margin-bottom:2px;">Время ПРИХОДА (чч:мм:сс.мс):</div>
        <input type="text" id="target-arrival" value="00:32:55.000" style="width:100%;text-align:center;font-weight:bold;">
        
        <button id="start-clicker" style="width:100%;margin-top:8px;cursor:pointer;font-weight:bold;padding:4px;">ВКЛЮЧИТЬ</button>
        <div id="status" style="margin-top:8px;color:#333;font-size:12px;text-align:center;font-weight:bold;">Ожидание...</div>
    `;
    document.body.appendChild(p);

    let enabled = false;
    let baseServerMs = 0;
    let basePerformanceTime = 0;
    const startBtn = document.getElementById("start-clicker");
    
    function getPageServerTime() {
        const timeEl = document.getElementById("serverTime") || document.querySelector(".server_time") || document.querySelector("[id*='serverTime']");
        if (timeEl) {
            const parts = timeEl.innerText.trim().split(':').map(Number);
            if (parts.length === 3 && !isNaN(parts[0])) {
                return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
            }
        }
        if (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) {
            return Timing.getCurrentServerTime() % (24 * 3600 * 1000);
        }
        return null;
    }

    startBtn.onclick = () => {
        enabled = !enabled;
        if (enabled) {
            const serverMs = getPageServerTime();
            if (serverMs !== null) {
                baseServerMs = serverMs;
                basePerformanceTime = performance.now();
            } else {
                alert("Не удалось считать время со страницы!");
                enabled = false;
                return;
            }

            startBtn.innerText = "ВКЛЮЧИТЬ";
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
            let currentTotalMs;

            if (enabled) {
                const elapsed = performance.now() - basePerformanceTime;
                currentTotalMs = baseServerMs + elapsed;
            } else {
                const serverMs = getPageServerTime();
                currentTotalMs = serverMs !== null ? serverMs : Date.now();
            }

            currentTotalMs = currentTotalMs % (24 * 3600 * 1000);
            if (currentTotalMs < 0) currentTotalMs += 24 * 3600 * 1000;

            const totalSec = Math.floor(currentTotalMs / 1000);
            const ms = Math.floor(currentTotalMs % 1000);
            const hours = Math.floor(totalSec / 3600) % 24;
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            let msStr = String(ms).padStart(3, '0');
            let hoursStr = String(hours).padStart(2, '0');
            let minsStr = String(mins).padStart(2, '0');
            let secsStr = String(secs).padStart(2, '0');
            
            const clockEl = document.getElementById("server-clock");
            if(clockEl) clockEl.innerText = `${hoursStr}:${minsStr}:${secsStr}.${msStr}`;

            const arrivalVal = document.getElementById("target-arrival").value;
            const parts = arrivalVal.split(/[:.]/).map(item => parseInt(item, 10) || 0);
            const arrivalTotalMs = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000 + (parts[3] || 0);

            let targetSendMs = arrivalTotalMs - travelMs;
            if (targetSendMs < 0) targetSendMs += 24 * 3600 * 1000;

            let diff = targetSendMs - currentTotalMs;
            if (diff < -12 * 3600 * 1000) diff += 24 * 3600 * 1000;
            if (diff > 12 * 3600 * 1000) diff -= 24 * 3600 * 1000;

            const statusEl = document.getElementById("status");

            if (enabled) {
                if(statusEl) {
                    statusEl.innerText = "До клика: " + Math.round(diff) + " мс";
                    statusEl.style.color = "#000";
                }

                if (diff <= 20 && diff >= -500) {
                    btn.click();
                    enabled = false;
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
        setTimeout(loop, 25);
    }
    loop();
})();
