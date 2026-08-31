javascript:(function(){
    if(typeof game_data==='undefined'||game_data.screen!=='overview_villages'){
        alert("Откройте вкладку: Обзор деревень");
        return;
    }
    let p=$('#indepBalancerPanel');
    if(p.length){p.toggle();return;}
    
    let g='<option value="0">Все деревни (Группа 0)</option>';
    $('#group_id option, #group_menu a, .group-menu-item, select[name="group"] option').each(function(){
        let v=$(this).val()||$(this).attr('data-group-id')||($(this).attr('href')?new URLSearchParams($(this).attr('href').split('?')[1]).get('group'):null);
        let t=$(this).text().trim();
        if(v&&v!=='0'&&t){g+='<option value="'+v+'">'+t+'</option>';}
    });

    p=$('<div>').attr('id','indepBalancerPanel').css({
        position:'fixed',top:'70px',right:'20px',zIndex:999999,
        background:'#f4ebd0',border:'3px solid #804000',borderRadius:'8px',
        padding:'12px',width:'380px',maxHeight:'90vh',overflowY:'auto',
        fontFamily:'Arial',boxShadow:'0 5px 15px rgba(0,0,0,0.4)',color:'#333'
    }).html(
        '<h4 style="margin:0 0 8px 0;color:#804000;text-align:center;font-size:14px;font-weight:bold;">Раздельный Балансир (Масс-координаты)</h4>'+
        
        '<div style="margin-bottom:6px;background:#e9dcbc;padding:5px;border-radius:4px;">'+
        '<label style="font-size:11px;font-weight:bold;display:block;margin-bottom:2px;">Режим работы:</label>'+
        '<select id="sendMode" style="width:100%;padding:4px;font-size:11px;background:#fff;border:1px solid #dfcca6;border-radius:4px;">'+
        '<option value="groups">Баланс между группами</option>'+
        '<option value="coords">Отправка по списку координат</option>'+
        '</select>'+
        '</div>'+
        
        '<div id="blockGroups">'+
        '<div style="margin-bottom:6px;"><label style="font-size:11px;font-weight:bold;display:block;">Группа получателей:</label><select id="tGS" style="width:100%;padding:4px;font-size:11px;background:#fff;border:1px solid #dfcca6;border-radius:4px;">'+g+'</select></div>'+
        '<div style="margin-bottom:8px;"><label style="font-size:11px;font-weight:bold;display:block;">Группа доноров:</label><select id="dGS" style="width:100%;padding:4px;font-size:11px;background:#fff;border:1px solid #dfcca6;border-radius:4px;">'+g+'</select></div>'+
        '</div>'+
        
        '<div id="blockCoords" style="display:none;">'+
        '<div style="margin-bottom:6px;"><label style="font-size:11px;font-weight:bold;display:block;">Группа доноров:</label><select id="dGS_coords" style="width:100%;padding:4px;font-size:11px;background:#fff;border:1px solid #dfcca6;border-radius:4px;">'+g+'</select></div>'+
        '<div style="margin-bottom:8px;"><label style="font-size:11px;font-weight:bold;display:block;">Координаты целей (список, текст, BB-код):</label>'+
        '<textarea id="targetCoordInput" placeholder="500|500 501|502&#10;[coord]503|503[/coord]" style="width:100%;height:60px;box-sizing:border-box;font-size:11px;padding:4px;background:#fff;border:1px solid #dfcca6;border-radius:4px;"></textarea></div>'+
        '</div>'+
        
        '<hr style="border:0;border-top:1px solid #dfcca6;margin:8px 0;">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;"><span>Оставлять у донора (%):</span><input type="number" id="dKP" value="30" min="0" max="95" style="width:45px;padding:2px;text-align:center;border:1px solid #dfcca6;border-radius:3px;"></div>'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:11px;"><span>Лимит получателя (%):</span><input type="number" id="tMP" value="80" min="10" max="100" style="width:45px;padding:2px;text-align:center;border:1px solid #dfcca6;border-radius:3px;"></div>'+
        '<button id="pBtn" style="width:100%;padding:7px;background:#804000;color:#fff;border:none;border-radius:4px;font-weight:bold;cursor:pointer;font-size:11px;margin-bottom:8px;">Рассчитать баланс</button>'+
        '<div id="pSt" style="font-size:11px;color:#333;background:#fff;padding:6px;border:1px solid #dfcca6;min-height:60px;max-height:220px;overflow-y:auto;">Готов к работе</div>'+
        '<button onclick="$(\'#indepBalancerPanel\').hide();" style="margin-top:8px;float:right;cursor:pointer;font-size:10px;background:#ddd;border:1px solid #999;padding:2px 6px;border-radius:3px;">Скрыть</button>'
    );
    $('body').append(p);

    $('#sendMode').change(function(){
        if($(this).val()==='groups'){
            $('#blockGroups').show();$('#blockCoords').hide();
        }else{
            $('#blockGroups').hide();$('#blockCoords').show();
        }
    });

    let num=(s)=>parseInt(s.replace(/\./g,'').replace(/\s/g,''),10)||0;

    window.iSend=function(btn,srcId,tgtId,w,s,i,coordStr){
        btn.disabled=true;
        btn.innerText="⏳...";
        let payload={wood:w,stone:s,iron:i};
        if(coordStr){
            let cp=coordStr.split('|');
            if(cp.length===2){payload.x=cp[0];payload.y=cp[1];}
        }else{
            payload.target_id=tgtId;
        }
        TribalWars.post("market",{ajaxaction:"map_send",village:srcId},payload,function(res){
            btn.innerText="✓";
            btn.style.background="#28a745";
        },function(){
            btn.innerText="❌";
            btn.style.background="#dc3545";
            btn.disabled=false;
        });
    };

    function parseCoordsFromText(text) {
        let results = [];
        let cleanText = text.replace(/\[\/?coord\]/g, '').replace(/\[\/?b\]/g, '');
        let regex = /(\d{3}\|\d{3})/g;
        let match;
        while ((match = regex.exec(cleanText)) !== null) {
            let coord = match[1];
            let parts = coord.split('|');
            if (!results.some(r => r.coord === coord)) {
                results.push({
                    coord: coord,
                    x: parseInt(parts[0], 10),
                    y: parseInt(parts[1], 10)
                });
            }
        }
        return results;
    }

    function parseV($page,arr){
        let w=$page.find(".res.wood, .warn_90.wood, .warn.wood");
        let st=$page.find(".res.stone, .warn_90.stone, .warn.stone");
        let ir=$page.find(".res.iron, .warn_90.iron, .warn.iron");
        let v=$page.find(".quickedit-vn");
        for(let idx=0;idx<v.length;idx++){
            let name=v[idx].innerText.trim();
            let cMatch=name.match(/\d{3}\|\d{3}/);
            let coord=cMatch?cMatch[0]:"";
            let vm=(v[idx].children[0]&&v[idx].children[0].children[0])?(v[idx].children[0].children[0].href.match(/village=(\d+)/)||[])[1]:"";
            let td=ir[idx]?ir[idx].parentElement.nextElementSibling:null;
            let mTxt=td?td.nextElementSibling.innerText:"0/0";
            let mM=mTxt.match(/(\d*)\/(\d*)/);
            let wh=td?num(td.innerHTML):400000;
            arr.push({
                id:vm,
                name:name,
                coord:coord,
                x: coord ? parseInt(coord.split('|')[0],10) : 0,
                y: coord ? parseInt(coord.split('|')[1],10) : 0,
                wood:num(w[idx].textContent),
                stone:num(st[idx].textContent),
                iron:num(ir[idx].textContent),
                merchants:mM?parseInt(mM[1],10):0,
                capacity:wh
            });
        }
    }

    $('#pBtn').click(function(){
        let mode=$('#sendMode').val();
        let st=$('#pSt');
        st.html("Загрузка данных...");
        let kP=parseFloat($('#dKP').val())/100;
        let mP=parseFloat($('#tMP').val())/100;

        if(mode==='groups'){
            let tG=$('#tGS').val();
            let dG=$('#dGS').val();
            let sfx=game_data.player.sitter>0?'game.php?t='+game_data.player.id+'&':'game.php?';
            let uT=sfx+'screen=overview_villages&mode=prod&group='+tG+'&page=-1&';
            let uD=sfx+'screen=overview_villages&mode=prod&group='+dG+'&page=-1&';
            
            $.get(uT,function(tPage){
                let targets=[];
                parseV($(tPage),targets);
                if(!targets.length){st.html("<b>Ошибка:</b> Нет получателей!");return;}
                $.get(uD,function(dPage){
                    let donors=[];
                    parseV($(dPage),donors);
                    if(!donors.length){st.html("<b>Ошибка:</b> Нет доноров!");return;}
                    
                    targets.forEach(t=>{t.virtW=t.wood;t.virtS=t.stone;t.virtI=t.iron;});
                    let out="";
                    let count=0;
                    
                    donors.forEach(d=>{
                        let kAmt=Math.floor(d.capacity*kP);
                        let avW=d.wood-kAmt,avS=d.stone-kAmt,avI=d.iron-kAmt;
                        if(avW<=200&&avS<=200&&avI<=200)return;
                        targets.forEach(t=>{
                            if(d.merchants<=0||d.id===t.id)return;
                            let maxCapPerRes=Math.floor(t.capacity*mP);
                            let needW=Math.max(0,maxCapPerRes-t.virtW);
                            let needS=Math.max(0,maxCapPerRes-t.virtS);
                            let needI=Math.max(0,maxCapPerRes-t.virtI);
                            if(needW<=200&&needS<=200&&needI<=200)return;
                            let sendW=Math.min(avW,needW);
                            let sendS=Math.min(avS,needS);
                            let sendI=Math.min(avI,needI);
                            let totalSend=sendW+sendS+sendI;
                            let maxM=d.merchants*1000;
                            if(totalSend>maxM){
                                let ratio=maxM/totalSend;
                                sendW=Math.floor(sendW*ratio);
                                sendS=Math.floor(sendS*ratio);
                                sendI=Math.floor(sendI*ratio);
                                totalSend=sendW+sendS+sendI;
                            }
                            if(sendW<200&&sendS<200&&sendI<200)return;
                            avW-=sendW;avS-=sendS;avI-=sendI;
                            d.merchants-=Math.ceil(totalSend/1000);
                            t.virtW+=sendW;t.virtS+=sendS;t.virtI+=sendI;
                            
                            out+='<div style="border-bottom:1px solid #dfcca6;padding:4px 0;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;line-height:1.2;"><b>'+d.name+'</b> &rarr; '+t.name+'<br>Д:<b>'+sendW+'</b> Г:<b>'+sendS+'</b> Ж:<b>'+sendI+'</b></span><button onclick="iSend(this, \''+d.id+'\', \''+t.id+'\', '+sendW+', '+sendS+', '+sendI+')" style="background:#28a745;color:#fff;border:none;padding:3px 6px;cursor:pointer;border-radius:3px;font-size:9px;font-weight:bold;flex-shrink:0;margin-left:4px;">Отправить</button></div>';
                            count++;
                        });
                    });
                    st.html(out?'<b>План (всего: '+count+'):</b><br>'+out:"Нет избытков.");
                }).fail(()=>st.html("<b>Ошибка загрузки доноров</b>"));
            }).fail(()=>st.html("<b>Ошибка загрузки получателей</b>"));

        }else{
            let dG=$('#dGS_coords').val();
            let rawTargetsText=$('#targetCoordInput').val();
            let targets = parseCoordsFromText(rawTargetsText);

            if(!targets.length){
                st.html("<b>Ошибка:</b> Не найдены валидные координаты целей в поле ввода!");
                return;
            }

            let sfx=game_data.player.sitter>0?'game.php?t='+game_data.player.id+'&':'game.php?';
            let uD=sfx+'screen=overview_villages&mode=prod&group='+dG+'&page=-1&';

            $.get(uD,function(dPage){
                let donors=[];
                parseV($(dPage),donors);
                if(!donors.length){st.html("<b>Ошибка:</b> Нет доноров!");return;}

                donors.forEach(d => {
                    let kAmt = Math.floor(d.capacity * kP);
                    d.virtW = Math.max(0, d.wood - kAmt);
                    d.virtS = Math.max(0, d.stone - kAmt);
                    d.virtI = Math.max(0, d.iron - kAmt);
                });

                // Инициализируем виртуальный склад для введенных координат целей (принимаем стандартную вместимость склада 400000 или берем по умолчанию)
                targets.forEach(t => {
                    t.virtW = 0;
                    t.virtS = 0;
                    t.virtI = 0;
                    t.capacity = 400000; 
                });

                let allPairs = [];
                donors.forEach(d => {
                    targets.forEach(t => {
                        let dist = Math.sqrt(Math.pow(d.x - t.x, 2) + Math.pow(d.y - t.y, 2));
                        allPairs.push({ donor: d, target: t, dist: dist });
                    });
                });

                allPairs.sort((a, b) => a.dist - b.dist);

                let out = "";
                let count = 0;

                allPairs.forEach(pair => {
                    let d = pair.donor;
                    let t = pair.target;

                    if (d.merchants <= 0) return;
                    let avW = d.virtW;
                    let avS = d.virtS;
                    let avI = d.virtI;

                    if (avW <= 200 && avS <= 200 && avI <= 200) return;

                    let maxCapPerRes = Math.floor(t.capacity * mP);
                    let needW = Math.max(0, maxCapPerRes - t.virtW);
                    let needS = Math.max(0, maxCapPerRes - t.virtS);
                    let needI = Math.max(0, maxCapPerRes - t.virtI);

                    if (needW <= 200 && needS <= 200 && needI <= 200) return;

                    let sendW = Math.min(avW, needW);
                    let sendS = Math.min(avS, needS);
                    let sendI = Math.min(avI, needI);
                    let totalSend = sendW + sendS + sendI;

                    let maxM = d.merchants * 1000;
                    if (totalSend > maxM) {
                        let ratio = maxM / totalSend;
                        sendW = Math.floor(sendW * ratio);
                        sendS = Math.floor(sendS * ratio);
                        sendI = Math.floor(sendI * ratio);
                        totalSend = sendW + sendS + sendI;
                    }

                    if (sendW < 200 && sendS < 200 && sendI < 200) return;

                    d.virtW -= sendW;
                    d.virtS -= sendS;
                    d.virtI -= sendI;
                    d.merchants -= Math.ceil(totalSend / 1000);

                    t.virtW += sendW;
                    t.virtS += sendS;
                    t.virtI += sendI;

                    out += '<div style="border-bottom:1px solid #dfcca6;padding:4px 0;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;line-height:1.2;"><b>' + d.name + '</b> &rarr; [' + t.coord + ']<br>Д:<b>' + sendW + '</b> Г:<b>' + sendS + '</b> Ж:<b>' + sendI + '</b></span><button onclick="iSend(this, \'' + d.id + '\', \'\', ' + sendW + ', ' + sendS + ', ' + sendI + ', \'' + t.coord + '\')" style="background:#28a745;color:#fff;border:none;padding:3px 6px;cursor:pointer;border-radius:3px;font-size:9px;font-weight:bold;flex-shrink:0;margin-left:4px;">Отправить</button></div>';
                    count++;
                });

                st.html(out ? '<b>План по списку координат (всего отправлений: ' + count + '):</b><br>' + out : "Нет избытков для указанных целей или лимит склада уже достигнут.");
            }).fail(()=>st.html("<b>Ошибка загрузки доноров</b>"));
        }
    });
})();
