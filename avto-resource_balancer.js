javascript:(function(){
    if(typeof game_data==='undefined'||game_data.screen!=='overview_villages'){alert("Откройте 'Обзор деревень'");return;}
    let p=$('#twRS');if(p.length){p.toggle();return;}
    
    let g='<option value="0">Все</option>',s=new Set(['0']);
    $('#group_id option, #group_menu a, .group-menu-item, select[name="group"] option, #paged_view_content select option').each(function(){
        let v=$(this).val()||$(this).attr('data-group-id')||($(this).attr('href')?new URLSearchParams($(this).attr('href').split('?')[1]).get('group'):null);
        let t=$(this).text().trim();
        if(v&&!s.has(v)&&t&&t!=='0'&&!t.includes('Все группы')){s.add(v);g+='<option value="'+v+'">'+t+'</option>';}
    });

    p=$('<div>').attr('id','twRS').css({position:'fixed',top:'60px',right:'20px',zIndex:999999,background:'#f4ebd0',border:'3px solid #804000',borderRadius:'8px',padding:'10px',width:'380px',maxHeight:'90vh',overflowY:'auto',fontFamily:'Arial',color:'#333'}).html(
        '<h4 style="margin:0 0 8px 0;color:#804000;text-align:center;font-size:14px;font-weight:bold;">Умный Балансир Ресурсов</h4>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'+
            '<div style="width:48%;"><b style="font-size:11px;">Донор (Откуда):</b><br><select id="rsD" style="width:100%;font-size:11px;">'+g+'</select></div>'+
            '<div style="width:48%;"><b style="font-size:11px;">Получатель (Куда):</b><br><select id="rsT" style="width:100%;font-size:11px;">'+g+'</select></div>'+
        '</div>'+
        '<div style="margin-bottom:6px;"><b style="font-size:11px;">Координаты получателей (опционально, через пробел):</b><br><input type="text" id="rsCoords" placeholder="500|400 501|401" style="width:100%;box-sizing:border-box;font-size:11px;padding:2px;"></div>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">'+
            '<div style="width:48%;"><b style="font-size:11px;">Мин. склад донора %:</b><br><input type="number" id="rsDP" value="80" style="width:100%;text-align:center;font-size:11px;"></div>'+
            '<div style="width:48%;"><b style="font-size:11px;">Цель склад получателя %:</b><br><input type="number" id="rsTP" value="100" style="width:100%;text-align:center;font-size:11px;"></div>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px;">'+
            '<button id="rsCalc" style="background:#804000;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;">Рассчитать</button>'+
            '<button id="rsManual" style="background:#d9822b;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;">Ручная отправка</button>'+
        '</div>'+
        '<button id="rsAuto" style="width:100%;background:#28a745;color:#fff;border:none;padding:6px;font-weight:bold;cursor:pointer;font-size:11px;border-radius:3px;margin-bottom:6px;">Авто-отправка (Фон)</button>'+
        '<b style="font-size:11px;color:#804000;">Лог маршрутов (Откуда &rarr; Куда):</b>'+
        '<div id="rsSt" style="font-size:11px;background:#fff;padding:5px;border:1px solid #dfcca6;min-height:60px;max-height:160px;overflow-y:auto;margin-top:2px;">Готов к работе. Выберите параметры.</div>'+
        '<div style="text-align:right;margin-top:6px;"><span onclick="$(\'#twRS\').hide()" style="cursor:pointer;color:#804000;font-size:11px;font-weight:bold;">[ Закрыть панель ]</span></div>'
    );
    $('body').append(p);

    let num = s => parseInt(String(s).replace(/\./g,'').replace(/\s/g,''), 10) || 0;

    window.rsSend = function(b, sId, tId, w, st, i, c) {
        $(b).prop('disabled', true).text('⏳');
        let pl = {wood: w, stone: st, iron: i};
        if(c){ let cp = c.split('|'); pl.x = cp[0]; pl.y = cp[1]; } else { pl.target_id = tId; }
        TribalWars.post('market', {ajaxaction: 'map_send', village: sId}, pl, function(){
            $(b).text('✓').css('background', '#28a745');
            let sum = w + st + i;
            window.rsTotalSent = (window.rsTotalSent || 0) + sum;
            $('#rsTotalInfo').text('📦 Всего отправлено ресурсов: ' + window.rsTotalSent.toLocaleString());
        }, function(){
            $(b).text('❌').css('background', '#dc3545').prop('disabled', false);
        });
    };

    function parse($pg, arr) {
        let rows = $pg.find('#production_table tr, tr.row_a, tr.row_b, tr.row_marker');
        if(!rows.length) rows = $pg.find('.overview_table tr');
        
        rows.each(function(){
            let $r = $(this);
            let vn = $r.find('.quickedit-vn, .quickedit-label').first();
            if(!vn.length) return;
            
            let name = vn.innerText || vn.text();
            name = name ? name.trim() : '';
            let linkEl = $r.find('a[href*="village="]').first();
            let vId = linkEl.length ? (linkEl.attr('href').match(/village=(\d+)/) || [])[1] : '';
            if(!vId) return;

            // Надежный построчный поиск ресурсов (Дерево, Глина, Железо)
            let wEl = $r.find('.res.wood, .wood').first();
            let sEl = $r.find('.res.stone, .stone').first();
            let iEl = $r.find('.res.iron, .iron').first();
            
            let wood = num(wEl.text());
            let stone = num(sEl.text());
            let iron = num(iEl.text());

            let mText = '';
            $r.find('td').each(function(){
                let txt = $(this).text();
                if(txt.includes('/') && /\d+\/\d+/.test(txt) && !mText) {
                    mText = txt;
                }
            });
            let mM = mText.match(/(\d+)\/(\d+)/);
            let merchants = mM ? parseInt(mM[1], 10) : 0;

            let cap = 400000;
            let foundCap = false;
            
            $r.find('td').each(function(){
                let t = $(this).text().trim();
                let cleanNum = num(t);
                if(!foundCap && cleanNum >= 1000 && cleanNum <= 400000) {
                    if(cleanNum % 1000 === 0 || cleanNum === 40000 || cleanNum === 2500 || cleanNum === 5000 || cleanNum === 10000 || cleanNum === 15000 || cleanNum === 20000 || cleanNum === 30000 || cleanNum === 50000 || cleanNum === 75000 || cleanNum === 100000 || cleanNum === 200000 || cleanNum === 300000 || cleanNum === 400000) {
                        cap = cleanNum;
                        foundCap = true;
                    }
                }
            });

            if(!foundCap) {
                let maxRes = Math.max(wood, stone, iron);
                $r.find('td').each(function(){
                    let c = num($(this).text());
                    if(c >= maxRes && c < cap) {
                        cap = c;
                    }
                });
            }

            arr.push({id: vId, name: name, wood: wood, stone: stone, iron: iron, merchants: merchants, cap: cap});
        });
    }

    function runCalc(isAuto) {
        let st = $('#rsSt'), dG = $('#rsD').val(), tG = $('#rsT').val(), coordsInput = $('#rsCoords').val().trim();
        let kP = parseFloat($('#rsDP').val()) / 100, mP = parseFloat($('#rsTP').val()) / 100;
        let sfx = game_data.player.sitter > 0 ? 'game.php?t=' + game_data.player.id + '&' : 'game.php?';
        st.html('Загрузка...');
        window.rsTotalSent = 0;
        let coordList = coordsInput ? coordsInput.match(/\d{3}\|\d{3}/g) : null;

        $.get(sfx + 'screen=overview_villages&mode=prod&group=' + dG + '&page=-1&', function(dP){
            let rawDonors = [];
            parse($(dP), rawDonors);
            if(!rawDonors.length){ st.html('Нет доноров в выбранной группе'); return; }

            if(coordList && coordList.length) {
                let cleanHtml = '';
                let cnt = 0, cIdx = 0;
                rawDonors.forEach(d => {
                    let kA = Math.floor(d.cap * kP);
                    let sW = Math.max(0, d.wood - kA), sS = Math.max(0, d.stone - kA), sI = Math.max(0, d.iron - kA);
                    let tot = sW + sS + sI;
                    if(tot <= 200 || d.merchants <= 0) return;
                    let tc = coordList[cIdx % coordList.length]; cIdx++;
                    let maxM = d.merchants * 1000;
                    if(tot > maxM){ let r = maxM / tot; sW = Math.floor(sW * r); sS = Math.floor(sS * r); sI = Math.floor(sI * r); }
                    cleanHtml += '<div style="border-bottom:1px solid #dfcca6;padding:3px 0;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;"><b>'+d.name+'</b> &rarr; <b>['+tc+']</b><br>Д:'+sW+' Г:'+sS+' Ж:'+sI+'</span><button onclick="rsSend(this,\''+d.id+'\',\''+tc+'\','+sW+','+sS+','+sI+')" style="background:#28a745;color:#fff;border:none;padding:3px 6px;cursor:pointer;border-radius:3px;font-weight:bold;">Отправить</button></div>';
                    cnt++;
                });
                st.html('<div id="rsTotalInfo" style="font-weight:bold;color:#804000;margin-bottom:4px;">📦 Всего отправлено ресурсов: 0</div>'+(cleanHtml?'<b>План на координаты ('+cnt+'):</b><br>'+cleanHtml:'Нет избытков'));
                if(isAuto)$('#rsAuto').trigger('click');
            } else {
                $.get(sfx + 'screen=overview_villages&mode=prod&group=' + tG + '&page=-1&', function(tP){
                    let targets = [];
                    parse($(tP), targets);
                    if(!targets.length){ st.html('Нет получателей в выбранной группе'); return; }
                    
                    let targetIds = new Set(targets.map(t => t.id));
                    let donors = rawDonors.filter(d => !targetIds.has(d.id));

                    if(!donors.length){ st.html('Все доноры входят в группу получателей (пересечение групп)'); return; }

                    targets.forEach(t => { 
                        t.vW = t.wood; t.vS = t.stone; t.vI = t.iron; 
                    });
                    
                    let html = '', cnt = 0;
                    
                    targets.forEach(t => {
                        donors.forEach(d => {
                            if(d.merchants <= 0 || d.id === t.id) return;

                            let kA = Math.floor(d.cap * kP);
                            let aW = Math.max(0, d.wood - kA);
                            let aS = Math.max(0, d.stone - kA);
                            let aI = Math.max(0, d.iron - kA);
                            if(aW < 200 && aS < 200 && aI < 200) return;

                            let targetResCap = Math.floor(t.cap * mP);

                            let needW = Math.max(0, targetResCap - t.vW);
                            let needS = Math.max(0, targetResCap - t.vS);
                            let needI = Math.max(0, targetResCap - t.vI);

                            let sW = Math.min(aW, needW);
                            let sS = Math.min(aS, needS);
                            let sI = Math.min(aI, needI);
                            let tot = sW + sS + sI;
                            if(tot < 200) return;

                            let maxM = d.merchants * 1000;
                            if(tot > maxM){
                                let r = maxM / tot;
                                sW = Math.floor(sW * r);
                                sS = Math.floor(sS * r);
                                sI = Math.floor(sI * r);
                                tot = sW + sS + sI;
                            }
                            if(sW < 100 && sS < 100 && sI < 100) return;

                            d.wood -= sW; d.stone -= sS; d.iron -= sI;
                            d.merchants -= Math.ceil(tot / 1000);
                            
                            t.vW += sW; t.vS += sS; t.vI += sI;

                            html += '<div style="border-bottom:1px solid #dfcca6;padding:3px 0;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;"><b>'+d.name+'</b> &rarr; <b>'+t.name+'</b><br>Д:'+sW+' Г:'+sS+' Ж:'+sI+'</span><button onclick="rsSend(this,\''+d.id+'\',\''+t.id+'\','+sW+','+sS+','+sI+')" style="background:#28a745;color:#fff;border:none;padding:3px 6px;cursor:pointer;border-radius:3px;font-weight:bold;">Отправить</button></div>';
                            cnt++;
                        });
                    });

                    st.html('<div id="rsTotalInfo" style="font-weight:bold;color:#804000;margin-bottom:4px;">📦 Всего отправлено ресурсов: 0</div>'+(html?'<b>План между группами ('+cnt+'):</b><br>'+html:'Нет избытков для отправки'));
                    if(isAuto)$('#rsAuto').trigger('click');
                });
            }
        });
    }

    $('#rsCalc').click(() => runCalc(false));
    $('#rsManual').click(() => runCalc(false));
    $('#rsAuto').click(function(){
        let btns = $('#rsSt button').toArray();
        if(!btns.length){ runCalc(true); return; }
        let i = 0;
        function next(){
            if(i >= btns.length){ $('#rsSt').prepend('<b style="color:green;">✨ Все задачи выполнены!</b><br>'); return; }
            if(!btns[i].disabled){ btns[i].click(); }
            i++;
            setTimeout(next, 700);
        }
        next();
    });
})();
