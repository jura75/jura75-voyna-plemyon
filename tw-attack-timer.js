javascript:(function(){
    function formatTimes(e, ms){
        function t(e){for(var t=""+e;t.length<2;)t="0"+t;return t}
        var n=new Date(e);
        let finalMs = String(ms).padStart(3, '0');
        return t(n.getUTCDate())+"."+t(n.getUTCMonth()+1)+" "+t(n.getUTCHours())+":"+t(n.getUTCMinutes())+":"+t(n.getUTCSeconds())+"."+finalMs
    };
    
    if ((game_data.screen == 'map' || game_data.screen == 'place') && $('#place_confirm_units').length > 0 && $('.sendTimeContainer').length == 0) {
        var anchor = $('.village_anchor').first().find('a').first().attr('href');
        if(!anchor) anchor = $('.village_anchor contexted').first().find('a').first().attr('href');
        
        var savedMs = localStorage.getItem('tw_manual_ms') || '000';
        
        $.get(anchor, function(html) {
            var $cc = $(html).find('.commands-container');
            if ($cc.length > 0) {
                var w = (game_data.screen == 'map') ? '100%' : ($('#content_value').width() - $('form[action*="action=command"]').find('table').first().width() - 10) + 'px';
                
                var htmlRow = '<tr class="sendTimeContainer"><td>Verstuur:</td><td><span class="sendTime" style="font-weight:bold; color:#006600;">-</span>&nbsp;&nbsp;мс: <input type="text" id="manualMsInput" value="' + savedMs + '" style="width: 45px; text-align: center; font-weight: bold;" maxlength="3" title="Миллисекунды">&nbsp;&nbsp;<button type="button" id="autoClickToggle" class="btn" style="font-weight:bold; color: #b22222;">Автокликер: ВЫКЛ</button></td></tr>';
                
                $('form[action*="action=command"]').find('table').first().css('float', 'left').find('tr').last().after(htmlRow).closest('table').after($cc.find('table').parent().html() + '<br><div style="clear:both;"></div>').next().css({'float':'right', 'width': w, 'display': 'block', 'max-height': $('form[action*="action=command"]').find('table').first().height(), 'overflow': 'scroll'}).find('tr.command-row').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var $selectedCommand = $(this);
                    
                    $selectedCommand.closest('table').find('td').css('background-color', '');
                    $selectedCommand.find('td').css('background-color', '#FFF68F');
                    
                    $('form[action*="action=command"]').data('selected-row', $selectedCommand);
                    calculateSendTime();
                }).filter(function() {
                    return $('img[src*="/return_"], img[src*="/back.png"]', this).length > 0;
                }).remove();
                
                var targetSendTimestamp = 0;
                var autoClickTimer = null;

                window.calculateSendTime = function() {
                    var $selectedCommand = $('form[action*="action=command"]').data('selected-row');
                    if(!$selectedCommand) return;
                    
                    var manualMs = parseInt($('#manualMsInput').val(), 10) || 0;
                    localStorage.setItem('tw_manual_ms', $('#manualMsInput').val());
                    
                    let durationText = "";
                    $('form[action*="action=command"]').find('table').find('tr').each(function(){
                        let text = $(this).text();
                        if(text.includes('Длительность:') || text.includes('Duur:') || text.includes('Dauer:') || text.includes('Duration:')) {
                            durationText = text;
                        }
                    });
                    
                    let durationMs = 0;
                    let matchDur = durationText.match(/(?:(\d+)[dдв:\s])?(\d+):(\d{2}):(\d{2})/);
                    if(matchDur) {
                        let days = matchDur[1] ? parseInt(matchDur[1], 10) : 0;
                        let hours = parseInt(matchDur[2], 10);
                        let minutes = parseInt(matchDur[3], 10);
                        let seconds = parseInt(matchDur[4], 10);
                        durationMs = ((days * 24 + hours) * 3600 + minutes * 60 + seconds) * 1000;
                    } else {
                        let simpleMatch = durationText.match(/(\d+):(\d{2}):(\d{2})/);
                        if(simpleMatch) {
                            durationMs = (parseInt(simpleMatch[1], 10) * 3600 + parseInt(simpleMatch[2], 10) * 60 + parseInt(simpleMatch[3], 10)) * 1000;
                        }
                    }
                    
                    if(!durationMs) return;
                    
                    let commandText = $selectedCommand.text();
                    let timeMatch = commandText.match(/(\d{2}):(\d{2}):(\d{2})/);
                    
                    if(!timeMatch) return;
                    
                    let serverTime = typeof Timing !== 'undefined' && Timing.getCurrentServerTime ? Timing.getCurrentServerTime() : new Date().getTime();
                    
                    let targetHours = parseInt(timeMatch[1], 10);
                    let targetMinutes = parseInt(timeMatch[2], 10);
                    let targetSeconds = parseInt(timeMatch[3], 10);
                    
                    let arrivalDate = new Date(serverTime);
                    arrivalDate.setUTCHours(targetHours, targetMinutes, targetSeconds, 0);
                    
                    // Улучшенный парсер суточных/дневных настроек
                    let dateMatch = commandText.match(/(\d{1,2})\.(\d{1,2})\./);
                    let isTomorrow = /завтра|morgen|tomorrow|jutro|demain|mañana|amanhã/i.test(commandText);
                    let isToday = /сегодня|today|heute|aujourd'hui|hoy|hoje/i.test(commandText);
                    
                    if (dateMatch) {
                        let targetDay = parseInt(dateMatch[1], 10);
                        let targetMonth = parseInt(dateMatch[2], 10) - 1;
                        arrivalDate.setUTCMonth(targetMonth, targetDay);
                        // Если дата по какой-то причине оказалась в прошлом, переносим на следующий год/месяц
                        if (arrivalDate.getTime() < serverTime - 86400000) {
                            arrivalDate.setUTCMonth(arrivalDate.getUTCMonth() + 1);
                        }
                    } else if (isTomorrow) {
                        arrivalDate.setUTCDate(arrivalDate.getUTCDate() + 1);
                    } else if (!isToday && arrivalDate.getTime() < serverTime) {
                        arrivalDate.setUTCDate(arrivalDate.getUTCDate() + 1);
                    }
                    
                    targetSendTimestamp = arrivalDate.getTime() - durationMs + manualMs;
                    
                    $('.sendTime').html(formatTimes(targetSendTimestamp - manualMs, manualMs));
                    document.title = formatTimes(targetSendTimestamp - manualMs, manualMs);
                };
                
                $(document).on('input', '#manualMsInput', function() {
                    window.calculateSendTime();
                });
                
                var isAutoClickActive = false;
                
                $('#autoClickToggle').on('click', function() {
                    if (!targetSendTimestamp) {
                        alert("Сначала выберите приказ из списка справа!");
                        return;
                    }
                    
                    var serverTime = typeof Timing !== 'undefined' && Timing.getCurrentServerTime ? Timing.getCurrentServerTime() : new Date().getTime();
                    if (targetSendTimestamp <= serverTime) {
                        alert("Ошибка: Время отправки этого приказа уже прошло!");
                        return;
                    }
                    
                    isAutoClickActive = !isAutoClickActive;
                    
                    if (isAutoClickActive) {
                        $(this).text('Автокликер: ВКЛ').css('color', '#006600');
                        
                        autoClickTimer = setInterval(function() {
                            var currentServerTime = typeof Timing !== 'undefined' && Timing.getCurrentServerTime ? Timing.getCurrentServerTime() : new Date().getTime();
                            
                            if (currentServerTime > targetSendTimestamp) {
                                clearInterval(autoClickTimer);
                                isAutoClickActive = false;
                                $('#autoClickToggle').text('Автокликер: ВЫКЛ').css('color', '#b22222');
                                return;
                            }
                            
                            if (targetSendTimestamp - currentServerTime <= 20) {
                                clearInterval(autoClickTimer);
                                
                                var $submitBtn = $('#place_confirm_submit');
                                if ($submitBtn.length > 0) {
                                    $submitBtn[0].click();
                                } else {
                                    $('input[type="submit"], button[type="submit"]').first().click();
                                }
                            }
                        }, 10);
                        
                    } else {
                        $(this).text('Автокликер: ВЫКЛ').css('color', '#b22222');
                        if (autoClickTimer) clearInterval(autoClickTimer);
                    }
                });
                
                $('.widget-command-timer').addClass('timer');
                if(typeof Timing !== 'undefined' && Timing.tickHandlers && Timing.tickHandlers.timers) {
                    Timing.tickHandlers.timers.initTimers('widget-command-timer');
                }
            } else {
                UI.ErrorMessage('Geen bevelen gevonden');
            }
        });
    }
})();
