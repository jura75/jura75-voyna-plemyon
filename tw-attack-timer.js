javascript:(function(){
    function formatTimes(e, ms){
        function t(e){for(var t=""+e;t.length<2;)t="0"+t;return t}
        var n=new Date(e);
        let finalMs = String(ms).padStart(3, '0');
        return t(n.getDate())+"."+t(n.getMonth()+1)+" "+t(n.getHours())+":"+t(n.getMinutes())+":"+t(n.getSeconds())+"."+finalMs
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
                
                // Добавили защиту от вылетов (e.preventDefault и e.stopPropagation)
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
                        if(text.includes('Длительность:') || text.includes('Duur:')) {
                            let match = text.match(/\d+:\d{2}:\d{2}/);
                            if(match) durationText = match[0];
                        }
                    });
                    
                    if(!durationText) return;
                    
                    let dParts = durationText.split(':');
                    let durationMs = (parseInt(dParts[0], 10) * 3600 + parseInt(dParts[1], 10) * 60 + parseInt(dParts[2], 10)) * 1000;
                    
                    let commandText = $selectedCommand.text();
                    let timeMatch = commandText.match(/(\d{2}):(\d{2}):(\d{2})/);
                    
                    if(!timeMatch) return;
                    
                    let now = new Date();
                    let arrivalDate = new Date(now);
                    arrivalDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), parseInt(timeMatch[3], 10), 0);
                    
                    if(commandText.includes('завтра')) {
                        arrivalDate.setDate(arrivalDate.getDate() + 1);
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
                    
                    isAutoClickActive = !isAutoClickActive;
                    
                    if (isAutoClickActive) {
                        $(this).text('Автокликер: ВКЛ').css('color', '#006600');
                        
                        autoClickTimer = setInterval(function() {
                            var serverTime = typeof Timing !== 'undefined' && Timing.getCurrentServerTime ? Timing.getCurrentServerTime() : new Date().getTime();
                            
                            if (targetSendTimestamp - serverTime <= 20) {
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
