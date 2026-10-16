javascript:(function() {
    // 1. Защита от усыпления вкладки в фоне
    try {
        if (!window.__twAudioCtx) {
            window.__twAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const o = window.__twAudioCtx.createOscillator();
            const g = window.__twAudioCtx.createGain();
            o.type = 'sine';
            o.frequency.value = 30;
            g.gain.value = 0.01;
            o.connect(g);
            g.connect(window.__twAudioCtx.destination);
            o.start();
        }
        if (window.__twAudioCtx.state === 'suspended') {
            window.__twAudioCtx.resume();
        }
    } catch (e) {}

    if (typeof game_data === 'undefined' || (game_data.screen !== 'map' && game_data.screen !== 'place')) {
        alert("Откройте карту или площадь игры!");
        return;
    }

    if ($('#twTimingBox').length > 0) {
        $('#twTimingBox').toggle();
        return;
    }

    var anchor = $('.village_anchor').first().find('a').first().attr('href');
    if (!anchor) anchor = $('.village_anchor contexted').first().find('a').first().attr('href');
    
    var savedMs = localStorage.getItem('tw_manual_ms') || '100';

    function initScriptPanel(htmlContent) {
        var $cc = htmlContent ? $(htmlContent).find('.commands-container') : $('.commands-container');
        
        let arrTimeText = "";
        let durText = "";
        $('form[action*="action=command"] table tr, .main table tr').each(function() {
            let t = $(this).text();
            if (t.includes('Прибытие:') || t.includes('Aankomst:')) {
                let m = t.match(/\d{2}:\d{2}:\d{2}/);
                if (m) arrTimeText = m[0] + '.000';
            }
            if (t.includes('Длительность:') || t.includes('Duur:') || t.includes('Dauer:') || t.includes('Duration:')) {
                let m = t.match(/\d+:\d{2}:\d{2}/);
                if (m) durText = m[0];
            }
        });

        let nowServer = (typeof Timing !== 'undefined' && Timing.getCurrentServerTime) ? new Date(Timing.getCurrentServerTime()) : new Date();
        let pad = n => n < 10 ? '0' + n : n;
        let todayDateStr = pad(nowServer.getDate()) + '.' + pad(nowServer.getMonth() + 1) + '.' + String(nowServer.getFullYear()).slice(-2);

        let p = $('<div>').attr('id', 'twTimingBox').css({
            position: 'fixed', top: '70px', right: '30px', zIndex: 999999,
            background: '#f4ebd0', border: '3px solid #804000', borderRadius: '6px',
            padding: '10px', width: '310px', fontFamily: 'Arial', color: '#333',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }).html(
            '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #804000;padding-bottom:4px;margin-bottom:8px;">' +
            '<b style="color:#804000;font-size:12px;">⏱️ Тактический Тайминг</b>' +
            '<span onclick="$(\'#twTimingBox\').remove()" style="cursor:pointer;color:#804000;font-weight:bold;font-size:12px;">✖</span></div>' +
            '<div style="font-size:10px;color:#666;margin-bottom:6px;text-align:center;">Время сервера: <span id="server-clock" style="font-family:monospace;font-weight:bold;">00:00:00.000</span></div>' +
            '<div style="margin-bottom:6px;"><b style="font-size:11px;">Дата прихода (ДД.ММ.ГГ):</b><br><input type="text" id="tDate" value="' + todayDateStr + '" maxlength="10" style="width:100%;box-sizing:border-box;font-size:11px;padding:3px;text-align:center;font-weight:bold;"></div>' +
            '<div style="margin-bottom:6px;"><b style="font-size:11px;">Время прихода (ЧЧ:ММ:СС.МС):</b><br><input type="text" id="tTime" value="' + arrTimeText + '" maxlength="12" style="width:100%;box-sizing:border-box;font-size:11px;padding:3px;text-align:center;font-weight:bold;"></div>' +
            '<div style="margin-bottom:6px;"><b style="font-size:11px;">Время в пути (ЧЧ:ММ:СС):</b><br><input type="text" id="tDur" value="' + durText + '" style="width:100%;box-sizing:border-box;font-size:11px;padding:3px;text-align:center;"></div>' +
            '<div style="margin-bottom:8px;"><b style="font-size:11px;">Поправка на пинг (мс):</b><br><input type="text" id="tMs" value="' + savedMs + '" style="width:100%;box-sizing:border-box;font-size:11px;padding:3px;text-align:center;"></div>' +
            '<button id="tBtn" style="width:100%;background:linear-gradient(#b57333,#804000);color:#fff;border:1px solid #572b00;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;margin-bottom:6px;">⚙️ Рассчитать и запустить</button>' +
            '<div id="tRes" style="font-size:11px;background:#fff;padding:6px;border:1px solid #dfcca6;min-height:35px;color:#333;text-align:center;font-weight:bold;">Выберите приказ или введите время</div>'
        );
        $('body').append(p);

        // Автомаска для даты (ДД.ММ.ГГ)
        $(document).on('input', '#tDate', function() {
            let v = this.value.replace(/\D/g, '');
            if (v.length > 2) v = v.substring(0,2) + '.' + v.substring(2);
            if (v.length > 5) v = v.substring(0,5) + '.' + v.substring(5, 8);
            this.value = v;
        });

        // Свободная автомаска для времени с миллисекундами (ЧЧ:ММ:СС.МС)
        $(document).on('input', '#tTime', function() {
            let raw = this.value.replace(/\D/g, '');
            if (raw.length > 6) {
                let timePart = raw.substring(0, 6);
                let msPart = raw.substring(6, 9);
                let h = timePart.substring(0, 2);
                let m = timePart.substring(2, 4);
                let s = timePart.substring(4, 6);
                this.value = h + ':' + m + ':' + s + (msPart ? '.' + msPart : '');
            } else if (raw.length > 4) {
                let h = raw.substring(0, 2);
                let m = raw.substring(2, 4);
                let s = raw.substring(4, 6);
                this.value = h + ':' + m + (s ? ':' + s : '');
            } else if (raw.length > 2) {
                let h = raw.substring(0, 2);
                let m = raw.substring(2, 4);
                this.value = h + (m ? ':' + m : '');
            } else {
                this.value = raw;
            }
        });

        if ($cc.length > 0) {
            var w = (game_data.screen == 'map') ? '100%' : ($('#content_value').width() - $('form[action*="action=command"]').find('table').first().width() - 10) + 'px';
            $('form[action*="action=command"]').find('table').first().css('float', 'left').after($cc.parent().html() + '<br><div style="clear:both;"></div>').next().css({
                'float': 'right', 'width': w, 'display': 'block', 'max-height': '250px', 'overflow': 'scroll'
            }).find('tr.command-row').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var $selectedCommand = $(this);
                $selectedCommand.closest('table').find('td').css('background-color', '');
                $selectedCommand.find('td').css('background-color', '#FFF68F');
                
                let commandText = $selectedCommand.text();
                let timeMatch = commandText.match(/(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
                let dateMatch = commandText.match(/(\d{1,2})\.(\d{1,2})\./);
                let isTomorrow = /завтра|morgen|tomorrow|jutro|demain|mañana|amanhã/i.test(commandText);

                if (timeMatch) {
                    let msPart = timeMatch[4] ? timeMatch[4] : '000';
                    $('#tTime').val(timeMatch[1] + ':' + timeMatch[2] + ':' + timeMatch[3] + '.' + msPart);
                }

                let sTime = getServerTimeMs();
                let sDate = new Date(sTime);
                let pad2 = n => String(n).padStart(2, '0');

                if (dateMatch) {
                    let d = parseInt(dateMatch[1], 10);
                    let m = parseInt(dateMatch[2], 10);
                    let y = String(sDate.getFullYear()).slice(-2);
                    $('#tDate').val(pad2(d) + '.' + pad2(m) + '.' + y);
                } else if (isTomorrow) {
                    let tom = new Date(sTime + 86400000);
                    $('#tDate').val(pad2(tom.getDate()) + '.' + pad2(tom.getMonth() + 1) + '.' + String(tom.getFullYear()).slice(-2));
                } else {
                    $('#tDate').val(pad2(sDate.getDate()) + '.' + pad2(sDate.getMonth() + 1) + '.' + String(sDate.getFullYear()).slice(-2));
                }
            }).filter(function() {
                return $('img[src*="/return_"], img[src*="/back.png"]', this).length > 0;
            }).remove();
        }

        let enabled = false;
        let sendTimeMs = 0;

        function getServerTimeMs() {
            if (typeof Timing !== 'undefined' && typeof Timing.getCurrentServerTime === 'function') {
                return Timing.getCurrentServerTime();
            }
            return Date.now();
        }

        function executeClick() {
            const btn = document.getElementById("troop_confirm_submit") || 
                        document.getElementById("troop_confirm_go") || 
                        document.querySelector(".btn-attack") || 
                        document.querySelector(".btn-confirm-yes") || 
                        document.querySelector('form[action*="action=command"] input[type="submit"]');
            
            if (!btn) return;

            let rect = btn.getBoundingClientRect();
            let cachedClientX = rect.left + (rect.width / 2 || 10);
            let cachedClientY = rect.top + (rect.height / 2 || 10);

            try {
                btn.removeAttribute('disabled');
                btn.classList.remove('btn-disabled');
            } catch(e) {}

            ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(et => {
                let evt = new MouseEvent(et, {
                    view: window, bubbles: true, cancelable: true,
                    clientX: cachedClientX, clientY: cachedClientY, button: 0
                });
                btn.dispatchEvent(evt);
            });

            if (window.jQuery) {
                try { window.jQuery(btn).trigger('click'); } catch(e) {}
            }
            try { btn.click(); } catch(e) {}

            setTimeout(() => {
                let f = document.getElementById("command-data-form") || btn.closest('form') || document.querySelector('form[action*="action=command"]');
                if (f && typeof f.submit === 'function') {
                    f.submit();
                }
            }, 80);
        }

        $('#tBtn').click(function() {
            let dateStr = $('#tDate').val().trim();
            let timeStr = $('#tTime').val().trim();
            let durStr = $('#tDur').val().trim();
            let msVal = parseInt($('#tMs').val(), 10) || 0;
            
            localStorage.setItem('tw_manual_ms', $('#tMs').val());

            if (!dateStr || !timeStr || !durStr) {
                $('#tRes').html('<span style="color:red;">Заполните дату, время и длительность!</span>');
                return;
            }

            let dParts = dateStr.split('.');
            let durParts = durStr.split(':');

            let timeMatch = timeStr.match(/(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
            if (dParts.length < 3 || !timeMatch || durParts.length < 3) {
                $('#tRes').html('<span style="color:red;">Неверный формат данных!</span>');
                return;
            }

            let day = parseInt(dParts[0], 10);
            let month = parseInt(dParts[1], 10) - 1;
            let year = parseInt(dParts[2], 10);
            if (year < 100) year += 2000;

            let hours = parseInt(timeMatch[1], 10);
            let minutes = parseInt(timeMatch[2], 10);
            let seconds = parseInt(timeMatch[3], 10);
            let ms = timeMatch[4] ? parseInt(timeMatch[4].padEnd(3, '0'), 10) : 0;

            let durationMs = ((parseInt(durParts[0], 10) * 3600) + (parseInt(durParts[1], 10) * 60) + parseInt(durParts[2], 10)) * 1000;
            
            let arrivalDate = new Date(year, month, day, hours, minutes, seconds, ms);

            sendTimeMs = arrivalDate.getTime() - durationMs - msVal;
            let delay = sendTimeMs - getServerTimeMs();

            if (delay < -2000) {
                $('#tRes').html('<span style="color:red;">Время отправки уже прошло!</span>');
                return;
            }

            enabled = true;
            $(this).css('background', '#28a745').text('✅ ТАЙМИНГ АКТИВЕН');
            $('#tRes').css('color', '#000');
        });

        function loop() {
            let nowMs = getServerTimeMs();
            let now = new Date(nowMs);
            let clockEl = document.getElementById("server-clock");
            if (clockEl) {
                clockEl.innerText = String(now.getHours()).padStart(2,'0') + ':' + 
                                    String(now.getMinutes()).padStart(2,'0') + ':' + 
                                    String(now.getSeconds()).padStart(2,'0') + '.' + 
                                    String(now.getMilliseconds()).padStart(3,'0');
            }

            if (enabled && sendTimeMs > 0) {
                let diff = sendTimeMs - nowMs;
                let statusEl = document.getElementById("tRes");
                if (statusEl) {
                    statusEl.innerHTML = 'Осталось до клика: <span style="color:#d9822b;">' + Math.round(diff) + ' мс</span>';
                }
                if (diff <= 50 && diff >= -200) {
                    enabled = false;
                    executeClick();
                    if (statusEl) {
                        statusEl.innerHTML = '<span style="color:green;font-size:13px;">🚀 КЛИК ОТПРАВЛЕН!</span>';
                    }
                    $('#tBtn').css('background', 'linear-gradient(#b57333,#804000)').text('⚙️ Рассчитать и запустить');
                }
            }
        }

        requestAnimationFrame(function animLoop() {
            loop();
            requestAnimationFrame(animLoop);
        });
        setInterval(loop, 25);
    }

    if (anchor) {
        $.get(anchor, function(html) {
            initScriptPanel(html);
        });
    } else {
        initScriptPanel(null);
    }
})();
