javascript:(function(){
    if(document.getElementById("tw-visual-panel")) return;

    // Ищем кнопку подтверждения (твой точный ID)
    const btn = document.getElementById("troop_confirm_submit") || 
                document.getElementById("troop_confirm_go") || 
                document.querySelector(".btn-attack") || 
                document.querySelector(".btn-confirm-yes");

    if (!btn) { alert("Кнопка не найдена! Проверь, находишься ли ты на странице подтверждения атаки."); return; }

    // Автоматически берем время в пути со страницы
    const formElement = document.getElementById("command-data-form") || document.body;
    const durationMatch = formElement.innerText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!durationMatch) { alert("Не найдено время в пути."); return; }
    
    const travelMs = ((parseInt(durationMatch[1], 10) * 3600) + (parseInt(durationMatch[2], 10) * 60) + parseInt(durationMatch[3], 10)) * 1000;

    const p = document.createElement("div");
    p.id = "tw-visual-panel";
    p.style = "position:fixed;top:100px;left:20px;z-index:999999;background:#f4ebd0;padding:15px;border:2px solid #804000;border-radius:5px;width:240px;font-family:Arial;";
    p.innerHTML = `
        <div style="font-weight:bold;margin-bottom:5px;text-align:center;color:#804000;">Кликер (По приходу)</div>
        <div style="font-size:10px;margin-bottom:2px;text-align:center;color:#555;">Время сервера:</div>
        <div id="server-clock" style="font-size:14px;font-weight:bold;text-align:center;background:#fff;padding:2px;margin-bottom:5px;font-family:monospace;">00:00:00.000</div>
        
        <div style="font-size:11px;margin-bottom:2px;">Время ПРИХОДА (чч:мм:сс.мс):</div>
        <input type="text" id="target-arrival" value="00:32:55.000" style="width:100%;text-align:center;font-weight:bold;">
        
        <button id="start-clicker" style="width:100%;margin-top:8px;cursor:pointer;font-weight:bold;padding:4px;">ВКЛЮЧИТЬ</button>
        <div id="status" style="margin-top:8px;color:#333;font-size:12px;text-align:center;font-weight:bold;">Ожидание...</div>
    `;
    document.body.appendChild(p);

    let enabled = false;
    const startBtn = document.getElementById("start-clicker");
    
    startBtn.onclick = () => {
        enabled = !enabled;
        startBtn.innerText = enabled ? "ВЫКЛЮЧИТЬ" : "ВКЛЮЧИТЬ";
        startBtn.style.background = enabled ? "#28a745" : "";
        startBtn.style.color = enabled ? "#fff" : "#000";
        document.getElementById("status").innerText = enabled ? "Жду тайма..." : "Ожидание...";
        document.getElementById("status").style.color = enabled ? "#000" : "#333";
    };

    function loop() {
        if (document.getElementById("tw-visual-panel")) {
            const nowMs = Timing.getCurrentServerTime();
            const now = new Date(nowMs);

            // Живые часы сервера
            let msStr = String(now.getMilliseconds()).padStart(3, '0');
            let hoursStr = String(now.getHours()).padStart(2, '0');
            let minsStr = String(now.getMinutes()).padStart(2, '0');
            let secsStr = String(now.getSeconds()).padStart(2, '0');
            document.getElementById("server-clock").innerText = `${hoursStr}:${minsStr}:${secsStr}.${msStr}`;

            // Текущее время в миллисекундах от начала суток
            const currentTotalMs = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();

            // Парсим введенное время прихода (поддерживает миллисекунды через точку)
            const arrivalVal = document.getElementById("target-arrival").value;
            const parts = arrivalVal.split(/[:.]/).map(item => parseInt(item, 10) || 0);
            const arrivalTotalMs = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000 + (parts[3] || 0);

            // Время отправки = Приход минус Путь
            let targetSendMs = arrivalTotalMs - travelMs;
            
            if (targetSendMs < 0) targetSendMs += 24 * 3600 * 1000;

            let diff = targetSendMs - currentTotalMs;

            if (diff < -12 * 3600 * 1000) diff += 24 * 3600 * 1000;
            if (diff > 12 * 3600 * 1000) diff -= 24 * 3600 * 1000;

            if (enabled) {
                document.getElementById("status").innerText = "До клика: " + Math.round(diff) + " мс";

                // Порог срабатывания (опережение 20мс)
                if (diff <= 20 && diff >= -500) {
                    btn.click();
                    enabled = false;
                    startBtn.innerText = "ВКЛЮЧИТЬ";
                    startBtn.style.background = "";
                    startBtn.style.color = "#000";
                    document.getElementById("status").innerText = "КЛИКНУТО!";
                    document.getElementById("status").style.color = "green";
                }
            } else {
                document.getElementById("status").innerText = "До отправки: " + Math.round(diff / 1000) + " сек";
            }
        }
        requestAnimationFrame(loop);
    }
    loop();
})();
